import { describe, it, expect, vi } from 'vitest';
import type { StoragePort, SqlRow } from '@plataforma/protocol';
import Database from 'better-sqlite3';
import { MIGRATIONS, migrateSchema } from '../src/schema';

function mockStorage(): StoragePort {
  const migrateFn = vi.fn();
  return {
    exec: vi.fn(),
    transaction: vi.fn(),
    migrate: migrateFn,
  };
}

function createDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  return db;
}

function storageFromDb(db: Database.Database): StoragePort {
  return {
    exec(sql: string, params?: unknown[]): Promise<SqlRow[]> {
      const stmt = db.prepare(sql);
      if (params && params.length > 0) {
        return Promise.resolve(stmt.all(...params) as SqlRow[]);
      }
      return Promise.resolve(stmt.all() as SqlRow[]);
    },
    transaction<T>(fn: () => Promise<T>): Promise<T> {
      const run = db.transaction(() => {
        // better-sqlite3 transactions are sync; we wrap
        return fn();
      });
      return Promise.resolve(run());
    },
    migrate(migrations: Array<{ version: number; sql: string }>): Promise<void> {
      for (const m of migrations) {
        db.exec(m.sql);
      }
      return Promise.resolve();
    },
  };
}

describe('Schema SQLite', () => {
  it('1: migrateSchema(mockStorage) chama storage.migrate() com MIGRATIONS', async () => {
    const storage = mockStorage();
    await migrateSchema(storage);
    expect(storage.migrate).toHaveBeenCalledWith(MIGRATIONS);
  });

  it('2: DDL cria tabelas nodes e edges', async () => {
    const db = createDb();
    const storage = storageFromDb(db);
    await migrateSchema(storage);
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('nodes','edges')"
    ).all() as Array<{ name: string }>;
    expect(tables.map(t => t.name).sort()).toEqual(['edges', 'nodes']);
  });

  it('3: INSERT em nodes com campos obrigatórios funciona, SELECT retorna', async () => {
    const db = createDb();
    const storage = storageFromDb(db);
    await migrateSchema(storage);

    db.prepare(`INSERT INTO nodes (id, node_type, payload, hlc, public_key, signature)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      'PROFILE',
      new Uint8Array([1, 2, 3]),
      '0000000000000000000-0000000000000000000',
      new Uint8Array(32),
      new Uint8Array(64)
    );

    const rows = db.prepare('SELECT * FROM nodes WHERE id = ?').all('01ARZ3NDEKTSV4RRFFQ69G5FAV') as SqlRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0]!.node_type).toBe('PROFILE');
  });

  it('4: INSERT em edges com FK para nodes existente funciona', async () => {
    const db = createDb();
    const storage = storageFromDb(db);
    await migrateSchema(storage);

    db.prepare(`INSERT INTO nodes (id, node_type, payload, hlc, public_key, signature)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      'n1', 'ASSET', new Uint8Array([1]), 'hlc', new Uint8Array(32), new Uint8Array(64)
    );
    db.prepare(`INSERT INTO nodes (id, node_type, payload, hlc, public_key, signature)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      'n2', 'ASSET', new Uint8Array([2]), 'hlc', new Uint8Array(32), new Uint8Array(64)
    );

    db.prepare(`INSERT INTO edges (id, edge_type, source_id, target_id, hlc, public_key, signature)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'e1', 'MUTATES', 'n1', 'n2', 'hlc', new Uint8Array(32), new Uint8Array(64)
    );

    const rows = db.prepare('SELECT * FROM edges WHERE id = ?').all('e1') as SqlRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0]!.edge_type).toBe('MUTATES');
  });

  it('5: INSERT em edges com FK inexistente → erro de constraint', async () => {
    const db = createDb();
    const storage = storageFromDb(db);
    await migrateSchema(storage);

    expect(() => {
      db.prepare(`INSERT INTO edges (id, edge_type, source_id, target_id, hlc, public_key, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        'e_bad', 'MUTATES', 'ghost', 'ghost2', 'hlc', new Uint8Array(32), new Uint8Array(64)
      );
    }).toThrow();
  });

  it('6: migrateSchema é idempotente (rodar 2× não quebra)', async () => {
    const db = createDb();
    const storage = storageFromDb(db);
    await migrateSchema(storage);
    await migrateSchema(storage); // segunda vez não deve quebrar

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('nodes','edges')"
    ).all() as Array<{ name: string }>;
    expect(tables.map(t => t.name).sort()).toEqual(['edges', 'nodes']);
  });

  it('7: Índices existem', async () => {
    const db = createDb();
    const storage = storageFromDb(db);
    await migrateSchema(storage);

    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
    ).all() as Array<{ name: string }>;
    const names = indexes.map(i => i.name).sort();
    expect(names).toEqual([
      'idx_edges_source',
      'idx_edges_target',
      'idx_edges_type',
      'idx_entity_heads_head',
      'idx_entity_members_entity',
      'idx_nodes_type',
    ]);
  });
});
