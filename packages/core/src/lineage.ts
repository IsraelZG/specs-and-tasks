import { sha256 } from '@plataforma/crypto';
import { canonicalizeNode } from './signature.js';
import type { SignedNode } from './signature.js';
import type { ULID, EntityId } from './ulid.js';
import { HybridLogicalClock } from './hlc.js';
import type { StoragePort, SqlRow } from '@plataforma/protocol';

export type NodeHash = Uint8Array;

export async function hashNode(node: SignedNode): Promise<NodeHash> {
  const canonical = canonicalizeNode(node);
  return sha256(canonical);
}

// ── helpers ──

function at<T>(arr: T[], i: number): T {
  const v = arr[i];
  if (v === undefined) throw new Error(`Index ${String(i)} out of bounds (length ${String(arr.length)})`);
  return v;
}

function rowToNode(row: SqlRow): SignedNode {
  return {
    id: row['id'] as ULID,
    nodeType: row['node_type'] as string,
    payload: row['payload'] as Uint8Array,
    hlc: BigInt(row['hlc'] as string),
    publicKey: row['public_key'] as Uint8Array,
    signature: row['signature'] as Uint8Array,
  };
}

async function loadNode(storage: StoragePort, id: ULID): Promise<SignedNode> {
  const rows = await storage.exec('SELECT * FROM nodes WHERE id = ?', [id]);
  const row = rows[0];
  if (!row) throw new Error(`Node not found: ${id}`);
  return rowToNode(row);
}

async function parentOf(storage: StoragePort, nodeId: ULID): Promise<SignedNode | null> {
  const rows = await storage.exec(
    "SELECT source_id FROM edges WHERE edge_type = 'MUTATES' AND target_id = ?",
    [nodeId],
  );
  const row = rows[0];
  if (!row) return null;
  return loadNode(storage, row['source_id'] as string);
}

/** Returns ancestors of startId **excluding startId itself**. */
async function ancestors(storage: StoragePort, startId: ULID): Promise<Set<string>> {
  const visited = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const rows = await storage.exec(
      "SELECT source_id FROM edges WHERE edge_type = 'MUTATES' AND target_id = ?",
      [startId],
    );
    const row = rows[0];
    if (!row) break;
    startId = row['source_id'] as string;
    if (visited.has(startId)) break;
    visited.add(startId);
  }
  return visited;
}

// ── public API ──

export async function insertNode(
  storage: StoragePort,
  node: SignedNode,
  parentId?: ULID,
): Promise<void> {
  await storage.transaction(async () => {
    let entityId: EntityId;

    if (parentId) {
      const parent = await loadNode(storage, parentId);

      if (HybridLogicalClock.compare(node.hlc, parent.hlc) <= 0) {
        throw new Error(
          `HLC invariant: child HLC (${node.hlc.toString()}) must be > parent HLC (${parent.hlc.toString()})`,
        );
      }

      const memberRows = await storage.exec(
        'SELECT entity_id FROM entity_members WHERE node_id = ?',
        [parentId],
      );
      const memberRow = memberRows[0];
      entityId = memberRow ? (memberRow['entity_id'] as string) : parentId;

      // ponytail: ancestors excludes parentId; duplicate-ID check before cycle scan
      if (node.id === parentId) {
        throw new Error('Duplicate node ID: cannot insert node with same ID as parent');
      }
      const ancestorIds = await ancestors(storage, parentId);
      if (ancestorIds.has(node.id)) {
        throw new Error('Cycle detected: node would create a cycle in lineage');
      }
    } else {
      entityId = node.id;
    }

    await storage.exec(
      `INSERT INTO nodes (id, node_type, payload, hlc, public_key, signature)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [node.id, node.nodeType, node.payload, String(node.hlc), node.publicKey, node.signature],
    );

    await storage.exec(
      'INSERT INTO entity_members (node_id, entity_id) VALUES (?, ?)',
      [node.id, entityId],
    );

    if (parentId) {
      await storage.exec(
        `INSERT INTO edges (id, edge_type, source_id, target_id, hlc, public_key, signature)
         VALUES (?, 'MUTATES', ?, ?, ?, ?, ?)`,
        [`${parentId}->${node.id}`, parentId, node.id, String(node.hlc), node.publicKey, node.signature],
      );
    }

    const existing = await storage.exec(
      'SELECT head_hlc FROM entity_heads WHERE entity_id = ?',
      [entityId],
    );
    if (existing.length === 0) {
      await storage.exec(
        'INSERT INTO entity_heads (entity_id, head_id, head_hlc) VALUES (?, ?, ?)',
        [entityId, node.id, String(node.hlc)],
      );
    } else {
      const headRow = existing[0];
      if (!headRow) return;
      const currentHeadHlc = BigInt(headRow['head_hlc'] as string);
      if (HybridLogicalClock.compare(node.hlc, currentHeadHlc) > 0) {
        await storage.exec(
          'UPDATE entity_heads SET head_id = ?, head_hlc = ? WHERE entity_id = ?',
          [node.id, String(node.hlc), entityId],
        );
      }
    }
  });
}

export async function getLineage(
  storage: StoragePort,
  entityId: EntityId,
): Promise<SignedNode[]> {
  const head = await getHead(storage, entityId);
  if (!head) return [];

  const lineage: SignedNode[] = [head];
  let current = head;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const parent = await parentOf(storage, current.id);
    if (!parent) break;
    lineage.push(parent);
    current = parent;
  }

  return lineage;
}

export async function getHead(
  storage: StoragePort,
  entityId: EntityId,
): Promise<SignedNode | null> {
  const rows = await storage.exec(
    'SELECT head_id FROM entity_heads WHERE entity_id = ?',
    [entityId],
  );
  const row = rows[0];
  if (!row) return null;
  return loadNode(storage, row['head_id'] as string);
}

export async function validateChain(
  storage: StoragePort,
  entityId: EntityId,
): Promise<boolean> {
  const head = await getHead(storage, entityId);
  if (!head) return false;

  const lineage = await getLineage(storage, entityId);

  if (lineage.length === 0) return false;
  if (at(lineage, 0).id !== head.id) return false;

  if (lineage.length === 1) {
    const node = at(lineage, 0);
    const rootRows = await storage.exec('SELECT entity_id FROM entity_members WHERE node_id = ?', [node.id]);
    const rootRow = rootRows[0];
    return rootRow ? rootRow['entity_id'] === node.id : false;
  }

  for (let i = 0; i < lineage.length - 1; i++) {
    const child = at(lineage, i);
    const parent = at(lineage, i + 1);

    if (HybridLogicalClock.compare(child.hlc, parent.hlc) <= 0) return false;

    const edgeRows = await storage.exec(
      "SELECT id FROM edges WHERE edge_type = 'MUTATES' AND source_id = ? AND target_id = ?",
      [parent.id, child.id],
    );
    if (edgeRows.length === 0) return false;

    const childRows = await storage.exec('SELECT entity_id FROM entity_members WHERE node_id = ?', [child.id]);
    const parentRows = await storage.exec('SELECT entity_id FROM entity_members WHERE node_id = ?', [parent.id]);
    const childRow = childRows[0];
    const parentRow = parentRows[0];
    if (!childRow || !parentRow || childRow['entity_id'] !== parentRow['entity_id']) return false;
  }

  const lastNode = at(lineage, lineage.length - 1);
  const rootCheck = await storage.exec(
    "SELECT id FROM edges WHERE edge_type = 'MUTATES' AND target_id = ?",
    [lastNode.id],
  );
  if (rootCheck.length > 0) return false;

  return true;
}

export async function detectFork(
  storage: StoragePort,
  sourceId: ULID,
): Promise<boolean> {
  const rows = await storage.exec(
    "SELECT COUNT(*) as cnt FROM edges WHERE edge_type = 'MUTATES' AND source_id = ?",
    [sourceId],
  );
  const row = rows[0];
  return row ? Number(row['cnt']) > 1 : false;
}
