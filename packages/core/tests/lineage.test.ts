import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import type { StoragePort, SqlRow } from '@plataforma/protocol';
import { ed25519GenerateKeyPair } from '@plataforma/crypto';
import { signNode } from '../src/signature.js';
import type { SignedNode, SignedEdge } from '../src/signature.js';
import type { ULID } from '../src/ulid.js';
import { ULIDFactory } from '../src/ulid.js';
import { VirtualClock, SeededRandom } from '@plataforma/testkit';
import { HybridLogicalClock } from '../src/hlc.js';
import { MIGRATIONS, migrateSchema } from '../src/schema.js';
import {
  hashNode,
  insertNode,
  getLineage,
  getHead,
  validateChain,
  detectFork,
} from '../src/lineage.js';

// ── helpers ──

function createDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  return db;
}

function storageFromDb(db: Database.Database): StoragePort {
  return {
    exec(sql: string, params?: unknown[]): Promise<SqlRow[]> {
      // Determine if this is a mutation or a query
      const trimmed = sql.trimStart();
      const isMutation = /^(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(trimmed);

      if (isMutation) {
        const stmt = db.prepare(sql);
        if (params && params.length > 0) {
          return Promise.resolve(stmt.run(...params) as unknown as SqlRow[]);
        }
        return Promise.resolve(stmt.run() as unknown as SqlRow[]);
      }

      const stmt = db.prepare(sql);
      if (params && params.length > 0) {
        return Promise.resolve(stmt.all(...params) as SqlRow[]);
      }
      return Promise.resolve(stmt.all() as SqlRow[]);
    },
    transaction<T>(fn: () => Promise<T>): Promise<T> {
      // :memory: SQLite is single-connection — just run the async fn directly.
      // (better-sqlite3 transactions reject Promise-returning functions.)
      return fn();
    },
    migrate(migrations: Array<{ version: number; sql: string }>): Promise<void> {
      for (const m of migrations) db.exec(m.sql);
      return Promise.resolve();
    },
  };
}

let clockMs = 1_000_000;
const random = new SeededRandom('lineage-test-seed');

function nextClock(): VirtualClock {
  return new VirtualClock(++clockMs);
}

function makeHlc(pt: number, c = 0): bigint {
  return HybridLogicalClock.pack(pt, c);
}

async function makeNode(overrides?: Partial<SignedNode>): Promise<SignedNode> {
  const factory = new ULIDFactory({ clock: nextClock(), random });
  const keys = await ed25519GenerateKeyPair();
  const unsigned = {
    id: overrides?.id ?? factory.generate(),
    nodeType: overrides?.nodeType ?? 'ASSET',
    payload: overrides?.payload ?? new Uint8Array([1]),
    hlc: overrides?.hlc ?? makeHlc(1_000_000),
    publicKey: overrides?.publicKey ?? keys.publicKey,
  };
  return signNode(unsigned, keys.privateKey);
}

function makeEdge(
  sourceId: ULID,
  targetId: ULID,
  hlc: bigint,
): SignedEdge {
  const factory = new ULIDFactory({ clock: nextClock(), random });
  const id = factory.generate();
  return {
    id,
    edgeType: 'MUTATES',
    sourceId,
    targetId,
    payload: null,
    hlc,
    publicKey: new Uint8Array(32).fill(1),
    signature: new Uint8Array(64).fill(9),
  };
}

// ── tests ──

describe('Lineage Layer 2', () => {
  let db: Database.Database;
  let storage: StoragePort;

  beforeEach(async () => {
    db = createDb();
    storage = storageFromDb(db);
    await migrateSchema(storage);
  });

  it('1: insertNode(nó-raiz) — entity_id = id, entity_heads com 1 registro', async () => {
    const root = await makeNode();
    await insertNode(storage, root);

    const rows = db.prepare('SELECT * FROM entity_heads WHERE entity_id = ?').all(root.id) as SqlRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0]!.head_id).toBe(root.id);
  });

  it('2: insertNode(filho, parentId=raiz) — entity_id herdado, head atualizado', async () => {
    const root = await makeNode();
    await insertNode(storage, root);

    const child = await makeNode({ hlc: makeHlc(2_000_000) });
    await insertNode(storage, child, root.id);

    // child herdou entity_id do root
    const childRow = db.prepare('SELECT entity_id FROM entity_members WHERE node_id = ?').get(child.id) as SqlRow;
    expect(childRow!.entity_id).toBe(root.id);

    // entity_heads atualizado para o child
    const headRow = db.prepare('SELECT head_id FROM entity_heads WHERE entity_id = ?').get(root.id) as SqlRow;
    expect(headRow!.head_id).toBe(child.id);
  });

  it('3: insertNode com HLC(filho) ≤ HLC(pai) → erro', async () => {
    const root = await makeNode({ hlc: makeHlc(2_000_000) });
    await insertNode(storage, root);

    const child = await makeNode({ hlc: makeHlc(1_000_000) }); // menor que o pai
    await expect(insertNode(storage, child, root.id)).rejects.toThrow(
      /hlc/i,
    );
  });

  it('4: insertNode com parentHash errado → erro', async () => {
    const root = await makeNode();
    await insertNode(storage, root);

    const child = await makeNode({ hlc: makeHlc(2_000_000) });
    // Simula parentHash errado passando um parentId que não existe
    await expect(insertNode(storage, child, 'NONEXISTENTPARENTID')).rejects.toThrow();
  });

  it('5: getLineage(entityId) retorna [head, ..., raiz] em ordem reversa', async () => {
    const root = await makeNode({ hlc: makeHlc(1_000_000) });
    await insertNode(storage, root);

    const child1 = await makeNode({ hlc: makeHlc(2_000_000) });
    await insertNode(storage, child1, root.id);

    const child2 = await makeNode({ hlc: makeHlc(3_000_000) });
    await insertNode(storage, child2, child1.id);

    const lineage = await getLineage(storage, root.id);
    expect(lineage).toHaveLength(3);
    expect(lineage[0]!.id).toBe(child2.id); // head primeiro
    expect(lineage[1]!.id).toBe(child1.id);
    expect(lineage[2]!.id).toBe(root.id);   // raiz por último
  });

  it('6: getHead(entityId) retorna nó com maior HLC', async () => {
    const root = await makeNode({ hlc: makeHlc(1_000_000) });
    await insertNode(storage, root);

    const child = await makeNode({ hlc: makeHlc(5_000_000) });
    await insertNode(storage, child, root.id);

    const head = await getHead(storage, root.id);
    expect(head).not.toBeNull();
    expect(head!.id).toBe(child.id);
  });

  it('7: validateChain — true para cadeia íntegra, false se adulterada', async () => {
    const root = await makeNode({ hlc: makeHlc(1_000_000) });
    await insertNode(storage, root);

    const child = await makeNode({ hlc: makeHlc(2_000_000) });
    await insertNode(storage, child, root.id);

    expect(await validateChain(storage, root.id)).toBe(true);

    // Adultera: remove a aresta MUTATES
    db.prepare("DELETE FROM edges WHERE edge_type = 'MUTATES' AND target_id = ?").run(child.id);

    // Cadeia quebrada: child não tem pai, mas também não é raiz original
    expect(await validateChain(storage, root.id)).toBe(false);
  });

  it('8: detectFork — 2 filhos do mesmo pai → fork detectado', async () => {
    const root = await makeNode({ hlc: makeHlc(1_000_000) });
    await insertNode(storage, root);

    const child1 = await makeNode({ hlc: makeHlc(2_000_000) });
    await insertNode(storage, child1, root.id);

    const child2 = await makeNode({ hlc: makeHlc(3_000_000) });
    await insertNode(storage, child2, root.id);

    expect(await detectFork(storage, root.id)).toBe(true);
  });

  it('9: ciclo A→B→tentar A → erro', async () => {
    const a = await makeNode({ hlc: makeHlc(1_000_000) });
    await insertNode(storage, a);

    const b = await makeNode({ hlc: makeHlc(2_000_000) });
    await insertNode(storage, b, a.id);

    // Tenta inserir nó com mesmo ID de A como filho de B (ciclo: A→B→A')
    const a2 = await makeNode({ id: a.id, hlc: makeHlc(3_000_000) });
    await expect(insertNode(storage, a2, b.id)).rejects.toThrow(/cycle/i);
  });

  it('10: linhagem com 100 nós — validateChain percorre toda a cadeia', async () => {
    let parentId: ULID | undefined;
    const root = await makeNode({ hlc: makeHlc(1) });
    await insertNode(storage, root);
    parentId = root.id;

    for (let i = 0; i < 99; i++) {
      const node = await makeNode({ hlc: makeHlc(2 + i) });
      await insertNode(storage, node, parentId);
      parentId = node.id;
    }

    expect(await validateChain(storage, root.id)).toBe(true);
    const lineage = await getLineage(storage, root.id);
    expect(lineage).toHaveLength(100);
  });
});
