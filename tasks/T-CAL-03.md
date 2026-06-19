---
id: T-CAL-03
title: "sync externo Classe D + .ics por email + vetores"
status: draft
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-CAL-01", "T-308", "T-CN-02"] # SPEC:EVENT + Snapshot (.ics export) + pipeline tradução (idempotência external_ref)
blocks: [] # task final do bloco
---

# T-CAL-03 · sync externo Classe D + .ics por email + vetores

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Package:** `@plataforma/connectors` (conector Classe D calendar + .ics export)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet
- **#fontes:** 6 | **link OK:** ✓ | **SEM-FONTE:** N/A

## 1. Objetivo
Implementar conector Classe D (espelho bidirecional) para Google Calendar/Microsoft: (1) ingestão assinada de eventos externos com `external_ref` para dedup determinístico (via T-CN-02 pipeline); (2) exportação de eventos e overrides locais de volta ao provedor (bidirecional com supressão de eco); (3) geração de `.ics` (RFC 5545) para convites por email com snapshot de bootstrap (T-308); (4) vetores de segurança: (a) eco de reimportação detectado e suprimido por `external_ref`, (b) tombstone de exceção deletada propagado ao provedor externo, (c) evento externo não sobrescreve override local (precedência: local > externo). **(Fonte: [[22-calendario-reference-spec]] §4–§5; [[recorrencia]]; [[conector-externo]] classe D; T-CAL-01 SPEC:EVENT; T-308 snapshot; T-CN-02 pipeline de tradução)**

## 2. Contexto RAG (Spec-Driven Development)
- **[READ]** `docs/caderno-3-sdk/22-calendario-reference-spec.md` §4–§5 — sincronização externa, .ics, limites honestos
- **[READ]** `docs/conceitos/conector-externo.md` — taxonomia de classes, Classe D = espelho bidirecional
- **[READ]** `docs/conceitos/recorrencia.md` — exportação de overrides como atualizações pontuais
- **[READ]** `packages/connectors/src/translation-pipeline.ts` — `external_ref`, idempotência de T-CN-02
- **[READ]** `packages/core/src/snapshot.ts` — `exportSnapshot()`, `importSnapshot()` de T-308
- **[READ]** `packages/core/src/calendar/spec-event.ts` — `SpecEvent`, formatos de evento (T-CAL-01)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/connectors/src/translation-pipeline.ts` — `TranslationPipeline`, `ExternalRef` (T-CN-02)
- **[READ]** `packages/core/src/snapshot.ts` — `exportSnapshot()` (T-308)
- **[READ]** `packages/core/src/calendar/spec-event.ts` — `SpecEventPayload` (T-CAL-01)
- **[READ]** `packages/core/src/calendar/recurrence.ts` — `expandRRULE()` (T-CAL-01)
- **[CREATE]** `packages/connectors/src/calendar/ics-codec.ts` — `eventToIcs()`, `icsToEvent()` (RFC 5545 ↔ SPEC:EVENT)
- **[CREATE]** `packages/connectors/src/calendar/class-d-connector.ts` — `CalendarMirrorConnector` (Classe D: ingestão + exportação + supressão de eco)
- **[CREATE]** `packages/connectors/src/calendar/__tests__/ics-codec.test.ts` — testes de roundtrip .ics
- **[CREATE]** `packages/connectors/src/calendar/__tests__/class-d-connector.test.ts` — testes de sync bidirecional
- **[UPDATE]** `packages/connectors/src/index.ts` — export barrel calendar
- **FORA DE ESCOPO:** implementação real de Google CalDAV API / Microsoft Graph API (usar mocks com contrato documentado); UI de configuração de conta externa

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Casos de teste:**
  1. `eventToIcs(SpecEvent)` gera .ics RFC 5545 válido com VEVENT, DTSTART, DTEND, RRULE, EXDATE (override cancelado)
  2. `icsToEvent(.ics string)` produz `SpecEventPayload` com `external_ref` preenchido (UID do .ics)
  3. Roundtrip: `icsToEvent(eventToIcs(event))` preserva todos os campos (idempotente)
  4. Classe D: ingestão de evento externo novo → cria nó CONTENT:EVENT com `external_ref`; reingestão com mesmo `external_ref` → no-op (supressão de eco)
  5. Classe D: override local (mover ocorrência 2h) → exporta EXDATE + VEVENT modificado para o provedor
  6. Classe D: evento deletado no provedor → tombstone local (aresta lápide), não deleta nó
  7. Vetor: evento externo chega depois de override local → override local prevalece (não sobrescreve)
  8. Vetor: .ics com RRULE complexa (FREQ=MONTHLY;BYDAY=2TU) faz roundtrip sem perda
- [ ] **Fora de Escopo:** testes de integração real com Google/Microsoft API

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implementar chamadas reais a Google Calendar API / Microsoft Graph — usar interfaces + mocks
> - NÃO criar formato proprietário de .ics — seguir RFC 5545 estritamente
> - NÃO sobrescrever override local com dado externo (precedência: local > externo)

### Pegadinhas conhecidas
- **Supressão de eco circular:** evento importado do Google → modificado localmente → exportado de volta → reimportado. O `external_ref` no pipeline de T-CN-02 é a única defesa. Sem ele, cada sync gera duplicata. Verificar que o `external_ref` do .ics (UID) casa com o do nó.
- **Tombstone, não DELETE:** provedor externo deleta evento → NÃO deletar o nó local. Emitir aresta lápide (tombstone). Recriação no provedor com mesmo UID → reativar nó (remover lápide).
- **Timezone em .ics:** `DTSTART;TZID=America/Sao_Paulo` deve ser traduzido corretamente para o campo `tz` do `SpecEventPayload`. Sem timezone, DST quebra projeção de recorrência.
- **EXDATE vs override:** uma exceção de cancelamento local vira EXDATE no .ics exportado. Uma exceção de movimento local vira EXDATE da data original + VEVENT separado na nova data. NÃO confundir os dois formatos.

1. **[TDD]** `packages/connectors/src/calendar/__tests__/ics-codec.test.ts`: cenários 1, 2, 3, 8
2. **[IMPL]** `packages/connectors/src/calendar/ics-codec.ts`: `eventToIcs()`, `icsToEvent()`
3. **[TDD]** `packages/connectors/src/calendar/__tests__/class-d-connector.test.ts`: cenários 4–7
4. **[IMPL]** `packages/connectors/src/calendar/class-d-connector.ts`: `CalendarMirrorConnector` com `ingest()`, `export()`, `suppressEcho()`
5. **[REFACTOR]** Garantir que pipeline de T-CN-02 é chamado para dedup, não reimplementado

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões resolvidas pelo Arquiteto:**
> - Contexto RAG: `22-calendario-reference-spec.md` §4–§5 + `conector-externo` + `recorrencia`
> - Escopo: `packages/connectors/src/calendar/` — 2 arquivos novos, 2 testes, 1 update
> - Contratos: `eventToIcs()`, `icsToEvent()`, `CalendarMirrorConnector` (ingest/export/suppressEcho)
> - Testes: 8 cenários Vitest (Node puro)
> - Gate: `pnpm --filter @plataforma/connectors build && pnpm --filter @plataforma/connectors test`
> - #aberto: 0

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] `.ics` codec faz roundtrip sem perda (8 cenários)?
- [ ] Classe D suprime eco por `external_ref` e respeita precedência local > externo?
- [ ] Tombstone emitido para evento deletado no provedor (nunca DELETE físico)?
- [ ] `pnpm lint` não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer (sem API real, sem formato proprietário, sem sobrescrever override)?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/connectors build      # tsc — precisa terminar sem erro
pnpm --filter @plataforma/connectors test       # precisa ficar verde, sem regressão
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
