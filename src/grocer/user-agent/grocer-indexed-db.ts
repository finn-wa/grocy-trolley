/// <reference lib="dom" />

import { Page } from "playwright";

export interface ListItem {
  id: number;
  quantity: number;
  isChecked: boolean;
}

export interface StoreContents {
  list: ListItem[];
  selectedStoreIds?: number[];
}

/**
 * Contains functions to be evaluated in browser with Playwright on
 * {@link https://grocer.nz/}
 */
interface GrocerIndexedDB {
  /**
   * Reads the keyval object store and returns the data as a plain object.
   * @returns Store contents
   */
  getStoreContents(): Promise<StoreContents>;

  /**
   * Replaces the keyval object store with the given data.
   * @param contents Store contents to write
   */
  putStoreContents(contents: StoreContents): Promise<void>;

  /**
   * Puts all of the the entries in the contents object in the store, replacing
   * any existing values.
   * @param contents key-value pairs to set on store
   */
  patchStoreContents(contents: Partial<StoreContents>): Promise<void>;
}

/**
 * Creates {@link GrocerIndexedDB} instance and adds it to the 'gt' property of
 * the window object of the page. Does nothing if window.gt already exists.
 * @param page Playwright page
 */
async function registerGtUtils(page: Page): Promise<void> {
  return page.evaluate(() => {
    if ("gt" in window) {
      return;
    }
    class GrocerIndexedDBImpl implements GrocerIndexedDB {
      async getStoreContents(): Promise<StoreContents> {
        const store = this.getObjectStore(await this.getIndexedDB(), "readonly");
        const keys = await this.doRequest(store, (s) => s.getAllKeys());
        type Value = Required<StoreContents>[keyof StoreContents];
        // TODO: parse the values?
        const values = await this.doRequest<Value>(store, (s) => s.getAll());
        // Zip keys and values together
        return keys.reduce(
          (acc, key, i) => ({ ...acc, [key.toString()]: values[i] }),
          {}
        ) as StoreContents;
      }

      async patchStoreContents(contents: Partial<StoreContents>): Promise<void> {
        const store = this.getObjectStore(await this.getIndexedDB(), "readwrite");
        await Promise.all(
          Object.entries(contents).map(([key, value]) =>
            this.doRequest(store, (s) => s.put(value, key))
          )
        );
      }

      async putStoreContents(contents: StoreContents): Promise<void> {
        const store = this.getObjectStore(await this.getIndexedDB(), "readwrite");
        const existingKeys = await this.doRequest(store, (s) => s.getAllKeys());
        const toDelete = Object.keys(contents).filter((key) => !existingKeys.includes(key));
        if (toDelete.length > 0) {
          await Promise.all(toDelete.map((key) => this.doRequest(store, (s) => s.delete(key))));
        }
        return this.patchStoreContents(contents);
      }

      private getIndexedDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open("keyval-store");
          request.onerror = () => reject(`Failed to open the database: ${this.pp(request.error)}`);
          request.onsuccess = () => {
            const db = request.result;
            db.onerror = (event) => {
              throw new Error(`Database error: ${this.pp(event.target)}`);
            };
            resolve(db);
          };
        });
      }

      private getObjectStore(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
        const transaction = db.transaction("keyval", mode);
        return transaction.objectStore("keyval");
      }

      private doRequest<T>(
        store: IDBObjectStore,
        requestFactory: (store: IDBObjectStore) => IDBRequest<T>
      ): Promise<T> {
        return new Promise((resolve, reject) => {
          const request = requestFactory(store);
          request.onerror = () => reject(`Object store request failed: ${this.pp(request.error)}`);
          request.onsuccess = () => resolve(request.result);
        });
      }

      /** Pretty-print */
      private pp(obj: unknown): string {
        // Can't use prettyPrint from logger-utils because the browser won't get the import
        return JSON.stringify(obj, undefined, 2);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (window as unknown as any).gt = new GrocerIndexedDBImpl();
  });
}

/**
 * Reads the keyval object store and returns the data as a plain object.
 * @returns Store contents
 */
export async function getStoreContents(page: Page): Promise<StoreContents> {
  await registerGtUtils(page);
  // Hack to allow the evaluated function to use gt global
  let gt!: GrocerIndexedDB;
  return page.evaluate(() => gt.getStoreContents());
}

/**
 * Replaces the entire keyval object store with the given data.
 * @param contents Store contents to write
 */
export async function putStoreContents(page: Page, contents: StoreContents): Promise<void> {
  await registerGtUtils(page);
  // Hack to allow the evaluated function to use gt global
  let gt!: GrocerIndexedDB;
  return page.evaluate((contents) => gt.putStoreContents(contents), contents);
}

/**
 * Puts all of the the entries in the contents object in the store, replacing
 * any existing values.
 * @param contents key-value pairs to set on store
 */
export async function patchStoreContents(
  page: Page,
  contents: Partial<StoreContents>
): Promise<void> {
  await registerGtUtils(page);
  // Hack to allow the evaluated function to use gt global
  let gt!: GrocerIndexedDB;
  return page.evaluate((contents) => gt.patchStoreContents(contents), contents);
}
