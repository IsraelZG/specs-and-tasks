---
id: ORQ-01
title: "ledger.mjs --json — API de leitura do estado (transitions.jsonl + frontmatter)"
status: ready
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [] # fundação — sem deps
blocks: ["ORQ-02", "ORQ-06"] # dispatcher e dashboard consomem este JSON
spec_status: hardened
capacity_target: sonnet
hardened_at: "2026-06-30"
hardened_by: claude-opus
---

# ORQ-01 · ledger.mjs --json — API de leitura do estado

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. **Sem dependências externas** — só `node:fs`/`node:path` (stdlib).
- **Tarefa de TOOLING do CONTROLE (Docs).** NÃO há worktree do superapp. Implemente **direto no Docs**
  (edita `tools/scripts/ledger.mjs`). Persista via **`node tools/scripts/fila.mjs add ORQ-01 "<msg>"
  tools/scripts/ledger.mjs`** (a fila commita; você NÃO roda git no Docs). Identidade `<EU>` = seu
  **modelo real** (ver "Identidade do agente" no CLAUDE.md).
- **Gate adaptado:** não é pacote pnpm — a evidência é a **saída literal** dos comandos da §7.

## 1. Objetivo
Adicionar um modo **`--json`** ao `tools/scripts/ledger.mjs` existente (hoje só gera `LEDGER.md`
markdown). O `--json` é a **API única de leitura de estado** que o orquestrador (ORQ-02/04) e o
dashboard (ORQ-06) consomem — emite um **array JSON** no stdout, **um objeto por task**, juntando o
event-log estruturado `.nexus/transitions.jsonl` com o frontmatter de cada `tasks/*.md`. **Sem parsear
markdown** (o §9 markdown continua só para humano; aqui a fonte é o JSONL).

> **Por que `.nexus/transitions.jsonl` e não o §9:** o `TaskService` já grava cada transição como
> `{ts,id,from,to,action,agent}` (JSON nativo). É local/gitignored — perfeito, porque a ferramenta
> roda na máquina de despacho onde o arquivo está sempre fresco. Atribuição de papel fica trivial
> (tem `from`/`to`/`action` explícitos), sem o regex frágil do §9.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `tools/scripts/ledger.mjs` — script existente (gera `LEDGER.md`); você ADICIONA `--json` sem
      quebrar o modo markdown. Já tem `parseLog`, `displayActor`, parser de frontmatter `fm()`.
- [ ] `.nexus/transitions.jsonl` — fonte de eventos. Cada linha: `{"ts","id","from","to","action","agent"}`.
      `action` ∈ {seed,start,promote,pause,finish,approve,request_changes,block,unblock,reconcile}.
- [ ] `tools/scripts/hardening.mjs` — referência do parser de frontmatter flat (campos `status`,
      `spec_status`, `capacity_target`, `dependencies`, `hardened_by`, `ui`).
- [ ] CLAUDE.md §"Identidade do agente" — `agent` pode vir `papel:modelo` (ex.: `agile_reviewer:gemini`);
      use o `displayActor()` já existente para exibir só o modelo.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `tools/scripts/ledger.mjs` — adiciona:
  - parse de `.nexus/transitions.jsonl` (split por linha, `JSON.parse` por linha, ignora linha vazia).
  - função `rolesFromTransitions(events)` → `{ worker_model, reviewer_models[], rework_count, last_event }`
    a partir dos eventos do id (atribuição: `worker`=agent do 1º `start` com `from`∈{ready,draft};
    `reviewer_models`=agents de `approve`/`request_changes` (via `displayActor`, distintos);
    `rework_count`=nº de `start` com `from==rework`).
  - função `nextAction(task)` (máquina de estados, ver §5).
  - função `depsOk(task, allById)` → `true` se TODA dep tem `status==done`.
  - modo `--json`: monta o array e faz `process.stdout.write(JSON.stringify(arr))`.
  - filtros: `--status <s>`, `--action <a>`, `--id <T-XXX>`, `--capacity <c>`, `--idle`.
- **NÃO** altere o modo markdown (`LEDGER.md`) nem a assinatura sem-flag (default segue gerando o .md).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** sem framework — **self-check por CLI** (a §7). É script stdlib.
- [x] **Cobertura:** (a) `--json` produz JSON válido e parseável; (b) cada objeto tem TODOS os campos
  da §5; (c) `--status review` retorna só review; (d) `--idle` exclui `done`/`in_progress`;
  (e) `next_action` correto p/ ≥1 task de cada estado; (f) `deps_ok=false` quando uma dep não é `done`.
- [x] **Fora de escopo:** registry de instâncias (`busy` por instância viva é da ORQ-04 — aqui
  `busy = status==='in_progress'`); spawn; saldo.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - NÃO quebre o modo markdown existente (rodar sem flag deve seguir gerando `LEDGER.md`).
> - NÃO adicione dependência npm. NÃO parseie o §9 markdown para os dados de papel — use o JSONL.
> - NÃO rode git no Docs — enfileire.

**Shape de cada objeto do array `--json`:**
```jsonc
{
  "id": "T-304",
  "status": "ready",                 // frontmatter
  "spec_status": "hardened",         // frontmatter
  "capacity_target": "sonnet",       // frontmatter (null se ausente)
  "ui": false,                       // frontmatter ui:true → true
  "dependencies": ["T-302a","T-106"],
  "deps_ok": true,                   // todas as deps com status==done
  "worker_model": "deepseek",        // de transitions.jsonl (displayActor)
  "reviewer_models": ["gemini"],
  "rework_count": 0,
  "hardened_by": "claude-opus",      // frontmatter (null se ausente)
  "last_event": {"ts":"...","action":"promote","agent":"haiku"},
  "next_action": "work",             // ver máquina abaixo
  "busy": false                      // status==='in_progress'
}
```

**Máquina `nextAction(task)`** (primeira que casar):
1. `status==='in_progress'` → `"busy"`
2. `status==='review'` → `"review"`
3. `status==='rework'` → `"rework"`
4. `status==='ready'` → `"work"`
5. `status==='draft'` && `spec_status==='hardened'` → `"promote"`
6. `status==='draft'` && `spec_status∈{draft,triaged}` && `deps_ok` → `"harden"`
7. `spec_status==='blocked-decision'` → `"decide"`  (humano — não despachável)
8. senão (`done`/`blocked`/sem deps) → `null`

**`--idle`** = filtra `next_action ∈ {work, review, rework, harden, promote}` E `busy===false`.

1. Leia `.nexus/transitions.jsonl`; agrupe eventos por `id`.
2. Para cada `tasks/*.md` (pula `_*`, `INDEX.md`, `LEDGER.md`): parse frontmatter + `rolesFromTransitions`.
3. Compute `deps_ok`, `next_action`, `busy`. Aplique filtros de CLI. Emita `JSON.stringify(arr)`.
4. Rode o Gate (§7), cole a saída na §8, enfileire.

## 6. Feedback de Especificação (Spec Feedback Loop)
Sem decisões em aberto. Fonte (`transitions.jsonl`), shape e máquina de estados fixados acima.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `--json` emite JSON válido; modo markdown intacto (rodar sem flag ainda gera `LEDGER.md`).
- [ ] Todos os campos da §5 presentes; `next_action`/`deps_ok` corretos.
- [ ] Filtros funcionam e compõem.

### Verificação automática *(comandos exatos — colar saída na §8)*
```bash
node tools/scripts/ledger.mjs --json | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('itens:',a.length,'| chaves[0]:',Object.keys(a[0]).join(','))"
node tools/scripts/ledger.mjs --json --status review | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('review-only:',a.every(t=>t.status==='review'),a.length)"
node tools/scripts/ledger.mjs --json --idle | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log('idle sem done/busy:',a.every(t=>t.next_action&&!t.busy))"
node tools/scripts/ledger.mjs            | head -3   # markdown ainda funciona
```
> **GATE:** sem a saída literal colada na §8, o `finish` não vale.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**  - [ ] **Requer Refatoração**
- **Evidência (colar saída dos 4 comandos da §7):**
```
(cole aqui)
```

## 9. Log de Execução (Agent Execution Log)
> Registrem via `node tools/scripts/manage-task.mjs`. Identidade = modelo real.
- **[2026-06-30T17:45]** - *claude-opus* - `[Promovida p/ ready]`: hardened, sem deps — fundação
