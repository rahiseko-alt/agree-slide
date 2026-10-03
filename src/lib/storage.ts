import { bundleSchema, type GuideBundle } from '../content/schema';

const DB_NAME = 'interactive-guide';
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('content');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readDraft(): Promise<GuideBundle | null> {
  const db = await database();
  try {
    const value = await new Promise((resolve, reject) => {
      const req = db.transaction('content').objectStore('content').get('draft');
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    return value ? bundleSchema.parse(value) : null;
  } finally { db.close(); }
}
export async function writeDraft(bundle: GuideBundle | null): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('content', 'readwrite');
      if (bundle) tx.objectStore('content').put(bundle, 'draft'); else tx.objectStore('content').delete('draft');
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? new Error('Storage aborted'));
    });
  } finally { db.close(); }
}
export function readPreference(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
export function savePreference(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Navigation still works without persistence. */ } }
