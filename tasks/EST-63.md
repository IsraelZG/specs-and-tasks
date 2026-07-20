---
id: EST-63
title: "Onda F: Multimodal (content-parts imagem) + browser via @playwright/mcp"
status: draft:hardened
complexity: 6
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [EST-62]
blocks: [EST-64]
capacity_target: opus
ui: true
---

# EST-63 · Onda F: Multimodal + Browser (auditoria visual)

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-63`.

## 1. Objetivo
Implementar a RFC-019 §3.7 + §3.8 (fundação): `ChatMessage.content` evolui de `string` para
`string | ContentPart[]` (`{type:"text"}|{type:"image", data: base64, mimeType}`), espelhando os
content-parts do AI SDK — e o browser entra como **server MCP de mercado** (`@playwright/mcp`,
Microsoft) conectado pelo client da EST-59, SEM plugin próprio. Fecha o loop visual do doc externo:
navegar → screenshot → a imagem volta como content-part para o modelo multimodal cruzar visão com
código.

**Capacidade OPUS (M5):** integrativa — mudança de schema de mensagem atravessa core (chat-service,
conversation-store), SDK (conversão de content-parts) e UI (renderização de imagem) ao mesmo tempo;
o browser-MCP depende do multimodal para o screenshot ter serventia.

## 2. Contexto RAG
- [RFC-019 §3.7 e §3.8](../docs/rfcs/rfc-019-chat-agentico.md).
- `apps/estaleiro/core/src/chat-service.ts` + `chat-agent-service.ts` (EST-59) — conversão ChatMessage→AI SDK messages (content-parts é 1:1 com o formato do `ai` v5/v7 — verificar shape exato na fonte instalada no endurecimento).
- `conversation-store.ts` (EST-58) — `content` já é JSON; NENHUMA migração de schema (validar).
- `packages/plugin-mcp` (EST-59) — o client que conecta `@playwright/mcp`.
- Perfil ativo precisa ser modelo com visão (deepseek-chat NÃO tem visão) — a demo usa um perfil OpenRouter/afim com modelo multimodal; a task NÃO hardcoda modelo (usa o seletor do EST-49b).

### Referências VERIFICADAS na fonte (endurecimento 2026-07-19)
- **Vendor clonado:** `docs/_vendor/playwright-mcp/` (repo oficial Microsoft). Tools confirmadas no
  README (linhas ~857-1066): `browser_navigate` (:973), `browser_take_screenshot` (:1064 — params
  `element?`, `target?`, `type` png default), `browser_snapshot` (:1052 — a11y tree, é o que se usa
  para AÇÕES; a descrição oficial da screenshot avisa "You can't perform actions based on the
  screenshot, use browser_snapshot"), `browser_click` (:857), `browser_console_messages` (:878),
  `browser_evaluate` (:913), `browser_fill_form` (:934), `browser_network_requests` (:1001).
  O fluxo "auditoria visual" da RFC = navigate → console_messages + take_screenshot + snapshot.
- **Formato do retorno da screenshot:** resultado MCP com content-part de imagem (base64) — o
  worker confirma o shape exato em `docs/_vendor/playwright-mcp/src/` (grep `image`/`base64` nos
  handlers) e mapeia para o content-part `{type:"image"}` nosso. Citar arquivo:linha na §8.
- **Content-parts no ai v7 (verificado em node_modules):** `ImagePart`, `FilePart`, `TextPart`,
  `UserContent` são exportados pelo pacote `ai` (re-export do provider-utils) — o `ContentPart`
  nosso mapeia 1:1 para esses tipos na conversão chat→SDK.
- Comando do server: `npx -y @playwright/mcp` (README do vendor; validar flag `--headless` para o
  modo default do Estaleiro).

## 3. Escopo de Arquivos (outline)
- **[UPDATE]** `apps/estaleiro/core/src/chat-service.ts` / `chat-agent-service.ts` / tipo `ChatMessage` — content-parts + conversão AI SDK; tool-results contendo imagem viram content-part image na mensagem tool.
- **[UPDATE]** `ChatView.tsx` — renderizar `{type:"image"}` como `<img>` (max-height, clique amplia); transcrição continua funcionando com content string legado.
- **[UPDATE]** Config MCP (EST-59) — `@playwright/mcp` como server pré-cadastrado sugerido (1 clique para habilitar).
- **[UPDATE]** testes das camadas afetadas.

## 4. Estratégia de Testes
- Unit: round-trip content string↔parts no store; conversão para AI SDK preserva imagem.
- Integração: mensagem com image-part atravessa chat-service sem corromper base64.
- **E2E (obrigatório):** tool-result mockado com screenshot base64 → imagem renderiza na transcrição.
- **Demo com browser REAL (gate da onda, manual):** ver §7.
- **Reuso headless (INVIOLÁVEL):** registry com browser-tools do @playwright/mcp injetável no `createAgentRuntime` — é o que dará ao worker orquestrado a auditoria visual pós-edição (regra 3c aplicada por agente).

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO criar plugin-browser próprio (é MCP de mercado — RFC-019 §3.7).
> - NÃO quebrar compat com mensagens string legadas já persistidas (EST-58).
> - NÃO armazenar base64 gigante inline no SQLite sem limite — screenshots >2MB são reduzidos (resize) antes de persistir.

## 7. Definition of Done
- [ ] **Demo executável (gate da onda F):** "abra localhost:8899 e me descreva a tela" → screenshot renderizado no chat E o modelo multimodal o descreve corretamente (loop visual fechado). Evidência na §8.
- [ ] Conversas antigas (content string) continuam renderizando.
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
