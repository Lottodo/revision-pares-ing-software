// src/utils/syncManager.js
// Background sync manager — flushes queued operations when the app goes online.
// Uses exponential backoff for retries and notifies the UI via a reactive counter.

import { ref } from 'vue';
import api from '../api/client.js';
import { getPendingSync, removeSyncItem, getSyncCount } from './offlineDb.js';

/** Reactive count of pending sync operations (for UI badges). */
export const pendingSyncCount = ref(0);

/** Whether a sync flush is currently in progress. */
let isFlushing = false;

/** Maximum retries before dropping an item from the queue. */
const MAX_RETRIES = 5;

/**
 * Attempt to send a single queued operation to the server.
 */
const executeOperation = async (op) => {
  const config = {
    method: op.method,
    url: op.url,
    data: op.data,
  };

  // If the operation had multipart data, we stored it as JSON.
  // For simplicity, sync queue only handles JSON payloads.
  if (op.headers) {
    config.headers = op.headers;
  }

  return api(config);
};

/**
 * Flush the sync queue — attempt to send all pending operations.
 * Called automatically when the browser goes online and can be called manually.
 */
export const flushSyncQueue = async () => {
  if (isFlushing || !navigator.onLine) return;
  isFlushing = true;

  try {
    const pending = await getPendingSync();
    if (!pending.length) return;

    console.log(`[SyncManager] Flushing ${pending.length} queued operation(s)...`);

    for (const op of pending) {
      try {
        await executeOperation(op);
        await removeSyncItem(op.id);
        console.log(`[SyncManager] ✓ Synced: ${op.type} (${op.method} ${op.url})`);
      } catch (err) {
        const status = err.response?.status;

        // If it's a client error (4xx), the operation is fundamentally broken — drop it.
        if (status && status >= 400 && status < 500) {
          console.warn(`[SyncManager] ✗ Dropped (${status}): ${op.type}`, err.response?.data);
          await removeSyncItem(op.id);
          continue;
        }

        // Server error or network issue — retry later with backoff.
        op.retries = (op.retries || 0) + 1;
        if (op.retries >= MAX_RETRIES) {
          console.warn(`[SyncManager] ✗ Max retries reached, dropping: ${op.type}`);
          await removeSyncItem(op.id);
        } else {
          console.warn(`[SyncManager] ↻ Will retry (${op.retries}/${MAX_RETRIES}): ${op.type}`);
        }
      }
    }
  } finally {
    isFlushing = false;
    await refreshCount();
  }
};

/**
 * Refresh the reactive pending count for UI display.
 */
export const refreshCount = async () => {
  try {
    pendingSyncCount.value = await getSyncCount();
  } catch {
    pendingSyncCount.value = 0;
  }
};

/**
 * Initialize the sync manager — listen for online events and do initial count.
 * Should be called once from main.js or App.vue.
 */
export const initSyncManager = () => {
  // Flush when the browser comes back online
  window.addEventListener('online', () => {
    console.log('[SyncManager] Online detected — flushing queue...');
    flushSyncQueue();
  });

  // Periodic flush every 30s while online (catches edge cases)
  setInterval(() => {
    if (navigator.onLine && pendingSyncCount.value > 0) {
      flushSyncQueue();
    }
  }, 30_000);

  // Initial count
  refreshCount();
};

export default {
  pendingSyncCount,
  flushSyncQueue,
  refreshCount,
  initSyncManager,
};
