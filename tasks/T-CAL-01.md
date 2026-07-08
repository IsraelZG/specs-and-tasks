---
id: T-CAL-01
title: "SPEC:EVENT + recorrencia RRULE com instancias virtuais + override de excecao"
status: ready
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-004", "T-103"] # Portas (ClockPort) + HLC para ordenação de recorrência
blocks: ["T-CAL-02", "T-CAL-03"] # Bloqueia convites/RSVP e sync externo
capacity_target: sonnet
---

# T-CAL-01 · SPEC:EVENT + recorrencia RRULE com instancias virtuais + override de excecao

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Package:** `@plataforma/core` (calendar engine + SPEC:EVENT + recorrência)
- **Test Runner:** `vitest` (Node puro — sem browser)
- **Capacidade-alvo:** sonnet
- **#fontes:** 5 | **link OK:** ✓ | **SEM-FONTE:** N/A

## 1. Objetivo
Implementar `SPEC:EVENT` — a specification node que governa eventos de calendário — com recorrência RRULE no payload (frequência, intervalo, expiração), projeção de instâncias virtuais pela engine `Timeline`, e nó de override append-only (exceção referenciando mestre + data). Zero tipo de nó novo: evento é `CONTENT:EVENT` governado por `SPEC:EVENT`; recorrência é resolvida no payload, não em tipo novo. Justificativa: o modelo virtual-projection é a decisão de design que mantém o grafo minimalista (1 nó mestre em vez de N ocorrências materializadas). **(Fonte: [[22-calendario-reference-spec]] §1–§2; [[recorrencia]]; [[hlc]]; T-103 ClockPort; T-004 portas)**

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B11 + §T2](../docs/mecanica-de-telas.md) — a mecânica de instâncias virtuais + exceções desta task já foi validada em mockup (janela por visão, override por `eventId+data`, prompt "esta ocorrência vs série"). Integração (§T2): `calendar:event` é payload de drag/share (evento → chat = convite) e **alvo** de payloads (`email:message` → criar evento com trecho citado; `map:place` → preencher local). Assistente (§T1): agendamento por linguagem natural cria evento como proposta.
- **[READ]** `docs/caderno-3-sdk/22-calendario-reference-spec.md` — fonte normativa: evento, recorrência, exceções (§1–§2)
- **[READ]** `docs/conceitos/recorrencia.md` — definição canônica: RRULE + instâncias virtuais + override
- **[READ]** `docs/conceitos/hlc.md` — HLC para ordenação causal de eventos recorrentes
- **[READ]** `docs/conceitos/content.md` — ontologia CONTENT (placeholder; fonte real: `caderno-2-protocol/01-graph-ontology.md §3.2`)
- **[READ]** `docs/conceitos/specification.md` — ontologia SPECIFICATION (placeholder; fonte real: `caderno-2-protocol/01-graph-ontology.md §3.4`)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/protocol/src/ports/clock-port.ts` — `ClockPort` de T-004 (interface de relógio)
- **[READ]** `packages/core/src/hlc.ts` — `HybridLogicalClock` de T-103 (`now()`, `update()`, `compare()`, `pack()`, `unpack()`)
- **[READ]** `packages/core/src/node.ts` — `ContentNode`, `SpecificationNode` base types
- **[CREATE]** `packages/core/src/calendar/spec-event.ts` — `SpecEvent` (payload: início/fim/fuso/local, RRULE opcional)
- **[CREATE]** `packages/core/src/calendar/event-node.ts` — `createEventNode()`, `createOverrideNode()` (nó CONTENT:EVENT + nó override append-only)
- **[CREATE]** `packages/core/src/calendar/recurrence.ts` — `expandRRULE(rrule, start, end): Date[]`, `applyOverrides()`
- **[UPDATE]** `packages/core/src/index.ts` — export calendar barrel
- **FORA DE ESCOPO:** Timeline rendering (T-CAL-02), sync externo (T-CAL-03), convites/RSVP (T-CAL-02)

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Casos de teste:**
  1. `createEventNode` gera nó `CONTENT:EVENT` governado por SPEC:EVENT com HLC monotônico
  2. RRULE FREQ=WEEKLY;BYDAY=MO,WE;COUNT=10 expande 10 instâncias no intervalo correto (sem DST skew)
  3. RRULE FREQ=MONTHLY;BYMONTHDAY=31 projeta corretamente com skip de meses curtos (abril/junho/setembro/novembro)
  4. Override de cancelamento: `createOverrideNode(masterId, date, {cancelled: true})` suprime instância específica da projeção
  5. Override de movimento: instância deslocada em 2h aparece na projeção com novo horário, mestre intacto
  6. HLC do filho (override) é estritamente > HLC do mestre (invariante de pai; rejeita se ≤)
  7. RRULE sem COUNT nem UNTIL: projeção sob demanda no range solicitado (não materializa infinito)
- [ ] **Fora de Escopo:** renderização Timeline, UI, sync externo

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO criar tipo de nó novo — evento é `CONTENT:EVENT`
> - NÃO materializar ocorrências como nós — são projeções virtuais
> - NÃO mutar o nó mestre para registrar exceção — override é nó append-only separado

### Pegadinhas conhecidas
- **DST/fuso:** `expandRRULE` deve delegar ao `ClockPort` para conversão de timezone; NÃO assumir UTC fixo nem offset constante. Usar `Intl.DateTimeFormat` com `timeZone` do evento.
- **RRULE BYMONTHDAY=31:** meses com menos de 31 dias devem pular (comportamento RFC 5545 §3.3.10). Sem skip → regressão em abril/junho/setembro/novembro.
- **Override sem mestre:** validar que `overrideOf` referencia nó `CONTENT:EVENT` existente governado por `SPEC:EVENT`; rejeitar override órfão.
- **HLC na borda:** override criado com HLC ≤ mestre é **malformado** (invariante de pai do HLC). Validar antes de persistir.

1. **[TDD]** `packages/core/src/calendar/__tests__/spec-event.test.ts`: teste de criação de nó com payload SPEC:EVENT
2. **[TDD]** `packages/core/src/calendar/__tests__/recurrence.test.ts`: todos os 7 cenários acima
3. **[IMPL]** `packages/core/src/calendar/spec-event.ts`: type `SpecEventPayload` (start, end, tz, location?, rrule?)
4. **[IMPL]** `packages/core/src/calendar/recurrence.ts`: `expandRRULE()` + `applyOverrides()` consumindo HLC
5. **[IMPL]** `packages/core/src/calendar/event-node.ts`: fábricas `createEventNode()` e `createOverrideNode()`
6. **[REFACTOR]** Garantir que overrides são `CONTENT` com `overrideOf : entity_id` apontando ao mestre

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões resolvidas pelo Arquiteto:**
> - Contexto RAG: `22-calendario-reference-spec.md` §1–§2 + conceitos `recorrencia` + `hlc`
> - Escopo: `packages/core/src/calendar/` — 3 arquivos novos, 1 update
> - Contratos: `SpecEventPayload`, `createEventNode()`, `createOverrideNode()`, `expandRRULE()`
> - Testes: 7 cenários Vitest (Node puro)
> - Gate: `pnpm --filter @plataforma/core build && pnpm --filter @plataforma/core test`
> - #aberto: 0

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node puro, Vitest)?
- [ ] `expandRRULE` passa nos 7 cenários de teste da Seção 4?
- [ ] Override valida invariante HLC (filho > mestre) e referência a SPEC:EVENT?
- [ ] `pnpm lint` não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer (sem tipo novo, sem materialização, sem mutação)?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/core build      # tsc — precisa terminar sem erro
pnpm --filter @plataforma/core test       # precisa ficar verde, sem regressão
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

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
- **[2026-07-03T20:03]** - *system* - `[Endurecido]`: Endurecimento em lote (dependencies done/empty)
- **[2026-07-03T20:07]** - *system* - `[Promovida p/ ready]`: Promovida pelo arquiteto (arquiteto-promover)
