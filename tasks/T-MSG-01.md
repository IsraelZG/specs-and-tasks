---
id: T-MSG-01
title: "envoltorio sobre o chat existente + integracao com DM social"
status: draft:pending_decision
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-201", "T-403"]
blocks: ["T-MSG-02", "T-MSG-03"]
capacity_target: sonnet
decisions: ["ABERTO-1: path de implementacao — nexus-backend inexistente no monorepo atual; opcoes A/B/C na Secao 6"]
---

# T-MSG-01 · envoltorio sobre o chat existente + integracao com DM social

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet

> [!WARNING]
> **REVISAR:** Esta spec contém dependência de terminologia e infraestrutura do antigo monólito "Nexus".
> Em virtude da introdução do Estaleiro (RFC-018) e do `@plataforma/plugin-workflows`, esses componentes foram superados ou encapsulados.
> **[ABERTO-1]** Path `apps/nexus-backend` NAO EXISTE no monorepo atual — ver Seção 6.

## 1. Objetivo
Criar o envoltorio unificado de chat sobre `caderno-3-sdk/07-chat-reference-spec.md`, expondo
a mesma conversa (`SPECIFICATION:CHAT_MESSAGE`, projecao `chat_conversations`) tanto para chat
nativo quanto para DMs da rede social ([[18-social-reference-spec]] S5). Zero tipo de no novo.

### Contratos exatos (assinaturas TS fixadas)

```ts
// Arquivo a definir pelo arquiteto (ABERTO-1) — interfaces abaixo sao fixas independente do path

/** Projecao de conversa agregada a partir do grafo. */
export interface ChatConversation {
  conversationId: string;
  participants: string[];          // ProfileId[]
  lastMessage?: ChatMessageProjection;
  unreadCount: number;
  isDM: boolean;                   // true se originada de aresta social RELATES:SOCIAL:FOLLOWS
}

export interface ChatMessageProjection {
  messageId: string;
  authorId: string;
  body: string;
  createdAt: number;               // ms since epoch
  editedAt?: number;
  replyToId?: string;
  deletedAt?: number;              // soft-delete apenas
}

/** Payload de intent para enviar mensagem. */
export interface SendMessageIntent {
  conversationId: string;
  body: string;
  replyToId?: string;
}

/** Payload de intent para editar mensagem. */
export interface EditMessageIntent {
  messageId: string;
  newBody: string;
}

/** Payload de intent para deletar mensagem (soft). */
export interface DeleteMessageIntent {
  messageId: string;
}

export interface ChatWrapper {
  /** Projeta conversas do grafo para o view model. */
  listConversations(profileId: string): Promise<ChatConversation[]>;

  /** Busca mensagens de uma conversa com cursor de paginacao. */
  getMessages(conversationId: string, cursor?: string, limit?: number): Promise<{
    messages: ChatMessageProjection[];
    nextCursor?: string;
  }>;

  /** Envia intent de mensagem. */
  sendMessage(intent: SendMessageIntent): Promise<ChatMessageProjection>;

  /** Edita mensagem existente (cria novo no por MUTATES). */
  editMessage(intent: EditMessageIntent): Promise<ChatMessageProjection>;

  /** Soft-delete de mensagem. */
  deleteMessage(intent: DeleteMessageIntent): Promise<void>;

  /** Bridge: dada uma DM social, retorna/garante a conversa de chat correspondente. */
  ensureDMConversation(profileA: string, profileB: string): Promise<ChatConversation>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B1](../docs/mecanica-de-telas.md) — status sending→sent→delivered→read, envio offline enfileirado, tipo de ator (me/contato/ai/system)
- [caderno-3-sdk/20-mensagens-reference-spec.md](../docs/caderno-3-sdk/20-mensagens-reference-spec.md) S2 — Chat
- [caderno-3-sdk/07-chat-reference-spec.md](../docs/caderno-3-sdk/07-chat-reference-spec.md) — Base de chat
- [caderno-3-sdk/18-social-reference-spec.md](../docs/caderno-3-sdk/18-social-reference-spec.md) S5 — DMs como mesma conversa
- [[content-message]] — Subtipo CONTENT:MESSAGE, arestas tipicas, comutatividade

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/07-chat-reference-spec.md` — Modelo `SPECIFICATION:CHAT_MESSAGE`
- **[READ]** `docs/caderno-3-sdk/18-social-reference-spec.md` S5 — DM como chat
- **[READ]** `docs/conceitos/content-message.md` — Ontologia e arestas de CONTENT:MESSAGE
- **[CREATE]** `<pacote-ABERTO-1>/types.ts` — Interfaces ChatConversation, ChatMessageProjection, intents
- **[CREATE]** `<pacote-ABERTO-1>/chat-wrapper.ts` — ChatWrapper interface + implementacao
- **[CREATE]** `<pacote-ABERTO-1>/chat-wrapper.test.ts` — Testes TDD (8 casos)

> **Nota:** Os paths `<pacote-ABERTO-1>` sao substituidos pelo arquiteto ao fechar ABERTO-1 (Secao 6).

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro
- [x] **Fora de Escopo:** Testes de integracao com rede real ou SQLite; Renderizacao UI

Casos de teste (numerados):
1. `listConversations` retorna lista vazia para profile sem conversas.
2. `ensureDMConversation(profileA, profileB)` cria ou retorna conversa existente idempotente, com `isDM: true`.
3. `sendMessage` com `conversationId` valido retorna `ChatMessageProjection` com `messageId` preenchido.
4. `sendMessage` com `conversationId` inexistente lanca erro.
5. `editMessage` cria novo no por MUTATES e retorna projecao com `editedAt` preenchido.
6. `deleteMessage` marca `deletedAt` sem remover o no.
7. `getMessages` com cursor retorna proxima pagina; `nextCursor` vazio no final.
8. DM e chat nativo compartilham mesma `conversationId` quando originados da mesma dupla de profiles.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** crie tipo de no novo — use `CONTENT:MESSAGE`, `SPECIFICATION:CHAT_MESSAGE`, `RELATES:SOCIAL:FOLLOWS` existentes.
> - **NAO** duplique logica de projecao do caderno-3/07 — envolva, nao reescreva.
> - **NAO** use `any` ou `unknown` nos contratos.

### Pegadinhas conhecidas
- **Armadilha:** Confundir DM social com nova mecanica de mensagem. A DM e a mesma conversa de chat, apenas referenciada por aresta social. Use `ensureDMConversation` como bridge, nao como codigo paralelo.
- **Armadilha:** `MUTATES` requer novo no com `SUPERSEDED_BY` apontando para o anterior — nao mutar in-place. O wrapper deve emitir intent, nao escrever direto no grafo.
- **Armadilha:** O wire format (T-201) define `WireData = Uint8Array`; o wrapper serializa intents para `WireData` antes de despachar. Nao assuma JSON direto na rede.
- **Armadilha:** Automerge ephemeral (T-403) governa o canal de staging; o wrapper de chat opera sobre o grafo persistente, nao sobre o canal efemero. Nao confunda os planos.

1. **[TDD]** Escreva os 8 casos de teste da Secao 4 no pacote definido pelo arquiteto (ABERTO-1).
2. Crie `types.ts` com as interfaces exatas da Secao 1.
3. Implemente `chat-wrapper.ts` como envoltorio sobre o chat existente, delegando projecao ao caderno-3/07.
4. Implemente `ensureDMConversation` como bridge entre aresta social e conversa de chat.
5. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
>
> **[ABERTO-1] Path de implementacao obsoleto.** A spec original apontava para `apps/nexus-backend/src/modules/messages/` mas `apps/nexus-backend` NAO EXISTE no monorepo atual (auditoria 2026-07-18: so existem `apps/bancada`, `apps/design-system-showcase`, `apps/estaleiro`, `apps/system-peer`, `apps/web`).
>
> Opcoes para o arquiteto:
> - **A)** ChatWrapper vai para novo pacote `packages/messages/` (approach library — se outros apps vao consumir)
> - **B)** ChatWrapper vai para `apps/estaleiro/src/modules/messages/` (approach app-module — se exclusivo do Estaleiro)
> - **C)** ChatWrapper vai para `packages/core/src/chat/` (approach protocol extension — se parte do grafo central)
>
> Enquanto esta decisao nao fechar: paths das Secoes 3 e 4 e `--filter` do gate (Secao 7) NAO podem ser fixados.
> Task permanece em `draft:pending_decision`.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados (sem criar arquivos nao solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node puro)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] As 8 portas (ChatWrapper) compilam com as assinaturas exatas da Secao 1?

### Verificacao automatica *(comandos exatos — worker E reviewer rodam e COLAM a saida)*
```bash
pnpm --filter <pacote-ABERTO-1> build
pnpm --filter <pacote-ABERTO-1> test
pnpm --filter <pacote-ABERTO-1> lint
```
> **GATE DE EVIDENCIA:** nem o `finish` (worker) nem o veredito (reviewer) sao validos sem a
> saida literal desses comandos colada na secao 8. Marcar `[x]` sem evidencia e violacao.

## 8. Log de Handover e Revisao Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoracao**
- **Evidencia de Execucao (obrigatoria — colar saida de build/tsc + test):**
```
(cole aqui a saida real de pnpm build e pnpm test)
```
- **Comentarios de Revisao:**

## 9. Log de Execucao (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessao de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
- **[2026-07-18T11:19]** - *claude-sonnet* - `[Endurecendo]`: Identificado ABERTO-1 — path nexus-backend inexistente; decisao escalada para arquiteto

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-18T11:21]** - *gemini* - `[Decisão pendente]`: ABERTO-1 path nexus-backend inexistente decisao de arquiteto sobre pacote de destino
