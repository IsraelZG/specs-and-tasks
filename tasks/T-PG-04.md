---
id: T-PG-04
title: "sub-dialeto de formularios sobre dataschema de SPEC"
status: draft
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PG-01", "T-PG-02"]
blocks: ["T-PG-05"]
ui: true
---

# T-PG-04 · sub-dialeto de formularios sobre dataschema de SPEC

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (JSDOM) + `playwright` (smoke E2E)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o sub-dialeto de formulários no padrão JSON Forms: dataschema + uischema separados. O dataschema é a própria `SPECIFICATION` do nó alvo (schema de payload já existente) — formulários nunca redefinem a forma dos dados. Validação em duas camadas: estrutural pelo dataschema + regras ZEN da SPEC (as mesmas que o validador aplicará). `submit_form` = emissão de intent de criação/mutação do nó alvo.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §6 (formulários JSON Forms, dataschema + uischema, validação dupla camada)
- Enriquecimento: [[spec-page]] — o dataschema é uma SPEC existente; [[catalogo-de-componentes]] — widgets de formulário são componentes do catálogo

### Contratos TS (derivados do RAG §6)

```ts
// --- packages/pages/src/forms.ts ---
import type { FormDefinition, FormUISchema, FormField, BindingOrExpression, ZenExpression } from './schema';
import type { ReactElement } from 'react';

/** Schema de dados resolvido a partir do nó SPECIFICATION alvo (dataschema_ref). */
export interface DataSchema {
  type: 'object';
  properties: Record<string, DataSchemaProperty>;
  required?: string[];
}

export interface DataSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title_key?: string;
  description_key?: string;
  default?: unknown;
  /** Regras ZEN de validação da SPEC (ex.: min, max, pattern). */
  zenRules?: Record<string, string>;
}

/** Resolve dataschema_ref → DataSchema (lê o nó SPECIFICATION alvo). */
export interface DataSchemaResolver {
  resolve(ref: string): Promise<DataSchema>;
}

export interface FormValues {
  [path: string]: unknown;
}

export type FormValidationError = {
  path: string;
  message: string;
  layer: 'structural' | 'zen';
};

export interface FormValidationResult {
  valid: boolean;
  errors: FormValidationError[];
}

export interface FormValidator {
  validate(values: FormValues, schema: DataSchema): FormValidationResult;
}

export interface FormRendererProps {
  definition: FormDefinition;
  dataschema: DataSchema;
  initialValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onCancel?: () => void;
}

export interface FormRenderer {
  render(props: FormRendererProps): ReactElement;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/11-linguagem-de-paginas.md](../docs/caderno-3-sdk/11-linguagem-de-paginas.md) §6 (formulários, dataschema + uischema, validação dupla camada, submit_form = intent)
- [docs/conceitos/spec-page.md](../docs/conceitos/spec-page.md)
- [docs/conceitos/catalogo-de-componentes.md](../docs/conceitos/catalogo-de-componentes.md) — widgets de formulário

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/pages/src/schema.ts` (FormDefinition, FormField — T-PG-01)
- **[READ]** `packages/pages/src/renderer.ts` (SourceResolver, ZenEvaluator — T-PG-02)
- **[READ]** `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §6
- **[CREATE]** `packages/pages/src/forms.ts` — contratos DataSchema, FormValidator, FormRenderer
- **[CREATE]** `packages/pages/src/form-validator.ts` — validador estrutural + ZEN
- **[CREATE]** `packages/pages/src/form-renderer.tsx` — renderizador React (uischema → campos)
- **[CREATE]** `packages/pages/tests/form-validator.test.ts`
- **[CREATE]** `packages/pages/tests/form-renderer.test.tsx` — JSDOM
- **[UPDATE]** `packages/pages/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (JSDOM para render; Node puro para validador) + Playwright smoke
- [x] **Ambiente do Teste:** JSDOM / Node puro
- [x] **Fora de Escopo:** Integração real com grafo (resolver dataschema_ref de fato), EXTENDS

Casos de teste (numerados):
1. Validação estrutural: campo required ausente → `valid: false`, erro na camada `structural`.
2. Validação estrutural: tipo errado (string em campo number) → `valid: false`.
3. Validação ZEN: regra `min: "5"` sobre campo number com valor 3 → `valid: false`, camada `zen`.
4. Validação ZEN: regra `pattern: "^[a-z]+$"` sobre campo string com "ABC" → `valid: false`.
5. Formulário válido (todos os campos corretos) → `valid: true`, sem erros.
6. `dataschema_ref` não resolvível → erro capturado no FormRenderer, fallback com diagnóstico.
7. Renderização: uischema com 3 campos → 3 inputs no DOM.
8. Renderização: campo com widget "select" → `<select>` no DOM, não `<input>`.
9. `submit_form` dispara `onSubmit` com valores tipados corretamente.
10. `onCancel` dispara sem chamar `onSubmit`.
11. Regra ZEN da SPEC e regra estrutural produzem mensagens distintas (não confundir camadas).
12. Smoke E2E (Playwright): formulário mínimo renderiza, preenche campo, submete sem erro de console.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO crie endpoint de formulário próprio — `submit_form` é intent, não POST.
> - NÃO redefina o schema de dados no formulário — referencie `dataschema_ref`.
> - NÃO implemente o motor ZEN real — use stub que avalia expressões triviais.

### Pegadinhas conhecidas
- Validação em duas camadas: estrutural (tipos, obrigatoriedade) roda primeiro; ZEN roda depois sobre campos estruturalmente válidos. Se falha estrutural, ZEN não é avaliada para aquele campo.
- `dataschema_ref` é um `entity_id` (string), não um caminho de arquivo. O DataSchemaResolver usa o grafo para buscar.
- Widgets de formulário devem ser componentes do catálogo (Input, Select, etc.) — não criar widgets inline.
- O uischema referencia campos por `path` JSON (ex.: `address.street`), não por id de nó da árvore.

1. **[TDD]** Crie `packages/pages/tests/form-validator.test.ts` com os 5 primeiros casos (RED).
2. Implemente `packages/pages/src/forms.ts` com as interfaces.
3. Implemente `packages/pages/src/form-validator.ts` com validação estrutural + ZEN.
4. **[TDD]** Crie `packages/pages/tests/form-renderer.test.tsx` com casos 6–11 (RED).
5. Implemente `packages/pages/src/form-renderer.tsx`.
6. Atualize `packages/pages/src/index.ts`.
7. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §6 — OK (JSON Forms, dataschema + uischema, 4 itens)
- `docs/conceitos/spec-page.md` — OK
- `docs/conceitos/catalogo-de-componentes.md` — OK
- `packages/pages/src/schema.ts` — T-PG-01 (dep)
- `packages/pages/src/renderer.ts` — T-PG-02 (dep)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 11 casos de teste (vitest) passam?
- [ ] Validação em duas camadas: estrutural antes, ZEN depois?
- [ ] `submit_form` usa `onSubmit` (intent), não fetch/POST?
- [ ] Formulário nunca redefine dataschema — só referencia?
- [ ] Playwright smoke (caso 12) sem erro de console?

### Verificação automática
```bash
pnpm --filter @plataforma/pages build
pnpm --filter @plataforma/pages test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
