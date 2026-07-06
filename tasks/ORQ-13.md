---
id: ORQ-13
title: "Otimizador de contexto in-process no VercelAgentAdapter (crusher estrutural + CCR store + nano tier)"
status: ready
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-09", "ORQ-12"] # 09 entrega o harness de tools onde isto pluga; 12 (ADR-0009) fixa o veredito
blocks: []
capacity_target: sonnet
---

# ORQ-13 · Otimizador de contexto in-process no VercelAgentAdapter

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. Pacote `tools/orchestrator/` (dep-isolado). Persistir via `fila.mjs`.
  Identidade = modelo real. NÃO rodar git no Docs.
- **⚠️ Depende de ORQ-09 (harness de tools) estar `done`.** Endurecer/executar antes seria plugar
  num `execute()` que ainda não existe. Por isso `draft:triaged` — reendurecer JIT quando ORQ-09 fechar.

## 1. Objetivo
Implementar o veredito **GO** do ADR-0009 (spike ORQ-12): um otimizador de contexto **próprio,
in-process, sem serviço standing**, que encolhe os outputs de tool antes de entrarem no contexto do
agente. Substitui o proxy Headroom (:8787, NO-GO no ADR-0009) reaproveitando o **mecanismo** da fonte
aberta (SmartCrusher/CCR), não a ferramenta. Três camadas, na ordem de custo:
1. **CCR store local** — grava o original por hash, devolve resumo/marcador; tool `retrieve(hash)`
   re-hidrata sob demanda. Reversível (provado na bancada ORQ-12, `idêntico=true`).
2. **Crusher estrutural** — para JSON/arrays/listagens: colapsa itens de mesma forma preservando
   exemplos + contagem (inspirado em `headroom/transforms/smart_crusher.py`, determinístico, 0 dep).
   Protege código (roteia por tool: readFile de `.ts/.js/.rs` → não cruša).
3. **Nano-preprocess** — acima de ~2000 tokens de output, resume via `deepseek-v4-flash` (lossy →
   sempre com o original no CCR store). Medido no ORQ-12: 81–99% a ~US$0.0004.

## 2. Contexto RAG (Spec-Driven Development)
- [x] **`docs/adr/0009-otimizacao-de-contexto-agent-adapter.md`** — FONTE CANÔNICA: veredito, ordem
      das camadas, threshold (>2k tok), forma da integração (envolver `execute()` das tools).
- [x] `tools/orchestrator/context-bench.poc.mjs` (ORQ-12) — o CCR store (`localStore()`), o
      `nativeCrush()` e o `nanoPreprocess()` JÁ PROVADOS: porte/endureça a partir daqui, não reinvente.
- [x] `tools/orchestrator/src/agentAdapter.mjs` (ORQ-09b) — `run(opts)` assinatura real:
      `{taskId, model, cwd, prompt?, timeoutMs?, onEvent?, signal?, maxSteps?, cancelWatcher?}`.
      O harness de tools `makeTools({cwd, signal, log, onEvent})` em `tools.poc.mjs`.
- [x] `tools/orchestrator/src/monitor.mjs` (ORQ-10) — `startMonitor()`, `findStuck()`, `writeCancelFlags()`.
- [ ] `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` §3 (CCR) e §4 (nano).
- [ ] Fonte aberta p/ inspiração (NÃO portar fiel): `github.com/chopratejas/headroom` —
      `headroom/transforms/smart_crusher.py` (crusher estrutural) e `headroom/cache/compression_store.py`
      (CCR store). Determinísticos; extrair o mecanismo escopado aos nossos outputs.

## 3. Escopo de Arquivos (Inputs e Outputs)
> Paths JIT contra ORQ-09b (done) e ORQ-10 (in_progress). Código-fonte existente:
> `src/agentAdapter.mjs`, `tools.poc.mjs` (harness), `context-bench.poc.mjs` (PoC).
- **[CREATE]** `tools/orchestrator/src/context/ccrStore.mjs` — `localStore()` portado do PoC
      (`context-bench.poc.mjs:143`): `{ stash(content): string, retrieve(hash): string, dispose(): void }`.
      \+ a tool `retrieve` (schema Zod `{hash: z.string()}`) registrável no harness.
- **[CREATE]** `tools/orchestrator/src/context/crusher.mjs` — `nativeCrush(text): string` portado
      do PoC (`context-bench.poc.mjs:63`): `(text) => text` colapsando linhas de mesma forma.
      \+ `crushStructural(text, kind?)` com roteio por kind (`'code'|'search'|'text'`).
- **[CREATE]** `tools/orchestrator/src/context/optimize.mjs` —
      `optimizeToolOutput(out: string, ctx: {kind?: string, nano?: object, store?: object}): string`:
      orquestra as 3 camadas (gating por tamanho >2k tok, roteia por tool kind, chama nano só
      acima do threshold). O store injetado para CCR reversível.
- **[UPDATE]** `tools/orchestrator/tools.poc.mjs` — envolver o retorno de `readFile`/`bash`/`grep`
      com `optimizeToolOutput` + registrar a tool `retrieve` no objeto retornado por `makeTools()`.
- **[CREATE]** `tools/orchestrator/tests/context/` — testes de cada camada + `optimizeToolOutput`.

## 4. Estratégia de Testes Estrita (TDD)
- **Framework:** `node:test` + `node:assert/strict` (consistente com ORQ-09b).
- **Ambiente:** Node.js 22+, `tools/orchestrator/tests/context/`.
- **Casos enumerados:**
  1. `ccrStore` — stash(original) → retrieve(hash) devolve byte-a-byte idêntico.
  2. `ccrStore` — retrieve(hash inexistente) → throw / erro claro.
  3. `crushStructural` — array JSON repetitivo (`[{a},{a},{a}]`) encolhe ≥40% preservando ≥1 exemplo.
  4. `crushStructural` — código `.ts`/`.mjs` mantém ~intacto (não cruša formas únicas).
  5. `crushStructural` — listagem de diretório colapsa linhas de mesma forma (`×N`).
  6. `optimizeToolOutput` — output <2k tok passa cru (sem nano, sem custo).
  7. `optimizeToolOutput` — output >2k tok vira `resumo + hash`, retrieve(hash) recupera original.
  8. `optimizeToolOutput` — nano chamado só acima do threshold (nunca abaixo).
  9. `optimizeToolOutput` — store optional (se não passado, não faz CCR, só nano se aplicável).
  10. **Provider fake** para tier nano (loop determinístico, sem $) nos unitários;
      1 teste opt-in com nano real (`process.env.OPT_IN_NANO_REAL`) para smoke.
- **Fora de escopo:** portar content_router/code_compressor de 184/84KB; hospedar modelo ONNX;
      tocar `orquestrar.mjs` ou `agentAdapter.mjs`.

## 5. Instruções de Execução
> **⚠️ NÃO FAZER:** NÃO subir/rotear pelo proxy Headroom (:8787 — NO-GO no ADR-0009). NÃO portar o
> codebase inteiro do Headroom — só o mecanismo do crusher+store escopado. NÃO deixar o crusher
> destruir código. NÃO rodar git no Docs.
1. Reendurecer JIT: fixar paths/assinaturas contra o `src/` real da ORQ-09b.
2. **[TDD]** camadas na ordem: ccrStore → crusher → optimize → wiring nas tools.
3. Gate → §8 → enfileira.

## 5b. Plano de Batalha (wargame)
> Wargamed por **claude-fable** em 2026-07-06. Executável cego por **sonnet**. Recon executado
> read-only sobre o estado REAL de `tools/orchestrator/` nesta data (não sobre o que a spec imagina).

### Recon (estado de partida verificado)
- `src/` tem `agentAdapter.mjs` + `monitor.mjs`; `tests/` tem só `monitor.test.mjs` (**3 pass** quando
  rodado por arquivo). O harness VIVO é `tools.poc.mjs` (`agentAdapter.mjs:15` importa
  `makeTools` de lá) — **não** procure `src/tools.mjs`, não existe.
- `makeTools({ cwd, onEvent, signal, log })` exporta as tools **readFile/writeFile/bash** — ⚠️ NÃO
  existe tool `grep` (ver Fork F3).
- Código-fonte a portar está TODO em `context-bench.poc.mjs`: `localStore()` (stash/retrieve/dispose,
  ~linha 143), `nativeCrush()` (~linha 64), `nanoPreprocess()` (~linha 91, `NANO_CAP=24000`,
  marker+hash), `tokEst = chars/4` (linha 29).

### Movimentos
**M1 — `src/context/ccrStore.mjs`** (porta `localStore()` + schema Zod da tool `retrieve {hash}`).
- Observação esperada: `node --test tests/context/ccrStore.test.mjs` → `# pass 2, # fail 0`
  (casos 1–2 da §4).
- Falha provável: cleanup do tmpdir com `EBUSY/EPERM` no Windows ao rodar testes em paralelo →
  causa: handle aberto no dispose → contra-movimento: cada teste cria seu próprio `mkdtemp` e o
  `dispose()` já engole erro (`try/catch` — copie como está do PoC, não "melhore").

**M2 — `src/context/crusher.mjs`** (porta `nativeCrush` + `crushStructural(text, kind)` com roteio).
- Observação esperada: casos 3–5 verdes; caso 4 (código `.ts`/`.mjs`) mantém ≥85% dos tokens.
- Falha provável: o shape-collapse (`\d+→#`) colapsar linhas legítimas de código → causa: chamada
  sem `kind` → contra-movimento: `kind === 'code'` **bypassa** o crush (retorna intacto); default
  de `kind` ausente = `'text'` (crusha). Está na §4 caso 4 — não é opcional.

**M3 — `src/context/optimize.mjs`** (`optimizeToolOutput(out, ctx)`, gating >2000 tok, ordem
crusher→nano→CCR).
- Observação esperada: casos 6–9 verdes; caso 6 prova que output <2k tok passa **cru e sem chamada
  de nano** (espião no fake conta 0 chamadas).
- Falha provável: teste tentar nano real e falhar sem `DEEPSEEK_API_KEY` → causa: env não carregado
  em `node --test` → contra-movimento: nano é **injetado** (`ctx.nano`), unitários usam fake
  determinístico; o smoke real é SÓ opt-in (`OPT_IN_NANO_REAL=1` + `--env-file=../../.env`).
- RECON NEEDED (antes do smoke opt-in): a chave existe? Check:
  `node --env-file=../../.env -e "console.log(!!process.env.DEEPSEEK_API_KEY)"` → `true`. Se
  `false`, pule o opt-in e registre no §8 (o gate NÃO depende dele).

**M4 — wiring em `tools.poc.mjs`**: envolver o retorno de `execute()` de **readFile e bash** com
`optimizeToolOutput` + registrar a tool `retrieve` no objeto de `makeTools()`.
- Observação esperada: `node -e "import('./tools.poc.mjs').then(m=>console.log(Object.keys(m.makeTools({cwd:'.'}))))"`
  lista `retrieve` junto das demais; suite `monitor.test.mjs` continua 3 pass (regressão zero).
- Falha provável: quebrar o protocolo de eventos (ADR-0008 §D) ao envolver o execute → causa:
  wrapper engolindo o `onEvent`/`signal` → contra-movimento: envolva SÓ o valor de retorno, nunca
  a assinatura nem os emits existentes.

**M5 — Gate**: rodar a suite completa, colar saída literal na §8, `finish` via
`node C:/Dev2026/Docs/tools/scripts/manage-task.mjs finish ORQ-13 <modelo-real> "<msg com evidência>"`.

### Bifurcações (gatilhos observados no recon — não são hipóteses)
- **F1 (CONFIRMADO nesta máquina):** `node --test tests/` com DIRETÓRIO falha
  (`testCodeFailure, location: 'tests:1:1'`) neste Node 22.23/Windows, mesmo com testes verdes.
  SE observar `not ok 1 - tests` sem stack de teste → NÃO é teu código: rode por arquivo explícito:
  `node --test tests/context/ccrStore.test.mjs tests/context/crusher.test.mjs tests/context/optimize.test.mjs`.
  Cole ESSA forma no gate.
- **F2:** SE `src/context/` já existir com arquivos (outra rodada começou) → leia antes, adapte —
  NÃO sobrescreva às cegas.
- **F3 (divergência spec×realidade):** a §3 manda envolver "readFile/bash/**grep**", mas o harness
  não tem `grep`. → Envolva SÓ o que existe (readFile/bash); **NÃO implemente uma tool grep nova**
  (seria scope-creep de ORQ-09); registre a divergência em 1 linha no Handover §8.

### Condições de aborto (pare e chame `pause`, não improvise)
- Se o wiring exigir editar `src/agentAdapter.mjs` ou `orquestrar.mjs` → ABORT (§4 proíbe).
- Se `finish` falhar porque a task já está em `review` → PARE (Regra 6 — nunca tente o próximo verbo).
- Se qualquer teste do gate exigir rede/chave sem ser o opt-in → o desenho está errado; volte a M3.

### Verificações (amarradas ao Gate §7)
1. Suite context por arquivo (forma F1): esperado `# pass ≥10, # fail 0` somando os 3 arquivos.
2. Regressão: `node --test tests/monitor.test.mjs` → `# pass 3` (nada quebrou no monitor).
3. Opt-in (só se RECON da chave = true): `OPT_IN_NANO_REAL=1 node --env-file=../../.env --test
   tests/context/optimize.test.mjs` → o caso real loga tokens salvos.

### Red-team (SUCCESS #7)
- **Ataque que o plano resiste:** "executor cola um gate fabricado" → o gate exige a saída literal
  com os paths `tests/context/*.test.mjs` e contagens que o reviewer confere contra os 10 casos
  enumerados da §4 — fabricar é mais caro que rodar.
- **Ataque que furou e gerou patch:** "executor obediente vê 'grep' na §3 e implementa a tool que
  falta para 'cumprir a spec'" — furou a v1 deste plano; patch = **F3** explícito (envolver só o que
  existe + registrar divergência), agora parte do plano.

## 6. Feedback de Especificação
- **Aberto (deferir p/ arquiteto se surgir):** o tier ML de prosa. ADR-0009 decidiu nano em vez de
  hospedar o Kompress-v2-base (ONNX). O port ONNX in-process está **especificado em ORQ-14** (spike)
  — se o custo/latência do nano incomodar, ORQ-14 destrava a alternativa; fora do escopo desta task.
- **Opção arquitetural registrada (caderno 30 §9-A, NÃO escopo desta task):** o `optimizeToolOutput`
  é o ponto onde um futuro **tool-broker** (nano gerencia retry/fallback da tool antes do modelo
  grande ver o resultado) se encaixaria. Ao implementar, não impeça essa evolução: mantenha a
  interface `optimizeToolOutput(out, ctx)` pura (recebe/devolve, sem estado global) para que o broker
  possa envolvê-la depois. Nada além disso aqui.
- Decisões estruturais estão no ADR-0009. Se algo lá ficou ambíguo ao endurecer, PARE e volte ao ADR.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] 3 camadas implementadas (CCR store + crusher estrutural + nano gated), na ordem do ADR-0009?
- [ ] `optimizeToolOutput` envolvendo os `execute()` das tools sem quebrar o protocolo de eventos (ADR-0008 §D)?
- [ ] Reversibilidade: `retrieve(hash)` recupera o original (teste verde)?
- [ ] Crusher NÃO destrói código (roteia por tool/kind)?
- [ ] Nenhum serviço standing (sem proxy :8787); deps npm novas isoladas no pacote do orchestrator?

### Verificação automática
```bash
cd tools/orchestrator && node --test tests/context/
```
> **GATE DE EVIDÊNCIA:** saída literal dos testes colada na §8, mostrando:
>   - `ccrStore` stash→retrieve ✓
>   - `crushStructural` listagem/código ✓
>   - `optimizeToolOutput` gating/threshold ✓
> Total >=10 tests passados.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
(cole aqui a saída real de test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-04T01:29]** - *claude-sonnet* - `[Endurecido]`: endurece spec JIT contra ORQ-09b/ORQ-12 done: caminhos exatos, assinaturas dos PoCs, casos de teste enumerados (10), gate node:test. Sonnet — complexidade 5, coordena 3 camadas + wiring nas tools.
- **[2026-07-04T01:31]** - *claude-sonnet* - `[Promovida p/ ready]`: auto-promote: deps ORQ-09/ORQ-12 done
