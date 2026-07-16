---
id: T-WASM-01
title: "SPIKE: vector_index — baseline TS vs sqlite-vec/WASM e controle USearch nativo"
status: draft:triaged
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-IA-01"]
blocks: []
capacity_target: opus-spike
---

# T-WASM-01 · SPIKE: vector_index — baseline TS vs sqlite-vec/WASM e controle USearch nativo

## 0. Ambiente de Execução Obrigatório
- **Código observado:** `C:\Dev2026\superapp`, após T-IA-01 estar integrada na `master`.
- **Runtimes:** Node.js 22+ e Chromium atual; hardware-alvo inclui Windows ARM64.
- **Capacidade-alvo:** `opus-spike`. Entregável = bancada reproduzível + números + veredito; não migra produção.
- **Persistência:** PoC descartável em `C:\tmp\t-wasm-01-vector-index`; resultado e comandos literais na §8.

## 1. Objetivo
Medir no contrato real de `VectorIndex` entregue por T-IA-01 quando a busca cosseno linear em TS deixa
de atender e se `sqlite-vec` em WebAssembly ou USearch/WebAssembly oferece benefício líquido. A
task não assume ganho de 10–50× e separa custo de embedding, construção do índice, consulta, cold
start, memória e travessia JS↔Wasm.

## 2. Contexto RAG
- `tasks/T-IA-01.md` — contrato e baseline reais; a task explicitamente adia `sqlite-vec/WASM`.
- `tasks/T-IA-03.md` — consumidor RRF; filtro de permissão e GraphRAG não podem ser apagados pelo benchmark.
- `docs/caderno-3-sdk/14-ia-rag-e-agentes.md` §§2–3 — projeção vetorial e recuperação híbrida.
- `docs/conceitos/recuperacao-hibrida.md`.
- A versão de produção só será fixada no endurecimento JIT; os snapshots abaixo são referências de
  pesquisa, não pins de dependência.

### Snapshots upstream auditados
- `sqlite-vec` commit [`04d28bd`](https://github.com/asg017/sqlite-vec/tree/04d28bd21773981e2d266bbf6aa4efbd011eb4f6)
  (v0.1.10-alpha.4, pre-v1):
  [`site/using/wasm.md`](https://github.com/asg017/sqlite-vec/blob/04d28bd21773981e2d266bbf6aa4efbd011eb4f6/site/using/wasm.md),
  [`tests/test-wasm.mjs`](https://github.com/asg017/sqlite-vec/blob/04d28bd21773981e2d266bbf6aa4efbd011eb4f6/tests/test-wasm.mjs) e
  [`examples/simple-node/demo.mjs`](https://github.com/asg017/sqlite-vec/blob/04d28bd21773981e2d266bbf6aa4efbd011eb4f6/examples/simple-node/demo.mjs).
- USearch commit [`cc23bba`](https://github.com/unum-cloud/USearch/tree/cc23bbaf21ef52313c5a495adbc40cbd733cdcfb)
  (v2.26.0): o binding JavaScript observado contém
  [`javascript/lib.cpp`](https://github.com/unum-cloud/USearch/blob/cc23bbaf21ef52313c5a495adbc40cbd733cdcfb/javascript/lib.cpp),
  [`usearch.ts`](https://github.com/unum-cloud/USearch/blob/cc23bbaf21ef52313c5a495adbc40cbd733cdcfb/javascript/usearch.ts) e
  [`node-gyp-build.d.ts`](https://github.com/unum-cloud/USearch/blob/cc23bbaf21ef52313c5a495adbc40cbd733cdcfb/javascript/node-gyp-build.d.ts);
  não há artefato browser-Wasm nessa árvore. Portanto é somente controle **Node nativo** salvo nova
  evidência oficial no endurecimento.

## 3. Matriz Obrigatória
1. Baseline T-IA-01 sem alteração.
2. `sqlite-vec/WASM` usando o mesmo corpus e a mesma métrica.
3. USearch nativo somente em Node, como controle de ANN. Uma célula `USearch/Wasm` só pode existir
   se o worker citar artefato oficial compatível com browser no pin escolhido; ausência é resultado.
4. Volumes: 1k, 10k e 100k vetores; dimensões 384 e 768; `topK` 5 e 20.
5. Medidas: build/indexação, warm query p50/p95/p99, cold start, RSS/heap/Wasm memory, tamanho do
   artefato, recall@k contra busca exata e custo do filtro de permissão/join.
6. Browser e Node medidos separadamente; não extrapolar números entre runtimes.

## 4. Critérios de Evidência
- Corpus determinístico, seed e hardware registrados.
- ≥30 queries por célula após warm-up; percentis calculados do conjunto bruto, não de médias.
- Sem incluir geração de embedding na latência de busca; reportá-la em coluna separada.
- Resultado semanticamente equivalente: mesmo `topK`, métrica e regras de exclusão.
- GO para produção browser somente se uma alternativa browser cumprir o SLO definido no endurecimento **e** entregar ≥2× no p95
  representativo sem regressão >1 ponto percentual de recall@k ou >25% de memória total.
- Se o baseline já cumprir o SLO até 100k, o veredito pode ser NO-GO/YAGNI.

## 5. Não Fazer / Pegadinhas
- NÃO trocar o backend de T-IA-01 nesta spike.
- NÃO comparar HNSW aproximado com cosseno exato sem reportar recall.
- NÃO usar benchmark publicado por fornecedor como evidência do SuperApp.
- NÃO ligar Wasm-MT antes de provar que o kernel single-thread é o gargalo.
- `Float32Array` deve entrar em lote; serialização por vetor pode fabricar um gargalo artificial.
- O harness deve registrar package version, lockfile integrity e SHA/URL do upstream; teste anti-fake
  deve importar e chamar o símbolo real do pacote, nunca um mock com o mesmo nome.

## 6. Feedback de Especificação
Reendurecer após T-IA-01 `done`, fixando os paths e scripts reais do pacote, versões instaladas e o
SLO do produto. A decisão tecnológica permanece aberta por desenho; a matriz e o gate não.

## 7. Definition of Done
- [ ] Matriz completa ou falhas literais justificando células inviáveis.
- [ ] Tabela com dados brutos anexados/referenciados e resumo p50/p95/p99.
- [ ] Veredito `baseline | sqlite-vec/WASM | USearch nativo (controle) | adiar`, com custo operacional.
- [ ] Se GO, proposta de task de integração; se NO-GO, gatilho quantitativo de reavaliação.

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.

- **[2026-07-15T18:56]** - *gpt-5* - `[Triado]`: Spike vetorial Wasm triado; reendurecer após T-IA-01 com paths, versões e SLO reais.
