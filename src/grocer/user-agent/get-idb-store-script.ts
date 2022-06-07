/// <reference lib="dom" />

/**
 * Reads the specified indexedDB object store and returns the data as a JSON
 * object. Designed to be evaluated in browser with Playwright.
 * @param storeName IndexedDB store name
 * @returns Store contents as a plain object
 */
export async function getIDBStoreAsObject<T extends Record<string, unknown>>(
  storeName = "keyval-store"
): Promise<T> {
  const pp = (value: unknown) => JSON.stringify(value, undefined, 2);

  function getIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(storeName);
      request.onerror = () => reject(`Failed to open the database: ${pp(request.error)}`);
      request.onsuccess = () => {
        const db = request.result;
        db.onerror = (event) => {
          throw new Error(`Database error: ${pp(event.target)}`);
        };
        resolve(db);
      };
    });
  }

  function objStoreRequest<T>(
    db: IDBDatabase,
    requestFactory: (objStore: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("keyval", "readonly");
      const objectStore = transaction.objectStore("keyval");
      const request = requestFactory(objectStore);
      request.onerror = () => reject(`Object store request failed: ${pp(request.error)}`);
      request.onsuccess = () => resolve(request.result);
    });
  }

  const db = await getIndexedDB();
  const keys = await objStoreRequest(db, (objStore) => objStore.getAllKeys());
  const values = await objStoreRequest(db, (objStore) => objStore.getAll());
  // Zip keys and values together
  return keys.reduce((acc, key, i) => ({ ...acc, [key.toString()]: values[i] }), {} as T);
}
