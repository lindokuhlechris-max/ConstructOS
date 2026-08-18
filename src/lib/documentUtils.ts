export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function detectFileType(extension: string, mimeType?: string): 'pdf' | 'excel' | 'word' | 'cad' | 'image' | 'text' | 'archive' | 'other' {
  const ext = extension.toLowerCase();
  if (['pdf'].includes(ext) || mimeType?.includes('pdf')) return 'pdf';
  if (['xlsx', 'xls', 'csv'].includes(ext) || mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || mimeType?.includes('csv')) return 'excel';
  if (['doc', 'docx', 'rtf'].includes(ext) || mimeType?.includes('word') || mimeType?.includes('document')) return 'word';
  if (['dwg', 'dxf', 'ifc', 'rvt', 'nwd', 'skp'].includes(ext)) return 'cad';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext) || mimeType?.startsWith('image/')) return 'image';
  if (['txt', 'log', 'md', 'json', 'xml'].includes(ext) || mimeType?.startsWith('text/')) return 'text';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  return 'other';
}

export async function downloadDocumentFile(fileUrl?: string, fileName?: string, textContent?: string) {
  const { saveOrShareFile } = await import('./fileExportService');
  if (fileUrl) {
    try {
      if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
        const res = await fetch(fileUrl);
        const blob = await res.blob();
        await saveOrShareFile({
          filename: fileName || 'document',
          blob,
          title: fileName || 'Document Download'
        });
        return;
      }
    } catch (e) {
      console.warn('Direct fetch failed, using anchor fallback:', e);
    }
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // If we only have textContent or plain data
  const content = textContent || `Scedih Project Transmittal Document: ${fileName || 'Document'}\nGenerated at ${new Date().toISOString()}`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  await saveOrShareFile({
    filename: fileName || 'document.txt',
    blob,
    title: fileName || 'Document Download'
  });
}
