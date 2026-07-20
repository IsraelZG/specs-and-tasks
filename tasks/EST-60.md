---
id: EST-60
title: "Onda C: Tools de disco no Chat (via FsPort) + workspace root por conversa"
status: ready
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [EST-59]
blocks: [EST-61]
capacity_target: sonnet
ui: true
---

# EST-60 · Onda C: Tools de disco no Chat

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-60`.

## 1. Objetivo
Implementar a RFC-019 §2 (linha FS) + §4.3: expor no modo agente do Chat as tools internas de
disco — `read_file`, `write_file`, `list_directory`, `regex_search` — **mediadas pelo FsPort
existente** (cwd-lock, allowlist: invariante do host, RFC-018 A2). Cada conversa ganha um
**workspace root** escolhido pelo usuário (default: nenhum → tools de disco desabilitadas).
HITL para writes fora de `src/**` do workspace.

## 2. Contexto RAG
- [RFC-019 §2 e §4](../docs/rfcs/rfc-019-chat-agentico.md) — mapa de reuso FS, regra do workspace/CWD.
- `apps/estaleiro/core/src/ports/fs.ts` — a porta mediada que TODAS as tools usam. **VERIFICADO no endurecimento (2026-07-19):** `makeFsPort({cwd, allowlist?})` (linha 16) hoje expõe só `readFile`/`writeFile` (linhas 21-35), ambos com validação `isWithin(abs, allowlist)` (linha 12-14). **`list_directory` e `regex_search` exigem AMPLIAR a porta** (novo método `listDir(plugin, path)` em fs.ts com a MESMA validação isWithin, + contrato em `@plataforma/estaleiro-contracts::FsPort`) — a busca regex itera `listDir`+`readFile` em JS puro (sem spawn de rg no v1). Mudança de contrato compartilhado: atualizar `estaleiro-contracts` na mesma task (é o padrão da EST-34).
- `packages/plugin-fs-tools/src/index.ts` (`makeTools`) — readFile/writeFile já existem como AI-SDK tools; esta task ADICIONA `list_directory` e `regex_search` no mesmo pacote (durável) e liga tudo ao registry do chat (EST-59).
- `apps/estaleiro/core/src/chat-agent-service.ts` (da EST-59) — onde o registry é composto.

## 3. Escopo de Arquivos (outline)
- **[UPDATE]** `packages/plugin-fs-tools/src/index.ts` — tools novas `listDirectory` e `regexSearch` (mesmo padrão mediado das existentes; regex_search usa leitura via FsPort, sem spawn de rg externo no v1).
- **[UPDATE]** `apps/estaleiro/core/src/chat-agent-service.ts` — injeta fs-tools quando a conversa tem workspace root; monta FsPort com cwd = workspace.
- **[UPDATE]** `conversation-store.ts`/rotas (EST-58) — campo `workspace_root` na conversa.
- **[UPDATE]** `ChatView.tsx` — seletor de diretório de trabalho (input de path + validação via rota), chip de tool com preview de diff em write_file.

## 4. Estratégia de Testes
- Unit: tools novas no plugin-fs-tools (path traversal negado, regex em árvore pequena de fixture).
- **E2E (obrigatório):** definir workspace → "leia o arquivo X e resuma" (mock LLM com tool-call scripted) → conteúdo real lido; "crie Y" → arquivo aparece no disco do sandbox E2E; write fora de src/** → card HITL.
- **Reuso headless (INVIOLÁVEL):** as tools novas passam no mesmo harness-stub de integração que readFile/writeFile já passam (workflow-runtime.integration.test.ts como referência).

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO acessar `node:fs`/`node:child_process` direto em nenhuma tool — só via FsPort (INVIOLÁVEL, RFC-018 A2).
> - NÃO permitir workspace root fora do disco local do usuário sem validação de existência.
> - NÃO implementar transações/lock multi-arquivo do doc externo no v1 (write é 1 arquivo por tool-call; batch fica para quando houver caso real).

## 7. Definition of Done
- [ ] **Demo executável (gate da onda C):** "leia o arquivo X e resuma" e "crie o arquivo Y com Z" funcionando no workspace escolhido, write visível no disco. Evidência na §8.
- [ ] Tentativa de path fora do workspace → negada (teste + demo).
- [ ] Gate completo allGreen.

### Verificação automática
```bash
pnpm gate @plataforma/estaleiro
pnpm --filter @plataforma/plugin-fs-tools build && pnpm --filter @plataforma/plugin-fs-tools test && pnpm --filter @plataforma/plugin-fs-tools lint
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
- **[2026-07-20T10:30]** - *system* - `[Auto-promovida]`: dep EST-59 concluída
