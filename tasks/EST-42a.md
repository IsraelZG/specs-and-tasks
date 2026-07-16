---
id: EST-42a
title: "Corrigir seed de manifestos de campanha no standalone"
status: in_progress
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-42"]
blocks: []
capacity_target: haiku
---

# EST-42a · Corrigir seed de manifestos de campanha no standalone

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-42a`.
- **Repo de controle:** `C:\Dev2026\Docs`; persistir mudanças via `fila.mjs`, nunca git direto.

## 1. Objetivo
Impedir que arquivos de manifesto `_campanha-*.md` sejam importados como tasks pelo seed do
Estaleiro e remover o `id` artificial adicionado a `_campanha-fugu-01.md` durante o rework de
EST-42. O SQLite não pode receber status `PRONTA` fora do enum `TaskStatus`.

## 2. Contexto RAG
- `tasks/EST-42.md` §8, achado M3 — side-effect do band-aid: seed insere manifesto com status `PRONTA` fora do enum `TaskStatus` (confirmado no rework do R2).
- `tasks/_pendencias.md` item `defer→EST-42a` — registro do defer para esta task.
- `apps/estaleiro/core/src/seed.ts` — função `seedDatabase(taskService, tasksDirPath)`: lê `.md`, parseia frontmatter YAML, monta `Task`, insere via `_storage.saveTask` (4 casos em `tests/seed.test.ts`).
- `packages/plugin-tasks/src/schema.ts:1-13` — `TaskStatus` union fechada: `draft:* | ready | in_progress | review | in_review | rework | done | blocked`. `"PRONTA"` não é membro.
- `packages/plugin-tasks/src/schema.ts:17-65` — interface `Task` (campos: `id`, `title`, `status`, `complexity`, `targetAgent`, `reviewerAgent`, `executionMode`, `dependencies`, `blocks`, `capacityTarget`, `section0-9_*`).
- `tasks/_campanha-fugu-01.md` — manifesto de campanha FUGU-01 (frontmatter: `id: _campanha-fugu-01`, `campaign_id: FUGU-01`, `status: PRONTA`). Não é task.

## 3. Escopo de Arquivos
- **[READ]** `apps/estaleiro/core/src/seed.ts` — função `seedDatabase` (ler antes de editar; fluxo: readdir → readFile → parse frontmatter → montar Task → `_storage.saveTask`).
- **[READ]** `apps/estaleiro/core/tests/seed.test.ts` — padrão de teste existente (4 casos, `vi.mock("node:fs/promises")`, mock `TaskServicePort` com `_storage.saveTask`).
- **[READ]** `packages/plugin-tasks/src/schema.ts` — tipos `Task` e `TaskStatus` (fonte canônica dos contratos; §2).
- **[UPDATE]** `apps/estaleiro/core/src/seed.ts` — entre `const frontmatter = parsed as {...}` (atual L38) e `if (!frontmatter.id)` (atual L40), inserir `continue` quando `file.startsWith("_campanha-") || (frontmatter as Record<string, unknown>).campaign_id`. Não alterar mais nada nesta função.
- **[UPDATE]** `apps/estaleiro/core/tests/seed.test.ts` — adicionar ≥2 novos casos ao `describe("seedDatabase")` conforme §4.
- **[UPDATE]** `C:\Dev2026\Docs\tasks\_campanha-fugu-01.md` — remover somente a linha `id: _campanha-fugu-01` do frontmatter YAML; manter todas as outras linhas. Enfileirar via `node tools/scripts/fila.mjs add EST-42a "fix(EST-42a): remove id artificial do manifesto"`.

## 4. Estratégia de Testes
- **Framework:** Vitest (unit), Playwright/Chromium (E2E).
- **Ambiente:** Node puro (unit), Chromium real (E2E).
- **Caso de teste (numerados):**
  1. Corpus misto (`EST-1.md` + `_campanha-fugu-01.md`): `saveTask` é chamado 1 vez (só `EST-1`); manifesto com prefixo `_campanha-` é ignorado silenciosamente (sem throw).
  2. Corpus com manifesto que tem `campaign_id` mas sem prefixo `_campanha-` (ex.: `foo.md` com `campaign_id: X`): `saveTask` chamado 0 vezes (manifesto ignorado pelo `campaign_id`).
  3. Corpus com manifesto que tem prefixo `_campanha-` mas sem `campaign_id`: `saveTask` ignora o arquivo (prefixo é suficiente).
  4. Corpus com apenas manifestos (todos `_campanha-*`): `saveTask` nunca chamado; `seedDatabase` resolve sem throw.
  5. `pnpm --filter @plataforma/estaleiro test:e2e` — E2E completo continua verde com `_campanha-fugu-01.md` sem `id` artificial (o manifesto é ignorado pelo seed, boot não falha).
- **Fora de escopo:** testar bootstrap, re-seed, erro de diretório — já cobertos pelos 4 casos existentes em `tests/seed.test.ts`.

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO ampliar `TaskStatus` para aceitar `PRONTA`.
> - NÃO editar manualmente INDEX/status/log.
> - NÃO usar git no repo Docs; usar a fila canônica para o manifesto.
> - NÃO alterar a assinatura de `seedDatabase` nem a estrutura de `Task`.

1. **Testes primeiro (TDD):** adicionar os casos 1–4 do §4 ao `tests/seed.test.ts`, seguindo o padrão existente (vi.mock de fs/promises, mock `TaskServicePort` com `_storage.saveTask`). Rodar `pnpm --filter @plataforma/estaleiro-core test` — os novos devem falhar.
2. **Filtro em seed.ts:** entre `const frontmatter = parsed as {...}` (atual L38) e `if (!frontmatter.id)` (atual L40), inserir:
   ```typescript
   if (file.startsWith("_campanha-") || (frontmatter as Record<string, unknown>).campaign_id) continue;
   ```
   *(Derivado do parecer R2 de EST-42 §M3 — caminho recomendado.)*
3. **Remover `id` artificial:** em `tasks/_campanha-fugu-01.md`, remover somente a linha `id: _campanha-fugu-01` do bloco frontmatter. Enfileirar via `node tools/scripts/fila.mjs add EST-42a "fix(EST-42a): remove id artificial do manifesto"`.
4. **Rodar gates:** `pnpm --filter @plataforma/estaleiro-core build && pnpm --filter @plataforma/estaleiro-core test && pnpm --filter @plataforma/estaleiro-core lint`. Colar saída na §8.
5. **Rodar E2E:** `pnpm --filter @plataforma/estaleiro test:e2e`. Colar saída na §8.

## 6. Feedback de Especificação
- Sem decisão aberta; o comportamento correto já foi fixado no parecer de EST-42.
- **Confrontação cross-task:**
  - `Task` type (`packages/plugin-tasks/src/schema.ts:17-65`): **alinhado** — `seed.ts` já importa deste pacote; campos batem.
  - `TaskStatus` enum (`packages/plugin-tasks/src/schema.ts:1-13`): **alinhado** — o filtro impede `"PRONTA"` de entrar no DB, respeitando o enum fechado.
  - EST-42 §M3 (recomendação de fix): **alinhado** — o spec segue exatamente o caminho recomendado (filter `startsWith("_campanha-") || campaign_id`).

## 7. Definition of Done
- [ ] Manifestos de campanha (prefixo `_campanha-` ou `campaign_id` no frontmatter) não entram no banco de tasks.
- [ ] `_campanha-fugu-01.md` volta a não fingir ser task (linha `id:` removida).
- [ ] Core build/test/lint e E2E verdes.

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
pnpm --filter @plataforma/estaleiro test:e2e
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.
> **Lint é parte do gate** (Regra 3 do CLAUDE.md, desde 2026-07-06).

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-16T13:24]** - *gpt-5* - `[Triado]`: triagem: follow-up de seed já fechado pelo parecer de EST-42; cleanup fora da cadeia P0
- **[2026-07-16T13:45]** - *claude-sonnet* - `[Endurecido]`: endureceu spec
- **[2026-07-16T13:45]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-16T13:52]** - *claude-sonnet* - `[Iniciado]`: iniciando
