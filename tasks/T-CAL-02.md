---
id: T-CAL-02
title: "convites/RSVP + capacidade por reserva_capacidade + render Timeline"
status: draft:triaged
complexity: 3
target_agent: frontend_agent # UI task — Playwright obrigatório
reviewer_agent: agile_reviewer
execution_mode: sequential
ui: true
dependencies: ["T-CAL-01", "T-210"] # SPEC:EVENT (evento base) + ASSET:INVITE (cerimônia de convite)
blocks: [] # task final do bloco
---

# T-CAL-02 · convites/RSVP + capacidade por reserva_capacidade + render Timeline

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Package:** `apps/nexus-frontend` (UI + lógica de RSVP) + `@plataforma/core` (RSVP como intent)
- **Test Runner:** `vitest` (lógica de RSVP, Node puro) + `playwright` (E2E da Timeline, headless browser)
- **Capacidade-alvo:** sonnet
- **ui:** true | **#fontes:** 5 | **link OK:** ✓ | **SEM-FONTE:** N/A

## 1. Objetivo
Implementar fluxo completo de convites e RSVP para eventos de calendário: (1) emissão de convite via aresta ao `PROFILE` do convidado + notificação; (2) RSVP como `CONTENT:INTENT` do convidado (aceito/recusado/talvez); (3) reserva de capacidade limitada (vagas/sala) via `reserva_capacidade` do RFC-012 A.2; (4) renderização da Timeline com eventos, recorrências projetadas e indicadores visuais de RSVP. Lógica de RSVP no core reusa `ASSET:INVITE` de T-210 como padrão de cerimônia. UI consome `Timeline` engine para renderizar instâncias virtuais. **(Fonte: [[22-calendario-reference-spec]] §3; [[asset-invite]]; [[spec-workflow]] para RSVP como máquina de estados; T-CAL-01 SPEC:EVENT base; T-210 ASSET:INVITE cerimônia)**

## 2. Contexto RAG (Spec-Driven Development)
- **[READ]** `docs/caderno-3-sdk/22-calendario-reference-spec.md` §3 — participantes, convites, RSVP, capacidade
- **[READ]** `docs/conceitos/asset-invite.md` — cerimônia de convite: payload, consumo, lápide
- **[READ]** `docs/conceitos/spec-workflow.md` — RSVP modelado como SPEC:WORKFLOW (máquina de estados: invited → accepted/declined/tentative)
- **[READ]** `docs/conceitos/content-intent.md` — intent como nó de comando para RSVP
- **[READ]** `packages/core/src/invite.ts` — `createInvite()`, `consumeInvite()` de T-210

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/core/src/calendar/spec-event.ts` — `SpecEvent`, criações de evento (T-CAL-01)
- **[READ]** `packages/core/src/calendar/recurrence.ts` — `expandRRULE()`, `applyOverrides()` (T-CAL-01)
- **[READ]** `packages/core/src/invite.ts` — `InvitePayload`, `createInvite()`, `consumeInvite()` (T-210)
- **[CREATE]** `packages/core/src/calendar/rsvp.ts` — `createRSVPIntent()`, `RsvpState` enum (accepted/declined/tentative), `reserveCapacity()`
- **[CREATE]** `packages/core/src/calendar/__tests__/rsvp.test.ts` — testes de lógica de RSVP
- **[CREATE]** `apps/nexus-frontend/src/components/calendar/Timeline.tsx` — componente de renderização da Timeline
- **[CREATE]** `apps/nexus-frontend/src/components/calendar/EventCard.tsx` — card de evento com indicadores de RSVP
- **[CREATE]** `apps/nexus-frontend/src/components/calendar/InviteDialog.tsx` — diálogo de convite
- **[CREATE]** `apps/nexus-frontend/e2e/calendar-rsvp.spec.ts` — teste E2E Playwright
- **FORA DE ESCOPO:** sync externo (.ics), CRUD de evento (T-CAL-01), notificações push

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (lógica RSVP, Node puro) + Playwright (E2E Timeline, headless)
- [x] **Casos de teste Vitest:**
  1. `createRSVPIntent(eventId, profileId, 'accepted')` gera CONTENT:INTENT com aresta ao evento
  2. RSVP `declined` libera vaga em `reserveCapacity()` para o próximo da fila
  3. `reserveCapacity(eventId, slots)` retorna `false` quando lotado (capacidade excedida)
  4. RSVP duplicado do mesmo profile para mesmo evento → rejeitado (idempotência por event+profile)
  5. Transição de `tentative` → `accepted` consome vaga; `tentative` → `declined` libera
- [x] **Casos de teste Playwright (E2E):**
  6. Timeline renderiza eventos com instâncias virtuais de recorrência (verificar 5 semanas visíveis)
  7. Card de evento mostra contador de RSVP (X aceitos de Y vagas)
  8. Dialog de convite envia aresta de convite ao profile selecionado
  9. Override de cancelamento aparece riscado na Timeline (sem remover da lista)
- [ ] **Fora de Escopo:** testes de notificação push, renderização de .ics importado

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implementar lógica de RSVP no componente React — deve delegar ao `createRSVPIntent()` do core
> - NÃO usar estado local para capacidade — `reserveCapacity()` consulta o grafo
> - NÃO criar tipo de nó novo para RSVP — é `CONTENT:INTENT` governado por SPEC:WORKFLOW

### Pegadinhas conhecidas
- **RSVP como Intent, não Event:** o RSVP é um `CONTENT:INTENT` do convidado, não uma mutação do evento. Confundir os dois gera acoplamento que quebra o modelo append-only.
- **Corrida de capacidade:** `reserveCapacity()` precisa ser atômico no grafo (último slot preenchido simultaneamente por 2 perfis → um ganha, outro recebe `false`). Testar explicitamente.
- **Timeline + virtual instances:** a Timeline consome `expandRRULE()` do T-CAL-01 mas NÃO deve reimplementar a lógica de projeção — chamar a função exportada.
- **Playwright + instâncias virtuais:** o teste E2E precisa esperar a projeção terminar (usar `waitFor` com seletor de data, não `sleep` fixo).

1. **[TDD-Vitest]** `packages/core/src/calendar/__tests__/rsvp.test.ts`: 5 cenários
2. **[IMPL]** `packages/core/src/calendar/rsvp.ts`: `RsvpState`, `createRSVPIntent()`, `reserveCapacity()`
3. **[TDD-Playwright]** `apps/nexus-frontend/e2e/calendar-rsvp.spec.ts`: 4 cenários E2E
4. **[IMPL-UI]** `apps/nexus-frontend/src/components/calendar/Timeline.tsx`: grid semanal/mensal com `expandRRULE()`
5. **[IMPL-UI]** `apps/nexus-frontend/src/components/calendar/EventCard.tsx`: evento + RSVP indicators
6. **[IMPL-UI]** `apps/nexus-frontend/src/components/calendar/InviteDialog.tsx`: seletor de profile + disparo de aresta
7. **[REFACTOR]** Garantir que lógica de RSVP e UI são desacopladas (core exporta funções, frontend só renderiza)

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões resolvidas pelo Arquiteto:**
> - Contexto RAG: `22-calendario-reference-spec.md` §3 + `asset-invite` + `spec-workflow`
> - Escopo: `packages/core/src/calendar/rsvp.ts` + `apps/nexus-frontend/src/components/calendar/` + E2E
> - Contratos: `RsvpState`, `createRSVPIntent()`, `reserveCapacity()`, componentes Timeline/EventCard/InviteDialog
> - Testes: 5 Vitest + 4 Playwright E2E
> - Gate: `pnpm --filter @plataforma/core build && pnpm --filter @plataforma/core test && pnpm --filter nexus-frontend playwright test`
> - #aberto: 0

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] `pnpm --filter @plataforma/core test` (Vitest) verde nos 5 cenários RSVP?
- [ ] `pnpm --filter nexus-frontend playwright test` (E2E) verde nos 4 cenários Timeline/RSVP?
- [ ] Lógica de RSVP no core é agnóstica de UI (sem imports de React)?
- [ ] Componentes Timeline consomem `expandRRULE()` de T-CAL-01 sem reimplementar?
- [ ] `pnpm lint` não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/core build      # tsc core — precisa terminar sem erro
pnpm --filter @plataforma/core test       # Vitest: 5 cenários RSVP
pnpm --filter nexus-frontend playwright test -- calendar-rsvp  # E2E Playwright
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
