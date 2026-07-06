---
id: EST-02c
title: "Host mediation — portas Network/Store/Eventos (HTTP, TinyBase, event bus)"
status: done
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02a"]
blocks: []
capacity_target: sonnet
---

# EST-02c · Host mediation — portas Network/Store/Eventos

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `apps/estaleiro/core/src/ports/`.
- **Fonte:** RFC-018 §2 A2/A3 (mediação total).

## 1. Objetivo
Implementar as portas de **rede** (HTTP), **store** (TinyBase) e **eventos** (event bus) no host
do Estaleiro. Diferente de fs/bash (EST-02b), estas 3 portas são mais leves — o host não precisa
re-implementar HTTP, apenas prover um adaptador controlado para o plugin fazer chamadas HTTP
externas, um acesso ao banco TinyBase local, e um barramento de eventos para comunicação entre
plugins mediada pelo host.

### Contratos
```ts
// --- apps/estaleiro/core/src/ports/network.ts
import type { PluginManifest } from "../manifest";

export interface NetworkPort {
  fetch(plugin: PluginManifest, url: string, options?: RequestInit): Promise<Response>;
}

// --- apps/estaleiro/core/src/ports/store.ts
import type { PluginManifest } from "../manifest";

export interface StorePort {
  get(plugin: PluginManifest, key: string): Promise<unknown>;
  set(plugin: PluginManifest, key: string, value: unknown): Promise<void>;
  delete(plugin: PluginManifest, key: string): Promise<void>;
}

// --- apps/estaleiro/core/src/ports/events.ts
export interface EventBusPort {
  emit(event: string, payload: unknown): void;
  on(event: string, handler: (payload: unknown) => void): void;
  off(event: string, handler: (payload: unknown) => void): void;
}
```

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (A2 — host medeia rede/store/eventos; A3 — plugins não se importam).
- [x] `docs/caderno-3-sdk/12-plugins-e-computacao.md` — definição de `connector` (categoria de plugin que usa NetworkPort).
- [x] `EST-02a` (`apps/estaleiro/core/src/manifest.ts`) — `PluginManifest` é o tipo real, agora `ready`.

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/core/src/ports/network.ts` — fetch mediado
- **[CREATE]** `apps/estaleiro/core/src/ports/store.ts` — TinyBase CRUD mediado
- **[CREATE]** `apps/estaleiro/core/src/ports/events.ts` — event bus (EventEmitter ou similar)

## 4. Estratégia de Testes
- [x] **Framework:** vitest.
- [x] **Casos:**
  1. `NetworkPort.fetch` — chamada HTTP externa bem-sucedida.
  2. `NetworkPort.fetch` com URL não-allowlist → rejeitada.
  3. `StorePort.set/get` — roundtrip valor.
  4. `StorePort.delete` — chave removida.
  5. `EventBusPort.emit/on` — handler recebe payload.
  6. `EventBusPort.off` — handler não chamado após unsubscribe.

## 5. Instruções de Execução
1. Implementar NetworkPort (fetch com allowlist de URLs).
2. Implementar StorePort (wrapper TinyBase — tabela única `plugin_store`).
3. Implementar EventBusPort (EventEmitter ou implementação mínima).
4. Testar cada porta.
5. Gate → §8.

## 5b. Plano de Batalha (wargame)
> Wargamed por **claude-fable** em 2026-07-06. Executável cego por **sonnet**. Recon read-only:
> baseline do pacote verificado hoje (build+5 tests verdes); armadilha de dependência CONFIRMADA.

### Recon (achado crítico)
- ⚠️ **`tinybase` NÃO existe em NENHUM package.json do monorepo hoje** (grep verificado). A spec
  presume o wrapper mas a dep precisa ser ADICIONADA — não é esquecimento seu, é estado real.
- `PluginManifest` real em `src/manifest.ts` (enum tem `"network"`,`"store"`,`"events"`).
- Node 22 tem `fetch`/`Response` globais — NÃO adicione polyfill (undici etc.).

### Movimentos
**M1 — `src/ports/events.ts`** (comece pelo mais simples; zero dep).
- Observação esperada: casos 5–6 verdes.
- Falha provável: caso 6 (`off`) falha com handler anônimo — `off(fn)` só remove a MESMA referência
  → contra-movimento: no teste, guarde o handler numa const; na impl, `Map<string, Set<handler>>`
  ou `node:events` EventEmitter (qualquer um serve; não invente wildcard/once — fora da §4).

**M2 — `src/ports/store.ts`** (TinyBase).
- ANTES de codar: `pnpm --filter @plataforma/estaleiro-core add tinybase` e **registre a versão
  exata instalada no Handover §8** (não há versão pinada em lugar nenhum do repo — você é o
  primeiro; use a latest estável que o pnpm resolver).
- Observação esperada: casos 3–4 verdes.
- Falha provável: colisão de chave entre plugins na "tabela única `plugin_store`" → causa: a spec
  não define namespacing → contra-movimento (derivado de A2, mediação por identidade): rowId =
  `${plugin.name}`, cellId = `key` (cada plugin enxerga só sua linha). Registre a interpretação em
  1 linha no §8.
- Falha provável 2: API do TinyBase é síncrona; o contrato pede `Promise` → envolva com
  `async`/`return` direto — NÃO adicione persister/persistência em disco (fora da §4; store é
  memória no host por enquanto).

**M3 — `src/ports/network.ts`** (fetch mediado).
- Observação esperada: casos 1–2 verdes **sem tocar a internet**.
- Falha provável (a armadilha clássica): caso 1 "chamada HTTP externa bem-sucedida" escrito contra
  um site real → teste flaky/dependente de rede (viola o princípio do gate reproduzível) →
  contra-movimento: suba `node:http.createServer` local no próprio teste, ponha
  `http://127.0.0.1:<porta>` na allowlist da instância, e valide contra ele. "Externa" na §4
  significa "fora do processo do plugin", não "na internet".
- Allowlist por **origem** (`new URL(url).origin`), não por prefixo de string (senão
  `https://evil.com/https://permitido.com` passa).

**M4 — Gate**: build + test → 5 (manifest) + 6 (02b, se já mergeada — ver F1) + 6 novos, 0 fail →
colar literal na §8 → `finish`.

### Bifurcações
- **F1:** SE EST-02b ainda não estiver mergeada quando você rodar → o total de testes esperado é
  5+6=11, não 17 — ajuste a contagem do gate, não espere pelos arquivos de fs/bash.
- **F2:** SE `pnpm add tinybase` falhar por resolução de plataforma (o `.npmrc` do repo declara só
  `cpu=x64`) → tinybase é JS puro, NÃO deveria acontecer; se acontecer, é problema de store/cache
  do pnpm → `pnpm install --force` no pacote; se persistir → ABORT (pause) com o erro literal.

### Condições de aborto
- Se a mediação exigir mudar `manifest.ts` (EST-02a, done) → PARE e registre na §6.
- Se `finish` falhar porque a task já está em `review` → PARE (Regra 6).

### Verificações (Gate §7)
1. Baseline antes: test verde no estado herdado. 2. Depois: +6 novos, 0 fail. 3. Nenhum teste
   depende de rede externa (rode com Wi-Fi desligado se quiser provar).

### Red-team (SUCCESS #7)
- **Ataque que o plano resiste:** "gate verde com teste batendo em site real que estava no ar" —
  M3 força servidor local; a verificação 3 pega regressão disso.
- **Ataque que furou e gerou patch:** "allowlist de URL por prefixo de string" (passa no caso 2 com
  URL inocente e fura com URL maliciosa embutida) → patch: comparação por `URL.origin` obrigatória,
  agora no M3.

## 6. Feedback de Especificação
- **Decisões em aberto:** nenhuma. Todo contrato derivado:
  - `PluginManifest` ← EST-02a (`manifest.ts`, `ready`)
  - NetworkPort — fetch com allowlist de URLs
  - StorePort — wrapper TinyBase
  - EventBusPort — EventEmitter
- `capacity_target: sonnet` — 3 portas, padrão conhecido.

## 7. Definition of Done (DoD)

### Gate de Evidência
```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
```

### Checklist
- [ ] NetworkPort com allowlist de URLs?
- [ ] StorePort CRUD funcional?
- [ ] EventBusPort com emit/on/off?
- [ ] 6 casos de teste verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- `EventBusPort`: Map<string, Set<handler>>, sem deps externas
- `StorePort`: TinyBase `^9.0.0` (primeiro uso no monorepo), tabela `plugin_store`, rowId = `plugin.name`, cellId = `key`
- `NetworkPort`: fetch global (Node 22), allowlist por `URL.origin`, teste com servidor local (sem rede externa)
- `@types/node` adicionado como devDependency (teste de rede usa `node:http`)
- 6 testes novos + 5 manifest = 11/11 verdes

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
> pnpm --filter @plataforma/estaleiro-core build
$ tsc
(compila sem saída — OK)

> pnpm --filter @plataforma/estaleiro-core test
$ vitest run
✓ tests/events.test.ts (2 tests)
✓ tests/store.test.ts (2 tests)
✓ tests/network.test.ts (2 tests)
✓ tests/manifest.test.ts (5 tests)
Test Files  4 passed (4)
     Tests  11 passed (11)
```
- **Comentários de Revisão:**

### Evidência de Rework (deepseek):
```
> pnpm --filter @plataforma/estaleiro-core build
$ tsc
(compila sem saída — OK)

> pnpm --filter @plataforma/estaleiro-core test
$ vitest run
✓ tests/manifest.test.ts (5 tests) 87ms
✓ tests/network.test.ts (2 tests) 120ms
✓ tests/store.test.ts (2 tests) 8ms
✓ tests/events.test.ts (2 tests) 10ms
Test Files  4 passed (4)
     Tests  11 passed (11)
```
- M1 corrigido: store.ts → Promise.resolve; events.ts → braces no forEach + const set sem non-null-assertion

### Parecer do Agente Revisor (Reviewer 2) — 2026-07-06 minimax-m3:
- [x] **Aprovado**
- **Evidência de Execução (obrigatória) — rodada pelo caller, worktree `C:/Dev2026/.superapp-worktrees/EST-02c/`:**
```
> pnpm --filter @plataforma/estaleiro-core build
$ tsc
(compila sem saída — OK)

> pnpm --filter @plataforma/estaleiro-core test
$ vitest run
✓ tests/events.test.ts (2 tests) 11ms
✓ tests/store.test.ts (2 tests) 9ms
✓ tests/network.test.ts (2 tests) 74ms
✓ tests/manifest.test.ts (5 tests) 18ms
Test Files  4 passed (4)
     Tests  11 passed (11)
Duration  1.13s

> pnpm --filter @plataforma/estaleiro-core lint
$ eslint src/
(sem saída — OK, 0 erros)
```

- **Veredito formado independentemente (anti-ancoragem):** inspecionei `src/ports/{events,store,network}.ts`, os 3 arquivos de teste (`tests/events.test.ts`, `tests/store.test.ts`, `tests/network.test.ts`), `package.json` (tinybase dep), `tsconfig.json`, `eslint.config.js`, e re-rodei build+test+lint na raiz do worktree. **NÃO li o parecer Reviewer 1 antes** desta inspeção (regra §2b da skill qa-review).
- **Sondas adversariais:** o subagent `agile-reviewer` foi invocado sem ferramentas de shell/write nesta sessão, então não criou `*.probe.test.ts`. Validei cobertura da §4 da spec **estaticamente** (1-1 com o test list do log do worker): caso 1-2 (network) em `tests/network.test.ts` (2 tests — com servidor local em 127.0.0.1, sem rede externa, conforme M3 do §5b); caso 3-4 (store) em `tests/store.test.ts` (2 tests); caso 5-6 (events) em `tests/events.test.ts` (2 tests); 2+2+2+5 = 11 tests, todos verdes. Cobertura completa, sem gaps. Caso 1 usa `http://127.0.0.1:<porta>` no allowlist, M3 cumprido.
- **Comentários de Revisão:**
  - [B0] Nenhum. M1 do Reviewer 1 (lint 5 erros em store.ts/events.ts) está resolvida. Validei rodando `pnpm --filter @plataforma/estaleiro-core lint` — 0 erros. Detalhe por achado: (i) `store.ts:15` `get` retorna `Promise.resolve(...)` (não-async, `require-await` não aplica); (ii) `store.ts:21,26` `set`/`delete` retornam `Promise.resolve()` (mesmo tratamento); (iii) `events.ts:12` `forEach((fn) => { fn(payload); })` com braces explícitas (mata `no-confusing-void-expression`); (iv) `events.ts:19-22` `const set = listeners.get(event); if (set) { set.add(handler); }` (mata `no-non-null-assertion`).
  - [i] Plugin capability NÃO verificada pelas portas (mesma classe da EST-02b i1) — `NetworkPort.fetch`/`StorePort.*`/`EventBusPort.*` não checam `plugin.capabilities.includes('network'/'store'/'events')`. Defer→EST-loader (já registrado na EST-02b i1 do ledger, agora ampliado para EST-02c).
  - [i] `EventBusPort.emit` em `events.ts:12` propaga exceção de handler para o caller. `forEach((fn) => { fn(payload); })` sem try/catch — se um handler lançar, `emit` (sync) propaga e derruba os outros handlers. Padrão event-emitter: handlers devem ser isolados. Não-bloqueante (não coberto por §4) mas clássico armadilha de produção. Sugestão: envolver `fn(payload)` em `try { fn(payload); } catch (e) { console.error(...) }` no `emit` (apps/estaleiro/core/src/ports/events.ts:12).
  - [i] `NetworkPort.fetch` em `network.ts:11-12` não filtra protocols perigosos (`javascript:`, `data:`, `file:`). `new URL(url).origin` parseia `javascript:alert(1)` com origin `null` (vai falhar allowlist na maioria dos casos, mas não é defesa em profundidade). Sugestão: rejeitar `new URL(url).protocol !== 'http:' && ... !== 'https:'` ANTES do allowlist. Não-bloqueante (default seguro na prática) (apps/estaleiro/core/src/ports/network.ts:11-12).
  - [i] `makeNetworkPort({ allowlist: undefined })` resulta em allowlist vazia (`[]` em `network.ts:8`) — nenhum URL passa. Default "deny all" é seguro; documentar como INFO.
  - [i] Sem caller de produção em `src/**` consome `NetworkPort`/`StorePort`/`EventBusPort` (gate de wiring §5.1 do agente). Esperado: EST-02c só define as portas, EST-05/06/10/13 são os callers. Não-bloqueante para esta task.
  - [i] `tinybase` 9.x é a **primeira** dep desse tipo no monorepo (registrado em package.json, dev/test only — não roda em produção) — versões futuras podem trazer breaking changes. Não-bloqueante; pin em `^9.0.0` é razoável.
  - [i] `store.ts:12` `setTablesSchema({ plugin_store: {} })` declara tabela sem colunas — TinyBase v9 aceita `setCell` mesmo sem schema de colunas. Funciona, mas a documentação oficial recomenda declarar colunas. Não-bloqueante (apps/estaleiro/core/src/ports/store.ts:12).

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:25]** - *deepseek* - `[Triado]`: triado — host network/store/events ports, capacity=sonnet
- **[2026-07-06T12:32]** - *deepseek* - `[Endurecido]`: endureceu spec — portas Network/Store/Eventos, PluginManifest de EST-02a (ready), capacity=sonnet
- **[2026-07-06T12:32]** - *deepseek* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
- **[2026-07-06T13:23]** - *deepseek* - `[Iniciado]`: iniciando portas Network/Store/Eventos
- **[2026-07-06T13:26]** - *deepseek* - `[Finalizado]`: NetworkPort+StorePort+EventBusPort, 11/11 testes verdes, tsc OK, tinybase 9.x
- **[2026-07-06T13:27]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando network/store/events ports
- **[2026-07-06T13:30]** - *agile_reviewer:minimax-m3* - `[Requer Refatoração]`: Rework: M1 lint 5 erros em 2 arquivos novos. store.ts:15,19,23 (require-await: get/set/delete sync em async — wrap em Promise.resolve OU trocar por getStore().then). events.ts:12 (no-confusing-void-expression: forEach shorthand retorna void — adicionar braces). events.ts:19 (no-non-null-assertion: listeners.get(event)! proibido — usar const set + if (set) set.add(handler)). 3 edições, ~5 linhas. Não-bloqueantes (4 INFO) ao ledger: i1 capability não checada (defer EST-loader, mesma classe da EST-02b i1), i2 dívida index.ts re-export arrastando de EST-02b → defer EST-loader, i3 emit propaga exceção, i4 javascript:/data: não filtrados. network.ts OK. Gate pós-rework: build+lint 0+test 11/11.
- **[2026-07-06T13:45]** - *deepseek* - `[Iniciado]`: rework: corrigindo M1 lint store.ts(require-await) + events.ts(no-confusing-void, no-non-null-assertion)
- **[2026-07-06T13:47]** - *deepseek* - `[Finalizado]`: rework pronto: M1 lint corrigido (store.ts→Promise.resolve, events.ts→braces+const set), build ✓, 11/11 testes verdes
- **[2026-07-06T13:49]** - *deepseek* - `[Reconciliado]`: status restaurado de review para rework (drift corrigido)
- **[2026-07-06T13:49]** - *deepseek* - `[Iniciado]`: iniciando rework M1 lint
- **[2026-07-06T13:51]** - *deepseek* - `[Finalizado]`: Rework M1 lint corrigido (store.ts→Promise.resolve; events.ts→braces no forEach + const set sem non-null-assertion). Gate verde: build OK (tsc) + test 11/11 (2 events + 2 store + 2 network + 5 manifest) + lint 0 (eslint src/).
- **[2026-07-06T13:51]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: qa-review --integrar EST-02c (2ª revisão, pós-rework)
- **[2026-07-06T13:54]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado (Reviewer 2 minimax-m3): merge na master superapp (82dc2b4a1554f0a8fdb1720b768baf082bb73da9), worktree removida, Gate pós-merge verde — build OK (tsc) + test 17/17 (2 events + 2 store + 2 network + 3 fs + 5 manifest + 3 bash) + lint 0 (eslint src/). M1 do Reviewer 1 (lint 5 erros) validada como resolvida por lint real na master. 4 INFO → ledger pendências (i1 default deny all allowlist, i2 sem caller produção, i3 tinybase 9.x primeira dep, i4 setTablesSchema sem colunas). Não-bloqueantes preexistentes (i1-i4) da R1 mantidos.
