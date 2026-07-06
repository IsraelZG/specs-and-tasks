// ORQ-10 · Monitor de instâncias travadas (300s sem sinal de vida).
// Detecta instâncias vivas (registradas em tasks/.orchestrator/*.json) que não emitem
// evento há mais de STUCK_TIMEOUT_MS e escreve um flag `<id>.cancel` no mesmo diretório
// — o adapter (agentAdapter.mjs) observa o flag e aborta o loop (Decisão E do ADR 0008).
//
// Funções puras para serem triviais de testar (sem I/O real nos testes):
//   - findStuck(registry, now)        → string[]  (taskIds stuck)
//   - writeCancelFlags(ids, dir, fs)  → string[]  (paths escritos)
//   - startMonitor({registry,...})    → stop()    (loop com setInterval)

import fs from 'node:fs';
import path from 'node:path';

export const STUCK_TIMEOUT_MS = 300_000;   // 5 min — janela além da qual assumimos travada
export const CHECK_INTERVAL_MS = 10_000;   // poll a cada 10s (suficiente p/ 5min de janela)

/** Sanitiza taskId p/ nome de arquivo seguro. */
function safeName(id) {
  return String(id).replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * @param {Record<string,{lastEventTs?:number, started?:number, model?:string}>} registry
 * @param {number} now epoch ms (injetável p/ teste determinístico)
 * @returns {string[]} taskIds stuck (lastEventTs velho ou ausente há >STUCK_TIMEOUT_MS)
 */
export function findStuck(registry, now = Date.now()) {
  const stuck = [];
  for (const [taskId, inst] of Object.entries(registry)) {
    if (!inst || typeof inst !== 'object') continue;
    const last = inst.lastEventTs;
    // Sem lastEventTs mas com started → ainda "viva" mas sem eventos; trata como stuck após timeout.
    const ref = typeof last === 'number' ? last : inst.started;
    if (typeof ref !== 'number') continue;
    if ((now - ref) > STUCK_TIMEOUT_MS) stuck.push(taskId);
  }
  return stuck;
}

/**
 * Escreve `<id>.cancel` em `dir` para cada id. Retorna os paths escritos.
 * Idempotente: sobrescreve o arquivo se já existir.
 * @param {string[]} ids
 * @param {string} dir
 * @param {{writeFileSync:(p:string,data:string)=>void}} fsMod injetável p/ teste
 */
export function writeCancelFlags(ids, dir, fsMod = fs) {
  const written = [];
  fsMod.mkdirSync?.(dir, { recursive: true });
  for (const id of ids) {
    const fp = path.join(dir, `${safeName(id)}.cancel`);
    fsMod.writeFileSync(fp, JSON.stringify({ ts: Date.now(), reason: 'stuck-monitor' }, null, 2));
    written.push(fp);
  }
  return written;
}

/**
 * Inicia o loop de detecção. Retorna uma função `stop()`.
 * @param {{
 *   registry: Record<string, {lastEventTs?:number, started?:number}>,
 *   dir: string,
 *   intervalMs?: number,
 *   fsMod?: {writeFileSync:Function, mkdirSync:Function},
 *   now?: ()=>number,
 *   onStuck?: (id:string, fp:string)=>void,
 * }} opts
 */
export function startMonitor(opts) {
  const {
    registry,
    dir,
    intervalMs = CHECK_INTERVAL_MS,
    fsMod = fs,
    now = Date.now,
    onStuck = () => {},
  } = opts;
  const tick = () => {
    const stuck = findStuck(registry, now());
    if (!stuck.length) return;
    const written = writeCancelFlags(stuck, dir, fsMod);
    stuck.forEach((id, i) => onStuck(id, written[i]));
  };
  const t = setInterval(tick, intervalMs);
  // permite rodar uma vez imediatamente p/ teste/manual
  tick();
  return () => clearInterval(t);
}
