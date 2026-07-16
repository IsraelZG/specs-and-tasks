---
id: EST-45
title: "migrar shell do Estaleiro para @plataforma/shell compartilhado"
status: ready
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-SHL-02", "EST-29"]
blocks: []
capacity_target: sonnet
ui: true
---

# EST-45 · Consumir `@plataforma/shell` no Estaleiro

## 0. Ambiente de Execução Obrigatório
- **Repo:** `C:\Dev2026\superapp` · app Estaleiro + pacote `@plataforma/shell`.
- **Prioridade:** migração posterior; não bloqueia P1.

## 1. Objetivo
Trocar a infraestrutura local de FlexLayout do Estaleiro pela engine compartilhada criada por
T-SHL-01/02. Preservar o layout default e as views atuais como adapter do app; remover duplicação
somente depois de provar paridade.

## 2. Contexto RAG
- ADR 0016 §1/§4; caderno-3-sdk/28.
- `tasks/EST-29.md`, `tasks/T-SHL-01.md`, `tasks/T-SHL-02.md`.

## 3. Escopo de Arquivos
- **[UPDATE]** `apps/estaleiro/ui/src/shell/default-layout.ts` — adapter para `@plataforma/shell`.
  - Adaptar o layout default do Estaleiro para `FlexLayoutJson`/`WorkspaceSpec` de
    `@plataforma/shell`.
  - Preservar as 8 abas existentes (Board, Execução, Planejamento, Terminal, Decisões, Custo, Config, ...).
  - Compatibilidade: layout salvo antigo em FlexLayout JSON deve ser migrado deterministicamente.
- **[CREATE]** `packages/shell/src/workspace-shell.tsx` — componente React declarativo
  `WorkspaceShell` que recebe `initialLayout`, `renderPanel`, `onLayoutChange` e constraints. O
  callback recebe um contexto próprio do pacote, sem expor `TabNode`/internals do FlexLayout.
- **[UPDATE]** `App.tsx` — usar `WorkspaceShell` e fornecer o adapter `renderPanel` para as views.
- **[UPDATE]** `package.json` — adicionar `@plataforma/shell` como dependência, remover flexlayout-react
  local.
- **[DELETE]** `packages/shell/src/shell-root.tsx`, a interface imperativa `ShellRoot`, o export
  `createShellRoot` e fixtures/testes baseados nela. Não manter consumidor legado; migrar todos para
  `WorkspaceShell` na mesma entrega.
- **[DELETE]** lógica local duplicada após paridade comprovada.
  - Só deletar APÓS Playwright provar paridade (caso 5).
- **[UPDATE]** testes de shell e Playwright.
- **[NO CHANGE]** views, stores e contratos de plugins.

## 4. Estratégia de Testes
- **Framework:** Vitest/JSDOM (unit) + Playwright/Chromium (E2E).
- **Caso de teste (numerados):**
  1. Oito abas/layouts existentes continuam abrindo (anti-fake: Playwright navega para cada aba, confirma painel visível).
  2. Layout salvo antigo migra deterministicamente: fixture `estaleiro-layout-v1` → validação por
     `Model.fromJson()` dentro do pacote → `WorkspaceSpec("default")` → restauração → `toJson()`
     estruturalmente equivalente. `LayoutSolver` não converte nem serializa JSON.
  3. Resize, colapso, restauração e pin respeitam solver compartilhado (anti-fake: Playwright redimensiona, recarrega, confirma estado preservado).
  4. App não importa internals de `packages/shell` (anti-fake: regex `from "@plataforma/shell/src/` retorna null no bundle).
  5. Playwright compara os fluxos críticos de EST-29 antes/depois (snapshot diff ou asserção de elementos-chave).
- **Fora de escopo:** reescrever views, migrar TinyBase/localStorage, deletar sem paridade comprovada.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO reescrever as views.
> - NÃO levar TinyBase/localStorage para o pacote compartilhado.
> - NÃO apagar implementação local antes do teste de compatibilidade.

## 6. Feedback de Especificação

**DECIDIDO (arquiteto, 2026-07-16) — componente React único, sem API legada.**

- T-SHL-02 está `done`; os contratos reais são `createLayoutSolver().solve(input, manifest)`,
  `LayoutSolverInput`, `LayoutConstraints` e `ModuleManifest`. Não existe `ShellManifest`.
- O payload canônico de `SPEC:WORKSPACE` já é `FlexLayoutJson`, igual ao JSON salvo pelo Estaleiro.
  Não existe formato próprio do solver e não haverá conversão destrutiva. O app faz migração-on-read
  da chave `estaleiro-layout-v1`, valida, grava como workspace `default` via adapter `WorkspaceStore`
  e conserva backup até o gate Playwright passar. JSON inválido falha fechado para o layout default,
  sem apagar o legado.
- `createShellRoot` e `ShellRoot` serão excluídos. O pacote passa a expor somente o componente React
  declarativo `WorkspaceShell`; testes e fixture E2E são refatorados, não preservados como legado.
- O Estaleiro injeta `renderPanel` e seu adapter de persistência. `@plataforma/shell` continua sem
  conhecer TinyBase/localStorage e é o único pacote que importa `flexlayout-react`.

## 7. Definition of Done
- [ ] Shell do Estaleiro consome `@plataforma/shell` sem imports internos.
- [ ] 8 abas existentes preservadas e funcionais.
- [ ] Layout salvo antigo migra deterministicamente.
- [ ] Lint passa (Gate de Evidência inclui lint desde 2026-07-06).

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro test:e2e
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.
> **Lint é parte do gate** (Regra 3 do CLAUDE.md, desde 2026-07-06).

## 8. Log de Handover e Revisão
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução

- **[2026-07-13T19:17]** - *gpt-5* - `[Triado]`: Migração do shell local somente após o pacote compartilhado estabilizar
- **[2026-07-13T18:00]** - *deepseek* - `[Endurecido]`: endureceu spec — 2 decisões em aberto (Seção 6: LayoutSolver assinaturas abertas, migração layout salvo). Capacidade: sonnet.
- **[2026-07-13T22:33]** - *deepseek* - `[Reconciliado]`: status restaurado de draft:pending_decision para draft:triaged (drift corrigido)
- **[2026-07-13T22:33]** - *deepseek* - `[Decisão pendente]`: 2 decisões abertas: LayoutSolver assinaturas, migração layout salvo
- **[2026-07-16T09:47]** - *gpt-5* - `[Decidido]`: decisão: WorkspaceShell React único, migração on-read de FlexLayoutJson e remoção de createShellRoot
- **[2026-07-16T09:47]** - *system* - `[Auto-promovida]`: deps todas done
