---
id: T-SHL-02
title: "restricoes de layout no manifesto + gerenciador deterministico (recencia+pinos) + pilha de colapsados"
status: done
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-SHL-01"] # IDs de tarefas que bloqueiam esta
blocks: ["T-SHL-03", "EST-45"] # IDs de tarefas que esta bloqueia
capacity_target: sonnet
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
- [mecanica-de-telas.md §A1](../docs/mecanica-de-telas.md) — mecânica validada no mockup A1 que este solver formaliza: guarda de espaço (viewport <1280px OU >3 colunas abertas → colapsa a coluna **menos recente** para a pilha), pilha de colapsados como chips (clicar restaura como nova coluna; restauração = remontagem, estado efêmero zera), rails com largura fixa não-colapsável.
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §3 — Restrições de layout declaradas e gerenciador determinístico
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §4 — Geração dinâmica de coluna e pilha de colapsados
- [[spec-workspace]] — Layout salvo como SPEC:WORKSPACE (T-SHL-01)
- [ADR 0016](../docs/adr/0016-ui-engines-e-flow-grid.md) e `tasks/EST-45.md` — o solver é
  compartilhado; a adoção pelo Estaleiro acontece depois, por adapter incremental.

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
> **Endurecimento (deepseek — 2026-07-15):** deps T-SHL-01 está `done` → endurecimento JIT (pass-2).
> Ajustes:
> - `lint` adicionado ao Gate (§7) conforme Regra 3 do CLAUDE.md (2026-07-06).
> - Gate de Evidência explicitado com nota sobre lint.
> - Contratos confrontados com `packages/shell/src/workspace.ts` (T-SHL-01 done):
>   `PanelBind`, `FlexLayoutJson`, `WorkspaceSpec`, `ShellRoot` — todos alinhados com a spec
>   de T-SHL-01 §1. O solver de layout é consumido pelo `ShellRoot` ao abrir/fechar painéis
>   e gerenciar a pilha de colapsados.
> **Decisões em aberto: 0.**

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] `LayoutSolver.solve()` é determinístico (mesmo input → mesmo output)?
- [ ] Pinos vencem recência?
- [ ] Pilha de colapsados preserva todos os painéis não-visíveis?
- [ ] Restrições (minWidth, minUsefulWidth, collapsesToRail) são respeitadas?
- [ ] `pnpm test` verde com 8 casos?
- [ ] `pnpm lint` verde — eslint src/ sem erros?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/shell build      # tsc — precisa terminar sem erro
pnpm --filter @plataforma/shell test       # vitest — precisa ficar verde
pnpm --filter @plataforma/shell lint       # eslint src/ — sem erros (Regra 3 do CLAUDE.md)
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.
> **Lint é parte do gate** desde 2026-07-06 (3 reworks consecutivos por regressão de lint cobrada só no review — T-807, EST-02b, EST-02c).

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- **[deepseek]** Implementação completa do solver de layout determinístico: `layout-manager.ts` (interfaces), `layout-solver.ts` (algoritmo guloso: pinos primeiro, recência decrescente), `manifest-types.ts` (ModuleManifest), `tests/layout-solver.test.ts` (9 testes — 8 casos da Seção 4 + caso extra para rail). Re-export no `index.ts`. Gate verde.
- **Gate de Evidência:**
```
=== BUILD ===
$ vite build
vite v5.4.21 building for production...
✓ 19 modules transformed.
dist/index.js  895.05 kB │ gzip: 197.91 kB
✓ built in 5.68s

=== TEST ===
$ vitest run
✓ tests/layout-solver.test.ts (9 tests) 6ms
✓ tests/workspace.test.ts (7 tests) 120ms
Test Files  2 passed (2)
     Tests  16 passed (16)

=== LINT ===
$ eslint src/
(exit 0 — sem erros)
```

### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — saída real de pnpm --filter @plataforma/shell {build,test,lint} rodada dentro da worktree `C:\Dev2026\.superapp-worktrees\T-SHL-02` no branch `task/T-SHL-02` @ `494e271f`):**

```
$ pnpm --filter @plataforma/shell build
> @plataforma/shell@0.1.0 build C:\Dev2026\.superapp-worktrees\T-SHL-02\packages\shell
> vite build

vite v5.4.21 building for production...
transforming...
✓ 19 modules transformed.
rendering chunks...
[vite:dts] Start generate declaration files...
computing gzip size...
[vite:dts] Declaration files built in 1284ms.
dist/index.js  895.05 kB │ gzip: 197.91 kB
✓ built in 3.25s

$ pnpm --filter @plataforma/shell test
> @plataforma/shell@0.1.0 test C:\Dev2026\.superapp-worktrees\T-SHL-02\packages\shell
> vitest run

 RUN  v3.2.6 C:/Dev2026/.superapp-worktrees/T-SHL-02/packages/shell

 ✓ tests/layout-solver.test.ts (9 tests) 5ms
 ✓ tests/workspace.test.ts (7 tests) 93ms

 Test Files  2 passed (2)
      Tests  16 passed (16)
   Start at  17:29:01
   Duration  5.21s

$ pnpm --filter @plataforma/shell lint
> @plataforma/shell@0.1.0 lint C:\Dev2026\.superapp-worktrees\T-SHL-02\packages\shell
> eslint src/

(sem saída — exit 0, sem erros)
```

- **Comentários de Revisão:**
  - **Implementação completa e conforme spec.** Os 5 arquivos da §3 existem no branch `task/T-SHL-02` @ `494e271f`: `src/index.ts` (atualizado, re-exporta os 6 tipos + `createLayoutSolver`), `src/layout-manager.ts` (63 linhas, todos os 6 contratos da §1 com JSDoc e cross-refs), `src/layout-solver.ts` (80 linhas, algoritmo guloso: pinos primeiro, recência decrescente, trilho não-dispara-cascata, pilha ordenada menos-recente-primeiro), `src/manifest-types.ts` (13 linhas), `tests/layout-solver.test.ts` (245 linhas, 9 testes cobrindo 1-a-1 os 8 casos da §4 + sub-caso `8b Rail consome minWidth do viewport`).
  - **Gate verde:** build (`vite build` 19 modules) + test (16/16 passed) + lint (exit 0). Diferencial: a worktree `C:\Dev2026\.superapp-worktrees\T-SHL-02` está **viva** e com `node_modules` instalado, então a evidência é reproduzível. Comando: `git worktree list` mostra a worktree ativa em `494e271 [task/T-SHL-02]`.
  - **Cobertura 1-a-1 dos 8 casos da §4:** ✅
    1. Viewport 1920: 3 visíveis (600 cada) — verde.
    2. Viewport 1024: 2 visíveis (c=600, b=424), a→stack — verde.
    3. Viewport 375 mobile: 1 visível (a=375 best-effort), b→stack — verde.
    4. Pinos vencem recência: pinned (recency 50) visível antes de normal (recency 500) — verde.
    5. Recência: 2 não-pinados, menos recente colapsa — verde.
    6. Mínima-útil (< minUsefulWidth) colapsa mesmo acima de minWidth — verde.
    7. Determinismo: 100 execuções idênticas, output byte-a-byte igual — verde.
    8. Rail ocupa minWidth (não preferredWidth) — verde.
  - **Coupling gate:** solver puro (sem React, sem rede, sem storage). Imports só entre arquivos do próprio pacote. Sem inversão de camadas. ✅
  - **Comportamento correto de pegadinhas da §5:** pinos alocados primeiro, recência decrescente, `collapsesToRail: true` consome `minWidth` sem disparar cascata, `collapseStack` é `[...stackPanels].reverse()` (menos recente primeiro). Trilho vs. pilha bem diferenciado.
  - **Achado MINOR (não-bloqueante) — spec feedback:** a nota `# tsc — precisa terminar sem erro` em §7 da spec (linha 150) é **incorreta** para o pacote `@plataforma/shell`: o `package.json` declara `"build": "vite build"` (com `vite-plugin-dts` para os `.d.ts`). O worker executou o comando que o pacote realmente define (vide gates acima: `> vite build`), e tudo passa. A nota da spec é herança da forma original da §7 (de quando o pacote ainda era `tsc` puro) e precisa ser endurecida em re-pass do `endurecer-task`. **Não é defeito de código — é nota de spec desatualizada.** Registrar no ledger de pendências ou marcar como `spec→T-SHL-02` no `agrupar-cleanup` para endurecedor atualizar a nota.

- **Divergência do parecer anterior (se houver):** n/a (primeiro parecer).
- **Decisão final do reviewer (Reviewer 1 — `agile_reviewer:minimax-m3`, 2026-07-15):** **APROVADO**. Branch `task/T-SHL-02` @ `494e271f` deve ser merged em master via `integrar-task`.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
- **[2026-07-15T19:54]** - *deepseek* - `[Endurecido]`: endureceu spec → lint no gate, contratos verificados
- **[2026-07-15T19:54]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-15T19:59]** - *deepseek* - `[Iniciado]`: iniciando implementação do solver de layout
- **[2026-07-15T20:07]** - *deepseek* - `[Finalizado]`: solver de layout implementado: layout-manager + layout-solver + manifest-types + 9 testes. Build+test+lint verdes (16 testes, 0 erros)
- **[2026-07-15T20:13]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando T-SHL-02 (--integrar)
- **[2026-07-15T20:34]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge task/T-SHL-02 em master (commit 61cf04a, +413 linhas, 5 arquivos), worktree removida, branch task/T-SHL-02 preservada. Gate pós-merge: build verde (vite build 19 modules, dist/index.js 895.05 kB), test 16/16 passed (9 layout + 7 workspace), lint verde nos arquivos de T-SHL-02. Pendências (não-bloqueantes): spec→T-SHL-02 (m1: nota # tsc desatualizada em §7) + i1 (drift pré-existente workspace-store.ts:19 de T-SHL-01, não-bloqueante para T-SHL-02). Push origin master: 9bb8a68..61cf04a.
