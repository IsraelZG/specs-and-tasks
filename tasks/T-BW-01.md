---
id: T-BW-01
title: "Bancada: composition root real (storage OPFS + KeyVault + SwarmRegistry + WS reais)"
status: ready
complexity: 3
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-004b", "T-110", "T-204", "T-205"]
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: haiku
# decisions: []
---

# T-BW-01 · Bancada: composition root real (storage OPFS + KeyVault + SwarmRegistry + WS reais)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol/apps) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Substituir os placeholders do composition root da Bancada (`apps/bancada/src/App.tsx`) por instâncias REAIS: StoragePort OPFS (`sqliteWasmStorage`, T-004b), `KeyVault` real (T-110/T-1036), `SwarmRegistry` real (T-205) e adapter WebSocket (T-204) conectando ao system-peer local. É a base de todas as demais T-BW-*: enquanto o root é fake, cada aba "real" continua exibindo estado de mock.

## 2. Contexto RAG (Spec-Driven Development)
- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) §3 E0.3 e §2.4 (reset/cenários)
- [T-004b.md](T-004b.md) (sqliteWasmStorage)
- [T-110.md](T-110.md) / [T-1036.md](T-1036.md) (KeyVault)
- [T-204.md](T-204.md) (WS adapter)
- [T-205.md](T-205.md) (SwarmRegistry)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `apps/bancada/src/App.tsx` (arquivo do Shell da Bancada a ser modificado)
- **[READ]** `packages/core/src/sqliteWasmStorage.ts` (definição de SqliteWasmStorage que implementa GraphStorePort)
- **[READ]** `packages/core/src/keyVault.ts` (definição de KeyVault)
- **[READ]** `packages/transport/src/websocket.ts` (definição de WsAdapter que implementa NetworkAdapterPort)
- **[READ]** `packages/transport/src/SwarmRegistry.ts` (definição de SwarmRegistry)
- **[UPDATE]** `apps/bancada/src/App.tsx` (instanciar SqliteWasmStorage, WsAdapter e integrar com KeyVault e SwarmRegistry)
- **[UPDATE]** `apps/bancada/tests/App.test.tsx` (mockar Worker ou SqliteWasmStorage para os testes passarem no JSDOM)

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest + React Testing Library (JSDOM) para unitários/integração do App; Playwright (headless browser) para E2E smoke tests.
- [x] **Métricas/Cobertura:** Garantir que o `App.test.tsx` passe 100% sem erros de Worker não-suportado. Garantir que a cobertura dos botões/abas e fluxo de renderização permaneça verde.
- [x] **Ambiente do Teste:** JSDOM (Vitest unit) e headless browser (Playwright E2E).
- [x] **Fora de Escopo:** Testes de lógica profunda do SwarmRegistry ou do SQLite WASM/OPFS de baixo nível (já cobertos em suas respectivas tarefas de pacote). O foco aqui é exclusivamente a instanciação e o wiring correto dos componentes no root.
- [x] **Smoke Playwright:** Rodar `pnpm --filter @plataforma/bancada test:e2e` para validar que o app inicia na porta dev e as abas carregam sem erros no console (conforme `bancada.smoke.spec.ts`).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** remova os botões das abas ou mude o layout visual do Shell da Bancada.
> - **NÃO** use `console.error` ao tratar falha de conexão do `WsAdapter` com o system-peer, para evitar que testes de console falhem. Use `console.warn`.
> - **NÃO** remova a aba Mídia ou seus placeholders de reprodução/upload (que serão tratados na respectiva task downstream T-BW-06).

### Pegadinhas conhecidas
- *Web Workers em JSDOM*: JSDOM não suporta Web Workers nativamente. Instanciar `SqliteWasmStorage` no construtor de `App.tsx` fará com que `new Worker(...)` lance uma exceção em testes unitários. Portanto, **é obrigatório** mockar `SqliteWasmStorage` ou a classe `Worker` global em `apps/bancada/tests/App.test.tsx` ou nos setups de teste aplicáveis.

1. **[TDD - Mock Worker em Testes Unitários]**
   Atualize `apps/bancada/tests/App.test.tsx` para mockar `SqliteWasmStorage` de `@plataforma/core` antes dos testes rodarem. A classe mockada deve implementar as assinaturas usadas:
   ```typescript
   vi.mock("@plataforma/core", async (importOriginal) => {
     const original = await importOriginal<typeof import("@plataforma/core")>();
     return {
       ...original,
       SqliteWasmStorage: class {
         constructor() {}
         migrate() { return Promise.resolve(); }
         exec() { return Promise.resolve([]); }
         close() { return Promise.resolve(); }
       }
     };
   });
   ```

2. **[Wiring no App.tsx]**
   Importe as instâncias reais no `apps/bancada/src/App.tsx`:
   - `SqliteWasmStorage` e `MIGRATIONS` de `@plataforma/core`
   - `WsAdapter` de `@plataforma/transport`
   - `useEffect` de `react`

3. **[Instanciação e Migração]**
   Dentro da função componente `App`:
   - Instancie `storage = useMemo(() => new SqliteWasmStorage("bancada-db"), [])`.
   - Adicione um `useEffect` para disparar `storage.migrate(MIGRATIONS)` ao carregar o componente, capturando e logando eventuais erros de forma segura (`console.error` para migração falha é aceitável, pois é um erro de inicialização crítico).

4. **[Instanciação e Conexão de Transporte]**
   - Instancie `wsAdapter = useMemo(() => new WsAdapter({ peerUrls: new Map([['system-peer', 'ws://127.0.0.1:3000']]) }), [])`.
   - Adicione um `useEffect` para chamar `wsAdapter.connect('system-peer')` em background. Use `.catch((err) => console.warn("[Bancada] System-peer connection deferred:", err))` para evitar poluição ou quebra de testes quando o peer local não estiver online.

5. **[Validação]**
   - Rode localmente `pnpm --filter @plataforma/bancada build` para validar types e imports.
   - Rode `pnpm --filter @plataforma/bancada test` para verificar que os testes unitários do shell estão verdes com os mocks aplicados.
   - Rode `pnpm --filter @plataforma/bancada test:e2e` para validar a inicialização em browser Playwright.

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado: todas as dependências (T-004b, T-110, T-204, T-205) estão prontas e suas APIs/interfaces estão 100% definidas e estáveis]*

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?
- [ ] **[gate de acoplamento]** o import respeita a direção de pacotes (`protocol` ← `crypto` ← `core` ← `transport` ← `bancada`) e não fecha ciclo?
- [ ] A instanciação de `SqliteWasmStorage` e `WsAdapter` está de acordo com as especificações do monorepo?
- [ ] Os testes unitários do Shell da Bancada passam sob JSDOM mockando a criação de Workers?

### Verificação automática
```bash
pnpm --filter @plataforma/bancada build      # tsc + vite build — precisa terminar sem erro
pnpm --filter @plataforma/bancada test       # vitest unitarios em JSDOM precisam passar
pnpm --filter @plataforma/bancada test:e2e   # Playwright smoke test da bancada passa
pnpm --filter @plataforma/bancada lint       # ZERO erros de eslint
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.

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
- **[2026-07-14T12:46]** - *claude-fable* - `[Triado]`: Wiring da Bancada — auditoria 2026-07-14: placeholders declarados no App.tsx; endurecimento profundo just-in-time quando as deps fecharem
- **[2026-07-18T11:08]** - *gemini* - `[Endurecido]`: endureceu spec
- **[2026-07-18T11:08]** - *system* - `[Auto-promovida]`: deps todas done
