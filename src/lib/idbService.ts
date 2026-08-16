/**
 * IndexedDB Local-First Persistence & Sync Manager for ConstructOS
 */

const DB_NAME = 'constructos_offline_db';
const DB_VERSION = 1;
const STATE_STORE = 'app_state';
const QUEUE_STORE = 'offline_queue';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE);
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('IndexedDB open failed:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Save a key-value state to IndexedDB.
 */
export async function setIDBItem<T = any>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readwrite');
      const store = tx.objectStore(STATE_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`IndexedDB setIDBItem error for key "${key}":`, err);
  }
}

/**
 * Get a value by key from IndexedDB.
 */
export async function getIDBItem<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readonly');
      const store = tx.objectStore(STATE_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`IndexedDB getIDBItem error for key "${key}":`, err);
    return null;
  }
}

/**
 * Get all keys and values from IndexedDB app_state store.
 */
export async function getAllIDBData(): Promise<Record<string, any>> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readonly');
      const store = tx.objectStore(STATE_STORE);
      const req = store.openCursor();
      const result: Record<string, any> = {};

      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          result[cursor.key as string] = cursor.value;
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB getAllIDBData error:', err);
    return {};
  }
}

/**
 * Queue an offline mutation payload to IndexedDB offline_queue.
 */
export async function enqueueOfflineMutation(key: string, data: any): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.add({
        key,
        data,
        timestamp: new Date().toISOString()
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB enqueueOfflineMutation error:', err);
  }
}

/**
 * Get pending mutations count.
 */
export async function getOfflineQueueCount(): Promise<number> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return 0;
  }
}

/**
 * Flush and clear queued offline mutations.
 */
export async function flushOfflineQueue(syncCallback: (key: string, data: any) => Promise<void>): Promise<number> {
  try {
    const db = await getDB();
    const items: Array<{ id: number; key: string; data: any }> = await new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (items.length === 0) return 0;

    for (const item of items) {
      await syncCallback(item.key, item.data);
    }

    // Clear queue store after successful sync
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return items.length;
  } catch (err) {
    console.error('IndexedDB flushOfflineQueue error:', err);
    return 0;
  }
}
