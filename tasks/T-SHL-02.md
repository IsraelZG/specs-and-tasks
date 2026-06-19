---
id: T-SHL-02
title: "restricoes de layout no manifesto + gerenciador deterministico (recencia+pinos) + pilha de colapsados"
status: draft
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-SHL-01"] # IDs de tarefas que bloqueiam esta
blocks: ["T-SHL-03"] # IDs de tarefas que esta bloqueia
---

# T-SHL-02 · restricoes de layout no manifesto + gerenciador deterministico (recencia+pinos) + pilha de colapsados

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o gerenciador de espaço determinístico do shell: restrições de layout declaradas no manifesto,
solver determinístico (recência + pinos), e pilha de colapsados. Fonte: `caderno-3-sdk/28-shell-e-composicao.md §3, §4`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/shell/src/layout-manager.ts

export interface LayoutConstraints {
  /** Largura mínima em pixels. */
  minWidth: number;
  /** Largura mínima-para-ser-útil (abaixo disso colapsa). */
  minUsefulWidth: number;
  /** Largura preferida. */
  preferredWidth: number;
  /** Se pode colapsar para trilho (só ícones). */
  collapsesToRail: boolean;
  /** Se pode ser empilhado como row. */
  stackable: boolean;
  /** Se é pinável (pino do usuário vence recência). */
  pinnable: boolean;
}

export interface ManifestLayoutEntry {
  moduleId: string;
  constraints: LayoutConstraints;
}

export type LayoutDecision =
  | { kind: "visible"; width: number }
  | { kind: "collapsed_to_rail"; railOrder: number }
  | { kind: "collapsed_to_stack"; stackIndex: number };

export interface LayoutSolverInput {
  viewportWidth: number;
  panels: Array<{
    panelId: string;
    moduleId: string;
    pinned: boolean;
    lastInteractionTime: number; // HLC timestamp
  }>;
}

export interface LayoutSolverOutput {
  /** Mapa panelId → decisão de layout. */
  decisions: Map<string, LayoutDecision>;
  /** Pilha de colapsados ordenada (menos recente primeiro). */
  collapseStack: string[];
}

export interface LayoutSolver {
  /** Dado viewport + painéis abertos + restrições + recência + pinos, produz layout reproduzível. */
  solve(input: LayoutSolverInput, manifest: Map<string, LayoutConstraints>): LayoutSolverOutput;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §3 — Restrições de layout declaradas e gerenciador determinístico
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §4 — Geração dinâmica de coluna e pilha de colapsados
- [[spec-workspace]] — Layout salvo como SPEC:WORKSPACE (T-SHL-01)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/28-shell-e-composicao.md` §3, §4, §11
- **[READ]** `packages/shell/src/workspace.ts` — PanelBind, ShellRoot (T-SHL-01)
- **[CREATE]** `packages/shell/src/layout-manager.ts` — interfaces + solver determinístico
- **[CREATE]** `packages/shell/src/layout-solver.ts` — implementação do algoritmo de alocação
- **[CREATE]** `packages/shell/src/manifest-types.ts` — tipos de manifesto de módulo
- **[CREATE]** `packages/shell/tests/layout-solver.test.ts` — testes unitários
- **[UPDATE]** `packages/shell/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, lógica determinística).
- [x] **Ambiente do Teste:** Node puro — o solver é pura função, sem DOM.
- [x] **Fora de Escopo:** Renderização FlexLayout (já em T-SHL-01). Integração com manifestos reais de módulo.

Casos de teste (numerados):
1. Viewport largo (1920px): 3 painéis cabem com largura preferida; todos visíveis.
2. Viewport médio (1024px): apenas 2 cabem; o 3º vai para pilha de colapsados.
3. Viewport estreito (375px, mobile): 1 visível; demais colapsados.
4. Pino vence recência: painel pinado NUNCA vai para pilha, mesmo sendo menos recente.
5. Recência decide entre dois não-pinados: o menos recente colapsa primeiro.
6. Mínima-útil: painel abaixo de `minUsefulWidth` colapsa mesmo se ainda acima de `minWidth`.
7. Determinismo: mesmo input → mesmo output sempre (sem aleatoriedade).
8. Painel colapsado para trilho ocupa `minWidth` em vez de `preferredWidth`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use heurística opaca ou aleatória — o solver DEVE ser determinístico (§3.2: "reproduzível — nada de heurística opaca").
> - **NÃO** perca painéis silenciosamente — colapsados vão para a pilha visível (§4.2: "nada se perde silenciosamente").
> - **NÃO** ignore pinos — pino do usuário sempre vence recência (§3.2).

### Pegadinhas conhecidas
- **Ordem de alocação importa:** aloque primeiro pinados (largura fixa), depois por recência decrescente. O remanescente do viewport é dividido entre os visíveis; se não cabe o próximo útil, todos os seguintes colapsam.
- **Trilho vs. pilha:** se `collapsesToRail: true`, o painel colapsado mantém ícone visível na barra lateral. Se `false`, vai direto para pilha de colapsados. A largura do trilho soma ao espaço ocupado.
- **Restrições mal declaradas degradam o layout (§11.1):** se `minWidth > viewportWidth`, o solver faz best-effort (usa `minWidth` e overflow horizontal), mas emite warning no logger. Não travar a UI.

1. **[TDD]** Crie `packages/shell/tests/layout-solver.test.ts` com os 8 casos da Seção 4.
2. Implemente `packages/shell/src/layout-manager.ts` e `packages/shell/src/manifest-types.ts` com as interfaces.
3. Implemente `packages/shell/src/layout-solver.ts`: algoritmo guloso, pinos primeiro, recência decrescente.
4. Re-exporte em `packages/shell/src/index.ts`.
5. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência. Contratos derivados do caderno §3 e §4.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] `LayoutSolver.solve()` é determinístico (mesmo input → mesmo output)?
- [ ] Pinos vencem recência?
- [ ] Pilha de colapsados preserva todos os painéis não-visíveis?
- [ ] Restrições (minWidth, minUsefulWidth, collapsesToRail) são respeitadas?
- [ ] `pnpm test` verde com 8 casos?

### Verificação automática
```bash
pnpm --filter @plataforma/shell build
pnpm --filter @plataforma/shell test
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
