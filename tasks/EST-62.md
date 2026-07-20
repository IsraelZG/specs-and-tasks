---
id: EST-62
title: "Onda E: plugin-lsp (typescript-language-server) - diagnostics, definition, hover"
status: draft:hardened
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [EST-61]
blocks: [EST-63]
capacity_target: sonnet
ui: true
---

# EST-62 · Onda E: LSP no Chat

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-62`.

## 1. Objetivo
Implementar a RFC-019 §3.5: `@plataforma/plugin-lsp` (durável) que spawna
`typescript-language-server --stdio` (1 instância por workspace root, lazy) e expõe as tools
`get_diagnostics(file_path)` (equivale à aba Problems), `get_definition(file_path, line, col)` e
`get_hover(file_path, line, col)` — para o LLM validar código com o compilador antes de sugerir,
em vez de alucinar APIs. Escopo v1: só TypeScript (é o monorepo inteiro); outras linguagens ficam
atrás da mesma interface.

## 2. Contexto RAG
- [RFC-019 §3.5](../docs/rfcs/rfc-019-chat-agentico.md).
- `packages/plugin-terminal` (EST-61) — padrão de plugin durável com processo filho gerenciado (spawn/dispose) a replicar.
- `apps/estaleiro/core/src/chat-agent-service.ts` — registry onde as tools entram.

### Referências VERIFICADAS na fonte (endurecimento 2026-07-19)
- **Vendor clonado:** `docs/_vendor/ts-language-server/` (repo oficial do typescript-language-server).
  - Invocação: `typescript-language-server --stdio` (README linha 54; `--stdio` é "required option", linha 66).
  - `initializationOptions.tsserver.path` para apontar o tsserver do workspace (README ~linha 303 — usar o `typescript` do próprio monorepo, `source: workspace`).
  - Stack de deps que ELES usam (package.json linhas 71-74): `vscode-jsonrpc ^9`, `vscode-languageserver-protocol ^3.18` — usar as MESMAS no plugin (client side: `createMessageConnection(StreamMessageReader(proc.stdout), StreamMessageWriter(proc.stdin))` do vscode-jsonrpc; tipos de request/notification do vscode-languageserver-protocol).
- **Sequência LSP (padrão do protocolo, conferível no vendor):** `initialize` (com rootUri do
  workspace) → `initialized` → `textDocument/didOpen` (fileUri+conteúdo) → aguardar notificação
  `textDocument/publishDiagnostics` (server-push; correlacionar por uri, timeout 10s) →
  `textDocument/definition` e `textDocument/hover` são requests com `{textDocument:{uri}, position:{line, character}}` (0-based!).
- Instalar `typescript-language-server` como devDependency do monorepo (não global).

## 3. Escopo de Arquivos (outline)
- **[CREATE]** `packages/plugin-lsp/` — client JSON-RPC sobre stdio, ciclo de vida (lazy start por workspace, dispose), as 3 tools AI-SDK. Diagnostics via didOpen+pull (aguardar publishDiagnostics com timeout 10s).
- **[UPDATE]** `chat-agent-service.ts` — injeta lsp-tools quando a conversa tem workspace root TS (heurística: tsconfig.json presente).
- **[UPDATE]** `ChatView.tsx` — chip de diagnósticos no tool-result (n erros, expande lista com line/col/message).

## 4. Estratégia de Testes
- Unit: parser de diagnostics → shape `{errors:[{line,col,message,code}]}`; dispose mata o processo.
- Integração: workspace fixture com 1 arquivo TS com erro proposital → get_diagnostics acha o erro; corrige o arquivo → diagnostics vazio. (typescript-language-server real, timeout generoso).
- **E2E (obrigatório):** fluxo agêntico mockado onde o tool-result de diagnostics renderiza o chip com contagem certa.
- **Reuso headless (INVIOLÁVEL):** lsp-tools injetáveis no `createAgentRuntime` sem UI — é o que dará ao worker orquestrado a capacidade de auto-validar código antes do gate.

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO suportar multi-linguagem no v1 (RFC-019 §6).
> - NÃO manter o language server vivo sem conversa ativa com workspace (lazy + dispose por inatividade 5min).
> - NÃO parsear stdout cru — JSON-RPC estruturado via vscode-jsonrpc.

## 7. Definition of Done
- [ ] **Demo executável (gate da onda E):** agente edita um arquivo TS com erro proposital → consulta diagnostics → corrige → diagnostics zero, tudo visível na conversa. Evidência na §8.
- [ ] Gate completo allGreen.

### Verificação automática
```bash
pnpm gate @plataforma/estaleiro
pnpm --filter @plataforma/plugin-lsp build && pnpm --filter @plataforma/plugin-lsp test && pnpm --filter @plataforma/plugin-lsp lint
```

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-20T00:19]** - *claude-fable-5* - `[Triado]`: triagem RFC-019: onda com escopo/deps/capacidade definidos; endurecimento profundo just-in-time
- **[2026-07-20T00:39]** - *claude-fable-5* - `[Endurecido]`: endurecida: APIs verificadas na fonte (vendor cline/mcp-sdk/playwright-mcp/ts-language-server + node_modules ai v7), spike node-pty ARM64 resolvido por execucao real, decisoes fechadas (SDK 1.x estavel, HITL nativo needsApproval, upload PUT binario)
