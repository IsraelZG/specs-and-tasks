---
id: ORQ-05
title: "Propaga o hook --on-finish do orquestrador no passo final de cada skill MGTIA"
status: done
complexity: 2
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-04"] # o hook precisa existir
blocks: []
capacity_target: haiku
---

# ORQ-05 · Propaga o hook --on-finish nas skills MGTIA

## 0. Ambiente de Execução Obrigatório
- **Tarefa de TOOLING do CONTROLE (Docs).** Só edita Markdown de skills. Persista via
  `node tools/scripts/fila.mjs add ORQ-05 "<msg>" <cada SKILL.md editado>`. Identidade = modelo real.
- **Gate adaptado:** evidência = `grep` mostrando o hook em cada skill (§7). Mecânica — **haiku**.

## 1. Objetivo
Fazer o pipeline **auto-propagar**: ao final de cada skill MGTIA (depois de enfileirar o commit), o
agente dispara `node tools/scripts/orquestrar.mjs --on-finish <ID>` em **fire-and-forget** (não bloqueia
o agente, não espera saída). Assim, quando um worker/reviewer/hardener termina, o orquestrador olha o
ledger e despacha o próximo passo automaticamente.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] [ORQ-04](./ORQ-04.md) — `orquestrar.mjs --on-finish <id>` existe (libera o slot + re-despacha).
- [ ] As skills já têm um passo final de **enfileiramento** (`fila.mjs add`); o hook entra **logo após**.
- [ ] Fire-and-forget no Windows: `Start-Process -NoNewWindow -FilePath node -ArgumentList ...` (PowerShell)
      ou, portátil via Node, `child_process.spawn(..., {detached:true, stdio:'ignore'}).unref()`. Como é
      instrução de skill (texto), oriente o agente a rodar **sem aguardar** (não capturar a saída).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** cada um, adicionando o passo de hook **após** o passo de `fila.mjs add`:
  - `.claude/skills/executar-task/SKILL.md`
  - `.claude/skills/rework-task/SKILL.md`
  - `.claude/skills/qa-review/SKILL.md`
  - `.claude/skills/integrar-task/SKILL.md`
  - `.claude/skills/arquiteto-promover/SKILL.md`
  - `.claude/skills/endurecer-task/SKILL.md`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Self-check por `grep`** (§7): cada uma das 6 skills contém a linha do hook `--on-finish`.
- [x] **Fora de escopo:** a lógica do hook (é ORQ-04); skills que não terminam ciclo (endurecer-fila,
      arquiteto-decisoes, agrupar-cleanup, drenar-fila — estas NÃO recebem o hook).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:** NÃO faça o agente **aguardar** o hook (é fire-and-forget — não bloqueia, não cola
> saída no Gate). NÃO adicione o hook a skills que não fecham um ciclo de task. NÃO rode git no Docs — enfileire.

**Texto-padrão do passo a inserir** (ajuste `$ARGUMENTS`/`<ID>` ao estilo de cada skill):
```markdown
N. **Dispara o orquestrador (fire-and-forget).** Após enfileirar, rode **sem aguardar** —
   `node tools/scripts/orquestrar.mjs --on-finish $ARGUMENTS` — para liberar seu slot e deixar o
   orquestrador despachar o próximo passo. NÃO espere a saída nem cole no Gate; é disparar e seguir.
```

1. Para cada skill, insira o passo logo após o de `fila.mjs add`. 2. `grep` confirma (§7). 3. Enfileira.

## 6. Feedback de Especificação (Spec Feedback Loop)
Sem decisões em aberto.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] As 6 skills contêm o hook `--on-finish`; nenhuma delas o aguarda; as 4 não-ciclo NÃO o têm.

### Verificação automática *(colar saída na §8)*
```bash
for s in executar-task rework-task qa-review integrar-task arquiteto-promover endurecer-task; do \
  printf "%s: " "$s"; grep -c "orquestrar.mjs --on-finish" ".claude/skills/$s/SKILL.md"; done
# Esperado: cada um = 1
for s in endurecer-fila arquiteto-decisoes agrupar-cleanup drenar-fila; do \
  printf "%s(deve ser 0): " "$s"; grep -c "orquestrar.mjs --on-finish" ".claude/skills/$s/SKILL.md"; done
```
> **GATE:** sem a saída literal na §8, `finish` não vale.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- Hook `orquestrar.mjs --on-finish` adicionado às 6 skills MGTIA (executar-task, rework-task, qa-review, integrar-task, arquiteto-promover, endurecer-task).
- integrar-task tem o hook nos dois caminhos (Path A approve, Path B request_changes).
- Skills não-ciclo (endurecer-fila, arquiteto-decisoes, agrupar-cleanup, drenar-fila) não receberam hook.
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**  - [ ] **Requer Refatoração**
- **Evidência:**
```
executar-task: 1
rework-task: 1
qa-review: 1
integrar-task: 2
arquiteto-promover: 1
endurecer-task: 1
---
endurecer-fila: 0
arquiteto-decisoes: 0
agrupar-cleanup: 0
drenar-fila: 0
```

### Parecer QA — Reviewer 1 (agile_reviewer:minimax-m3, 2026-07-01)
- [x] **Aprovado**
- **Veredito:** Aprovado. Gate verde; escopo completo; sem `await`/bloqueio.
- **Escopo (§3):** os 6 arquivos declarados foram editados, todos com o hook `--on-finish` inserido logo após o passo de `fila.mjs add`. Nenhum arquivo fora de escopo tocado.
- **Gate (§7) — re-execução independente (findstr /R /C:"orquestrar.mjs --on-finish" .claude\skills\<skill>\SKILL.md):**
  ```
  executar-task:           1 linha
  rework-task:             1 linha
  qa-review:               1 linha
  integrar-task:           2 linhas  (Path A approve + Path B request_changes, conforme §5)
  arquiteto-promover:      1 linha
  endurecer-task:          1 linha
  endurecer-fila:          0         (não-ciclo — OK)
  arquiteto-decisoes:      0         (não-ciclo — OK)
  agrupar-cleanup:         0         (não-ciclo — OK)
  drenar-fila:             0         (não-ciclo — OK)
  ```
  Match 1:1 com a evidência colada pelo worker (deepseek). Esperado 1/1/1/2/1/1 + 0/0/0/0.
- **Fire-and-forget (§5 — "NÃO faça o agente aguardar"):** os 6 passos inseridos contêm o
  "Dispara o orquestrador (fire-and-forget) … rode **sem aguardar**" e a frase
  "NÃO espere a saída nem cole no Gate". Verificado por grep em todas as 6 skills.
- **Sem smoke de UI/TS:** N/A — task de tooling do Docs, gate é o próprio grep.
- **Sondas adversariais:** N/A — diff puramente documental (Markdown de skills), sem lógica executável
  a quebrar; gate mecânico já cobre o requisito.
- **Ripple de assinatura:** N/A — nenhuma função/assinatura alterada; só texto de skill.
- **Conclusão:** entregar. Encadear `/integrar-task ORQ-05` (Caminho A-tooling: tooling do controle,
  sem worktree; só passos 7-11 do Caminho A).

## 9. Log de Execução (Agent Execution Log)
> Registrem via `manage-task.mjs`. Identidade = modelo real.
- **[2026-07-01T11:57]** - *claude-sonnet* - `[Promovida p/ ready]`: spec_status hardened — flip draft→ready (ORQ-04 done)
- **[2026-07-01T12:02]** - *deepseek* - `[Iniciado]`: iniciando propagacao do hook --on-finish nas skills
- **[2026-07-01T12:05]** - *deepseek* - `[Finalizado]`: Hook --on-finish propagado em 6 skills MGTIA. Nao-ciclo sem hook. Gate grep ok.
- **[2026-07-01T12:44]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado (Caminho A-tooling, sem worktree): hook --on-finish propagado nas 6 skills MGTIA (executar-task, rework-task, qa-review, integrar-task [Path A+Path B], arquiteto-promover, endurecer-task) e ausente nas 4 não-ciclo (endurecer-fila, arquiteto-decisoes, agrupar-cleanup, drenar-fila). Gate findstr: 1/1/1/2/1/1 + 0/0/0/0 — match 1:1 com §8 do worker. Fire-and-forget em todos os 6 passos. 0 não-bloqueantes → ledger (veredito limpo).
