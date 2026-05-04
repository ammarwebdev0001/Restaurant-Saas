const DB_NAME = 'restaurant-saas-offline';
const DB_VERSION = 1;
const STORE = 'orderOutbox';

export type OutboxKind = 'customer_order' | 'kiosk_order';

export type OutboxRecord = {
  idempotencyKey: string;
  url: string;
  body: string;
  kind: OutboxKind;
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('IDB open failed'));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'idempotencyKey' });
      }
    };
  });
}

export async function enqueueOrderOutbox(record: OutboxRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('enqueue failed'));
    tx.objectStore(STORE).put(record);
  });
  db.close();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-outbox-changed'));
  }
}

export async function listOrderOutbox(): Promise<OutboxRecord[]> {
  const db = await openDb();
  const rows = await new Promise<OutboxRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as OutboxRecord[]) ?? []);
    req.onerror = () => reject(req.error ?? new Error('list failed'));
  });
  db.close();
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeOrderOutboxKey(idempotencyKey: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('remove failed'));
    tx.objectStore(STORE).delete(idempotencyKey);
  });
  db.close();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-outbox-changed'));
  }
}

export async function countOrderOutbox(): Promise<number> {
  const list = await listOrderOutbox();
  return list.length;
}
