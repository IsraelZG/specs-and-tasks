---
id: EST-01
title: "Bootstrap do monorepo Estaleiro (apps/estaleiro/ + packages/plugin-* scaffold)"
status: done
complexity: 3
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: []
capacity_target: haiku
---

# EST-01 · Bootstrap do monorepo Estaleiro

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. **Primeira task do épico Estaleiro** — cria o esqueleto onde as demais
  EST-* vão trabalhar. Executa no monorepo do **superapp** (código), não no Docs.
- **Fonte canônica:** `docs/rfcs/rfc-018-estaleiro.md` — RFC aceito, 26/26 decisões tomadas.

## 1. Objetivo
Criar o scaffold do monorepo: `apps/estaleiro/{core,ui}/` (cascas vazias, buildáveis com `tsc`) e
verificar que `packages/plugin-*` são resolvíveis pelo `pnpm-workspace.yaml` existente (que já
inclui `"packages/*"`). Sem lógica de negócio — só workspace, tooling (turborepo/pnpm-workspace),
build/lint rodando verde em cascas vazias sem regredir os pacotes existentes. É a fundação de que
todas as outras EST-* dependem.

### Contratos
```ts
// --- apps/estaleiro/core/src/index.ts (scaffold vazio)
export const CORE_VERSION = "0.0.1";

// --- apps/estaleiro/ui/src/index.ts (scaffold vazio)
export const UI_VERSION = "0.0.1";
```

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (G1: namespace `@plataforma/plugin-*`), §3 (diagrama: `apps/estaleiro/{core,ui}/`, `packages/plugin-*`) — fonte canônica.
- [x] `pnpm-workspace.yaml` existente (já inclui `"apps/*"` e `"packages/*"` — nenhuma alteração necessária).
- [x] `turbo.json` existente (já tem pipeline `build` com `dependsOn: ["^build"]` — nenhuma alteração necessária).
- [x] Padrão de `package.json` mínimo (`packages/workers/package.json`): `private: true`, `type: module`, scripts `build`/`test`/`lint`, só `devDependencies`.

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/core/package.json` — `@plataforma/estaleiro-core`, build c/ `tsc`
- **[CREATE]** `apps/estaleiro/core/tsconfig.json` — estende `../../tsconfig.base.json` (ou standalone mínimo)
- **[CREATE]** `apps/estaleiro/core/src/index.ts` — export const `CORE_VERSION = "0.0.1"`
- **[CREATE]** `apps/estaleiro/ui/package.json` — `@plataforma/estaleiro-ui`, build c/ `tsc`
- **[CREATE]** `apps/estaleiro/ui/tsconfig.json` — estende `../../tsconfig.base.json` (ou standalone mínimo)
- **[CREATE]** `apps/estaleiro/ui/src/index.ts` — export const `UI_VERSION = "0.0.1"`
- **[NO-OP]** `pnpm-workspace.yaml` — já cobre `apps/*` e `packages/*`
- **[NO-OP]** `turbo.json` — pipeline existente já cobre novos workspaces via `^build`

## 4. Estratégia de Testes
- [x] **Framework:** `pnpm install` (resolução sem erro) + `pnpm build` (regressão zero nos pacotes existentes).
- [x] **Casos de verificação (manuais, por comandos):**
  1. `pnpm install` → sem erro, novos workspaces resolvem.
  2. `pnpm --filter @plataforma/estaleiro-core build` → `tsc` compila sem saída (vazio).
  3. `pnpm --filter @plataforma/estaleiro-ui build` → `tsc` compila sem saída (vazio).
  4. `pnpm build` (raiz) → 0 falhas, novos workspaces não quebram pacotes existentes.
  5. `pnpm --filter <pkg-existente> build` (ex.: `@plataforma/media`) → continua verde (regressão).

## 5. Instruções de Execução
1. Scaffold `apps/estaleiro/core/` e `apps/estaleiro/ui/` com `package.json`, `tsconfig.json`, `src/index.ts` vazios (padrão `packages/workers/`).
2. Não alterar `pnpm-workspace.yaml` nem `turbo.json` (já funcionam).
3. Rodar `pnpm install` no root para registrar os novos workspaces.
4. Rodar `pnpm build` no root — confirmar 0 regressões.
5. Gate → §8.

## 6. Feedback de Especificação
- **Nenhuma decisão em aberto.** Todo contrato é derivado do RFC-018 §2/G1, §3 e do padrão de monorepo existente.
- **capacity_target: haiku** — task mecânica de scaffold, sem novidade algorítmica.

## 7. Definition of Done (DoD)

### Gate de Evidência
```bash
pnpm install
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-ui build
pnpm build
```

### Checklist
- [ ] `apps/estaleiro/core/` e `apps/estaleiro/ui/` existem e são buildáveis?
- [ ] `pnpm install` resolve sem erro?
- [ ] `pnpm build` na raiz não regride pacotes existentes?
- [ ] `packages/plugin-*` são resolvíveis pelo workspace (verificar com `pnpm ls --depth -1`, mesmo sem pacotes criados ainda)?
- [ ] `capacity_target: haiku` atribuído?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- Scaffold `apps/estaleiro/{core,ui}/` criado com package.json, tsconfig.json, src/index.ts.
- Contratos CORE_VERSION/UI_VERSION exportados conforme spec.
- Desvio necessário da spec: `pnpm-workspace.yaml` precisou de `apps/estaleiro/*` (a spec marcava NO-OP mas `apps/*` só cobre 1 nível).
- `pnpm build` raiz falha por cyclic deps preexistente (core↔protocol↔testkit) — sem regressão nova.
- `@plataforma/media` build confirmado verde (regressão zero).

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
> pnpm install (Scope: all 16 workspace projects — OK)

> pnpm --filter @plataforma/estaleiro-core build
$ tsc
(compila sem saída — OK)

> pnpm --filter @plataforma/estaleiro-ui build
$ tsc
(compila sem saída — OK)

> pnpm --filter @plataforma/media build
$ tsc
(sem regressão — OK)

> pnpm build (raiz)
$ turbo run build — falha preexistente: cyclic deps core↔protocol↔testkit
(sem regressão nova)
```
- **Comentários de Revisão:**

### Parecer do Agente Revisor (Reviewer 1 — `agile_reviewer:minimax-m3`, 2026-07-06, independente)
> **Contexto:** Primeira (e única) revisão independente da EST-01. Spec é tight, sem decisões em
> aberto (derivada de RFC-018 §2/G1, §3). Capacity-target haiku (bootstrap mecânico). 2 commits
> no branch: `9f83340 feat(EST-01): scaffold apps/estaleiro/{core,ui}/` e
> `01f565b fix(EST-01): corrigir tsconfig extends (3 níveis) e adicionar apps/estaleiro/* ao workspace`.
> Veredito formado a partir da spec + código + Gate (anti-ancoragem).

#### Gate executado (R1) — worktree `C:/Dev2026/.superapp-worktrees/EST-01` @ `01f565b`

- **install** — `pnpm install` → `Scope: all 16 workspace projects / Already up to date / Done in 721ms` ✓
- **build (core)** — `pnpm --filter @plataforma/estaleiro-core build` → `tsc` (sem saída) ✓
- **build (ui)** — `pnpm --filter @plataforma/estaleiro-ui build` → `tsc` (sem saída) ✓
- **lint (core)** — `pnpm --filter @plataforma/estaleiro-core lint` → `eslint src/` (0 erros) ✓
- **lint (ui)** — `pnpm --filter @plataforma/estaleiro-ui lint` → `eslint src/` (0 erros) ✓
- **regressão** — `pnpm --filter @plataforma/media build` → `tsc` (sem saída) ✓ — sem regressão nos pacotes existentes
- **workspace resolution** — `pnpm ls --depth -1 -r` lista **16 workspaces** incluindo
  `@plataforma/estaleiro-core` e `@plataforma/estaleiro-ui` em `apps/estaleiro/{core,ui}` ✓
- **build (raiz)** — `pnpm build` → `turbo run build` falha com `WARNING Circular package dependency detected: @plataforma/testkit, @plataforma/core, @plataforma/protocol`. **Verificação:** mesmo `pnpm build` em `C:/Dev2026/superapp` (master pós-merge de T-807) produz a **mesma** falha com a **mesma** assinatura. Logo é **pré-existente, não introduzido por EST-01** — o Handover R1 já documentou isso.

#### Análise estática (R1)

**Escopo cumprido:** os 6 arquivos `[CREATE]` da §3 existem e batem com os contratos da §1:
- `apps/estaleiro/core/package.json` — `@plataforma/estaleiro-core`, `build: tsc`, `test: vitest run`, `lint: eslint src/`, `private: true`, `type: module`, `exports: ./src/index.ts` — idêntico ao padrão `packages/workers/package.json` ✓
- `apps/estaleiro/core/tsconfig.json` — `extends: ../../../tsconfig.base.json` (caminho R2-fix: 3 `../` = root, correto porque o arquivo está em `apps/estaleiro/core/` — subir 3 níveis alcança o root) ✓
- `apps/estaleiro/core/src/index.ts` — `export const CORE_VERSION = "0.0.1";` ✓ (idêntico ao contrato §1)
- `apps/estaleiro/ui/package.json`, `apps/estaleiro/ui/tsconfig.json`, `apps/estaleiro/ui/src/index.ts` — simétricos a core, com `UI_VERSION` ✓

**Fora do escopo, mas necessário (R2-fix):**
- `pnpm-workspace.yaml` — adicionado `- "apps/estaleiro/*"`. Spec §3 marcava `[NO-OP]` mas o
  glob `apps/*` cobre apenas 1 nível; sem `apps/estaleiro/*`, `pnpm install` não
  desceria para `apps/estaleiro/{core,ui}`. **Desvio legítimo documentado pelo
  Handover R1** ("spec marcava NO-OP mas `apps/*` só cobre 1 nível"). Sem este
  fix o `pnpm install` do item 1 do §4 falharia em silêncio. ✓
- `apps/estaleiro/core/tsconfig.json` e `apps/estaleiro/ui/tsconfig.json` — `extends: ../../../tsconfig.base.json` (3 níveis). R2-fix: confere, está em `apps/estaleiro/{core,ui}/` e sobe 3 níveis até o root. ✓

**Sem arquivos extra:** inspecionei via `git log` (2 commits de feature) e `pnpm ls`. Nenhum
arquivo fora do escopo tocado — só `apps/estaleiro/{core,ui}/*` e `pnpm-workspace.yaml`.

#### Achados

**Não-bloqueantes (MINOR/INFO)**

- **[m1] `pnpm --filter @plataforma/estaleiro-{core,ui} test` exit 1 — vitest sem `*.test.ts` em packages novos.** Rodei o `test` script (definido em `package.json` herdado do padrão `workers`) e ambos retornam:
  ```
  No test files found, exiting with code 1
  ```
  A spec §4 define testes como **"manuais, por comandos"** (sem unit tests exigidos), e o DoD §7
  não lista `test`. Logo, por spec, não há cobertura faltando. **Mas** o script `test: vitest run`
  herdado do padrão `workers` sempre sairá com `exit 1` enquanto o pacote não tiver
  `*.test.ts/*.spec.ts` — qualquer CI que rode `pnpm test` na raiz (ex.: `pnpm turbo run test`)
  vai falhar por EST-01. A spec do RFC-018 §3 não cita `test` no scaffold, e o padrão `workers`
  só funciona porque tem `tests/mock.test.ts`. Ação corretiva: **adicionar 1 placeholder
  trivial** (`apps/estaleiro/{core,ui}/tests/scaffold.test.ts: expect(CORE_VERSION).toBe('0.0.1')`)
  em uma task EST-* futura OU **remover** o script `test` do `package.json` do scaffold
  (até que o pacote tenha conteúdo testável). Não-bloqueante porque a DoD §7 da EST-01 não
  inclui `test` e §4 é explícita sobre testes manuais. **Vai ao ledger de pendências** para
  o integrador decidir entre (a) adicionar placeholder ou (b) remover `test` do scaffold e
  reintroduzir quando o pacote tiver conteúdo. Sugestão: (b) é mais limpo (YAGNI) — não
  justifica um placeholder que ninguém lê.

- **[i1] `pnpm build` (raiz) falha com `Circular package dependency detected: @plataforma/testkit, @plataforma/core, @plataforma/protocol`.** **Pré-existente em master** (verificado: `C:/Dev2026/superapp master` produz a mesma falha com a mesma assinatura). EST-01 não introduziu nem agravou. Mesmo ciclo já documentado no ledger (`- [ ] [m2][T-022][monorepo] Achado fora do escopo ... ciclo no grafo ... introduzido por merge posterior na master`). Não-bloqueante; a EST-01 não tem ação corretiva aqui. Pertence a uma task de cleanup de ciclos (T-1033 cobre `protocol ↔ core`, mas o ciclo também envolve `testkit`).

#### Veredito (R1)
**APROVADO** — 0 BLOCKER, 0 MAJOR, **1 MINOR** (m1: `test` script exit 1 em pacotes vazios), 1 INFO (i1: ciclo pré-existente em `pnpm build` raiz, não desta task). O scaffold cumpre os 5 itens do DoD §7 (existe, buildável, install resolve, regressão zero, capacity haiku); o desvio documentado (`pnpm-workspace.yaml` precisou de `apps/estaleiro/*`) é legítimo e justificado.

### Comentários de Revisão:

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:13]** - *deepseek* - `[Triado]`: triado — bootstrap Estaleiro, capacity_target=haiku, sem decisoes em aberto
- **[2026-07-06T12:13]** - *deepseek* - `[Endurecido]`: endureceu spec — bootstrap Estaleiro (scaffold vazio buildavel, derivado RFC-018 §3/G1), capacity_target=haiku
- **[2026-07-06T12:20]** - *deepseek* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
- **[2026-07-06T12:24]** - *deepseek* - `[Iniciado]`: iniciando bootstrap Estaleiro
- **[2026-07-06T12:27]** - *deepseek* - `[Finalizado]`: scaffold apps/estaleiro/{core,ui} — build OK (tsc), sem regressão (@plataforma/media verde), pnpm-workspace ajustado p/ apps/estaleiro/*
- **[2026-07-06T12:31]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando bootstrap Estaleiro
- **[2026-07-06T09:34]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: R1 (independente): build ✓ core+ui (tsc) + lint 0 erros + install resolve 16 workspaces + regressão @plataforma/media ✓. m1 vai ao ledger (test script exit 1 em pacote vazio, padrão de workers); i1 já no ledger (ciclo preexistente). DoD §7 5/5 ✓. Desvio pnpm-workspace.yaml (apps/estaleiro/*) é legítimo.
- **[2026-07-06T09:34]** - *agile_reviewer:minimax-m3* - `[Iniciando integração]`: rodar /integrar-task EST-01 — merge na master do superapp
- **[2026-07-06T12:36]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (ab68c26), worktree removida, Gate verde (install resolve 16 workspaces, build core+ui + media green, lint 0 erros). Sem conflitos (branch master-equivalente). m1 (test script exit 1 em pacote vazio) ao ledger. i1 (ciclo preexistente) já no ledger.
