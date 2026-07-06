# ADR-0010 — Compressor ML in-process via ONNX (kompress-v2-base): viável, mas o lar é on-device, não o orquestrador

- **Data:** 2026-07-03
- **Status:** Accepted — **parcialmente superado por ADR-0011 (2026-07-04):** o kompress foi
  descartado (LLMLingua-2 domina em latência ~20×, legibilidade por agregação de palavra, e
  multilíngue); permanecem válidos a viabilidade ORT in-process, os constraints de CPU O(n²) e o
  NO-GO de substituir o nano. Números daqui foram **validados por re-run** no ORQ-15.
- **Autor:** claude-haiku (spike ORQ-14, por comando direto do arquiteto; task é opus-spike)
- **Decisores:** arquiteto da plataforma (Israel)
- **Bancada:** `tools/orchestrator/context-bench.poc.mjs` (VIA 4, gated `ORQ14_ONNX=1`) · `onnxruntime-node` + tokenizer `@huggingface/transformers@4.2.0`
- **Antecedente:** ADR-0009 (nano-preprocess como tier lossy) — este spike avalia trocar o motor desse tier por ML local.

---

## Contexto
ADR-0009 deferiu (Decisão E) o port do compressor semântico do Headroom. ORQ-14 mede se ele roda
in-process, substituindo o nano (deepseek-flash) no tier de prosa com custo marginal zero e offline.

## Premissa provada
O modelo ML **roda in-process, sem proxy e sem Python** — a hipótese estrutural do spike vale.

## Decisões

### Decisão A — O modelo: `chopratejas/kompress-v2-base`
- **Licença Apache-2.0** (uso comercial livre) ✓ · base **ModernBERT-base (149M)** + LoRA + dual head.
- Tokenizer ModernBERT (padrão, carregável pelo `@huggingface/transformers` — agnóstico ao model_type).
- **ONNX já no repo:** `onnx/kompress-int8-wo.onnx` (274MB, weight-only int8) e `kompress-fp32.onnx`
  (601MB). Não precisa exportar. Downloads: 1.7k, 24 dias. Há variante CoreML de comunidade.

### Decisão B — Receita de invocação (extractivo, não generativo)
Token-classification: forward pass único → output `final_scores` shape `[1, seq]` = **P(keep)∈[0,1]
por token**. Threshold (default 0.5) → dropa tokens abaixo → detokeniza os mantidos. Sem geração, sem
decoder, sem sampling. **Armadilha portada:** o `config.json` declara `model_type: "kompress_v2"`
(custom `HeadroomCompressorV2`) — o `AutoModel` do Transformers.js falha (`Unsupported model type`);
a solução é rodar o grafo ONNX **direto no `onnxruntime-node`** (inputs `input_ids`+`attention_mask`
int64, output `final_scores`), reusando só o tokenizer. Portável a `onnxruntime-web` sem mudança.

### Decisão C — Números medidos (bancada, VIA 4, CPU, janela 2048 tok)
```
payload                 base  thr  keep%  out-tok    Δ     ms
código (.mjs)           3442 0.50    87%     1249   64%   3931 (janela 2048tok)
código (.mjs)           3442 0.85    24%      353   90%   3573 (janela 2048tok)
prosa (.md)             1960 0.50    61%      919   53%   2945 (janela 2048tok)
prosa (.md)             1960 0.85     5%       70   96%   3464 (janela 2048tok)
listagem (ls -R)      123478 0.50    97%     1081   99%   4976 (janela 2048tok — só vê 2048 do total)
listagem (ls -R)      123478 0.85    38%      431  100%   7974 (janela 2048tok — idem)
```
Leitura: **a compressão é controlada por threshold** — a 0.85 a prosa dá **96%** (supera o nano, 89%);
a 0.5 é conservador. **Curva real, ajustável.**

### Decisão C' — Os dois constraints que definem o veredito
1. **Latência CPU O(n²).** A probe deu 360ms por ser 174 tokens; em payloads reais (2048-tok janela)
   é **3–8s**. Sem GPU e por ser atenção quadrática, **não escala**: janela de 8000 tok **estourou
   memória** (tentou alocar ~3GB) → inputs grandes exigem **chunking** (um listing de 123k = ~60
   janelas × 3–8s = minutos). Inviável para tool-output grande em CPU.
2. **Corrupção de subword.** Extractivo em granularidade de subword dropa pedaços de palavra
   ("busca"→"bus", "para tomar"→"paramar"). Preserva tokens originais (menos lossy que geração) mas
   **quebra legibilidade** em threshold alto — mitigável dropando em fronteira de palavra (não medido).

### Decisão D — Go/No-Go por gatilho
| eixo | nano (ADR-0009) | kompress ONNX CPU (aqui) |
|---|---|---|
| custo/chamada | ~US$0.0004 | **0** |
| latência (2k tok) | 2–5s | 3–8s (janela; **chunk p/ maior**) |
| offline | ✗ (rede) | **✓** |
| instrução dirigida ("só erros") | ✓ (é LLM) | ✗ (só keep/drop genérico) |
| input grande | trivial (1 call) | **ruim** (chunking O(n²)) |
| dep | nenhuma | modelo 274MB + ORT |

- **NO-GO** para substituir o nano **no orquestrador (lab)**: o nano é mais simples, segue instrução,
  velocidade comparável, sem 274MB de modelo, e lida com input grande em 1 chamada. O ML CPU perde.
- **GO condicional** como **tier on-device offline do superapp** (plugin de compute, T-IA-02 /
  `onnxruntime-web`): é o único contexto onde os trunfos do ML (offline, custo-zero) importam e onde
  não há nano/rede. **Condições de ativação:** (i) acelerador **WebGPU** (CPU O(n²) é proibitivo);
  (ii) **chunking** por janela ≤2048; (iii) drop em **fronteira de palavra** (anti-corrupção).
  Enquanto essas três não existirem, fica especificado-por-antecipação, não construído.

## Consequências
- **Positivas:** a alternativa offline está **provada e dimensionada** — sabemos exatamente o custo
  (WebGPU + chunking + word-boundary) ANTES de comprometer. Cumpre o objetivo do spike ("especificar
  por segurança"): o gatilho (ii)-offline do ORQ-14 tem agora um caminho técnico real.
- **Negativas / limites:** em CPU não vale; subword corrompe; modelo de 274MB é peso de plugin
  on-device não-trivial (avaliar `kompress-small`, 69.8M, se o tamanho pesar no browser).
- **Descartado hoje:** trocar o nano do orquestrador pelo ML. ADR-0009 (nano+CCR) segue de pé.

## Gate (evidência) — `ORQ14_ONNX=1 node --env-file=../../.env context-bench.poc.mjs`
Tabela VIA 4 acima (saída literal colada na §8 de `tasks/ORQ-14.md`). Sessão ORT criada em ~1s,
inputs `["input_ids","attention_mask"]`, output `["final_scores"]`, ONNX int8 274MB.

## Referências
- `tools/orchestrator/context-bench.poc.mjs` (VIA 4 gated) · `docs/adr/0009-*.md` (nano+CCR) · `tasks/ORQ-14.md`
- Modelo: `huggingface.co/chopratejas/kompress-v2-base` (Apache-2.0, ONNX int8 no repo)
- `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` §4 · T-IA-02 (compute on-device)
