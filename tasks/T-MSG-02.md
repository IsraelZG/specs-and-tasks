---
id: T-MSG-02
title: "chamadas/conferencia via LiveKit (SDK embutido + SFU plugin) + gravacao consolidada"
status: draft:triaged
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-MSG-01"]
blocks: []
ui: true
capacity_target: sonnet
---

# T-MSG-02 · chamadas/conferencia via LiveKit (SDK embutido + SFU plugin) + gravacao consolidada

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (JSDOM) + `playwright` (E2E smoke)
- **Capacidade-alvo:** sonnet


> [!WARNING]
> **REVISAR:** Esta spec contém dependência de terminologia e infraestrutura do antigo monólito "Nexus" ou chamadas diretas ao motor "Zen Engine". 
> Em virtude da introdução do Estaleiro (RFC-018) e do `@plataforma/plugin-workflows`, esses componentes foram superados ou encapsulados. 
> Re-endureça esta spec adequando aos novos contratos antes de desenvolvê-la.

## 1. Objetivo
Implementar o painel de chamadas e conferencia via **LiveKit** conforme `20-mensagens-reference-spec.md` S3:
SDK cliente embutido (first-party), SFU como plugin `infra` exigido pelo LiveKit (RFC-010 A.3,
modality-gated). Gravacao opcional com consentimento consolida segmentos efemeros via
[[consolidacao-de-live]] em `CONTENT:FILE` anexado a conversa. Logging dura de chamada:
`CONTENT:CALL_START` e `CONTENT:CALL_END` assentados na conversa.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-frontend/src/modules/calls/types.ts 
---

export type CallState = 'idle' | 'ringing' | 'connecting' | 'active' | 'ended';

export interface CallSession {
  callId: string;
  conversationId: string;
  participants: string[];
  state: CallState;
  startedAt?: number;
  isRecording: boolean;
  recordingConsent: boolean;
}

export interface CallPanelProps {
  conversationId: string;
  onCallStart?: (session: CallSession) => void;
  onCallEnd?: (session: CallSession, durationMs: number) => void;
}
```

```tsx
// --- apps/nexus-frontend/src/modules/calls/CallPanel.tsx ---

export interface CallPanelComponent {
  /** Inicia chamada 1:1 ou conferencia na conversa. */
  startCall(conversationId: string, mode: 'audio' | 'video'): Promise<CallSession>;

  /** Aceita chamada entrante. */
  acceptCall(callId: string): Promise<void>;

  /** Rejeita/encerra chamada. */
  endCall(callId: string): Promise<void>;

  /** Alterna gravacao (requer consentimento de todos). */
  toggleRecording(callId: string, consent: boolean): Promise<void>;

  /** Estado reativo da sessao de chamada ativa. */
  readonly activeCall: CallSession | null;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B1](../docs/mecanica-de-telas.md) — chamada validada no mockup B1: 3 estados de tela (recebida com aceitar/recusar → 1:1 com remoto grande + self em PiP → grade de tiles) com controles mic/câmera/encerrar persistentes entre estados. Distribuição do plugin nativo LiveKit SFU: ver spike T-1040. Pendência cosmética conhecida: rótulo "Sua câmera" corta em coluna estreita (não é requisito).
- [caderno-3-sdk/20-mensagens-reference-spec.md](../docs/caderno-3-sdk/20-mensagens-reference-spec.md) S3 — Chamadas e conferencia
- [[livekit]] — Ecossistema LiveKit, `CONTENT:LIVE_SESSION`, aresta `STREAMS`
- [[consolidacao-de-live]] — Padrao de consolidacao de segmentos em `CONTENT:FILE`
- [[ephemeral-messages]] — Canal de transporte volatil para sinalizacao

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/20-mensagens-reference-spec.md` S3
- **[READ]** `docs/conceitos/livekit.md` — Contrato e regras de transporte
- **[READ]** `docs/conceitos/consolidacao-de-live.md` — Fluxo de consolidacao
- **[READ]** `apps/nexus-frontend/src/modules/messages/` — Chat wrapper de T-MSG-01
- **[CREATE]** `apps/nexus-frontend/src/modules/calls/types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-frontend/src/modules/calls/CallPanel.tsx` — Componente + hook LiveKit
- **[CREATE]** `apps/nexus-frontend/src/modules/calls/CallPanel.test.tsx` — Vitest (JSDOM)
- **[CREATE]** `apps/nexus-frontend/src/modules/calls/CallPanel.e2e.ts` — Playwright smoke

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (JSDOM) + Playwright (E2E smoke)
- [x] **Ambiente do Teste:** JSDOM para unitarios; headless browser para smoke
- [x] **Fora de Escopo:** Testes com SFU real; integracao com LiveKit Cloud

Casos de teste (numerados):
1. `CallPanel` renderiza estado `idle` com botao de chamada desabilitado se sem conversa.
2. `startCall` transita estado para `connecting` e emite `CONTENT:CALL_START` na conversa.
3. `endCall` transita para `ended` e emite `CONTENT:CALL_END` com duracao e participantes.
4. `toggleRecording` sem consentimento de todos os participantes lanca erro.
5. `acceptCall` aceita chamada entrante e conecta fluxo LiveKit.
6. Playwright smoke: `CallPanel` monta sem crash, botoes de audio/video respondem a clique.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** implemente o SFU — o plugin `infra` e exigido mas fornecido pelo ambiente.
> - **NAO** grave midia sem consentimento explicito de todos os participantes.
> - **NAO** crie tipo de no novo — use `CONTENT:CALL_START`, `CONTENT:CALL_END`, `CONTENT:LIVE_SESSION`.

### Pegadinhas conhecidas
- **Armadilha:** Canais WebRTC do LiveKit estao FORA do reconciliador do grafo (20-mensagens S3.1). Nao tente reconciliar streaming de midia — apenas os marcos `CALL_START`/`CALL_END` sao duraveis.
- **Armadilha:** Gravacao usa [[consolidacao-de-live]] como utilitario `compute` assincrono (janelas progressivas). Nao grave tudo em RAM e descarregue de uma vez — use rolling windows de minutos.
- **Armadilha:** Consentimento de gravacao e obrigatorio e deve ser verificavel. Grave o intent de consentimento de cada participante como aresta antes de iniciar a gravacao.
- **Armadilha:** LiveKit SDK cliente e embutido (first-party) — nao use wrapper third-party. O SFU e modalidade-gated: sem SFU disponivel, degrade para WebRTC bruto (P2P) com alerta ao usuario.

1. **[TDD]** Escreva `CallPanel.test.tsx` com os 5 casos unitarios da Secao 4.
2. Crie `types.ts` com as interfaces exatas da Secao 1.
3. Implemente `CallPanel.tsx` com hook LiveKit, gerenciamento de estado `CallState`, e emissao de intents `CALL_START`/`CALL_END`.
4. Implemente `toggleRecording` com validacao de consentimento e integracao com [[consolidacao-de-live]].
5. Escreva `CallPanel.e2e.ts` com smoke test Playwright.
6. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 20-mensagens S3, [[livekit]], e [[consolidacao-de-live]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (JSDOM + Playwright smoke)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `CallPanel` compila com as assinaturas exatas da Secao 1?

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
