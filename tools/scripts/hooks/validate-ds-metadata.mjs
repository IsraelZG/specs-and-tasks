#!/usr/bin/env node
/**
 * Hook PostToolUse (Edit|Write): valida metadados do design system quando um
 * packages/design-system/**\/*.metadata.ts é editado.
 * Multiplataforma — substitui o one-liner PowerShell (quebrava em Linux/macOS).
 * Lê o payload JSON do hook via stdin, como o Claude Code envia.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let filePath = '';
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path || '';
} catch {
  process.exit(0); // payload inesperado — não bloqueia a edição
}

const norm = filePath.replace(/\\/g, '/');
if (!/(^|\/)packages\/design-system\/.*\.metadata\.ts$/.test(norm)) process.exit(0);

// Roda a partir da pasta do arquivo editado — o pnpm sobe até a raiz do workspace
const r = spawnSync('pnpm', ['--filter', '@plataforma/design-system', 'validate'], {
  cwd: path.dirname(filePath),
  stdio: 'inherit',
  shell: process.platform === 'win32', // .cmd shim do pnpm no Windows
});
process.exit(r.status === 0 ? 0 : 1);
