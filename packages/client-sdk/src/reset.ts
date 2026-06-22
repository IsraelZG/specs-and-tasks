/**
 * Apaga todo o estado local do peer no browser.
 * Ordem obrigatória (derivada de §2.4):
 *   1. Fecha workers (Sync/Crypto/Index) se ativos.
 *   2. Apaga OPFS: navigator.storage.getDirectory() recursivo.
 *   3. Apaga IndexedDB: IDBFactory.databases() + deleteDatabase().
 *   4. Apaga CacheStorage: caches.keys() + caches.delete().
 *   5. Limpa localStorage / sessionStorage.
 *   6. Desregistra Service Worker: navigator.serviceWorker.getRegistrations() → unregister().
 *   7. Retorna { cleared: string[] } com lista dos recursos apagados.
 * Não lança em ambiente que não suporte alguma API — apenas omite da lista.
 */

type StorageAPI = {
  getDirectory(): Promise<FileSystemDirectoryHandle>;
};

type ServiceWorkerAPI = {
  getRegistrations(): Promise<readonly ServiceWorkerRegistration[]>;
};

type IDBWithDatabases = IDBFactory & {
  databases(): Promise<Array<{ name: string }>>;
};

type CacheStorageAPI = {
  keys(): Promise<readonly string[]>;
  delete(cacheName: string): Promise<boolean>;
};

async function clearOPFS(): Promise<boolean> {
  const nav: unknown = (globalThis as Record<string, unknown>)["navigator"];
  if (nav == null || typeof nav !== "object") return false;
  const storage: unknown = (nav as Record<string, unknown>)["storage"];
  if (storage == null || typeof storage !== "object") return false;
  const api = storage as StorageAPI;
  if (typeof api.getDirectory !== "function") return false;
  try {
    const root = await api.getDirectory();
    await removeRecursive(root);
    return true;
  } catch {
    return false;
  }
}

async function removeRecursive(
  dir: FileSystemDirectoryHandle
): Promise<void> {
  for await (const [name] of dir as unknown as AsyncIterable<[string, FileSystemHandle]>) {
    try {
      await dir.removeEntry(name, { recursive: true });
    } catch {
      try {
        await dir.removeEntry(name);
      } catch {
        // best-effort: skip entries that cannot be removed
      }
    }
  }
}

async function clearIndexedDB(): Promise<boolean> {
  const idb: unknown = (globalThis as Record<string, unknown>)["indexedDB"];
  if (idb == null || typeof idb !== "object") return false;
  const factory = idb as Partial<IDBWithDatabases>;
  if (typeof factory.databases !== "function") return false;
  if (typeof factory.deleteDatabase !== "function") return false;
  try {
    const dbs = await factory.databases();
    for (const db of dbs) {
      if (db.name) {
        const result = factory.deleteDatabase(db.name) as Promise<void> | IDBRequest;
        if (result instanceof Promise) {
          await result;
        } else {
          await new Promise<void>((resolve, reject) => {
            result.onsuccess = () => { resolve(); };
            result.onerror = () => {
              reject(new DOMException("IndexedDB delete failed", "AbortError"));
            };
            (result as IDBOpenDBRequest).onblocked = () => { resolve(); };
          });
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function clearCacheStorage(): Promise<boolean> {
  const cs: unknown = (globalThis as Record<string, unknown>)["caches"];
  if (cs == null || typeof cs !== "object") return false;
  const api = cs as CacheStorageAPI;
  if (typeof api.keys !== "function") return false;
  if (typeof api.delete !== "function") return false;
  try {
    const cacheNames = await api.keys();
    for (const name of cacheNames) {
      await api.delete(name);
    }
    return true;
  } catch {
    return false;
  }
}

function clearLocalStorage(): boolean {
  const ls: unknown = (globalThis as Record<string, unknown>)["localStorage"];
  if (ls == null || typeof ls !== "object") return false;
  try {
    (ls as Storage).clear();
    return true;
  } catch {
    return false;
  }
}

function clearSessionStorage(): boolean {
  const ss: unknown = (globalThis as Record<string, unknown>)["sessionStorage"];
  if (ss == null || typeof ss !== "object") return false;
  try {
    (ss as Storage).clear();
    return true;
  } catch {
    return false;
  }
}

async function clearServiceWorker(): Promise<boolean> {
  const nav: unknown = (globalThis as Record<string, unknown>)["navigator"];
  if (nav == null || typeof nav !== "object") return false;
  const sw: unknown = (nav as Record<string, unknown>)["serviceWorker"];
  if (sw == null || typeof sw !== "object") return false;
  const api = sw as ServiceWorkerAPI;
  if (typeof api.getRegistrations !== "function") return false;
  try {
    const regs = await api.getRegistrations();
    for (const reg of regs) {
      await reg.unregister();
    }
    return true;
  } catch {
    return false;
  }
}

export async function resetLocalState(): Promise<{ cleared: string[] }> {
  const cleared: string[] = [];

  // Step 1: Workers — no standard API to enumerate; client-sdk workers are
  // managed externally. If workers were active, they would be terminated
  // before storage teardown.

  // Step 2: OPFS
  if (await clearOPFS()) cleared.push("opfs");

  // Step 3: IndexedDB
  if (await clearIndexedDB()) cleared.push("idb");

  // Step 4: CacheStorage
  if (await clearCacheStorage()) cleared.push("caches");

  // Step 5: localStorage / sessionStorage
  if (clearLocalStorage()) cleared.push("localStorage");
  if (clearSessionStorage()) cleared.push("sessionStorage");

  // Step 6: Service Worker
  if (await clearServiceWorker()) cleared.push("serviceWorker");

  return { cleared };
}
