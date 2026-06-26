---
id: T-POL-01
title: "Polish: T-007 testkit (m1 código morto, m2 diff custom, m3 mensagem sem fingerprints)"
status: draft
complexity: 1
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: [] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
---

# T-POL-01 · Polish: T-007 testkit (m1 código morto, m2 diff custom, m3 mensagem sem fingerprints)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
Aplicar 3 melhorias (MINOR) identificadas pelo reviewer na T-007 (Asserções de convergência). Mudanças cosméticas/de DX, sem alterar a API pública. Não-introdutório (apenas remove/refatora).

Itens a corrigir (origem: `tasks/T-007.md` Seção 8 / QA Report 2026-06-23T20:18):
- **m1:** Código morto no test #6 — primeiro array `peers` (com `fp ≠ fpB`) é construído mas nunca usado; o teste usa só `peersFixed` criado em seguida.
- **m2:** `formatDiff` produz diff custom via `JSON.stringify` + Set comparison. Spec §1 sugere `assert.deepStrictEqual`. Decisão: manter custom (output é mais legível) MAS documentar a escolha.
- **m3:** `AssertionError` inclui diffs tabulares mas não os fingerprints divergentes que dispararam a falha — para debug seria útil ter `Fingerprints: <peerA>=<hex>... <peerB>=<hex>...` no início da mensagem.

## 2. Contexto RAG (Spec-Driven Development)
- [tasks/T-007.md](../tasks/T-007.md) — Seção 1 (Contratos), Seção 4 (Casos de teste), Seção 8 (Parecer do Revisor com m1-m3)
- [docs/caderno-1-vision/01-superapp-overview.md](../docs/caderno-1-vision/01-superapp-overview.md) — Princípio de "testkit como utilitário de DX"
- Worktree de referência: `C:\Dev2026\.superapp-worktrees\T-007\` (branch `task/T-007`, commit `b14a322`)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/testkit/src/assertions.ts` (linhas 35-62: `formatDiff`; linhas 100-130: dump + throw)
- **[READ]** `packages/testkit/tests/assertions.test.ts` (linhas 127-158: test #6)
- **[UPDATE]** `packages/testkit/src/assertions.ts`
  - Linhas 35-62: adicionar JSDoc em `formatDiff` explicando por que é custom (não `assert.deepStrictEqual`).
  - Linhas 125-128: prepend na mensagem de erro uma linha listando os fingerprints divergentes em hex (Uint8Array → Buffer.from(fp).toString('hex')).
- **[UPDATE]** `packages/testkit/tests/assertions.test.ts`
  - Linhas 128-145 (test #6): remover o array `peers` morto (com `fp ≠ fpB`); manter só o setup `peersFixed` que é o que o teste usa.
  - Adicionar assertion no test #3 (que já é divergente): verificar que a mensagem inclui `/[0-9a-f]{16,}/i` (algum hex de fingerprint) OU um marcador explícito como `"Fingerprints:"`.
- **NÃO EDITAR** nada além desses 2 arquivos. Não criar arquivos novos.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Métricas/Cobertura:** os 10 casos de T-007 §4 devem continuar verdes; cobertura real (= nominal) preservada.
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/testkit test` em `C:\Dev2026\.superapp-worktrees\T-007\`.
- [x] **Fora de Escopo:** mudanças de comportamento, novos casos de teste, alteração de API, refatoração maior.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - Não altere a API pública (`expectConverged`, `ConvergencePeer`, `ConvergenceScope`, `TableName`) — diffs de signature quebram callers em outros pacotes.
> - Não troque o formato do diff (--- peerA / +++ peerB / -row / +row) — o output já é aceito pelos testes; m2 é só sobre DOCUMENTAÇÃO da escolha, não implementação.
> - Não adicione novas dependências.

### Pegadinhas conhecidas
- **m3:** o fingerprint é `Uint8Array`. Em Node, `Buffer.from(fp).toString('hex')` produz string hex minúscula. Limitar a 16 chars (8 bytes) já basta para identificação visual; usar o array inteiro gera string de 64 chars (ruidosa). Sugestão: `fp.slice(0, 8)` ou `fp.subarray(0, 8)`.
- **m1:** ao remover o array morto, NÃO remover o comentário explicativo que ainda é útil (deixa claro que o fingerprint precisa ser igual entre os dois peers para o escopo filtering ser exercitado).
- **m2:** o JSDoc deve ser 2-3 linhas, não um ensaio. Mencionar: "custom em vez de `assert.deepStrictEqual` porque o output tabular -row/+row é mais legível para o diff de tabelas do que a árvore completa de propriedades".

1. **[m1]** Editar `tests/assertions.test.ts` linhas 128-145: apagar o array `peers` morto.
2. **[m3]** Editar `src/assertions.ts`: após `const message = [` (linha 125), prepend uma linha `Fingerprints: <peerA>=<hex[:16]> <peerB>=<hex[:16]>` usando os fingerprints já coletados em `fingerprints[0]` e o divergente de `divergingPeers[0]`.
3. **[m3]** Adicionar assertion no test #3: `await expect(...).rejects.toThrow(/Fingerprints:/);` — agora o test #3 também exercita a nova linha da mensagem.
4. **[m2]** Editar `src/assertions.ts` linhas 35-39: adicionar JSDoc em `formatDiff` documentando a escolha.
5. Rodar `pnpm --filter @plataforma/testkit lint && pnpm --filter @plataforma/testkit build && pnpm --filter @plataforma/testkit test`. Os 26/26 testes devem permanecer verdes.
6. Commit: `polish(T-007): m1 código morto, m2 JSDoc formatDiff, m3 fingerprints no erro`.

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado]* — todos os itens têm origem clara no QA Report da T-007 Seção 8.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
cd C:/Dev2026/.superapp-worktrees/T-007
pnpm --filter @plataforma/testkit lint   # eslint src/  — 0 erros
pnpm --filter @plataforma/testkit build  # tsc         — 0 erros
pnpm --filter @plataforma/testkit test   # vitest      — 26/26 verdes
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
