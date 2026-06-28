/**
 * AgentAdapter — abstração para disparar agentes (worker/reviewer/architect)
 * como subprocessos headless com cwd no worktree, env injetado e timeout.
 *
 * CommandAdapter é a implementação genérica: monta o comando a partir de
 * templates configuráveis por papel com placeholders ({taskId}, {role}, {cwd}).
 * A recipe específica do OpenCode/Claude é externa (env/config), validada pela T-1017.
 *
 * USO DELIBERADO DE spawn COM shell:true:
 * O template de comando é uma linha de shell completa e CONFIÁVEL (provém de
 * config/env administrada, não de input do usuário). Precisamos do shell para
 * resolver paths, variáveis de ambiente inline e executáveis cross-platform.
 */

import { spawn, type ChildProcess } from 'child_process';
import path from 'path';

export type AgentRole = 'worker' | 'reviewer' | 'architect';

export interface AgentRunOptions {
  role: AgentRole;
  taskId: string;
  cwd: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface AgentRunResult {
  exit: number | null;
  timedOut: boolean;
  tail: string;
}

export interface AgentAdapter {
  run(opts: AgentRunOptions): Promise<AgentRunResult>;
}

export interface CommandAdapterConfig {
  templates: Record<AgentRole, string>;
}

const DEFAULT_TIMEOUT_MS = 1_800_000; // 30 min
const TAIL_LINES = 40;

const PLACEHOLDERS: Array<{ key: string; extractor: (opts: AgentRunOptions) => string }> = [
  { key: '{taskId}', extractor: (o) => o.taskId },
  { key: '{role}', extractor: (o) => o.role },
  { key: '{cwd}', extractor: (o) => path.resolve(o.cwd) },
];

function replacePlaceholders(template: string, opts: AgentRunOptions): string {
  let result = template;
  for (const ph of PLACEHOLDERS) {
    result = result.split(ph.key).join(ph.extractor(opts));
  }
  return result;
}

function tailLines(text: string, lines: number): string {
  if (!text) return '';
  const all = text.split('\n');
  return all.slice(-lines).join('\n');
}

function runSpawn(cmd: string, opts: AgentRunOptions): Promise<AgentRunResult> {
  return new Promise((resolve) => {
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const env = { ...process.env, ...opts.env };

    const child: ChildProcess = spawn(cmd, {
      cwd: opts.cwd,
      env,
      shell: true,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let exitCode: number | null = null;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (err: Error) => {
      clearTimeout(timer);
      stderr += `\n[spawn error: ${err.message}]`;
      resolve({
        exit: exitCode,
        timedOut,
        tail: tailLines(stdout + stderr, TAIL_LINES),
      });
    });

    child.on('close', (code: number | null, signal: string | null) => {
      clearTimeout(timer);
      exitCode = code;
      const combined = stdout + stderr;
      resolve({
        exit: timedOut ? null : code,
        timedOut,
        tail: tailLines(combined, TAIL_LINES),
      });
    });
  });
}

/**
 * Substitui os placeholders no template do papel e executa via
 * `child_process.spawn(cmd, { cwd, env, shell: true })`.
 * Captura stdout+stderr (guarda só as últimas 40 linhas). Mata o processo
 * em timeout (`timedOut:true`, `exit:null`). NUNCA rejeita por exit!=0 —
 * devolve o exit no resultado.
 */
export class CommandAdapter implements AgentAdapter {
  private readonly config: CommandAdapterConfig;

  constructor(config: CommandAdapterConfig) {
    this.config = config;
  }

  async run(opts: AgentRunOptions): Promise<AgentRunResult> {
    const template = this.config.templates[opts.role];
    if (!template) {
      throw new Error(
        `CommandAdapter: nenhum template definido para o papel '${opts.role}'. ` +
          `Defina a env NEXUS_AGENT_CMD_${opts.role.toUpperCase()} ou o template no config.`,
      );
    }
    const cmd = replacePlaceholders(template, opts);
    return runSpawn(cmd, opts);
  }
}

const ENV_KEYS: Record<AgentRole, string> = {
  worker: 'NEXUS_AGENT_CMD_WORKER',
  reviewer: 'NEXUS_AGENT_CMD_REVIEWER',
  architect: 'NEXUS_AGENT_CMD_ARCHITECT',
};

/** Lê os templates de env: NEXUS_AGENT_CMD_WORKER / _REVIEWER / _ARCHITECT.
 *  Papel sem template definido → lança Error claro ao tentar `run` aquele papel. */
export function commandAdapterFromEnv(): CommandAdapter {
  const templates: Record<AgentRole, string> = {
    worker: process.env[ENV_KEYS.worker] ?? '',
    reviewer: process.env[ENV_KEYS.reviewer] ?? '',
    architect: process.env[ENV_KEYS.architect] ?? '',
  };
  return new CommandAdapter({ templates });
}
