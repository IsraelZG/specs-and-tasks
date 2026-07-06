# ADR-0011 — Infra de inferência local: LLMLingua-2 domina kompress; CPU já basta para compressão; GPU/NPU fica para embeddings em massa

- **Data:** 2026-07-04
- **Status:** Accepted
- **Autor:** claude-fable (spike ORQ-15, follow-up do ORQ-14)
- **Decisores:** arquiteto da plataforma (Israel)
- **Hardware medido:** Snapdragon X (X126100) — Oryon 8c · Adreno X1-45 (driver 31.0.112.0) · Hexagon NPU (presente, OK)
- **Bancada:** `tools/orchestrator/context-bench.poc.mjs` VIA 4/5 (`ORQ14_ONNX=1`, `ORQ14_EP=cpu|dml`)
- **Antecedentes:** ADR-0009 (nano+CCR) · ADR-0010 (kompress ONNX — **parcialmente superado por este**: o veredito "GO condicional on-device do kompress" é substituído pelo LLMLingua-2, Decisão D)

---

## Contexto (reframe)
Não é "um compressor": é a **infra de inferência local** que servirá todos os usos planejados de
modelo local — compressão de contexto, embeddings (T-IA-01), classificador do palette (T-IA-05),
transcrição. Um runtime (ONNX Runtime), N modelos intercambiáveis por caso de uso. Este spike
valida o ORQ-14, responde o que o proxy Headroom local realmente roda, testa offload GPU/NPU de
verdade, e compara kompress × LLMLingua-2 × nano.

## Decisões

### Decisão A — O proxy Headroom (0.26.0) RODA o ML por conteúdo novo; parece rápido por cache + router
Medição contra o proxy standing (`:8787`, uptime 40h, 974 requests, média **8,5%**):
```
caderno-14 (2671 tok): run0 8183ms (router:text:0.58) · run1 28ms · run2 22ms   ← cache por hash
caderno-28 (2106 tok): 4654ms  (router:text:0.56)   — conteúdo novo, frio
caderno-12 (5220 tok): 11281ms (router:text:0.62)   — escala com o tamanho
```
**Resposta à pergunta do arquiteto:** o proxy usa sim o modelo (tier `router:text`), e Python NÃO é
mais rápido — o custo frio (4,6–11,3s) é a mesma ordem do nosso ONNX in-process. As chamadas do dia
a dia não têm delay porque (i) **cache de resposta** por hash devolve em ~25ms, e (ii) o **router
protege código** (a maior parte do teu tráfego) — por isso a média fica em 8,5% e o tier caro quase
nunca roda. A compressão de prosa dele opera a ~35–40% (ratio 0.56–0.62), conservadora.

### Decisão B — Matriz de EPs neste hardware (medida, não suposta)
| EP | disponível? | resultado |
|---|---|---|
| `cpu` | ✓ npm arm64 | funciona; números na Decisão D |
| `dml` (Adreno X1-45) | DLL presente no npm arm64 | **✗ FALHA**: `887A0005 — instância de dispositivo GPU foi suspensa` (device-removed) em `LayerNormalization` (kompress) e na criação de sessão (L2). Driver 31.0.112.0 não sustenta o workload. Erro literal no gate. |
| `webgpu` (browser) | onnxruntime-web | não testado aqui — caminho do superapp on-device; follow-up (Decisão F) |
| `qnn` (Hexagon NPU) | **não existe no npm Node** | exige `onnxruntime-qnn` (Python) ou C API; follow-up (Decisão F) |

### Decisão C — kompress ≠ nano (mecanismos diferentes, papéis diferentes)
- **kompress/LLMLingua-2 (extractivo):** classificador por token — dropa filler, preserva tokens
  originais *verbatim* (nunca alucina), task-agnóstico, custo marginal 0, offline.
- **nano deepseek-flash (abstractivo):** LLM instruído — reescreve/resume, **segue instrução
  dirigida** ("só as linhas de erro", "agrupe por pacote"), lida com input grande em 1 chamada;
  pode alucinar; precisa de rede e custa ~US$0.0004.
Não são o mesmo: um é filtro genérico verbatim-safe; o outro é sumarizador dirigível. O ladder
(Decisão E) usa os dois em degraus distintos.

### Decisão D — LLMLingua-2 **domina** o kompress (medido; kompress descartado)
Bench CPU (mesmos payloads; L2 = `KatawaDead/llmlingua-2-bert-base-multilingual-cased-meetingbank-onnx-int8`,
179MB, base MIT da Microsoft, janela 512, **agregação por palavra** via `##`):
```
modelo       payload             base  thr  keep%  out-tok    Δ     ms
kompress     prosa (.md)         1960 0.70    23%      331   83%   3024 (janela 2048)
llmlingua2   prosa (.md)         1960 0.70    45%      216   89%    268 (janela 510)
[amostra kompress @0.7]  "28shellposomd Md026caderno4/02modulecodesplmdpos mód painc…"   ← ilegível
[amostra llmlingua2 @0.7] "28 shell - composicao. md Shell Aplicação Composição de Módulos
                           Fonte RFC-026 absorvida deletada…"                             ← legível, PT
```
**~20× mais rápido** (200–300ms/janela vs 3–5,4s), **saída legível** (agregação por palavra elimina
a corrupção de subword do ORQ-14), **multilíngue** (português nativo — kompress é anglocêntrico).
ORQ-14 validado e superado no mesmo passo: os números do kompress reproduziram (87%/24% keep @0.5/0.85),
e o L2 venceu em todos os eixos que importam. Ressalvas honestas: janela 512 exige **chunking**
(prosa 2k tok ≈ 4 janelas ≈ ~1s total — ainda ≫ melhor); treinado em MeetingBank (domínio reunião,
não tool-output — mesmo assim ganhou); conversão ONNX é de comunidade (na integração, re-exportar
do modelo oficial `microsoft/llmlingua-2-*` com `optimum`). Código continua NUNCA passando por
compressor lossy (regra do router, mantida).

### Decisão E — O ladder final de compressão (e a via fora-da-caixa)
1. **Crusher estrutural** (0ms, determinístico) — listagens/JSON repetitivo.
2. **LLMLingua-2 por palavra** (~250ms/janela, offline, custo 0) — prosa/log genérico. *(novo degrau)*
3. **Nano instruído** (2–5s, ~US$0.0004) — quando a tarefa dita o filtro ("só erros") ou o input é
   gigante (1 chamada resolve).
4. **CCR store local** — sempre, embaixo de todos (original recuperável; lossy nunca é destrutivo).

**Fora-da-caixa (análise, a validar em T-IA-01):** compressão extractiva **por sentença** usando o
modelo de embedding que T-IA-01 já traz — ranqueia sentenças por relevância à query da task e corta
no orçamento. Query-aware (o que L2/kompress não são), zero corrupção (sentenças inteiras), **zero
modelo novo** (reusa a infra de embeddings). Candidata a degrau 2,5 do ladder; medir quando o
`vector_index` existir. E o insight de infra: **um runtime ORT único** serve compressor (179MB) +
embeddings + SLM do palette — os modelos são dados, não dependências.

### Decisão F — Follow-up de hardware (spec do próximo spike, se/quando o gatilho vier)
**O gatilho de latência interativa (ORQ-14 §0.iii) já foi atendido em CPU pela troca de modelo** —
compressão não precisa mais de GPU. O que ainda justifica acelerador: **embeddings em massa**
(T-IA-01, acervo inteiro) e **SLM do palette** (T-IA-05). Quando vier: (i) `onnxruntime-web`
WebGPU no Adreno (browser — o caminho real do superapp; testar no shell da Bancada); (ii)
`onnxruntime-qnn` no Hexagon NPU via Python/WSL ou C API (o acelerador certo desta máquina,
inacessível via npm hoje); (iii) máquina x64+dGPU para baseline comparativo. Cada um é um spike
pequeno com a mesma bancada.

## Consequências
- ADR-0010 parcialmente superado: kompress **descartado** (dominado); o restante (viabilidade ORT
  in-process, constraints CPU O(n²), NO-GO de substituir o nano) permanece válido.
- ORQ-13 (otimizador do adapter) ganha um degrau novo barato: L2 como tier lossy offline entre o
  crusher e o nano — integração é follow-up após ORQ-13 base.
- O proxy Headroom standing continua fora do fluxo do adapter (ADR-0009 mantido); agora sabemos
  *por que* ele parecia barato — e que não era mágica de Python.
- Dep `@huggingface/transformers` (tokenizers) + `onnxruntime-node` ficam no pacote do orchestrator;
  modelos em `~/.cache/` (nunca no repo).

## Gate (evidência) — `ORQ14_ONNX=1 ORQ14_EP=cpu node --env-file=../../.env context-bench.poc.mjs`
Tabela completa (18 linhas, kompress × L2 × 3 payloads × thr 0.5/0.7/0.85) + amostras de qualidade +
probe do proxy (3 medições) + erro literal do DML colados na §8 de `tasks/ORQ-15.md`.

## Referências
- `tasks/ORQ-15.md` (gate) · `tasks/ORQ-14.md` · ADR-0009/0010
- `huggingface.co/microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank` (MIT, oficial) ·
  conversão medida: `KatawaDead/...-onnx-int8`
- `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` §3/§4/§9 · T-IA-01 · T-IA-05
