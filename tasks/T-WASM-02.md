---
id: T-WASM-02
title: "SPIKE: matriz browser para inferência local — Wasm SIMD/MT vs WebGPU"
status: draft:triaged
complexity: 5
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-IA-01", "T-IA-02"]
blocks: []
capacity_target: opus-spike
---

# T-WASM-02 · SPIKE: matriz browser para inferência local — Wasm SIMD/MT vs WebGPU

## 0. Ambiente de Execução Obrigatório
- **Código observado:** `C:\Dev2026\superapp`, após T-IA-01/T-IA-02 integradas.
- **Runtimes:** Chromium no Windows ARM64 alvo e ao menos uma máquina x64; Node é apenas baseline.
- **Capacidade-alvo:** `opus-spike`; PoC em `C:\tmp\t-wasm-02-browser-inference`.
- **Fonte precedente:** ORQ-15/ADR-0011 já decidiu que CPU basta para compressão. Esta task mede
  embeddings em massa e SLM/classificação; não repete LLMLingua-2.

## 1. Objetivo
Escolher por capacidade/modelo o execution provider browser: ONNX Runtime Web em Wasm SIMD
single-thread, Wasm multithread automático ou WebGPU. Validar também se COOP/COEP, CSP, plugins em
iframe e cold load tornam Wasm-MT inadequado para o runtime real.

## 2. Contexto RAG
- `tasks/ORQ-15.md` e `docs/adr/0011-infra-de-inferencia-local.md` — medições CPU/DML e follow-up.
- `tasks/T-IA-01.md` — embeddings em massa.
- `tasks/T-IA-02.md` — capacidades on-device e sites de execução.
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §§1, 4 e 6 — runtime, site e sandbox.
- `docs/caderno-3-sdk/14-ia-rag-e-agentes.md` §§1–2.
- Documentação/código oficial fixado abaixo sobre threads, inicialização, detecção de runtime e EP.

### Snapshots upstream auditados
- ONNX Runtime commit [`a91b0b4`](https://github.com/microsoft/onnxruntime/tree/a91b0b49cb0dc9670a8cf93263b3d79ce0dc79a5):
  [`js/web/lib/wasm/wasm-core-impl.ts`](https://github.com/microsoft/onnxruntime/blob/a91b0b49cb0dc9670a8cf93263b3d79ce0dc79a5/js/web/lib/wasm/wasm-core-impl.ts)
  separa inicialização JS, download/instanciação Wasm/PThreads, ambiente ORT e sessão; é a referência
  para medir cold load sem misturá-lo com steady-state. O pin de produção deve usar a versão instalada.
- Transformers.js commit [`353007b`](https://github.com/huggingface/transformers.js/tree/353007be131c2e44d16d46ba49b9a56f2955dfd8):
  [`packages/transformers/src/env.js`](https://github.com/huggingface/transformers.js/blob/353007be131c2e44d16d46ba49b9a56f2955dfd8/packages/transformers/src/env.js)
  contém detecção browser/worker/WebGPU; e
  [`packages/transformers/src/backends/onnx.js`](https://github.com/huggingface/transformers.js/blob/353007be131c2e44d16d46ba49b9a56f2955dfd8/packages/transformers/src/backends/onnx.js)
  mapeia `wasm`/`webgpu` aos execution providers do ORT.

## 3. Matriz Obrigatória
1. Wasm SIMD com `numThreads=1`.
2. Wasm com seleção automática de threads; registrar valor efetivo e `crossOriginIsolated`.
3. WebGPU com dtype suportado (`fp16/fp32` ou quantizado conforme modelo).
4. Fallback sem isolamento cross-origin.
5. Dois workloads: embedding em lote real de T-IA-01 e classificador/SLM pequeno de T-IA-02/IA-05.
6. Medidas: init/cold load, first inference, steady-state p50/p95, throughput em lote, memória,
   tamanho/pesos baixados, responsividade da Main Thread e falha/fallback.

## 4. Critérios de Evidência
- Servidor de teste reproduz os headers COOP/COEP e CSP do app; não simular só em `localhost` sem headers.
- Smoke em browser real comprova Worker/iframe quando aplicável.
- ≥30 inferências steady-state por célula, após warm-up, com modelo e dtype idênticos quando possível.
- Escolha é por workload/hardware; não declarar um backend universal.
- GO para MT/WebGPU somente se p95 ou throughput melhorar ≥1,5× e o fallback continuar funcional,
  sem bloquear UI por >50 ms em uma long task atribuível ao workload.

## 5. Não Fazer / Pegadinhas
- NÃO forçar `numThreads=navigator.hardwareConcurrency`; ORT já possui seleção automática.
- NÃO confundir Web Worker com paralelismo interno do Wasm.
- NÃO incluir download do modelo na inferência warm, mas reportar cold load separadamente.
- NÃO tratar QNN/Hexagon como Wasm: se necessário, vira spike nativo separado.
- NÃO relaxar COEP/CSP ou sandbox de plugins apenas para fazer o benchmark passar.
- O harness deve imprimir versões resolvidas, backend/EP efetivo, `crossOriginIsolated`, número efetivo
  de threads e SHA do modelo. Anti-fake: falhar se a célula pedida silenciosamente cair em outro EP.

## 6. Feedback de Especificação
Reendurecer após T-IA-01/T-IA-02 `done`, fixando modelos, versão do ORT/Transformers.js, páginas de
smoke e comandos reais. ORQ-15 é fonte; números de 2026-07-04 não substituem esta matriz browser.

## 7. Definition of Done
- [ ] Matriz por hardware/workload com evidência literal e fallback testado.
- [ ] Veredito por workload: `wasm-1t | wasm-auto-mt | webgpu | node/native`.
- [ ] Impacto de COOP/COEP, CSP e iframe documentado.
- [ ] Task de integração só se o gate quantitativo for atingido.

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.

- **[2026-07-15T18:56]** - *gpt-5* - `[Triado]`: Spike browser Wasm SIMD/MT versus WebGPU triado; reendurecer após T-IA-01 e T-IA-02.
