/**
 * Constructfield Enterprise Data Archive & Migration Engine
 * Provides granular section export/import, Web Crypto AES-GCM 256-bit password protection,
 * archive inspection, and smart merge / clean overwrite restoration strategies.
 */

import { getAllIDBData, setIDBItem } from './idbService';

export type AppSectionKey = 
  | 'activities'
  | 'reports'
  | 'labour'
  | 'materials'
  | 'safety'
  | 'quality'
  | 'equipment'
  | 'accommodation'
  | 'surveys'
  | 'documents'
  | 'settings';

export interface SectionDefinition {
  key: AppSectionKey;
  label: string;
  category: 'Field Operations' | 'Workforce & Assets' | 'Quality & Safety' | 'System & Config';
  description: string;
  iconName: string;
  storageKeys: string[];
  idbKeys: string[];
}

export const APP_SECTIONS: Record<AppSectionKey, SectionDefinition> = {
  activities: {
    key: 'activities',
    label: 'Activities & Task Tracking',
    category: 'Field Operations',
    description: 'Scheduled activities, subtasks, task progress logs, notes, hold point signoffs',
    iconName: 'Activity',
    storageKeys: ['activities', 'projects', 'allocations', 'auditLogs', 'reminders', 'constructos_notes'],
    idbKeys: ['activities', 'projects', 'allocations', 'auditLogs', 'reminders']
  },
  reports: {
    key: 'reports',
    label: 'Daily Site Logs & Reports',
    category: 'Field Operations',
    description: 'Daily supervisor reports, shift logs, weather observations, delays, blockers',
    iconName: 'FileText',
    storageKeys: ['reports', 'weatherLogs'],
    idbKeys: ['reports', 'weatherLogs']
  },
  labour: {
    key: 'labour',
    label: 'Labour & Workforce Management',
    category: 'Workforce & Assets',
    description: 'Employee roster, labour shifts, timesheets, contractor teams, check-ins',
    iconName: 'Users',
    storageKeys: ['employees', 'teams', 'labourLogs', 'labourAllocations', 'workerCheckIns'],
    idbKeys: ['employees', 'teams', 'labourLogs', 'labourAllocations', 'workerCheckIns']
  },
  materials: {
    key: 'materials',
    label: 'Materials & PPE Inventory',
    category: 'Workforce & Assets',
    description: 'Material stock catalogue, deliveries, warehouse receipts, PPE assignments',
    iconName: 'Package',
    storageKeys: ['materials', 'materialReceipts', 'materialUsages', 'ppeItems'],
    idbKeys: ['materials', 'materialReceipts', 'materialUsages', 'ppeItems']
  },
  safety: {
    key: 'safety',
    label: 'Safety, HSE & Compliance',
    category: 'Quality & Safety',
    description: 'Incident logs, hazard observations, toolbox talks, PPE requirements, safety policies',
    iconName: 'ShieldCheck',
    storageKeys: ['safetyIncidents', 'safetyRequirements', 'safetyPolicies'],
    idbKeys: ['safetyIncidents', 'safetyRequirements', 'safetyPolicies']
  },
  quality: {
    key: 'quality',
    label: 'Quality Control & QA Inspections',
    category: 'Quality & Safety',
    description: 'Inspection Test Plans (ITPs), hold points, non-conformance reports (NCR), inspection photos',
    iconName: 'CheckSquare',
    storageKeys: ['qaInspections', 'activityInspections', 'siteInspectionPhotos'],
    idbKeys: ['qaInspections', 'activityInspections', 'siteInspectionPhotos']
  },
  equipment: {
    key: 'equipment',
    label: 'Plant, Machinery & Equipment',
    category: 'Workforce & Assets',
    description: 'Machinery registry, pre-start checks, fuel logs, service and maintenance logs',
    iconName: 'Truck',
    storageKeys: ['equipment', 'equipmentLogs'],
    idbKeys: ['equipment', 'equipmentLogs']
  },
  accommodation: {
    key: 'accommodation',
    label: 'Accommodation & Camp Hub',
    category: 'Workforce & Assets',
    description: 'Camp facilities, bed occupancy, resident staff roster, utility expenses, lease payments',
    iconName: 'Home',
    storageKeys: ['accommodations', 'accommodationUtilities', 'accommodationPayments'],
    idbKeys: ['accommodations', 'accommodationUtilities', 'accommodationPayments']
  },
  surveys: {
    key: 'surveys',
    label: 'Surveying & Benchmarks',
    category: 'Field Operations',
    description: 'Survey benchmarks, levels, topography points, coordinate logs, field records',
    iconName: 'Compass',
    storageKeys: ['surveyRecords'],
    idbKeys: ['surveyRecords']
  },
  documents: {
    key: 'documents',
    label: 'Document Engine & Library',
    category: 'Field Operations',
    description: 'Project documents, drawings metadata, certificates, revision registers',
    iconName: 'FolderOpen',
    storageKeys: ['documents'],
    idbKeys: ['documents']
  },
  settings: {
    key: 'settings',
    label: 'System Settings & Profiles',
    category: 'System & Config',
    description: 'User profiles, access whitelist permissions, custom field definitions, units, theme',
    iconName: 'Settings',
    storageKeys: ['theme', 'units', 'currency', 'userProfiles', 'currentUserProfile', 'accessRequests', 'customFieldDefinitions'],
    idbKeys: ['userProfiles', 'customFieldDefinitions']
  }
};

export interface ArchiveManifest {
  format: 'constructfield_archive' | 'constructfield_encrypted_archive';
  version: '2.0.0';
  exportDate: string;
  exportedBy: string;
  label: string;
  notes?: string;
  isEncrypted: boolean;
  sections: AppSectionKey[];
  sectionCounts: Record<string, number>;
  totalRecords: number;
  hint?: string;
  hasBinaryAttachments?: boolean;
  binaryAttachmentsCount?: number;
  binaryAttachmentsBytes?: number;
}

export interface PlainArchivePackage {
  format: 'constructfield_archive';
  version: '2.0.0';
  encrypted: false;
  manifest: ArchiveManifest;
  data: {
    idb: Record<string, any[]>;
    storage: Record<string, string>;
    binaryAttachments?: any[];
  };
}

export interface EncryptedArchivePackage {
  format: 'constructfield_encrypted_archive';
  version: '2.0.0';
  encrypted: true;
  algorithm: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;        // Base64
  iv: string;          // Base64
  ciphertext: string;  // Base64
  manifest: ArchiveManifest;
}

export type ArchivePackage = PlainArchivePackage | EncryptedArchivePackage;

export interface ArchiveInspectionResult {
  valid: boolean;
  isEncrypted: boolean;
  manifest?: ArchiveManifest;
  unlockedData?: PlainArchivePackage;
  error?: string;
  needsPassword?: boolean;
}

export type RestoreStrategy = 'merge' | 'replace';

export interface RestoreResult {
  success: boolean;
  restoredSections: AppSectionKey[];
  recordsProcessed: number;
  strategy: RestoreStrategy;
  message: string;
  error?: string;
}

// ----------------------------------------------------------------------------
// Cryptographic Web Crypto Helper Functions (AES-GCM-256 + PBKDF2)
// ----------------------------------------------------------------------------

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const blob = new Blob([buffer]);
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

async function base64ToArrayBuffer(base64: string): Promise<ArrayBuffer> {
  try {
    const res = await fetch(`data:application/octet-stream;base64,${base64}`);
    return await res.arrayBuffer();
  } catch {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

async function deriveKey(password: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptArchiveData(
  plainPackage: PlainArchivePackage,
  password: string,
  hint?: string
): Promise<EncryptedArchivePackage> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const key = await deriveKey(password, salt, iterations);
  const enc = new TextEncoder();
  const rawData = enc.encode(JSON.stringify(plainPackage));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
    key,
    rawData
  );

  const manifest: ArchiveManifest = {
    ...plainPackage.manifest,
    format: 'constructfield_encrypted_archive',
    isEncrypted: true,
    hint: hint ? hint.trim() : undefined
  };

  const [saltB64, ivB64, ciphertextB64] = await Promise.all([
    arrayBufferToBase64(salt.buffer),
    arrayBufferToBase64(iv.buffer),
    arrayBufferToBase64(ciphertextBuffer)
  ]);

  return {
    format: 'constructfield_encrypted_archive',
    version: '2.0.0',
    encrypted: true,
    algorithm: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: saltB64,
    iv: ivB64,
    ciphertext: ciphertextB64,
    manifest
  };
}

export async function decryptArchiveData(
  pkg: EncryptedArchivePackage,
  password: string
): Promise<PlainArchivePackage> {
  try {
    const [saltBuffer, ivBuffer, ciphertext] = await Promise.all([
      base64ToArrayBuffer(pkg.salt),
      base64ToArrayBuffer(pkg.iv),
      base64ToArrayBuffer(pkg.ciphertext)
    ]);
    const salt = new Uint8Array(saltBuffer);
    const iv = new Uint8Array(ivBuffer);

    const key = await deriveKey(password, salt, pkg.iterations || 100000);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);
    const plainPackage: PlainArchivePackage = JSON.parse(jsonString);
    return plainPackage;
  } catch (err: any) {
    throw new Error('Incorrect archive password or corrupted encryption container.');
  }
}

// ----------------------------------------------------------------------------
// Section Count & Active Database Query Helpers
// ----------------------------------------------------------------------------

export async function getLiveSectionCounts(): Promise<Record<AppSectionKey, number>> {
  const idbData = await getAllIDBData();
  const counts: Record<string, number> = {};

  (Object.keys(APP_SECTIONS) as AppSectionKey[]).forEach(secKey => {
    const def = APP_SECTIONS[secKey];
    let total = 0;

    // IDB counts
    def.idbKeys.forEach(k => {
      const arr = idbData[k];
      if (Array.isArray(arr)) {
        total += arr.length;
      }
    });

    // LocalStorage counts (for keys that store arrays)
    def.storageKeys.forEach(k => {
      if (!def.idbKeys.includes(k)) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) total += parsed.length;
            else if (typeof parsed === 'object' && parsed !== null) total += 1;
          } catch (_) {}
        }
      }
    });

    counts[secKey] = total;
  });

  return counts as Record<AppSectionKey, number>;
}

// ----------------------------------------------------------------------------
// Archive Generator (Export)
// ----------------------------------------------------------------------------

export async function createExportArchive(options: {
  selectedSections: AppSectionKey[];
  label?: string;
  notes?: string;
  exportedBy?: string;
  password?: string;
  passwordHint?: string;
  includeBinaryAttachments?: boolean;
}): Promise<{ packageString: string; filename: string; manifest: ArchiveManifest }> {
  const {
    selectedSections,
    label = 'Scedih System Backup',
    notes = '',
    exportedBy = 'Scedih User',
    password,
    passwordHint,
    includeBinaryAttachments = false
  } = options;

  if (selectedSections.length === 0) {
    throw new Error('Please select at least one section to export.');
  }

  const allIDB = await getAllIDBData();
  const exportedIDB: Record<string, any[]> = {};
  const exportedStorage: Record<string, string> = {};
  const sectionCounts: Record<string, number> = {};
  let totalRecords = 0;

  // Aggregate selected section data
  selectedSections.forEach(secKey => {
    const def = APP_SECTIONS[secKey];
    let secCount = 0;

    // Collect IDB collections
    def.idbKeys.forEach(idbKey => {
      const collection = allIDB[idbKey] || [];
      exportedIDB[idbKey] = collection;
      if (Array.isArray(collection)) {
        secCount += collection.length;
      }
    });

    // Collect LocalStorage items
    def.storageKeys.forEach(storageKey => {
      const val = localStorage.getItem(storageKey);
      if (val !== null) {
        exportedStorage[storageKey] = val;
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && !def.idbKeys.includes(storageKey)) {
            secCount += parsed.length;
          }
        } catch (_) {}
      }
    });

    sectionCounts[secKey] = secCount;
    totalRecords += secCount;
  });

  // Collect Binary attachments if requested and documents section is included
  let binaryAttachments: any[] | undefined = undefined;
  let binaryTotalBytes = 0;
  if (includeBinaryAttachments && selectedSections.includes('documents')) {
    try {
      const { exportAllDocumentBinaries } = await import('./documentStorage');
      binaryAttachments = await exportAllDocumentBinaries();
      binaryTotalBytes = binaryAttachments.reduce((sum, b) => sum + (b.size || 0), 0);
    } catch (e) {
      console.warn('Could not collect binary attachments:', e);
    }
  }

  const exportDate = new Date().toISOString();

  const manifest: ArchiveManifest = {
    format: 'constructfield_archive',
    version: '2.0.0',
    exportDate,
    exportedBy,
    label: label.trim() || 'Scedih Backup',
    notes: notes.trim() || undefined,
    isEncrypted: Boolean(password && password.trim()),
    sections: selectedSections,
    sectionCounts,
    totalRecords,
    hasBinaryAttachments: Boolean(binaryAttachments && binaryAttachments.length > 0),
    binaryAttachmentsCount: binaryAttachments ? binaryAttachments.length : 0,
    binaryAttachmentsBytes: binaryTotalBytes
  };

  const plainPackage: PlainArchivePackage = {
    format: 'constructfield_archive',
    version: '2.0.0',
    encrypted: false,
    manifest,
    data: {
      idb: exportedIDB,
      storage: exportedStorage,
      binaryAttachments
    }
  };

  const dateSlug = exportDate.split('T')[0];
  const secSlug = selectedSections.length === Object.keys(APP_SECTIONS).length ? 'full' : `${selectedSections.length}sec`;

  if (password && password.trim()) {
    const encryptedPkg = await encryptArchiveData(plainPackage, password.trim(), passwordHint);
    const filename = `scedih-${secSlug}-${dateSlug}.cfbak`;
    return {
      packageString: JSON.stringify(encryptedPkg, null, 2),
      filename,
      manifest: encryptedPkg.manifest
    };
  } else {
    const filename = `scedih-${secSlug}-${dateSlug}.json`;
    return {
      packageString: JSON.stringify(plainPackage, null, 2),
      filename,
      manifest
    };
  }
}

// ----------------------------------------------------------------------------
// Archive Inspector (Inspect uploaded file before restoring)
// ----------------------------------------------------------------------------

export async function inspectArchiveFile(
  fileContent: string,
  password?: string
): Promise<ArchiveInspectionResult> {
  try {
    let parsed: any;
    try {
      parsed = JSON.parse(fileContent);
    } catch (e) {
      return { valid: false, isEncrypted: false, error: 'Invalid JSON file structure.' };
    }

    // Case 1: Encrypted Constructfield 2.0 Archive
    if (parsed.format === 'constructfield_encrypted_archive' || parsed.encrypted === true) {
      if (!password) {
        return {
          valid: true,
          isEncrypted: true,
          needsPassword: true,
          manifest: parsed.manifest || {
            format: 'constructfield_encrypted_archive',
            version: parsed.version || '2.0.0',
            exportDate: parsed.createdAt || new Date().toISOString(),
            exportedBy: 'Encrypted Package',
            label: 'Protected Scedih Archive',
            isEncrypted: true,
            sections: parsed.manifest?.sections || Object.keys(APP_SECTIONS),
            sectionCounts: parsed.manifest?.sectionCounts || {},
            totalRecords: parsed.manifest?.totalRecords || 0,
            hint: parsed.manifest?.hint
          }
        };
      }

      try {
        const decrypted = await decryptArchiveData(parsed as EncryptedArchivePackage, password);
        return {
          valid: true,
          isEncrypted: true,
          needsPassword: false,
          manifest: decrypted.manifest,
          unlockedData: decrypted
        };
      } catch (err: any) {
        return {
          valid: false,
          isEncrypted: true,
          needsPassword: true,
          error: err.message || 'Incorrect password for encrypted archive.',
          manifest: parsed.manifest
        };
      }
    }

    // Case 2: Standard Unencrypted Constructfield 2.0 Archive
    if (parsed.format === 'constructfield_archive' && parsed.data) {
      return {
        valid: true,
        isEncrypted: false,
        manifest: parsed.manifest,
        unlockedData: parsed as PlainArchivePackage
      };
    }

    // Case 3: Legacy Constructfield / ConstructOS 1.0 JSON Snapshot
    if (parsed.idbData || parsed.storage || parsed.app === 'Constructfield' || parsed.app === 'ConstructOS') {
      const legacyIdb = parsed.idbData || {};
      const legacyStorage = parsed.storage || {};
      const detectedSections: AppSectionKey[] = [];
      const sectionCounts: Record<string, number> = {};
      let totalRecords = 0;

      (Object.keys(APP_SECTIONS) as AppSectionKey[]).forEach(secKey => {
        const def = APP_SECTIONS[secKey];
        let c = 0;
        def.idbKeys.forEach(k => {
          if (Array.isArray(legacyIdb[k])) c += legacyIdb[k].length;
        });
        def.storageKeys.forEach(k => {
          if (legacyStorage[k]) {
            try {
              const p = JSON.parse(legacyStorage[k]);
              if (Array.isArray(p)) c += p.length;
            } catch (_) {}
          }
        });
        if (c > 0) {
          detectedSections.push(secKey);
          sectionCounts[secKey] = c;
          totalRecords += c;
        }
      });

      const syntheticManifest: ArchiveManifest = {
        format: 'constructfield_archive',
        version: '2.0.0',
        exportDate: parsed.timestamp || new Date().toISOString(),
        exportedBy: parsed.currentUserProfile?.name || 'Legacy Snapshot',
        label: 'Constructfield Legacy Snapshot (v1.0)',
        isEncrypted: false,
        sections: detectedSections.length > 0 ? detectedSections : (Object.keys(APP_SECTIONS) as AppSectionKey[]),
        sectionCounts,
        totalRecords
      };

      const convertedPlain: PlainArchivePackage = {
        format: 'constructfield_archive',
        version: '2.0.0',
        encrypted: false,
        manifest: syntheticManifest,
        data: {
          idb: legacyIdb,
          storage: legacyStorage
        }
      };

      return {
        valid: true,
        isEncrypted: false,
        manifest: syntheticManifest,
        unlockedData: convertedPlain
      };
    }

    return {
      valid: false,
      isEncrypted: false,
      error: 'Unrecognized file format. Please provide a valid Constructfield (.cfbak or .json) archive file.'
    };
  } catch (err: any) {
    return {
      valid: false,
      isEncrypted: false,
      error: 'Failed to inspect file: ' + (err.message || 'Corrupted file')
    };
  }
}

// ----------------------------------------------------------------------------
// Safety Rollback Snapshot Creation
// ----------------------------------------------------------------------------

export async function createSafetyRollbackSnapshot(): Promise<string> {
  try {
    const keys = Object.keys(localStorage);
    const snap: Record<string, string> = {};
    keys.forEach(k => {
      const v = localStorage.getItem(k);
      if (v) snap[k] = v;
    });
    const str = JSON.stringify(snap);
    sessionStorage.setItem('constructfield_last_rollback_snapshot', str);
    return str;
  } catch (_) {
    return '';
  }
}

// ----------------------------------------------------------------------------
// Archive Restoration Executor
// ----------------------------------------------------------------------------

export async function executeRestore(
  plainPackage: PlainArchivePackage,
  sectionsToRestore: AppSectionKey[],
  strategy: RestoreStrategy = 'merge'
): Promise<RestoreResult> {
  try {
    if (sectionsToRestore.length === 0) {
      throw new Error('Please select at least one section to restore.');
    }

    // 1. Create a safety snapshot
    await createSafetyRollbackSnapshot();

    const incomingIDB = plainPackage.data?.idb || {};
    const incomingStorage = plainPackage.data?.storage || {};
    const currentIDB = await getAllIDBData();

    let recordsProcessed = 0;

    for (const secKey of sectionsToRestore) {
      const def = APP_SECTIONS[secKey];

      // Process IDB collections
      for (const idbKey of def.idbKeys) {
        const incomingCollection = incomingIDB[idbKey];
        if (!Array.isArray(incomingCollection)) continue;

        if (strategy === 'replace') {
          await setIDBItem(idbKey, incomingCollection);
          try {
            localStorage.setItem(idbKey, JSON.stringify(incomingCollection));
          } catch (_) {}
          recordsProcessed += incomingCollection.length;
        } else {
          // Smart Merge & Upsert strategy
          const existingCollection: any[] = Array.isArray(currentIDB[idbKey]) 
            ? currentIDB[idbKey] 
            : (() => {
                try {
                  const l = localStorage.getItem(idbKey);
                  return l ? JSON.parse(l) : [];
                } catch { return []; }
              })();

          const existingMap = new Map<string, any>();

          existingCollection.forEach((item, idx) => {
            const id = item?.id || String(idx);
            existingMap.set(id, item);
          });

          incomingCollection.forEach((item, idx) => {
            const id = item?.id || String(idx);
            existingMap.set(id, {
              ...(existingMap.get(id) || {}),
              ...item
            });
          });

          const merged = Array.from(existingMap.values());
          await setIDBItem(idbKey, merged);
          try {
            localStorage.setItem(idbKey, JSON.stringify(merged));
          } catch (_) {}
          recordsProcessed += incomingCollection.length;
        }
      }

      // Process LocalStorage items
      for (const storageKey of def.storageKeys) {
        const incomingVal = incomingStorage[storageKey];
        if (incomingVal === undefined) continue;

        if (strategy === 'replace') {
          localStorage.setItem(storageKey, incomingVal);
        } else {
          // Attempt smart merge if JSON array
          const existingRaw = localStorage.getItem(storageKey);
          if (!existingRaw) {
            localStorage.setItem(storageKey, incomingVal);
          } else {
            try {
              const parsedExisting = JSON.parse(existingRaw);
              const parsedIncoming = JSON.parse(incomingVal);

              if (Array.isArray(parsedExisting) && Array.isArray(parsedIncoming)) {
                const map = new Map<string, any>();
                parsedExisting.forEach((it, idx) => map.set(it?.id || String(idx), it));
                parsedIncoming.forEach((it, idx) => map.set(it?.id || String(idx), { ...(map.get(it?.id || String(idx)) || {}), ...it }));
                localStorage.setItem(storageKey, JSON.stringify(Array.from(map.values())));
              } else if (typeof parsedExisting === 'object' && typeof parsedIncoming === 'object') {
                localStorage.setItem(storageKey, JSON.stringify({ ...parsedExisting, ...parsedIncoming }));
              } else {
                localStorage.setItem(storageKey, incomingVal);
              }
            } catch (_) {
              localStorage.setItem(storageKey, incomingVal);
            }
          }
        }
      }
    }

    // Restore binary attachments if present in archive and documents section is selected
    if (sectionsToRestore.includes('documents') && plainPackage.data?.binaryAttachments && plainPackage.data.binaryAttachments.length > 0) {
      try {
        const { importDocumentBinaries } = await import('./documentStorage');
        const importedBinariesCount = await importDocumentBinaries(plainPackage.data.binaryAttachments);
        recordsProcessed += importedBinariesCount;
      } catch (binErr) {
        console.warn('Failed to restore binary attachments:', binErr);
      }
    }

    // Try to trigger cloud replication if Firestore is online
    try {
      const { saveFullFirestoreState } = await import('./firestoreService');
      const updatedAllIDB = await getAllIDBData();
      await saveFullFirestoreState(updatedAllIDB);
    } catch (err) {
      console.warn('Post-restore cloud sync skipped:', err);
    }

    return {
      success: true,
      restoredSections: sectionsToRestore,
      recordsProcessed,
      strategy,
      message: `Successfully restored ${sectionsToRestore.length} section(s) (${recordsProcessed} records) via ${strategy === 'merge' ? 'Smart Merge' : 'Clean Overwrite'}.`
    };
  } catch (err: any) {
    console.error('Execute restore error:', err);
    return {
      success: false,
      restoredSections: [],
      recordsProcessed: 0,
      strategy,
      message: 'Restoration failed.',
      error: err.message || 'Unknown restoration error'
    };
  }
}

// ----------------------------------------------------------------------------
// Section Data Purge & Clear Executor
// ----------------------------------------------------------------------------

export interface ClearDataResult {
  success: boolean;
  clearedSections: AppSectionKey[];
  recordsCleared: number;
  message: string;
  error?: string;
}

export async function clearSectionData(
  sectionsToClear: AppSectionKey[],
  resetToDefaults = false
): Promise<ClearDataResult> {
  try {
    if (sectionsToClear.length === 0) {
      throw new Error('Please select at least one section to clear.');
    }

    // 1. Automatically create safety snapshot first
    await createSafetyRollbackSnapshot();

    const counts = await getLiveSectionCounts();
    let recordsCleared = 0;

    for (const secKey of sectionsToClear) {
      const def = APP_SECTIONS[secKey];
      recordsCleared += counts[secKey] || 0;

      // Clear IDB stores
      for (const idbKey of def.idbKeys) {
        await setIDBItem(idbKey, []);
      }

      // Clear LocalStorage keys
      for (const storageKey of def.storageKeys) {
        if (secKey === 'settings' && !resetToDefaults) {
          // Keep current active session settings if clearing settings without hard reset
          if (storageKey === 'theme' || storageKey === 'units' || storageKey === 'currency' || storageKey === 'currentUserProfile') {
            continue;
          }
        }
        localStorage.removeItem(storageKey);
      }
    }

    // Try cloud sync if online
    try {
      const { saveFullFirestoreState } = await import('./firestoreService');
      const updatedAllIDB = await getAllIDBData();
      await saveFullFirestoreState(updatedAllIDB);
    } catch (err) {
      console.warn('Post-clear cloud sync skipped:', err);
    }

    return {
      success: true,
      clearedSections: sectionsToClear,
      recordsCleared,
      message: `Successfully cleared ${sectionsToClear.length} section(s) (${recordsCleared} records purged).`
    };
  } catch (err: any) {
    console.error('Clear section data error:', err);
    return {
      success: false,
      clearedSections: [],
      recordsCleared: 0,
      message: 'Failed to clear data.',
      error: err.message || 'Unknown error'
    };
  }
}

