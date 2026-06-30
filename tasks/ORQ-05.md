---
id: ORQ-05
title: "Propaga o hook --on-finish do orquestrador no passo final de cada skill MGTIA"
status: draft
complexity: 2
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-04"] # o hook precisa existir
blocks: []
spec_status: hardened
capacity_target: haiku
hardened_at: "2026-06-30"
hardened_by: claude-opus
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
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**  - [ ] **Requer Refatoração**
- **Evidência:**
```
(cole aqui)
```

## 9. Log de Execução (Agent Execution Log)
> Registrem via `manage-task.mjs`. Identidade = modelo real.
