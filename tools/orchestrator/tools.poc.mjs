// ORQ-08 · PoC — harness mínimo de tools (Decisão A) com gating de bash (Decisão B).
// As tools são funções JS que o loop do AI SDK executa IN-PROCESS. Cada chamada emite
// um evento (Decisão D) e respeita um AbortSignal (Decisão E). Bash é gated: allowlist +
// timeout + cwd travado + windowsHide (sem janela) + guarda anti-git-no-Docs.
//
// Escopo do spike: readFile / writeFile / bash. glob/grep/editFile ficam pra ORQ-09.

import { tool } from 'ai';
import { z } from 'zod';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Decisão B — allowlist de comandos (primeiro token). Config confiável, não input do usuário.
const BASH_ALLOWLIST = (() => {
  const win = process.platform === 'win32';
  return ['pnpm', 'npm', 'node', 'git', 'echo', 'mkdir', 'rm', 'bash', 'sh',
    ...(win ? ['dir', 'type'] : ['ls', 'cat'])];
})();
const BASH_TIMEOUT_MS = 120_000;

/** cwd está dentro do repo de controle (Docs)? Se sim, git write é PROIBIDO (regra inviolável). */
function isDocsRepo(cwd) {
  const root = process.env.MGTIA_ROOT;
  if (root) {
    const normCwd = path.resolve(cwd).replace(/\\/g, '/').toLowerCase();
    const normRoot = path.resolve(root).replace(/\\/g, '/').toLowerCase();
    return normCwd === normRoot || normCwd.startsWith(normRoot + '/');
  }
  const norm = path.resolve(cwd).replace(/\\/g, '/').toLowerCase();
  return norm.includes('/dev2026/docs');
}

/**
 * Monta o harness de tools amarrado a um cwd e a um contexto de execução.
 * @param {{cwd:string, onEvent:(e:object)=>void, signal?:AbortSignal, log:(s:string)=>void}} ctx
 */
export function makeTools({ cwd, onEvent, signal, log }) {
  const emit = (type, data) => { try { onEvent?.({ type, ts: Date.now(), ...data }); } catch { /* noop */ } };
  const abs = (p) => path.resolve(cwd, p);

  const readFile = tool({
    description: 'Lê o conteúdo de um arquivo (caminho relativo ao diretório de trabalho).',
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path: p }) => {
      if (signal?.aborted) throw new Error('cancelado');
      emit('tool-call', { tool: 'readFile', args: { path: p } });
      const content = fs.readFileSync(abs(p), 'utf8');
      emit('tool-result', { tool: 'readFile', ok: true, bytes: content.length });
      return { content };
    },
  });

  const writeFile = tool({
    description: 'Escreve (cria/sobrescreve) um arquivo com o conteúdo dado.',
    inputSchema: z.object({ path: z.string(), content: z.string() }),
    execute: async ({ path: p, content }) => {
      if (signal?.aborted) throw new Error('cancelado');
      emit('tool-call', { tool: 'writeFile', args: { path: p, bytes: content.length } });
      fs.mkdirSync(path.dirname(abs(p)), { recursive: true });
      fs.writeFileSync(abs(p), content, 'utf8');
      emit('tool-result', { tool: 'writeFile', ok: true });
      return { ok: true };
    },
  });

  const bash = tool({
    description: 'Roda um comando de shell no diretório de trabalho (build/test/git no worktree, manage-task.mjs, etc.).',
    inputSchema: z.object({ command: z.string() }),
    execute: async ({ command }) => {
      if (signal?.aborted) throw new Error('cancelado');
      const first = command.trim().split(/\s+/)[0];
      // Gate 1 — allowlist.
      if (!BASH_ALLOWLIST.includes(first)) {
        emit('tool-result', { tool: 'bash', ok: false, denied: 'allowlist', command });
        return { ok: false, error: `comando '${first}' fora da allowlist` };
      }
      // Gate 2 — git de escrita no Docs é PROIBIDO (regra inviolável: enfileirar, não commitar).
      if (first === 'git' && isDocsRepo(cwd) && /\b(commit|push|add)\b/.test(command)) {
        emit('tool-result', { tool: 'bash', ok: false, denied: 'git-no-docs', command });
        return { ok: false, error: 'git write no repo Docs é proibido — enfileire via fila.mjs' };
      }
      emit('tool-call', { tool: 'bash', args: { command } });
      const r = spawnSync(command, {
        cwd,
        shell: true,
        encoding: 'utf8',
        timeout: BASH_TIMEOUT_MS,
        windowsHide: true, // ← sem janela de terminal (o oposto do Crush)
      });
      const out = ((r.stdout || '') + (r.stderr || '')).slice(-4000);
      const timedOut = r.error?.code === 'ETIMEDOUT';
      emit('tool-result', { tool: 'bash', ok: r.status === 0, exit: r.status, timedOut });
      log(`  [bash] ${command} → exit=${r.status}${timedOut ? ' (timeout)' : ''}`);
      return { exit: r.status, timedOut, output: out };
    },
  });

  return { readFile, writeFile, bash };
}
