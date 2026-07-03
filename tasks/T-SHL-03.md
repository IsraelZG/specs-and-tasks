---
id: T-SHL-03
title: "responsividade continua (multi-coluna para mobile) + chrome-como-modulo (menu reposicionado)"
status: draft:triaged
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-SHL-01", "T-SHL-02"] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
---

# T-SHL-03 · responsividade continua (multi-coluna para mobile) + chrome-como-modulo (menu reposicionado)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar responsividade contínua do shell (multi-coluna para mobile) dirigida por largura de viewport,
e o chrome (header/menu/footer) como módulo reposicionável por regime. Fonte: `caderno-3-sdk/28-shell-e-composicao.md §2, §5`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/shell/src/responsive.ts

export type ResponsiveRegime = "desktop" | "tablet" | "mobile";

export interface ResponsiveConfig {
  /** Largura mínima para regime desktop (multi-coluna). */
  desktopMinWidth: number;  // default 1025
  /** Largura mínima para regime tablet. */
  tabletMinWidth: number;   // default 641
  /** Abaixo disso = mobile (1 módulo por vez + footer). */
}

export interface ResponsiveShell {
  /** Retorna regime atual baseado em viewport width. */
  getRegime(width: number): ResponsiveRegime;
  /** Reorganiza chrome conforme regime (menu lateral → footer). */
  adaptChrome(regime: ResponsiveRegime): void;
  /** Recalcula layout com LayoutSolver (T-SHL-02) para nova largura. */
  onResize(newWidth: number): void;
}

// --- packages/shell/src/chrome-module.ts 
---

export interface ChromeManifest {
  /** Módulo de header. */
  headerModule: string;
  /** Módulo de menu lateral (desktop) / navegação (mobile). */
  navModule: string;
  /** Módulo de footer (mobile). */
  footerModule: string;
}

export interface ChromeAdapter {
  /** Monta chrome conforme regime. No desktop: nav lateral; no mobile: footer. */
  mount(regime: ResponsiveRegime): void;
  /** Atualiza visibilidade de itens de menu conforme permissões do usuário. */
  filterByPermission(accessibleModules: string[]): void;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §2 — Chrome como módulo (header, menus, footer = módulos comuns em regiões fixas)
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §5 — Responsividade contínua (desktop/tablet/mobile)
- [[spec-workspace]] — Layout salvo no workspace (T-SHL-01)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/28-shell-e-composicao.md` §2, §5
- **[READ]** `packages/shell/src/layout-manager.ts` — LayoutSolver (T-SHL-02)
- **[CREATE]** `packages/shell/src/responsive.ts` — interfaces acima + regime detector
- **[CREATE]** `packages/shell/src/responsive-shell.ts` — implementação (resize listener, adaptação)
- **[CREATE]** `packages/shell/src/chrome-module.ts` — ChromeAdapter
- **[CREATE]** `packages/shell/tests/responsive.test.ts` — testes unitários
- **[CREATE]** `packages/shell/e2e/responsive.spec.ts` — Playwright (resize + troca de regime)
- **[UPDATE]** `packages/shell/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node) para lógica pura; Playwright para E2E de resize.
- [x] **Ambiente do Teste:** Node puro para regime; headless Chromium para E2E.
- [x] **Fora de Escopo:** Implementação real dos módulos de menu (só a adaptação de layout). Filtro de permissão real (depende de T-502).

Casos de teste (numerados):
1. `getRegime(1920)` → `"desktop"`; `getRegime(800)` → `"tablet"`; `getRegime(360)` → `"mobile"`.
2. Ao entrar em regime mobile, nav lateral é removida e footer é montado.
3. Ao sair de mobile, footer é desmontado e nav lateral é restaurada.
4. O mesmo módulo de menu é usado em ambos regimes (§2.2: "não há dois códigos de navegação").
5. Playwright: redimensionar janela de 1920→360→1024 dispara transições de regime com layout correto.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie dois códigos de navegação (desktop e mobile separados). O menu é UM módulo reposicionado (§2.2).
> - **NÃO** use media queries CSS para lógica de negócio — a decisão de regime é via JS (largura em px), não CSS.
> - **NÃO** perca o foco do usuário durante a transição de regime.

### Pegadinhas conhecidas
- **Resize é frequente:** use debounce (150ms) no handler de resize para não recalcular layout a cada pixel. O LayoutSolver de T-SHL-02 é síncrono e barato, mas chamar 60×/segundo ainda é desperdício.
- **Mobile esconde, não destrói:** ao entrar em mobile, painéis não-visíveis devem ter seus componentes desmontados (suspensão, ver T-SHL-05) mas estado de sessão preservado.
- **Chrome é spec-driven:** não hardcode header/menu/footer no shell. O ChromeManifest declara quais módulos ocupam essas regiões; trocar o manifesto (white-label) troca o chrome sem recompilar.

1. **[TDD]** Crie `packages/shell/tests/responsive.test.ts` com casos 1–4.
2. Implemente `packages/shell/src/responsive.ts` com as interfaces.
3. Implemente `packages/shell/src/responsive-shell.ts`: regime detection + adaptação via LayoutSolver.
4. Implemente `packages/shell/src/chrome-module.ts`: ChromeAdapter que monta chrome conforme regime.
5. Adicione Playwright E2E (caso 5) em `packages/shell/e2e/responsive.spec.ts`.
6. Re-exporte em `packages/shell/src/index.ts`.
7. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência. Contratos derivados do caderno §2 e §5.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] Regimes desktop/tablet/mobile detectados por largura?
- [ ] Mesmo módulo de menu reposicionado conforme regime (não dois códigos)?
- [ ] Transições de regime não perdem estado?
- [ ] Chrome filtrável por permissão?
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
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
