# MGTIA — Workflow Completo (v3)

> **Leitura obrigatória para qualquer agente.** Este documento é a fonte canônica do fluxo MGTIA.
> Os SKILL.md individuais descrevem o "como fazer" de cada skill; este documento descreve o "por que"
> e a ordem de tudo. Leia isto antes de qualquer skill.

---

## 1. Os dois eixos (distinção fundamental)

Toda task tem **dois eixos ortogonais**. Confundi-los é o erro mais comum:

| Eixo | Campo | Quem edita | Valores |
|------|-------|-----------|---------|
| **Lifecycle** (em que fase está a execução) | `status` | Só o serviço (`manage-task.mjs` / MCP `nexus_transition_task`) | `draft → ready → in_progress → review → rework → done` (+ `blocked`) |
| **Qualidade da spec** (quão pronta a spec está para execução) | `spec_status` | Só skills de autoria (`/endurecer-task`, `/arquiteto-decisoes`) | `draft → triaged → hardened` (+ `blocked-decision` / `decomposed`) |

**Nunca** edite `status` no markdown na mão. **Nunca** chame o serviço para mudar `spec_status`.

---

## 2. Modelo dois-repos

O projeto usa **dois repositórios git separados** com papéis distintos:

| Repo | Alias | Caminho típico | Remote | O que vive aqui |
|------|-------|---------------|--------|-----------------|
| **Controle** | `<CTRL>` / Docs | `C:\Dev2026\Docs` | `specs-and-tasks` | Specs (`tasks/T-XXX.md`), skills, agents, scripts (`manage-task.mjs`) |
| **Código** | superapp | `C:\Dev2026\superapp` | `implementacao-superapp` | Código fonte; cada task tem branch `task/<ID>` + worktree isolada |

**Regra de paralelismo no controle (INVIOLÁVEL):**
- O Docs é um **working tree único na `master`** com vários agentes simultâneos.
- Commit atômico por path: `git commit -m "…" -- tasks/T-XXX.md` (fotografa só os paths nomeados no instante do commit).
- **NUNCA** `git add -A`, `git add tasks/`, `git add tasks/*.md` — o index é compartilhado e a corrida entre `git add` e `git commit` faz seu commit levar arquivos de outro agente (aconteceu no commit `fb5459b`).
- `tasks/INDEX.md` e `meta-tasks/INDEX.md` são **artefatos derivados gitignored** — o `TaskService` os regenera a cada transição; nunca commite.
- Colisão de `index.lock` ou push concorrente → `git pull --rebase` e repita.

---

## 3. O pipeline completo

```
[spec_status: draft]
       │
       ▼
  /endurecer-task ──────────────────────────────────────────────────────┐
       │                                                                  │
       ├─► hardened (zero decisões abertas, deps não-draft)              │
       ├─► blocked-decision (precisa do arquiteto)                        │
       ├─► triaged (pass-1 raso, aguarda pass-2 JIT)                     │
       └─► decomposed (quebrada em tasks filhas)                          │
                                                                          │
       │ (blocked-decision)                                               │
       ▼                                                                  │
  /arquiteto-decisoes                                                     │
  (consolida, pergunta ao humano, grava DECIDIDO na §6)                  │
       │                                                                  │
       └──► re-roda /endurecer-task ──────────────────────────────────────┘
                    │ (hardened)
                    ▼
  /arquiteto-promover  (flip draft → ready via serviço — mecânico)
                    │
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
          • push código + commit atômico no controle
                    │
                    ▼
             [status: review]
                    │
                    ▼
          /qa-review  (Reviewer — review-only, NUNCA transiciona)
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
          • re-endurece tasks dependentes desbloqueadas
          • manage-task approve  ──────────────────► [status: done]
          • manage-task request_changes ──────────► [status: rework]
                    │ (rework)
                    ▼
          /rework-task  (Worker em retrabalho)
          • lê achados [Bn]/[Mn] do Parecer
          • corrige só os bloqueantes, commit por achado
          • re-roda Gate, manage-task finish
          • push código + commit atômico no controle
                    │
                    └──► volta para [status: review] ──► /qa-review
```

**Tasks pai `decomposed`:** se a task integrada é filha de um pai com `spec_status: decomposed`,
o integrador verifica se **todas** as filhas do pai estão `done` (lê o campo `blocks:` do pai).
Se sim, fast-track o pai: `promote → start → finish → approve agile_reviewer "filhas <lista> done"`.
Nunca edite o status do pai na mão; se alguma filha ainda estiver aberta, pule (o pai é encerrado
quando a última filha fechar).

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

colada na **Seção 8** da task. Tudo verde. Vermelho → conserte antes. Falha de ambiente
(VS Code terminal integrado trava — ver PITFALLS P-002) → `pause`/`block`, nunca finalize no escuro.

---

## 5. Separação de papéis (INVIOLÁVEL)

| Papel | Pode chamar | Nunca chama |
|-------|------------|-------------|
| **Worker** | `start`, `finish`, `pause`, `block`, `unblock` | `approve`, `request_changes` |
| **Reviewer** (skill `qa-review` / agent `agile-reviewer`) | `block` (só ambiente) | `approve`, `request_changes` (esses ficam no `/integrar-task`) |
| **Integrador** (`/integrar-task`) | `approve`, `request_changes` | — |
| **Arquiteto** (`/arquiteto-promover`) | `promote` | — |

O `/qa-review` e o `agile-reviewer` são **review-only**: escrevem o Parecer na §8 e param.
O merge e a transição de status ficam no `/integrar-task` — isso evita o gap "aprovado sem merge".

---

## 6. Endurecimento da spec (dois passes)

### Pass 1 — Triagem rasa (cedo, qualquer momento)
Rode `/endurecer-task` assim que a task existe. Objetivo: classificar capacidade, detectar spikes,
capturar decisões abertas óbvias. Destino provável: `triaged` ou `blocked-decision`.

### Pass 2 — Endurecimento profundo (JIT, just-in-time)
Rode novamente quando as **deps estão `done`** — agora você tem código real para referenciar.
Troca placeholders por assinaturas reais, carimba `hardened_at`. Destino: `hardened`.

### Reendurecimento
`/endurecer-task` é re-entrante. Rode quantas vezes precisar:
- Depois que deps são integradas (stale por antecipação).
- Depois que `/arquiteto-decisoes` resolve uma decisão aberta.

O `/integrar-task` re-endurece automaticamente as tasks desbloqueadas após cada integração.

### Gate de 4 destinos do `/endurecer-task`

| Destino | Condição |
|---------|---------|
| `hardened` | Zero decisões abertas, deps não-draft, assinaturas reais |
| `blocked-decision` | ≥1 decisão que só o humano pode resolver |
| `triaged` | Pass-1 completo, pass-2 adiado (deps ainda não concluídas) |
| `decomposed` | Task grande demais — quebrada em filhas; esta é descartada |

---

## 7. Capacidade alvo (`capacity_target`)

Orthogonal ao `spec_status`. Define o modelo adequado para executar:

| Valor | Quando usar |
|-------|------------|
| `haiku` | Tarefa mecânica — transformações simples, cleanup, plumbing |
| `sonnet` | Workhorse — tarefa complexa mas **totalmente** especificada (assinaturas reais, zero decisão aberta) |
| `opus-spike` | Requer exploração — entregável = ADR ou PoC com critério claro; não é task normal |

"Preferir Haiku" é viés, não proibição. Sonnet é o padrão real para tasks de lógica não-trivial
plenamente especificadas. Só suba para opus-spike quando a decisão arquitetural for genuinamente aberta.

---

## 8. Segunda revisão independente

Quando uma task já tem um Parecer `[APROVADO]` na §8 e um segundo reviewer a analisa:

1. **Não pule.** Forme a opinião **sem ler o parecer anterior** (anti-anchoring).
2. **Appende** um novo bloco abaixo: `### Parecer do Reviewer N (<modelo>, independente):`.
3. **Nunca sobrescreva** o parecer anterior.

O `/integrar-task` decide pelo **veredito agregado** (último parecer + zero `[Bn]` no conjunto).

---

## 9. Painel transversal: `hardening.mjs`

```bash
node tools/scripts/hardening.mjs [prefixo]
```

Quatro seções:
1. **Estado do spec_status** — quantas tasks em cada valor do eixo de qualidade.
2. **Fila de DECISÕES** — tasks `blocked-decision` com o campo `decisions:` expandido.
3. **PROMOVÍVEIS** — `spec_status: hardened` + lifecycle `draft` (prontas para `/arquiteto-promover`).
4. **Candidatas a REENDURECIMENTO** — `hardened`, `not-started`, deps agora `done`.

Rode ao final de qualquer `/endurecer-task`, `/endurecer-fila`, `/arquiteto-decisoes` ou `/arquiteto-promover`.

---

## 10. Skills e quando chamar cada uma

| Skill | Quando | Modelo típico |
|-------|--------|--------------|
| `/endurecer-task <ID>` | Task criada / deps concluídas / decisão resolvida | sonnet |
| `/endurecer-fila [prefixo]` | Endurecimento em lote por ordem topológica | sonnet |
| `/arquiteto-decisoes [prefixo]` | Há tasks `blocked-decision` — consolida e pergunta ao humano | sonnet + humano |
| `/arquiteto-promover [prefixo]` | Há tasks `hardened` + `draft` — flip mecânico draft→ready | haiku |
| `/executar-task <ID>` | Task `ready`, worktree do superapp | sonnet / haiku |
| `/qa-review <ID> [--integrar]` | Task em `review` — parecer independente; `--integrar` encadeia merge | sonnet / opus |
| `/integrar-task <ID>` | Merge + approve ou request_changes após parecer | sonnet |
| `/rework-task <ID>` | Task em `rework` — corrige só bloqueantes do Parecer | sonnet |
| `/agrupar-cleanup [área]` | Drena `tasks/_pendencias.md` em tasks C-NN por área | sonnet |

---

## 11. Fluxo do controle (Docs) em paralelo

Múltiplos agentes trabalham simultaneamente no mesmo working tree. Cada um:

1. Lê e edita **apenas** os arquivos da sua task.
2. Commita **atomicamente por path**: `git -C <CTRL> commit -m "…" -- tasks/T-XXX.md`
3. Pusha **imediatamente** após o commit (colisão de push → `git pull --rebase`, repita).
4. **NUNCA** edita `tasks/INDEX.md` (gitignored, regenerado pelo serviço).

---

*Atualizado 2026-06-29. Ver também: [[endurecer-task]] · [[integrar-task]] · [[qa-review]] · CLAUDE.md §MGTIA*
