import type { StoragePort } from '@plataforma/protocol';

const DDL = `
CREATE TABLE IF NOT EXISTS nodes (
  id          TEXT    NOT NULL PRIMARY KEY,
  node_type   TEXT    NOT NULL,
  payload     BLOB    NOT NULL,
  hlc         TEXT    NOT NULL,
  public_key  BLOB    NOT NULL,
  signature   BLOB    NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS edges (
  id          TEXT    NOT NULL PRIMARY KEY,
  edge_type   TEXT    NOT NULL,
  source_id   TEXT    NOT NULL REFERENCES nodes(id),
  target_id   TEXT    NOT NULL REFERENCES nodes(id),
  payload     BLOB,
  hlc         TEXT    NOT NULL,
  public_key  BLOB    NOT NULL,
  signature   BLOB    NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_nodes_type    ON nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_edges_source  ON edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target  ON edges(target_id);
CREATE INDEX IF NOT EXISTS idx_edges_type    ON edges(edge_type);
`;

/** Migration versionada. */
export interface Migration {
  version: number;
  sql: string;
}

const V2 = `
CREATE TABLE IF NOT EXISTS entity_members (
  node_id    TEXT NOT NULL PRIMARY KEY REFERENCES nodes(id),
  entity_id  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entity_members_entity ON entity_members(entity_id);

CREATE TABLE IF NOT EXISTS entity_heads (
  entity_id  TEXT NOT NULL PRIMARY KEY,
  head_id    TEXT NOT NULL REFERENCES nodes(id),
  head_hlc   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entity_heads_head ON entity_heads(head_id);
`;

/** Schema v1 + v2 (entity_heads + entity_id column). */
export const MIGRATIONS: Migration[] = [
  { version: 1, sql: DDL },
  { version: 2, sql: V2 },
];

/** Aplica todas as migrations pendentes via StoragePort. Idempotente. */
export async function migrateSchema(storage: StoragePort): Promise<void> {
  await storage.migrate(MIGRATIONS);
}
