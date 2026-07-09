---
id: DMM-02
title: "Nó Ingress (Estágio 1): tradução + crusher + l2Compressor como template de workflow"
status: done
complexity: 3
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01"] # precisa do contrato de nó/transição
blocks: ["DMM-06"]
capacity_target: sonnet
---

# DMM-02 · Nó Ingress (Estágio 1): tradução + filtro

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Implementar o **primeiro nó** da esteira declarativa (ADR 0013, Estágio 1): traduz a spec de entrada
para inglês e remove tokens redundantes. Como **template de workflow** (não hardcoded): o nó chama o
modelo de tradução (via `plugin-local-inference` por padrão, com fallback `plugin-providers`) e depois
repassa o texto por `crusher.ts` e `l2Compressor.ts` (`plugin-context`) como transições declaradas.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Estágio 1.
- [ ] `docs/adr/0014-contrato-no-workflow-declarativo.md` (DMM-01) — contrato de nó/transição.
- [ ] `packages/plugin-context/src/` — `crusher.ts`, `l2Compressor.ts`.
- [ ] `packages/plugin-local-inference/`, `packages/plugin-providers/` — invocação + fallback.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-context/src/{crusher,l2Compressor}.*`, `packages/plugin-local-inference/src/**`.
- **[CREATE]** template/definição do nó Ingress no formato decidido em DMM-01 (path a fixar no endurecimento).
- **[CREATE]** teste que roda o nó: entrada PT-BR verbosa → saída EN comprimida.

## 4. Estratégia de Testes Estrita
- Vitest. Métrica: saída em inglês + redução de tokens mensurável. Fallback local→providers exercido.
- **Fora de Escopo:** os demais estágios; qualidade linguística fina da tradução.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** adicionar lógica de tradução/compressão DENTRO do `plugin-context`/`plugin-local-inference`
>   — o nó apenas **compõe** funções existentes via o contrato de DMM-01.
> - **NÃO** hardcodar o provedor: o default é local, mas trocável por nó na UI.

### Pegadinhas conhecidas
- Os handlers recebem o envelope e retornam o Delta (parcial), conforme `type Handler = (args: Record<string, unknown>, env: Envelope) => Promise<Delta>;` (docs/adr/0014).

## 6. Feedback de Especificação
- **DERIVADO**: `Handler` signature e `Envelope` extraídos de `docs/adr/0014-contrato-orquestrador-declarativo.md` (DMM-01).

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-01` (ainda em `draft:pending_decision` — é o spike que define o
  contrato de nó/transição, `docs/adr/0014-contrato-no-workflow-declarativo.md`).
  A spec atual tem §3 marcado `[CREATE] template/definição do nó Ingress no formato decidido em
  DMM-01` — **o "formato" é a saída do spike**. Endurecer este agora seria inventar
  assinatura TS sem fonte.
- **Por que NÃO `harden`:** o nó Ingress implementa exatamente o contrato de DMM-01; sem o
  ADR 0014, qualquer TS fixado seria chute.
- **Próximo passo:** após DMM-01 virar `done` (spike fechado pelo arquiteto + executor),
  reendurecer (pass-2 JIT) e preencher §3/§4/§7 com a forma concreta do nó + testes. O
  painel `node tools/scripts/hardening.mjs DMM` listará DMM-02 como "REENDURECER" assim que
  DMM-01 fechar.
- **Pré-endurecimento já válido (pass-1):** `capacity_target: sonnet` (mecânica — composição de
  funções existentes via contrato; não é spike algorítmico), `dependencies: [DMM-01]`
  conferida contra `blocks:` de DMM-01.
- **Pendente p/ pass-2:** assinatura TS do nó (citada em DMM-01), path exato do arquivo do
  template (formato JDM a definir), casos de teste enumerados com fixture PT-BR→EN
  (placeholder).

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Nó Ingress roda como etapa de workflow, sem hardcode em plugin-base.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-workflows test
pnpm --filter @plataforma/plugin-context test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- Nó Ingress implementado como workflow declarativo (ADR 0014): `createIngressWorkflow`/`runIngress`
  compõem `translate` (DI) → `crushStructural` (real) via Zen engine + orquestrador.
- 7 arquivos criados em `src/nodes/ingress/` + 1 teste com 4 casos.
- Nenhum hardcode: `Translator` injetado por DI, crush/l2 via `plugin-context`, JDM portátil.
- Gate verde: build + lint + test nos dois pacotes.

**Evidência (execução original):**
```
$ tsc
$ eslint src/
$ vitest run
 Test Files  2 passed (2)
      Tests  5 passed (5)
   Duration  1.11s

$ pnpm --filter @plataforma/plugin-context test
 Test Files  5 passed (5)
      Tests  19 passed | 1 skipped (20)
```

**Rework [M1] (deepseek, 2026-07-09):**
- `ingress.handlers.ts`: `createL2CompressHandler` agora aceita `options?` — guard no-op quando ausente.
- `ingress.ts`: handler `l2-compress` registrado incondicionalmente (removido `if (opts.l2)`).
- `ingress.jdm.json`: regra r4 (`compressed==false → "l2-compress"`) adicionada entre r2 e r3.
- Testes: 6 casos (eram 4). Novos: `opts.l2` com mock de `compressL2`, sem `opts.l2` no-op.

**Evidência (rework):**
```
$ pnpm --filter @plataforma/plugin-workflows build
$ tsc (Exit 0)
$ pnpm --filter @plataforma/plugin-workflows test
 Test Files  2 passed (2)
      Tests  7 passed (7)
$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/ (Exit 0)
$ pnpm --filter @plataforma/plugin-context test
 Test Files  5 passed (5)
      Tests  19 passed | 1 skipped (20)
```

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
$ pnpm --filter @plataforma/plugin-workflows build   →  tsc, sem erros
$ pnpm --filter @plataforma/plugin-workflows lint    →  eslint src/, sem erros
$ pnpm --filter @plataforma/plugin-workflows test    →  Test Files 2 passed (2) · Tests 5 passed (5)
$ pnpm --filter @plataforma/plugin-context test      →  Test Files 5 passed (5) · Tests 19 passed | 1 skipped (20)
```
- **Sonda adversarial (`l2-routing.probe.test.ts`, removida após prova):** forneceu `opts.l2` e inspectou o
  `decider` com `env={translated:true, crushed:true, compressed:false}` → esperado `next="l2-compress"`,
  recebido `next=null` (terminal). Confirma [M1].

**Comentários de Revisão:**

- **[M1] Handler `l2-compress` registrado mas nunca roteado pelo JDM (opção morta).**
  - Local: `packages/plugin-workflows/src/nodes/ingress/ingress.jdm.json:21-39` (decisor) + `ingress.ts:59-61` (registro).
  - Evidência: o JDM tem apenas 3 regras — `translated==false → "translate"`, `crushed==false → "crush"`,
    `1==1 → ""` (terminal). **Não existe regra `compressed==false → "l2-compress"`**. O `createIngressWorkflow`
    registra condicionalmente `handlers["l2-compress"]` quando `opts.l2` é passado, e o `decider` lê
    `env["compressed"]`, mas o grafo nunca decide ir para `l2-compress`: após translate→crush o decisor cai na
    regra default e termina. Resultado: fornecer `opts.l2` é um no-op silencioso.
  - Viola: §1 ("repassa o texto por crusher.ts **e l2Compressor.ts** como transições declaradas") + §3/IngressOptions
    (campo `l2?: L2Options` exposto como se fosse funcional).
  - Ação corretiva: o grafo é estático, então a regra `compressed==false → "l2-compress"` só é segura se o handler
    `l2-compress` estiver sempre presente na `HandlerMap`. Caminhos: (a) registrar o handler incondicionalmente com
    guard no-op quando `opts.l2` ausente, adicionar a regra no JDM entre r2 e r3, e criar um teste que confirme
    `compressed=true` quando `opts.l2` é fornecido; OU (b) remover `opts.l2`/o handler e documentar l2 como trabalho
    futuro (DMM-15). Recomendado: (a), para honrar "transição declarada" da §1.

- **[m1] §4 "Fallback local→providers exercitado" sem cobertura (tensão com §5).**
  - A spec §4 exige exercitar o fallback `plugin-local-inference → plugin-providers`, mas §5 manda **não hardcodar
    o provedor** (DI). A impl cumpre §5 (Translator injetado), o que torna o fallback responsabilidade do caller,
    não do nó. O bullet de §4 fica sem dono.
  - Ação: esclarecer na spec que o fallback é exercido em teste de integração futura (quando houver um caller real
    de produção), ou criar um teste que injete um Translator com fallback local→provider e observe a troca.

- **[i1] `loadIngressGraph()` lê o JDM do filesystem via `__dirname`/`fs.readFileSync` (`ingress.ts:11-15`).**
  Funciona em Node/Vitest, mas acopla o workflow a um path em disco. Um `import jdm from "./ingress.jdm.json"` (ESM
  JSON) deixaria o grafo portátil e removeria a dependência de `fs`/`__dirname`. Sugestão de melhoria, não bloqueante.

- **[i2] Escopo confirmado limpo.** `git show --stat` dos 2 commits do branch (`eb150a0`, `836a60e`) tocam **apenas**
  `packages/plugin-workflows/`. O diff `master..HEAD` mostra `apps/estaleiro/ui/**` (617 deleções), mas isso é
  **divergência** (o branch nasceu antes do planner entrar no master), não alteração do worker. Sem hardcode em
  `plugin-base` (DoD §7 ✓). Nó compõe funções existentes via contrato ADR 0014 (Handler signature confere com
  `types.ts:19`).

### Parecer do Reviewer 2 (claude-sonnet, independente — pós-rework):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Revisor:** `agile_reviewer:claude-sonnet` (Reviewer 2; 1ª revisão foi `agile_reviewer:glm-5.2` em 2026-07-09T15:45).
- **Data:** 2026-07-09
- **Anti-ancoragem:** veredito formado a partir da spec + código + Gate + sonda adversarial **antes** de ler o parecer anterior. O parecer glm-5.2 só foi comparado após a conclusão do meu veredito.

**QA REPORT — DMM-02 (rework) — Nó Ingress (Estágio 1)**
```
Data: 2026-07-09  |  Revisor: agile_reviewer (claude-sonnet)
Spec consultada: tasks/DMM-02.md §1–7  |  Arquivos auditados: 7 (6 created + 1 modified)
Testes: 7 + 19 = 26 rodados · 26 passaram · 0 falharam · 1 skipped
tsc: OK (0 erros)  |  lint: OK (0 erros)

Evidência de Execução
─────────────────────
$ pnpm --filter @plataforma/plugin-workflows exec tsc --noEmit
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows lint
$ eslint src/
(no output — OK, 0 erros)

$ pnpm --filter @plataforma/plugin-workflows test
$ vitest run
 ✓ poc/chain.poc.test.ts   (1 test)   179ms
 ✓ poc/ingress.poc.test.ts (6 tests)  214ms

 Test Files  2 passed (2)
      Tests  7 passed (7)
   Start at  14:06:52
   Duration  1.45s

$ pnpm --filter @plataforma/plugin-context test
$ vitest run
 ✓ tests/ccrStore.test.ts        (4 tests)
 ✓ tests/nanoPreprocess.test.ts  (3 tests | 1 skipped)
 ✓ tests/crusher.test.ts         (5 tests)
 ✓ tests/optimize.test.ts        (4 tests)
 ✓ tests/l2Compressor.test.ts    (4 tests)

 Test Files  5 passed (5)
      Tests  19 passed | 1 skipped (20)
   Duration  2.32s
```

Sonda adversarial
─────────────────
`poc/m1-rework.probe.test.ts` (redigido, executado, **REMOVIDO**):
- Cenário: `opts.l2` fornecido + envelope `{translated:true, crushed:true,
  compressed:false}` → esperado: `l2-compress` é roteado, `compressed=true`,
  `compressL2` chamado 1 vez.
- Resultado: ✅ **PASS** (1/1). Confirma que o rework corrigiu o roteamento
  estático (JDM r4 agora dispara corretamente quando `compressed==false`).
  Sem o rework, o decider cairia em r3 (default → terminal) e `compressL2`
  nunca seria invocado — exatamente o bug do parecer glm-5.2.
- Achado colateral (não-bloqueante): sem o `vi.mock("@plataforma/plugin-context")`
  o handler invoca `compressL2` real e crasha em `tokenizer.encode is not a
  function` (tokenizer dummy). O teste oficial já usa o mock — INFO sobre
  robustez do caller real (DMM-06) que vai precisar do mesmo mock ou injetar
  um tokenizer válido.

BLOCKER (0) / MAJOR (0) / MINOR (1) / INFO (5)
──────────────────────────────────────────────
**MAJOR — nenhum.** O parecer anterior ([glm-5.2] [M1], handler `l2-compress`
registrado mas nunca roteado pelo JDM) está **totalmente corrigido**:
  - `ingress.jdm.json:34-39` adiciona regra r4 (`ctx.compressed==false →
    "l2-compress"`) entre r2 e r3, na ordem correta do hit-policy
    `first`. (NÃO bloqueante para o DoD §7: a regra é "roda como etapa de
    workflow, sem hardcode em plugin-base" — atenderia mesmo sem r4, mas
    a spec §1 cita "transições declaradas" para o L2.)
  - `ingress.handlers.ts:26-35` `createL2CompressHandler(options?)` com
    guard no-op quando `options` ausente. (Confirma o que o parecer
    anterior pediu: "registrar o handler incondicionalmente com guard
    no-op quando opts.l2 ausente".)
  - `ingress.ts:59` `handlers["l2-compress"] = createL2CompressHandler(opts.l2)`
    — registro incondicional, como pedido.
  - Testes: 6 casos (4 originais + 2 novos do rework). Sondas do tipo
    "compressed==false → l2-compress invocado" e "sem opts.l2 → no-op
    compressed=true" confirmam o comportamento ponta a ponta.

**MINOR**
`[m1]` `tasks/DMM-02.md §4` (spec) — bullet "Fallback local→providers
exercitado" permanece sem cobertura. O parecer glm-5.2 já tinha
apontado este como não-bloqueante ("tensão com §5 — DI"). O rework
não tocou a spec nem adicionou cobertura.
  Ação: reendurecer §4 para explicitar que o fallback é exercido em
  teste de integração futura (DMM-06 caller real), OU criar um teste
  que injete um Translator com fallback local→provider e observe a
  troca. (Mesmo padrão do DMM-02 m1 original — não-bloqueante.)

**INFO**
`[i1]` `loadIngressGraph()` (`ingress.ts:11-15`) ainda acopla o workflow
a um path em disco via `fs.readFileSync` + `__dirname`. Sugestão de
melhoria: `import jdm from "./ingress.jdm.json"` (ESM JSON). Não-bloqueante.
(Repetido do parecer glm-5.2 i1 — também não foi corrigido no rework,
mas é defensável e consistente com DMM-03/04 m3.)

`[i2]` `package.json` NÃO foi modificado pelo worker da DMM-02 (diff
`ebe5a13..HEAD -- packages/plugin-workflows/package.json` retorna vazio).
`@plataforma/plugin-context` já era dep em master. Comparado com DMM-03
que adicionou 1 linha — DMM-02 não precisava.

`[i3]` `ingress.ts:38-48` decider: a regra r3 (default → terminal) é
sempre `1==1` — funciona como catch-all. Se o JDM cresce (futuras
regras de erro/branch), esse catch-all deve ser revisitado para não
mascarar estados não-cobertos. (Defensável agora — o Ingress é
linear.)

`[i4]` Acoplamento (Gate 5.1.2): import cross-package em
`ingress.handlers.ts:1-2` é `@plataforma/plugin-context` (deps já
declaradas em §3 como READ). Zero ciclo. Consistente com a direção
declarada em `docs/visao-arquitetural.md §1`.

`[i5]` Gate 5.1.1 (wiring) OK: caller de produção ainda não existe
(próprio teste). Integração downstream **DMM-06** linkada no
frontmatter `blocks: ["DMM-06"]` (DMM-06 ainda em `draft:triaged`).
Mesmo padrão dos outros DMM-* revisados.

`[i6]` (sonda colateral, removida) `crusher.ts` é exercido **de
verdade** no test 1 (assere `output.toContain("×")`) — o mock só
substitui `compressL2`, não `crushStructural`. Bom — o teste prova
a composição real. ✅

VEREDICTO: APROVADO
Resumo: O rework fechou integralmente o [M1] do parecer glm-5.2 (l2-compress
agora roteado). Gate triplo verde (7/7 plugin-workflows + 19/19
plugin-context, tsc/lint limpos). Sonda adversarial prova que o JDM
r4 + handler `l2-compress` se comportam como esperado. Apenas 1
MINOR (spec drift §4) e 5 INFO persistem — todos não-bloqueantes e
herdados do parecer anterior; nenhum é responsabilidade do rework
que estava em escopo.
```

**Comentários de Revisão (R2):** Divergência do parecer anterior —
glm-5.2 marcou **Requer Refatoração** por causa do [M1] (l2-compress
nunca roteado). O rework de 2026-07-09T17:01 (deepseek) **resolveu
integralmente** o [M1]: regra r4 adicionada ao JDM, handler
registrado incondicionalmente, 2 testes novos cobrindo o caminho.
Minha sonda adversarial confirma o conserto. Os outros achados do
glm-5.2 ([m1] spec drift §4, [i1] fs.readFileSync, [i2] escopo) são
não-bloqueantes e foram corretamente deixados para cleanup
posterior. Recomendo **integrar** (merge na master + approve).

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T18:37]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-01 ainda draft:pending_decision; reendurecer JIT após spike
- **[2026-07-09T12:16]** - *Antigravity* - `[Endurecido]`: Endureceu spec com assinaturas de DMM-01
- **[2026-07-09T12:22]** - *Antigravity* - `[Promovida p/ ready]`
- **[2026-07-09T14:45]** - *claude-sonnet* - `[Iniciado]`: iniciando
- **[2026-07-09T15:03]** - *claude-sonnet* - `[Finalizado]`: Nó Ingress implementado: workflow declarativo translate→crush via ADR 0014. Gate: 5/5 tests pass, lint/build verde.
- **[2026-07-09T15:36]** - *agile_reviewer:glm-5.2* - `[Em revisão]`: revisando
- **[2026-07-09T15:45]** - *agile_reviewer:glm-5.2* - `[Requer Refatoração]`: Rework: [M1] handler l2-compress registrado mas nunca roteado pelo JDM (opts.l2 é no-op silencioso) — adicionar regra compressed==false -> l2-compress no JDM + registrar handler incondicionalmente (guard no-op sem opts.l2) + teste que confirme compressed=true, OU remover opts.l2/handler e documentar l2 como futuro (DMM-15). Nao-bloqueantes [m1,i1] -> ledger.
- **[2026-07-09T16:56]** - *deepseek* - `[Iniciado]`: rework: corrigindo M1 (l2-compress nunca roteado pelo JDM)
- **[2026-07-09T17:01]** - *deepseek* - `[Finalizado]`: rework pronto: [M1] corrigido — handler l2-compress incondicional + regra JDM r4 + testes. 7/7 plugin-workflows, 19/20 plugin-context. Build + lint limpos.
- **[2026-07-09T17:04]** - *agile_reviewer:claude-sonnet* - `[Em revisão]`: revisando 2 (post-rework independente; reviewer anterior: glm-5.2)
- **[2026-07-09T17:10]** - *agile_reviewer:claude-sonnet* - `[Aprovado]`: Integrado: merge na master (commit c663ba5), worktree removida, Gate verde (pnpm --filter @plataforma/plugin-workflows: build OK + test 7/7 + lint OK; pnpm --filter @plataforma/plugin-context: test 19 passed | 1 skipped). 5 não-bloqueantes (i2-i6) → ledger; (m1, i1) já estavam no ledger R1. Parecer R2 (claude-sonnet) confirma rework de deepseek fechou integralmente o [M1] do glm-5.2. Sonda adversarial (m1-rework.probe) valida JDM r4 + handler l2-compress em runtime.
