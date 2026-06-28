/**
 * Gate de verificação determinístico — roda os comandos de "Verificação automática"
 * de uma task no diretório do worktree e devolve { ok, output, steps }.
 *
 * Este módulo é o ground truth do runner: quem garante "verde" é este gate,
 * não o auto-relato do agente (ADR-piloto-automatico.md).
 *
 * USO DELIBERADO DE child_process.exec (shell: true):
 * Diferente do worktree.service.ts que usa execFile, aqui usamos exec porque:
 * 1. O comando é uma linha inteira CONFIÁVEL vinda da spec (sem interpolação de
 *    input externo).
 * 2. Precisamos do shell para resolver `pnpm`/`pnpm.cmd` cross-platform (Windows
 *    requer .cmd extension resolution que só o shell provê).
 * 3. O comando pode conter pipes, redirecionamentos e variáveis de ambiente.
 */

import { exec } from 'child_process';

export interface VerifyStep {
  command: string;
  ok: boolean;
}

export interface VerifyResult {
  ok: boolean;
  steps: VerifyStep[];
  output: string;
}

export interface VerifyOptions {
  cwd: string;
  commands: string[];
  timeoutMsPerCommand?: number;
  tailLines?: number;
}

const DEFAULT_TIMEOUT_MS = 600_000;
const DEFAULT_TAIL_LINES = 40;

function tail(text: string, lines: number): string {
  if (!text) return '';
  const all = text.split('\n');
  return all.slice(-lines).join('\n');
}

function runOneCommand(
  command: string,
  cwd: string,
  timeoutMs: number,
  tailLines: number,
): Promise<VerifyStep & { combinedOutput: string }> {
  return new Promise((resolve) => {
    const child = exec(command, { cwd, timeout: timeoutMs }, (error, stdout, stderr) => {
      const combined = [stdout, stderr].filter(Boolean).join('\n');
      const outputTail = tail(combined, tailLines);

      if (error) {
        const killed = typeof error.killed === 'boolean' ? error.killed : false;
        const exitCode = typeof error.code === 'number' ? error.code : (child.exitCode ?? -1);
        const reason = killed ? `timeout (${timeoutMs}ms)` : `exit code ${exitCode}`;
        const fullOutput = [outputTail, reason].filter(Boolean).join('\n');
        resolve({
          command,
          ok: false,
          combinedOutput: fullOutput,
        });
      } else {
        resolve({
          command,
          ok: true,
          combinedOutput: outputTail,
        });
      }
    });
  });
}

/**
 * Roda cada comando EM SEQUÊNCIA; PARA no primeiro que falhar (curto-circuito).
 * Cada comando é uma linha de shell completa e CONFIÁVEL (vem da spec, sem
 * interpolação de input externo) → usa `child_process.exec(command, { cwd,
 * timeout })` (shell:true), que resolve `pnpm`/`pnpm.cmd` cross-platform.
 * Exit !== 0 → step.ok=false, ok geral=false.
 */
export async function runVerificationGate(opts: VerifyOptions): Promise<VerifyResult> {
  const timeoutMs = opts.timeoutMsPerCommand ?? DEFAULT_TIMEOUT_MS;
  const tailLines = opts.tailLines ?? DEFAULT_TAIL_LINES;
  const steps: VerifyStep[] = [];
  const outputs: string[] = [];
  let overallOk = true;

  for (const command of opts.commands) {
    const step = await runOneCommand(command, opts.cwd, timeoutMs, tailLines);
    steps.push({ command: step.command, ok: step.ok });
    outputs.push(step.combinedOutput);

    if (!step.ok) {
      overallOk = false;
      break;
    }
  }

  return {
    ok: steps.length === 0 ? true : overallOk,
    steps,
    output: outputs.join('\n'),
  };
}

const VERIFY_SECTION_RE = /Verificação automática/i;
const FENCE_RE = /```bash\s*\n([\s\S]*?)(?:```|$)/;

/**
 * Extrai os comandos do corpo da task: pega o PRIMEIRO fence ```bash que aparece
 * DEPOIS do título "Verificação automática" e devolve as linhas não-vazias que
 * não começam com '#'.
 * Se não encontrar e `fallbackPackage` for dado → ['pnpm --filter <pkg> build',
 * 'pnpm --filter <pkg> test']. Se nada → [].
 */
export function parseVerifyCommands(taskBody: string, fallbackPackage?: string): string[] {
  const sectionIdx = taskBody.search(VERIFY_SECTION_RE);

  if (sectionIdx !== -1) {
    const afterSection = taskBody.slice(sectionIdx);
    const fenceMatch = FENCE_RE.exec(afterSection);
    if (fenceMatch) {
      const lines = fenceMatch[1]
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('#'));

      if (lines.length > 0) {
        return lines;
      }
    }
  }

  if (fallbackPackage) {
    return [
      `pnpm --filter ${fallbackPackage} build`,
      `pnpm --filter ${fallbackPackage} test`,
    ];
  }

  return [];
}
