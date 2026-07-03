---
id: T-SHL-05
title: "camada de overlay + command palette (superficie) + ciclo de vida de painel (suspensao)"
status: draft:triaged
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-SHL-01", "T-SHL-04"] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
---

# T-SHL-05 · camada de overlay + command palette (superficie) + ciclo de vida de painel (suspensao)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar a camada de overlay (modais, toasts, ghost de drag, command palette) acima da árvore FlexLayout,
a command palette como superfície única de intenção (Cmd/Ctrl-K), e o ciclo de vida de painel (suspensão/remontagem).
Fonte: `caderno-3-sdk/28-shell-e-composicao.md §8, §9`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/shell/src/overlay.ts

export interface OverlayEntry {
  id: string;
  kind: "modal" | "toast" | "context_menu" | "drag_ghost" | "command_palette";
  /** Componente React renderizado no overlay. */
  component: React.ReactNode;
  /** z-index relativo dentro do overlay. */
  zIndex: number;
}

export interface OverlayManager {
  /** Abre uma entrada de overlay (modal, toast, etc.). */
  open(entry: OverlayEntry): void;
  /** Fecha entrada por ID. */
  close(id: string): void;
  /** Lista entradas ativas ordenadas por z-index. */
  listActive(): OverlayEntry[];
}

// --- packages/shell/src/command-palette.ts 
---

export type PaletteIntent = "search" | "action" | "generate";

export interface PaletteResult {
  intent: PaletteIntent;
  /** Query em linguagem natural do usuário. */
  query: string;
  /** ID do módulo alvo (se ação). */
  targetModuleId?: string;
  /** Ação específica (se intent = "action"). */
  action?: string;
}

export interface CommandPalette {
  /** Abre a palette (atalho Cmd/Ctrl-K). */
  open(): void;
  /** Fecha a palette. */
  close(): void;
  /** Resolve query do usuário para intent (search/action/generate). */
  resolve(query: string): Promise<PaletteResult>;
  /** Executa o resultado resolvido. */
  execute(result: PaletteResult): Promise<void>;
}

// --- packages/shell/src/panel-lifecycle.ts ---

export type PanelState = "active" | "suspended" | "collapsed";

export interface PanelLifecycle {
  /** Suspende painel: desmonta componente React, preserva estado de sessão em memória. */
  suspend(panelId: string): void;
  /** Remonta painel: recria componente a partir do estado preservado. */
  resume(panelId: string): void;
  /** Estado atual do painel. */
  getState(panelId: string): PanelState;
  /** Estado de sessão preservado (efêmero, em memória). */
  getSessionState(panelId: string): unknown;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §8 — Camada de overlay e command palette
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §9 — Ciclo de vida e multi-instância (suspensão)
- [[command-palette]] — Definição canônica (superfície de intenção; comportamento IA é T-IA-05)
- [[spec-workspace]] — Workspace restaura layout, não sessões efêmeras (§11.3)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/28-shell-e-composicao.md` §8, §9, §11
- **[READ]** `docs/conceitos/command-palette.md` — contrato da palette
- **[READ]** `packages/shell/src/workspace.ts` — ShellRoot (T-SHL-01)
- **[CREATE]** `packages/shell/src/overlay.ts` — OverlayManager
- **[CREATE]** `packages/shell/src/command-palette.ts` — CommandPalette
- **[CREATE]** `packages/shell/src/panel-lifecycle.ts` — PanelLifecycle (suspend/resume)
- **[CREATE]** `packages/shell/tests/overlay-palette.test.ts` — testes unitários
- **[CREATE]** `packages/shell/e2e/palette.spec.ts` — Playwright (abertura, query, execução)
- **[UPDATE]** `packages/shell/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node) para lógica; Playwright para E2E da palette.
- [x] **Ambiente do Teste:** Node puro para overlay/panel-lifecycle; headless Chromium para command palette.
- [x] **Fora de Escopo:** Classificação de intenção por IA (T-IA-05). Geração de SPEC:PAGE (T-IA-04). Persistência de sessão (opt-in, T-MOD-03).

Casos de teste (numerados):
1. `OverlayManager.open(modal)` → `listActive()` inclui modal; `close(id)` remove.
2. Toast tem z-index maior que modal; ordem de `listActive()` respeita z-index.
3. `CommandPalette.resolve("abrir feed social")` retorna `{ intent: "action", targetModuleId: "social", action: "open_feed" }`.
4. `CommandPalette.resolve("buscar receita de bolo")` retorna `{ intent: "search", query: "receita de bolo" }`.
5. `PanelLifecycle.suspend("panelA")` → `getState("panelA") === "suspended"`; `resume` restaura para "active".
6. Estado de sessão sobrevive a suspend/resume (mesmo objeto retornado por `getSessionState`).
7. Playwright: Cmd/Ctrl-K abre palette; digitar query e Enter executa ação.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente o classificador de IA na palette — esta task é a SUPERFÍCIE (UI + roteamento). A IA fica em T-IA-05.
> - **NÃO** persista estado de sessão além da memória — sessão efêmera é volátil (§9.2: "estado de sessão permanece em memória").
> - **NÃO** duplique a lógica de drag (T-SHL-04) — o ghost de drag no overlay usa o DragShareBridge existente.

### Pegadinhas conhecidas
- **Command palette é superfície, não inteligência:** o método `resolve()` nesta task é um dispatcher baseado em palavras-chave simples (ex.: "abrir", "buscar", "criar"). A classificação semântica real é T-IA-05. O contrato de `PaletteResult` é o mesmo — o dispatcher simples será substituído pelo classificador IA sem mudar a interface.
- **Suspend ≠ destroy:** `suspend()` desmonta o componente React (libera GPU/RAM) mas mantém o estado de sessão em memória. `resume()` remonta com o estado preservado. Não é unmount permanente.
- **Z-index é relativo ao overlay, não global:** o overlay inteiro tem z-index acima do FlexLayout; dentro dele, modais > toasts > menus de contexto. Não tente coordenar z-index com o FlexLayout — são camadas separadas.

1. **[TDD]** Crie `packages/shell/tests/overlay-palette.test.ts` com casos 1–6.
2. Implemente `packages/shell/src/overlay.ts` com as interfaces e OverlayManager.
3. Implemente `packages/shell/src/command-palette.ts` com abertura, dispatcher simples de palavras-chave, execução.
4. Implemente `packages/shell/src/panel-lifecycle.ts` com suspend/resume/getState/getSessionState.
5. Adicione Playwright E2E (caso 7) em `packages/shell/e2e/palette.spec.ts`.
6. Re-exporte em `packages/shell/src/index.ts`.
7. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência. Superfície da palette definida no caderno §8; comportamento IA delegado a T-IA-05.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] OverlayManager gerencia modais/toasts/menus contexto com z-index correto?
- [ ] Command palette abre com Cmd/Ctrl-K e resolve queries para search/action/generate?
- [ ] PanelLifecycle suspende/remonta painéis preservando estado de sessão?
- [ ] Nenhuma lógica de IA na palette (é superfície, não classificador)?
- [ ] `pnpm test` verde? Playwright E2E passa?

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

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:03]** - *system* - `[Triado]`: Triagem em lote do backlog
