---
id: T-PG-05
title: "vetores: componente fora do catalogo, expressao estourando orcamento, intent acima do privilegio"
status: draft:triaged
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PG-01", "T-PG-02", "T-PG-03"]
blocks: []
---

# T-PG-05 · vetores: componente fora do catalogo, expressao estourando orcamento, intent acima do privilegio

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro + JSDOM)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Testes de vetores adversariais para a linguagem de páginas: garantir que páginas maliciosas são contidas pelo validador (T-PG-01), renderizador (T-PG-02) e mecanismo de segurança. Cobre: componente fora do catálogo, expressão ZEN estourando orçamento, intent acima do privilégio do usuário, página maliciosa tentando injetar HTML/JS.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §3.2 (permissão na fonte, não na página), §5 (teto de abuso — vocabulário fechado de ações), §7 (validador em 3 pontos)
- Enriquecimento: [[spec-page]] — página não consegue fazer nada que o usuário não pudesse sem ela

### Contratos TS (casos de vetor, não novas interfaces)

```ts
// --- packages/pages/tests/vectors.test.ts 
---
// Cada vetor é um caso de teste que monta um PageDocument malicioso
// e verifica que o sistema o rejeita ou contém.

export interface VectorCase {
  name: string;
  description: string;
  /** PageDocument malicioso (ou parcialmente malicioso). */
  document: PageDocument;
  /** Resultado esperado. */
  expect: 'validation_fails' | 'render_aborted' | 'action_blocked';
  /** Invariante violado (L1–L4) ou regra de segurança. */
  invariant: string;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/11-linguagem-de-paginas.md](../docs/caderno-3-sdk/11-linguagem-de-paginas.md) §3.2 (permissão na fonte), §5 (vocabulário fechado de ações), §7 (validação em autoria/ingestão/render)
- [docs/conceitos/spec-page.md](../docs/conceitos/spec-page.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/pages/src/schema.ts` (T-PG-01)
- **[READ]** `packages/pages/src/validator.ts` (T-PG-01)
- **[READ]** `packages/pages/src/renderer.ts` (T-PG-02)
- **[READ]** `packages/pages/src/page-renderer.tsx` (T-PG-02)
- **[READ]** `packages/pages/src/extends.ts` (T-PG-03)
- **[CREATE]** `packages/pages/tests/vectors.test.ts` — casos de vetor adversariais

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro + JSDOM conforme necessidade)
- [x] **Ambiente do Teste:** Node puro e JSDOM (`pnpm --filter @plataforma/pages test`)
- [x] **Fora de Escopo:** Vetores de rede, vetores de grafo

Casos de vetor (numerados):
1. **Componente fora do catálogo:** `component: "script"` ou `component: "iframe"` → `validation_fails`, L1.
2. **Prop inválida:** `props: { innerHTML: { $bind: "fontes.maliciosa" } }` → `validation_fails`, L1.
3. **HTML inline:** `props: { html: "<script>alert(1)</script>" }` → `validation_fails`, L2.
4. **CSS inline:** campo `css` ou `style` no documento → `validation_fails`, L2.
5. **URL de script:** `component: "script"` com `props: { src: "https://evil.com/x.js" }` → `validation_fails`, L2.
6. **Ação não listada:** `actions: { hack: { type: "exec", code: "..." } }` → `validation_fails`, teto de abuso (§5).
7. **Intento acima do privilégio:** página tenta emitir `intent` com `payload` contendo campo `role: "admin"` — o teste verifica que o intent é assinado pela persona do usuário e validado normalmente (a página não eleva privilégio; o pipeline rejeita se o usuário não tem permissão). → `action_blocked`.
8. **Expressão ZEN estourando orçamento:** `$zen` com expressão que consome > `evalBudgetMs` → `render_aborted`, L3.
9. **Profundidade excessiva:** árvore com profundidade 1000 → `validation_fails`, L3.
10. **Contagem de nós excessiva:** 10.000 nós → `validation_fails`, L3.
11. **Acesso a fonte sem permissão:** `sources` declara query sobre projeção que o usuário não tem UCAN para ler → fonte retorna erro de permissão, render mostra fallback.
12. **EXTENDS malicioso:** variante tenta `replace` um nó com `component: "iframe"` → validador rejeita o documento resultante do merge (L1 aplicado pós-merge).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO modifique o validador ou renderizador para fazer esses testes passarem — se falharem, o bug está no componente, não no teste.
> - NÃO crie novos arquivos de implementação — esta task é só testes.

### Pegadinhas conhecidas
- O vetor 7 (intento acima do privilégio) testa que o intent é ASSINADO pela persona do usuário — a página propõe, o pipeline valida. O teste deve verificar que o intent emitido não carrega credenciais extras.
- Vetores de orçamento (8, 9, 10) dependem do ZenEvaluator e dos limites de perfil estarem funcionando (T-PG-02).
- Vetor 12 (EXTENDS malicioso) requer que T-PG-03 esteja implementado para o merge e T-PG-01 para a validação pós-merge.

1. Crie `packages/pages/tests/vectors.test.ts` com os 12 vetores.
2. Cada caso monta o `PageDocument` ofensor, executa validador e/ou renderizador, e assere o resultado esperado.
3. Rode `pnpm --filter @plataforma/pages test` — vetores devem passar (sistema rejeita/contém).

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §3.2, §5, §7 — OK
- `docs/conceitos/spec-page.md` — OK
- `packages/pages/src/schema.ts` — T-PG-01 (dep)
- `packages/pages/src/validator.ts` — T-PG-01 (dep)
- `packages/pages/src/page-renderer.tsx` — T-PG-02 (dep)
- `packages/pages/src/extends.ts` — T-PG-03 (dep)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 12 vetores passam (sistema contém/rejeita)?
- [ ] Nenhum vetor causa crash ou comportamento indefinido?
- [ ] Vetores de validação (1–6, 9–10) retornam `validation_fails`?
- [ ] Vetor de render (8) retorna `render_aborted`?
- [ ] Vetor de intent (7) retorna `action_blocked`?
- [ ] Vetor de EXTENDS (12) valida pós-merge?

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

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
