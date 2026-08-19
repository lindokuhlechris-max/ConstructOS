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

@CapacitorPlugin(name = "NativeFileExport")
public class NativeFileExportPlugin extends Plugin {

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
