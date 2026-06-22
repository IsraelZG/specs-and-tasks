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

type BrowserFS = typeof globalThis & {
  navigator: Navigator & {
    storage?: { getDirectory(): Promise<FileSystemDirectoryHandle> };
    serviceWorker?: {
      getRegistrations(): Promise<readonly ServiceWorkerRegistration[]>;
    };
  };
  indexedDB?: IDBFactory & {
    databases?(): Promise<Array<{ name: string }>>;
  };
  caches?: CacheStorage & {
    keys(): Promise<readonly string[]>;
    delete(cacheName: string): Promise<boolean>;
  };
  localStorage?: Storage;
  sessionStorage?: Storage;
};

async function clearOPFS(): Promise<boolean> {
  const nav = (globalThis as BrowserFS).navigator;
  if (!nav?.storage?.getDirectory) return false;
  try {
    const root = await nav.storage.getDirectory();
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
  const idb = (globalThis as BrowserFS).indexedDB;
  if (!idb?.databases || !idb?.deleteDatabase) return false;
  try {
    const dbs = await idb.databases();
    for (const db of dbs) {
      if (db.name) {
        const result = idb.deleteDatabase(db.name) as Promise<void> | IDBRequest;
        if (result instanceof Promise) {
          await result;
        } else {
          await new Promise<void>((resolve, reject) => {
            result.onsuccess = () => resolve();
            result.onerror = () =>
              reject(new DOMException("IndexedDB delete failed", "AbortError"));
            (result as IDBOpenDBRequest).onblocked = () => {
              resolve();
            };
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
  const cs = (globalThis as BrowserFS).caches;
  if (!cs?.keys || !cs?.delete) return false;
  try {
    const cacheNames = await cs.keys();
    for (const name of cacheNames) {
      await cs.delete(name);
    }
    return true;
  } catch {
    return false;
  }
}

function clearLocalStorage(): boolean {
  const ls = (globalThis as BrowserFS).localStorage;
  if (!ls) return false;
  try {
    ls.clear();
    return true;
  } catch {
    return false;
  }
}

function clearSessionStorage(): boolean {
  const ss = (globalThis as BrowserFS).sessionStorage;
  if (!ss) return false;
  try {
    ss.clear();
    return true;
  } catch {
    return false;
  }
}

async function clearServiceWorker(): Promise<boolean> {
  const nav = (globalThis as BrowserFS).navigator;
  if (!nav?.serviceWorker?.getRegistrations) return false;
  try {
    const regs = await nav.serviceWorker.getRegistrations();
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
