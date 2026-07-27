import { execSync } from 'node:child_process';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(__dirname, '..', '..');
const tasksDir = path.join(cwd, 'tasks');

function writeTemp(id, body) {
  const file = path.join(tasksDir, `${id}.md`);
  fs.writeFileSync(file, body, 'utf-8');
  return file;
}

function removeTemp(file) {
  try { fs.unlinkSync(file); } catch {}
}

function runCli(args) {
  return execSync(`node tools/scripts/reassign-machine.mjs ${args}`, { cwd, encoding: 'utf-8' });
}

function runCliExpectFail(args) {
  try {
    execSync(`node tools/scripts/reassign-machine.mjs ${args}`, { cwd, encoding: 'utf-8', stdio: 'pipe' });
    return { ok: true, stderr: '' };
  } catch (e) {
    return { ok: false, stderr: e.stderr };
  }
}

console.log('🧪 reassign-machine.test.mjs — escape hatch do veto multi-máquina');

// ── Caso 1: Task com machine existente — reatribuída com log ──
{
  const id = 'TEST-REASSIGN-1';
  const f = writeTemp(id, `---
id: ${id}
status: in_progress
machine: MAQUINA-A
worktree_path: C:\\wt\\test
---
# x
## 2. Contexto RAG
## 9. Log de Execução
- **[2026-07-17T00:00]** - *gpt-5* - \`[Iniciado]\`
`);

  const out = runCli(`${id} MAQUINA-B israel "HD morto — indisponível"`);
  assert.match(out, /reatribuída/, 'deve confirmar reatribuição no stdout');

  const content = fs.readFileSync(f, 'utf-8');
  assert.match(content, /^machine: MAQUINA-B$/m, 'frontmatter deve ter machine: MAQUINA-B');
  assert.match(content, /\[Reatribuída\]/, 'log deve conter [Reatribuída]');
  assert.match(content, /MAQUINA-A -> MAQUINA-B/, 'log deve registrar máquina antiga → nova');
  assert.match(content, /HD morto/, 'log deve conter o motivo');
  assert.match(content, /israel/, 'log deve conter o agente');

  removeTemp(f);
  console.log('✅ Caso 1: Task com machine existente — reatribuída com log.');
}

// ── Caso 2: Task sem machine — campo inserido do zero, log registra (nenhuma) ──
{
  const id = 'TEST-REASSIGN-2';
  const f = writeTemp(id, `---
id: ${id}
status: in_progress
---
# x
## 2. Contexto RAG
## 9. Log de Execução
- **[2026-07-17T00:00]** - *gpt-5* - \`[Iniciado]\`
`);

  const out = runCli(`${id} MAQUINA-C claude-sonnet "máquina original perdida"`);
  assert.match(out, /reatribuída/, 'deve confirmar reatribuição no stdout');

  const content = fs.readFileSync(f, 'utf-8');
  assert.match(content, /^machine: MAQUINA-C$/m, 'frontmatter deve ter machine: MAQUINA-C inserido');
  assert.match(content, /\[Reatribuída\]/, 'log deve conter [Reatribuída]');
  assert.match(content, /\(nenhuma\)/, 'log deve registrar origem como (nenhuma)');
  assert.match(content, /MAQUINA-C/, 'log deve conter máquina nova');

  removeTemp(f);
  console.log('✅ Caso 2: Task sem machine — campo inserido com log.');
}

// ── Caso 3: Motivo vazio → exit 1, arquivo não modificado ──
{
  const id = 'TEST-REASSIGN-3';
  const body = `---
id: ${id}
status: in_progress
machine: MAQUINA-D
---
# x
## 2. Contexto RAG
## 9. Log de Execução
- **[2026-07-17T00:00]** - *gpt-5* - \`[Iniciado]\`
`;
  const f = writeTemp(id, body);

  const res = runCliExpectFail(`${id} MAQUINA-E israel ""`);
  assert.strictEqual(res.ok, false, 'CLI deve falhar com motivo vazio');

  const content = fs.readFileSync(f, 'utf-8');
  assert.strictEqual(content, body, 'arquivo NÃO deve ser modificado com motivo vazio');

  removeTemp(f);
  console.log('✅ Caso 3: Motivo vazio → exit 1, arquivo não modificado.');
}

console.log('✅ Todos os testes de reassign-machine passaram!');
