---
id: T-MOD-04
title: "vetores: delegado lendo dado de outro usuario, comando acima do privilegio, sessao efemera sem opt-in"
status: draft
complexity: 2
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-MOD-01", "T-MOD-02", "T-MOD-03"] # testa violações contra as 3 tasks base
blocks: [] # task final do bloco — fecha a cadeia
---

# T-MOD-04 · vetores: delegado lendo dado de outro usuario, comando acima do privilegio, sessao efemera sem opt-in

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Package:** `@plataforma/core` (testes de vetor — não adiciona features, só testes de segurança)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** haiku
- **#fontes:** 4 | **link OK:** ✓ — fonte normativa em `docs/caderno-4-governance/02b-modulos-profiles-mensageria.md` §2, §5

## 1. Objetivo
Implementar **apenas testes de vetor de ataque** — esta task NÃO adiciona funcionalidade nova, apenas prova que os sistemas de T-MOD-01, T-MOD-02 e T-MOD-03 rejeitam corretamente violações de segurança. Três vetores: (1) **delegado lendo dado de outro usuário**: profile de módulo do userA no módulo ERP tenta ler nó `CONTENT:INTENT` do userB — deve ser rejeitado pelo enforcement de escopo de T-MOD-02; (2) **comando acima do privilégio**: módulo com UCAN de leitura tenta emitir `CONTENT:INTENT` de escrita — rejeitado pela validação de capability; (3) **sessão efêmera sem opt-in**: tentar recuperar documento de sessão que foi descartada (`discardSession()`) ou nunca commitada — deve retornar `null`/vazio. **(Fonte: T-MOD-01 profile escopo; T-MOD-02 validateCrossUserOp; T-MOD-03 sessão efêmera)**

> ✓ **Fonte localizada (correção 2026-06-19):** NÃO é lacuna de design. Os limites honestos que os
> vetores exercitam (mensagem só propõe, sem god-mode; compartimentação; sinal só via registry) estão
> em `docs/caderno-4-governance/02b-modulos-profiles-mensageria.md` §2 e §5 — o link anterior apontava
> `caderno-3-sdk/` por engano. Worker: confira os vetores contra §2/§5 além de T-MOD-01/02/03.

## 2. Contexto RAG (Spec-Driven Development)
- **[READ]** `docs/caderno-4-governance/02b-modulos-profiles-mensageria.md` §2, §5 — **fonte normativa**: comando durável/efêmero e limites honestos (mensagem propõe, pipeline recusa)
- **[READ]** `packages/core/src/module/profile.ts` — `ModuleProfile`, `resolveModuleProfile()` (T-MOD-01)
- **[READ]** `packages/core/src/module/delegation.ts` — `validateCrossUserOp()` (T-MOD-02)
- **[READ]** `packages/core/src/module/session.ts` — `createSession()`, `commitSession()`, `discardSession()` (T-MOD-03)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/core/src/module/profile.ts` — T-MOD-01
- **[READ]** `packages/core/src/module/delegation.ts` — T-MOD-02
- **[READ]** `packages/core/src/module/session.ts` — T-MOD-03
- **[CREATE]** `packages/core/src/module/__tests__/security-vectors.test.ts` — ÚNICO arquivo novo: testes de violação
- **FORA DE ESCOPO:** correção de bugs encontrados (reportar na Seção 8, não corrigir nesta task), novos vetores além dos 3 listados

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Casos de teste (apenas vetores de violação — cada teste espera REJEIÇÃO):**
  1. **Vetor 1a:** `ModuleProfile` do userA no módulo ERP chama `resolveModuleProfile(userB, 'erp')` → rejeitado (escopo não cobre userB)
  2. **Vetor 1b:** UCAN do módulo ERP/userA é usado para ler nó de `CONTENT:INTENT` de userB no mesmo módulo → `validateCrossUserOp()` rejeita (sem permissão cross-user)
  3. **Vetor 1c:** Operação cross-user sem `edge_filter` no UCAN (depth > 1) → rejeitado (invariante de traversal profundo)
  4. **Vetor 2a:** Módulo com UCAN `read-only` tenta `sendIntent()` de escrita → rejeitado (capability insuficiente)
  5. **Vetor 2b:** Módulo com UCAN escopado a ERP tenta acessar nó de CRM → rejeitado (módulo errado para o escopo)
  6. **Vetor 2c:** UCAN expirado ou revogado (aresta lápide no `ASSET:ROLE`) → rejeitado na validação
  7. **Vetor 3a:** `commitSession()` chamada em sessão já descartada (`discardSession()`) → lança erro ou no-op
  8. **Vetor 3b:** Tentar carregar documento de `sessionId` que nunca recebeu `commitSession()` → retorna null
- [ ] **Fora de Escopo:** vetores de rede (spoofing de DevicePeerId, replay attack, MITM no WebRTC), UI vectors

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implementar correções de bugs — se um teste revelar falha, reportar na Seção 8 e marcar `[ ]` no checklist
> - NÃO criar novas funções de enforcement — apenas testar as que T-MOD-01/02/03 já expõem
> - NÃO adicionar vetores de ataque de rede/criptografia — escopo é lógica de módulo

### Pegadinhas conhecidas
- **Setup de teste correto:** cada teste precisa configurar o estado inicial (criar profiles, emitir UCANs, iniciar sessões) usando as funções de T-MOD-01/02/03. Se o setup estiver errado, o teste pode passar por razão errada (ex: UCAN malformado rejeitado por parse, não por enforcement).
- **Esperar rejeição, não exceção genérica:** usar `expect().rejects.toThrow()` com mensagem específica (ex: "cross-user access denied for module"). Se o código lança `TypeError` por motivo não relacionado, o teste está passando falso-positivo.
- **Vetor 2a vs 2b:** são sutis — 2a testa capability (read vs write), 2b testa escopo de módulo (ERP vs CRM). Garantir que os setups são distintos.

1. **[TDD]** `packages/core/src/module/__tests__/security-vectors.test.ts`: todos os 8 cenários
2. **[EXECUTAR]** Rodar `pnpm --filter @plataforma/core test` e verificar se todos os vetores são rejeitados
3. **[REPORTAR]** Na Seção 8, listar quais vetores passaram (rejeição correta) e quais revelaram falha (violação aceita indevidamente)

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões resolvidas pelo Arquiteto:**
> - Contexto RAG: contratos de T-MOD-01/02/03 (caderno fonte não localizado)
> - Escopo: `packages/core/src/module/__tests__/security-vectors.test.ts` — 1 arquivo, APENAS testes
> - Contratos: nenhum novo — consome `ModuleProfile`, `validateCrossUserOp()`, `createSession()/commitSession()/discardSession()`
> - Testes: 8 cenários Vitest (vetores de rejeição)
> - Gate: `pnpm --filter @plataforma/core test` (build não necessário se só adiciona testes; mas rodar mesmo assim)
> - Capacidade: haiku — task de verificação, sem features novas
> - #aberto: 0

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente o escopo (1 arquivo de teste, sem features novas)?
- [ ] Todos os 8 vetores de violação são explicitamente testados?
- [ ] Testes que revelam falhas de segurança estão documentados na Seção 8 (não silenciados)?
- [ ] Setup de cada teste é autocontido (não depende de estado global)?
- [ ] `pnpm lint` não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer (sem correções, sem novas funções, sem vetores de rede)?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/core build      # tsc — precisa terminar sem erro
pnpm --filter @plataforma/core test       # precisa ficar verde OU revelar falhas documentadas na Seção 8
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.
> **NOTA ESPECIAL:** Testes de vetor que REVELAM FALHA (violação não-rejeitada) são resultado VÁLIDO — a task documenta o vetor, não o corrige. O Worker deve reportar, não silenciar.

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
