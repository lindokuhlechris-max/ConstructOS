import { registerPlugin, Capacitor } from '@capacitor/core';

/**
 * Universal File Export and Sharing Service
 * Supports Web Desktop, PWA, and Mobile APK (Capacitor / Android Native Bridge)
 * Engineered for Large-Scale Database Backups (100MB+ without Out-Of-Memory or Binder crashes).
 */

export interface ExportFileOptions {
  filename: string;
  blob: Blob;
  title?: string;
  text?: string;
  saveToDownloads?: boolean;
  triggerShare?: boolean;
  onProgress?: (progressPercent: number) => void;
}

interface NativeFileExportPluginInterface {
  exportFile(options: {
    filename: string;
    data?: string;
    text?: string;
    mimeType?: string;
    title?: string;
    saveToDownloads?: boolean;
    triggerShare?: boolean;
  }): Promise<{ success: boolean; filename: string; path?: string; uri?: string }>;

  startExportSession(options: {
    sessionId: string;
    filename: string;
    mimeType?: string;
    totalBytes?: number;
    saveToDownloads?: boolean;
  }): Promise<{ success: boolean; sessionId: string }>;

  appendExportChunk(options: {
    sessionId: string;
    chunkData: string;
  }): Promise<{ success: boolean; bytesWritten: number; totalBytesWritten?: number }>;

  finalizeExportSession(options: {
    sessionId: string;
    title?: string;
    mimeType?: string;
    saveToDownloads?: boolean;
    triggerShare?: boolean;
  }): Promise<{ success: boolean; filename: string; path?: string; uri?: string; totalBytes?: number }>;

  cancelExportSession(options: {
    sessionId: string;
  }): Promise<{ success: boolean }>;
}

// Register native Android/iOS Capacitor Plugin
const NativeFileExport = registerPlugin<NativeFileExportPluginInterface>('NativeFileExport');

/**
 * Read small slice (< 2MB) to pure Base64 string
 */
function sliceToBase64(blobSlice: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result;
      if (typeof res === 'string') {
        const commaIdx = res.indexOf(',');
        resolve(commaIdx >= 0 ? res.substring(commaIdx + 1) : res);
      } else {
        reject(new Error('Failed to convert Blob chunk to Base64'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error on chunk slice'));
    reader.readAsDataURL(blobSlice);
  });
}

/**
 * Detect if running in native Capacitor shell (Android APK / iOS)
 */
export function isNativeMobilePlatform(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (Capacitor && typeof Capacitor.isNativePlatform === 'function') {
      return Capacitor.isNativePlatform();
    }
    const winCap = (window as any).Capacitor;
    if (winCap && typeof winCap.isNativePlatform === 'function') {
      return winCap.isNativePlatform();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Stream large Blob in 1.5MB chunks across native bridge to prevent OOM on 100MB+ files
 */
async function streamBlobToNative(
  blob: Blob,
  filename: string,
  mimeType: string,
  title?: string,
  saveToDownloads = true,
  triggerShare = true,
  onProgress?: (percent: number) => void
): Promise<boolean> {
  const sessionId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5 MB per chunk
  const totalSize = blob.size;

  try {
    // 1. Initialize native session
    await NativeFileExport.startExportSession({
      sessionId,
      filename,
      mimeType,
      totalBytes: totalSize,
      saveToDownloads
    });

    let offset = 0;
    while (offset < totalSize) {
      const end = Math.min(offset + CHUNK_SIZE, totalSize);
      const slice = blob.slice(offset, end);
      const chunkBase64 = await sliceToBase64(slice);

      await NativeFileExport.appendExportChunk({
        sessionId,
        chunkData: chunkBase64
      });

      offset = end;
      if (onProgress && totalSize > 0) {
        onProgress(Math.min(99, Math.round((offset / totalSize) * 100)));
      }

      // Yield event loop to ensure UI remains smooth during multi-part streaming
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    // 2. Finalize and trigger native share/file release
    const result = await NativeFileExport.finalizeExportSession({
      sessionId,
      title: title || filename,
      mimeType,
      saveToDownloads,
      triggerShare
    });

    if (onProgress) onProgress(100);
    return result?.success === true;

  } catch (err: any) {
    console.warn('[NativeFileExport] Streaming error, attempting cancel:', err);
    try {
      await NativeFileExport.cancelExportSession({ sessionId });
    } catch (_) {}
    throw err;
  }
}

/**
 * Universal file saver and sharer that works across Desktop Browsers, PWAs, and Native Mobile APKs.
 * 1. On Android APK (Capacitor): Streams in 1.5MB chunks directly to MediaStore / Downloads, bypassing 1MB Binder limits and avoiding V8 OOM.
 * 2. On Web Mobile / PWA: Uses Web Share API Level 2 (with File support).
 * 3. On Desktop Browser: Uses standard DOM anchor download with object URL.
 */
export async function saveOrShareFile(options: ExportFileOptions): Promise<boolean> {
  const { 
    filename, 
    blob, 
    title, 
    text,
    saveToDownloads = true,
    triggerShare = true,
    onProgress
  } = options;

  const mimeType = blob.type || 'application/octet-stream';

  // 1. Native Mobile APK Execution (Capacitor Android/iOS)
  if (isNativeMobilePlatform()) {
    try {
      // For any file >= 1MB, or by default on native, use streaming chunks to guarantee stability up to gigabytes
      if (typeof NativeFileExport.startExportSession === 'function' && blob.size > 1024 * 1024) {
        return await streamBlobToNative(
          blob, 
          filename, 
          mimeType, 
          title, 
          saveToDownloads, 
          triggerShare, 
          onProgress
        );
      }

      // Single-shot fallback for tiny files (< 1MB)
      const base64Data = await sliceToBase64(blob);
      const result = await NativeFileExport.exportFile({
        filename,
        data: base64Data,
        mimeType,
        title: title || filename,
        saveToDownloads,
        triggerShare
      });

      if (result && result.success) {
        if (onProgress) onProgress(100);
        return true;
      }
    } catch (nativeErr: any) {
      console.warn('[NativeFileExport] Native export failed, falling back to Web APIs:', nativeErr);
    }
  }

  // 2. Web Share API Level 2 (with Files) for Mobile Browser / PWA (for files < 40MB where browser permits)
  if (typeof navigator !== 'undefined' && typeof File !== 'undefined' && blob.size < 40 * 1024 * 1024) {
    try {
      const file = new File([blob], filename, { type: mimeType, lastModified: Date.now() });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || filename,
          text: text || `ConstructOS Export: ${filename}`,
        });
        if (onProgress) onProgress(100);
        return true;
      }
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') {
        return true; // User dismissed share sheet normally
      }
      console.warn('Web Share API failed, falling back to DOM download:', shareErr);
    }
  }

  // 3. Standard Desktop Browser Anchor Download Fallback
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2000);
    if (onProgress) onProgress(100);
    return true;
  } catch (err) {
    console.error('File export download failed:', err);
    return false;
  }
}

/**
 * Export JSON data snapshot with memory safety
 */
export async function exportJsonFile(
  data: any, 
  filename?: string, 
  title?: string,
  onProgress?: (percent: number) => void
): Promise<boolean> {
  const name = filename || `ConstructOS-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  // Use compact JSON string to save 30% memory on large datasets
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  
  return saveOrShareFile({
    filename: name,
    blob,
    title: title || 'ConstructOS JSON Backup',
    text: 'ConstructOS Offline Database Backup Snapshot',
    onProgress
  });
}

/**
 * Export CSV content
 */
export async function exportCsvFile(
  csvContent: string, 
  filename: string, 
  title?: string,
  onProgress?: (percent: number) => void
): Promise<boolean> {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  return saveOrShareFile({
    filename,
    blob,
    title: title || filename,
    text: `ConstructOS CSV Report: ${filename}`,
    onProgress
  });
}
