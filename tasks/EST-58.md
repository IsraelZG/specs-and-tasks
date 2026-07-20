---
id: EST-58
title: "Onda A: Conversas persistidas no Chat (salvar/retomar, vinculo a task)"
status: done
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: [EST-59]
capacity_target: sonnet
ui: true
---

# EST-58 · Onda A: Conversas persistidas no Chat

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-58`.
- **Runtime:** Node.js v20+, `pnpm`, React 19, Vitest/JSDOM, Playwright/Chromium, SQLite (node:sqlite).

## 1. Objetivo
Implementar a RFC-019 §3.2: conversas do Chat persistidas em SQLite (`estaleiro.db`), com sidebar
para listar/retomar/criar/renomear/excluir, e vínculo opcional a uma task MGTIA (fundação do
"reiniciar tasks"). Cada turno grava as mensagens (user/assistant e, futuramente, tool) na conversa
corrente. `content` é JSON desde o dia 1 (string OU array de content-parts) — sem migração de
schema quando as ondas B/F/G adicionarem tool-calls e imagens.

## 2. Contexto RAG
- [RFC-019 §3.2](../docs/rfcs/rfc-019-chat-agentico.md) — schema SQL exato (conversations + conversation_messages), rotas, regra do content-JSON.
- `packages/plugin-tasks/src/storage/sqlite.ts` (`createSqliteStorageBackend`) — padrão de referência para o store.
- `apps/estaleiro/core/src/profile-store.ts` — **VERIFICADO:** `export interface ProfileStore` (linha 13) + `export function createProfileStore(...)` (linha 24) — replicar EXATAMENTE esse shape (interface exportada + factory que recebe o db) para `ConversationStore`/`createConversationStore`.
- `apps/estaleiro/core/src/profile-routes.ts` — padrão de handler (`handleProfileRoutes(store, req, res, method, path): Promise<boolean>`) a replicar em `handleConversationRoutes`; no bootstrap, ENCADEAR retornando o boolean (o bug ERR_HTTP_HEADERS_SENT do EST-48c nasceu de um elo que não propagava `handled` — ver bootstrap.ts:223-234 e o comentário que já existe lá).
- `apps/estaleiro/ui/src/views/chat/ChatView.tsx` — view a estender (estado local de messages passa a hidratar da conversa ativa).
- `apps/estaleiro/ui/src/views/config/ProfileSection.tsx` — padrão de UI de lista+ações do design system.

## 3. Escopo de Arquivos (outline — endurecimento just-in-time fecha assinaturas)
- **[CREATE]** `apps/estaleiro/core/src/conversation-store.ts` — store atrás de interface (padrão StorageBackend): `create/list/get/appendMessage/rename/remove`. **Interface separada da implementação SQLite** — extração futura para pacote durável deve ser um move, não um rewrite.
- **[CREATE]** `apps/estaleiro/core/src/conversation-routes.ts` — `GET/POST /api/conversations`, `GET/DELETE /api/conversations/:id`, `POST /api/conversations/:id/messages`, `PATCH /api/conversations/:id` (rename/vincular task).
- **[UPDATE]** `apps/estaleiro/core/src/bootstrap.ts` — registrar rotas no dispatch (ATENÇÃO ao encadeamento de `handled` — ver bug ERR_HTTP_HEADERS_SENT do EST-48c, mesma cadeia).
- **[UPDATE]** `apps/estaleiro/ui/src/views/chat/ChatView.tsx` — sidebar de conversas (colapsável), hidratação da conversa ativa, gravação por turno.
- **[UPDATE]** testes unit + E2E correspondentes.

## 4. Estratégia de Testes
- Unit (Vitest): store CRUD + append preserva seq; content round-trip string e array-de-parts.
- Integração: rotas sobre bootstrap real (padrão task-api.test.ts).
- **E2E (obrigatório, regra 3b):** criar conversa → 2 turnos (chat mockado) → reload da página → conversa listada na sidebar → retomar → histórico visível → 3º turno envia o array COMPLETO (interceptar payload).
- **Reuso headless (INVIOLÁVEL, exigência do arquiteto):** teste de integração provando que `conversation-store` funciona sem UI/browser — só Node + SQLite (é o que o modo orquestrado usará para retomar contexto de task).

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO acoplar o store à UI ou ao HTTP — interface pura consumível pelo dispatcher headless.
> - NÃO usar localStorage para nada disso (regra da spec do EST-48c se mantém).
> - NÃO implementar branching/fork de conversa (fora de escopo v1 — RFC-019 §6).

## 7. Definition of Done
- [x] **Demo executável (gate da onda A):** conversar → fechar o app → reabrir → retomar a MESMA conversa e o LLM responder usando o contexto anterior. Saída/print colado na §8.
- [x] Teste de reuso headless verde (store sem UI).
- [x] Gate completo (build+test+lint+e2e) allGreen.

### Verificação automática
```bash
pnpm gate @plataforma/estaleiro
```

## 8. Log de Handover e Revisão
### Handover do Executor:

**Resumo.** Onda A implementada por completo: schema SQL da RFC-019 §3.2 (`conversations` +
`conversation_messages`), rotas HTTP, sidebar de conversas no Chat (listar/criar/retomar/renomear/
excluir), gravação por turno best-effort, e testes em todas as camadas (unit store headless,
integração de rotas, integração sobre bootstrap real, unit de UI, E2E).

**Desvio da spec (justificado).** A Seção 0 e o briefing de execução citavam `node:sqlite`
(`DatabaseSync`) como driver. **Verifiquei a fonte real** (`profile-store.ts`, `bootstrap.ts`,
`packages/plugin-tasks/src/storage/sqlite.ts`, `core/package.json`) e todo o core do Estaleiro usa
`better-sqlite3` — `node:sqlite` não é usado em lugar nenhum do pacote. A própria Seção 2 (Contexto
RAG, marcada "VERIFICADO") manda replicar **exatamente** o shape de `profile-store.ts`, que importa
`Database from "better-sqlite3"`. Segui a fonte verificada (Regra 1/SDD: a citação mais específica e
factualmente checada vence a linha genérica de ambiente) — `conversation-store.ts` usa
`better-sqlite3`, mesmo padrão do resto do core.

**Arquivos [CREATE]:**
- `apps/estaleiro/core/src/conversation-store.ts` — `interface ConversationStore` +
  `createConversationStore(db)`; métodos `create/list/get/appendMessage/update/remove` (usei
  `update(id, {title?, taskId?})` em vez de um `rename` separado — cobre rename e vínculo de task no
  mesmo caminho, mesmo padrão de `profile-store.update`).
- `apps/estaleiro/core/src/conversation-routes.ts` — `handleConversationRoutes(store, req, res,
  method, path): Promise<boolean>`.
- `apps/estaleiro/core/tests/conversation-store.test.ts` (19 testes — é o teste de **reuso
  headless**: só Node + SQLite `:memory:`, sem HTTP/UI) e `conversation-routes.test.ts` (12 testes).
- `apps/estaleiro/tests/integration/conversation-api.test.ts` (7 testes, bootstrap real).

**Arquivos [UPDATE]:**
- `bootstrap.ts` — `conversationStore` instanciado e encadeado no dispatch chain **propagando
  `handled`** (`if (handled) return true; return handleConversationRoutes(...)`), mesmo padrão do
  fix do EST-48c. Teste de integração #6/#7 prova que `/api/profiles` e 404 genérico continuam
  funcionando depois do novo elo (anti-regressão ERR_HTTP_HEADERS_SENT).
- `index.ts` — exports novos (`ConversationStore`, `Conversation`, `ConversationMessage`,
  `ConversationWithMessages`, `ConversationRole`, `ConversationContent`, `CreateConversationInput`,
  `UpdateConversationInput`, `AppendMessageInput`, `createConversationStore`,
  `handleConversationRoutes`).
- `apps/estaleiro/ui/src/views/chat/ChatView.tsx` — sidebar colapsável (`«`/`»`), lista por
  `updated_at` desc, "+ Nova conversa", retomar (hidrata `messages`), renomear inline (lápis → input
  → Enter/Escape), excluir com `ConversationConfirmDialog` in-DOM (mesmo padrão do
  `ProfileSection.ConfirmDialog`). Persistência é **best-effort**: se a conversa ainda não existe, o
  1º turno cria uma (`title` = 60 primeiros chars da 1ª msg) antes de gravar; falha de rede em
  qualquer chamada de `/api/conversations*` nunca bloqueia o chat (mesmo comportamento pré-EST-58,
  igual ao fetch de `/api/skills`).
- `apps/estaleiro/ui/src/estaleiro-core.types.ts` — **achado**: o `tsconfig.json` da UI tem
  `paths: { "@plataforma/estaleiro-core": ["src/estaleiro-core.types.ts"] }` — um shim manual de
  tipos "UI-facing", não o `dist` real do pacote. Sem atualizar esse shim os novos tipos
  (`Conversation`, `ConversationWithMessages`) ficavam invisíveis pro `tsc`/`eslint` da UI mesmo com
  o `dist` do core correto — pego só rodando lint completo, não só o build. Adicionei os tipos
  espelhando `conversation-store.ts` 1:1, com o mesmo comentário "ponytail: manter alinhado" que já
  existia ali.
- `apps/estaleiro/ui/src/views/chat/ChatView.test.tsx` — 6 testes novos da sidebar (29-34) + fix:
  os mocks de `fetch` existentes (usados por ~20 testes antigos) caíam no fallback errado quando o
  ChatView passou a chamar `fetch("/api/conversations")` no mount — 1 teste (21) quebrou porque o
  catch-all genérico do mock devolvia o shape de `/api/skills` para QUALQUER url não reconhecida,
  incluindo `/api/conversations`, e `conversations.map` estourava. Corrigido com branch explícito
  `/api/conversations` → `[]` em todo mock de fetch do arquivo.
- `apps/estaleiro/e2e/chat.spec.ts` — testes 26 (fluxo completo: criar → 2 turnos → reload →
  retomar pela sidebar → histórico visível → 3º turno com array completo) e 27 (renomear +
  excluir com confirmação in-DOM). **Achado maior**: sem mock de `/api/conversations`, TODO turno
  de chat cria uma conversa real no backend (SQLite do webServer) cujo `title` = a mensagem enviada
  — isso colidia com `getByText(...)` genéricos dos testes 1/17/etc já existentes (ex.: "ping"
  aparecia 2x no DOM: bolha de chat + item da sidebar). Rodando só o teste novo isso não aparecia;
  só a suite completa expôs a regressão. Corrigido com `mockConversationsNoop()` aplicado a todos os
  testes pré-existentes que enviam mensagem, EXCETO 26/27 (que testam persistência de propósito e
  batem no servidor real, como pedido pela spec).

**Gate — saída literal (`pnpm gate @plataforma/estaleiro`):**
```
✅ build | exit=0 | 6827ms
✅ test | exit=0 | 75673ms
✅ lint | exit=0 | 674ms

📦 artefato: .gate/2171692fd8161453d9821ea18a560934d1d2e647.json | allGreen=true
```
`test` = `pnpm --filter @plataforma/estaleiro test` = `test:integration` (vitest, todas as
integrações incl. `conversation-api.test.ts`) + `test:e2e` (Playwright, 21/21 passando, incl. os 2
novos de conversas). Unit tests dos pacotes `core`/`ui` rodados separadamente (191 e 117 testes,
100% verde) — não fazem parte do gate do app raiz mas cobrem `conversation-store`/`conversation-routes`/
`ChatView` em isolamento.

**Demo executável (DoD, regra 3c) — evidência do E2E #26** (equivalente a "conversar → fechar →
reabrir → retomar → LLM usa contexto anterior": reload de página inteira contra o backend real
SQLite, já que é um app web contra servidor único — o restart de processo/servidor está coberto
separadamente pela integração `conversation-api.test.ts` que usa `createBootstrap` real):
```
[13/21] [chromium] › e2e\chat.spec.ts:461:3 › Chat E2E › 26. criar conversa, 2 turnos, reload,
  retomar pela sidebar, histórico visível, 3º turno envia array completo
  ok 1 [chromium] › e2e\chat.spec.ts:461:3 › ... (1.5s)
  21 passed (25.9s)
```
Asserções cobertas: conversa criada no 1º turno (título = 1ª msg); sidebar lista por `updated_at`
desc; reload limpa estado local mas a conversa persiste (SQLite real); transcrição some antes de
retomar (`toHaveCount(0)`); retomar hidrata as 4 mensagens anteriores; 3º turno envia ao `/api/chat`
o array com os 5 papéis completos (`user,assistant,user,assistant,user`), incluindo o texto exato
da 1ª e da 5ª mensagem.

**Verificação de integridade do artefato:** `git ls-tree "HEAD^{tree}" | grep -v .gate | git mktree`
== `2171692fd8161453d9821ea18a560934d1d2e647` (bate com o `treeSha` gravado no artefato). `git
status --short` vazio.

### Parecer do Agente Revisor:
- [x] **Aprovado**
- [ ] **Requer Refatoração**

**Revisor:** `agile_reviewer:claude-opus-4-8` · auditoria FRIA (não herdada do worker) · 2026-07-20

**Veredito: APROVADO.** Código real auditado arquivo a arquivo, testes lidos e reexecutados por
mim, gate reexecutado do zero na worktree. Nenhum achado bloqueante (B/M). Três minors (m) e uma
observação de gate, todos não-bloqueantes.

#### Escopo (declarado × alterado × disposição)
`git log master..HEAD`: 5 commits (8617c3c store+routes+bootstrap · dc7b669 unit+integração ·
4d3d0a3 sidebar · c77fdd6 e2e · 44fd236 gate artifact).

| Arquivo | Spec §3 | Alterado | Disposição |
|---|---|---|---|
| core/src/conversation-store.ts | CREATE | +208 | ✅ interface+factory, schema RFC §3.2 exato |
| core/src/conversation-routes.ts | CREATE | +141 | ✅ Promise<boolean>, validação, mapeamento de erro |
| core/src/bootstrap.ts | UPDATE | +13/-… | ✅ elo encadeado propagando `handled` |
| core/src/index.ts | UPDATE | +13 | ✅ 10 exports (tipos+factory+handler) |
| ui/.../chat/ChatView.tsx | UPDATE | +536/-116 | ✅ sidebar+hidratação+gravação best-effort |
| ui/src/estaleiro-core.types.ts | **desvio** (handover) | +29 | ✅ **justificado**: shim de tipos UI-facing (`tsconfig.paths`); sem ele os novos tipos ficam invisíveis ao tsc/eslint da UI. Causal e verificado. |
| core/tests/*, tests/integration/*, e2e/chat.spec.ts | UPDATE | +688 | ✅ 5 grupos existem e testam o que dizem |
| .gate/2171692f….json | (gate) | +33 | ✅ allGreen, não-stale |

Zero arquivos fora do escopo declarado. `git status --short` vazio.

#### Confirmações item-a-item
- **conversation-store.ts** — shape = profile-store (`interface`+`create…(db)`). Schema = RFC §3.2
  ao pé da letra (2 tabelas, colunas, `idx_msgs_conv`, `content` JSON). `content` round-trip: escreve
  `JSON.stringify`, lê `JSON.parse` — string E array cobertos por teste (store L95/L102). **SQL
  injection impossível**: 100% prepared statements com `?`. `remove`/`appendMessage` em transação.
- **Desvio node:sqlite → better-sqlite3** — **APROVADO com nota.** Grep confirma: todo o core
  (profile-store, bootstrap, seed, testes) + `plugin-tasks` usam `better-sqlite3`;
  `node:sqlite`/`DatabaseSync` não aparece em lugar nenhum do pacote. **Sem mistura** ⇒ não é MAJOR;
  a linha da §0 era stale, a §2 "VERIFICADO" manda replicar profile-store (que é better-sqlite3). SDD ok.
- **Cadeia `handled` (bug ERR_HTTP_HEADERS_SENT do EST-48c)** — auditei a cadeia inteira em
  bootstrap.ts:230-245: profile→models→**conversation**→fallback, cada elo `if (handled) return true`;
  o elo de conversas (L238) **retorna** o boolean de `handleConversationRoutes`. `handleConversationRoutes`
  retorna `false` quando o path não casa/não trata, `true` quando responde. `catch` checa `headersSent`.
  Anti-regressão provada pelos testes de integração #6 (/api/profiles) e #7 (404 genérico). Sem regressão.
- **ChatView.tsx** — sidebar funcional (listar/nova/retomar/renomear inline/excluir com diálogo
  in-DOM). **Persistência best-effort confirmada**: create+append do turno do usuário em try/catch que
  engole erro; append do assistant é fire-and-forget com `.catch` noop. Falha de rede **degrada
  silenciosamente** e o chat segue em memória — não quebra. Correto.
- **Testes** — reexecutados por mim: `@plataforma/estaleiro-core` = **191/191 verde** (incl. 19 store
  + 12 routes). Integração = 7 (incl. anti-regressão #6/#7). ChatView = 6 novos (29-34). E2E 26 **NÃO
  mocka `/api/conversations`** (comentário explícito L463 + `mockConversationsNoop` aplicado a todos
  menos 26/27) — bate no SQLite real do webServer: cria conversa → 2 turnos → reload → `toHaveCount(0)`
  → retomar → hidrata 4 msgs → 3º turno envia array de 5 papéis `[user,assistant,user,assistant,user]`.
  Reuso headless (INVIOLÁVEL) = `conversation-store.test.ts` só Node+SQLite `:memory:`, sem HTTP/UI.
- **Gate** — artefato allGreen=true; `git ls-tree HEAD^{tree} | grep -v .gate | git mktree` =
  `2171692fd8161453d9821ea18a560934d1d2e647` == `treeSha` do artefato ⇒ **não-stale**. Reexecutei
  `pnpm gate @plataforma/estaleiro` na worktree: **build exit=0 (3491ms) · test exit=0 (77179ms) ·
  lint exit=0 (670ms) · allGreen=true**, mesmo treeSha. (Nota de processo: a 1ª reexecução falhou no
  `execSync("pnpm install")` de restauração do `estaleiro-standalone.mjs:332` — falha de ambiente
  transiente pós-deploy, não código EST-58; `pnpm install` manual voltou verde em 535ms e a
  reexecução limpa passou. `.gate/` e `pnpm-lock.yaml` restaurados; worktree limpa.)

#### Achados não-bloqueantes
- **[m1] Hidratação descarta content-array e roles tool/system-futuros.** `ChatView.handleResumeConversation`
  (L240-242) filtra `typeof m.content === "string"` e roles user/assistant/system. Correto para a Onda A
  (só há texto), mas quando a Onda B (EST-59) gravar arrays de tool-call, **retomar uma conversa
  descartará silenciosamente essas mensagens da transcrição**. Registrar como gatilho para EST-59.
- **[m2] `seq` calculado fora da transação.** `appendMessage` lê `MAX(seq)+1` (store L153-156) *antes*
  de abrir `db.transaction`. In-process é livre de corrida (better-sqlite3 síncrono + JS single-thread,
  sem `await` entre a leitura e o `tx()`). Cross-process (dois processos SO no mesmo .db) poderia colidir
  o seq — irreal no estaleiro (servidor único), mas mover o `MAX` para dentro da transação fecha a janela
  teórica. Nit.
- **[m3 / observação de gate, não contra o worker]** O `test` do `pnpm gate @plataforma/estaleiro` =
  `test:integration && test:e2e` apenas; os 19 store + 12 routes + testes de ChatView e o **lint dos
  pacotes core/ui** NÃO fazem parte do gate do app raiz (o lint do app é `echo 'No lint yet'`). Estrutura
  pré-existente do gate, não introduzida aqui — cobri o deliverable headless (INVIOLÁVEL) rodando os
  testes do core à parte (191/191). Candidato a endurecer o gate numa cleanup.

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-20T00:19]** - *claude-fable-5* - `[Triado]`: triagem RFC-019: onda com escopo/deps/capacidade definidos; endurecimento profundo just-in-time
- **[2026-07-20T00:38]** - *claude-fable-5* - `[Endurecido]`: endurecida: APIs verificadas na fonte (vendor cline/mcp-sdk/playwright-mcp/ts-language-server + node_modules ai v7), spike node-pty ARM64 resolvido por execucao real, decisoes fechadas (SDK 1.x estavel, HITL nativo needsApproval, upload PUT binario)
- **[2026-07-20T00:39]** - *claude-fable-5* - `[Promovida p/ ready]`: sem dependencias, spec endurecida com referencias verificadas - pronta para execucao
- **[2026-07-20T01:25]** - *claude-sonnet-5* - `[Iniciado]`: iniciando onda A
- **[2026-07-20T01:54]** - *claude-sonnet-5* - `[Finalizado]`: onda A pronta: conversas persistidas (schema+rotas+sidebar) + gravacao por turno best-effort + reuso headless + E2E reload/retomar. Gate allGreen: build=6827ms test=75673ms(21/21 e2e) lint=674ms
- **[2026-07-20T01:55]** - *agile_reviewer:claude-opus-4-8* - `[Em revisão]`: revisando onda A
- **[2026-07-20T02:04]** - *agile_reviewer:claude-opus-4-8* - `[Aprovado]`: Integrado: merge na master (42df371), arvore identica a branch (evidencia transfere), gate allGreen .gate/2171692f. Onda A entregue: conversas persistidas (store+rotas+sidebar+e2e reload/retomar). 3 minors -> ledger. Worker claude-sonnet-5, reviewer claude-opus-4-8.
