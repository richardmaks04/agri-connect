/**
 * offlineQueue.js
 * Stores user actions in IndexedDB when offline.
 * Replays them when connectivity is restored.
 * Implements the offline sync strategy from Chapter 3, Section 3.10.3.
 */

const DB_NAME    = 'agri-connect-offline';
const DB_VERSION = 1;
const STORE_NAME = 'action-queue';

// ─── Open IndexedDB ───────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror  = () => reject(request.error);
  });
}

// ─── Add action to queue ──────────────────────────────────────────────────────
export async function enqueueAction(action) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({
      ...action,
      timestamp: Date.now(),
      retries: 0,
    });
    console.log('[OfflineQueue] Action queued:', action.type);

    // Request background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('agri-connect-sync-queue');
    }
  } catch (err) {
    console.error('[OfflineQueue] Failed to enqueue:', err);
  }
}

// ─── Get all queued actions ───────────────────────────────────────────────────
export async function getQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ─── Remove action from queue after successful replay ─────────────────────────
export async function dequeueAction(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
}

// ─── Replay queue when back online ───────────────────────────────────────────
export async function replayQueue(apiClient) {
  const queue = await getQueue();
  if (queue.length === 0) return;

  console.log(`[OfflineQueue] Replaying ${queue.length} queued actions`);

  for (const action of queue) {
    try {
      await apiClient({
        method: action.method,
        url:    action.url,
        data:   action.data,
      });
      await dequeueAction(action.id);
      console.log('[OfflineQueue] Replayed:', action.type);
    } catch (err) {
      console.warn('[OfflineQueue] Replay failed for action:', action.type, err.message);
      // Leave in queue; will retry next time
    }
  }
}

// ─── Hook into window online event ───────────────────────────────────────────
export function initOfflineSync(apiClient) {
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Back online — replaying queue');
    replayQueue(apiClient);
  });

  // Also replay on initial load if online
  if (navigator.onLine) replayQueue(apiClient);
}
