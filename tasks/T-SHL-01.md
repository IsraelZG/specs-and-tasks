---
id: T-SHL-01
title: "shell FlexLayout + SPEC:WORKSPACE (default + salvos nomeados) + painel binda (modulo+pagina+params)"
status: draft:placeholder
complexity: 5
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-004", "T-PG-01"] # IDs de tarefas que bloqueiam esta
blocks: ["T-SHL-02", "T-SHL-03", "T-SHL-04", "T-SHL-05"] # IDs de tarefas que esta bloqueia
---

# T-SHL-01 · shell FlexLayout + SPEC:WORKSPACE (default + salvos nomeados) + painel binda (modulo+pagina+params)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Construir o shell da aplicação como árvore FlexLayout (flexlayout-react) no pacote `@plataforma/shell`,
com suporte a `SPEC:WORKSPACE` (default + salvos nomeados) e bind de painéis (módulo + página/rota + params).
Fonte: `caderno-3-sdk/28-shell-e-composicao.md §1`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/shell/src/workspace.ts

export interface PanelBind {
  /** Módulo alvo (ex.: "social", "marketplace"). */
  moduleId: string;
  /** Rota da página dentro do módulo (ex.: "/feed", "/product/:id"). */
  route: string;
  /** Parâmetros opcionais da rota. */
  params?: Record<string, string>;
}

export interface WorkspaceSpec {
  /** Nome do workspace ("default", "trabalho", "pessoal", etc.). */
  name: string;
  /** Payload serializável da árvore FlexLayout (json config). */
  layout: FlexLayoutJson;
  /** Timestamp de última persistência (wall clock, HLC em T-103). */
  savedAt: number;
}

export interface WorkspaceStore {
  /** Salva/cria/sobrescreve um SPEC:WORKSPACE como nó SPECIFICATION. */
  save(spec: WorkspaceSpec): Promise<void>;
  /** Carrega workspace por nome. */
  load(name: string): Promise<WorkspaceSpec | null>;
  /** Lista workspaces salvos do usuário. */
  list(): Promise<string[]>;
  /** Deleta um workspace salvo. */
  delete(name: string): Promise<void>;
}

export interface ShellRoot {
  /** Monta a árvore FlexLayout no container DOM. */
  mount(container: HTMLElement, initialLayout?: FlexLayoutJson): void;
  /** Abre um painel novo (ou foca existente) com bind de módulo+página+params. */
  openPanel(bind: PanelBind): void;
  /** Fecha painel por identificador. */
  closePanel(panelId: string): void;
  /** Persiste arranjo atual como workspace nomeado. */
  persistWorkspace(name: string): Promise<void>;
  /** Restaura workspace nomeado, reidratando a árvore. */
  restoreWorkspace(name: string): Promise<void>;
}

export type FlexLayoutJson = Record<string, unknown>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §1 — Shell como árvore FlexLayout; SPEC:WORKSPACE
- [[spec-workspace]] — Definição canônica do nó SPEC:WORKSPACE
- [[command-palette]] — Superfície de overlay que residirá sobre o shell (T-SHL-05)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/28-shell-e-composicao.md` §1, §11
- **[READ]** `docs/conceitos/spec-workspace.md` — contrato do nó SPEC:WORKSPACE
- **[READ]** `packages/protocol/src/ports.ts` — StoragePort (T-004) para persistência
- **[CREATE]** `packages/shell/src/workspace.ts` — interfaces acima + implementação base
- **[CREATE]** `packages/shell/src/shell-root.tsx` — componente React ShellRoot com FlexLayout
- **[CREATE]** `packages/shell/src/workspace-store.ts` — persistência via StoragePort
- **[CREATE]** `packages/shell/tests/workspace.test.ts` — testes unitários do store + shell
- **[UPDATE]** `packages/shell/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node) para workspace-store e lógica pura; Playwright para E2E de renderização FlexLayout.
- [x] **Ambiente do Teste:** Node puro para store; headless Chromium para Playwright.
- [x] **Fora de Escopo:** Broadcast multi-dispositivo (explicitamente excluído pelo §1.4 do caderno). Colaboração Automerge. Sessões efêmeras (T-SHL-05).

Casos de teste (numerados):
1. `WorkspaceStore.save()` persiste `WorkspaceSpec` via `StoragePort` e `load()` recupera idêntico.
2. `WorkspaceStore.list()` retorna nomes de workspaces salvos; `delete()` remove.
3. `load("inexistente")` retorna `null` (não lança).
4. `ShellRoot.mount(container, layoutJson)` renderiza árvore FlexLayout sem erro.
5. `ShellRoot.openPanel({ moduleId: "social", route: "/feed" })` abre painel com bind correto.
6. `ShellRoot.persistWorkspace("default")` serializa layout atual e chama `WorkspaceStore.save()`.
7. `ShellRoot.restoreWorkspace("default")` reidrata árvore a partir do store.
8. Playwright: workspace default é criado na primeira montagem; restaurar "trabalho" troca layout.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** faça broadcast de layout entre dispositivos — §1.4 proíbe; auto-save é local.
> - **NÃO** invente tipos de nó — SPEC:WORKSPACE é SPECIFICATION com kind "WORKSPACE", basta payload.
> - **NÃO** duplique a lógica de persistência — delegue ao `StoragePort` de T-004.

### Pegadinhas conhecidas
- **FlexLayout é stateful:** o modelo serializável (layout json) é gerado pelo método `toJson()` da instância; não tente reconstruí-lo manualmente. Use `model.toJson()` para persistir e `model.fromJson()` para restaurar.
- **Bind de painel não é rota de SPA:** cada painel renderiza um iframe ou micro-frontend da página do módulo; não use React Router global. O shell gerencia qual módulo ocupa qual região.
- **Restauração = remontagem:** restaurar um workspace zera sessões efêmeras não-persistidas (§11.3). Painéis voltam com estado inicial; sessões colapsadas perdem estado de doc efêmero. Isso é comportamento esperado, não bug.

1. **[TDD]** Crie `packages/shell/tests/workspace.test.ts` com casos 1–3 (store) e 4–5 (shell). Use mock de `StoragePort`.
2. Implemente `packages/shell/src/workspace.ts` com as interfaces da Seção 1.
3. Implemente `packages/shell/src/workspace-store.ts` delegando a `StoragePort` para CRUD de SPEC:WORKSPACE.
4. Implemente `packages/shell/src/shell-root.tsx` com FlexLayout: montagem, openPanel, persistWorkspace, restoreWorkspace.
5. Adicione E2E Playwright (caso 8) em `packages/shell/e2e/workspace.spec.ts`.
6. Re-exporte em `packages/shell/src/index.ts`.
7. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - Nenhuma para os contratos TS. Derivados do caderno §1 e do verbete [[spec-workspace]].
> **Status:** Seções 1–4 e 7 preenchidas pelo Task Architect.

> **Refinamentos do default de layout (usuário, 2026-07-02) — a canonicalizar no caderno-28 §4.1 e
> a fixar ao endurecer esta task e T-SHL-03.** O §4.1 diz só "menus nas extremidades + coluna
> Principal + Secundária", sem pinar qual é qual. O default concreto do produto é:
> - **Menu esquerdo = comunicação** (email, notificações, chat launcher).
> - **Coluna de mensageria** (app de DM/chat) entre o menu esquerdo e o app central.
> - **Coluna central = app ativo** (social, fintech, studio, mídia…).
> - **Menu direito = apps/módulos** (launcher).
> - Ação do usuário abre app/página em **nova coluna**; **split em rows é exceção** (editor/ação do
>   app daquela coluna); **editores que pedem mais área** (email, texto, foto, calendário) abrem em
>   coluna mais larga.
> - **Header** no topo; **footer = principalmente STATUS do app** (sync/conexão) — distinto do
>   footer-como-menu do regime mobile (§2.2 / T-SHL-03).
> Este é também o modelo dos mockups Lovable (tela A1). Ver memória do agente
> `project_shell_column_layout` para o registro completo.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] Interfaces `PanelBind`, `WorkspaceSpec`, `WorkspaceStore`, `ShellRoot` exportadas com assinaturas exatas da Seção 1?
- [ ] `WorkspaceStore` persiste via `StoragePort` (T-004), sem acesso direto a SQL/fs?
- [ ] Shell monta FlexLayout e abre/fecha painéis corretamente?
- [ ] Persistência de workspace serializa layout via `model.toJson()` e restaura via `model.fromJson()`?
- [ ] Não há broadcast multi-dispositivo (§1.4)?
- [ ] `pnpm test` verde? Playwright E2E passa?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/shell build      # tsc — precisa terminar sem erro
pnpm --filter @plataforma/shell test       # vitest + playwright — precisa ficar verde
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

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
