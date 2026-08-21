package com.constructos.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;

@CapacitorPlugin(name = "NativeFileExport")
public class NativeFileExportPlugin extends Plugin {

    private static final String TAG = "NativeFileExport";

    // Internal state tracking for chunked stream exports (supports 100MB+ files with low RAM)
    private static class ExportSession {
        String sessionId;
        String filename;
        String mimeType;
        long totalBytes;
        boolean saveToDownloads;
        File cacheFile;
        FileOutputStream cacheOut;
        Uri mediaStoreUri;
        OutputStream mediaStoreOut;
        File legacyDestFile;
        FileOutputStream legacyDestOut;
        long bytesWritten;
    }

    private final ConcurrentHashMap<String, ExportSession> activeSessions = new ConcurrentHashMap<>();

    /**
     * Start a chunked streaming export session.
     * Creates output streams on disk/MediaStore so data can be streamed in small 1MB-2MB chunks
     * without causing WebView OOM crashes or Binder transaction limits.
     */
    @PluginMethod
    public void startExportSession(PluginCall call) {
        String sessionId = call.getString("sessionId", "session_" + System.currentTimeMillis());
        String filename = call.getString("filename", "ConstructOS_export_" + System.currentTimeMillis() + ".dat");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        long totalBytes = call.getLong("totalBytes", 0L);
        boolean saveToDownloads = call.getBoolean("saveToDownloads", true);

        Context context = getContext();

        try {
            ExportSession session = new ExportSession();
            session.sessionId = sessionId;
            session.filename = filename;
            session.mimeType = mimeType;
            session.totalBytes = totalBytes;
            session.saveToDownloads = saveToDownloads;
            session.bytesWritten = 0;

            // 1. Prepare cache file output stream
            File cacheDir = new File(context.getCacheDir(), "exports");
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }
            session.cacheFile = new File(cacheDir, filename);
            session.cacheOut = new FileOutputStream(session.cacheFile);

            // 2. Prepare persistent Downloads destination stream
            if (saveToDownloads) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver resolver = context.getContentResolver();
                    ContentValues contentValues = new ContentValues();
                    contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    contentValues.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                    contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/ConstructOS");
                    contentValues.put(MediaStore.MediaColumns.IS_PENDING, 1);

                    Uri collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                    session.mediaStoreUri = resolver.insert(collection, contentValues);

                    if (session.mediaStoreUri != null) {
                        session.mediaStoreOut = resolver.openOutputStream(session.mediaStoreUri);
                    }
                } else {
                    File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (downloadsDir != null) {
                        File targetDir = new File(downloadsDir, "ConstructOS");
                        if (!targetDir.exists()) {
                            targetDir.mkdirs();
                        }
                        session.legacyDestFile = new File(targetDir, filename);
                        session.legacyDestOut = new FileOutputStream(session.legacyDestFile);
                    }
                }
            }

            activeSessions.put(sessionId, session);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("sessionId", sessionId);
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Failed to start export session: " + e.getMessage(), e);
            call.reject("Failed to initialize export stream: " + e.getMessage(), e);
        }
    }

    /**
     * Append a chunk of Base64-encoded bytes to an active streaming session.
     * Keeps JVM memory overhead tiny (only the size of the current chunk, e.g. 1.5MB).
     */
    @PluginMethod
    public void appendExportChunk(PluginCall call) {
        String sessionId = call.getString("sessionId");
        String chunkData = call.getString("chunkData");

        if (sessionId == null || !activeSessions.containsKey(sessionId)) {
            call.reject("Invalid or expired export session ID: " + sessionId);
            return;
        }

        if (chunkData == null || chunkData.isEmpty()) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("bytesWritten", 0);
            call.resolve(ret);
            return;
        }

        ExportSession session = activeSessions.get(sessionId);

        try {
            if (chunkData.contains(",")) {
                chunkData = chunkData.substring(chunkData.indexOf(",") + 1);
            }

            byte[] chunkBytes = Base64.decode(chunkData, Base64.DEFAULT);

            // Write to cache file
            if (session.cacheOut != null) {
                session.cacheOut.write(chunkBytes);
            }

            // Write to MediaStore / Public Downloads stream
            if (session.mediaStoreOut != null) {
                session.mediaStoreOut.write(chunkBytes);
            } else if (session.legacyDestOut != null) {
                session.legacyDestOut.write(chunkBytes);
            }

            session.bytesWritten += chunkBytes.length;

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("bytesWritten", chunkBytes.length);
            ret.put("totalBytesWritten", session.bytesWritten);
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Error writing chunk in session " + sessionId + ": " + e.getMessage(), e);
            call.reject("Error streaming chunk to file: " + e.getMessage(), e);
        }
    }

    /**
     * Finalize and close the streaming export session.
     * Releases file locks, clears IS_PENDING on MediaStore, and triggers the Android share sheet.
     */
    @PluginMethod
    public void finalizeExportSession(PluginCall call) {
        String sessionId = call.getString("sessionId");
        String title = call.getString("title", "ConstructOS Export");
        String mimeType = call.getString("mimeType");
        boolean saveToDownloads = call.getBoolean("saveToDownloads", true);
        boolean triggerShare = call.getBoolean("triggerShare", true);

        if (sessionId == null || !activeSessions.containsKey(sessionId)) {
            call.reject("Invalid or expired export session ID: " + sessionId);
            return;
        }

        ExportSession session = activeSessions.remove(sessionId);
        Context context = getContext();

        try {
            // 1. Flush & Close Cache stream
            if (session.cacheOut != null) {
                session.cacheOut.flush();
                session.cacheOut.close();
                session.cacheOut = null;
            }

            // 2. Flush & Close MediaStore stream & clear IS_PENDING
            if (session.mediaStoreOut != null) {
                session.mediaStoreOut.flush();
                session.mediaStoreOut.close();
                session.mediaStoreOut = null;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && session.mediaStoreUri != null) {
                    ContentResolver resolver = context.getContentResolver();
                    ContentValues contentValues = new ContentValues();
                    contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    resolver.update(session.mediaStoreUri, contentValues, null, null);
                }
            } else if (session.legacyDestOut != null) {
                session.legacyDestOut.flush();
                session.legacyDestOut.close();
                session.legacyDestOut = null;
            }

            String effectiveMimeType = (mimeType != null && !mimeType.isEmpty()) ? mimeType : session.mimeType;

            // 3. Launch native Android Share Intent if requested
            if (triggerShare && session.cacheFile != null && session.cacheFile.exists()) {
                Uri contentUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    session.cacheFile
                );

                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType(effectiveMimeType);
                shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
                shareIntent.putExtra(Intent.EXTRA_TEXT, title + ": " + session.filename);
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                Intent chooser = Intent.createChooser(shareIntent, "Save or Share: " + session.filename);
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(chooser);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("filename", session.filename);
            ret.put("path", session.cacheFile != null ? session.cacheFile.getAbsolutePath() : null);
            ret.put("uri", session.mediaStoreUri != null ? session.mediaStoreUri.toString() : null);
            ret.put("totalBytes", session.bytesWritten);
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Error finalizing export session " + sessionId + ": " + e.getMessage(), e);
            call.reject("Error finalizing export: " + e.getMessage(), e);
        } finally {
            closeSessionStreams(session);
        }
    }

    /**
     * Cancel and clean up an active export session.
     */
    @PluginMethod
    public void cancelExportSession(PluginCall call) {
        String sessionId = call.getString("sessionId");
        if (sessionId != null && activeSessions.containsKey(sessionId)) {
            ExportSession session = activeSessions.remove(sessionId);
            closeSessionStreams(session);
            if (session.cacheFile != null && session.cacheFile.exists()) {
                session.cacheFile.delete();
            }
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    private void closeSessionStreams(ExportSession session) {
        if (session == null) return;
        try {
            if (session.cacheOut != null) {
                session.cacheOut.close();
                session.cacheOut = null;
            }
        } catch (Exception ignored) {}
        try {
            if (session.mediaStoreOut != null) {
                session.mediaStoreOut.close();
                session.mediaStoreOut = null;
            }
        } catch (Exception ignored) {}
        try {
            if (session.legacyDestOut != null) {
                session.legacyDestOut.close();
                session.legacyDestOut = null;
            }
        } catch (Exception ignored) {}
    }

    /**
     * Single-shot export for small files (< 2MB) maintained for full backwards compatibility.
     */
    @PluginMethod
    public void exportFile(PluginCall call) {
        String filename = call.getString("filename", "ConstructOS_export_" + System.currentTimeMillis() + ".dat");
        String base64Data = call.getString("data");
        String textContent = call.getString("text");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String title = call.getString("title", "ConstructOS Export");
        boolean saveToDownloads = call.getBoolean("saveToDownloads", true);
        boolean triggerShare = call.getBoolean("triggerShare", true);

        byte[] fileBytes = null;
        if (base64Data != null && !base64Data.isEmpty()) {
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }
            try {
                fileBytes = Base64.decode(base64Data, Base64.DEFAULT);
            } catch (Exception e) {
                call.reject("Failed to decode base64 file data: " + e.getMessage());
                return;
            }
        } else if (textContent != null) {
            fileBytes = textContent.getBytes(StandardCharsets.UTF_8);
        } else {
            call.reject("No data or text content provided for export.");
            return;
        }

        Context context = getContext();
        Uri savedUri = null;
        String savedPath = null;
        File cacheFile = null;

        try {
            // 1. Write file to internal cache directory for sharing via FileProvider
            File cacheDir = new File(context.getCacheDir(), "exports");
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }
            cacheFile = new File(cacheDir, filename);
            try (FileOutputStream fos = new FileOutputStream(cacheFile)) {
                fos.write(fileBytes);
                fos.flush();
            }
            savedPath = cacheFile.getAbsolutePath();

            // 2. Persistently save to device's public Downloads directory
            if (saveToDownloads) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver resolver = context.getContentResolver();
                    ContentValues contentValues = new ContentValues();
                    contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    contentValues.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                    contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/ConstructOS");
                    contentValues.put(MediaStore.MediaColumns.IS_PENDING, 1);

                    Uri collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                    savedUri = resolver.insert(collection, contentValues);

                    if (savedUri != null) {
                        try (OutputStream out = resolver.openOutputStream(savedUri)) {
                            if (out != null) {
                                out.write(fileBytes);
                                out.flush();
                            }
                        }
                        contentValues.clear();
                        contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
                        resolver.update(savedUri, contentValues, null, null);
                    }
                } else {
                    File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (downloadsDir != null) {
                        File targetDir = new File(downloadsDir, "ConstructOS");
                        if (!targetDir.exists()) {
                            targetDir.mkdirs();
                        }
                        File destFile = new File(targetDir, filename);
                        try (FileOutputStream fos = new FileOutputStream(destFile)) {
                            fos.write(fileBytes);
                            fos.flush();
                        }
                        savedPath = destFile.getAbsolutePath();
                    }
                }
            }

            // 3. Launch native Android Share Intent so user can save to Files, Drive, WhatsApp, etc.
            if (triggerShare && cacheFile != null && cacheFile.exists()) {
                Uri contentUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    cacheFile
                );

                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType(mimeType);
                shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
                shareIntent.putExtra(Intent.EXTRA_TEXT, title + ": " + filename);
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                Intent chooser = Intent.createChooser(shareIntent, "Save or Share: " + filename);
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(chooser);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("filename", filename);
            ret.put("path", savedPath);
            ret.put("uri", savedUri != null ? savedUri.toString() : null);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Error exporting file to device: " + e.getMessage(), e);
        }
    }
}
