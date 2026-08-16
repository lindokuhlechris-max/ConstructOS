import { doc, getDoc, setDoc, onSnapshot, disableNetwork } from 'firebase/firestore';
import { db } from './firebase';
import { setIDBItem, getAllIDBData, enqueueOfflineMutation, flushOfflineQueue } from './idbService';

const APP_STATE_DOC = doc(db, 'app_state', 'main');

export const INITIAL_APP_STATE: Record<string, any[]> = {
  projects: [],
  activities: [],
  reports: [],
  weatherLogs: [],
  labourLogs: [],
  labourAllocations: [],
  workerCheckIns: [],
  auditLogs: [],
  allocations: [],
  safetyIncidents: [],
  materials: [],
  materialReceipts: [],
  materialUsages: [],
  customFieldDefinitions: [],
  employees: [],
  teams: [],
  equipment: [],
  equipmentLogs: [],
  safetyRequirements: [],
  safetyPolicies: [],
  activityInspections: [],
  siteInspectionPhotos: [],
  ppeItems: [],
  qaInspections: [],
  documents: [],
  userProfiles: [],
  reminders: []
};

let isSavingBatch = false;
let lastSyncedAt: Date | null = new Date();
let isQuotaExceeded = false; // Never cache this locally to ensure we always try connecting on startup

// We don't disable network on boot based on previous session data anymore.

type SyncCallback = (status: { isSyncing: boolean; hasPendingWrites: boolean; lastSyncedAt: Date | null }) => void;
let syncStatusListeners: SyncCallback[] = [];

let pendingKeyBatch: Record<string, any[]> = {};
let lastSyncedHashes: Record<string, string> = {};
let batchTimeout: any = null;

export function notifySyncStatus(hasPendingWrites = false) {
  const isSyncing = batchTimeout !== null || isSavingBatch || hasPendingWrites;
  if (!isSyncing) {
    lastSyncedAt = new Date();
  }
  syncStatusListeners.forEach(fn => fn({ isSyncing, hasPendingWrites, lastSyncedAt }));
}

export function onSyncStatusChange(callback: SyncCallback) {
  syncStatusListeners.push(callback);
  const isSyncing = batchTimeout !== null || isSavingBatch;
  callback({ isSyncing, hasPendingWrites: false, lastSyncedAt });
  return () => {
    syncStatusListeners = syncStatusListeners.filter(fn => fn !== callback);
  };
}

// Helper to check for quota exceeded errors
function isQuotaError(error: any): boolean {
  if (!error) return false;
  const code = error.code || '';
  const msg = error.message || String(error);
  return code === 'resource-exhausted' || 
         msg.includes('Quota limit exceeded') || 
         msg.includes('resource-exhausted') || 
         msg.includes('Free daily write units') || 
         msg.includes('exceed free quota');
}

function handleQuotaExceeded() {
  isQuotaExceeded = true;
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }
  pendingKeyBatch = {};
  isSavingBatch = false;
  // We no longer persist the quota exceeded flag to localStorage
  // so the user gets a fresh retry upon reloading the page.
  disableNetwork(db).catch(() => {});
  notifySyncStatus();
  console.warn('Firestore daily write quota reached; operating seamlessly in local IndexedDB mode.');
}

// Auto-flush offline queue when back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    if (isQuotaExceeded) return;
    console.log('Online connection restored. Flushing IndexedDB offline queue...');
    await flushOfflineQueue(async (key, data) => {
      try {
        await setDoc(APP_STATE_DOC, { [key]: data }, { merge: true });
        if (key === 'userProfiles') {
          syncPermissionsCollection(data);
        }
      } catch (err) {
        if (isQuotaError(err)) {
          handleQuotaExceeded();
        }
      }
    });
    notifySyncStatus();
  });
}

/**
 * Subscribe to real-time changes in Firestore with IndexedDB mirroring.
 */
export function subscribeToFirestoreState(
  onUpdate: (data: Record<string, any[]>) => void,
  onError?: (err: Error) => void
) {
  // First attempt reading from IndexedDB for zero-latency local load
  getAllIDBData().then((cachedData) => {
    if (cachedData && Object.keys(cachedData).length > 0) {
      onUpdate(cachedData);
    }
  }).catch(console.error);

  if (isQuotaExceeded) {
    return () => {};
  }

  let unsubscribe: (() => void) | null = null;

  unsubscribe = onSnapshot(
    APP_STATE_DOC,
    (snapshot) => {
      const hasPendingWrites = snapshot.metadata.hasPendingWrites;
      notifySyncStatus(hasPendingWrites);
      if (snapshot.exists()) {
        const data = snapshot.data() as Record<string, any[]>;
        // Mirror all incoming Firestore state keys to IndexedDB & cache hashes to avoid echo-writes
        Object.entries(data).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            setIDBItem(key, val);
            lastSyncedHashes[key] = JSON.stringify(val);
          }
        });
        onUpdate(data);
      } else if (!isQuotaExceeded) {
        // Document does not exist in Firestore yet; seed it asynchronously without wiping local state
        setDoc(APP_STATE_DOC, INITIAL_APP_STATE, { merge: true }).catch((err) => {
          if (isQuotaError(err)) handleQuotaExceeded();
        });
      }
    },
    (error) => {
      if (isQuotaError(error)) {
        handleQuotaExceeded();
        if (unsubscribe) {
          try { unsubscribe(); } catch (_) {}
        }
      } else {
        console.warn('Firestore snapshot listener offline or limited:', error);
      }
      if (onError) onError(error);
    }
  );

  return () => {
    if (unsubscribe) {
      try { unsubscribe(); } catch (_) {}
    }
  };
}

/**
 * Save a single collection state key to IndexedDB immediately, then sync to Firestore (debounced & batched).
 */
export async function saveFirestoreKey(key: string, value: any[]) {
  // 1. Zero-latency instant IndexedDB write
  await setIDBItem(key, value);

  if (isQuotaExceeded) {
    // If quota is exhausted, save locally in IDB and exit cleanly without generating Firestore quota errors
    return;
  }

  // 2. Smart Hash Comparison: If the incoming array is identical to what is already in Firestore, skip write call!
  const currentJson = JSON.stringify(value);
  if (lastSyncedHashes[key] === currentJson) {
    return;
  }

  if (key === 'userProfiles') {
    syncPermissionsCollection(value);
  }

  pendingKeyBatch[key] = value;

  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }

  notifySyncStatus();

  // 3. Debounce & Coalesce writes (3 seconds buffer to group rapid edits into a single request)
  batchTimeout = setTimeout(async () => {
    batchTimeout = null;
    if (isQuotaExceeded || Object.keys(pendingKeyBatch).length === 0) {
      notifySyncStatus();
      return;
    }

    const batchToSend = { ...pendingKeyBatch };
    pendingKeyBatch = {};
    isSavingBatch = true;
    notifySyncStatus();

    try {
      await setDoc(APP_STATE_DOC, batchToSend, { merge: true });
      // Update our synced hashes cache
      Object.entries(batchToSend).forEach(([k, v]) => {
        lastSyncedHashes[k] = JSON.stringify(v);
      });
    } catch (error) {
      if (isQuotaError(error)) {
        handleQuotaExceeded();
      } else {
        console.warn('Firestore write offline, queued locally:', error);
        for (const [k, v] of Object.entries(batchToSend)) {
          await enqueueOfflineMutation(k, v);
        }
      }
    } finally {
      isSavingBatch = false;
      notifySyncStatus();
    }
  }, 3000);
}

export async function syncPermissionsCollection(profiles: any[]) {
  if (isQuotaExceeded) return;
  try {
    for (const profile of profiles) {
      if (!profile.email) continue;
      const email = profile.email.toLowerCase();
      let role = 'view';
      if (profile.role === 'Admin' || profile.role === 'Manager') role = 'admin';
      else if (profile.accessAllowed && (profile.permissions.activities || profile.permissions.reports)) role = 'write';
      
      if (profile.accessAllowed === false) role = 'blocked';
      
      const docRef = doc(db, 'permissions', email);
      // Fire and forget so we don't block
      setDoc(docRef, { role, updated: new Date().toISOString() }, { merge: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('Could not sync permissions', err);
  }
}

/**
 * Save full app state to IndexedDB immediately, then sync to Firestore.
 */
export async function saveFullFirestoreState(state: Record<string, any[]>) {
  // 1. Zero-latency instant IndexedDB write for all keys
  for (const [key, value] of Object.entries(state)) {
    await setIDBItem(key, value);
  }

  if (state.userProfiles) {
    syncPermissionsCollection(state.userProfiles);
  }

  if (isQuotaExceeded) {
    return;
  }

  isSavingBatch = true;
  notifySyncStatus();
  try {
    await setDoc(APP_STATE_DOC, state, { merge: true });
  } catch (error) {
    if (isQuotaError(error)) {
      handleQuotaExceeded();
    } else {
      console.warn('Firestore full state save offline, queued in IndexedDB:', error);
      for (const [key, value] of Object.entries(state)) {
        await enqueueOfflineMutation(key, value);
      }
    }
  } finally {
    isSavingBatch = false;
    notifySyncStatus();
  }
}


