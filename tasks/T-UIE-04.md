---
id: T-UIE-04
title: "Workflow de geração de SPEC:PAGE via catálogo e UI Engines"
status: draft:triaged
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-DS-06", "T-IA-04", "T-UIE-01", "T-UIE-03", "DMM-17"]
blocks: []
capacity_target: sonnet
ui: true
test_profile: ui
---

# T-UIE-04 · Workflow de geração de `SPEC:PAGE` via catálogo e UI Engines

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/T-UIE-04`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Vitest, Playwright.
- **Capacidade-alvo:** sonnet (geração validada de `SPEC:PAGE` via catálogo e UI Engines).

## 1. Objetivo
Implementar o workflow declarativo registrado em `@plataforma/ui-engines` e `@plataforma/pages` que transforma intenção em linguagem natural em uma proposta validada de `SPEC:PAGE`:
1. **Pipeline de Geração:** `intenção` $\rightarrow$ `query_catalog` $\rightarrow$ `inspect_component_schema` $\rightarrow$ `build_page_spec` $\rightarrow$ `validate_spec` $\rightarrow$ `render_ui_engine`.
2. **Restrição por Catálogo:** O agente preenche estritamente schemas Zod e propriedades permitidas do `@plataforma/design-system`; é proibido emitir HTML/CSS livre ou escolher componentes inexistentes.
3. **Invocação Uniforme:** O workflow é exposto como Tool via `invoke_workflow` ([DMM-17](./DMM-17.md)), invocável do Chat ou de receitas DMM sem caminhos visuais privilegiados.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §§2–3 e 9.
- [T-DS-06](./T-DS-06.md) — Porta canônica `query → inspect` do catálogo.
- [T-IA-04](./T-IA-04.md) — Proposta de `SPEC:PAGE` validada e persona delegada.
- [T-UIE-01](./T-UIE-01.md) e [T-UIE-03](./T-UIE-03.md) — Contratos e componentes funcionais de UI Engines.
- [DMM-17](./DMM-17.md) — Invocação uniforme de workflows via `invoke_workflow`.
- [Referências locais](../docs/referencias-codigo-aberto.md) — Dashi em `docs/_vendor/dashi-ppt-skill` (inspiração clean-room de validação de layout).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/ui-engines/src/index.ts` *(derivado de T-UIE-01)*.
- **[READ]** `packages/pages/src/index.ts` *(derivado de T-IA-04)*.
- **[CREATE]** `packages/pages/src/workflows/pageGenerationWorkflow.ts` — implementação do workflow `generatePageSpecWorkflow` e sua Tool de registro.
- **[UPDATE]** `packages/pages/src/index.ts` — re-exportar o `generatePageSpecWorkflow`.
- **[CREATE]** `packages/pages/test/pageGenerationWorkflow.test.ts` — testes unitários de validação de Zod e rejeição de HTML livre.
- **[CREATE]** `apps/estaleiro/ui/e2e/pageGeneration.spec.ts` — teste E2E Playwright de geração de página a partir de um prompt e renderização no engine visual.

### Assinaturas TS Derivadas (packages/pages/src/workflows/pageGenerationWorkflow.ts)
```typescript
import { z } from 'zod';
import { UniversalToolDescriptor } from '@plataforma/core';

export const PageGenerationInputSchema = z.object({
  userIntent: z.string().min(3),
  targetLayout: z.enum(['dashboard', 'form', 'kanban', 'detail']).default('dashboard'),
  allowedComponents: z.array(z.string()).optional(),
});

export const PageGenerationOutputSchema = z.object({
  success: z.boolean(),
  pageSpec: z.record(z.unknown()).optional(),
  validationErrors: z.array(z.string()).optional(),
});

export type PageGenerationInput = z.infer<typeof PageGenerationInputSchema>;
export type PageGenerationOutput = z.infer<typeof PageGenerationOutputSchema>;
```

## 4. Estratégia de Testes Estrita
Enumeração dos 6 casos de teste obrigatórios em `packages/pages/test/pageGenerationWorkflow.test.ts` e E2E Playwright:

1. **Geração Válida por Catálogo:** Prompt de intenção gera um `SPEC:PAGE` contendo apenas componentes registrados no `@plataforma/design-system`.
2. **Rejeição de HTML/CSS Livre:** Proposta contendo elementos HTML crus (`<div style="...">`) ou seletores arbitrários é recusada no passo `validate_spec` e retorna `validationErrors`.
3. **Limite de Schema por Componente:** `inspect_component_schema` limita as propriedades da página gerada aos tipos declarados pelo Zod schema do componente.
4. **Resolução de Erro de Intenção:** Intenção sem componente compatível no catálogo retorna estado legível de seleção/erro sem estourar exceção unhandled.
5. **Teste E2E Playwright:** Usuário digita prompt no Chat / Palette, o workflow gera a `SPEC:PAGE` e a UI renderiza o layout correspondente no `@plataforma/ui-engines`.
6. **Invocação Par via MCP/UI:** O workflow gera o mesmo resultado tanto se invocado via Tool MCP quanto se disparado por ação da UI.

## 5. Não fazer
- NÃO copiar ou adaptar código do repositório Dashi.
- NÃO permitir que o agente emita CSS arbitrário ou injete scripts em linha.
- NÃO pular os testes E2E do Playwright por ser tarefa de UI.

## 6. Feedback de Especificação
- Decisão arquitetural 100% resolvida pelas ADRs 0016, 0019 e DMM-17.
- Schemas alinhados com o `@plataforma/pages` e `@plataforma/ui-engines`.

## 7. Gate por Comando
```bash
pnpm gate @plataforma/pages --profile ui
```
*(Executa `pnpm --filter @plataforma/pages build`, `test` e `lint`, colando evidências na Seção 8).*

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triada geração de SPEC:PAGE via catálogo.
- **[2026-07-24T06:49]** - *gemini-3.6-flash* - `[Hardened]`: Spec endurecida com Zod schemas, testes Playwright/Vitest e gate de UI.
