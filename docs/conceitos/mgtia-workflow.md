# MGTIA — Workflow Completo (v4)

> **Leitura obrigatória para qualquer agente.** Este documento é a fonte canônica do fluxo MGTIA.
> Os SKILL.md individuais descrevem o "como fazer" de cada skill; este documento descreve o "por que"
> e a ordem de tudo. Leia isto antes de qualquer skill.

---

## 1. Um eixo só — `status` com sub-status de draft

Diferente da v3, **não há mais eixo separado `spec_status`**. A qualidade da spec agora é um
**sub-status do `status`** no próprio lifecycle:

| Status | Significado |
|--------|------------|
| `draft:placeholder` | Spec vazia ou rascunho inicial |
| `draft:triaged` | Triada (capacidade, spike, decompor), aguardando pass-2 JIT |
| `draft:pending_decision` | Tem decisão de arquiteto pendente (campo `decisions:` no frontmatter) |
| `draft:hardened` | Espec completamente endurecida, zero decisões abertas, assinaturas reais |
| `draft:decomposed` | Task grande quebrada em filhas; esta vira casca |
| `ready` | Pronta para execução (Worker pode pegar) |
| `in_progress` | Em execução pelo Worker |
| `review` | Aguardando revisão |
| `in_review` | Revisão em andamento (travada por `claim` — reviewer único) |
| `rework` | Devolvida para correção (worker reabre) |
| `done` | Integrada e encerrada |
| `blocked` | Bloqueada por problema externo |

**Regra de ouro: NUNCA edite `status` no markdown na mão.** Só use os verbos do serviço
(`manage-task.mjs` / MCP `nexus_transition_task`).

### Verbos de endurecimento (escalam `draft:<sub>`)

| Verbo | De → Para | Quem usa |
|-------|-----------|---------|
| `triage` | `draft:placeholder` → `draft:triaged` | `/endurecer-task` |
| `harden` | `draft:triaged` → `draft:hardened` | `/endurecer-task` |
| `block_decision` | `draft:triaged` → `draft:pending_decision` | `/endurecer-task` |
| `decide` | `draft:pending_decision` → `draft:hardened` | `/arquiteto-decisoes` |
| `decompose` | qualquer → `draft:decomposed` | `/endurecer-task` |

### Automatismos (T-1029 — rodam sem intervenção humana)

- **Auto-promote on harden:** se `harden`/`decide` resultou em `draft:hardened` e as deps estão todas `done`, promove automaticamente para `ready`.
- **autoPromoteDependents:** ao `approve → done`, promove todo dependente em `draft:hardened` cujas deps agora estão todas `done`.
- **parentAutoClose:** ao `approve → done` da última filha de um pai decomposto, encerra o pai automaticamente (`→ done`).

---

## 2. Modelo dois-repos

O projeto usa **dois repositórios git separados** com papéis distintos:

| Repo | Alias | Caminho típico | Remote | O que vive aqui |
|------|-------|---------------|--------|-----------------|
| **Controle** | `<CTRL>` / Docs | `C:\Dev2026\Docs` | `specs-and-tasks` | Specs (`tasks/T-XXX.md`), skills, agents, scripts (`manage-task.mjs`) |
| **Código** | superapp | `C:\Dev2026\superapp` | `implementacao-superapp` | Código fonte; cada task tem branch `task/<ID>` + worktree isolada |

**Regra de paralelismo no controle (INVIOLÁVEL):**
- O Docs é um **working tree único na `master`** com vários agentes simultâneos.
- **Agentes NÃO rodam git no Docs** (nem `commit`, nem `push`, nem `add`).
- O agente **edita só o markdown da sua task** e **enfileira** a intenção de commit:
  `node tools/scripts/fila.mjs add <ID> "<msg>" [paths extra]`.
- Um **único consumidor serial** — `/drenar-fila` (`fila.mjs flush`) — faz TODOS os commits pendentes
  (atômicos por path) + um push, periodicamente.
- `tasks/INDEX.md`, `meta-tasks/INDEX.md` e `tasks/.commit-queue/` são **gitignored**.
- **No superapp (código) o git continua igual:** cada task tem branch `task/<ID>` isolada (worktree),
  o worker commita+pusha lá normalmente. A fila é **só do controle**.

---

## 3. O pipeline completo

```
[draft:placeholder]
       │
       ▼
  /endurecer-task ──────────────────────────────────────────────────────┐
       │                                                                  │
       ├─► draft:hardened (zero decisões, deps done → auto-promove)     │
       ├─► draft:pending_decision (precisa do arquiteto)                  │
       ├─► draft:triaged (pass-1 raso, aguarda pass-2 JIT)               │
       └─► draft:decomposed (quebrada em tasks filhas)                    │
                                                                          │
       │ (draft:pending_decision)                                         │
       ▼                                                                  │
  /arquiteto-decisoes                                                     │
  (consolida, pergunta ao humano, grava DECIDIDO na §6, chama decide)    │
       │                                                                  │
       └──► decide → draft:hardened ──────────────────────────────────────┘
                    │ (draft:hardened + deps done → auto-promote)
                    ▼
             [status: ready]
                    │
                    ▼
          /executar-task  (Worker, worktree do superapp)
          • manage-task start
          • implementa na branch task/<ID>
          • commits frequentes por unidade
          • Gate de Evidência (build + test + lint)
          • manage-task finish
          • push código
                    │
                    ▼
             [status: review]
                    │
                    ▼
          /qa-review  (Reviewer — review-only)
          • manage-task claim (review → in_review, trava a task)
          • lê a spec + Gate colado na §8
          • forma opinião INDEPENDENTE (anti-anchoring se já há parecer)
          • escreve Parecer na §8 (bloqueantes [Bn], major [Mn], minor [mn])
          • se --integrar: encadeia /integrar-task
                    │
                    ▼
          /integrar-task  (merge + decisão de approve/request_changes)
          • merge da worktree → master do superapp
          • re-roda Gate pós-merge
          • non-blockers → ledger tasks/_pendencias.md
          • manage-task approve  ──────────────────► [status: done]
                │                                        │
                │  auto-side-effects (T-1029):            │
                │  • autoPromoteDependents                │
                │  • parentAutoClose (pai decomposto)     │
                │                                        │
          • manage-task request_changes ──────────► [status: rework]
                    │ (rework)
                    ▼
          /rework-task  (Worker em retrabalho)
          • lê achados [Bn]/[Mn] do Parecer
          • corrige só os bloqueantes, commit por achado
          • re-roda Gate, manage-task finish
          • push código
                    │
                    └──► volta para [status: review] ──► /qa-review
```

**autoPromoteDependents e parentAutoClose são automáticos** (T-1029): o `approve → done` no
`/integrar-task` dispara os side-effects no serviço, sem intervenção do integrador. A skill
`/arquiteto-promover` existe como **safety-net** para o caso raro de uma task `draft:hardened`
com deps done que o auto-promote não pegou.

Ledger de não-bloqueantes acumula em `tasks/_pendencias.md` e é drenado periodicamente por:

```
/agrupar-cleanup  →  tasks C-NN agrupadas por área  →  segue o fluxo normal
```

---

## 4. Gate de Evidência (INVIOLÁVEL)

`manage-task finish` só é chamado com a **saída literal** de:

```bash
pnpm --filter <pacote> build
pnpm --filter <pacote> test
pnpm --filter <pacote> lint   # quando a spec exigir
```

colada na **Seção 8** da task. Tudo verde. Vermelho → conserte antes.

---

## 5. Separação de papéis (INVIOLÁVEL)

| Papel | Pode chamar | Nunca chama |
|-------|------------|-------------|
| **Worker** | `start`, `finish`, `pause`, `block`, `unblock` | `approve`, `request_changes`, `claim` |
| **Endurecedor** (`/endurecer-task`) | `triage`, `harden`, `block_decision`, `decompose` | `promote`, `start`, `approve` |
| **Arquiteto** (`/arquiteto-decisoes`) | `decide` | — |
| **Safety-net** (`/arquiteto-promover`) | `promote` | — |
| **Reviewer** (`qa-review`) | `claim` (trava a task) | `approve`, `request_changes` |
| **Integrador** (`/integrar-task`) | `approve`, `request_changes` | — |

O `/qa-review` é **review-only**: escreve o Parecer na §8 e para. O merge e a transição de status
ficam no `/integrar-task`. O `claim` (`review → in_review`) é o lock: impede que dois reviewers
peguem a mesma task; o orquestrador trata `in_review` como ocupado.

---

## 6. Lock de revisão (`in_review` + `claim`)

Quando o `/qa-review` pega uma task em `review`, o **primeiro** passo é `claim`:
`manage-task.mjs claim <ID> agile_reviewer:<modelo> "revisando"`.

- `review → in_review` se a task está livre.
- Se a task **já está `in_review`** → o `claim` falha (outro reviewer já a pegou). A skill **PARA** — não rouba a revisão.
- O `orquestrar.mjs` trata `in_review` como "slot ocupado" e não despacha outro reviewer.

O reviewer ainda pode `approve`/`request_changes` direto de `review` (sem `claim`) — retrocompatível
mas desencorajado: o lock evita revisão duplicada.

---

## 7. Endurecimento da spec (dois passes)

### Pass 1 — Triagem rasa (cedo, qualquer momento)
Rode `/endurecer-task` assim que a task existe. Objetivo: classificar capacidade, detectar spikes,
capturar decisões abertas óbvias. Usa `triage` ou `block_decision`.

### Pass 2 — Endurecimento profundo (JIT, just-in-time)
Rode novamente quando as **deps estão `done`** — agora você tem código real para referenciar.
Troca placeholders por assinaturas reais. Usa `harden`. Se as deps estão todas `done`, o
auto-promote (T-1029) leva direto para `ready`.

### Reendurecimento
`/endurecer-task` é re-entrante. Rode quantas vezes precisar:
- Depois que deps são integradas (stale por antecipação).
- Depois que `/arquiteto-decisoes` resolve uma decisão aberta.

### Gate de 4 destinos do `/endurecer-task`

| Destino | Condição |
|---------|---------|
| `draft:hardened` | Zero decisões abertas, deps não-draft, assinaturas reais (auto-promove se deps done) |
| `draft:pending_decision` | ≥1 decisão que só o humano pode resolver |
| `draft:triaged` | Pass-1 completo, pass-2 adiado (deps ainda não concluídas) |
| `draft:decomposed` | Task grande demais — quebrada em filhas; esta vira casca |

---

## 8. Capacidade alvo (`capacity_target`)

Define o modelo adequado para executar:

| Valor | Quando usar |
|-------|------------|
| `haiku` | Tarefa mecânica — transformações simples, cleanup, plumbing |
| `sonnet` | Workhorse — tarefa complexa mas **totalmente** especificada |
| `opus-spike` | Requer exploração — entregável = ADR ou PoC com critério claro |

"Preferir Haiku" é viés, não proibição.

---

## 9. Segunda revisão independente

Quando uma task já tem um Parecer `[APROVADO]` na §8 e um segundo reviewer a analisa:

1. **Não pule.** Forme a opinião **sem ler o parecer anterior** (anti-anchoring).
2. **Appende** um novo bloco abaixo: `### Parecer do Reviewer N (<modelo>, independente):`.
3. **Nunca sobrescreva** o parecer anterior.

---

## 10. Painel transversal: `hardening.mjs`

```bash
node tools/scripts/hardening.mjs [prefixo]
```

Seções:
1. **Estado dos draft:<sub>** — quantas tasks em cada sub-status.
2. **Fila de DECISÕES** — tasks `draft:pending_decision` com `decisions:`.
3. **PROMOVÍVEIS** — `draft:hardened` com deps done que o auto-promote não pegou (safety-net).
4. **Candidatas a REENDURECIMENTO** — `draft:hardened`, deps agora `done`.

---

## 11. Skills e quando chamar cada uma

| Skill | Quando | Modelo típico |
|-------|--------|--------------|
| `/endurecer-task` | Triar ou endurecer uma task específica | Sonnet |
| `/endurecer-fila` | Endurecer em lote (ordem topológica) | DeepSeek V4 Pro |
| `/arquiteto-decisoes` | Destravar tasks `draft:pending_decision` | Sonnet |
| `/arquiteto-promover` | Safety-net: promover `draft:hardened` que o auto-promote não pegou | Haiku |
| `/vincular-rag` | Preencher Seção 2 (Contexto RAG) de tasks novas | DeepSeek V4 Pro |
| `/executar-task` | Executar task `ready` (Worker) | Sonnet/Haiku |
| `/qa-review` | Revisar task em `review` | Agile Reviewer |
| `/integrar-task` | Merge + approve/request_changes | Sonnet |
| `/rework-task` | Corrigir task em `rework` | Haiku |
| `/agrupar-cleanup` | Drenar ledger de pendências | Sonnet |
