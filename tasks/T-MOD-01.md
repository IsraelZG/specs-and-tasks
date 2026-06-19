---
id: T-MOD-01
title: "profile de modulo + mensageria de comando (intent duravel enderecado + sinal efemero)"
status: draft
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-004", "T-105"] # Portas (StoragePort) + PeerId (PersonaPeerId para endereçamento de módulo)
blocks: ["T-MOD-02", "T-MOD-03"] # Bloqueia delegação e sessão colaborativa
---

# T-MOD-01 · profile de modulo + mensageria de comando (intent duravel enderecado + sinal efemero)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Package:** `@plataforma/core` (profile de módulo + mensageria)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** sonnet
- **#fontes:** 6 | **link OK:** ✓ — fonte normativa em `docs/caderno-4-governance/02b-modulos-profiles-mensageria.md` §1–§3

## 1. Objetivo
Implementar o perfil de módulo (delegado compartimentado) e o sistema de mensageria de comando: cada par (usuário × módulo) possui um **profile-delegado** próprio escopado por `ASSET:ROLE` restrito aos dados daquele usuário naquele módulo. O módulo como ator recebe dois canais de mensagem: (1) **intent durável endereçado** (`CONTENT:INTENT` persistido no grafo, com `PersonaPeerId` alvo); (2) **sinal efêmero** (mensagem transiente via canal de `ephemeral-messages`, sem persistência). O profile do módulo é derivado do `PROFILE` do usuário mas com escopo reduzido — operações cross-user rodam estritamente com as permissões de leitura do próprio usuário solicitante. **(Fonte: [[profile-de-modulo]]; [[lente-de-modulo]]; [[modulo-lente-e-ator]]; [[delegacao-de-dispositivo]]; T-004 StoragePort; T-105 PeerId/PersonaPeerId)**

> ✓ **Fonte localizada (correção 2026-06-19):** NÃO é lacuna de design. O caderno existe em
> `docs/caderno-4-governance/02b-modulos-profiles-mensageria.md` (§1 dois planos ortogonais; §2
> comando durável vs. efêmero; §3 profiles compartimentados por usuário × módulo) — o link anterior
> apontava `caderno-3-sdk/` por engano. Worker: derive/valide os contratos contra §1–§3.

## 2. Contexto RAG (Spec-Driven Development)
- **[READ]** `docs/caderno-4-governance/02b-modulos-profiles-mensageria.md` §1–§3 — **fonte normativa**: profile-delegado, mensageria de comando (intent durável + sinal efêmero), compartimentação por usuário × módulo
- **[READ]** `docs/conceitos/profile-de-modulo.md` — par (usuário × módulo), escopo por ASSET:ROLE, fonte: caderno-4-governance §3
- **[READ]** `docs/conceitos/lente-de-modulo.md` — módulo como projeção sobre subgrafo compartilhado (plano de dados)
- **[READ]** `docs/conceitos/modulo-lente-e-ator.md` — dois planos: lente (dados) e ator (comando/mensagem)
- **[READ]** `docs/conceitos/delegacao-de-dispositivo.md` — delegação de assinatura, `DELEGATED_TO`, ciclo de vida e revogação
- **[READ]** `packages/protocol/src/ports/storage-port.ts` — `StoragePort` de T-004
- **[READ]** `packages/protocol/src/peer-id.ts` — `DevicePeerId`, `PersonaPeerId` de T-105

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/protocol/src/ports/storage-port.ts` — `StoragePort` (T-004)
- **[READ]** `packages/protocol/src/peer-id.ts` — `PersonaPeerId`, `DevicePeerId` (T-105)
- **[READ]** `packages/protocol/src/content-intent.ts` — tipo base `IntentNode` (se existir)
- **[CREATE]** `packages/core/src/module/profile.ts` — `ModuleProfile`, `createModuleProfile(userId, moduleId, assetRole)`, `resolveModuleProfile()`
- **[CREATE]** `packages/core/src/module/messaging.ts` — `sendIntent(target: PersonaPeerId, payload, spec)`, `sendSignal(target: PersonaPeerId, payload)`
- **[CREATE]** `packages/core/src/module/__tests__/profile.test.ts` — testes de criação e escopo de profile
- **[CREATE]** `packages/core/src/module/__tests__/messaging.test.ts` — testes de intent durável + sinal efêmero
- **[UPDATE]** `packages/core/src/index.ts` — export barrel module
- **FORA DE ESCOPO:** interface de usuário do shell, roteamento de mensagens entre peers (transporte), UCAN (T-501)

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Casos de teste:**
  1. `createModuleProfile(userA, 'erp', role)` cria profile-delegado com `PersonaPeerId` distinto do profile do usuário
  2. Profile de módulo não consegue ler dados de outro usuário no mesmo módulo (escopo restrito ao `userId` dono)
  3. `sendIntent(target, payload, spec)` persiste `CONTENT:INTENT` no grafo com aresta ao profile alvo e `SPEC:WORKFLOW` governante
  4. `sendSignal(target, payload)` entrega mensagem efêmera (não persiste no grafo; desaparece após entrega ou timeout)
  5. Dois módulos (ERP, CRM) do mesmo usuário têm profiles distintos com `PersonaPeerId` diferentes
  6. Revogação de delegação: remover aresta `DELEGATED_TO` → profile de módulo perde capacidade de assinar como o usuário
- [ ] **Fora de Escopo:** testes de integração com transporte (WebRTC), UI, UCAN scope enforcement

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO criar profile de sistema global com acesso irrestrito — cada (usuário × módulo) tem seu próprio delegado
> - NÃO permitir que um profile de módulo do usuário A leia dados do usuário B (escopo estrito)
> - NÃO persistir sinais efêmeros no grafo — são transientes, desaparecem após entrega ou timeout

### Pegadinhas conhecidas
- **PersonaPeerId do módulo ≠ PersonaPeerId do usuário:** o profile de módulo é um delegado com identidade derivada, não uma segunda persona do usuário. Deriva de `blake2s256(pubkey_modulo || pubkey_usuario)` — não reusar o PeerId do usuário.
- **Intent duravel vs sinal efêmero:** o intent é um nó no grafo (com HLC, assinatura, arestas); o sinal é uma mensagem em canal volátil. NÃO tipar ambos como o mesmo tipo — use `IntentMessage` vs `SignalMessage` com contratos separados.
- **Escopo por ASSET:ROLE:** o `ASSET:ROLE` que escopa o módulo NÃO é o mesmo que o cargo do usuário na organização. O ROLE do módulo define quais permissões de grafo o delegado possui (leitura de nós de ERP, escrita de intents de CRM, etc.).
- **Delegação, não identidade:** o módulo fala PELO usuário (aresta `DELEGATED_TO`), não COMO usuário. A assinatura do módulo é válida apenas no escopo do `ASSET:ROLE` delegado.

1. **[TDD]** `packages/core/src/module/__tests__/profile.test.ts`: cenários 1, 2, 5, 6
2. **[IMPL]** `packages/core/src/module/profile.ts`: `ModuleProfile`, `createModuleProfile()`, `resolveModuleProfile()`, `revokeDelegation()`
3. **[TDD]** `packages/core/src/module/__tests__/messaging.test.ts`: cenários 3, 4
4. **[IMPL]** `packages/core/src/module/messaging.ts`: `sendIntent()`, `sendSignal()`
5. **[REFACTOR]** Garantir que `sendIntent` usa `StoragePort` para persistência e `sendSignal` usa canal efêmero (mock no teste)

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões resolvidas pelo Arquiteto:**
> - Contexto RAG: conceitos canônicos (`profile-de-modulo`, `lente-de-modulo`, `modulo-lente-e-ator`, `delegacao-de-dispositivo`) — fonte `caderno-4-governance/02b-modulos-profiles-mensageria.md` referenciada mas não localizada no filesystem
> - Escopo: `packages/core/src/module/` — 2 arquivos fonte, 2 arquivos de teste, 1 update
> - Contratos: `ModuleProfile`, `createModuleProfile()`, `sendIntent()`, `sendSignal()`
> - Testes: 6 cenários Vitest (Node puro)
> - Gate: `pnpm --filter @plataforma/core build && pnpm --filter @plataforma/core test`
> - #aberto: 0

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] Profile de módulo é escopado por (usuário × módulo) e não acessa dados de outros usuários?
- [ ] Intent é persistido como `CONTENT:INTENT` no grafo; sinal é transiente (não persiste)?
- [ ] Revogação de delegação (aresta lápide em `DELEGATED_TO`) bloqueia assinaturas futuras do módulo?
- [ ] `pnpm lint` não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

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
