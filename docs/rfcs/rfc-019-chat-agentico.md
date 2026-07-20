# RFC-019 — Chat Agêntico: do Q&A ao loop fechado (capacidades reutilizáveis pela versão headless)

- **Status:** draft (adaptação de especificação externa ao ecossistema Estaleiro; pronto para decompor em EST-58+)
- **Data:** 2026-07-19
- **Autor:** claude-fable-5 (a partir de especificação arquitetural fornecida pelo arquiteto)
- **Decisor:** Israel (arquiteto da plataforma)
- **Fonte adaptada:** "Documento de Especificação Arquitetural: Ambiente de Desenvolvimento Agêntico" (fornecido em sessão, 2026-07-19)

---

## 1. Contexto e tese

O Chat do Estaleiro hoje é **transacional**: uma chamada `generateText` por turno, sem tools, sem
persistência, sem loop. A especificação externa pede a evolução para **loop fechado** (closed-loop):
o LLM orquestra leitura/escrita de arquivos, shell, diagnóstico sintático (LSP) e auditoria visual
(browser+screenshot), de forma autônoma com aprovação humana nos pontos de risco.

**Tese central da adaptação:** o documento externo assume construção do zero — mas o Estaleiro já
tem ~60% das peças construídas e auditadas (fidelidade confirmada na auditoria de 2026-07-19).
A adaptação NÃO reconstrói: **o Chat vira uma segunda frente do MESMO runtime de agente que o
modo headless/orquestrado já usa** (`plugin-agent-harness` + portas mediadas do host). Cada
capacidade nova (MCP, PTY, LSP, browser, anexos) nasce como plugin/porta consumível pelos dois
modos — chat interativo E despacho headless — cumprindo o requisito de reuso do arquiteto.

## 2. Mapa de reuso — o que o doc externo pede × o que já existe

| Doc externo pede | Já existe no Estaleiro | Gap real |
|---|---|---|
| Cliente-Servidor local, UI "burra", WS | `bootstrap.ts` (HTTP+WS único, F3), UI React consome eventos | — nenhum |
| Loop agêntico (reasoning loop com tool_calls) | `plugin-agent-harness::run()` — loop AI SDK com `tools`, `stopWhen: stepCountIs(maxSteps)`, eventos `agent:*` (start/step/tool-call/tool-result/done/aborted/error) já transmitidos por WS e renderizados em Frota/Terminal | Ligar o Chat a esse loop (hoje o chat não o usa) |
| FS_MCP (read/write/list/search, cwd-lock) | `ports/fs.ts` (allowlist, cwd-lock, normalize) + `plugin-fs-tools::makeTools` (readFile/writeFile como AI-SDK tools, mediados) | `list_directory`/`regex_search` como tools; UI de tool-calls no chat |
| Terminal_MCP (`node-pty`, background+logs) | `ports/bash.ts` (gating, allowlist, timeout, cwd-lock, `windowsHide`) — mas `child_process`, sem PTY, sem background | PTY real, `run_in_background`+`read_terminal_logs`, HITL |
| LSP_MCP (diagnostics, definitions) | — nada | Plugin novo (typescript-language-server via stdio) |
| Browser_MCP (screenshot, a11y tree, interact) | Playwright já é dep (E2E) | Client MCP + `@playwright/mcp` (server de mercado) cobre isso quase de graça |
| MCP como padrão de ferramenta | — nada | Client MCP no core (SDK oficial `@modelcontextprotocol/sdk`), adaptador MCP-tool→AI-SDK-tool |
| Persistência de conversa | SQLite já é o storage (estaleiro.db, `createSqliteStorageBackend` como padrão de referência) | Tabelas conversations/messages + rotas + UI |
| HITL (aprovação de comando arriscado) | Allowlist dura no BashPort (bloqueia, não pergunta) | Fluxo aprovar/rejeitar via WS + modal na UI |
| Sandboxing (chroot lógico, matriz de risco) | Mediação total do host (A2/A3, RFC-018): cwd-lock e allowlist JÁ são invariantes das portas | Manter — MCP externo é a exceção nova a regrar (§7) |
| Multimodal (screenshot→LLM) | — chat é text-only | Content parts (imagem) no ChatMessage + upload |

**Consequência:** das 4 "MCP servers" do doc externo, só LSP exige construção integral. FS e
Terminal são extensões de portas existentes; Browser vem de um server MCP de mercado assim que o
client MCP existir. O investimento pesado é UMA vez (loop no chat + client MCP + HITL); o resto é
incremental.

## 3. Arquitetura

### 3.1 Princípio: um runtime, duas frentes

```
                        ┌────────────────────────────┐
   Chat UI (React) ───► │  ChatAgentService (NOVO)   │──► eventos WS (agent:*, approval:*)
                        │  = plugin-agent-harness    │
   Dispatcher headless ►│    run() JÁ EXISTENTE      │──► mesmos eventos → Frota/Execução
   (POST /api/workflow) │  + registry de tools       │
                        └──────────┬─────────────────┘
                                   │ tools (AI SDK, zod)
              ┌────────────────────┼──────────────────────────┐
              ▼                    ▼                          ▼
    Tools internas (mediadas)   Adaptador MCP            HITL gate
    fs/bash/lsp via PORTAS      client @modelcontext-    (promise pausada,
    do host (cwd-lock,          protocol/sdk → stdio     WS approval:request,
    allowlist — invariante)     servers externos         UI aprova/rejeita)
```

- **`ChatAgentService`** (novo, `apps/estaleiro/core/src/chat-agent-service.ts`): substitui o
  `chat-service.ts` transacional quando o usuário liga o "modo agente" (toggle na UI; modo Q&A
  atual permanece como caminho sem tools). Internamente chama o `run()` do harness com o mesmo
  contrato de eventos — **zero fork do loop**. O pseudo-código `agenticLoop` do doc externo já é
  exatamente o que `runner.ts` faz (AI SDK `stopWhen`/`onStepFinish`); não reimplementar.
- **Registry de tools**: composição por request — tools internas (portas) + tools MCP (dos servers
  conectados) + wrapper HITL nas marcadas como arriscadas. Mesma composição serve o dispatcher
  headless (é só passar o mesmo registry ao `createAgentRuntime` existente).
- **UI "burra"**: já é o modelo (F3) — a UI só renderiza eventos WS e envia intents HTTP. Os
  eventos novos (`approval:request`, `tool:*` no chat) seguem o mesmo canal único.

### 3.2 Persistência de conversas (fundação de "reiniciar tasks")

Tabelas no `estaleiro.db` (mesmo SQLite, mesmo padrão `StorageBackend` do plugin-tasks):

```sql
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,            -- uuid
  title TEXT NOT NULL,            -- derivado da 1ª msg (primeiros ~60 chars) ou editável
  task_id TEXT,                   -- opcional: vincula a uma task MGTIA (p/ retomar contexto de task)
  model_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conversation_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  seq INTEGER NOT NULL,           -- ordem estável no thread
  role TEXT NOT NULL,             -- user | assistant | system | tool
  content TEXT NOT NULL,          -- JSON: string OU array de content-parts (texto/imagem/tool-call/tool-result)
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_msgs_conv ON conversation_messages(conversation_id, seq);
```

`content` como JSON desde o dia 1 (não string) — é o que permite tool-calls/results e depois
imagens (anexos/screenshots) sem migração de schema. Rotas: `GET/POST /api/conversations`,
`GET /api/conversations/:id` (com mensagens), `POST /api/conversations/:id/messages` (turno),
`DELETE /api/conversations/:id`. O turno de chat passa a gravar cada mensagem (user, assistant,
tool) na conversa corrente.

### 3.3 Client MCP

- **Pacote:** `packages/plugin-mcp` (`@plataforma/plugin-mcp`). Usa `@modelcontextprotocol/sdk`
  (client oficial) com transporte **stdio** no v1 (HTTP/SSE fica para onda posterior).
  *Nota de endurecimento:* o `ai` v7 instalado não expõe `experimental_createMCPClient` — NÃO
  depender do wrapper da Vercel; o adaptador converte `Tool` MCP (JSON Schema) → tool AI SDK
  (zod via `jsonSchema()` do pacote `ai`) manualmente. Verificar API exata na fonte no
  endurecimento (cite ou escale).
- **Config declarativa:** `mcp_servers` no `estaleiro.db` (id, name, command, args JSON, enabled,
  auto_approve JSON de tool-names) + CRUD `GET/POST/PUT/DELETE /api/mcp/servers` + botão
  "Testar conexão" (handshake + `tools/list`). UI: seção nova na Config (mesmo padrão visual do
  ProfileSection).
- **Ciclo de vida:** host inicia os servers `enabled` no boot do chat-agent (lazy: primeiro uso),
  mata no shutdown; crash de server MCP → tools dele saem do registry e evento `mcp:server-down`
  no WS (não derruba o chat).
- **Server de teste (mercado):** `@modelcontextprotocol/server-everything` (referência oficial de
  teste do protocolo) e/ou `@modelcontextprotocol/server-filesystem` apontado para um diretório
  sandbox. Critério de aceite da onda: uma tool de um DESSES servers chamada de dentro do chat com
  o resultado renderizado.

### 3.4 Terminal com PTY

- **Pacote:** `packages/plugin-terminal` (`@plataforma/plugin-terminal`), usando `node-pty`
  (**spike RESOLVIDO 2026-07-19**: prebuild Windows ARM64 nativo validado por execução real na
  máquina alvo — spawn+write+read funcionam; fallback child_process descartado. Snippet validado
  na spec da EST-61).
- **Tools:** `run_command(command, run_in_background)` → foreground retorna
  `{ exit, stdout_tail }`; background retorna `{ pid }` imediatamente.
  `read_terminal_logs(pid, offset?)` → ring buffer contínuo (mesmo padrão do fleetStore, 1000
  linhas). `kill_process(pid)`.
- **Herda do BashPort (INVIOLÁVEL):** cwd-lock no diretório de trabalho da conversa, allowlist, e
  o anti-git-no-Docs existente. O que muda: comando fora da allowlist deixa de ser bloqueio duro e
  vira **HITL** (§3.6).
- **UI:** a view Terminal existente passa a renderizar também os streams de PTY do chat (mesma
  tabela `stream` do fleetStore — reuso direto).

### 3.5 LSP

- **Pacote:** `packages/plugin-lsp` (`@plataforma/plugin-lsp`). Spawna `typescript-language-server
  --stdio` (dep dev do monorepo) e fala JSON-RPC direto (`vscode-jsonrpc`); 1 instância por
  workspace root, lazy.
- **Tools:** `get_diagnostics(file_path)` → `{ errors: [{line, col, message, code}] }` (equivale à
  aba Problems); `get_definition(file_path, line, col)` e `get_hover(file_path, line, col)` →
  tipos/assinaturas para o LLM não alucinar API.
- **UI:** chip de diagnósticos no tool-result do chat (n erros, expande a lista).
- **Escopo v1:** só TypeScript (é o monorepo inteiro); outras linguagens ficam atrás da mesma
  interface se/quando precisar.

### 3.6 HITL — aprovação humana

- **Matriz de risco** (config + default): `rm|del|rmdir`, `git reset|push --force|checkout --`,
  `sudo`, instalação global, qualquer `write_file` fora de `src/**` do projeto da conversa, e
  qualquer tool MCP externa não listada em `auto_approve` do server.
- **Fluxo:** tool arriscada → `approval:request {id, tool, args, risk}` no WS → loop pausa
  (timeout 5min → auto-rejeita) → UI mostra card inline Aprovar/Rejeitar → `POST /api/approvals/:id`
  → tool executa ou retorna `{ denied: true, reason }` ao LLM (que replaneja).
  **Mecanismo (verificado 2026-07-19):** o `ai` v7 instalado tem suporte NATIVO —
  `Tool.needsApproval: boolean | fn` + prompt-parts `ToolApprovalRequest/Response` — implementar o
  fluxo sobre ele, não com wrapper artesanal de promise (o wrapper fica como fallback documentado
  se o resume do generateText se provar inviável; detalhes na spec da EST-59).
- **Persistência:** decisão gravada na conversa (auditoria) — mesma linha `role: tool`.

### 3.7 Browser (auditoria visual)

- **Via MCP, não plugin próprio:** `@playwright/mcp` (server oficial Microsoft, mercado) conectado
  pelo client da §3.3 — navegar, screenshot, snapshot de acessibilidade e interações já expostos
  como tools MCP prontas. Só entra depois do multimodal (§3.8) para o screenshot voltar como
  imagem ao modelo.
- **Fluxo do doc externo** (modificar componente → `browser_verify` → console errors + screenshot
  + a11y tree → modelo multimodal cruza visão com código) fica disponível por composição de tools
  já existentes ao invés de uma tool monolítica.

### 3.8 Anexos e multimodal

- `ChatMessage.content` evolui de `string` para `string | ContentPart[]` onde
  `ContentPart = { type: "text", text } | { type: "image", data: base64, mimeType }` — espelha o
  formato de content-parts do AI SDK (conversão 1:1 no chat-service).
- Upload: `PUT /api/conversations/:id/attachments` — body binário cru + `Content-Type` +
  `X-Filename` (SEM multipart: `busboy` não está no monorepo e parse manual é bug-farm; decisão
  fechada 2026-07-19, detalhe na EST-64) (limite 10MB, tipos: png/jpg/webp/
  txt/md/pdf-como-texto), armazenado em `attachments/` ao lado do db, referenciado por hash.
- UI: botão de anexo + paste de imagem no textarea; thumbnail na mensagem.
- Screenshots do browser (§3.7) entram pelo mesmo caminho de content-parts — por isso anexos e
  browser compartilham fundação (a onda F entrega a fundação; G só a UI de upload).

## 4. Segurança (adapta §5 do doc externo)

1. **Mediação do host permanece INVIOLÁVEL** para tools internas: fs/bash/lsp passam pelas portas
   existentes (cwd-lock, allowlist) — nenhuma tool interna recebe `node:fs`/`child_process` cru.
2. **MCP externo é a exceção regrada:** roda como processo separado com os privilégios do SO (não
   há como mediar por dentro). Mitigação: (a) opt-in explícito por server na Config; (b) HITL
   default para toda tool externa não auto-aprovada; (c) documentar no card do server o que ele
   acessa. NÃO instalar servers automaticamente a pedido do LLM.
3. **CWD da conversa:** cada conversa tem um workspace root (default: nenhum → tools de disco
   desabilitadas; usuário escolhe o diretório na UI). O "chroot lógico" do doc externo já é o
   comportamento do FsPort.
4. **Kill switch:** botão "Parar" no chat aborta o loop via `AbortController` (mecanismo já
   existente no harness — `agent:aborted`).

## 5. Plano incremental — 7 ondas, cada uma com UI + demo executável

> Disciplina das ondas (retrospectiva 2026-07-19): **gate de onda = demo executável no standalone**
> (M1/regra 3c) — a onda só fecha com a ação de usuário provada ponta-a-ponta e a saída colada.
> E2E obrigatório em toda task `ui: true` (M3/regra 3b). Dimensionamento M5: trabalho integrativo
> (backend+UI+fluxo juntos) → 1 task Sonnet/Opus por onda, NÃO decompor em 3 micro-tasks por onda;
> usar `compose-task.mjs` se alguma onda nascer fragmentada.

| Onda | Task | Entrega | UI visível | Demo executável (gate da onda) | Capacidade |
|---|---|---|---|---|---|
| **A** | EST-58 | Conversas persistidas: schema+rotas+gravação por turno; vínculo opcional a task MGTIA | Sidebar de conversas no Chat (listar, retomar, nova, renomear, excluir) | Conversar → fechar o app → reabrir → retomar a MESMA conversa e o LLM lembrar o contexto | sonnet |
| **B** | EST-59 | Loop agêntico no Chat (reuso do harness `run()`) + client MCP (`plugin-mcp`) + config de servers + HITL básico (toda tool MCP pede aprovação) | Toggle "modo agente"; chips de tool-call/result inline na transcrição; seção MCP Servers na Config; card Aprovar/Rejeitar | Conectar `server-everything` (mercado) pela Config → pedir no chat algo que use uma tool dele → ver chip da tool + resultado na conversa | **opus** (integrativo: loop+MCP+HITL+UI se cruzam) |
| **C** | EST-60 | Tools de disco internas no chat: read/write/list/regex-search via FsPort; workspace root por conversa | Seletor de diretório de trabalho; tool-chips com preview de diff em `write_file`; HITL em writes fora de src/** | "Leia o arquivo X e resuma" e "crie o arquivo Y com Z" funcionando no workspace escolhido, com o write aparecendo no disco | sonnet |
| **D** | EST-61 | `plugin-terminal` (node-pty): run_command fg/bg, read_terminal_logs, kill; matriz de risco HITL completa | Output de comando estilo terminal na transcrição; badge de processo em background; aprovação para comando arriscado | "Rode pnpm test e resuma o resultado" (fg) e "suba o dev server e me diga quando estiver pronto" (bg + leitura de log); comando arriscado → card de aprovação | sonnet (spike node-pty ARM64 no endurecimento) |
| **E** | EST-62 | `plugin-lsp` (typescript-language-server): get_diagnostics, get_definition, get_hover | Chip de diagnósticos (n erros, expansível) no tool-result | Agente edita um arquivo TS com erro proposital → consulta diagnostics → corrige → diagnostics zero, tudo visível na conversa | sonnet |
| **F** | EST-63 | Multimodal (content-parts imagem no ChatMessage/chat-service) + `@playwright/mcp` conectado como server MCP | Screenshot renderizado inline na transcrição | "Abra localhost:8899 e me descreva a tela" → screenshot aparece no chat E o modelo o descreve corretamente (prova do loop visual fechado) | **opus** (integrativo: schema de mensagem+SDK+UI) |
| **G** | EST-64 | Anexos: upload/paste de imagem e texto, storage por hash | Botão de anexo + paste no textarea + thumbnails | Colar um screenshot no chat e perguntar sobre ele → resposta correta baseada na imagem | sonnet |

**Ordem fixada pelo arquiteto** (sessão 2026-07-19): A → B → C → D → E → F → G. Cada onda depende
apenas da anterior (B fornece o loop+MCP que C-G consomem; F fornece o multimodal que G consome).

**Reuso headless (o requisito transversal):** ao final de cada onda, a capacidade nova deve ser
consumível pelo `createAgentRuntime`/dispatcher SEM a UI — critério de aceite em cada task: o
registry de tools da onda é injetável no runtime headless existente (teste de integração provando
isso, sem browser). É o que garante que o chat é a bancada de testes do modo orquestrado, não um
fork.

## 6. Fora de escopo desta RFC (registrado para não perder)

- Transporte MCP HTTP/SSE (v1 é stdio-only).
- Multi-linguagem no LSP (v1 é TS-only).
- Branching/fork de conversa na UI (schema já suporta via cópia de mensagens até um seq; UI fica
  para onda posterior).
- Streaming token-a-token na transcrição (v1 mantém turno inteiro; o harness já emite steps — a UI
  mostra progresso por tool-events, que é o feedback que importa no modo agente).
- Compressão de contexto no caminho do chat (objetivo #3 da especificação-estaleiro; entra quando
  o plugin-context ganhar consumidor — não misturar nesta série).

## 7. Referências

- Especificação externa fornecida pelo arquiteto (2026-07-19) — base desta adaptação.
- RFC-018 (§3 arquitetura-alvo, A2/A3 mediação total) — invariantes que esta RFC preserva.
- `docs/especificacao-estaleiro.md` §5.1 (módulo Chat: "central universal de comando") — esta RFC
  implementa a visão secundária do Chat (histórico/retomada) e o caminho para o "Montador de Contexto".
- Auditoria spec↔código 2026-07-19 (88 tasks EST) — inventário do que existe, base do mapa de reuso §2.
- MCP: `modelcontextprotocol.io` (SDK TS oficial), `@modelcontextprotocol/server-everything`
  (server de teste), `@playwright/mcp` (browser server, Microsoft).
- Retrospectiva 2026-07-19 (M1 demo-gate, M3 E2E obrigatório, M5 dimensionamento bidirecional) —
  disciplina aplicada ao plano da §5.
