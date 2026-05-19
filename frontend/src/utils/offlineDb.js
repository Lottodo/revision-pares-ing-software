// src/utils/offlineDb.js
// IndexedDB persistence layer for offline PWA support.
// Uses the `idb` library for a promise-based API over raw IndexedDB.

import { openDB } from 'idb';

const DB_NAME = 'studiopeer-offline';
const DB_VERSION = 1;

/**
 * Opens (or creates) the IndexedDB database with all required object stores.
 */
const getDb = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // ── Cached API data (network-first with local fallback) ──
      if (!db.objectStoreNames.contains('cachedPapers')) {
        db.createObjectStore('cachedPapers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedAssignments')) {
        db.createObjectStore('cachedAssignments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedEvents')) {
        db.createObjectStore('cachedEvents', { keyPath: 'id' });
      }

      // ── Draft reviews (work-in-progress, saved locally) ──
      if (!db.objectStoreNames.contains('draftReviews')) {
        db.createObjectStore('draftReviews', { keyPath: 'assignmentId' });
      }

      // ── Sync queue (operations pending upload) ──
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('createdAt', 'createdAt');
      }
    },
  });

// ─────────────────────────────────────────────────────────────
// GENERIC CRUD HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Get all items from a store.
 */
export const getAll = async (storeName) => {
  const db = await getDb();
  return db.getAll(storeName);
};

/**
 * Get a single item by key.
 */
export const getById = async (storeName, key) => {
  const db = await getDb();
  return db.get(storeName, key);
};

/**
 * Put (upsert) a single item.
 */
export const put = async (storeName, item) => {
  const db = await getDb();
  return db.put(storeName, item);
};

/**
 * Put multiple items (replaces entire store content for that set of keys).
 */
export const putAll = async (storeName, items) => {
  const db = await getDb();
  const tx = db.transaction(storeName, 'readwrite');
  for (const item of items) {
    tx.store.put(item);
  }
  await tx.done;
};

/**
 * Clear an entire store and replace with fresh data.
 */
export const replaceAll = async (storeName, items) => {
  const db = await getDb();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.store.clear();
  for (const item of items) {
    tx.store.put(item);
  }
  await tx.done;
};

/**
 * Delete a single item by key.
 */
export const remove = async (storeName, key) => {
  const db = await getDb();
  return db.delete(storeName, key);
};

/**
 * Clear an entire store.
 */
export const clearStore = async (storeName) => {
  const db = await getDb();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.store.clear();
  await tx.done;
};

// ─────────────────────────────────────────────────────────────
// SYNC QUEUE — enqueue operations that failed offline
// ─────────────────────────────────────────────────────────────

/**
 * Add an operation to the sync queue.
 * @param {{ type: string, url: string, method: string, data: any }} operation
 */
export const enqueueSync = async (operation) => {
  const db = await getDb();
  await db.add('syncQueue', {
    ...operation,
    createdAt: new Date().toISOString(),
    retries: 0,
  });
};

/**
 * Get all pending sync operations ordered by creation date.
 */
export const getPendingSync = async () => {
  const db = await getDb();
  return db.getAllFromIndex('syncQueue', 'createdAt');
};

/**
 * Remove a completed sync operation by ID.
 */
export const removeSyncItem = async (id) => {
  const db = await getDb();
  return db.delete('syncQueue', id);
};

/**
 * Get the count of pending sync operations.
 */
export const getSyncCount = async () => {
  const db = await getDb();
  return db.count('syncQueue');
};

export default {
  getAll,
  getById,
  put,
  putAll,
  replaceAll,
  remove,
  clearStore,
  enqueueSync,
  getPendingSync,
  removeSyncItem,
  getSyncCount,
};
