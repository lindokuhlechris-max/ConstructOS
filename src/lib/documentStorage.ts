/**
 * Robust High-Capacity Binary Document Storage System for ConstructOS
 * 
 * Supports files from 1 KB up to 100+ MB directly in IndexedDB without
 * converting to base64, keeping memory usage minimal and avoiding Firestore
 * or localStorage size quota limits.
 */

import { DocumentItem } from '../types';

const DB_NAME = 'constructos_documents_blob_store';
const DB_VERSION = 1;
const STORE_NAME = 'document_binaries';

interface StoredFileRecord {
  id: string;
  blob: Blob | File;
  fileName: string;
  mimeType: string;
  size: number;
  updatedAt: string;
}

let dbInstance: Promise<IDBDatabase> | null = null;

function getBlobDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('Failed to open document binary store in IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbInstance;
}

/**
 * Saves a binary File or Blob to IndexedDB.
 * Handles files up to 100MB+ smoothly and efficiently.
 */
export async function saveDocumentFile(
  docId: string,
  file: File | Blob,
  meta?: { fileName?: string; mimeType?: string; size?: number }
): Promise<void> {
  try {
    const db = await getBlobDB();
    const fileName = meta?.fileName || (file instanceof File ? file.name : `${docId}.bin`);
    const mimeType = meta?.mimeType || file.type || 'application/octet-stream';
    const size = meta?.size !== undefined ? meta.size : file.size;

    const record: StoredFileRecord = {
      id: docId,
      blob: file,
      fileName,
      mimeType,
      size,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => {
        console.error(`Error saving document binary for ID ${docId}:`, req.error);
        reject(req.error);
      };
    });
  } catch (err) {
    console.error('Failed to persist document binary file:', err);
    throw err;
  }
}

/**
 * Retrieves the stored binary file record from IndexedDB.
 */
export async function getDocumentFile(docId: string): Promise<StoredFileRecord | null> {
  try {
    const db = await getBlobDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(docId);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => {
        console.error(`Error retrieving document binary for ID ${docId}:`, req.error);
        reject(req.error);
      };
    });
  } catch (err) {
    console.error('Failed to fetch document binary file:', err);
    return null;
  }
}

/**
 * Generates an Object URL from the stored Blob in IndexedDB.
 * Call URL.revokeObjectURL() when done to free memory.
 */
export async function getDocumentBlobUrl(docId: string): Promise<string | null> {
  try {
    const record = await getDocumentFile(docId);
    if (!record || !record.blob) return null;
    return URL.createObjectURL(record.blob);
  } catch (err) {
    console.error(`Failed to create Object URL for doc ${docId}:`, err);
    return null;
  }
}

/**
 * Checks whether a document binary exists in IndexedDB.
 */
export async function hasDocumentFile(docId: string): Promise<boolean> {
  try {
    const db = await getBlobDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(docId);
      req.onsuccess = () => resolve((req.result || 0) > 0);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Deletes a document binary file from IndexedDB.
 */
export async function deleteDocumentFile(docId: string): Promise<void> {
  try {
    const db = await getBlobDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(docId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Could not delete binary for document ${docId}:`, err);
  }
}

/**
 * Universal Download Handler for any document size (small or large up to 100MB+).
 */
export async function downloadDocument(doc: DocumentItem): Promise<void> {
  try {
    // 1. First check IndexedDB for stored binary
    const stored = await getDocumentFile(doc.id);
    if (stored && stored.blob) {
      const url = URL.createObjectURL(stored.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = stored.fileName || doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }

    // 2. If doc has a valid external or small URL
    if (doc.fileUrl && !doc.fileUrl.startsWith('data:image/svg')) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 3. Fallback to clean engineering transmittal text file
    const content = `=== SCEDIH PROJECT TRANSMITTAL ===\r\n` +
      `Document ID: ${doc.id}\r\n` +
      `Project ID: ${doc.projectId}\r\n` +
      `Title: ${doc.title}\r\n` +
      `File Name: ${doc.fileName}\r\n` +
      `Category: ${doc.category}\r\n` +
      `File Size: ${doc.fileSizeFormatted || `${doc.fileSize} Bytes`}\r\n` +
      `Version: ${doc.version}\r\n` +
      `Status: ${doc.status}\r\n` +
      `Assigned Activity: ${doc.linkedActivityName || 'None'}\r\n` +
      `Uploaded By: ${doc.uploadedBy}\r\n` +
      `Uploaded At: ${doc.uploadedAt}\r\n` +
      `Last Modified: ${doc.lastModified || doc.uploadedAt}\r\n` +
      `Confidential: ${doc.confidential ? 'YES' : 'NO'}\r\n` +
      `Tags: ${(doc.tags || []).join(', ')}\r\n\r\n` +
      `Scope & Specifications Description:\r\n` +
      `${doc.description || 'No description provided.'}\r\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.fileName.endsWith('.txt') ? doc.fileName : `${doc.fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Error downloading document:', err);
  }
}

/**
 * Sanitizes a DocumentItem object by stripping any massive inline data URLs
 * to ensure that AppContext state, localStorage, and Firestore payloads
 * never exceed size limits.
 */
export function sanitizeDocumentMetadata(doc: DocumentItem): DocumentItem {
  const sanitized = { ...doc };
  if (sanitized.fileUrl && sanitized.fileUrl.startsWith('data:') && sanitized.fileUrl.length > 2048) {
    // Strip heavy base64 strings; binary is preserved in IndexedDB
    delete sanitized.fileUrl;
  }
  return sanitized;
}

/**
 * Result structure for safe chunked document text reading.
 */
export interface DocumentTextChunkResult {
  text: string;
  loadedBytes: number;
  totalBytes: number;
  hasMore: boolean;
  isFallback: boolean;
}

/**
 * Safely reads a slice of a document's binary blob as UTF-8 text.
 * Prevents main-thread locks and DOM out-of-memory crashes on massive files (e.g. 50-100MB).
 *
 * @param docId The ID of the document stored in IndexedDB.
 * @param maxBytes Maximum number of bytes to read in this chunk (default 500 KB).
 * @param startByte The byte offset to start reading from.
 */
export async function readDocumentTextChunk(
  docId: string,
  maxBytes: number = 500 * 1024,
  startByte: number = 0
): Promise<DocumentTextChunkResult | null> {
  try {
    const record = await getDocumentFile(docId);
    if (!record || !record.blob) {
      return null;
    }

    const totalBytes = record.blob.size;
    const endByte = Math.min(startByte + maxBytes, totalBytes);
    const slice = record.blob.slice(startByte, endByte);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = (reader.result as string) || '';
        resolve({
          text,
          loadedBytes: endByte,
          totalBytes,
          hasMore: endByte < totalBytes,
          isFallback: false
        });
      };
      reader.onerror = () => {
        console.warn(`Could not read text slice for document ${docId}:`, reader.error);
        resolve(null);
      };
      reader.readAsText(slice, 'utf-8');
    });
  } catch (err) {
    console.error(`Failed to read document text chunk for ${docId}:`, err);
    return null;
  }
}

/**
 * Parses raw text or CSV strings safely into rows and cells.
 * Limits row count to avoid DOM thrashing on large spreadsheets.
 */
export function parseDelimitedTable(
  rawText: string,
  maxRows: number = 1000,
  delimiter?: string
): { headers: string[]; rows: string[][]; totalRowsCount: number; truncated: boolean } {
  if (!rawText || typeof rawText !== 'string') {
    return { headers: [], rows: [], totalRowsCount: 0, truncated: false };
  }

  // Detect delimiter if not specified
  let sep = delimiter;
  if (!sep) {
    const firstLine = rawText.split(/\r?\n/)[0] || '';
    if (firstLine.includes('\t')) sep = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) sep = ';';
    else sep = ',';
  }

  const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
  const totalRowsCount = lines.length;

  if (lines.length === 0) {
    return { headers: [], rows: [], totalRowsCount: 0, truncated: false };
  }

  // Simple, fast CSV line parser handling basic quoted values
  const parseLine = (line: string): string[] => {
    if (sep === '\t') return line.split('\t');
    
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === sep && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const dataLines = lines.slice(1, maxRows + 1);
  const rows = dataLines.map(line => parseLine(line));

  return {
    headers,
    rows,
    totalRowsCount: lines.length - 1,
    truncated: lines.length - 1 > maxRows
  };
}

export interface DocumentBinaryExportItem {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  base64: string;
}

/**
 * High-performance native Blob to Base64 converter (uses browser C++ encoder).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = (reader.result as string) || '';
      const commaIdx = dataUrl.indexOf(',');
      resolve(commaIdx >= 0 ? dataUrl.substring(commaIdx + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * High-performance native Base64 to Blob converter.
 */
export async function base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
  try {
    const dataUrl = `data:${mimeType || 'application/octet-stream'};base64,${base64}`;
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }
}

/**
 * Exports all binary files from IndexedDB blob store for full offline archive bundling.
 * Ultra-fast native execution (processes 50MB+ in < 1 second).
 */
export async function exportAllDocumentBinaries(): Promise<DocumentBinaryExportItem[]> {
  try {
    const db = await getBlobDB();
    const rawRecords: StoredFileRecord[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const items: DocumentBinaryExportItem[] = [];
    for (const record of rawRecords) {
      if (record && record.blob) {
        try {
          const base64 = await blobToBase64(record.blob);
          items.push({
            id: record.id,
            fileName: record.fileName,
            mimeType: record.mimeType,
            size: record.size || record.blob.size,
            base64
          });
        } catch (err) {
          console.warn(`Skipping binary export for document ${record.id}:`, err);
        }
      }
    }
    return items;
  } catch (err) {
    console.error('Failed to export document binaries:', err);
    return [];
  }
}

/**
 * Restores binary files back into the local IndexedDB blob store.
 */
export async function importDocumentBinaries(items: DocumentBinaryExportItem[]): Promise<number> {
  let importedCount = 0;
  for (const item of items) {
    if (!item.id || !item.base64) continue;
    try {
      const blob = await base64ToBlob(item.base64, item.mimeType);
      await saveDocumentFile(item.id, blob, {
        fileName: item.fileName,
        mimeType: item.mimeType,
        size: item.size
      });
      importedCount++;
    } catch (err) {
      console.warn(`Failed to import document binary for ${item.id}:`, err);
    }
  }
  return importedCount;
}

/**
 * Calculates total count and byte size of stored binary documents.
 */
export async function getTotalDocumentBinarySize(): Promise<{ count: number; totalBytes: number }> {
  try {
    const db = await getBlobDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records: StoredFileRecord[] = req.result || [];
        const count = records.length;
        const totalBytes = records.reduce((sum, r) => sum + (r.size || r.blob?.size || 0), 0);
        resolve({ count, totalBytes });
      };
      req.onerror = () => resolve({ count: 0, totalBytes: 0 });
    });
  } catch {
    return { count: 0, totalBytes: 0 };
  }
}


