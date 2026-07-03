---
id: T-STR-03
title: "live via LiveKit (SDK embutido + SFU plugin) + consolidacao para CONTENT:FILE"
status: draft:triaged
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-STR-01", "T-MSG-02"]
blocks: []
ui: true
---

# T-STR-03 · live via LiveKit (SDK embutido + SFU plugin) + consolidacao para CONTENT:FILE

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (JSDOM) + `playwright` (E2E smoke)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o player e broadcast de live conforme `19-streaming-reference-spec.md` S3:
transmissao ao vivo via **LiveKit** (SDK cliente embutido, SFU como plugin `infra`, canais
WebRTC proprios). Segmentos ao vivo sao efemeros; ao encerrar, a [[consolidacao-de-live]]
(utilitario `compute` assincrono) consolida num unico `CONTENT:FILE` que entra no plano VOD.
Chat e reacoes ao vivo sao a lente de mensagens (RFC-018/T-MSG-01) sobre a sessao.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-frontend/src/modules/streaming/live-types.ts 
---

export type LiveState = 'offline' | 'connecting' | 'live' | 'consolidating' | 'vod';

export interface LiveSession {
  liveId: string;
  broadcasterId: string;
  title: string;
  state: LiveState;
  startedAt?: number;
  viewerCount?: number;            // projecao
  consolidatedContentId?: string;  // CONTENT:FILE apos consolidacao
}

export interface LivePlayerProps {
  liveId: string;
  profileId: string;               // espectador
  autoPlay?: boolean;
}

export interface LiveBroadcastProps {
  profileId: string;               // broadcaster
  title: string;
  onStateChange?: (state: LiveState) => void;
}
```

```tsx
// --- apps/nexus-frontend/src/modules/streaming/LivePlayer.tsx ---

export interface LivePlayerComponent {
  /** Conecta ao stream LiveKit e inicia reproducao. */
  connect(): Promise<void>;

  /** Desconecta do stream. */
  disconnect(): void;

  /** Estado reativo da sessao live. */
  readonly session: LiveSession | null;

  /** Inicia broadcast (apenas para o broadcaster). */
  startBroadcast(title: string): Promise<LiveSession>;

  /** Encerra broadcast e dispara consolidacao. */
  endBroadcast(): Promise<void>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/19-streaming-reference-spec.md](../docs/caderno-3-sdk/19-streaming-reference-spec.md) S3 — Live
- [[livekit]] — Ecossistema LiveKit, `CONTENT:LIVE_SESSION`, aresta `STREAMS`
- [[consolidacao-de-live]] — Padrao de consolidacao de segmentos em `CONTENT:FILE`
- [[ephemeral-messages]] — Canal volatil para segmentos de live
- T-STR-01 — MediaCatalog
- T-MSG-02 — CallPanel (LiveKit ja integrado para chamadas)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/19-streaming-reference-spec.md` S3
- **[READ]** `docs/conceitos/consolidacao-de-live.md` — Fluxo de consolidacao
- **[READ]** `docs/conceitos/livekit.md` — Contrato LiveKit
- **[READ]** `apps/nexus-frontend/src/modules/calls/CallPanel.tsx` — T-MSG-02 (reusa integracao LiveKit)
- **[CREATE]** `apps/nexus-frontend/src/modules/streaming/live-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-frontend/src/modules/streaming/LivePlayer.tsx` — Player + broadcast
- **[CREATE]** `apps/nexus-frontend/src/modules/streaming/LivePlayer.test.tsx` — Vitest (JSDOM)
- **[CREATE]** `apps/nexus-frontend/src/modules/streaming/LivePlayer.e2e.ts` — Playwright smoke

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (JSDOM) + Playwright (E2E smoke)
- [x] **Ambiente do Teste:** JSDOM para unitarios; headless browser para smoke
- [x] **Fora de Escopo:** Testes com SFU real; transcode real; integracao LiveKit Cloud

Casos de teste (numerados):
1. `LivePlayer` renderiza estado `offline` com indicador "Transmissao encerrada".
2. `connect` transita para `connecting` e depois `live` quando stream LiveKit conecta.
3. `disconnect` transita para `offline` e libera recursos LiveKit.
4. `startBroadcast` cria `LiveSession` com `state: 'live'` e emite `CONTENT:LIVE_SESSION`.
5. `endBroadcast` transita para `consolidating`, dispara [[consolidacao-de-live]], e finalmente para `vod` com `consolidatedContentId`.
6. `endBroadcast` em queda abrupta do peer: janelas progressivas preservam segmentos ja consolidados (rolling-windows).
7. Playwright smoke: player monta, botoes de play/stop respondem.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** implemente o SFU — o plugin `infra` e exigido mas fornecido pelo ambiente.
> - **NAO** persista segmentos efemeros no grafo — apenas o `CONTENT:FILE` final consolidado.
> - **NAO** duplique a integracao LiveKit de T-MSG-02 — reuse o hook/servico de chamadas.

### Pegadinhas conhecidas
- **Armadilha:** Segmentos ao vivo sao `REPLICABLE_VOLATILE` (19-streaming S3.2). Nao os confunda com dados duraveis. Se um segmento for perdido na rede, ele NAO pode ser recuperado do grafo — apenas do disco local do broadcaster.
- **Armadilha:** [[consolidacao-de-live]] opera em janelas progressivas (rolling-windows, ex. blocos de minutos). Queda abrupta do broadcaster preserva os segmentos ja consolidados. O `CONTENT:FILE` final agrega as janelas integras ([[consolidacao-de-live]] S2).
- **Armadilha:** Lives ilimitadas (24/7) usam checkpoint periodico: a cada intervalo (ex.: 1h), o SDK consolida o segmento decorrido e commita no parcial ([[consolidacao-de-live]] S3). Nao espere o fim da live para commitar — pode nunca acontecer.
- **Armadilha:** Chat e reacoes ao vivo sao a lente de mensagens (RFC-018) sobre a sessao (19-streaming S3.3). Nao implemente chat proprio — reuse o ChatWrapper de T-MSG-01 vinculado a `liveId` como `conversationId`.

1. **[TDD]** Escreva `LivePlayer.test.tsx` com os 6 casos unitarios da Secao 4.
2. Crie `live-types.ts` com interfaces da Secao 1.
3. Implemente `LivePlayer.tsx` reusando hook LiveKit de T-MSG-02, com estados `LiveState`.
4. Implemente `startBroadcast`/`endBroadcast` com integracao a [[consolidacao-de-live]].
5. Escreva `LivePlayer.e2e.ts` com smoke test Playwright.
6. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 19-streaming S3, [[livekit]], e [[consolidacao-de-live]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (JSDOM + Playwright smoke)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `endBroadcast` dispara consolidacao e gera `CONTENT:FILE`?

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
- **[2026-07-03T20:03]** - *system* - `[Triado]`: Triagem em lote do backlog
