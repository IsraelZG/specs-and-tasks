---
id: EST-64
title: "Onda G: Anexos no Chat (upload/paste de imagem e texto)"
status: draft:hardened
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [EST-63]
blocks: []
capacity_target: sonnet
ui: true
---

# EST-64 · Onda G: Anexos no Chat

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-64`.

## 1. Objetivo
Implementar a RFC-019 §3.8 (UI de anexos — a fundação multimodal veio da EST-63): botão de anexo +
paste de imagem no textarea do Chat; upload via `POST /api/conversations/:id/attachments`
(multipart, limite 10MB, tipos png/jpg/webp/txt/md), armazenado em `attachments/` ao lado do db,
referenciado por hash (dedup); anexo vira content-part na mensagem do usuário; thumbnail na
transcrição.

## 2. Contexto RAG
- [RFC-019 §3.8](../docs/rfcs/rfc-019-chat-agentico.md).
- EST-63 — content-parts já implementados (imagem já renderiza na transcrição); esta task só adiciona a ENTRADA pelo usuário.
- `conversation-routes.ts` (EST-58) — onde a rota de attachment entra.
- `apps/estaleiro/core/src/bootstrap.ts` — o servidor HTTP é `node:http` puro. **DECISÃO FECHADA no endurecimento (2026-07-19):** `busboy` NÃO está no monorepo (verificado em node_modules) e parse manual de multipart é bug-farm — **NÃO usar multipart**. Upload v1 é `PUT /api/conversations/:id/attachments` com body binário cru + headers `Content-Type: <mime>` e `X-Filename` (URL-encoded): zero dependência nova, `req` já é stream, limite de 10MB por `content-length` + contador de bytes no stream. A UI envia via `fetch(url, {method:"PUT", body: file})` — trivial com File/Blob do paste/input. (Multipart real só se um dia houver upload em lote — YAGNI.)

## 3. Escopo de Arquivos (outline)
- **[UPDATE]** `conversation-routes.ts` — rota de upload (validação de tipo/tamanho, hash sha-256, dedup em `attachments/`).
- **[UPDATE]** `ChatView.tsx` — botão de anexo, handler de paste de imagem no textarea, thumbnail + remoção antes do envio; anexo entra como content-part image/text na mensagem user.
- **[UPDATE]** testes.

## 4. Estratégia de Testes
- Unit: validação de tipo/tamanho, dedup por hash.
- Integração: upload → arquivo em attachments/ → mensagem com content-part referenciando.
- **E2E (obrigatório):** paste de imagem (via CDP `Input.dispatch`/fixture) → thumbnail na transcrição → envio → payload contém a image-part (interceptado).
- **Reuso headless:** a rota + store de attachments funcionam sem UI (teste de integração) — o modo orquestrado anexará screenshots/logs a conversas de task pelo mesmo caminho.

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO aceitar tipos executáveis ou SVG (XSS) — allowlist estrita de MIME.
> - NÃO inline base64 no SQLite para anexos (arquivo em disco + referência; diferente do screenshot da EST-63, que é transitório do tool-result).
> - NÃO exceder o limite de 10MB (413 com mensagem clara).

## 7. Definition of Done
- [ ] **Demo executável (gate da onda G):** colar um screenshot no chat e perguntar sobre ele → resposta correta baseada na imagem (modelo multimodal). Evidência na §8.
- [ ] Gate completo allGreen.

### Verificação automática
```bash
pnpm gate @plataforma/estaleiro
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
