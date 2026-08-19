import { registerPlugin, Capacitor } from '@capacitor/core';

/**
 * Universal File Export and Sharing Service
 * Supports Web Desktop, PWA, and Mobile APK (Capacitor / Android Native Bridge)
 */

export interface ExportFileOptions {
  filename: string;
  blob: Blob;
  title?: string;
  text?: string;
  saveToDownloads?: boolean;
  triggerShare?: boolean;
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
}

// Register native Android/iOS Capacitor Plugin
const NativeFileExport = registerPlugin<NativeFileExportPluginInterface>('NativeFileExport');

/**
 * Helper to convert Blob to Base64 data string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result;
      if (typeof res === 'string') {
        resolve(res);
      } else {
        reject(new Error('Failed to convert Blob to Base64 string'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
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
 * Universal file saver and sharer that works across Desktop Browsers, PWAs, and Native Mobile APKs.
 * 1. On Android APK (Capacitor): writes directly to device Downloads / Documents folder via MediaStore & opens native Share Sheet.
 * 2. On Web Mobile / PWA: Uses Web Share API Level 2 (with File support).
 * 3. On Desktop Browser: Uses standard DOM anchor download.
 */
export async function saveOrShareFile(options: ExportFileOptions): Promise<boolean> {
  const { 
    filename, 
    blob, 
    title, 
    text,
    saveToDownloads = true,
    triggerShare = true
  } = options;

  // 1. Native Mobile APK Execution (Capacitor Android/iOS)
  if (isNativeMobilePlatform()) {
    try {
      const mimeType = blob.type || 'application/octet-stream';
      const base64Data = await blobToBase64(blob);

      const result = await NativeFileExport.exportFile({
        filename,
        data: base64Data,
        mimeType,
        title: title || filename,
        saveToDownloads,
        triggerShare
      });

      if (result && result.success) {
        console.log('[NativeFileExport] Successfully exported to device:', result);
        return true;
      }
    } catch (nativeErr: any) {
      console.warn('[NativeFileExport] Native export encountered error, attempting Web fallbacks:', nativeErr);
    }
  }

  // 2. Web Share API Level 2 (with Files) for Mobile Browser / PWA
  if (typeof navigator !== 'undefined' && typeof File !== 'undefined') {
    try {
      const mimeType = blob.type || 'application/octet-stream';
      const file = new File([blob], filename, { type: mimeType, lastModified: Date.now() });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || filename,
          text: text || `ConstructOS Export: ${filename}`,
        });
        return true;
      }
    } catch (shareErr: any) {
      // User cancelled share sheet (AbortError is normal user dismissal)
      if (shareErr?.name === 'AbortError') {
        return true;
      }
      console.warn('Web Share API failed or unsupported, falling back to anchor download:', shareErr);
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
    return true;
  } catch (err) {
    console.error('File export download failed:', err);
    return false;
  }
}

/**
 * Export JSON data snapshot
 */
export async function exportJsonFile(data: any, filename?: string, title?: string): Promise<boolean> {
  const name = filename || `ConstructOS-backup-${new Date().toISOString().split('T')[0]}.json`;
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  return saveOrShareFile({
    filename: name,
    blob,
    title: title || 'ConstructOS JSON Backup',
    text: 'ConstructOS Offline Database Backup Snapshot'
  });
}

/**
 * Export CSV content
 */
export async function exportCsvFile(csvContent: string, filename: string, title?: string): Promise<boolean> {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  return saveOrShareFile({
    filename,
    blob,
    title: title || filename,
    text: `ConstructOS CSV Report: ${filename}`
  });
}

/**
 * Export jsPDF Document
 */
export async function exportPdfDoc(doc: any, filename: string, title?: string): Promise<boolean> {
  try {
    const blob = doc.output('blob');
    return await saveOrShareFile({
      filename,
      blob: new Blob([blob], { type: 'application/pdf' }),
      title: title || filename,
      text: `ConstructOS PDF Document: ${filename}`
    });
  } catch (e) {
    // If output('blob') fails, fallback to doc.save
    if (typeof doc.save === 'function') {
      doc.save(filename);
      return true;
    }
    throw e;
  }
}
