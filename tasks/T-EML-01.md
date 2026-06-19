---
id: T-EML-01
title: "conector Classe D (IMAP/SMTP, cursor, polling/IDLE) — depende de T-CN-03"
status: draft
complexity: 5
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-CN-03"]
blocks: ["T-EML-02", "T-EML-03"]
---

# T-EML-01 · conector Classe D (IMAP/SMTP, cursor, polling/IDLE) — depende de T-CN-03

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o conector Classe D (espelho bidirecional IMAP/SMTP) conforme `21-email-reference-spec.md`
S1 e `conector-espelho.md` D1-D6: cursor durave (UIDVALIDITY/UIDNEXT), ingresso por
polling + IDLE, credenciais fora do grafo no system-peer, egresso como intent (SMTP como
perna de saga), supressao de eco (D4), e resolucao de conflito a favor do provedor.
Depende de T-CN-03 para o skeleton de conector Classe D.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-backend/src/modules/email/connector-types.ts ---

export type ConnectorState = 'disconnected' | 'connecting' | 'connected' | 'offline_auth' | 'error';

export interface EmailAccount {
  accountId: string;
  userId: string;
  provider: 'imap';
  credentials: {
    imapHost: string;
    imapPort: number;
    smtpHost: string;
    smtpPort: number;
    username: string;
    /** Credencial armazenada fora do grafo (system-peer). */
    credentialRef: string;         // referencia ao system-peer, nunca plaintext
  };
  state: ConnectorState;
}

export interface ImapCursor {
  uidValidity: number;
  uidNext: number;
  lastSyncAt: number;
  folder: string;
}

export interface EmailIngressResult {
  ingested: number;                // novas mensagens
  updated: number;                 // mensagens com estado alterado
  errors: number;
  cursor: ImapCursor;              // atualizado
}

export interface EmailEgressResult {
  messageId: string;               // Message-ID do email enviado
  externalRef: string;             // X-Plataforma-Ref para supressao de eco
  success: boolean;
  error?: string;                  // falha transiente ou permanente
  permanent: boolean;              // true se falha permanente (nao retry)
}
```

```ts
// --- apps/nexus-backend/src/modules/email/connector.ts ---

export interface EmailConnector {
  /** Conecta ao provedor IMAP/SMTP com as credenciais. */
  connect(account: EmailAccount): Promise<void>;

  /** Desconecta e libera recursos. */
  disconnect(): Promise<void>;

  /** Polling: busca novas mensagens desde o cursor. */
  fetchNewMessages(folder: string): Promise<EmailIngressResult>;

  /** Ativa IDLE para notificacoes push de novas mensagens. */
  startIdle(folder: string): Promise<void>;

  /** Desativa IDLE. */
  stopIdle(): Promise<void>;

  /** Envia email via SMTP como perna de saga. */
  sendEmail(intent: {
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: string[];        // contentIds do media plane
    inReplyTo?: string;            // Message-ID original
    references?: string[];         // para threading
  }): Promise<EmailEgressResult>;

  /** Estado atual do conector. */
  readonly state: ConnectorState;

  /** Callback para novas mensagens (IDLE ou polling). */
  onNewMessages(handler: (result: EmailIngressResult) => void): void;

  /** Callback para mudanca de estado do conector. */
  onStateChange(handler: (state: ConnectorState) => void): void;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/21-email-reference-spec.md](../docs/caderno-3-sdk/21-email-reference-spec.md) S1 — Conta como conector espelho
- [[conector-espelho]] — Invariantes D1-D6: cursor durave, polling+webhook, egresso como intent, supressao de eco, conflito, mutacao por linhagem
- [[edge-translation]] — Traducao de borda (aplicavel a anexos sob demanda)
- T-CN-03 — Skeleton de conector Classe D

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/21-email-reference-spec.md` S1
- **[READ]** `docs/conceitos/conector-espelho.md` — D1-D6
- **[READ]** `apps/nexus-backend/src/modules/connectors/` — T-CN-03 (skeleton Classe D)
- **[CREATE]** `apps/nexus-backend/src/modules/email/connector-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-backend/src/modules/email/connector.ts` — EmailConnector interface + implementacao
- **[CREATE]** `apps/nexus-backend/src/modules/email/connector.test.ts` — Testes TDD

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro com mock de IMAP/SMTP, `pnpm --filter nexus-backend test`
- [x] **Fora de Escopo:** Conexao com servidores IMAP/SMTP reais; envio real de email

Casos de teste (numerados):
1. `connect` com credenciais validas transita estado para `connected` e armazena `UIDVALIDITY`.
2. `connect` com credenciais invalidas transita para `offline_auth` e notifica callback.
3. `fetchNewMessages` atualiza `uidNext` no cursor apos ingresso.
4. `fetchNewMessages` idempotente: mesma mensagem (mesmo `Message-ID`) nao gera duplicata.
5. `startIdle` notifica `onNewMessages` quando chega email durante IDLE.
6. `sendEmail` bem-sucedido retorna `externalRef` com `X-Plataforma-Ref`.
7. `sendEmail` com falha transiente (ex.: timeout) retorna `permanent: false` (pode retry).
8. `sendEmail` com falha de auth retorna `permanent: true` (nao retry) e transita para `offline_auth`.
9. Perda de cursor → `fetchNewMessages` dispara ressincronizacao completa idempotente (D1).

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** armazene credenciais no grafo — use `credentialRef` para o system-peer.
> - **NAO** implemente IMAP/SMTP do zero — use bibliotecas existentes (ex.: `node-imap`, `nodemailer`).
> - **NAO** muta estado in-place no grafo — mutacao por linhagem: `SUPERSEDED_BY` (D6).

### Pegadinhas conhecidas
- **Armadilha:** Cursor e armazenado FORA do grafo, no system-peer (D1). Perda de cursor → ressincronizacao completa idempotente. O `external_ref` (Message-ID) garante que duplicatas nao gerem nos espurios.
- **Armadilha:** Credenciais IMAP/SMTP sao armazenadas no system-peer, nunca no grafo (21-email S1). O campo `credentialRef` e uma referencia opaca; o sistema de credenciais do system-peer gerencia o segredo.
- **Armadilha:** `offline_auth` e superficializado imediatamente ao usuario (21-email S5.4). Sagas de envio pendentes sao pausadas (nao entram em retry continuo) ate reautenticacao. Falha de auth nunca e silenciosa.
- **Armadilha:** Egresso como intent (D3): `sendEmail` e `CONTENT:INTENT` aprovado pelo validador do fluxo. O conector executa SMTP como perna de saga e publica o resultado (`external_ref`). Falha → compensacao declarada na SPEC, nunca "enviado" falso.

1. **[TDD]** Escreva `connector.test.ts` com os 9 casos da Secao 4, usando mock de IMAP/SMTP.
2. Crie `connector-types.ts` com interfaces da Secao 1.
3. Implemente `connector.ts` estendendo o skeleton Classe D de T-CN-03.
4. Implemente `fetchNewMessages` com idempotencia por `Message-ID` e atualizacao de cursor.
5. Implemente `sendEmail` com saga, supressao de eco (D4), e distincao falha transiente vs. permanente.
6. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 21-email S1, [[conector-espelho]] D1-D6.
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (Node puro, mock IMAP/SMTP)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `EmailConnector` compila com as assinaturas exatas da Secao 1?
- [ ] Credenciais nunca em plaintext no grafo? `offline_auth` pausa sagas?

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
