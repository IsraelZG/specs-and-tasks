# ADR-0009 — Otimização de contexto no AgentAdapter: nano-preprocess + CCR in-process (não o proxy Headroom)

- **Data:** 2026-07-03
- **Status:** Accepted
- **Autor:** claude-fable (spike ORQ-12)
- **Decisores:** arquiteto da plataforma (Israel)
- **Bancada:** `tools/orchestrator/context-bench.poc.mjs` · SDK medido: `headroom-ai@0.22.4` · provider nano: `deepseek-chat` (v4-flash) via `.env`
- **Antecedente:** ADR-0008 (adapter in-process). Contexto conceitual: `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md`.

---

## Contexto

O agente de código enche a janela com **outputs de tool** (arquivos lidos, saída de build, listagens, busca), não com a conversa. ORQ-12 mede se dá pra encolher esses outputs antes de entrarem no contexto, e fixa **o quê integrar no `VercelAgentAdapter`** (ORQ-09b) — ou por que não, com número.

A hipótese registrada (task §1 e caderno §3, 1ª versão) era **`compress()` do `headroom-ai` in-process**. **A hipótese foi FALSIFICADA pela bancada** (Decisão A). O ADR registra o que a medição mostrou.

## Premissa medida (bancada, 3 payloads reais do repo)

```
payload                 base    nativo   Δnat   headroom  nano-out   Δnano  nano-ms
código (.mjs)           3442      3400     1%  3660(-6%)         —      —       —
prosa (.md)             1960      1946     1%  1326(32%)       379    81%    5196
listagem (ls -R)      123478    110364    11%  5952(95%)        65    99%    2317
headroom-ai: ✓ proxy :8787 respondeu — transforms=router:protected:{system,user,recent_code}
nano custo: in=13221 out=545 tok · ~US$0.0004 · reversibilidade CCR local: idêntico=true ✓
```
Token count = estimativa chars/4 (ratios, não absolutos). Δnano medido contra o que o nano consumiu (cap 24k chars).

---

## Decisões

### Decisão A — API real do `headroom-ai`: é CLIENTE HTTP de PROXY, não compressor in-process
`headroom-ai@0.22.4` (`deps: none`, Apache-2.0) é um **cliente HTTP** do proxy Headroom:
`compress(messages, opts)` faz `POST {baseUrl}/v1/compress`, `DEFAULT_BASE_URL = "http://localhost:8787"`
(ou `HEADROOM_BASE_URL`). Toda a lógica (SmartCrusher, ToolCrusher, CCR, content-router) roda
**server-side no proxy Python**; o SDK TS "does not touch the filesystem" (docstring do próprio pacote).
**Consequência:** usar Headroom = manter um **serviço standing** (o mesmo formato que o ADR-0008 matou
para providers, e a mesma porta 8787 do proxy deepseek de `[[project_headroom_proxies_script]]`). É UM
proxy provider-agnóstico (melhor que um por provider), mas não é in-process nem dep-light.

### Decisão B — Onde o Headroom de fato comprime: só `tool_result`/`rag`/turnos velhos
O content-router **protege** `system`, `user` corrente e **código recente** (`router:protected:recent_code`)
— medido: código deu **−6%** (infla). Comprime bem quando o payload é apresentado como **resultado de tool**:
prosa **32%**, listagem **95%**. Ou seja, a qualidade de compressão é real e alta *no alvo certo*, e ele
acerta em NÃO destruir código. Mas isso exige o proxy no ar e apresentar o histórico no formato certo.

### Decisão C — Números e threshold (GO = ≥30% líquido no modelo principal)
| via | código | prosa | listagem | custo | in-process? | perda? |
|---|---|---|---|---|---|---|
| crusher nativo (~40 ln, 0 dep) | 1% | 1% | 11% | 0 | **sim** | não |
| headroom proxy | −6% | 32% | 95% | serviço standing | **não** | reversível via CCR do proxy |
| nano-preprocess (deepseek-flash) | (n/a) | 81% | 99% | ~US$0.0004 | chamada de rede barata | **sim (lossy)** |
| CCR store local (~12 ln) | — | — | — | 0 | **sim** | **zero (reversível)** |

O nano bate o threshold com folga (81–99%) a custo sub-centavo; o crusher nativo sozinho é fraco
(guarda, não ganho); o Headroom entrega 95% mas ao custo de um serviço standing.

### Decisão D — Nano-preprocess: quando disparar
Gatilho por tamanho: só acima de ~**2.000 tokens** de output (abaixo disso a latência 2–5s não paga).
Custo do nano (in=13k+out=545 por 2 payloads ≈ **US$0.0004**) é desprezível vs. tokens poupados no
modelo caro. É **lossy** — por isso **sempre pareado com o CCR store** (original recuperável). O nano
pode também decidir *o que* comprimir (classificador barato antes do crusher/CCR).

### Decisão E — Veredito: GO no padrão próprio in-process; NO-GO em adotar o proxy Headroom
- **NO-GO** em plugar `headroom-ai`/proxy :8787 no adapter: reintroduz serviço standing, e seu ganho
  único (SmartCrusher server-side) é largamente reproduzível in-process por nano+CCR.
- **GO** num **otimizador de contexto próprio, in-process**, na ordem: (1) **crusher nativo** (0-latência,
  0-dep, guarda que nunca destrói código); (2) **nano-preprocess** gated por tamanho (o ganho grande);
  (3) **CCR store local** (grava original por hash, tool `retrieve` re-hidrata) — reversibilidade provada
  na bancada (`idêntico=true`). Nenhum serviço standing, provider-agnóstico, alinhado ao ADR-0008.

**Forma da task de integração (p/ o arquiteto criar):** em ORQ-09b, envolver o `execute()` das tools
readFile/bash/grep com: se `tokEst(out) > 2000` → `store.stash(out)` + (nano-summary OU crusher) no
retorno + registrar tool `retrieve(hash)` ao lado das demais. Não toca o loop nem o provider registry.

---

## Consequências
- **Positivas:** ganho grande (80–99%) nos outputs que importam, in-process, sem serviço standing; código
  nunca é corrompido (crusher/router protegem); reversibilidade por CCR local trivial; vira **plugin do
  superapp** ("provedor de contexto", caderno 30 §7) sem arrastar o proxy Python.
- **Negativas:** nano é lossy (mitigado por CCR); adiciona 2–5s de latência por output grande (gated);
  o crusher nativo é fraco sozinho (só guarda). Perde-se o SmartCrusher server-side do Headroom — aceito,
  porque o nano cobre o mesmo caso a custo desprezível e sem standing service.
- **Descartado:** manter/subir o proxy Headroom (:8787) no fluxo do adapter.

## Gate (evidência) — `node --env-file=../../.env context-bench.poc.mjs`
Ver tabela em "Premissa medida" (saída literal colada na §8 de `tasks/ORQ-12.md`). Reversibilidade:
`original 123478 tok → stash(hash=7ee119cf00a2) → retrieve → idêntico=true ✓`.

## Referências
- `tools/orchestrator/context-bench.poc.mjs` — a bancada
- `tasks/ORQ-12.md` (spike) · `docs/adr/0008-agent-adapter-in-process.md` (adapter)
- `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` §3/§4 (padrões CCR + nano)
- `[[project_headroom_integration]]` · `[[project_headroom_proxies_script]]` — o proxy :8787 que isto NÃO ressuscita
