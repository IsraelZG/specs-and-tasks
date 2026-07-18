---
id: EST-49a
title: "P0.4a Catálogo de modelos e capacidades de esforço"
status: ready
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-48b"]
blocks: ["EST-49b"]
capacity_target: haiku
---

# EST-49a · P0.4a Catálogo de modelos e capacidades de esforço

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-49a`.
- **Regra externa:** assinaturas e parâmetros devem vir da documentação primária do endpoint e da
  versão instalada do AI SDK; nunca inferir compatibilidade pelo nome “OpenAI-compatible”.
- **Runtime:** Node.js v20+ · pnpm · Vitest.

## 1. Objetivo
Expor ao Chat um catálogo redigido de modelos disponíveis no perfil ativo e, para cada modelo,
informar somente opções de esforço realmente suportadas. O backend normaliza diferenças entre
providers; ausência de suporte resulta em lista vazia, não em parâmetro inventado.

## 2. Contexto RAG
- Perfis persistidos e `SecretStore` de [EST-48b](file:///c:/Dev2026/Docs/tasks/EST-48b.md).
- [packages/plugin-providers/src/registry.ts](file:///C:/Dev2026/superapp/packages/plugin-providers/src/registry.ts), [factory.ts](file:///C:/Dev2026/superapp/packages/plugin-providers/src/factory.ts).
- Serviço de chat de [EST-46.md](file:///c:/Dev2026/Docs/tasks/EST-46.md) / [EST-47.md](file:///c:/Dev2026/Docs/tasks/EST-47.md).
- Documentação oficial de `GET /v1/models` e do parâmetro de esforço para cada provider alvo.
- Context7/source da versão instalada de `ai` e `@ai-sdk/openai` (`node_modules/@ai-sdk/openai/dist/index.d.ts`).

## 3. Escopo de Arquivos

### 3.1 `packages/plugin-providers/src/` — catálogo e capabilities
- **[CREATE]** `packages/plugin-providers/src/catalog.ts`
  - Define a interface `ModelDescriptor` e as funções do catálogo:
  ```typescript
  export interface ModelDescriptor {
    id: string;            // Formato: "provider-name/model-id" (ex: "deepseek/deepseek-chat")
    name: string;          // Nome de exibição (ex: "deepseek-chat")
    provider: string;      // Nome do provider (ex: "deepseek")
    effortOptions: ("low" | "medium" | "high")[]; // Opções de esforço normalizadas
  }

  /**
   * Retorna as opções de esforço normalizadas para um modelo específico.
   * OpenAI o1, o3-mini (incluindo variações datadas) possuem ["low", "medium", "high"].
   * Demais modelos retornam [] (não suportado).
   */
  export function getModelEffortOptions(modelId: string): ("low" | "medium" | "high")[];

  /**
   * Obtém a lista de modelos do endpoint do perfil ativo via HTTP GET para `/v1/models`.
   * Normaliza os retornos para objetos ModelDescriptor, omitindo chaves de API e segredos.
   * Se a chamada falhar (404/501/timeout/network), degrada graciosamente para uma lista estática
   * de modelos conhecidos do provider correspondente, em vez de estourar erro bloqueante.
   */
  export function listActiveProfileModels(
    baseURL: string,
    apiKey: string,
    providerName: string,
  ): Promise<ModelDescriptor[]>;
  ```
- **[UPDATE]** `packages/plugin-providers/src/index.ts`
  - Exporta `ModelDescriptor`, `getModelEffortOptions` e `listActiveProfileModels` de `./catalog.js`.

### 3.2 `apps/estaleiro/core/src/` — API Host e Geração
- **[UPDATE]** `apps/estaleiro/core/src/chat-service.ts`
  - Atualiza o contrato `ChatRequest` para aceitar um parâmetro de esforço opcional normalizado:
  ```typescript
  export interface ChatRequest {
    messages: ChatMessage[];
    modelId: string;
    effort?: "low" | "medium" | "high"; // Adicionado para EST-49a
    timeoutMs?: number;
  }
  ```
  - Valida se `request.effort` é aceito pelo modelo invocando `getModelEffortOptions(request.modelId)`. Se não for suportado, rejeita com erro `code: "INVALID_REQUEST"`.
  - Se for suportado, configura `reasoningEffort` no chat options do `@ai-sdk/openai`:
  ```typescript
  const chatOptions: Record<string, unknown> = {};
  if (request.effort) {
    chatOptions.reasoningEffort = request.effort;
  }
  const model = createOpenAI({
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
  }).chat(mId, chatOptions);
  ```
- **[UPDATE]** `apps/estaleiro/core/src/bootstrap.ts`
  - Adiciona o endpoint `GET /api/models` no router HTTP (`handleApiRoutes`).
  - Lógica do endpoint:
    1. Busca o perfil ativo via `profileStore.getActive()`.
    2. Se houver perfil ativo, lê o segredo via `secretStore.get("profile:<id>:apikey")`.
    3. Chama `listActiveProfileModels(activeProfile.baseUrl, apiKey, activeProfile.name)`.
    4. Responde `200` com a lista de `ModelDescriptor[]`.
    5. Se não houver perfil ativo, retorna `200` com lista vazia `[]` ou modelos padrão associados às chaves configuradas em `process.env`.
    6. Trata erros garantindo que falhas de rede/401/404 da API upstream não vazem chaves ou corpos crus (sanitiza strings que contenham a chave).

### 3.3 Testes
- **[CREATE]** `packages/plugin-providers/tests/catalog.test.ts`
  - Testa `getModelEffortOptions` com modelos suportados (ex: `openai/o3-mini`, `o1`) e não suportados.
  - Testa `listActiveProfileModels` mockando chamadas HTTP `/v1/models` para:
    - Retorno de sucesso (200) com lista válida de modelos OpenAI/DeepSeek.
    - Queda graciosa para catálogo estático local quando o endpoint retorna 404/501.
    - Sanitização de chaves de API nas mensagens de erro em caso de falha de conexão ou 401.
- **[UPDATE]** `apps/estaleiro/core/tests/chat-service.test.ts`
  - Adiciona testes para validar o payload com `effort` passando com sucesso no chat options, e falhando ao enviar para modelo incompatível.
- **[CREATE]** `apps/estaleiro/core/tests/models-route.test.ts`
  - Testa a rota `GET /api/models` sob perfil ativo (sucesso), sem perfil ativo, e quando o SecretStore lança exceções.

## 4. Estratégia de Testes
- **Framework:** `vitest` orquestrado pelo `turborepo`.
- **Casos de Teste Verificáveis:**
  1. `getModelEffortOptions` retorna `["low", "medium", "high"]` para `openai/o3-mini` e `openai/o1`.
  2. `getModelEffortOptions` retorna `[]` para `deepseek/deepseek-chat` e `openai/gpt-4o`.
  3. `listActiveProfileModels` retorna modelos dinâmicos do JSON retornado pelo upstream mockado de `/v1/models`.
  4. `listActiveProfileModels` com upstream simulando erro 404 ou timeout retorna fallbacks estáticos para o provider prefix:
     - `deepseek` -> `["deepseek-chat", "deepseek-reasoner"]`
     - `omniroute` -> `["omnimodel-chat", "omnimodel-reasoner"]`
  5. `GET /api/models` sem perfil ativo retorna `[]` ou modelos associados aos env-var fallbacks.
  6. `GET /api/models` sob perfil ativo retorna os modelos resolvidos sem expor chaves de API em nenhuma propriedade.
  7. O chat-service lança erro com código `INVALID_REQUEST` ao receber `effort` para modelo não-reasoning.
  8. O chat-service configura o wire-field `reasoningEffort` corretamente na inicialização de `@ai-sdk/openai`.

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO assumir que todo endpoint OpenAI-compatible implementa `/v1/models`.
> - NÃO mostrar `low/medium/high` se o provider não documentar suporte.
> - NÃO hardcodar modelos DeepSeek no frontend.
> - NÃO adicionar cache antes de existir necessidade medida.
> - NÃO vazar a apiKey em logs, corpos de erro ou mensagens de exceção.

1. Implementar o módulo `catalog.ts` no `@plataforma/plugin-providers` com a lista estática e a chamada de API.
2. Atualizar o chat-service with a validação estrita de capacidades de esforço.
3. Integrar a rota `GET /api/models` em `bootstrap.ts` associada ao `profileStore` e `secretStore`.
4. Rodar a bateria de testes unitários e de integração locais.

## 6. Feedback de Especificação
- **Decisão fechada no endurecimento (JIT):** Comportamento quando `/v1/models` não existe no provider:
  O backend do catálogo degradará graciosamente usando uma lista de modelos estáticos padrão conhecidos para o respectivo provider (ex: `deepseek-chat` e `deepseek-reasoner` para `deepseek`), evitando erros no carregamento da UI.
- **Normalização de Esforço:** Os valores aceitos são normalizados de acordo com as especificações do AI SDK / OpenAI (`"low" | "medium" | "high"`). Modelos sem suporte a esforço expõem uma lista vazia `[]`.

## 7. Definition of Done
- [ ] Rota `GET /api/models` lista modelos sem vazar a apiKey.
- [ ] Cada modelo expõe suas opções de esforço reais; lista vazia se não suportado.
- [ ] Validação no Chat rejeita opções de esforço incompatíveis com erro `INVALID_REQUEST`.
- [ ] Testes unitários cobrem degradação (de API falhando para fallback estático) e sanitização de erro.

### Verificação automática (Gate de Evidência)
O Worker deve colar a saída literal dos comandos abaixo na Seção 8 (Handover):
```bash
pnpm --filter @plataforma/plugin-providers build
pnpm --filter @plataforma/plugin-providers test
pnpm --filter @plataforma/plugin-providers lint
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
pnpm --filter @plataforma/estaleiro test:integration
```
Todos devem retornar Exit Code 0.

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-16T13:25]** - *gpt-5* - `[Triado]`: triagem P0.4a: catálogo/capacidades exige endurecimento JIT com docs oficiais
- **[2026-07-18T10:57]** - *gemini* - `[Reconciliado]`: status restaurado de draft:hardened para draft:pending_decision (drift corrigido)
- **[2026-07-18T10:58]** - *gemini* - `[Decidido]`: resolvendo decisao sobre catalogo
- **[2026-07-18T10:58]** - *system* - `[Auto-promovida]`: deps todas done
