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

/** Schema v1 = migration 1. Adições futuras ganham version > 1. */
export const MIGRATIONS: Migration[] = [
  { version: 1, sql: DDL },
];

/** Aplica todas as migrations pendentes via StoragePort. Idempotente. */
export async function migrateSchema(storage: StoragePort): Promise<void> {
  await storage.migrate(MIGRATIONS);
}
