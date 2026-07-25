import { execSync } from 'node:child_process';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(__dirname, '..', '..');
const tasksDir = path.join(cwd, 'tasks');
const currentMachine = os.hostname();

const runGetTask = (args) =>
  execSync(`node tools/scripts/get-task.mjs ${args}`, { cwd, encoding: 'utf-8' });

function writeTemp(id, body) {
  const file = path.join(tasksDir, `${id}.md`);
  fs.writeFileSync(file, body, 'utf-8');
  return file;
}

function removeTemp(file) {
  try { fs.unlinkSync(file); } catch {}
}

console.log('🧪 Executando suíte de testes de concluir-task e get-task...');

// 1) get-task com worktree_path e machine locais
const f1 = writeTemp('TEST-LOCAL-WT', `---\nid: TEST-LOCAL-WT\nstatus: in_progress\nmachine: ${currentMachine}\nworktree_path: C:\\Dev2026\\.superapp-worktrees\\_slot-1\n---\n# x\n## 2. Contexto RAG\n## 9. Log de Execução`);
const out1 = runGetTask('TEST-LOCAL-WT');
assert.match(out1, /RETOMADA DE TRABALHO/, 'deve identificar retomada de trabalho');
assert.match(out1, /concluir-task\.mjs finish/, 'deve recomendar concluir-task.mjs finish');
removeTemp(f1);

// 2) get-task com machine diferente => VETO MULTI-MÁQUINA
const f2 = writeTemp('TEST-OTHER-MACHINE', `---\nid: TEST-OTHER-MACHINE\nstatus: in_progress\nmachine: OUTRA-MAQUINA-999\nworktree_path: C:\\wt\\test\n---\n# x\n## 2. Contexto RAG\n## 9. Log de Execução`);
const out2 = runGetTask('TEST-OTHER-MACHINE');
assert.match(out2, /VETO MULTI-MÁQUINA/, 'deve acionar veto multi-máquina');
assert.match(out2, /OUTRA-MAQUINA-999/, 'deve citar a máquina alocada');

const json2 = runGetTask('TEST-OTHER-MACHINE --json');
const obj2 = JSON.parse(json2);
assert.strictEqual(obj2.multiMachineVeto, true, 'JSON multiMachineVeto deve ser true');
assert.strictEqual(obj2.actionable, false, 'task vetada não deve ser actionable');
removeTemp(f2);

// 3) get-task em review => instrução para concluir-task.mjs approve/reject
const f3 = writeTemp('TEST-REVIEW-CMD', `---\nid: TEST-REVIEW-CMD\nstatus: review\n---\n# x\n## 2. Contexto RAG\n## 9. Log de Execução`);
const out3 = runGetTask('TEST-REVIEW-CMD');
assert.match(out3, /concluir-task\.mjs approve/, 'deve instruir concluir-task.mjs approve');
assert.match(out3, /concluir-task\.mjs reject/, 'deve instruir concluir-task.mjs reject');
removeTemp(f3);

// 4) concluir-task.mjs com argumentos inválidos deve lançar erro
assert.throws(() => {
  execSync('node tools/scripts/concluir-task.mjs acao_invalida T-999 agent "msg"', { cwd, encoding: 'utf-8', stdio: 'pipe' });
}, /Ação inválida/, 'ação inválida deve falhar');

console.log('✅ Todos os testes de concluir-task e get-task passaram com sucesso!');
