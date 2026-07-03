---
id: T-MSG-03
title: "presenca efemera nao-replicada + vetores"
status: draft:triaged
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-MSG-01"]
blocks: []
ui: true
---

# T-MSG-03 · presenca efemera nao-replicada + vetores

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (JSDOM) + `playwright` (E2E smoke)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Implementar indicador de presenca efemera conforme `20-mensagens-reference-spec.md` S4: estado
efemero nao-durave — sinal volatil, nunca no append-only replicado. Entrega best-effort;
"visto por ultimo" e cortesia honest-client, desligavel. Rate-limit rigido por cliente e
auto-expiracao local (~5s para digitacao). Inclui vetores de hardening contra spam de presenca
e retencao de lixo nas views ativas.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-frontend/src/modules/messages/presence-types.ts 
---

export type PresenceStatus = 'online' | 'offline' | 'typing';

export interface PresenceSnapshot {
  profileId: string;
  status: PresenceStatus;
  lastSeenAt?: number;            // ms since epoch, apenas se status !== 'online'
  conversationId?: string;        // se typing, qual conversa
}

export interface PresenceConfig {
  /** Intervalo maximo entre heartbeats de presenca (ms). Exceder = offline. */
  heartbeatIntervalMs: number;     // default: 30_000
  /** Tempo de auto-expiracao do indicador de digitacao (ms). */
  typingExpiryMs: number;          // default: 5_000
  /** Maximo de eventos de presenca por segundo por cliente. */
  rateLimitPerSecond: number;      // default: 2
}
```

```tsx
// --- apps/nexus-frontend/src/modules/messages/PresenceIndicator.tsx ---

export interface PresenceIndicatorProps {
  profileId: string;
  conversationId?: string;
  config?: Partial<PresenceConfig>;
}

export interface PresenceIndicatorComponent {
  /** Snapshot atual de presenca do perfil observado. */
  readonly snapshot: PresenceSnapshot | null;

  /** Atualiza status do usuario local (online/typing). */
  updateMyStatus(status: PresenceStatus, conversationId?: string): void;

  /** Habilita/desabilita "visto por ultimo". */
  setLastSeenEnabled(enabled: boolean): void;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/20-mensagens-reference-spec.md](../docs/caderno-3-sdk/20-mensagens-reference-spec.md) S4 — Presenca
- [[ephemeral-messages]] — Canal de transporte volatil, `REPLICABLE_VOLATILE`
- [[matriz-de-classificacao-transporte]] — Enquadramento de dados nao-auditaveis
- [[content-message]] — CONTENT:MESSAGE para mensagens persistentes (presenca NAO usa)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/20-mensagens-reference-spec.md` S4 — Regras de presenca
- **[READ]** `docs/conceitos/ephemeral-messages.md` — Transporte volatil
- **[READ]** `apps/nexus-frontend/src/modules/messages/` — Chat wrapper de T-MSG-01
- **[CREATE]** `apps/nexus-frontend/src/modules/messages/presence-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-frontend/src/modules/messages/PresenceIndicator.tsx` — Componente + hook
- **[CREATE]** `apps/nexus-frontend/src/modules/messages/PresenceIndicator.test.tsx` — Vitest (JSDOM)
- **[CREATE]** `apps/nexus-frontend/src/modules/messages/PresenceIndicator.e2e.ts` — Playwright smoke

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (JSDOM) + Playwright (E2E smoke)
- [x] **Ambiente do Teste:** JSDOM para unitarios; headless browser para smoke
- [x] **Fora de Escopo:** Testes de rede real; garantia de entrega (best-effort)

Casos de teste (numerados):
1. `PresenceIndicator` renderiza indicador `offline` quando `snapshot` e null.
2. `updateMyStatus('typing', conversationId)` emite sinal efemero e auto-expiracao comeca timer de 5s.
3. Apos 5s sem refresh, indicador de digitacao reverte para estado anterior (auto-expiracao).
4. Rate-limit: mais de `N` chamadas a `updateMyStatus` em 1s descarta excedentes (log warn).
5. `setLastSeenEnabled(false)` oculta "visto por ultimo" no componente.
6. Indicador de digitacao NAO gera no persistente no grafo (apenas sinal ephemeral).
7. Playwright smoke: componente monta, indicador de status aparece, clique alterna estado.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** persista presenca no grafo — e `REPLICABLE_VOLATILE`, nunca no append-only.
> - **NAO** crie tipo de no novo para presenca — use canal efemero existente.
> - **NAO** prometa garantia de entrega — e best-effort, declarado no limite honesto.

### Pegadinhas conhecidas
- **Armadilha:** Presenca e falsificavel por cliente adversario (20-mensagens S5.2). Nao use presenca como prova de disponibilidade para logica de negocio — e cortesia de UX, nao primitiva de seguranca.
- **Armadilha:** Rate-limit e por cliente (ProfileId), nao global. Um Sybil pode criar N perfis e spamar N× o limite. O rate-limit eleva o custo, nao o elimina — declarado como limite honesto.
- **Armadilha:** Auto-expiracao de digitacao (~5s) deve rodar localmente no timer do componente, nao depender de mensagem do peer remoto. Se o peer remoto cair, o indicador expira sozinho.
- **Armadilha:** "Visto por ultimo" e cortesia honest-client, desligavel. Nao confunda com `CONTENT:CALL_END` ou evento durave — sao planos diferentes.

1. **[TDD]** Escreva `PresenceIndicator.test.tsx` com os 6 casos unitarios da Secao 4.
2. Crie `presence-types.ts` com interfaces e config padrao.
3. Implemente `PresenceIndicator.tsx` com hook de canal efemero, rate-limit, e auto-expiracao.
4. Implemente `updateMyStatus` com validacao de rate-limit e debounce de digitacao.
5. Escreva `PresenceIndicator.e2e.ts` com smoke test Playwright.
6. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 20-mensagens S4 e [[ephemeral-messages]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (JSDOM + Playwright smoke)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] Presenca NAO cria nos persistentes no grafo?

### Verificacao automatica *(comandos exatos — worker E reviewer rodam e COLAM a saida)*
```bash
pnpm --filter nexus-frontend build
pnpm --filter nexus-frontend test
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
