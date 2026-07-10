---
id: T-STR-02
title: "renditions como utilitario compute assincrono + irmaos CONTENT"
status: draft:triaged
complexity: 4
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-STR-01", "T-IA-02"]
blocks: []
capacity_target: sonnet
---

# T-STR-02 · renditions como utilitario compute assincrono + irmaos CONTENT

## 0. Ambiente de Execucao Obrigatorio
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NAO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro, sem browser)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar o pipeline de geracao de renditions como utilitario `compute` assincrono conforme
`19-streaming-reference-spec.md` S2.2: renditions (qualidades) sao `CONTENT` irmaos do original,
geradas por utilitario `compute` assincrono (transcode) na fila da RFC-010 (A.5.3). Falha de
um job de transcode nao invalida a rendition: o orquestrador da fila re-enfileira o job
imediatamente noutro no, sem perda do `CONTENT` original. Peers que executam jobs de rendition
recebem `CREDITS` proporcionais ao custo computacional medido (19-streaming S5.3).

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- apps/nexus-backend/src/modules/streaming/rendition-types.ts 
---

export type TranscodeJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TranscodeJob {
  jobId: string;
  sourceContentId: string;         // CONTENT original
  targetSpec: {
    quality: string;               // ex: '1080p', '720p', '4K'
    codec: string;                 // ex: 'h264', 'av1', 'vp9'
    bitrateBps: number;
    width?: number;
    height?: number;
  };
  status: TranscodeJobStatus;
  assignedPeerId?: string;         // peer que esta executando
  resultRenditionId?: string;      // CONTENT:rendition criado apos sucesso
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;              // default: 3
  estimatedComputeCost: number;    // CREDITS estimados
  createdAt: number;
  updatedAt: number;
}

export interface RenditionComputeQueue {
  /** Enfileira job de transcode para gerar rendition. */
  enqueue(sourceContentId: string, targetSpec: TranscodeJob['targetSpec']): Promise<TranscodeJob>;

  /** Peer reclama proximo job pendente da fila. */
  claimJob(peerId: string): Promise<TranscodeJob | null>;

  /** Reporta conclusao do job com o renditionId criado. */
  completeJob(jobId: string, renditionId: string): Promise<TranscodeJob>;

  /** Reporta falha do job; orquestrador re-enfileira se abaixo de maxRetries. */
  failJob(jobId: string, error: string): Promise<TranscodeJob>;

  /** Consulta status de um job. */
  getJobStatus(jobId: string): Promise<TranscodeJob>;

  /** Lista renditions existentes para um conteudo. */
  listRenditions(contentId: string): Promise<TranscodeJob[]>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/19-streaming-reference-spec.md](../docs/caderno-3-sdk/19-streaming-reference-spec.md) S2.2 — Renditions como utilitario compute
- [[rendition]] — Modelo de rendition, manifesto JSON, arestas `RELATES:MEDIA:RENDITION`
- [[content-file]] — `CONTENT:FILE` como blob fisico
- T-STR-01 — MediaCatalog (SPECs e catalogo)
- T-IA-02 — Utilitario compute (infra de fila)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/19-streaming-reference-spec.md` S2.2, S5.3
- **[READ]** `docs/conceitos/rendition.md` — Contrato de rendition
- **[READ]** `apps/nexus-backend/src/modules/streaming/media-catalog.ts` — T-STR-01
- **[CREATE]** `apps/nexus-backend/src/modules/streaming/rendition-types.ts` — Tipos acima
- **[CREATE]** `apps/nexus-backend/src/modules/streaming/rendition-compute.ts` — RenditionComputeQueue
- **[CREATE]** `apps/nexus-backend/src/modules/streaming/rendition-compute.test.ts` — Testes TDD

## 4. Estrategia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro, sem browser)
- [x] **Ambiente do Teste:** Node puro, `pnpm --filter nexus-backend test`
- [x] **Fora de Escopo:** Transcode real (ffmpeg); rede P2P; creditos reais

Casos de teste (numerados):
1. `enqueue` cria `TranscodeJob` com `status: 'pending'` e `estimatedComputeCost > 0`.
2. `claimJob(peerId)` retorna o job mais antigo pendente e marca `status: 'running'`.
3. `claimJob` retorna `null` se fila vazia.
4. `completeJob` marca `status: 'completed'`, associa `resultRenditionId`, e cria `CONTENT` irmao com `RELATES:MEDIA:RENDITION`.
5. `failJob` com `retryCount < maxRetries` re-enfileira (status volta a `pending`, `retryCount++`).
6. `failJob` com `retryCount >= maxRetries` marca `status: 'failed'` definitivo, nao re-enfileira.
7. `failJob` NAO invalida o `CONTENT` original — apenas o job falha.
8. `getJobStatus` retorna estado atual do job.
9. `listRenditions` retorna apenas jobs com `status: 'completed'`.

## 5. Instrucoes de Execucao (Step-by-Step)
> **REGRAS DO QUE NAO FAZER:**
> - **NAO** implemente o transcode real (ffmpeg, etc.) — apenas a fila e o ciclo de vida do job.
> - **NAO** crie `MUTATES` entre renditions — sao irmaos, nao versoes ([[rendition]]).
> - **NAO** invalide o `CONTENT` original quando um job de transcode falha.

### Pegadinhas conhecidas
- **Armadilha:** A falha de um job de transcode nao invalida a rendition (19-streaming S2.2). O orquestrador re-enfileira o job noutro no. O codigo deve distinguir "falha de job" (retry) de "falha permanente" (maxRetries excedido).
- **Armadilha:** `CREDITS` sao proporcionais ao custo computacional medido (19-streaming S5.3). O campo `estimatedComputeCost` e uma estimativa; o valor real e liquidado pelo motor economico (RFC-012) apos medicao. Nao liquide creditos neste modulo — apenas estime.
- **Armadilha:** Renditions sao nos `CONTENT` irmaos do original, ligados por `RELATES:MEDIA:RENDITION`. Nao sao filhos nem versoes — usar `MUTATES` entre elas e proibido.
- **Armadilha:** A fila e assincrona — `enqueue` nao deve bloquear esperando o transcode. O job e criado como `pending` e um peer reclama via `claimJob`.

1. **[TDD]** Escreva `rendition-compute.test.ts` com os 9 casos da Secao 4.
2. Crie `rendition-types.ts` com interfaces da Secao 1.
3. Implemente `rendition-compute.ts` com fila de jobs, ciclo de vida, e re-enfileiramento.
4. Garanta que `completeJob` cria `CONTENT:rendition` como irmao, nao como versao.
5. Rode build + test (Secao 7) e cole saida.

## 6. Feedback de Especificacao (Spec Feedback Loop)
> **DECISOES EM ABERTO — requer definicao do arquiteto:**
> - **Nenhuma.** Contratos derivados de 19-streaming S2.2 e [[rendition]].
> **Status:** `draft` ate o arquiteto validar Secoes 1-4 e 7.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usara esta checklist para aprovar ou rejeitar o PR:
- [ ] O codigo segue estritamente os arquivos de Output especificados?
- [ ] O `pnpm test` roda sem erros (Node puro)?
- [ ] Linter (`pnpm lint`) nao acusa problemas?
- [ ] A implementacao respeita a Regra do Que Nao Fazer?
- [ ] `failJob` re-enfileira abaixo de `maxRetries` e falha definitivo acima?
- [ ] `completeJob` cria `CONTENT` irmao com `RELATES:MEDIA:RENDITION`?

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
- **[2026-07-03T20:03]** - *system* - `[Triado]`: Triagem em lote do backlog
