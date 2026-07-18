import { execSync } from 'node:child_process';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(__dirname, '..', '..');
const tasksDir = path.join(cwd, 'tasks');

const run = (args) =>
  execSync(`node tools/scripts/get-task.mjs ${args}`, { cwd, encoding: 'utf-8' });

function writeTemp(id, body) {
  const file = path.join(tasksDir, `${id}.md`);
  fs.writeFileSync(file, body, 'utf-8');
  return file;
}

function removeTemp(file) {
  try { fs.unlinkSync(file); } catch {}
}

// 1) case-insensitive + in_progress => worker-retomada (fixture sintética — status real muda)
const f0 = writeTemp('FAKE-INPROG', `---\nid: FAKE-INPROG\nstatus: in_progress\n---\n# x\n## 2. Contexto RAG\n## 9. Log de Execução\n- **[2026-07-17T00:00]** - *gpt-5* - \`[Iniciado]\``);
const inprog = run('fake-inprog');
assert.match(inprog, /DESPACHO MGTIA · FAKE-INPROG/i, 'case-insensitive deve resolver');
assert.match(inprog, /worker-retomada/, 'in_progress => papel worker-retomada');
assert.match(inprog, /executar-task/, 'in_progress => skill executar-task');
assert.match(inprog, /guarda de identidade:.*gpt-5/, 'deve identificar executor do §9');
removeTemp(f0);

// 2) done => nada a fazer (C-31 via C31)
const c31 = run('C31');
assert.match(c31, /nada a fazer/, 'done => nada a fazer');
assert.match(c31, /DESPACHO MGTIA · C-31/i, 'deve resolver C-31 sem hífen');

// 3) JSON shape para done
const json = run('L-03 --json');
const obj = JSON.parse(json);
assert.strictEqual(obj.id, 'L-03');
assert.strictEqual(obj.status, 'done');
assert.strictEqual(obj.verb, 'nada a fazer');
assert.ok(obj.skillText === null || typeof obj.skillText === 'string');
assert.match(obj.identityGuard, /agile_reviewer:claude-opus/, 'JSON guarda de identidade');

// 4) review => reviewer/qa-review/claim + --integrar por padrão + guarda de identidade
const f5 = writeTemp('FAKE-REVIEW', `---\nid: FAKE-REVIEW\nstatus: review\n---\n# x\n## 2. Contexto RAG\n## 9. Log de Execução\n- **[2026-07-17T00:00]** - *gpt-5* - \`[Finalizado]\``);
const rev = run('FAKE-REVIEW');
assert.match(rev, /reviewer/, 'review => papel reviewer');
assert.match(rev, /qa-review/, 'review => skill qa-review');
assert.match(rev, /claim/, 'review => verbo claim');
assert.match(rev, /--integrar/, 'review => invocação recomendada com --integrar por padrão');
assert.match(rev, /guarda de identidade:/, 'deve imprimir guarda de identidade');
assert.match(rev, /AÇÃO AGORA/, 'estado acionável => diretiva imperativa no topo');
assert.match(rev, /AGORA EXECUTE/, 'estado acionável => reforço de execução no rodapé');
assert.match(rev, /NÃO é um relatório para resumir/, 'deve avisar que não é relatório');
removeTemp(f5);

// 5) ready => worker/executar-task/start
const f6 = writeTemp('FAKE-READY', `---\nid: FAKE-READY\nstatus: ready\n---\n# x\n## 2. Contexto RAG\n## 9. Log de Execução\n- **[2026-07-17T00:00]** - *gpt-5* - \`[Iniciado]\``);
const rdy = run('FAKE-READY');
assert.match(rdy, /papel: worker/, 'ready => papel worker');
assert.match(rdy, /executar-task/, 'ready => skill executar-task');
assert.match(rdy, /start/, 'ready => verbo start');
removeTemp(f6);

// 6) in_review => PARE
const f1 = writeTemp('FAKE-IN-REVIEW', `---\nid: FAKE-IN-REVIEW\nstatus: in_review\n---\n# x\n## 2. Contexto RAG\n## 9. Log de Execução\n- **[2026-07-17T00:00]** - *gpt-5* - \`[Iniciado]\``);
const inReview = run('FAKE-IN-REVIEW');
assert.match(inReview, /PARE/, 'in_review => PARE');
assert.match(inReview, /NÃO execute nada/, 'estado terminal => diretiva de não-ação');
assert.doesNotMatch(inReview, /AGORA EXECUTE/, 'estado terminal => sem reforço de execução');
removeTemp(f1);

// 7) draft:pending_decision => PARE + decisões
const f2 = writeTemp('FAKE-PENDING', `---\nid: FAKE-PENDING\nstatus: draft:pending_decision\ndecisions: ["D1 escolha", "D2 escolha"]\n---\n# x\n## 2. Contexto RAG\n## 9. Log de Execução\n- **[2026-07-17T00:00]** - *claude-opus* - \`[Endurecido]\``);
const pending = run('FAKE-PENDING');
assert.match(pending, /PARE/, 'pending_decision => PARE');
assert.match(pending, /D1 escolha/, 'deve listar decisões pendentes');
removeTemp(f2);

// 8) rework => worker/rework-task/start
const f3 = writeTemp('FAKE-REWORK', `---\nid: FAKE-REWORK\nstatus: rework\n---\n# x\n## 2. Contexto RAG\n## 8. Log de Handover e Revisão Agile\n### Parecer do Agente Revisor\n[B1] problema.\n## 9. Log de Execução\n- **[2026-07-17T00:00]** - *gpt-5* - \`[Iniciado]\``);
const rework = run('FAKE-REWORK');
assert.match(rework, /rework-task/, 'rework => skill rework-task');
assert.match(rework, /\[B1\]/, 'rework => destaca [B1] do Parecer');
removeTemp(f3);

// 9) RAG quebrado => fonte-nao-resolve, sem inventar
const f4 = writeTemp('FAKE-RAG', `---\nid: FAKE-RAG\nstatus: ready\n---\n# x\n## 2. Contexto RAG\n- [link quebrado](../docs/nao-existe.md)\n## 9. Log de Execução\n- **[2026-07-17T00:00]** - *gpt-5* - \`[Iniciado]\``);
const brokenRag = run('FAKE-RAG');
assert.match(brokenRag, /fonte-nao-resolve/, 'RAG quebrado => fonte-nao-resolve');
removeTemp(f4);

console.log('✅ get-task.test.mjs passou');
