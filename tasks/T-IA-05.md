---
id: T-IA-05
title: "classificacao de intencao da command palette (busca/acao/geracao) + render progressivo"
status: draft:triaged
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-IA-03"]
blocks: ["T-IA-06"]
ui: true
capacity_target: sonnet
---

# T-IA-05 · classificacao de intencao da command palette (busca/acao/geracao) + render progressivo

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (classificação) + `playwright` (palette E2E)
- **Capacidade-alvo:** sonnet
- **ui:** true — requer Playwright para render progressivo + overlay de palette

## 1. Objetivo
Implementar classificação de intenção da command palette: usuário descreve intenção em linguagem natural → sistema resolve para busca (recuperação híbrida), ação (emite `CONTENT:INTENT`) ou geração (agente produz `SPEC:PAGE`/`SPEC:WORKFLOW`). Heurística/SLM barato primeiro; LLM caro só se necessário. Render progressivo por streaming.
**Fonte:** `caderno-3-sdk/14-ia-rag-e-agentes.md §7`. **Conceitos:** [[utilitario-de-ia]], [[agente-de-ia]].

### Contratos essenciais

```ts
// packages/command-palette/src/intent-classifier.ts
export type PaletteAction = 'search' | 'action' | 'generate';
export interface ClassifiedIntent { action: PaletteAction; confidence: number; extractedParams: Record<string, unknown>; }
export interface IntentClassifier { classify(naturalLanguageInput: string): Promise<ClassifiedIntent>; }
export interface CommandPalette { open(): void; close(): void;
  submit(input: string): Promise<{ action: PaletteAction; result: unknown; streamedOutput?: AsyncIterable<string> }>; }
```
**File paths:** `packages/command-palette/src/intent-classifier.ts` (CREATE), `packages/command-palette/src/CommandPalette.tsx` (CREATE), `packages/command-palette/tests/intent-classifier.test.ts` (CREATE), `packages/command-palette/tests/command-palette.e2e.ts` (CREATE Playwright), `packages/command-palette/src/index.ts` (UPDATE).

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §A5](../docs/mecanica-de-telas.md) — mecânica validada no mockup A5: 3 modos como tabs explícitas (Buscar/Agir/Gerar); render progressivo = skeleton com debounce curto (~220ms) antes da lista; resultados **já filtrados por permissão antes do render**; modo Gerar com streaming token-a-token + cursor e estado de **recusa fora de escopo** (mensagem de redirecionamento, não erro); proposta gerada exige **Aceitar/Editar** explícito (diretrizes-ux §3). Pacote pronto: `Command` no `@plataforma/design-system`.
- [caderno-3-sdk/14-ia-rag-e-agentes.md](../docs/caderno-3-sdk/14-ia-rag-e-agentes.md) — §7 (command palette, busca/ação/geração, classificação barata primeiro, render progressivo)
- [[utilitario-de-ia]] — LLM como capacidade compute
- Deps: T-IA-03 (HybridRetrieval para busca)

**Testes (8 casos):** 1. Input "mostrar vendas de março" → classificado como `search`. 2. "criar nota fiscal para o pedido #123" → `action`. 3. "fazer uma página de dashboard de vendas" → `generate`. 4. Heurística resolve "buscar" sem LLM. 5. Input ambíguo → LLM acionado. 6. `submit` retorna `streamedOutput` para `generate`. 7. Palette abre/fecha overlay. 8. Playwright: Cmd+K abre palette, input classified, resultado renderizado.

**Pegadinhas:** Heurística usa keywords ("mostrar"/"buscar" → search, "criar"/"fazer"/"gerar" → generate, verbos de ação → action). Não usar LLM para inputs triviais. Stream: `generate` produz `AsyncIterable<string>`. A palette opera com permissões do usuário — ação acima do privilégio é recusada pelo pipeline.

**Gate:** `pnpm --filter @plataforma/command-palette build && pnpm --filter @plataforma/command-palette test && pnpm --filter @plataforma/command-palette test:e2e`

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÃO EM ABERTO:** T-IA-03 sendo endurecida nesta passada. Classificador usa HybridRetrieval para busca. **Status:** `draft` até T-IA-03 implementada.


## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] Classificador resolve busca/ação/geração com heurística barata?
- [ ] LLM só acionado para inputs ambíguos?
- [ ] `submit` retorna `streamedOutput` para `generate`?
- [ ] Palette overlay abre/fecha (Cmd+K)?
- [ ] Playwright: input classificado e resultado renderizado?
- [ ] `pnpm --filter @plataforma/command-palette build` e `test` verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/command-palette build
pnpm --filter @plataforma/command-palette test
pnpm --filter @plataforma/command-palette test:e2e
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
