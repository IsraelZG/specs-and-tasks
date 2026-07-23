---
id: EST-73
title: "Importação incremental do Crush e Diagnóstico de conversas canônicas"
status: ready
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
test_profile: full
dependencies: ["DMM-11", "EST-48b", "EST-49a", "EST-58", "EST-59"]
blocks: []
capacity_target: opus
ui: true
---

# EST-73 · Importação incremental do Crush e Diagnóstico de conversas canônicas

## 0. Ambiente de Execução Obrigatório

- **Repo de controle:** `C:\Dev2026\Docs` — não fazer `git`; lifecycle e Log somente pelo serviço MGTIA.
- **Repo de código:** `C:\Dev2026\superapp`, em worktree `task/EST-73`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, `better-sqlite3`, Vitest, React Testing Library e Playwright.
- **Banco-fonte do smoke manual:** `C:\Dev2026\Docs\.crush\crush.db`.
- **Banco-destino:** o `estaleiro.db` indicado por `ESTALEIRO_DB`.
- **Capacidade-alvo:** **opus**. É uma fatia vertical integrativa: migração de dados com proveniência, captura nativa, análise semântica, API e UI compartilham o mesmo contrato canônico.
- **Gate:** `pnpm gate @plataforma/estaleiro --profile full`.

## 1. Objetivo

Entregar duas capacidades separadas por uma fronteira explícita:

### A. Ferramenta de importação Crush → Estaleiro

Um executável independente importa sessões do `crush.db` para as tabelas canônicas de conversas do
`estaleiro.db`. A primeira execução traz o histórico; execuções posteriores são incrementais,
idempotentes e deduplicadas. O importador:

- abre o Crush estritamente read-only;
- preserva localmente o conteúdo integral de `messages.parts`, inclusive texto, reasoning,
  tool calls, tool results e outputs;
- preserva timestamps, modelo, provider, árvore pai/filho, tokens e custo disponíveis na origem;
- nunca chama modelo e nunca grava tabelas privadas do Diagnóstico.

### B. Diagnóstico agnóstico à origem

O `@plataforma/plugin-agent-learning` analisa exclusivamente o corpus canônico de conversas do
Estaleiro. Ele não conhece o schema do Crush, não recebe path externo e funciona igual para:

- conversas importadas, com `origin = "crush"`;
- conversas produzidas nativamente pelo Estaleiro, com `origin = "estaleiro"`.

O Diagnóstico extrai métricas determinísticas localmente e envia uma conversa por vez, redigida,
para um modelo do perfil remoto ativo classificar objetivos, tentativas, desfechos, gargalos e
oportunidades de otimização.

### Resultado observável

```text
crush.db ── ferramenta import:crush ──► conversations / conversation_messages / conversation_runs
                                                   │
sessões nativas do Estaleiro ──────────────────────┘
                                                   │
                                                   ▼
                                  plugin-agent-learning
                                  fatos + classificação
                                                   │
                                                   ▼
                                      UI “Diagnóstico”
```

Depois da migração definitiva para o Estaleiro, remover ou simplesmente deixar de executar o
importador não afeta o Diagnóstico.

## 2. Contexto RAG e fontes verificadas

### Produto

- [Especificação do Estaleiro §1.8, §3, §5 e §6.2](../docs/especificacao-estaleiro.md) —
  monitoramento/auditoria, SQLite físico compartilhado, Chat e `plugin-agent-learning`.
- [Design System canônico](../docs/caderno-3-sdk/10-design-system.md) e
  [tema hierárquico](../docs/caderno-3-sdk/09-hierarchical-theme-customization.md).
- [DMM-11](DMM-11.md) — `TraceEvent` e `createJudgeHandler`.
- [EST-48b](EST-48b.md) — perfil remoto e `resolveProvider`.
- [EST-49a](EST-49a.md) — `GET /api/models`.
- [EST-58](EST-58.md) — schema canônico `conversations`/`conversation_messages`;
  `ConversationContent` já é JSON e foi criado para receber tool parts.
- [EST-59](EST-59.md) — modo agente e persistência nativa de tool calls/results.
- [EST-10c](EST-10c.md) e [DMM-13c](DMM-13c.md) — referências de telemetria/fitness, sem copiar
  estimadores ingênuos como fatos.

### Código atual que fixa os contratos

- `apps/estaleiro/core/src/conversation-store.ts`
  - `ConversationRole = "user" | "assistant" | "system" | "tool"`;
  - `conversation_messages.content TEXT` contém `JSON.stringify(content)`;
  - mensagens são lidas por `seq ASC`;
  - o store recebe o handle já aberto do `estaleiro.db`.
- `apps/estaleiro/core/src/bootstrap.ts:272-299`
  - sessões nativas já persistem `{ type: "tool-call", tool, args }`;
  - já persistem `{ type: "tool-result", tool, ok, denied, output }`;
  - versões anteriores podem conter arrays aninhados de parts; o normalizador deve tolerá-los.
- `packages/plugin-agent-harness/src/runner.ts`
  - `generateText(...)` já devolve `result.usage`, mas o contrato local ainda o descarta;
  - `step.toolCalls`/`step.toolResults` expõem `toolCallId`.
- `ai@5.0.213` + `@ai-sdk/provider@2.0.3`, declarações instaladas:
  - `GenerateTextResult.usage: LanguageModelUsage`;
  - `LanguageModelV2Usage { inputTokens, outputTokens, totalTokens, reasoningTokens? }`;
  - tool calls/results possuem `toolCallId: string`.
- `apps/estaleiro/core/src/chat-service.ts`
  - `generateText` do modo Q&A também possui `result.usage`;
  - `ChatResponse` hoje descarta usage.
- `apps/estaleiro/core/src/profile-store.ts`
  - `ProviderProfile.providerKind: "remote" | "local"`.
- `apps/estaleiro/core/src/models-route.ts`
  - catálogo existente; não criar catálogo paralelo.

### Schema Crush confirmado por inspeção read-only

```text
sessions(id, parent_session_id, title, message_count, prompt_tokens,
         completion_tokens, cost, updated_at, created_at, summary_message_id, todos)
messages(id, session_id, role, parts, model, created_at, updated_at,
         finished_at, provider, is_summary_message)
```

Roles observados: `user`, `assistant`, `tool`. `messages.parts` é JSON legível com parts conhecidos
`text`, `reasoning`, `tool_call`, `tool_result` e `finish`.

> **Regra Context7:** antes do primeiro uso novo de `ai`, `@ai-sdk/openai` ou `better-sqlite3`,
> consultar Context7. Se indisponível, usar as declarações das versões instaladas citadas acima e
> registrar o fallback no handover.

## 3. Decisões arquiteturais fechadas

1. **O texto bruto é fonte de verdade local.** `messages.parts` será importado integralmente para
   `conversation_messages.content`. “Bruto” significa preservar todos os valores JSON e textos;
   whitespace/ordem textual do JSON serializado não precisa ser byte-idêntico.
2. **Privacidade é aplicada no limite remoto, não destruindo o corpus.** Dados locais permanecem
   completos. Somente o prompt enviado ao classificador é redigido e limitado.
3. **O importador é ferramenta separada.** Ele terá módulo, testes e comando próprios. O Diagnóstico
   não importa nem chama o importador.
4. **O destino é o modelo canônico de conversas.** Não criar cópia de mensagens em
   `agent_learning_*`; essas tabelas guardam apenas fatos derivados e análises.
5. **Proveniência não contamina o contrato de Chat.** Tabelas auxiliares relacionam IDs externos a
   `conversations`/`conversation_messages`; as tabelas canônicas continuam sendo a fonte consumida.
6. **Importação é conservadora.** Atualiza inserts/updates da origem, mas não apaga do Estaleiro
   quando algo some do Crush.
7. **Histórico e futuro usam o mesmo normalizador.** Parts Crush, parts nativas atuais e o formato
   nativo novo com `toolCallId` convergem para uma timeline interna única.
8. **Tokens/custo não são inventados.** Tokens exatos são usados quando a origem/AI SDK os fornece;
   caso contrário ficam `null`. Tokens estimados por tool call são sempre rotulados.

Decisões 1–6 refletem a orientação do usuário de 2026-07-23. Não há decisão aberta.

## 4. Escopo de arquivos

### 4.1 Corpus canônico e captura nativa

- **[UPDATE]** `apps/estaleiro/core/src/conversation-store.ts`
- **[CREATE]** `apps/estaleiro/core/src/conversation-import-store.ts`
- **[UPDATE]** `apps/estaleiro/core/src/chat-service.ts`
- **[UPDATE]** `apps/estaleiro/core/src/bootstrap.ts`
- **[UPDATE]** `apps/estaleiro/core/src/harness-ws.ts`
- **[UPDATE]** `apps/estaleiro/core/src/index.ts`
- **[UPDATE]** `apps/estaleiro/core/package.json`
- **[UPDATE]** `apps/estaleiro/core/tests/conversation-store.test.ts`
- **[CREATE]** `apps/estaleiro/core/tests/conversation-import-store.test.ts`
- **[UPDATE]** `apps/estaleiro/core/tests/chat-service.test.ts`
- **[UPDATE]** `apps/estaleiro/core/tests/chat-agent-service.integration.test.ts`
- **[UPDATE]** `apps/estaleiro/tests/integration/conversation-api.test.ts`
- **[UPDATE]** `packages/estaleiro-contracts/src/index.ts`
- **[UPDATE]** `packages/plugin-agent-harness/src/types.ts`
- **[UPDATE]** `packages/plugin-agent-harness/src/runner.ts`
- **[UPDATE]** `packages/plugin-agent-harness/tests/runner.test.ts`

### 4.2 Ferramenta de importação

- **[CREATE]** `apps/estaleiro/core/src/crush-conversation-importer.ts`
- **[CREATE]** `apps/estaleiro/core/tests/crush-conversation-importer.test.ts`
- **[CREATE]** `apps/estaleiro/scripts/import-crush-conversations.mjs`
- **[UPDATE]** `apps/estaleiro/package.json` — script `import:crush`.

### 4.3 Plugin de Diagnóstico

- **[CREATE]** `packages/plugin-agent-learning/package.json`
- **[CREATE]** `packages/plugin-agent-learning/tsconfig.json`
- **[CREATE]** `packages/plugin-agent-learning/src/types.ts`
- **[CREATE]** `packages/plugin-agent-learning/src/conversation-normalizer.ts`
- **[CREATE]** `packages/plugin-agent-learning/src/metrics.ts`
- **[CREATE]** `packages/plugin-agent-learning/src/redaction.ts`
- **[CREATE]** `packages/plugin-agent-learning/src/classifier.ts`
- **[CREATE]** `packages/plugin-agent-learning/src/store.ts`
- **[CREATE]** `packages/plugin-agent-learning/src/service.ts`
- **[CREATE]** `packages/plugin-agent-learning/src/index.ts`
- **[CREATE]** `packages/plugin-agent-learning/test/conversation-normalizer.test.ts`
- **[CREATE]** `packages/plugin-agent-learning/test/metrics.test.ts`
- **[CREATE]** `packages/plugin-agent-learning/test/redaction.test.ts`
- **[CREATE]** `packages/plugin-agent-learning/test/classifier.test.ts`
- **[CREATE]** `packages/plugin-agent-learning/test/store.test.ts`

### 4.4 API e UI

- **[CREATE]** `apps/estaleiro/core/src/development-analytics-provider.ts`
- **[CREATE]** `apps/estaleiro/core/src/development-analytics-routes.ts`
- **[CREATE]** `apps/estaleiro/tests/integration/development-analytics.test.ts`
- **[CREATE]** `apps/estaleiro/ui/src/views/diagnostics/types.ts`
- **[CREATE]** `apps/estaleiro/ui/src/views/diagnostics/DiagnosticsClient.http.ts`
- **[CREATE]** `apps/estaleiro/ui/src/views/diagnostics/DiagnosticsView.tsx`
- **[CREATE]** `apps/estaleiro/ui/src/views/diagnostics/DiagnosticsView.test.tsx`
- **[UPDATE]** `apps/estaleiro/ui/src/App.tsx`
- **[UPDATE]** `apps/estaleiro/ui/src/views/chat/ChatClient.http.ts`
- **[UPDATE]** `apps/estaleiro/ui/src/views/chat/ChatView.tsx`
- **[UPDATE]** `apps/estaleiro/ui/src/views/chat/ChatView.test.tsx`
- **[UPDATE]** `apps/estaleiro/ui/src/shell/default-layout.ts`
- **[UPDATE]** `apps/estaleiro/ui/src/shell/default-layout.test.ts`
- **[UPDATE]** `apps/estaleiro/ui/src/estaleiro-core.types.ts`
- **[CREATE]** `apps/estaleiro/e2e/diagnostics.spec.ts`
- **[UPDATE]** `apps/estaleiro/e2e/global-setup.ts`

`pnpm-lock.yaml` é a única exceção mecânica. Não editar `server.mjs`, pois o Diagnóstico não recebe
mais `ESTALEIRO_CRUSH_DB`.

## 5. Contratos executáveis

### 5.1 JSON, mensagens e runs canônicos

`conversation-store.ts` substitui `unknown[]` por JSON explícito, sem quebrar strings:

```ts
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[];

export type ConversationContent = string | JsonValue[];

export interface ConversationUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  reasoningTokens: number | null;
}

export interface ConversationRun {
  id: string;
  conversationId: string;
  origin: "estaleiro" | "crush";
  sourceRunId: string | null;
  modelId: string;
  provider: string | null;
  startedAt: string;
  finishedAt: string | null;
  status: "completed" | "failed" | "aborted";
  finishReason: string | null;
  usage: ConversationUsage;
  costUsd: number | null;
}

export interface RecordConversationRunInput
  extends Omit<ConversationRun, "id"> {
  id?: string;
}
```

`ConversationWithMessages` ganha `runs: ConversationRun[]`. `ConversationStore` ganha:

```ts
recordRun(input: RecordConversationRunInput): Promise<ConversationRun>;
```

Criar idempotentemente:

```sql
CREATE TABLE IF NOT EXISTS conversation_runs (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  origin TEXT NOT NULL,
  source_run_id TEXT,
  model_id TEXT NOT NULL,
  provider TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  finish_reason TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  reasoning_tokens INTEGER,
  cost_usd REAL,
  UNIQUE(origin, source_run_id)
);
CREATE INDEX IF NOT EXISTS idx_conversation_runs_conv
  ON conversation_runs(conversation_id, started_at);
```

`UNIQUE(origin, source_run_id)` deve permitir múltiplos `NULL` nativos. Valores ausentes continuam
`NULL`, nunca `0`.

### 5.2 Store de importação e proveniência

`conversation-import-store.ts` exporta:

```ts
export interface ImportCursor {
  updatedAtMs: number;
  externalId: string;
}

export interface ImportedMessage {
  externalId: string;
  sequence: number;
  role: ConversationRole;
  parts: JsonValue[];
  modelId: string;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
  isSummary: boolean;
  sourceHash: string;
}

export interface ImportedConversation {
  externalId: string;
  parentExternalId: string | null;
  title: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  sourceUpdatedAtMs: number;
  sourceHash: string;
  messages: ImportedMessage[];
  run: Omit<RecordConversationRunInput, "conversationId">;
}

export interface ConversationImportStore {
  getCursor(source: "crush", sourceKey: string): ImportCursor | null;
  upsertBatch(input: {
    source: "crush";
    sourceKey: string;
    conversations: ImportedConversation[];
    nextCursor: ImportCursor;
  }): {
    insertedConversations: number;
    updatedConversations: number;
    unchangedConversations: number;
    insertedMessages: number;
    updatedMessages: number;
    unchangedMessages: number;
  };
}

export function createConversationImportStore(
  db: import("better-sqlite3").Database,
): ConversationImportStore;
```

Tabelas auxiliares:

```sql
conversation_import_state(
  source TEXT NOT NULL,
  source_key TEXT NOT NULL,
  cursor_updated_at_ms INTEGER NOT NULL,
  cursor_external_id TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  PRIMARY KEY(source, source_key)
);

conversation_import_sessions(
  source TEXT NOT NULL,
  source_key TEXT NOT NULL,
  external_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL UNIQUE,
  parent_external_id TEXT,
  source_hash TEXT NOT NULL,
  source_updated_at_ms INTEGER NOT NULL,
  PRIMARY KEY(source, source_key, external_id)
);

conversation_import_messages(
  source TEXT NOT NULL,
  source_key TEXT NOT NULL,
  external_id TEXT NOT NULL,
  message_id TEXT NOT NULL UNIQUE,
  conversation_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  provider TEXT,
  source_created_at TEXT NOT NULL,
  source_updated_at TEXT NOT NULL,
  source_finished_at TEXT,
  is_summary INTEGER NOT NULL,
  source_hash TEXT NOT NULL,
  PRIMARY KEY(source, source_key, external_id)
);
```

O batch inteiro — tabelas canônicas, runs, proveniência e cursor — é uma única transação. IDs
locais existentes são preservados pelo mapping; reimportação nunca cria uma segunda conversa.

### 5.3 Ferramenta incremental do Crush

```ts
export interface CrushImportReport {
  sourceKey: string;
  insertedConversations: number;
  updatedConversations: number;
  unchangedConversations: number;
  insertedMessages: number;
  updatedMessages: number;
  unchangedMessages: number;
  hasMore: boolean;
  nextCursor: ImportCursor;
}

export interface CrushConversationImporter {
  sync(options?: { limit?: number }): CrushImportReport;
  close(): void;
}

export function createCrushConversationImporter(deps: {
  sourceDbPath: string;
  sourceKey: string;
  destination: ConversationImportStore;
  now?: () => Date;
}): CrushConversationImporter;

export function normalizeCrushTimestamp(value: number): number;
```

Regras:

- fonte: `new Database(path, { readonly: true, fileMustExist: true })`;
- nenhum DDL/DML/VACUUM/journal-changing pragma na fonte;
- validar schema e retornar `CRUSH_SCHEMA_UNSUPPORTED` se faltar coluna;
- buscar sessões por `(updated_at, id)` estritamente após o cursor, ordem `ASC`;
- `limit` default 100, mínimo 1, máximo 1.000;
- para cada sessão selecionada, ler todas as mensagens por `created_at ASC, id ASC`;
- cada row Crush vira uma row `conversation_messages`; `content` recebe o array `parts` integral;
- validar `parts` como `JsonValue[]`; JSON inválido aborta somente aquele batch, sem avançar cursor;
- timestamps `< 100_000_000_000` são segundos; demais são milissegundos;
- hash SHA-256:
  - sessão: campos da sessão + IDs/hashes ordenados das mensagens;
  - mensagem: `{ id, role, parts, model, provider, created_at, updated_at, finished_at,
    is_summary_message }`;
- inserir sessão em andamento; uma execução posterior atualiza-a e adiciona novas mensagens;
- não deletar destino;
- `run.sourceRunId = sessions.id`, usage/cost vêm das colunas Crush;
- `modelId` da conversa/run é o último `messages.model` não-vazio em ordem cronológica;
- `sourceKey` default do CLI é `"default"` e permite importar bancos distintos sem colisão;
- não persistir o path do banco-fonte.

CLI obrigatório:

```text
pnpm --filter @plataforma/estaleiro import:crush -- \
  --source C:\Dev2026\Docs\.crush\crush.db \
  --db C:\caminho\estaleiro.db \
  --source-key default \
  --limit 100
```

O CLI imprime apenas `CrushImportReport` JSON, retorna exit 0 em sucesso e exit 1 com código
sanitizado em falha. Reexecutar o mesmo comando continua do cursor.

### 5.4 Captura nativa de usage e toolCallId

Adicionar ao contrato compartilhado:

```ts
export interface AgentUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  reasoningTokens: number | null;
}

export interface AgentRunResult {
  exit: number | null;
  timedOut: boolean;
  tail: string;
  usage: AgentUsage;
}
```

Eventos `tool-call` e `tool-result` ganham `toolCallId: string`; evento `done` ganha
`usage: AgentUsage`. O runner mapeia exatamente `result.usage` do AI SDK. O bootstrap persiste
parts nativos:

```ts
{ type: "tool-call", toolCallId, tool, args }
{ type: "tool-result", toolCallId, tool, ok, denied, output }
```

e grava um `conversation_runs` por turno agente.

`ChatResponse` ganha `usage: ConversationUsage`. `POST /api/chat` aceita
`conversationId?: string`; quando fornecido, o backend grava um run Q&A com usage. O browser nunca
fornece contadores de tokens ao store.

Sessões nativas antigas sem `toolCallId` continuam válidas e são pareadas pelo normalizador usando
FIFO da mesma ferramenta, com `pairingMethod = "fifo_same_tool"`. Novas e importadas usam
`pairingMethod = "source_id"`.

### 5.5 Corpus e normalizador agnósticos

O plugin recebe um port; não importa `estaleiro-core`:

```ts
export type CorpusJsonPrimitive = string | number | boolean | null;
export type CorpusJsonValue =
  | CorpusJsonPrimitive
  | { [key: string]: CorpusJsonValue }
  | CorpusJsonValue[];
export type CorpusRole = "user" | "assistant" | "system" | "tool";
export type CorpusOrigin = "estaleiro" | "crush";

export interface CorpusMessage {
  id: string;
  sequence: number;
  role: CorpusRole;
  content: string | CorpusJsonValue[];
  createdAt: string;
}

export interface CorpusRun {
  id: string;
  modelId: string;
  provider: string | null;
  startedAt: string;
  finishedAt: string | null;
  status: "completed" | "failed" | "aborted";
  finishReason: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  reasoningTokens: number | null;
  costUsd: number | null;
}

export interface CorpusConversationSummary {
  id: string;
  title: string;
  origin: CorpusOrigin;
  parentConversationId: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface CorpusConversation extends CorpusConversationSummary {
  messages: CorpusMessage[];
  runs: CorpusRun[];
}

export interface ConversationPage {
  items: CorpusConversationSummary[];
  nextCursor: string | null;
}

export interface ConversationCorpus {
  list(query: {
    cursor?: string;
    limit: number;
    order: "asc" | "desc";
    origin?: "estaleiro" | "crush";
  }): Promise<ConversationPage>;
  get(conversationId: string): Promise<CorpusConversation>;
}

export type NormalizedEvent =
  | { sequence: number; kind: "message"; messageId: string;
      role: CorpusRole; text: string; createdAt: string }
  | { sequence: number; kind: "reasoning"; messageId: string;
      text: string; createdAt: string }
  | { sequence: number; kind: "tool-call"; messageId: string;
      toolCallId: string; tool: string; input: CorpusJsonValue; createdAt: string }
  | { sequence: number; kind: "tool-result"; messageId: string;
      toolCallId: string | null; tool: string; output: CorpusJsonValue;
      isError: boolean; pairingMethod: "source_id" | "fifo_same_tool" | "unmatched";
      createdAt: string }
  | { sequence: number; kind: "finish"; messageId: string;
      reason: string | null; createdAt: string };

export function normalizeConversation(
  conversation: CorpusConversation,
): { events: NormalizedEvent[]; contentHash: string; unknownPartCount: number };
```

O normalizador suporta:

- parts Crush `tool_call.data.*` e `tool_result.data.*`;
- parts Estaleiro `tool-call`/`tool-result`;
- arrays aninhados produzidos por versões nativas anteriores;
- `text`, `reasoning`, `finish`, strings simples e parts desconhecidos;
- ordem `(message.seq, posição profunda do part)`.

### 5.6 Fatos, classificação e persistência derivada

Tipos semânticos permanecem:

```ts
export type SessionCategory =
  | "implementation" | "diagnosis" | "research" | "review"
  | "planning" | "operations" | "documentation" | "other";
export type SessionOutcome =
  | "resolved" | "partial" | "blocked" | "abandoned" | "unknown";
export type RetryReason =
  | "query_refinement" | "verification" | "tool_error" | "wrong_tool"
  | "missing_context" | "environment" | "stale_state" | "redundant" | "other";

export interface RetryGroupClassification {
  id: string;
  purpose: string;
  toolCallIds: string[];
  reason: RetryReason;
  avoidable: boolean | null;
  evidence: string;
}

export interface ObjectiveClassification {
  id: string;
  title: string;
  category: SessionCategory;
  outcome: SessionOutcome;
  startEventSequence: number;
  endEventSequence: number;
  toolCallIds: string[];
  retryGroups: RetryGroupClassification[];
}

export interface SessionClassification {
  summary: string;
  category: SessionCategory;
  outcome: SessionOutcome;
  objectives: ObjectiveClassification[];
  bottlenecks: Array<{
    kind: "discovery" | "tooling" | "environment" | "verification"
      | "context" | "coordination" | "other";
    severity: "low" | "medium" | "high";
    eventSequences: number[];
    explanation: string;
    recommendation: string;
  }>;
  confidence: number;
}
```

Persistência derivada no mesmo `estaleiro.db`:

```sql
agent_learning_session_facts(
  conversation_id TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL,
  origin TEXT NOT NULL,
  message_count INTEGER NOT NULL,
  tool_call_count INTEGER NOT NULL,
  user_chars INTEGER NOT NULL,
  assistant_chars INTEGER NOT NULL,
  reasoning_chars INTEGER NOT NULL,
  tool_input_chars INTEGER NOT NULL,
  tool_output_chars INTEGER NOT NULL,
  transport_error_count INTEGER NOT NULL,
  unmatched_tool_result_count INTEGER NOT NULL,
  exact_duplicate_call_count INTEGER NOT NULL,
  calculated_at TEXT NOT NULL
);

agent_learning_tool_calls(
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  tool_name TEXT NOT NULL,
  input_chars INTEGER NOT NULL,
  output_chars INTEGER NOT NULL,
  estimated_input_tokens INTEGER NOT NULL,
  estimated_output_tokens INTEGER NOT NULL,
  token_estimate_method TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output_hash TEXT,
  is_error INTEGER NOT NULL,
  pairing_method TEXT NOT NULL
);

agent_learning_analysis_runs(
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  model_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  category TEXT,
  outcome TEXT,
  confidence REAL,
  analysis_json TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  error TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE(conversation_id, content_hash, model_id, prompt_version)
);
```

Não duplicar mensagem, reasoning ou I/O bruto nessas tabelas. Hash novo marca a análise anterior
stale sem destruir histórico.

Agrupamentos de objetivo/retry vêm do modelo, mas somas são calculadas localmente a partir de
toolCallIds válidos. IDs inventados, ranges invertidos e retry groups com menos de duas calls são
rejeitados. Calls não classificadas entram em `unclassified`.

### 5.7 Limite remoto

O corpus local completo é transformado em timeline remota:

- bearer tokens, chaves, passwords, PEM, credenciais de URL, base64 longo e `C:\Users\<nome>` são
  redigidos;
- reasoning é preservado no banco e contabilizado, mas não enviado na v1;
- texto user/assistant: até 4.000 caracteres por evento;
- input/output de tool: até 2.000 caracteres redigidos por evento, suficientes para avaliar
  localização/resolução sem enviar artefatos enormes;
- máximo 200 eventos por prompt; conversas maiores usam blocos cronológicos e consolidação apenas
  dos JSONs parciais;
- `promptVersion = "conversation-diagnostics-v1"`, `schemaVersion = 1`;
- Zod valida resposta; uma única tentativa de reparo;
- uma operação analisa exatamente uma conversa, mesmo que precise de vários blocos.

### 5.8 Serviço e HTTP

```ts
export interface AnalyticsFilters {
  origin?: CorpusOrigin;
  from?: string;
  to?: string;
  category?: SessionCategory;
  outcome?: SessionOutcome;
}

export interface SessionQuery extends AnalyticsFilters {
  cursor?: string;
  limit: number;
  order: "asc" | "desc";
  status?: "pending" | "analyzing" | "analyzed" | "failed" | "stale";
}

export interface RefreshFactsResult {
  calculated: number;
  unchanged: number;
  markedStale: number;
}

export interface AnalyticsSummary {
  exact: {
    sessions: number;
    messages: number;
    toolCalls: number;
    inputTokens: number | null;
    outputTokens: number | null;
    costUsd: number | null;
  };
  estimated: { toolTokens: number };
  inferred: {
    analyzedSessions: number;
    resolvedSessions: number;
    avoidableRetryGroups: number;
    averageConfidence: number | null;
  };
}

export interface SessionSummary extends CorpusConversationSummary {
  analysisStatus: "pending" | "analyzing" | "analyzed" | "failed" | "stale";
  toolCallCount: number;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  category: SessionCategory | null;
  outcome: SessionOutcome | null;
  confidence: number | null;
}

export interface SessionPage {
  items: SessionSummary[];
  nextCursor: string | null;
}

export interface SessionDetail {
  session: SessionSummary;
  events: NormalizedEvent[];
  classification: SessionClassification | null;
  judge: import("@plataforma/plugin-workflows").JudgeVerdict | null;
}

export interface DevelopmentAnalyticsService {
  refreshFacts(conversationId?: string): Promise<RefreshFactsResult>;
  getSummary(filters?: AnalyticsFilters): Promise<AnalyticsSummary>;
  listSessions(query: SessionQuery): Promise<SessionPage>;
  getSession(id: string): Promise<SessionDetail>;
  analyzeNext(modelId: string): Promise<SessionDetail | null>;
  analyzeSession(id: string, modelId: string, force?: boolean): Promise<SessionDetail>;
}
```

Rotas:

```text
GET  /api/development-analytics/summary
GET  /api/development-analytics/sessions?cursor=&limit=&order=&origin=&category=&outcome=&status=
GET  /api/development-analytics/sessions/:id
POST /api/development-analytics/refresh
POST /api/development-analytics/analyze-next
POST /api/development-analytics/sessions/:id/analyze
```

Não existe rota `/sync` com Crush. `refresh` apenas recalcula fatos a partir das conversas já
presentes no Estaleiro.

Análise exige perfil ativo `remote`, senão `409 REMOTE_PROFILE_REQUIRED`. Paginação default 50,
máximo 200, ordenação default `desc` por `createdAt` + ID. Erros não expõem segredo, prompt,
conteúdo, DB path ou output.

### 5.9 Métricas e UI

Separar visualmente:

- **exato:** tokens/custo quando não-null, duração, caracteres, calls, erros, resultados sem par;
- **estimado:** tokens por tool call via `Math.ceil(unicodeChars / 4)`;
- **inferido:** categoria, outcome, objetivo, retry, evitabilidade, gargalo e confiança.

Métricas mínimas:

1. sessões, mensagens, calls, tokens e custo por origem/período;
2. p50/p90 de duração, calls e output;
3. erro, resultado sem par e duplicata exata por ferramenta;
4. amplificação de output;
5. calls por objetivo e profundidade de retry;
6. outcomes e retries evitáveis com confiança;
7. tempo até primeira call e primeira verificação;
8. Pareto por ferramenta;
9. custo/tokens por sessão resolvida, nunca “exato por objetivo”.

A view **Diagnóstico** permanece composição de domínio no Estaleiro. Usa Design System/tokens
semânticos, sem nova engine/tema. Estados: vazio, refresh, análise, erro, dados e perfil remoto
ausente. Filtros incluem origem `Todas | Estaleiro | Crush`. Browser real deve provar layout
1280×720, teclado, foco, `aria-live` e ausência de overflow horizontal.

## 6. Estratégia de testes

### Importador e corpus

1. importa texto, reasoning, tool call, tool result e finish sem perda de valores JSON;
2. preserva roles, timestamps, modelo, provider, parent, tokens e custo;
3. fonte permanece byte-idêntica e read-only;
4. primeira execução insere; segunda retorna somente unchanged;
5. sessão acrescida no Crush atualiza a conversa existente e insere só mensagens novas;
6. mensagem alterada atualiza a mesma row local;
7. dois `sourceKey` não colidem;
8. falha no meio faz rollback inclusive do cursor;
9. cursor com empate de timestamp usa external ID e não pula sessão;
10. deleção na origem não apaga destino;
11. CLI imprime JSON, retoma cursor e sanitiza paths em erro;
12. `ConversationWithMessages` retorna conteúdo bruto e runs em ordem.

### Captura nativa

13. runner propaga usage exato e toolCallId;
14. ChatService propaga usage sem estimar;
15. Q&A com conversationId grava run server-side;
16. agente grava tool-call/result com mesmo toolCallId e um run;
17. usage ausente vira null, não zero;
18. formato nativo antigo com nested arrays continua normalizável.

### Diagnóstico

19. a mesma timeline normalizada é produzida para fixtures semanticamente equivalentes Crush e
    Estaleiro;
20. normalizador não importa nem abre Crush;
21. caracteres/hashes/duplicatas/pareamento e tokens estimados são determinísticos;
22. raw data permanece nas tabelas canônicas; tabelas `agent_learning_*` não a duplicam;
23. redação cobre todos os padrões e reasoning não entra no prompt;
24. output de tool redigido/truncado ainda entra no prompt;
25. JSON inválido faz no máximo um reparo;
26. hash novo invalida fatos/análise; hash igual não chama modelo;
27. `analyze-next` processa uma única conversa;
28. juiz de DMM-11 é chamado, não reimplementado.

### API, UI e E2E

29. seis rotas, cursor, filtros e códigos de erro;
30. perfil local é recusado antes do provider;
31. UI distingue Exato/Estimado/Inferido e filtra por origem;
32. E2E sem fixture Crush semeia diretamente conversas canônicas de ambas as origens e prova que o
    Diagnóstico funciona sem importador;
33. E2E analisa uma conversa, abre objetivos/retries e valida acessibilidade/overflow;
34. layout healing injeta a nova aba em layout antigo.

Nenhum teste usa rede ou o `crush.db` real. O smoke manual do CLI real é read-only e deve registrar
somente contagens, nunca conteúdo.

## 7. Instruções e limites

1. TDD do schema/run e import store.
2. Importador + CLI incremental.
3. Usage/toolCallId nativos.
4. Normalizador agnóstico e métricas.
5. Classificador/store/serviço.
6. Rotas e UI.
7. Smoke do CLI real e gate completo.

> **NÃO FAZER:**
>
> - não fazer o Diagnóstico abrir o `crush.db`;
> - não importar para tabelas `agent_learning_*`;
> - não resumir, truncar ou redigir o corpus persistido localmente;
> - não enviar o corpus bruto ao modelo remoto;
> - não gravar prompt remoto nem resposta bruta inválida;
> - não apagar destino por ausência na origem;
> - não usar path de origem como identidade persistida;
> - não confiar somente no cursor: unique mappings + hashes são o gate de deduplicação;
> - não inferir desperdício por simples repetição do nome da tool;
> - não tratar tokens estimados/null como exatos/zero;
> - não duplicar catálogo de modelos, secrets, judge ou componentes DS;
> - não adicionar tokenizer na v1.

### Pegadinhas

- timestamps Crush observados têm 10 dígitos apesar de comentários antigos sobre milissegundos;
- sessões Crush podem continuar crescendo depois da primeira importação;
- `content` nativo histórico pode conter string, array ou array aninhado;
- tool result Crush possui `data.tool_call_id`; formato nativo antigo não;
- `conversation_messages.seq` não é global; toda ordenação precisa do conversation ID;
- `result.usage` existe no AI SDK instalado, mas hoje é descartado em dois caminhos;
- raw local pode conter segredo: respostas HTTP do Diagnóstico e prompts remotos devem passar pelo
  redactor, sem modificar o banco;
- a UI é consumidora de domínio; nenhuma abstração vai para `ui-engines` sem segundo consumidor.

## 8. Definition of Done e revisão

- [ ] Importador é executável separado, incremental, idempotente e read-only na origem.
- [ ] Conteúdo bruto integral está nas conversas canônicas do Estaleiro.
- [ ] Diagnóstico funciona sem path/schema/importador Crush.
- [ ] Conversas nativas e importadas atravessam o mesmo normalizador.
- [ ] Usage/toolCallId passam a ser capturados nas novas sessões nativas.
- [ ] Dados exatos, estimados e inferidos estão rotulados.
- [ ] Redação ocorre somente no limite remoto/HTTP.
- [ ] Nenhum raw foi duplicado em tabelas analíticas.
- [ ] Juiz existente foi reutilizado.
- [ ] UI respeita Design System, tema e acessibilidade.
- [ ] Testes não dependem de rede/DB real.
- [ ] Gate completo verde:

```bash
pnpm gate @plataforma/estaleiro --profile full
```

### Handover do Executor

- Registrar schema/migração, contagens do import real, fallback de docs, testes e saída integral do
  gate. Não colar conversa, prompt, tool output ou segredo.

### Parecer do Agente Revisor

- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência obrigatória:** build/tsc, testes de pacote/core/UI, Playwright e lint.

## 9. Log de Execução

> Agentes registram transições exclusivamente com `node tools/scripts/manage-task.mjs`.
- **[2026-07-23T17:36]** - *gpt-5* - `[Triado]`: "Vertical integrativo confirmado; dependencias done e fontes canonicas identificadas"
- **[2026-07-23T17:37]** - *gpt-5* - `[Endurecido]`: "Spec vertical fechada: reader Crush read-only, metricas deterministicas, classificacao remota redigida, persistencia versionada, API e UI Diagnostico"
- **[2026-07-23T17:37]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-23T17:52]** - *gpt-5* - `[Demovido]`: Rearquitetura solicitada: importar conversas Crush para o modelo canonico do Estaleiro e tornar Diagnostico independente da origem
- **[2026-07-23T18:05]** - *gpt-5* - `[Triado]`: Revisao arquitetural: importador independente escreve corpus canonico completo; Diagnostico passa a consumir apenas conversas do Estaleiro
- **[2026-07-23T18:05]** - *gpt-5* - `[Endurecido]`: Reendurecida: corpus bruto canonico, importacao Crush incremental deduplicada, captura nativa de usage/toolCallId e Diagnostico agnostico a origem
- **[2026-07-23T18:05]** - *system* - `[Auto-promovida]`: deps todas done
