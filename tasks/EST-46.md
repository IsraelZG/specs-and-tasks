---
id: EST-46
title: "P0.1 Chat v0: conversa DeepSeek em página principal"
status: in_progress
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-43b", "T-DS-03"]
blocks: ["EST-47"]
capacity_target: sonnet
ui: true
---

# EST-46 · P0.1 Chat v0: conversa DeepSeek em página principal

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-46`.
- **Runtime:** Node.js 22+ · React 19 · Vitest/JSDOM · Playwright/Chromium.
- **Prioridade:** primeiro entregável de valor do Estaleiro.

## 1. Objetivo
Entregar uma página de chat utilizável, semelhante à interação básica de ChatGPT/Gemini: histórico
visível da conversa atual, campo de texto e envio de prompt. Nesta fatia o provider/modelo de
produção é fixo em `deepseek/deepseek-chat`, usando o endpoint já registrado pelo EST-40 e a chave
`DEEPSEEK_API_KEY` somente no servidor.

O histórico desta task é apenas o transcript da sessão aberta, em memória. Persistência entre
reloads, contexto adicional, anexos, seletor de modelo/esforço e tools ficam fora do escopo.

## 2. Contexto RAG
- `docs/especificacao-estaleiro.md` §2 — Chat como central universal de comando, ancorado ao layout.
- `tasks/EST-40.md` — registry/factory do `plugin-providers` com `PROVIDERS.deepseek` +
  `createProviderConfig` *(done, contrato vivo).*
- `tasks/EST-41.md` — composition root e rotas `/api/providers` *(done).*
- `tasks/EST-43a.md` — fake server `node:http` OpenAI-compatible, gate remoto *(done).*
- `tasks/EST-43b.md` — acoplamento UI ↔ probe redigido, `ConnectorHealthCard` *(done).*
- `apps/estaleiro/core/src/provider-probe.ts:1-76` — `createOpenAI(...).chat(modelId)` +
  `generateText({ model, prompt })` com abort signal; error codes `MISSING_API_KEY`, `TIMEOUT`,
  `UPSTREAM_ERROR`, `PROMPT_TOO_LONG` *(EST-41, done, contrato vivo — NÃO transformar probe em
  API de chat).*
- `apps/estaleiro/core/src/bootstrap.ts:256-298` — rotas `GET /api/providers` e
  `POST /api/providers/probe`; pattern de validação `readJson` → destructure → validate → call →
  map errors (400/502/504/500) *(EST-41, done).*
- `apps/estaleiro/core/src/index.ts` — barrel público; re-exporta `probeProvider`,
  `createBootstrap`, ports, contracts *(EST-41, done).*
- `apps/estaleiro/core/package.json:27,34` — `@ai-sdk/openai@^2.0.0` e `ai@^5.0.0`
  (dependências runtime do core; `generateText` aceita `messages: CoreMessage[]`).
- `packages/plugin-providers/src/registry.ts:5-9` — `ProviderConfig { baseURL, apiKeyEnv, kind }`
  *(EST-40, done).*
- `packages/plugin-providers/src/factory.ts:9-34` — `createProviderConfig(modelId, opts?)` com
  validação construction-time *(EST-40, done).*
- `packages/plugin-providers/src/index.ts` — barrel re-exporta `createProviderConfig`,
  `ProviderConfig`, `ProviderConfigOptions` *(EST-40, done).*
- `apps/estaleiro/ui/src/App.tsx:70-97` — factory switch de tabs FlexLayout; cada case retorna
  `h(Componente, props)` *(shell existente).*
- `apps/estaleiro/ui/src/shell/default-layout.ts:5-19,30-73` — `loadLayout()` lê localStorage,
  fallback `defaultLayout()`; `defaultLayout()` retorna `IJsonModel` com bordas e layout row/tabset
  *(shell existente).*
- `packages/design-system/src/components/Message/Message.tsx:15-28` — `MessageProps { author:
  Author, children, timestamp?, status?, density?, ... }`; `Author = "sent" | "received" | "ai" |
  "system"` *(T-DS-03, done, componente canônico a reutilizar).*
- `packages/design-system/src/components/Textarea/Textarea.tsx:4-6` — `TextareaProps extends
  React.TextareaHTMLAttributes<HTMLTextAreaElement> { invalid?: boolean }` *(T-DS-03, done).*
- `packages/design-system/src/components/Button/Button.tsx:71-76` — `ButtonProps extends
  ButtonHTMLAttributes, VariantProps { loading?, fullWidth? }` *(T-DS-03, done).*
- `apps/estaleiro/ui/src/views/config/ProviderClient.http.ts:32-58` — `createHttpProviderClient`
  pattern: factory function que retorna `{ listProviders, probe }`, usa `fetch` com
  `Content-Type: application/json`, trata HTTP não-ok propagando `error.message` *(EST-42, done).*
- `apps/estaleiro/e2e/config.spec.ts:5-56` — pattern E2E: `page.route("**/api/...", ...)` mocka
  endpoint, `page.getByText(...).click()`, `expect(page.getByText(...)).toBeVisible()`,
  `page.getByTestId(...)` *(EST-42, done).*
- `apps/estaleiro/core/tests/provider-probe.test.ts:1-50` — pattern de teste unitário: mocka
  `@ai-sdk/openai` e `ai` via `vi.mock`, stuba env `vi.stubEnv`, usa `ProviderConfig` falso
  *(EST-43a, done).*

## 3. Escopo de Arquivos — contratos exatos

### 3.1 chat-service.ts — CREATE

**Caminho:** `apps/estaleiro/core/src/chat-service.ts`

**Contratos públicos (assinaturas exatas):**

```typescript
// ══ Tipos de domínio (exportados) ══

/** Mensagem de chat — subconjunto de AI SDK v5 CoreMessage. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
// Fontes: spec §1 "contrato de mensagens role: user | assistant" +
//   ai@^5.0.0 CoreMessage role union (apps/estaleiro/core/package.json:34)

/** Requisição de um turno de chat com histórico. */
export interface ChatRequest {
  messages: ChatMessage[];
  modelId: string;
  timeoutMs?: number;
}
// Fontes: spec §1 "histórico visível da conversa atual" (messages[]) +
//   spec §1 "provider fixo deepseek/deepseek-chat" (modelId default no caller, não aqui)

/** Resposta de um turno de chat. */
export interface ChatResponse {
  message: ChatMessage;
  latencyMs: number;
}
// Fontes: ProviderProbeResult.latencyMs (provider-probe.ts:15, EST-41 done) +
//   role="assistant" inerente ao retorno de generateText().text

// ══ Dependências injetáveis (seam de teste) ══

export interface ChatServiceDeps {
  createProviderConfig: typeof import("@plataforma/plugin-providers").createProviderConfig;
}
// Fontes: factory.ts:9-34 (EST-40, done) — createProviderConfig(modelId) → ProviderConfig
//   Produção passa a factory real; teste passa stub que aponta p/ fake server.
//   O serviço NUNCA lê process.env diretamente — delega ao createProviderConfig.

// ══ Factory do serviço ══

export function createChatService(deps: ChatServiceDeps): {
  send(request: ChatRequest): Promise<ChatResponse>;
}
// Fontes: padrão de factory do core (bootstrap.ts createBootstrap, factory.ts createAgentRuntime)
//   usa createOpenAI(...).chat(modelId) ← provider-probe.ts:43-46 (EST-41, done)
//   usa generateText({ model, messages }) ← ai@^5.0.0 (core/package.json:34)
```

**Comportamento interno de `send()` (NÃO exportado — detalhe de implementação):**
1. `const config = deps.createProviderConfig(request.modelId)` → `ProviderConfig`.
2. Lê chave: `const apiKey = process.env[config.apiKeyEnv]`; se ausente → throw
   `{ code: "MISSING_API_KEY", message: "${config.apiKeyEnv} ausente" }`.
   *(Padrão: provider-probe.ts:36-41, EST-41 done.)*
3. `const model = createOpenAI({ baseURL: config.baseURL, apiKey }).chat(modelId)`;
   `modelId` extraído de `request.modelId` (parte após `/` ou inteiro se sem `/`).
   *(Padrão: provider-probe.ts:43-46, EST-41 done.)*
4. `generateText({ model, messages: request.messages, ...(timeoutMs ? { abortSignal:
   AbortSignal.timeout(timeoutMs) } : {}) })`.
   *(Padrão: provider-probe.ts:51-58; `messages` (não `prompt`) porque é conversa multi-turn.)*
5. Sucesso → `{ message: { role: "assistant", content: result.text }, latencyMs: Date.now() - start }`.
   *(Padrão: provider-probe.ts:60-65.)*
6. Erro com "abort"/"timeout" → throw `{ code: "TIMEOUT", message: "timeout" }`.
   *(Padrão: provider-probe.ts:68-69.)*
7. Outros erros → throw `{ code: "UPSTREAM_ERROR", message: "erro upstream: ${msg.slice(0, 200)}" }`.
   *(Padrão: provider-probe.ts:71-74 — NUNCA expõe valor da chave ou corpo completo da resposta upstream.)*

> **⛔ NÃO fazer no chat-service:**
> - NÃO usar `prompt` (string única) — use `messages` (array) para suportar histórico multi-turn.
> - NÃO ler `process.env` fora do `createProviderConfig` exceto para `config.apiKeyEnv` — a factory
>   do `plugin-providers` já valida chave ausente.
> - NÃO exportar a implementação interna de `send` — só a factory e os tipos públicos.

### 3.2 bootstrap.ts — UPDATE

**Caminho:** `apps/estaleiro/core/src/bootstrap.ts`

**Adicionar rota `POST /api/chat` no `handleApiRequest`** (após linha 298, bloco de
`/api/providers/probe`, antes do 404 final):

```typescript
// POST /api/chat
if (method === "POST" && path === "/api/chat") {
  readJson(req).then((body) => {
    const { messages, modelId } = body as { messages: unknown; modelId?: string };
    if (!Array.isArray(messages) || messages.length === 0) {
      json(res, 400, { error: "messages deve ser array não-vazio", code: "INVALID_REQUEST" });
      return;
    }
    const DEFAULT_MODEL = "deepseek/deepseek-chat";
    const svc = createChatService({ createProviderConfig });
    svc.send({ messages: messages as never, modelId: modelId ?? DEFAULT_MODEL })
      .then((result) => { json(res, 200, result); })
      .catch((err: unknown) => {
        const e = err as { code?: string; message: string };
        if (e.code === "MISSING_API_KEY") {
          json(res, 400, { error: e.message, code: e.code });
        } else if (e.code === "TIMEOUT") {
          json(res, 504, { error: e.message, code: e.code });
        } else if (e.code === "UPSTREAM_ERROR") {
          json(res, 502, { error: e.message, code: e.code });
        } else {
          json(res, 500, { error: e.message, code: "INTERNAL" });
        }
      });
  }).catch(() => { json(res, 400, { error: "invalid JSON", code: "INVALID_JSON" }); });
  return;
}
```
*(Padrão de validação e error mapping: bootstrap.ts:269-298, POST /api/providers/probe.)*

**Novo import necessário no topo:**
```typescript
import { createChatService } from "./chat-service.js";
import { createProviderConfig } from "@plataforma/plugin-providers";
```

> **⛔ NÃO fazer:**
> - NÃO expor `modelId` vindo do browser sem default — sempre usar `deepseek/deepseek-chat` como
>   fallback.
> - NÃO serializar `request` inteiro na resposta de erro — o `messages` pode conter dados sensíveis.

### 3.3 index.ts — UPDATE

**Caminho:** `apps/estaleiro/core/src/index.ts`

Adicionar após a linha 17 (export de `probeProvider`):
```typescript
export { createChatService } from "./chat-service.js";
export type { ChatMessage, ChatRequest, ChatResponse, ChatServiceDeps } from "./chat-service.js";
```

### 3.4 chat-service.test.ts — CREATE

**Caminho:** `apps/estaleiro/core/tests/chat-service.test.ts`

Usar o mesmo padrão de mock de `provider-probe.test.ts`:
- `vi.mock("@ai-sdk/openai", ...)` + `vi.mock("ai", ...)`
- `vi.stubEnv("DEEPSEEK_API_KEY", "sk-test-deepseek")` no `beforeEach`
- `vi.unstubAllEnvs()` + `vi.restoreAllMocks()` no `afterEach`

### 3.5 ChatClient.http.ts — CREATE

**Caminho:** `apps/estaleiro/ui/src/views/chat/ChatClient.http.ts`

**Contrato:**
```typescript
export interface HttpChatClientOptions {
  baseUrl: string;
}

export interface HttpChatClient {
  send(messages: ChatMessage[]): Promise<ChatResponse>;
}

export function createHttpChatClient(opts: HttpChatClientOptions): HttpChatClient;
```
*(Padrão: ProviderClient.http.ts (EST-42, done) — factory function, fetch POST, Content-Type json,
HTTP não-ok propaga error.message.)*

O `send()` faz `fetch("${opts.baseUrl}/api/chat", { method: "POST", headers: { "Content-Type":
"application/json" }, body: JSON.stringify({ messages }) })`. Em HTTP não-ok, lê o body de erro e
lança `new Error(body.error ?? "erro desconhecido")`.

> **⛔ NÃO fazer:**
> - NÃO enviar `modelId` do browser (o servidor aplica o default fixo `deepseek/deepseek-chat`).
> - NÃO expor headers/status upstream ao chamador da UI.

### 3.6 ChatView.tsx — CREATE

**Caminho:** `apps/estaleiro/ui/src/views/chat/ChatView.tsx`

**Props esperadas:**
```typescript
export interface ChatViewProps {
  client: HttpChatClient;
}
```

**Estado interno (useState):**
- `messages: ChatMessage[]` — transcript da sessão atual
- `input: string` — texto do composer
- `loading: boolean` — chamada em andamento
- `error: string | null` — última falha (null em sucesso)

**Comportamento:**

| Ação | Resultado |
|---|---|
| Digitar texto + clicar Enviar (ou Enter sem Shift) | Adiciona `{ role: "user", content: input }` ao transcript, limpa input, `loading=true`, chama `client.send(messages)`. Resposta → adiciona mensagem do assistente. Erro → `error = mensagem`. `loading=false`. |
| Input vazio + Enviar | Botão desabilitado; Enter ignorado. |
| Shift+Enter no textarea | Insere quebra de linha; NÃO envia. |
| Enter (sem Shift) no textarea | Envia (preventDefault). |
| Clique em "Tentar novamente" (após erro) | Reenvia a última requisição (última mensagem user ainda está no array). |

**Componentes DS reutilizados:**
- `Message author="user"` — mensagem do operador *(Message.tsx:15 Author type, T-DS-03 done).*
- `Message author="ai"` — resposta do assistente *(idem).*
- `Textarea` — campo de entrada; `onKeyDown` para Enter vs Shift+Enter *(Textarea.tsx:4, T-DS-03 done).*
- `Button loading={loading}` — botão de envio *(Button.tsx:74, T-DS-03 done).*

> **⛔ NÃO fazer:**
> - NÃO criar engine de mensagens nova — usar `Message` do DS.
> - NÃO renderizar Markdown nesta v0 (fora de escopo; §4).
> - NÃO adicionar `author="system"` ou status customizado ao `Message` — só `"user"` e `"ai"`.

### 3.7 ChatView.test.tsx — CREATE

**Caminho:** `apps/estaleiro/ui/src/views/chat/ChatView.test.tsx`

**Framework:** Vitest + JSDOM + @testing-library/react *(ambiente: `apps/estaleiro/ui/package.json`
devDependencies: vitest, jsdom, @testing-library/react, @testing-library/jest-dom).*

### 3.8 App.tsx — UPDATE

**Caminho:** `apps/estaleiro/ui/src/App.tsx`

Adicionar ao `factory` switch (após `case "terminal":`, linha 91):
```typescript
case "chat":
  return h(ChatView, { client: chatClient });
```
*(Padrão: App.tsx:73-94 factory switch — cada case retorna `h(Componente, props)`.)*

**Novos imports:**
```typescript
import { ChatView } from "./views/chat/ChatView.js";
import { createHttpChatClient } from "./views/chat/ChatClient.http.js";
```

**Novo client (antes do `const [selectedTaskId, ...]`, após `providerClient`):**
```typescript
const chatClient = useMemo(
  () => createHttpChatClient({
    baseUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:8899",
  }),
  [],
);
```
*(Padrão: App.tsx:54-60 — `createHttpProviderClient` com memo e baseUrl derivado de window.location.)*

> **⛔ NÃO usar `type: unknown` no `readJson`** — o corpo `{ messages }` é validado com checagem
> `Array.isArray(messages)` no bootstrap.

### 3.9 default-layout.ts — UPDATE

**Caminho:** `apps/estaleiro/ui/src/shell/default-layout.ts`

1. **`defaultLayout()`:** Adicionar aba "Chat" como primeira aba do tabset principal:
   ```typescript
   { type: "tab", name: "Chat", component: "chat" },
   ```
   Antes de `{ type: "tab", name: "Board", component: "board" }` (linha 64).

2. **`loadLayout()`:** Após carregar do localStorage, verificar se o layout salvo contém um
   `TabNode` com `component === "chat"`. Se não contiver, injetar a aba "Chat" como primeira aba
   do primeiro tabset do layout principal (`model.layout.children[0]`).

   Algoritmo de migração determinística:
   - Percorrer todos os nós do layout salvo (recursivamente em `children`).
   - Se nenhum nó `type === "tab" && component === "chat"` for encontrado, injetar
     `{ type: "tab", name: "Chat", component: "chat" }` no início do array `children` do primeiro
     `type === "tabset"` encontrado no layout root.
   - Se não houver tabset no layout salvo (corrompido), usar `defaultLayout()` integralmente.
   *(Fonte: spec §3 "layouts salvos sem chat são migrados deterministicamente".)*

### 3.10 index.css — UPDATE (mínimo)

**Caminho:** `apps/estaleiro/ui/src/index.css`

Somente para composição não coberta por tokens do DS (ex.: altura mínima do container do chat,
gap entre mensagens se `Message` não prover). Zero cores, fontes ou espaçamentos literais onde
existir token semântico correspondente.

### 3.11 chat.spec.ts — CREATE

**Caminho:** `apps/estaleiro/e2e/chat.spec.ts`

**Framework:** Playwright/Chromium *(via `apps/estaleiro/package.json` script `test:e2e`).*

Usar `page.route("**/api/chat", ...)` para mockar o endpoint no E2E determinístico.
*(Padrão: e2e/config.spec.ts:5-56, EST-42 done — `page.route` + `route.fulfill`.)*

### 3.12 Fixtures de teste — UPDATE (mínimo)

Apenas para injetar upstream fake no teste de integração (ver §4 caso 5). Nenhum arquivo de
config de build ou runtime alterado.

## 4. Estratégia de Testes — casos enumerados

### Core unitário (`chat-service.test.ts`) — Vitest, Node puro, sem rede

> **Ambiente:** `apps/estaleiro/core/tests/chat-service.test.ts`. Mocka `@ai-sdk/openai` e `ai`
> via `vi.mock` (padrão de `provider-probe.test.ts:11-17`). Stub de `createProviderConfig` que
> retorna `{ baseURL, apiKeyEnv, kind }` falso.

1. **Sucesso com mensagem única** — mock de `generateText` retorna `{ text: "Olá!" }`;
   `send({ messages: [{ role: "user", content: "Oi" }], modelId: "deepseek/deepseek-chat" })`
   → `result.message.role === "assistant"`, `result.message.content === "Olá!"`,
   `result.latencyMs >= 0`.
   *(Padrão: provider-probe.test.ts:35-47 "probe com factory mock retorna texto".)*

2. **Histórico multi-turn preservado** — mock de `generateText` captura o array `messages`
   recebido; `send()` com 4 mensagens (2 user + 2 assistant) → `generateText` foi chamado com
   `messages` contendo exatamente as 4 mensagens na ordem.
   *(Fonte: spec §1 "histórico visível da conversa atual".)*

3. **Timeout** — mock de `generateText` rejeita com `{ message: "abort" }` →
   `send()` rejeita com `code: "TIMEOUT"`.
   *(Padrão: provider-probe.ts:68-69 — msg.includes("abort") → TIMEOUT.)*

4. **Erro upstream** — mock de `generateText` rejeita com `Error("upstream explosion")` →
   `send()` rejeita com `code: "UPSTREAM_ERROR"` e mensagem contendo "upstream explosion"
   truncada a 200 chars.
   *(Padrão: provider-probe.ts:71-74.)*

5. **Anti-fake: chave NUNCA aparece em mensagem de erro** — stub de `createProviderConfig`
   retorna config com `apiKeyEnv: "DEEPSEEK_API_KEY"`; `vi.stubEnv("DEEPSEEK_API_KEY",
   "sk-secret-value")`; mock de `generateText` rejeita com `Error("sk-secret-value leaked")`;
   → `send()` rejeita com `code: "UPSTREAM_ERROR"`; assert que `String(e)` NÃO contém
   `"sk-secret-value"`.
   *(Padrão: provider-probe.test.ts + factory.test.ts:61-67 anti-fake JSON.stringify, EST-40 done.)*

6. **Provider não registrado** — stub de `createProviderConfig` lança `Error("provider
   'unknown' não registrado")` → `send()` rejeita propagando o erro do factory.
   *(Padrão: factory.ts:18-20, EST-40 done.)*

### Integração da rota (`tests/integration/`) — Vitest, HTTP real contra host

> **Arquivo:** `apps/estaleiro/tests/integration/chat-route.test.ts`.
> **Padrão:** `provider-routes.test.ts` (EST-41, done): `createBootstrap` + `startServer` +
> `fetch` + `stopServer` + DB cleanup.

7. **POST /api/chat com mensagens válidas** — `fetch("http://127.0.0.1:${port}/api/chat",
   { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] }) })`
   → HTTP 200, body contém `message.role === "assistant"`, `message.content` não-vazio,
   `latencyMs >= 0`.
   *(Padrão: provider-routes.test.ts:33-40, EST-41 done.)*

8. **POST /api/chat sem messages** — body `{}` ou `{ messages: [] }` → HTTP 400,
   `code: "INVALID_REQUEST"`.
   *(Padrão: bootstrap.ts:272-274 validação de body, EST-41 done.)*

9. **POST /api/chat com JSON inválido** — body `"not json"` → HTTP 400,
   `code: "INVALID_JSON"`.
   *(Padrão: bootstrap.ts:296, EST-41 done.)*

10. **POST /api/chat sem DEEPSEEK_API_KEY** — `vi.stubEnv("DEEPSEEK_API_KEY", "")` →
    HTTP 400, `code: "MISSING_API_KEY"`.
    *(Padrão: bootstrap.ts:287, EST-41 done.)*

11. **Anti-fake na rota: resposta de erro NÃO contém chave** — stub env com
    `vi.stubEnv("DEEPSEEK_API_KEY", "sk-top-secret")` (mas sem mock de `generateText` →
    erro real de auth contra o endpoint fake); assert que response body NÃO contém
    `"sk-top-secret"` nem `"DEEPSEEK_API_KEY"` (este último aparece só como nome da env,
    não como valor, mas é aceitável).
    *(Padrão: EST-40 §4 caso 5 anti-fake + EST-43a §4 caso 4.)*

### UI unitário (`ChatView.test.tsx`) — Vitest + JSDOM + @testing-library/react

> **Arquivo:** `apps/estaleiro/ui/src/views/chat/ChatView.test.tsx`.
> **Ambiente:** jsdom (vitest config do pacote ui). Mock de `HttpChatClient` via `vi.fn()`.

12. **Mensagem do usuário aparece imediatamente** — `fireEvent.change(textarea, { target:
    { value: "Olá" } })` + `fireEvent.click(sendButton)` → `expect(screen.getByText("Olá")).toBeDefined()`.
    A mensagem renderiza com `Message author="user"`.

13. **Resposta do assistente aparece após send** — mock de `client.send` resolve com
    `{ message: { role: "assistant", content: "Oi!" }, latencyMs: 100 }`; após envio,
    `waitFor(() => expect(screen.getByText("Oi!")).toBeDefined())`.
    Renderiza com `Message author="ai"`.

14. **Input vazio bloqueia envio** — `fireEvent.click(sendButton)` com textarea vazio →
    `sendButton` está `disabled`; `client.send` NÃO foi chamado.

15. **Enter envia, Shift+Enter quebra linha** — `fireEvent.keyDown(textarea, { key: "Enter",
    shiftKey: false })` → `client.send` chamado, input limpo.
    `fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true })` → `client.send` NÃO
    chamado, textarea contém `"\n"`.

16. **Loading state durante chamada** — mock de `client.send` retorna Promise não resolvida;
    após clique em enviar → botão mostra `loading={true}` (texto ou spinner do `Button` DS).
    Após `waitFor` da resposta → `loading=false`.

17. **Erro mostra mensagem e preserva input** — mock de `client.send` rejeita com
    `Error("timeout")`; após envio → tela mostra texto do erro; input ainda contém o
    texto original (não foi limpo); botão "Tentar novamente" visível.

18. **Anti-fake no DOM** — após resposta de sucesso, `document.body.textContent` NÃO contém
    `sk-`, `apiKey`, `DEEPSEEK_API_KEY`, `token`, `secret`.
    *(Padrão: EST-43b §4 caso 4, ConfigView.test.tsx anti-fake.)*

### E2E Playwright (`chat.spec.ts`) — Playwright/Chromium

> **Arquivo:** `apps/estaleiro/e2e/chat.spec.ts`.
> **Ambiente:** Playwright com `webServer` iniciando o estaleiro standalone (já configurado
> em `apps/estaleiro/package.json` script `pretest:e2e`).

19. **Percurso completo: Chat → digitar → enviar → ver resposta** — `page.route("**/api/chat",
    route => route.fulfill({ status: 200, body: JSON.stringify({ message: { role: "assistant",
    content: "pong" }, latencyMs: 42 }) }))`; navega para `/`, clica na aba "Chat" (primeira
    aba principal), digita "ping" no textarea, clica em enviar → `expect(page.getByText("ping")).toBeVisible()`
    (mensagem user) + `expect(page.getByText("pong")).toBeVisible()` (resposta assistant).
    *(Padrão: e2e/config.spec.ts:23-56, EST-42 done.)*

20. **Chat é a primeira aba no layout default** — `page.goto("/")`; primeira aba visível do
    tabset principal tem texto "Chat".
    *(Fonte: spec §3 + §7 "Chat é a primeira página principal".)*

21. **Anti-fake no browser** — após interação bem-sucedida, `page.locator("body").textContent()`
    NÃO contém `sk-`, `DEEPSEEK_API_KEY`, `API_KEY`, `SECRET`, `authorization`.
    *(Padrão: e2e/config.spec.ts:58-78 "DOM não contém valores sensíveis", EST-42 done.)*

### Gate remoto real

22. **Gate real com DEEPSEEK_API_KEY** — worker inicia o app (`pnpm --filter @plataforma/estaleiro
    start` ou via script standalone), faz `fetch POST /api/chat` com uma mensagem trivial
    (`"Reply with exactly: GATE_OK"`), valida HTTP 200 e `message.content.length > 0`.
    **Sem `DEEPSEEK_API_KEY` → `pause` com blocker descritivo.**
    *(Padrão: EST-43a §5.2 standalone smoke + §7 "Sem credencial → pause".)*

### Fora de escopo (NÃO testar)
- Streaming de tokens (SSE), Markdown rico, sintaxe highlight.
- Persistência de conversa entre reloads (localStorage, DB).
- Anexos, imagens, arquivos.
- Seletor de modelo, controle de esforço/temperatura.
- Agent tools, RAG, contexto externo.
- Multi-sessão, abas de conversa paralelas.
- `author="system"` no `Message`.

## 5. Instruções de Execução

> **NÃO FAZER:**
> - NÃO reutilizar `/api/providers/probe` como endpoint permanente de chat.
> - NÃO enviar `DEEPSEEK_API_KEY` ao browser nem persistir a chave nesta task.
> - NÃO criar seletor, anexos, contexto, RAG, tools ou abstração genérica de conversas.
> - NÃO duplicar `Message`, `Textarea`, `Button` ou a configuração DeepSeek já existente.
> - NÃO usar `prompt` (string) no chat-service — usar `messages: ChatMessage[]`.
> - NÃO exportar implementação interna de `send()` — só a factory e tipos públicos.
> - NÃO mockar `fetch` no teste de integração da rota — usar HTTP real contra o host iniciado
>   pelo bootstrap (padrão `provider-routes.test.ts`).

1. **[TDD]** Criar `chat-service.test.ts` (casos 1–6) e `chat-route.test.ts` (casos 7–11)
   ANTES do serviço e da rota.
2. Implementar `chat-service.ts` com `createChatService` e seam de `createProviderConfig`.
3. Adicionar rota `POST /api/chat` em `bootstrap.ts` com validação e error mapping.
4. Atualizar `index.ts` com exports públicos.
5. Criar `ChatClient.http.ts` (factory de fetch).
6. Criar `ChatView.tsx` e `ChatView.test.tsx` (casos 12–18).
7. Atualizar `App.tsx` (factory switch + chatClient memo) e `default-layout.ts`
   (aba Chat + migração de layouts salvos).
8. Criar `e2e/chat.spec.ts` (casos 19–21).
9. Rodar gate completo (§7) + gate real com credencial (caso 22).

### Pegadinhas conhecidas
- `createOpenAI(...).chat(modelId)` é o contrato vivo usado por EST-43a *(provider-probe.ts:43-46)*;
  verificar a versão instalada (`@ai-sdk/openai@^2.0.0`, `core/package.json:27`) antes de alterar
  a chamada.
- `Message` exige um contêiner de lista/grupo *(Message.tsx comentário "Must be used inside
  MessageList or MessageGroup")*; usar `<div role="log">` ou estrutura semântica local, sem criar
  nova engine.
- A resposta de erro upstream pode conter informação sensível; `chat-service.ts` DEVE truncar
  `msg.slice(0, 200)` e NUNCA ecoar o corpo completo *(padrão: provider-probe.ts:72)*.
- A rota `POST /api/chat` NÃO deve serializar `messages` no body de erro (pode conter dados do
  operador) — só expor `error` e `code`.
- `generateText` do AI SDK v5 aceita tanto `prompt` quanto `messages`; usar `messages` porque é
  conversa multi-turn. O tipo `CoreMessage` do SDK tem `role: "user" | "assistant" | "system" |
  "tool"` — nossa `ChatMessage` usa subconjunto `"user" | "assistant"`.

## 6. Feedback de Especificação

### Derivado (com fonte):
- `ChatMessage.role: "user" | "assistant"` ← spec §1 + AI SDK v5 `CoreMessage` role union
  (`ai@^5.0.0` em `apps/estaleiro/core/package.json:34`).
- `ChatMessage.content: string` ← AI SDK v5 `CoreMessage.content`.
- `ChatRequest.messages: ChatMessage[]` ← spec §1 "histórico visível da conversa atual, em memória".
- `ChatRequest.modelId: string` (default `"deepseek/deepseek-chat"` no caller) ← spec §1
  "provider/modelo fixo em deepseek/deepseek-chat".
- `ChatResponse.latencyMs: number` ← `ProviderProbeResult.latencyMs` (`provider-probe.ts:15`,
  EST-41 done).
- `ChatServiceDeps.createProviderConfig` ← `packages/plugin-providers/src/factory.ts:9-34`
  (EST-40, done).
- `createOpenAI(...).chat(modelId)` pattern ← `provider-probe.ts:43-46` (EST-41, done).
- `generateText({ model, messages })` ← `ai@^5.0.0` (core/package.json:34); `messages`
  (não `prompt`) porque é multi-turn.
- Error codes: `MISSING_API_KEY` (400), `TIMEOUT` (504), `UPSTREAM_ERROR` (502) ←
  `bootstrap.ts:286-294` (EST-41, done).
- Error truncation `msg.slice(0, 200)` ← `provider-probe.ts:72` (EST-41, done).
- `Message author: "user" | "ai"` ← `Message.tsx:15` Author type (T-DS-03, done).
- `Button loading`, `disabled` props ← `Button.tsx:74,97-99` (T-DS-03, done).
- `Textarea` extendendo `TextareaHTMLAttributes` ← `Textarea.tsx:4` (T-DS-03, done).
- Pattern `createHttpXxxClient` factory ← `ProviderClient.http.ts` (EST-42, done).
- Pattern `page.route` Playwright E2E ← `e2e/config.spec.ts:5-56` (EST-42, done).
- Pattern `vi.mock("@ai-sdk/openai")` + `vi.mock("ai")` ← `provider-probe.test.ts:11-17`
  (EST-43a, done).
- Pattern `createBootstrap` + `startServer` + `fetch` + DB cleanup ← `provider-routes.test.ts:7-31`
  (EST-41, done).
- Padrão `default-layout.ts` `IJsonModel` ← `default-layout.ts:5-19,30-73` (shell existente).
- Padrão `App.tsx` factory switch ← `App.tsx:70-97` (shell existente).
- Gatilho `Shift+Enter` para quebra de linha ← comportamento padrão de `<textarea>` em navegadores.
- Gate de Evidência com `lint` obrigatório ← CLAUDE.md Regra 3 (2026-07-06).
- Anti-fake: `document.body.textContent` não contém `sk-`, `apiKey`, `token`, `secret` ←
  EST-43b §4 caso 4 (EST-42, done).

### Decisões fechadas (arquiteto):
- **Endpoint/modelo fixos** somente nesta primeira fatia; a remoção do hardcode ocorre em
  EST-48c *(decidido, spec §6 original).*
- **"Histórico" = transcript visível da sessão atual, em memória** — sem persistência *(decidido,
  spec §6 original).*

### Aberto (escalado p/ arquiteto, NÃO inventado): **nenhum**.

## 7. Definition of Done
- [ ] Chat é a primeira aba principal e aparece em layouts novos (default) e já salvos (migrados).
- [ ] Operador envia texto e vê as mensagens de usuário (`author="user"`) e assistente
  (`author="ai"`) em ordem cronológica.
- [ ] Browser nunca recebe `DEEPSEEK_API_KEY`, header `Authorization`, ou corpo de resposta
  upstream cru.
- [ ] Fake E2E prova o caminho browser → `POST /api/chat` → `createChatService` →
  `generateText` → OpenAI-compatible fake → browser.
- [ ] Gate real prova resposta não vazia do DeepSeek pela instância atual (com `DEEPSEEK_API_KEY`
  configurada; sem chave → `pause` blocker).

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro test:integration
pnpm --filter @plataforma/estaleiro test:e2e
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.
> **Lint é parte do gate** (Regra 3 do CLAUDE.md, desde 2026-07-06).
> **Gate escopado aos pacotes da task** (`--filter @plataforma/estaleiro-core` e
> `--filter @plataforma/estaleiro-ui` + integração/E2E do `@plataforma/estaleiro`). Sem
> `pnpm -r` — só os pacotes afetados.

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-16T13:24]** - *gpt-5* - `[Triado]`: triagem P0.1: primeira entrega vertical, chat DeepSeek com UI e gate real

- **[2026-07-16T13:43]** - *deepseek* - `[Endurecido]`: endureceu spec: contratos TS exatos (ChatMessage/ChatRequest/ChatResponse/ChatServiceDeps com seam createProviderConfig), 22 casos enumerados, anti-fake, gate escopado, zero decisões em aberto → hardened
- **[2026-07-16T13:43]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-16T13:48]** - *deepseek* - `[Iniciado]`: iniciando — P0.1 Chat v0: conversa DeepSeek em página principal
