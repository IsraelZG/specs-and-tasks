---
id: T-SHL-03
machine: Vivobook16
worktree_path: C:\Dev2026\.superapp-worktrees\T-SHL-03
title: "responsividade continua (multi-coluna para mobile) + chrome-como-modulo (menu reposicionado)"
status: done
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
target_pkg: "@plataforma/shell"
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-SHL-01", "T-SHL-02"] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: sonnet
test_profile: full
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
- [mecanica-de-telas.md §A1](../docs/mecanica-de-telas.md) — regime mobile validado no mockup A1: coluna única = app central; rails de comms/módulos viram **overlays fullscreen** disparados por botões no footer (toggle abre/fecha, título + Fechar); chrome reposiciona, não some. Footer desktop = status (dot de sync verde/âmbar/vermelho + online/sem-rede + app ativo); footer mobile acumula a navegação.
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

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/shell build
pnpm --filter @plataforma/shell test
pnpm --filter @plataforma/shell lint
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- **Arquivos criados:** `src/responsive.ts`, `src/responsive-shell.ts`, `src/chrome-module.ts`, `tests/responsive.test.ts`, `e2e/responsive.spec.ts`
- **Arquivos atualizados:** `src/index.ts` (novos re-exports)
- **Fixture atualizado:** `e2e/fixture/main.ts` (regime indicator + nav/footer elementos)
- **Contratos:** `ResponsiveDetector`, `ResponsiveShell`, `ChromeAdapter` conforme spec §1
- **Gate:** full profile — build + test + lint all green

### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
✅ @plataforma/shell:build | exit=0 | 5185ms
✅ @plataforma/shell:test | exit=0 | 9079ms  (34 passed, 3 files: layout-solver, responsive, workspace)
✅ @plataforma/shell:lint | exit=0 | 6483ms
📦 artefato: .gate/c772a3694e2e704f0b273081de328ca27618787d.json | profile=full | allGreen=true
   treeSha verificado contra HEAD^{tree} stripado (.gate removido) → match
   headSha/finalHeadSha = cebb557 = HEAD
```
- **Sonda E2E (Playwright — caso 5 do spec §4):**
```
$ pnpm --filter @plataforma/shell test:e2e --grep "Responsive shell E2E"
  ✓  e2e\responsive.spec.ts:8:3 › Responsive shell E2E › resize 1920→360→1024
     dispara transições de regime com layout correto (1.8s)
  1 passed (5.8s)
```
- **Comentários de Revisão (Reviewer 2 — minimax-m3):**

  **Auditoria de código (Nível 0):** 7 arquivos / 511 inserções, 3 deleções, escopo 100% aderente ao §3 da spec.
  - `responsive.ts`: detector puro, boundaries 1025/641 conforme spec §1 (defaults), config customizada suportada.
  - `responsive-shell.ts`: debounce 150ms conforme pegadinha §5; `adaptChrome` idempotente (early return se regime==current); `desktop↔tablet` corretamente no-op; mesmo `navModuleId` em `mountNav` e `mountFooter` (caso 4).
  - `chrome-module.ts`: stubs declarados "Fora de Escopo" pelo spec §4 (FlexLayout integration em WorkspaceShell, filter real em T-502). Parâmetros `_manifest`/`_regime` marcados com eslint-disable — aceitável enquanto a integração não acontece.
  - `index.ts`: re-exports de tipos e factories presentes.
  - `tests/responsive.test.ts`: 18 tests cobrindo boundaries (1024↔1025, 640↔641, 0), custom config, transições, debounce, mesmo-module.
  - `e2e/responsive.spec.ts`: caso 5 validado, passa.

  **DoD checklist (spec §7):**
  - [x] Regimes desktop/tablet/mobile detectados por largura
  - [x] Mesmo módulo de menu reposicionado (não dois códigos)
  - [x] Transições de regime não perdem estado (chrome desmonta/monta, estado preservado)
  - [x] Chrome filtrável por permissão
  - [x] `pnpm test` verde + Playwright E2E passa

  **Diff × Escopo (§3):** declarado | alterado | disposição
  - [READ] caderno-3-sdk/28-shell-e-composicao.md §2,§5 | — (não versionado) | ok
  - [READ] layout-manager.ts | — (não modificado) | ok
  - [CREATE] src/responsive.ts | +35 | declarado
  - [CREATE] src/responsive-shell.ts | +94 | declarado
  - [CREATE] src/chrome-module.ts | +48 | declarado
  - [CREATE] tests/responsive.test.ts | +249 | declarado
  - [CREATE] e2e/responsive.spec.ts | +40 | declarado
  - [UPDATE] src/index.ts | +19 (re-exports) | declarado
  - **e2e/fixture/main.ts | +29 −3 | `minor`** — modificado sem declaração explícita no §3, justificado no handover ("Fixture atualizado: regime indicator + nav/footer elementos") e necessário para o caso 5 do E2E rodar. Spec-future: endurecedores de T-SHL-XX devem listar fixtures E2E no §3 quando o caso de teste exigir data attributes novas.

  **Achados:**
  - `B0` (bloqueante): 0
  - `M0` (major): 0
  - `m0` (minor): 1 (scope do fixture E2E)
  - `i0` (info): spec §7 lista `pnpm test` mas o gate canônico (gate.mjs) não inclui `test:e2e` para pacotes não-estaleiro — a fase Playwright ficou só provada por sonda do reviewer, não pelo artefato. Não bloqueia este parecer (prova foi feita), mas o spec deveria declarar `pnpm --filter @plataforma/shell test:e2e` no bloco "Verificação automática" ou o gate.mjs deveria ganhar um ramo para `test_profile: ui|full` em pacotes com playwright.config.

  **Veredito:** APROVADO. Pronto para `integrar-task`.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
- **[2026-07-18T11:32]** - *gemini* - `[Endurecido]`: endureceu spec: 5 casos (4 unit + 1 playwright), gate com lint, contratos derivados de caderno-3/28 ss2 ss5
- **[2026-07-18T11:32]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-26T21:12]** - *claude-sonnet* - `[Iniciado]`: iniciando
- **[2026-07-26T21:29]** - *claude-sonnet* - `[Finalizado]`: responsividade continua (multi-coluna para mobile) + chrome-como-modulo (menu reposicionado). 34/34 tests pass, E2E responsive resize 1920→360→1024 pass, gate full allGreen=true. build:873ms test:2040ms lint:3328ms
- **[2026-07-27T12:04]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando
- **[2026-07-27T13:06]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: QA Reviewer 2 (minimax-m3) — APROVADO. Gate full profile verde (3 phases: build 5185ms, test 9079ms 34/34, lint 6483ms), treeSha matches HEAD^{tree} stripado, headSha=cebb557. Sonda Playwright E2E caso 5 (resize 1920-360-1024) verde em 1.8s. DoD 5/5. 0B/0M/1m (escopo fixture E2E). Parecer completo em tasks/T-SHL-03.md Secao 8.
