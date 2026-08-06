---
id: T-CN-04
title: "persona agente-de-sistema por conector com ASSET:ROLE escopado + vetor"
status: draft:triaged
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-CN-01"]
blocks: []
capacity_target: sonnet
---

# T-CN-04 · persona agente-de-sistema por conector com ASSET:ROLE escopado + vetor

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar persona [[agente-de-sistema]] por conector: conectores classes C e D atuam como `PROFILE:SYSTEM` com `ASSET:ROLE` próprio, escopando o que podem ler/afirmar no grafo. Tudo que o conector publica é assinado por essa persona. Vetor adversarial: conector tenta afirmar fora do escopo → rejeição pelo validador.
**Fonte:** `caderno-3-sdk/06-connectors.md §1.2`. **Conceitos:** [[agente-de-sistema]], [[conector-externo]].

### Contratos essenciais

```ts
// packages/connectors/src/system-agent-persona.ts
export interface SystemAgentPersona { personaId: string; // PROFILE:SYSTEM
  roleId: string; // ASSET:ROLE
  scope: { readableNodeTypes: string[]; writableNodeTypes: string[]; maxAffirmationsPerHour: number; }; }
export function createConnectorPersona(connectorId: string, connectorClass: 'C'|'D'): SystemAgentPersona;
export interface ScopedAffirmation { persona: SystemAgentPersona; fact: Record<string, unknown>; }
export function validateAffirmation(affirmation: ScopedAffirmation): { valid: boolean; reason?: string; };
```
**File paths:** `packages/connectors/src/system-agent-persona.ts` (CREATE), `packages/connectors/tests/system-agent-persona.test.ts` (CREATE), `packages/connectors/src/index.ts` (UPDATE).

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/06-connectors.md](../docs/caderno-3-sdk/06-connectors.md) — §1.2 (identidade: persona SYSTEM + ASSET:ROLE escopado, auditabilidade)
- [[agente-de-sistema]] — definição completa, orquestração vs afirmação
- Deps: T-CN-01 (`ConnectorId`)

**Testes (6 casos):** 1. `createConnectorPersona` classe C → scope com `writableNodeTypes` não vazio. 2. Classe A → sem persona (dispensável). 3. `validateAffirmation` dentro do scope → `valid: true`. 4. Afirmação fora do scope → `valid: false`. 5. `maxAffirmationsPerHour` excedido → `valid: false`. 6. Vetor: conector tenta afirmar `BALANCE_STATE` sem `writableNodeTypes` contendo → rejeitado.

**Pegadinhas:** Classes A/B/E não têm persona (só C/D). `ASSET:ROLE` é escopado por tipo de nó — não por ID de nó.

**Gate:** `pnpm --filter @plataforma/connectors build && pnpm --filter @plataforma/connectors test`

## 6. Feedback de Especificação (Spec Feedback Loop)
> **RESOLVIDO (era DECISÃO EM ABERTO citando T-009a/ControlPort — fóssil):** T-009a (`ControlPort`,
> pacote `@plataforma/core`) está `obsolete` — escopo `ControlPort`/`WebSocketControlClient`
> descartado pelo arquiteto em `tasks/T-009.md` §6 [OPEN-1] (2026-06-21: "descartado, não foi
> movido para outra task"); confirmado no Log §9 de `tasks/T-009a.md`
> (`[2026-07-27T18:14] claude-haiku — [Obsoleto]`). Não existe, nem vai existir por essa via, uma
> "interface de comando" ControlPort para o system-peer.
>
> A pergunta real que sobrevive ao fóssil — *qual interface o `system-peer` usa para receber
> comando do conector persona* — **não se aplica a este contrato**: por
> `caderno-3-sdk/06-connectors.md §1` ponto 1, "conector é capacidade do [[peer-do-sistema]], nunca
> do core (...) Cada conector é um processo/worker isolado no system-peer" — o conector roda
> *dentro* do processo do system-peer, não fala com ele por um canal de comando externo. Isso bate
> com o contrato já fixado na Seção 1 desta task: `createConnectorPersona` e `validateAffirmation`
> (`packages/connectors/src/system-agent-persona.ts`) são funções puras — sem import de rede, sem
> dependência de porta de controle — logo não há gap deixado pela obsolescência de T-009a/ControlPort
> a preencher. Nenhuma decisão de arquiteto é necessária neste eixo.
>
> **Status:** segue `draft:triaged` (endurecimento profundo pass-2 não é objeto desta limpeza).


## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `createConnectorPersona` gera persona com `ASSET:ROLE` escopado?
- [ ] `validateAffirmation` bloqueia afirmações fora do scope?
- [ ] Classes A/B/E dispensam persona corretamente?
- [ ] Vetor: conector tenta afirmar fora do escopo → rejeitado?
- [ ] `pnpm --filter @plataforma/connectors build` e `test` verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/connectors build
pnpm --filter @plataforma/connectors test
```
> **GATE DE EVIDÊNCIA:** Worker cola a saída literal na Seção 8.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
