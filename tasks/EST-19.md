---
id: EST-19
title: "Entrypoint + empacotamento standalone do Estaleiro (aplica ADR 0012)"
status: blocked
complexity: 2
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-14", "EST-15"] # UI a empacotar + ADR que decidiu a tecnologia
blocks: []
capacity_target: sonnet # script de build/launch + servidor WS/HTTP — sonnet pela composição cross-pacote e decisão de server design
---

# EST-19 · Entrypoint + empacotamento standalone do Estaleiro (aplica ADR 0012)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo — `turbo.json` define pipeline `build` com dependência `^build` e `build:tokens`
- **Pacotes envolvidos:**
  - `@plataforma/estaleiro-core` — `apps/estaleiro/core/`, build: `tsc`, saída: `dist/`
  - `@plataforma/estaleiro-ui` — `apps/estaleiro/ui/`, build: `tsc` (JSX), saída: `dist/`
- **WS fixado:** `ws://localhost:8787/ws` — hardcoded em `apps/estaleiro/ui/src/App.tsx:14`
- **WS server lib:** `ws` (já disponível como dep do monorepo — usado em `apps/system-peer`, `packages/transport`)
- **Entrypoint a criar:** servidor Node (`node:http` + `ws`) que serve o `dist/` da UI buildada + sobe o WebSocket na porta 8787
- **Empacotamento standalone:** ADR 0012 — Opção C (Node standalone + navegador), cadência manual (`build → copiar dir → restart`). O build vive em dir **fora da working tree**.
- **Capacidade-alvo:** sonnet (composição cross-pacote + servidor WS/HTTP + script de build/launch)

## 1. Objetivo
Tornar o Estaleiro **executável como ferramenta**: um entrypoint que compõe o host de plugins
(EST-02) + os plugins (EST-03…13) + serve a UI já buildada (EST-14) e abre no navegador; e o
**empacotamento standalone** que a ADR 0012 (EST-15) decidiu — build copiado para um diretório
**fora da working tree**, servido por processo Node mínimo, com atualização por **rebuild manual**.

Hoje `apps/estaleiro/{ui,core}` só têm `build: tsc` — existem como bibliotecas, mas **nada sobe o
app**. Esta task fecha essa lacuna aplicando a decisão já tomada. É a diferença entre "todos os
plugins codados" e "uma instância que você abre e usa, isolada do repo que ela mesma edita".

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/adr/0012-empacotamento-standalone-estaleiro.md` — **decisão**: Opção C (Node standalone +
      navegador), cadência **manual** (`build → copiar → restart`). Fonte da arquitetura de empacotamento.
- [x] `tasks/EST-15.md` §8 — PoC de referência (`source→dest` copia dir, `server.mjs` serve `index.html`
      do próprio dir buildado via `node:http`). Reproduzir contra o **build real** da UI.
- [x] `apps/estaleiro/core/src/index.ts` — bootstrap do host: exporta `CORE_VERSION`, `PluginManifest`,
      `FsPort/makeFsPort`, `BashPort/makeBashPort`, `CommitPort/makeCommitPort`. **Network/Store/Events
      ports** existem em `ports/{network,events,store}.ts` mas **NÃO** são re-exportados do index —
      o entrypoint precisará compô-los diretamente ou esperar extensão da EST-02.
- [x] `apps/estaleiro/ui/src/App.tsx:14` — `WS_URL = "ws://localhost:8787/ws"`. O entrypoint DEVE subir
      um WS server nesta porta/rota para a UI funcionar (confirmado: `createWsClient` em
      `ui/src/ws/client.ts` aceita `url` nas opções).
- [x] `apps/estaleiro/ui/src/index.tsx` — exporta `App`, `createWsClient`, stores. A UI é servida como
      JS estático (`dist/`) — o navegador carrega a SPA; o entrypoint só precisa servir os arquivos.
- [x] `apps/estaleiro/ui/package.json` — build: `tsc` → saída `dist/` (tsconfig `"outDir": "dist"`).
- [x] `apps/estaleiro/core/package.json` — build: `tsc` → saída `dist/` (tsconfig `"outDir": "dist"`).

## 3. Escopo de Arquivos (Inputs e Outputs)
> Paths **pinos** — verificados contra a estrutura real de `apps/estaleiro/` no commit atual da master.
- **[READ]** `apps/estaleiro/core/src/index.ts` — port factories: `{Fs,Bash,Commit}Port`/`make*`. As
  ports network/store/events existem em `ports/` mas **não são públicas**.
- **[READ]** `apps/estaleiro/ui/src/App.tsx` — WS_URL = `ws://localhost:8787/ws`.
- **[READ]** `apps/estaleiro/ui/package.json` — saída build: `dist/`.
- **[READ]** `apps/estaleiro/core/package.json` — saída build: `dist/`.
- **[READ]** `tasks/EST-15.md` §8 — padrão PoC (`server.mjs` serve do próprio dir; `build.mjs` copia).
- **[CREATE]** `apps/estaleiro/package.json` — entrypoint do estaleiro: `"scripts": { "start": "node
  server.mjs" }`. Define dep `@plataforma/estaleiro-core`, `@plataforma/estaleiro-ui`, `ws`.
- **[CREATE]** `apps/estaleiro/server.mjs` — servidor Node que: (a) sobe WS server em `localhost:8787/ws`;
  (b) serve arquivos estáticos do diretório `./ui/` (o `dist/` copiado) via `node:http` em porta
  configurável (default `8788`); (c) imprime `http://localhost:<porta>/` no console.
- **[CREATE]** `scripts/estaleiro-standalone.mjs` — script na raiz do superapp que: builda ui+core
  (`pnpm --filter`), cria dir destino `../estaleiro-run/`, copia `dist/` de ui+core + `server.mjs` para
  lá, e executa `node server.mjs` no dir destino. O path `../estaleiro-run/` é fixo (decidido aqui,
  alinhado com ADR 0012 — "fora da working tree").
- **[UPDATE]** `package.json` raiz do superapp — adicionar `"estaleiro:standalone": "node
  scripts/estaleiro-standalone.mjs"`.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- **Framework:** teste funcional via shell script / Node assert (não há nova lógica de negócio a testar unitariamente).
- **Ambiente:** Node puro no dir standalone, `curl` ou `fetch` para verificar respostas HTTP.
- **Fora de Escopo:** E2E da UI (é EST-14); teste unitário do host (é EST-02); teste de gráfico/visual.

### Casos enumerados (4 — Prova de Separação, idêntica a EST-15 §4.7–10, agora contra o build real)

1. **[Separação]** Build gera artefato em `../estaleiro-run/` — diretório **fora** da working tree do superapp. `ls ../estaleiro-run/ui/index.html` existe.
2. **[Servir]** Instância standalone inicia e serve a UI real (não um placeholder). `curl http://localhost:8788/` retorna HTML que contém `<div id="root">`.
3. **[Imunidade]** Editar um arquivo fonte no superapp (`apps/estaleiro/ui/src/App.tsx`) **não** altera o conteúdo servido pela instância rodando até rebuild explícito.
4. **[Rebuild paralelo]** Rebuild (`pnpm estaleiro:standalone` de novo) sobe v2 na porta seguinte (ex.: `:8789`) e v1 continua no ar e inalterada.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** automatizar a cadência (watch/rebuild-on-change, CI local) — ADR 0012 e EST-15 §5
>   deferem explicitamente. Só o comando manual `build → copiar → restart`.
> - **NÃO** adicionar Electron/Tauri nem qualquer framework de desktop — a ADR escolheu Node+browser.
> - **NÃO** commitar o artefato buildado / bundles / binários — o build vive **fora** da working tree.
> - **NÃO** reimplementar host (EST-02) nem UI (EST-14) — só **compor** o que já existe.
> - **NÃO** editar `apps/estaleiro/core/src/index.ts` para re-exportar network/events/store ports —
>   isso é escopo de EST-02, não desta task. Se faltar acesso a essas ports, o entrypoint as compõe
>   diretamente de `core/src/ports/` ou `pause`/`block`.

### Pegadinhas conhecidas
- O servidor standalone deve servir a partir do **dir copiado**, nunca de `apps/estaleiro/ui/dist`
  in-place — servir in-place recria a recursão que a ADR mata (a instância voltaria a depender da
  working tree). O `here = dirname(fileURLToPath(import.meta.url))` do PoC (EST-15 §8) é o padrão.
- WS_URL = `ws://localhost:8787/ws` está hardcoded em `App.tsx`. O entrypoint DEVE subir um WS server
  nesta porta. O servidor `ws` (npm package, já disponível no monorepo) pode ser atachado ao mesmo
  `http.createServer` ou em porta separada.
- O core não exporta `createHost()` — só port factories. O entrypoint compõe a inicialização
  manualmente: `makeFsPort()`, `makeBashPort()`, `makeCommitPort()`. Para network/store/events ports,
  o entrypoint pode importá-las do path direto (`../core/dist/ports/network.js`) ou escalar ao
  arquiteto via `pause`/`block` se o caminho não resolver.
- A porta HTTP default é 8788 (livre, diferente da WS 8787). Se ocupada, o script pode incrementar
  até achar uma livre ou usar 0 (porta aleatória) e imprimir a URL real.

1. **[TDD]** Criar placeholder do servidor + script standalone (vazios, só para validar o ciclo).
2. Criar `apps/estaleiro/server.mjs` — `node:http` serve `./ui/` + `ws` server escuta `:8787/ws`.
3. Criar `apps/estaleiro/package.json` — `scripts.start = "node server.mjs"`, com dep `ws`.
4. Criar `scripts/estaleiro-standalone.mjs` — `pnpm --filter` build, `fs.cp` para `../estaleiro-run/`,
   `child_process.spawn` para start.
5. Atualizar `package.json` raiz — `"estaleiro:standalone": "node scripts/estaleiro-standalone.mjs"`.
6. Rodar a prova de separação (casos 1–4) contra o build real e colar a saída literal na §8.
7. Rodar build + lint (Seção 7) e colar saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DERIVADO (com fonte):**

| Contrato | Fonte |
|---|---|
| `WS_URL = "ws://localhost:8787/ws"` — WS fixo nessa porta/rota | `apps/estaleiro/ui/src/App.tsx:14` |
| UI build → `dist/` | `apps/estaleiro/ui/tsconfig.json:4` (`"outDir": "dist"`) |
| Core build → `dist/` | `apps/estaleiro/core/tsconfig.json:4` (`"outDir": "dist"`) |
| Core exporta `makeFsPort`, `makeBashPort`, `makeCommitPort` mas NÃO network/events/store | `apps/estaleiro/core/src/index.ts:1-5` |
| Network/Store/Events ports existem em `ports/{network,events,store}.ts` (não re-exportados) | `apps/estaleiro/core/src/ports/` |
| Empacotamento: Node standalone + navegador, cadência manual | ADR 0012 (Opção C) |
| Dir standalone fica **fora** da working tree: `../estaleiro-run/` | ADR 0012 §Decisão + EST-15 §8 |

> **Sem decisões em aberto.** Os itens abaixo são escolhas de implementação do worker (documentadas no
> §8), não gaps de design que bloqueiam o ready:
> 1. **Porta HTTP default:** o worker escolhe 8788 (sequencial ao WS 8787) — se ocupada, incrementa.
> 2. **Portas network/events/store:** o entrypoint v1 só precisa de fs/bash/commit (as exportadas).
>    As demais são necessidade futura (plugin execution) — não compô-las agora é deliberado.
> 3. **Prova de separação:** roteirizada como script `.test.mjs` ou passo-a-passo manual — o worker
>    decide e documenta.

> **Dependências:** EST-14 (`done`), EST-15 (`done`). Após endurecimento, auto-promove para `ready`
> (T-1029 — todas as deps `done`).

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] Todos os arquivos de output do §3 foram criados/atualizados, nenhum arquivo fora do escopo?
- [ ] `pnpm estaleiro:standalone` executa sem erro e imprime a URL?
- [ ] `pnpm --filter @plataforma/estaleiro-core build` e `pnpm --filter @plataforma/estaleiro-ui build`
      continuam verdes (build não regrediu)?
- [ ] Linter (`pnpm --filter @plataforma/estaleiro-core lint`, `pnpm --filter @plataforma/estaleiro-ui lint`)
      não acusa erros novos?
- [ ] Nenhuma das regras "NÃO FAZER" da §5 foi violada?
- [ ] Prova de separação (casos 1–4) documentada com saída literal na §8?
- [ ] O servidor standalone serve do **dir copiado** (`../estaleiro-run/`), nunca de `apps/estaleiro/ui/dist` in-place?

### Verificação automática (Gate de Evidência — worker cola a saída literal na Seção 8)
```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-core lint
pnpm --filter @plataforma/estaleiro-ui lint
pnpm estaleiro:standalone
```

**+ Prova de separação (obrigatória — 4 casos, contra o build real):**
1. `ls ../estaleiro-run/ui/index.html` — artefato em dir fora da working tree
2. `curl http://localhost:8788/ | grep -q 'root'` — instância servindo a UI real
3. Editar `apps/estaleiro/ui/src/App.tsx`, `curl http://localhost:8788/` ainda retorna o original
4. `pnpm estaleiro:standalone` de novo (v2 em `:8789`); `curl :8788` v1 original, `curl :8789` v2 mutada

> **GATE DE EVIDÊNCIA (Regra 3 do CLAUDE.md):** Worker cola a saída literal de build + lint (todos
> Exit Code 0) + execução do `estaleiro:standalone` + prova de separação na Seção 8. Sem evidência =
> não terminou.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test + lint):**
```
(cole aqui a saída real de pnpm build, pnpm test e pnpm lint)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-07T18:24]** - *claude-opus* - `[Triado]`: escopo preenchido pelo arquiteto: aplica ADR 0012 (entrypoint + empacotamento standalone). Sem decisoes abertas (D4 resolvida). Endurecimento pina paths do host/WS/dir externo.
- **[2026-07-07T18:32]** - *deepseek* - `[Endurecido]`: endureceu spec: pinou WS 8787, paths dist, core exports; markou opens como worker-decide; todos contratos derivados de fonte
- **[2026-07-07T18:32]** - *deepseek* - `[Promovida p/ ready]`: deps done, endureceu spec → pronto para execução
- **[2026-07-07T18:34]** - *claude-sonnet* - `[Iniciado]`: iniciando: server.mjs + standalone script + package.json entrypoint
- **[2026-07-08T13:24]** - *Antigravity* - `[Bloqueado]`: Spec contraditória: a Seção 3 fixa o path de destino como '../estaleiro-run/' exato, mas a Seção 4 (caso 4) exige que o rebuild paralelo (v2) não derrube nem altere a instância v1. Se v2 sobrescreve o mesmo path fixo, Windows lança EBUSY no rmSync (pois v1 tem o dir como cwd); mesmo copiando por cima, v1 passaria a servir os arquivos mutados de v2. Para v1 continuar inalterada, o destino deve ser versionado (ex: ../estaleiro-run-<ts>/) ou os arquivos cacheados em RAM, mas isso viola o path fixo pedido.
