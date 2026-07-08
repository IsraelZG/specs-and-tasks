---
id: T-EML-03
title: "vetores: reentrega para no-op, envio falho nao marca enviado, eco suprimido"
status: draft:triaged
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-EML-01", "T-EML-02"]
blocks: []
capacity_target: haiku
---

# T-EML-03 · vetores: reentrega para no-op, envio falho nao marca enviado, eco suprimido

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Implementar guards de hardening para os limites honestos do modulo de email
(`21-email-reference-spec.md` S5 e `conector-espelho.md` D1-D6): reentrega de email ja
espelhado deve ser no-op (idempotencia por `Message-ID`), envio falho nunca marca "enviado",
eco e suprimido (`X-Plataforma-Ref`), falha de autenticacao e superficializada imediatamente
(`offline_auth`), e ressincronizacao por perda de cursor e idempotente.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-backend/src/modules/email/guard-types.ts 
---

export interface DedupGuardResult {
  isDuplicate: boolean;
  existingEmailId?: string;
  messageId: string;
}

export interface SendGuardResult {
  canMarkSent: boolean;
  reason?: string;                 // ex: "SMTP falhou — nao marcar como enviado"
  sagaState: 'sent' | 'failed' | 'pending';
  permanentFailure: boolean;
}

export interface EchoSuppressionResult {
  suppressed: boolean;
  reason?: string;                 // ex: "X-Plataforma-Ref case com external_ref existente"
  externalRef?: string;
}

export interface AuthFailureResult {
  isAuthFailure: boolean;
  shouldSurface: boolean;          // sempre true
  shouldPauseSagas: boolean;       // pausa sagas pendentes
  reason?: string;
}

export interface ResyncGuardResult {
  needsFullResync: boolean;
  reason?: string;                 // ex: "UIDVALIDITY mudou — ressincronizacao completa"
  lastKnownUidValidity?: number;
  currentUidValidity?: number;
}
```

```ts
// --- apps/nexus-backend/src/modules/email/guards.ts ---

export interface EmailGuards {
  /** Verifica se email ja foi espelhado (idempotencia por Message-ID). */
  guardDuplicate(messageId: string): Promise<DedupGuardResult>;

  /** Garante que envio falho nao e marcado como enviado. */
  guardSendState(intentId: string, smtpResult: EmailEgressResult): SendGuardResult;

  /** Verifica supressao de eco: X-Plataforma-Ref case com external_ref existente. */
  guardEchoSuppression(messageId: string, platformRef?: string): Promise<EchoSuppressionResult>;

  /** Detecta falha de auth e superficializa; pausa sagas. */
  guardAuthFailure(connectorState: ConnectorState, error?: Error): AuthFailureResult;

  /** Detecta necessidade de ressincronizacao por perda de cursor. */
  guardResyncNeeded(cursor: ImapCursor, accountId: string): Promise<ResyncGuardResult>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B10](../docs/mecanica-de-telas.md) — comportamento observável validado no mockup B10 para os vetores: envio falho permanece "pendente"/falha, **nunca marca enviado**; reentrega = no-op comunicado como tooltip discreto ("mesmo id = mesma mensagem"); eco suprimido = chip + nota explicativa.
- [caderno-3-sdk/21-email-reference-spec.md](../docs/caderno-3-sdk/21-email-reference-spec.md) S5 — Limites honestos
- [[conector-espelho]] — D1 (cursor durave), D4 (supressao de eco), D5 (conflito)
- T-EML-01 — EmailConnector (estados, cursor, envio)
- T-EML-02 — EmailMirror (espelho, saga, thread)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/21-email-reference-spec.md` S5
- **[READ]** `docs/conceitos/conector-espelho.md` — D1, D4, D5
- **[READ]** `apps/nexus-backend/src/modules/email/connector.ts` — T-EML-01
- **[READ]** `apps/nexus-backend/src/modules/email/mirror.ts` — T-EML-02
- **[CREATE]** `apps/nexus-backend/src/modules/email/guard-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-backend/src/modules/email/guards.ts` — EmailGuards interface + implementacao
- **[CREATE]** `apps/nexus-backend/src/modules/email/guards.test.ts` — Testes TDD

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter nexus-backend test`
- [x] **Fora de Escopo:** Conexao com IMAP/SMTP real

Casos de teste (numerados):
1. `guardDuplicate` com `Message-ID` ja espelhado retorna `isDuplicate: true` e `existingEmailId`.
2. `guardDuplicate` com `Message-ID` novo retorna `isDuplicate: false`.
3. `guardSendState` com `smtpResult.success: false` retorna `canMarkSent: false`.
4. `guardSendState` com `smtpResult.success: true` retorna `canMarkSent: true`.
5. `guardEchoSuppression` com `X-Plataforma-Ref` que ja existe no grafo retorna `suppressed: true`.
6. `guardEchoSuppression` sem `X-Plataforma-Ref` no grafo retorna `suppressed: false`.
7. `guardAuthFailure` com `connectorState: 'offline_auth'` retorna `shouldSurface: true, shouldPauseSagas: true`.
8. `guardAuthFailure` com `connectorState: 'error'` (erro transiente) retorna `isAuthFailure: false`.
9. `guardResyncNeeded` com `UIDVALIDITY` diferente do cursor salvo retorna `needsFullResync: true`.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** permita que reentrega crie no duplicado — idempotencia e obrigatoria.
> - **NAO** marque email como "enviado" se SMTP falhou — nunca "enviado" falso.
> - **NAO** ignore falha de auth — superficialize imediatamente e pause sagas.

### Pegadinhas conhecidas
- **Armadilha:** `guardDuplicate` por `Message-ID`: o `external_ref` (RFC-007 A.3.2) e a chave de idempotencia. Se o mesmo `Message-ID` chega duas vezes (reentrega IMAP, ressincronizacao), a segunda deve ser no-op, retornando o `emailId` existente.
- **Armadilha:** Falha de envio nunca marca "enviado" (21-email S3). O `guardSendState` verifica o `smtpResult.success` e bloqueia `canMarkSent` se falso. Falha transiente agenda retry; falha permanente (`permanent: true`) cancela a saga.
- **Armadilha:** `offline_auth` e superficializado IMEDIATAMENTE (21-email S5.4). Nao espere timeout — o `guardAuthFailure` deve disparar notificacao assim que o estado transitar para `offline_auth`. Sagas de envio pendentes sao pausadas, nao canceladas.
- **Armadilha:** Perda de cursor (UIDVALIDITY mudou) requer ressincronizacao completa idempotente (D1). O `guardResyncNeeded` compara `UIDVALIDITY` atual com o salvo. A ressincronizacao e segura porque `external_ref` garante idempotencia — duplicatas sao absorvidas.

1. **[TDD]** Escreva `guards.test.ts` com os 9 casos da Secao 4.
2. Crie `guard-types.ts` com interfaces da Secao 1.
3. Implemente `guards.ts` com os 5 guards, delegando consultas ao EmailMirror (T-EML-02) e EmailConnector (T-EML-01).
4. Garanta que `guardSendState` bloqueia `canMarkSent` em falha e `guardEchoSuppression` detecta eco.
5. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 21-email S5 e [[conector-espelho]] D1, D4, D5.
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (Node puro)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `EmailGuards` compila com as assinaturas exatas da Secao 1?
- [ ] `guardDuplicate` e idempotente? `guardSendState` bloqueia falso "enviado"?

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
