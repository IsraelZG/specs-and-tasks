import { describe, test, expect, vi, beforeEach } from "vitest";
import { resetLocalState } from "../src/reset.js";

function createOPFSMock(files: string[]) {
  const root: Record<string, FileSystemFileHandle | FileSystemDirectoryHandle> = {};
  const mockDirHandle = {
    kind: "directory" as const,
    name: "",
    async *[Symbol.asyncIterator]() {
      for (const f of files) {
        yield f;
      }
    },
    getDirectoryHandle: vi.fn(),
    getFileHandle: vi.fn(),
    removeEntry: vi.fn().mockResolvedValue(undefined),
    resolve: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
  };
  return mockDirHandle;
}

describe("resetLocalState", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("1: clear OPFS via navigator.storage.getDirectory()", async () => {
    const removeEntry = vi.fn().mockResolvedValue(undefined);
    const dirHandle = {
      kind: "directory" as const,
      name: "root",
      async *[Symbol.asyncIterator]() {
        yield "foo.bin";
        yield "bar/";
      },
      getDirectoryHandle: vi.fn().mockResolvedValue({
        kind: "directory" as const,
        name: "bar",
        async *[Symbol.asyncIterator]() {
          yield "baz.bin";
        },
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        removeEntry: vi.fn().mockResolvedValue(undefined),
        resolve: vi.fn(),
        keys: vi.fn(),
        values: vi.fn(),
        entries: vi.fn(),
      }),
      getFileHandle: vi.fn(),
      removeEntry,
      resolve: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(),
    };

    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn().mockResolvedValue(dirHandle) },
      serviceWorker: {
        getRegistrations: vi.fn().mockResolvedValue([]),
      },
    });
    vi.stubGlobal("indexedDB", {
      databases: vi.fn().mockResolvedValue([]),
      deleteDatabase: vi.fn().mockResolvedValue(undefined),
    });
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true),
    });
    vi.stubGlobal("localStorage", {
      clear: vi.fn(),
    });
    vi.stubGlobal("sessionStorage", {
      clear: vi.fn(),
    });

    const result = await resetLocalState();
    expect(result.cleared).toContain("opfs");
    expect(removeEntry).toHaveBeenCalled();
  });

  test("2: clear IndexedDB via databases() + deleteDatabase()", async () => {
    const deleteDatabase = vi.fn().mockResolvedValue(undefined);
    const databases = vi.fn().mockResolvedValue([
      { name: "db1" },
      { name: "db2" },
    ]);

    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn().mockResolvedValue(createOPFSMock([])) },
      serviceWorker: {
        getRegistrations: vi.fn().mockResolvedValue([]),
      },
    });
    vi.stubGlobal("indexedDB", { databases, deleteDatabase });
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true),
    });
    vi.stubGlobal("localStorage", { clear: vi.fn() });
    vi.stubGlobal("sessionStorage", { clear: vi.fn() });

    const result = await resetLocalState();
    expect(result.cleared).toContain("idb");
    expect(deleteDatabase).toHaveBeenCalledTimes(2);
    expect(deleteDatabase).toHaveBeenCalledWith("db1");
    expect(deleteDatabase).toHaveBeenCalledWith("db2");
  });

  test("3: clear CacheStorage via caches.keys() + caches.delete()", async () => {
    const cacheDelete = vi.fn().mockResolvedValue(true);
    const cacheKeys = vi.fn().mockResolvedValue(["v1", "v2"]);

    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn().mockResolvedValue(createOPFSMock([])) },
      serviceWorker: {
        getRegistrations: vi.fn().mockResolvedValue([]),
      },
    });
    vi.stubGlobal("indexedDB", {
      databases: vi.fn().mockResolvedValue([]),
      deleteDatabase: vi.fn().mockResolvedValue(undefined),
    });
    vi.stubGlobal("caches", { keys: cacheKeys, delete: cacheDelete });
    vi.stubGlobal("localStorage", { clear: vi.fn() });
    vi.stubGlobal("sessionStorage", { clear: vi.fn() });

    const result = await resetLocalState();
    expect(result.cleared).toContain("caches");
    expect(cacheDelete).toHaveBeenCalledTimes(2);
    expect(cacheDelete).toHaveBeenCalledWith("v1");
    expect(cacheDelete).toHaveBeenCalledWith("v2");
  });

  test("4: clear localStorage and sessionStorage", async () => {
    const lsClear = vi.fn();
    const ssClear = vi.fn();

    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn().mockResolvedValue(createOPFSMock([])) },
      serviceWorker: {
        getRegistrations: vi.fn().mockResolvedValue([]),
      },
    });
    vi.stubGlobal("indexedDB", {
      databases: vi.fn().mockResolvedValue([]),
      deleteDatabase: vi.fn().mockResolvedValue(undefined),
    });
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true),
    });
    vi.stubGlobal("localStorage", { clear: lsClear });
    vi.stubGlobal("sessionStorage", { clear: ssClear });

    const result = await resetLocalState();
    expect(result.cleared).toContain("localStorage");
    expect(result.cleared).toContain("sessionStorage");
    expect(lsClear).toHaveBeenCalledOnce();
    expect(ssClear).toHaveBeenCalledOnce();
  });

  test("5: unregister Service Workers", async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn().mockResolvedValue([
      { unregister, scope: "/" },
    ]);

    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn().mockResolvedValue(createOPFSMock([])) },
      serviceWorker: { getRegistrations },
    });
    vi.stubGlobal("indexedDB", {
      databases: vi.fn().mockResolvedValue([]),
      deleteDatabase: vi.fn().mockResolvedValue(undefined),
    });
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true),
    });
    vi.stubGlobal("localStorage", { clear: vi.fn() });
    vi.stubGlobal("sessionStorage", { clear: vi.fn() });

    const result = await resetLocalState();
    expect(result.cleared).toContain("serviceWorker");
    expect(unregister).toHaveBeenCalledOnce();
  });

  test("6: returns cleared array with all expected keys when all APIs available", async () => {
    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn().mockResolvedValue(createOPFSMock([])) },
      serviceWorker: {
        getRegistrations: vi.fn().mockResolvedValue([
          { unregister: vi.fn().mockResolvedValue(true) },
        ]),
      },
    });
    vi.stubGlobal("indexedDB", {
      databases: vi.fn().mockResolvedValue([{ name: "db" }]),
      deleteDatabase: vi.fn().mockResolvedValue(undefined),
    });
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue(["v1"]),
      delete: vi.fn().mockResolvedValue(true),
    });
    vi.stubGlobal("localStorage", { clear: vi.fn() });
    vi.stubGlobal("sessionStorage", { clear: vi.fn() });

    const result = await resetLocalState();
    expect(result.cleared).toEqual(
      expect.arrayContaining([
        "opfs",
        "idb",
        "caches",
        "localStorage",
        "sessionStorage",
        "serviceWorker",
      ])
    );
  });

  test("7: missing API does not throw, omits from cleared", async () => {
    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn().mockResolvedValue(createOPFSMock([])) },
      // serviceWorker intentionally undefined
    });
    vi.stubGlobal("indexedDB", {
      databases: vi.fn().mockResolvedValue([]),
      deleteDatabase: vi.fn().mockResolvedValue(undefined),
    });
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true),
    });
    vi.stubGlobal("localStorage", { clear: vi.fn() });
    vi.stubGlobal("sessionStorage", { clear: vi.fn() });

    const result = await resetLocalState();
    expect(result.cleared).not.toContain("serviceWorker");
    expect(result.cleared).toContain("opfs");
    expect(result.cleared).toContain("idb");
    expect(result.cleared).toContain("caches");
    expect(result.cleared).toContain("localStorage");
    expect(result.cleared).toContain("sessionStorage");
  });

  test("7b: missing indexedDB.databases gracefully handled", async () => {
    vi.stubGlobal("navigator", {
      storage: { getDirectory: vi.fn().mockResolvedValue(createOPFSMock([])) },
      serviceWorker: {
        getRegistrations: vi.fn().mockResolvedValue([]),
      },
    });
    vi.stubGlobal("indexedDB", {}); // no databases method
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true),
    });
    vi.stubGlobal("localStorage", { clear: vi.fn() });
    vi.stubGlobal("sessionStorage", { clear: vi.fn() });

    const result = await resetLocalState();
    expect(result.cleared).not.toContain("idb");
  });
});
