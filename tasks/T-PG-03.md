---
id: T-PG-03
title: "mecanismo EXTENDS/override por id estavel + testes de precedencia"
status: draft
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PG-01"]
blocks: ["T-PG-05"]
---

# T-PG-03 · mecanismo EXTENDS/override por id estavel + testes de precedencia

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro — lógica de merge, sem browser)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o mecanismo de `EXTENDS`: dados um `PageDocument` base (canônico) e um `PageDocument` variante (org/usuário), produzir o documento mesclado por override declarativo sobre ids estáveis (L4). Suporta três operações de override: substituir nó, ocultar nó, inserir nó na árvore. A resolução segue descoberta por grafo (mesmo padrão de jurisdição RFC-009).

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §1.2 (customização = EXTENDS), §2 (L4: ids estáveis)
- Enriquecimento: [[spec-page]] — herda linhagem; EXTENDS é operação sobre SPEC:PAGE

### Contratos TS (derivados do RAG §1.2, §2 L4)

```ts
// --- packages/pages/src/extends.ts ---
import type { PageDocument, PageNode } from './schema';

/** Operação de override sobre um nó da árvore, alvo pelo id estável. */
export type OverrideOperation =
  | { type: 'replace'; nodeId: string; newNode: PageNode }
  | { type: 'hide'; nodeId: string }
  | { type: 'insert'; parentId: string; position: number; newNode: PageNode };

export interface ExtendsDirective {
  /** entity_id do SPEC:PAGE base que está sendo estendida. */
  base_page_id: string;
  operations: OverrideOperation[];
}

export interface MergeResult {
  document: PageDocument;
  applied: OverrideOperation[];
  /** Operações cujo alvo (nodeId/parentId) não foi encontrado na base. */
  unresolved: OverrideOperation[];
}

export interface PageExtender {
  /**
   * Aplica overrides da variante sobre a base.
   * - Se `replace`: substitui o nó com `nodeId` pelo `newNode` (mantém posição).
   * - Se `hide`: remove o nó com `nodeId` da árvore (e filhos).
   * - Se `insert`: insere `newNode` na posição `position` dos filhos de `parentId`.
   * Operações são aplicadas em ordem; alvos não encontrados vão para `unresolved`.
   */
  merge(base: PageDocument, directive: ExtendsDirective): MergeResult;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/11-linguagem-de-paginas.md](../docs/caderno-3-sdk/11-linguagem-de-paginas.md) §1.2 (customização = EXTENDS, descoberta por grafo), §2 (L4: ids estáveis e únicos)
- [docs/conceitos/spec-page.md](../docs/conceitos/spec-page.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/pages/src/schema.ts` (PageDocument, PageNode — T-PG-01)
- **[READ]** `docs/caderno-3-sdk/11-linguagem-de-paginas.md`
- **[CREATE]** `packages/pages/src/extends.ts` — PageExtender, MergeResult, OverrideOperation
- **[CREATE]** `packages/pages/tests/extends.test.ts`
- **[UPDATE]** `packages/pages/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente do Teste:** Node puro (`pnpm --filter @plataforma/pages test`)
- [x] **Fora de Escopo:** Descoberta por grafo (resolver qual variante aplicar), renderização, formulários

Casos de teste (numerados):
1. `replace`: nó com id "header" na base é substituído pelo `newNode` da variante.
2. `replace`: nó alvo não encontrado → vai para `unresolved`, base mantida intacta.
3. `hide`: nó com id "sidebar" é removido da árvore resultado.
4. `hide`: nó ocultado remove todos os seus filhos recursivamente.
5. `insert`: `newNode` é inserido na posição 0 dos filhos de "root".
6. `insert`: posição além do número de filhos → inserido no final.
7. `insert`: `parentId` não encontrado → `unresolved`.
8. Múltiplas operações em ordem: hide "A", replace "B" com novo nó, insert em "C".
9. Verifica que ids permanecem únicos após merge (L4).
10. Operação `replace` com `newNode.id` já existente em outro ramo → conflito de id, vai para `unresolved`.
11. Base mínima (1 nó) com variante que insere filho → árvore resultante tem 2 nós.
12. Base com 3 níveis de profundidade, hide no nível 2 → filhos do nível 3 também somem.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente descoberta por grafo (qual SPEC:PAGE estende qual).
> - NÃO modifique o documento base original (imutabilidade).
> - NÃO invente operações novas além de replace/hide/insert.

### Pegadinhas conhecidas
- O merge é deep-clone da base — nunca muta o original.
- `nodeId` é o id do `PageNode`, não o `page.id`. São escopos diferentes.
- `insert` usa índice 0-based; índice negativo ou não-inteiro deve ser rejeitado.
- Ids de nós inseridos não podem conflitar com ids existentes após merge (L4).

1. **[TDD]** Crie `packages/pages/tests/extends.test.ts` com os 12 casos (RED).
2. Implemente `packages/pages/src/extends.ts` com a função `merge()`.
3. Atualize `packages/pages/src/index.ts`.
4. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §1.2 — OK (descreve EXTENDS como override declarativo)
- `docs/conceitos/spec-page.md` — OK
- `packages/pages/src/schema.ts` — será criado por T-PG-01 (dep)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 12 casos de teste passam?
- [ ] Documento base nunca é mutado (deep clone)?
- [ ] Operações com alvo não encontrado vão para `unresolved` (nunca crash)?
- [ ] Ids permanecem únicos após merge (L4)?

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
