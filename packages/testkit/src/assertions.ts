import type { PeerId, SqlRow } from '@plataforma/protocol';

/** Tabelas do grafo que podem ser comparadas. */
export type TableName = 'nodes' | 'edges';

/** Escopo de convergência: conjunto de tabelas a comparar. */
export type ConvergenceScope = ReadonlySet<TableName>;

/**
 * Interface que um peer deve implementar para participar de testes de convergência.
 * Em v1, aceita tanto peers reais (com StoragePort) quanto stubs manuais.
 */
export interface ConvergencePeer {
  /** Identificador do peer para mensagens de diagnóstico. */
  readonly peerId: PeerId;

  /**
   * Retorna o root fingerprint para o escopo informado.
   * Fingerprint = SHA-256 de 256 bits representado como Uint8Array (32 bytes).
   */
  getRootFingerprint(scope: ConvergenceScope): Uint8Array | Promise<Uint8Array>;

  /**
   * Exporta (dump) completo de uma tabela para o escopo informado.
   * Chamado apenas quando há divergência de fingerprint, para gerar diff.
   */
  dumpTable(table: TableName, scope: ConvergenceScope): SqlRow[] | Promise<SqlRow[]>;
}

function areFingerprintsEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((byte, i) => byte === b[i]);
}

function formatDiff(
  table: TableName,
  rowsA: SqlRow[],
  rowsB: SqlRow[],
  peerA: ConvergencePeer,
  peerB: ConvergencePeer,
): string {
  const lines: string[] = [
    `--- ${peerA.peerId} (${table})`,
    `+++ ${peerB.peerId} (${table})`,
  ];

  const setA = new Set(rowsA.map(r => JSON.stringify(r, Object.keys(r).sort())));
  const setB = new Set(rowsB.map(r => JSON.stringify(r, Object.keys(r).sort())));

  for (const row of rowsA) {
    const key = JSON.stringify(row, Object.keys(row).sort());
    if (setB.has(key)) continue;
    lines.push(`-${JSON.stringify(row)}`);
  }
  for (const row of rowsB) {
    const key = JSON.stringify(row, Object.keys(row).sort());
    if (setA.has(key)) continue;
    lines.push(`+${JSON.stringify(row)}`);
  }

  return lines.join('\n');
}

/** Lightweight assertion error — avoids dependency on node:assert. */
class AssertionError extends Error {
  override name = 'AssertionError';
}

/**
 * Asserção de convergência: compara root fingerprints de múltiplos peers.
 *
 * - Se todos os fingerprints forem idênticos → resolve silenciosamente.
 * - Se houver divergência → faz dump das tabelas divergentes e lança erro
 *   com diff descritivo.
 * - Se `peers` tiver menos de 2 elementos → lança erro descritivo.
 *
 * @throws AssertionError com diff detalhado das tabelas divergentes.
 */
export async function expectConverged(
  peers: readonly ConvergencePeer[],
  scope: ConvergenceScope,
): Promise<void> {
  const count = peers.length;
  if (count < 2) {
    throw new Error(
      `expectConverged requires at least 2 peers, got ${String(count)}`,
    );
  }

  const fingerprintResults = await Promise.all(
    peers.map(p => Promise.resolve(p.getRootFingerprint(scope))),
  );
  const fingerprints = fingerprintResults;

  const first = fingerprints[0];
  const allMatch = fingerprints.every(fp => first !== undefined && areFingerprintsEqual(fp, first));

  if (allMatch) return;

  const divergingPeers: ConvergencePeer[] = [];
  for (let i = 0; i < peers.length; i++) {
    const fp = fingerprints[i];
    if (fp === undefined || first === undefined) continue;
    if (!areFingerprintsEqual(fp, first)) {
      const p = peers[i];
      if (p !== undefined) divergingPeers.push(p);
    }
  }

  const messages: string[] = [];
  const refPeer = peers[0];
  if (refPeer !== undefined) {
    for (const table of ['nodes', 'edges'] as TableName[]) {
      if (!scope.has(table)) continue;

      const refDump = await refPeer.dumpTable(table, scope);

      for (const dp of divergingPeers) {
        const dpDump = await dp.dumpTable(table, scope);
        messages.push(formatDiff(table, refDump, dpDump, refPeer, dp));
      }
    }
  }

  const message = [
    `Convergence divergence detected among ${String(peers.length)} peers`,
    ...messages,
  ].join('\n');

  throw new AssertionError(message);
}
