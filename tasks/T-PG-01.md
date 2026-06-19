---
id: T-PG-01
title: "schema JSON do dialeto v1 + validador estatico (lib isomorfica)"
status: draft
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-004"]
blocks: ["T-PG-02", "T-PG-03", "T-PG-04", "T-PG-05"]
---

# T-PG-01 · schema JSON do dialeto v1 + validador estatico (lib isomorfica)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro — lib isomórfica, sem browser)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Definir o schema JSON do dialeto de páginas v1 e implementar o validador estático que aplica os invariantes L1–L4 em três pontos de execução: autoria (antes de publicar), ingestão (peer que recebe `SPEC:PAGE` replicado) e render. Página inválida não renderiza — exibe fallback com diagnóstico.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §1–§2 (documento, invariantes L1–L4), §7 (validador estático), §8 (perfis de capacidade)
- Enriquecimento: [[spec-page]] confirma `kind: PAGE` como nó `SPECIFICATION`; [[catalogo-de-componentes]] provê o índice de nomes válidos para `component` (Button, Input, Card, Message, NavItem, Toast)

### Contratos TS (derivados do RAG §2)

```ts
// --- packages/pages/src/schema.ts ---

export interface PageDocument {
  dialect_version: string;
  page: PageMetadata;
  sources: Record<string, PageSource>;
  state: Record<string, PageStateField>;
  tree: PageNode;
  forms?: Record<string, FormDefinition>;
  limits_profile?: string;
}

export interface PageMetadata {
  id: string;
  title_key: string;
  route: string;
}

export interface PageSource {
  query: string;
  params?: Record<string, string>;
  /** Se a fonte é editorial (Automerge CRDT). Quando true, o runtime assina mutations. */
  editorial?: boolean;
}

export interface PageStateField {
  type: 'string' | 'number' | 'boolean' | 'string[]';
  default: unknown;
}

export interface PageNode {
  id: string;                  // id estável — alvo de EXTENDS (L4)
  component: string;           // nome do catálogo RFC-006 (L1)
  props?: Record<string, BindingOrExpression>;
  visible?: ZenExpression;
  children?: PageNode[];
  actions?: Record<string, PageAction>;
}

/** $bind é açúcar para expressão identidade sobre fonte. */
export type BindingOrExpression =
  | { $bind: string }
  | { $zen: string };

export type ZenExpression = { $zen: string };

export type PageAction =
  | { type: 'intent'; payload: Record<string, BindingOrExpression> }
  | { type: 'navigate'; route: string }
  | { type: 'set_state'; field: string; value: BindingOrExpression }
  | { type: 'open_form'; form_key: string }
  | { type: 'submit_form'; form_key: string };

export interface FormDefinition {
  dataschema_ref: string;     // entity_id do nó SPECIFICATION alvo (A.6)
  uischema: FormUISchema;
}

export interface FormUISchema {
  fields: FormField[];
}

export interface FormField {
  path: string;
  widget?: string;
  label_key: string;
}

// --- packages/pages/src/validator.ts ---

export interface ValidationDiagnostic {
  invariant: string;          // L1, L2, L3, L4
  path: string;                // caminho JSON apontando o nó ofensor
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  diagnostics: ValidationDiagnostic[];
}

export interface PageValidator {
  validate(doc: PageDocument, catalog: ComponentCatalog): ValidationResult;
}

/** Catálogo mínimo consumido pelo validador (derivado do [[catalogo-de-componentes]]). */
export interface ComponentCatalog {
  listComponentNames(): Set<string>;
  getComponentProps(name: string): Set<string>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/11-linguagem-de-paginas.md](../docs/caderno-3-sdk/11-linguagem-de-paginas.md) §1–§2 (dialeto, invariantes), §7 (validador), §8 (perfis)
- [docs/conceitos/catalogo-de-componentes.md](../docs/conceitos/catalogo-de-componentes.md) — fonte de nomes de componente válidos (L1)
- [docs/conceitos/spec-page.md](../docs/conceitos/spec-page.md) — definição canônica de `SPEC:PAGE`

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/11-linguagem-de-paginas.md` (contrato completo)
- **[READ]** `docs/conceitos/catalogo-de-componentes.md` (nomes válidos)
- **[READ]** `packages/protocol/src/ports.ts` (tipos base — T-004)
- **[CREATE]** `packages/pages/src/schema.ts` — interfaces PageDocument, PageNode, etc.
- **[CREATE]** `packages/pages/src/validator.ts` — PageValidator, ValidationResult, invariantes L1–L4
- **[CREATE]** `packages/pages/src/index.ts` — re-export
- **[CREATE]** `packages/pages/tests/schema.test.ts`
- **[CREATE]** `packages/pages/tests/validator.test.ts`
- **[UPDATE]** `packages/pages/package.json` — dependência `@plataforma/protocol`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/pages test`)
- [x] **Fora de Escopo:** Renderização, resolução de fontes (T-PG-02), EXTENDS (T-PG-03)

Casos de teste (numerados):
1. Documento mínimo (`PageDocument` com tree de 1 nó) valida com sucesso.
2. Invariante L1: `component: "BotaoInexistente"` → `valid: false`, diagnóstico aponta `tree.component`.
3. Invariante L1: prop não declarada no catálogo (`props.xyz`) → `valid: false`.
4. Invariante L2: documento contém campo `html` ou `css` inline → `valid: false`.
5. Invariante L3: profundidade da árvore > limite do perfil → `valid: false`.
6. Invariante L3: contagem de nós > limite do perfil → `valid: false`.
7. Invariante L4: ids duplicados na árvore (ex.: dois nós com `id: "root"`) → `valid: false`.
8. `dialect_version` desconhecida → `valid: false`.
9. Ações: `intent`, `navigate`, `set_state`, `open_form`, `submit_form` todas aceitas no schema.
10. Ação com tipo não listado no vocabulário (§5) → `valid: false`.
11. Perfil `pagina_completa` aceita todos os componentes; perfil `documento` rejeita componente `Card`.
12. Formulário com `dataschema_ref` vazio → `valid: false`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente o renderizador React (T-PG-02).
> - NÃO resolva fontes ou avalie ZEN.
> - NÃO implemente resolução de EXTENDS (T-PG-03).
> - NÃO use `any` — todos os tipos são explícitos.

### Pegadinhas conhecidas
- O catálogo de componentes é um parâmetro injetado no validador, não um import fixo. O validador recebe `ComponentCatalog` como interface, permitindo teste com catálogo fake.
- O perfil (`limits_profile`) afeta L3 (profundidade, contagem, orçamento) mas não L1/L2/L4. Testar separadamente.
- `$bind` e `$zen` são mutuamente exclusivos por nó de prop — validar que não aparecem juntos na mesma entrada.

1. **[SETUP]** Crie `packages/pages/package.json` com nome `@plataforma/pages`, dependendo de `@plataforma/protocol`.
2. **[TDD]** Crie `packages/pages/tests/validator.test.ts` com os 12 casos acima. O teste falha (RED).
3. Crie `packages/pages/src/schema.ts` com as interfaces TypeScript exatas da Seção 1.
4. Crie `packages/pages/src/validator.ts` implementando `validate()` com os 4 invariantes.
5. Crie `packages/pages/src/index.ts` re-exportando schema + validator.
6. Refatore até todos os testes passarem (GREEN).
7. Rode build + test (Seção 7) e cole saída na Seção 8.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/11-linguagem-de-paginas.md` — OK, arquivo existe (103 linhas, §1–§8)
- `docs/conceitos/catalogo-de-componentes.md` — OK (40 linhas, conjunto piloto: Button, Input, Card, Message, NavItem, Toast)
- `docs/conceitos/spec-page.md` — OK (18 linhas, confirma `kind: PAGE`)
- `packages/protocol/src/ports.ts` — existe via T-004 (`ready`)

**Abertos:** Nenhum. Todos os contratos TS estão definidos na Seção 1 a partir do RAG §2.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] Todos os 12 casos de teste passam?
- [ ] Os 4 invariantes (L1–L4) estão cobertos com pelo menos 1 teste cada?
- [ ] `dialect_version` desconhecida produz `valid: false`?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/pages build
pnpm --filter @plataforma/pages test
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.

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
