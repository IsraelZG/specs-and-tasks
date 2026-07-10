# Handover: Varredura de Integração + Supersede de Tasks-Fantasma

**Data:** 2026-06-29  
**Agente:** Crush:deepseek-v4-pro  
**Commit:** `eeef077`

---

## Tarefa 1 — Varredura Preventiva de Integração

**Resultado: NENHUM GAP.** Todos os arquivos de código das branches `task/*` com
status `done` no Docs estão presentes na árvore `master` do superapp.

```
Master source files: 88

=== Nenhum gap encontrado ===
=== fim da varredura ===
```

---

## Tarefa 2 — Supersede de Tasks-Fantasma

### 2.1 Classificação

| Categoria | Qtd | Detalhe |
|---|---|---|
| **FANTASMAS superseded** | 27 | Pai `done` + deliverable confirmado na master |
| **KEEP (pai não-done)** | 16 | T-006a/b, T-108a/b, T-302a/b, T-305a/b, T-404a/b, T-505a/b, T-701a/b, T-MK-04a/b, T-PL-05a/b, T-WF-02a/b |
| **KEEP (trabalho real)** | 2 | T-009a/b — pai done por outro escopo, deliverable NÃO integrado (lição 2) |
| **SEM PARENT (skip)** | 3 | T-018a/b/c — não são decomposições, status `done` sem `parent:` |

### ⚠️ Discrepância T-108a/b

T-108a/b estavam na lista de fantasmas esperados, mas o pai **T-108 está em
`ready`** (não `done`). Pela regra "Pai NÃO done → KEEP", **NÃO foram superseded**.
Mantidos como tasks ativas legítimas.

### 2.2 Arquivos Superseded (27)

Cada um recebeu `superseded_by: T-XXX` no frontmatter + banner `[SUPERSEDED]` +
renomeado com prefixo `_` (sai do INDEX):

| Filho | Pai | Filho | Pai | Filho | Pai |
|---|---|---|---|---|---|
| `_T-016a` | T-016 | `_T-106a` | T-106 | `_T-308a` | T-308 |
| `_T-016b` | T-016 | `_T-106b` | T-106 | `_T-308b` | T-308 |
| `_T-016c` | T-016 | `_T-201a` | T-201 | `_T-501a` | T-501 |
| `_T-101a` | T-101 | `_T-201b` | T-201 | `_T-501b` | T-501 |
| `_T-101b` | T-101 | `_T-202a` | T-202 | `_T-501c` | T-501 |
| `_T-101c` | T-101 | `_T-202b` | T-202 | `_T-601a` | T-601 |
| `_T-104a` | T-104 | `_T-301a` | T-301 | `_T-601b` | T-601 |
| `_T-104b` | T-104 | `_T-301b` | T-301 | `_T-801a` | T-801 |
| `_T-105a` | T-105 | | | `_T-801b` | T-801 |
| `_T-105b` | T-105 | | | | |

### 2.3 INDEX

- **Antes:** ~314 tarefas (com fantasmas)
- **Depois:** 287 tarefas ativas
- Regenerado via `node tools/scripts/rebuild-index.mjs`

---

## Sanidade

- **Repo `superapp`**: NÃO alterado — `git status` limpo, sem novos commits
- **Repo `Docs`**: Commit `eeef077` pushed para `origin/master`
- **Pré-existentes não commitados**: `pnpm-lock.yaml`, `tasks/T-021.md`, `tasks/T-208.md` (alterações anteriores não relacionadas)
