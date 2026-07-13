---
id: T-EML-02
title: "espelho SPEC:EMAIL idempotente por Message-ID + threading + anexos + envio como saga com supressao de eco"
status: draft:triaged
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-EML-01", "T-108"]
blocks: ["T-EML-03"]
capacity_target: sonnet
---

# T-EML-02 · espelho SPEC:EMAIL idempotente por Message-ID + threading + anexos + envio como saga com supressao de eco

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet


> [!WARNING]
> **REVISAR:** Esta spec contém dependência de terminologia e infraestrutura do antigo monólito "Nexus" ou chamadas diretas ao motor "Zen Engine". 
> Em virtude da introdução do Estaleiro (RFC-018) e do `@plataforma/plugin-workflows`, esses componentes foram superados ou encapsulados. 
> Re-endureça esta spec adequando aos novos contratos antes de desenvolvê-la.

## 1. Objetivo
Implementar o espelho de email no grafo conforme `21-email-reference-spec.md` S2-S3:
email recebido = `CONTENT` (espelho) governado por `SPEC:EMAIL`, idempotente por `Message-ID`
(`external_ref`). Thread = agregacao por arestas nativas `IN_REPLY_TO` e `REFERENCES`
(traduzidas dos cabecalhos RFC 2822), nao heuristica de assunto. Anexos sob ponteiro cego:
importacao IMAP nao materializa anexos > N MB; baixa on-demand com cache local.
Envio = `CONTENT:INTENT` → conector executa SMTP como perna de saga com supressao de eco
(`X-Plataforma-Ref`). Estados (lido, arquivado, marcado) refletem o provedor via
translation engine bidirecional.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-backend/src/modules/email/mirror-types.ts 
---

export interface EmailMirrorSpec {
  emailId: string;                 // = CONTENT id
  messageId: string;               // Message-ID do RFC 2822, external_ref
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  receivedAt: number;              // timestamp do provedor
  threadId?: string;               // agregacao por IN_REPLY_TO/REFERENCES
  inReplyTo?: string;              // Message-ID do email pai
  references?: string[];           // Message-IDs da thread
  attachments: AttachmentPointer[];
  isRead: boolean;
  isArchived: boolean;
  labels: string[];                // labels/pastas do provedor
  folder: string;                  // caixa/postal atual
}

export interface AttachmentPointer {
  attachmentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /** true se anexo > limiar N — materializado on-demand. */
  isLazy: boolean;
  /** contentId no media plane se ja materializado. */
  contentId?: string;
  /** Referencia ao anexo no provedor (ponteiro cego). */
  providerRef: string;
}

export interface ThreadInfo {
  threadId: string;
  subject: string;                 // assunto do email raiz
  participants: string[];
  messageCount: number;
  lastMessageAt: number;
  hasUnread: boolean;
}

export interface SendSagaResult {
  intentId: string;
  messageId: string;               // Message-ID do email enviado
  externalRef: string;             // X-Plataforma-Ref
  state: 'pending' | 'sent' | 'failed' | 'compensating';
  error?: string;
  permanent: boolean;
}
```

```ts
// --- apps/nexus-backend/src/modules/email/mirror.ts ---

export interface EmailMirror {
  /** Espelha email recebido no grafo (idempotente por Message-ID). */
  mirrorInbound(rawEmail: {
    messageId: string;
    headers: Record<string, string>;
    body: string;
    attachments?: AttachmentPointer[];
  }): Promise<EmailMirrorSpec>;

  /** Constroi ou atualiza thread a partir de IN_REPLY_TO/REFERENCES. */
  buildThread(rootMessageId: string): Promise<ThreadInfo>;

  /** Lista emails em uma thread. */
  listThreadMessages(threadId: string): Promise<EmailMirrorSpec[]>;

  /** Marca email como lido/nao-lido (bidirecional: reflete no provedor). */
  markRead(emailId: string, read: boolean): Promise<void>;

  /** Arquiva/desarquiva email (bidirecional). */
  archive(emailId: string, archived: boolean): Promise<void>;

  /** Move email de pasta (bidirecional via translation engine). */
  moveToFolder(emailId: string, folder: string): Promise<void>;

  /** Inicia saga de envio: intent → SMTP → supressao de eco. */
  sendAsSaga(intent: {
    to: string[];
    subject: string;
    body: string;
    inReplyTo?: string;
    references?: string[];
  }): Promise<SendSagaResult>;

  /** Materializa anexo sob demanda (baixa do provedor). */
  fetchAttachment(emailId: string, attachmentId: string): Promise<AttachmentPointer>;

  /** Busca/RAG sobre o espelho local. */
  search(query: string): Promise<EmailMirrorSpec[]>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B10](../docs/mecanica-de-telas.md) — validado no mockup B10: envio expõe estados pendente→enviado (chip "enviando…"); **eco suprimido é estado visível** com explicação ("cópia local suprimida para não duplicar; reentregas idempotentes"), não supressão invisível; lista agrupa por thread (1 linha + contador). Decisão registrada lá: sem modal de "confirmar envio" (a saga pendente já dá janela de percepção) — confirmar ao endurecer.
- [caderno-3-sdk/21-email-reference-spec.md](../docs/caderno-3-sdk/21-email-reference-spec.md) S2-S3 — Mensagens como espelho, envio
- [[conector-espelho]] — D3 (egresso como intent), D4 (supressao de eco), D5 (conflito)
- [[edge-translation]] — Traducao de borda para anexos on-demand
- T-EML-01 — EmailConnector (IMAP/SMTP)
- T-108 — Linhagem (SUPERSEDED_BY para mutacao de estado)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/21-email-reference-spec.md` S2-S3
- **[READ]** `docs/conceitos/conector-espelho.md` — D3, D4, D5
- **[READ]** `apps/nexus-backend/src/modules/email/connector.ts` — T-EML-01
- **[CREATE]** `apps/nexus-backend/src/modules/email/mirror-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-backend/src/modules/email/mirror.ts` — EmailMirror interface + implementacao
- **[CREATE]** `apps/nexus-backend/src/modules/email/mirror.test.ts` — Testes TDD

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter nexus-backend test`
- [x] **Fora de Escopo:** Conexao com IMAP/SMTP real; busca RAG real

Casos de teste (numerados):
1. `mirrorInbound` com `Message-ID` novo cria `CONTENT` com `SPEC:EMAIL`.
2. `mirrorInbound` com `Message-ID` ja existente retorna o mesmo `emailId` (idempotente).
3. `buildThread` a partir de `IN_REPLY_TO` e `REFERENCES` constroi arvore de thread correta.
4. `buildThread` sem cabecalhos de thread retorna thread com 1 mensagem (raiz).
5. `markRead(true)` reflete estado `isRead: true` e aciona traducao bidirecional.
6. `archive(true)` reflete `isArchived: true`.
7. `moveToFolder` atualiza `folder` e aciona translation engine.
8. `sendAsSaga` bem-sucedido retorna `state: 'sent'` com `externalRef` (X-Plataforma-Ref).
9. `sendAsSaga` falho retorna `state: 'failed'`; `permanent: true` nao agenda retry.
10. `fetchAttachment` com `isLazy: true` baixa do provedor e atualiza `contentId`.
11. Anexo > limiar N (ex.: 5MB) e criado como `isLazy: true` (ponteiro cego).

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** duplique emails — idempotencia por `Message-ID` e obrigatoria.
> - **NAO** materialize anexos grandes automaticamente — use ponteiro cego com limiar N.
> - **NAO** reconstrua thread por heuristica de assunto — use arestas `IN_REPLY_TO`/`REFERENCES`.

### Pegadinhas conhecidas
- **Armadilha:** Thread e materializada por arestas nativas `IN_REPLY_TO` e `REFERENCES`, nao por heuristica de assunto (21-email S2.1). Os cabecalhos RFC 2822 (`In-Reply-To`/`References`) sao traduzidos diretamente para arestas do grafo.
- **Armadilha:** Anexos sob ponteiro cego (21-email S2.3): importacao IMAP nao materializa anexos acima de limiar N MB. Registra ponteiro cego (`providerRef`) e baixa o blob on-demand com cache local. O provedor permanece autoritativo sobre o anexo ate a materializacao.
- **Armadilha:** Translation engine bidirecional (21-email S2.2): mutacoes de organizacao no espelho (arquivar, mover de pasta, labels) acionam o conector para aplicar a operacao IMAP correspondente no provedor. Conflito resolve a favor do provedor (D5).
- **Armadilha:** Supressao de eco (D4): `X-Plataforma-Ref` no envio impede que o email enviado volte como ingresso novo. O `mirrorInbound` deve verificar se `Message-ID` corresponde a um `externalRef` ja publicado e descartar.

1. **[TDD]** Escreva `mirror.test.ts` com os 11 casos da Secao 4.
2. Crie `mirror-types.ts` com interfaces da Secao 1.
3. Implemente `mirror.ts`: `mirrorInbound` idempotente, `buildThread` por arestas, `sendAsSaga` com supressao de eco.
4. Implemente `fetchAttachment` com download on-demand e `moveToFolder` com translation engine.
5. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 21-email S2-S3 e [[conector-espelho]] D3-D5.
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (Node puro)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `EmailMirror` compila com as assinaturas exatas da Secao 1?
- [ ] `mirrorInbound` e idempotente por `Message-ID`? Supressao de eco funciona?

### Verificacao automatica *(comandos exatos — worker E reviewer rodam e COLAM a saida)*
```bash
pnpm --filter nexus-backend build
pnpm --filter nexus-backend test
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

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
