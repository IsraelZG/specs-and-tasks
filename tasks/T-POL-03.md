---
id: T-POL-03
title: "Polish: T-203 codec (caso 7 do codec.test.ts não cobre o byte 0xc1 da spec)"
status: ready
complexity: 1
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: [] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: haiku | sonnet | opus-spike
---

# T-POL-03 · Polish: T-203 codec (caso 7 do codec.test.ts não cobre o byte 0xc1 da spec)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
Adicionar 1 caso de teste faltante no `codec.test.ts` da T-203 para cobrir o exemplo explícito da spec: `decode(Uint8Array([0xc1]))` deve lançar `CodecError` (byte nunca-usado do MessagePack).

Item a corrigir (origem: `tasks/T-203.md` Seção 8 / QA Report):
- **[mn]** `codec.test.ts:88-94` — Caso 7 cobre marcadores válidos truncados (0xde/0xdc), mas não cobre o exemplo literal `Uint8Array([0xc1])` citado na Seção 4 item 7 da spec. Adicionar assertion para `CodecError`.

## 2. Contexto RAG (Spec-Driven Development)
- [tasks/T-203.md](../tasks/T-203.md) — Seção 4 item 7 (o exemplo `0xc1`); Seção 8 [mn] (parecer do revisor)
- Worktree de referência: `C:\Dev2026\.superapp-worktrees\T-203\` (branch `task/T-203`)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/protocol/tests/codec.test.ts` (linhas 88-94: test #7 atual)
- **[READ]** `packages/protocol/src/codec.ts` — para verificar se `decode(new Uint8Array([0xc1]))` lança `CodecError` (deve, mas verificar antes de adicionar o teste)
- **[UPDATE]** `packages/protocol/tests/codec.test.ts`
  - Linhas 88-94: adicionar uma terceira assertion ao test #7 (ou criar test #7b) que cubra `decode(new Uint8Array([0xc1]))`.toThrow(CodecError).
- **NÃO EDITAR** nada além desse arquivo. Não mexer no `codec.ts` (a implementação já está correta; o gap é só no teste).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Métricas/Cobertura:** os 7 casos de T-203 §4 continuam verdes + 1 assertion nova. Total esperado: 8 (ou 7 com 1 caso com 3 assertions).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/protocol test` em `C:\Dev2026\.superapp-worktrees\T-203\`.
- [x] **Fora de Escopo:** novos casos além do `0xc1`, mudanças no `codec.ts`, alteração de API.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - Não criar um test #8 novo. O caso 7 já trata "decode de bytes inválidos" — adicionar a assertion lá é o caminho que casa com a spec.
> - Não usar `expect(() => ...).rejects` (decode é síncrono, retorna o valor ou lança).
> - Não trocar a implementação do `codec.ts` — o teste serve para confirmar comportamento já existente.

### Pegadinhas conhecidas
- **0xc1** é o byte "never used" do MessagePack specification. `msgpackr` deve lançar erro de parsing. Verificar antes de adicionar a assertion que `decode(new Uint8Array([0xc1]))` realmente lança `CodecError` (não um erro genérico do msgpackr) — pode ser que precise ajustar o `try/catch` em `codec.ts:decode` se o erro for wrapper-genérico. Se for o caso, a task vira MAJOR e deve ser escalada via `pause` (não inventar fix de codec.ts que não está no escopo).

1. Antes de tocar no teste, rodar `node -e "import('./packages/protocol/dist/codec.js').then(m => { try { m.decode(new Uint8Array([0xc1])); console.log('NO THROW'); } catch (e) { console.log('THROWS:', e.constructor.name, e.message); } })"` no worktree. Confirmar que lança `CodecError`.
2. Editar `tests/codec.test.ts:88-94`: adicionar a assertion `expect(() => decode(new Uint8Array([0xc1]))).toThrow(CodecError);` como terceira linha do test #7.
3. Rodar `pnpm --filter @plataforma/protocol lint && pnpm --filter @plataforma/protocol build && pnpm --filter @plataforma/protocol test`. Esperado: 7+ verde com 3 assertions no caso 7 (ou 8 testes se numerado novo).
4. Commit: `test(T-203): codec caso 7 cobre 0xc1 (byte never-used do MessagePack)`.

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado]* — o gap está literalmente descrito no QA Report da T-203 linha 159.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
cd C:/Dev2026/.superapp-worktrees/T-203
pnpm --filter @plataforma/protocol lint   # eslint src/ tests/  — 0 erros
pnpm --filter @plataforma/protocol build  # tsc                  — 0 erros
pnpm --filter @plataforma/protocol test   # vitest               — 7/7 verdes (caso 7 com 3 assertions)
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
