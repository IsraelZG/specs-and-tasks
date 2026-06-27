# ADR 0006 — Gate de regressão visual: Playwright `toHaveScreenshot` (não Lookout)

- **Status:** aceito (2026-06-27 — spike T-020, capacity `opus-spike`)
- **Decisores:** arquiteto (via worker Antigravity)
- **Resolve:** [T-020](../../tasks/T-020.md) — spike "decidir gate de regressão visual (Lookout vs Playwright `toHaveScreenshot`)"
- **Afeta:** `packages/design-system` (gate visual), `@plataforma/testkit` (preset de E2E), showcase
  (`apps/design-system-showcase`)

---

## Problema

O `packages/design-system` precisa de um **gate de regressão visual** — um veredito automático
Pass/Fail que compare o render de um componente contra uma baseline, rodando no CI. A spike T-020
colocou duas opções em disputa:

- **Opção A — Lookout** (`alexmchughdev/lookout`): binário Go que sobe Chromium via `chromedp`,
  tira um screenshot e o submete a um **modelo de visão computacional**, retornando um veredito
  **semântico** Pass/Fail. Proposta no
  [RFC `rfc- plugin_architecture_blueprint - draft.md`](../rfcs/rfc-%20plugin_architecture_blueprint%20-%20draft.md)
  §3.1 (`lookout-plugin`), cujo argumento é: veredito por modelo de visão reduz o falso-positivo de
  "loop infinito de CSS" de agentes de IA.
- **Opção B — Playwright `toHaveScreenshot`**: regressão visual **nativa** do Playwright por diff de
  pixel. A [T-021](../../tasks/T-021.md) já traz Playwright + Chromium para o CI (nos dois runners
  da matriz [T-019](../../tasks/T-019.md)) via um **preset compartilhado**
  `createPlaywrightConfig` em `@plataforma/testkit`, com o showcase como 1º consumidor.

O RFC que argumenta a favor do Lookout está em **`draft` (não-absorvido)** e **não especifica**
instalação, plataforma do binário, nem o modelo de visão/custo — exatamente os pontos que um spike
deve verificar antes de comprometer infraestrutura. Enquanto isso, a Opção B entra "de graça"
porque a T-021 coloca Playwright+Chromium no CI de qualquer forma. A spike existe para resolver,
**com evidência**, as duas confirmações bloqueantes antes de decidir.

---

## As duas confirmações (corpo da spike — respondidas com evidência)

A [regra de decisão da T-020 §4](../../tasks/T-020.md) exige que **ambas** as confirmações deem
verde para a ADR poder escolher o Lookout; **qualquer vermelho** → Playwright `toHaveScreenshot`.

### Confirmação #1 — Plataforma (binário x64 **E** arm64 nos runners da T-019?) · 🔴 VERMELHO

**Pergunta:** o binário Lookout tem release pré-compilado (ou caminho de build viável em CI) para
`linux/amd64` (`ubuntu-latest`) **E** `linux/arm64` (`ubuntu-24.04-arm`)?

**Evidência:** O próprio Makefile / `make cross` do projeto entrega apenas:
`linux-amd64`, `darwin-amd64`, `darwin-arm64`, `windows-amd64.exe`. **Não há alvo `linux-arm64`.**
- Fonte: <https://github.com/alexmchughdev/lookout/blob/main/Makefile> (alvos do `cross`)
- Fonte: <https://github.com/alexmchughdev/lookout/releases> (assets por release acompanham o `make cross`)

**Consequência:** no runner `ubuntu-24.04-arm` (arm64) da matriz T-019 não há binário pré-compilado.
A única via seria `go install`/`go build` a partir do fonte — o que (a) adiciona um **segundo
toolchain** (Go 1.22+) a um CI que hoje é só Node/pnpm, e (b) não foi verificado quanto a deps CGO
do `chromedp` em arm64. A spike T-020 dizia: *"Não assuma que `go install` resolve arm64 sem
verificar"* — e de fato a distribuição oficial **não** entrega arm64.

> A Confirmação #1 **falhou parcialmente**: arm64 não tem binário; exigiria toolchain Go extra.
> Isso já seria suficiente para descartar o Lookout, mas a Confirmação #2 é ainda mais decisiva.

### Confirmação #2 — Modelo de visão / credencial · 🔴 VERMELHO (decisiva)

**Pergunta:** qual modelo de visão o Lookout usa e ele exige credencial/custo **não provisionado**
neste repositório?

**Evidência:** A própria descrição do repositório declara a natureza do veredito —
*"plug-and-play visual QA CLI: chromedp + **local vision model**"* (título/descrição do repo). O
README estabelece que o modelo de visão, por padrão, **roda localmente via Ollama** — o que é
"gratuito e privado" mas **exige uma GPU** (≈8 GB VRAM para o modelo padrão), ou roda em CPU com
alto custo de tempo (~15–60 s por veredito) e demanda de RAM (~32 GB). A alternativa documentada é
**plugar uma API key de provedor hospedado** (Anthropic ou OpenAI), cobrada por token.
- Fonte: <https://github.com/alexmchughdev/lookout> (README — seção de modelo de visão /
  "local vision model"; variável de ambiente de API key do provedor hospedado)

**Consequência:** os runners GitHub-hosted da matriz T-019 (`ubuntu-latest`, `ubuntu-24.04-arm`)
**não têm GPU**. E este repositório **não provisiona** nenhuma chave de API de LLM (Anthropic /
OpenAI) — nem no CI, nem em segredos documentados. Logo, na infraestrutura de CI que efetivamente
existe, o veredito semântico do Lookout **não funciona** sem provisionar hardware (GPU) que não há
ou credencial (chave paga) que não existe. A spike T-020 dizia: *"Se exigir credencial não
provisionada, isso é vermelho para a Opção A — não contorne com um 'modelo grátis substituto' não
documentado."*

> A Confirmação #2 **falhou de forma decisiva**: sem GPU no CI e sem credencial de LLM provisionada,
> o Lookout não produz veredito. Esta única confirmação já determina a decisão.

---

## Alternativas consideradas

| Alternativa | Por que foi considerada | Por que foi rejeitada / aceita |
|---|---|---|
| **Opção A — Lookout** | Veredito **semântico** (modelo de visão) é, em tese, mais robusto a ruído de antialiasing de fontes cross-arch e a "loops de CSS" de agentes de IA; argumento do RFC §3.1 | **Rejeitada.** Confirmação #2 falha (sem GPU no CI; sem credencial de LLM provisionada) **e** Confirmação #1 falha (sem binário `linux-arm64`; exigiria toolchain Go extra). RFC que a motivou está em `draft`, não-absorvido, e **não especificava** justamente o que falhou |
| **Opção B — Playwright `toHaveScreenshot`** | Regressão visual **nativa** do Playwright (diff de pixel); entra com **infra marginal ~zero** porque a T-021 já põe Playwright+Chromium no CI via preset compartilhado; nativo nas duas arquiteturas; sem credencial | **Aceita.** Única opção que funciona na infra que existe hoje |
| PoC descartável (T-020 §3 `[OPTIONAL/THROWAWAY]`) | Provar `toHaveScreenshot` disponível ou rodar `lookout --help` num runner | **Não executado.** A evidência do README/releases do Lookout é conclusiva para as duas confirmações; `toHaveScreenshot` é asserção nativa do Playwright (já trazido pela T-021). Não há o que provar |

---

## Decisão

**Opção B — Playwright `toHaveScreenshot`**, executada **dentro do preset compartilhado da T-021**
(`createPlaywrightConfig` em `@plataforma/testkit`), com o showcase
(`apps/design-system-showcase`) como 1º consumidor. **Sem** infra local (config/baseline) dentro de
`packages/design-system` — o config mora no consumidor (showcase), os defaults moram no preset
(testkit), exatamente como a T-021 fixou para o E2E funcional.

O **Lookout é descartado** para o gate visual do `packages/design-system`, primariamente pela
**Confirmação #2** (sem GPU no CI + sem credencial de LLM provisionada) e agravado pela
**Confirmação #1** (sem binário `linux-arm64`).

---

## Justificativa

1. **A regra de decisão da spike é vinculante e foi cumprida à risca.** T-020 §4: *"se qualquer uma
   der vermelho → a ADR escolhe Playwright `toHaveScreenshot`."* Ambas deram vermelho; a decisão por
   B não é preferência, é consequência da regra.
2. **Infra marginal ~zero.** Playwright + Chromium já entram no CI pelos dois runners da T-019
   (x64 e arm64) via o preset da T-021. Ativar `toHaveScreenshot` **não adiciona** toolchain,
   credencial nem hardware — apenas baselines e asserções nos specs. O Lookout adicionaria os três.
3. **Natividade cross-arch.** `toHaveScreenshot` roda idêntico em `ubuntu-latest` e
   `ubuntu-24.04-arm` (Chromium existe nas duas arquiteturas). O Lookout não tem nem binário arm64.
4. **Não comprometer infra a partir de intenção.** O RFC §3.1 descreve **intenção** (veredito
   semântico contra loops de CSS), não **operação** — não especificava instalação, plataforma, nem
   modelo/custo. A spike verificou o que o RFC omitiu e o veredito é: não opera na infra existente.
5. **Ônus da prova é de quem adiciona toolchain.** Em empate técnico, a T-020 §4 manda preferir
   menor custo de operação/manutenção. Não houve empate: o Lookout falhou em duas confirmações.

---

## Trade-offs aceitos (regressão visual por diff de pixel)

- **Falso-positivo por antialiasing de fontes cross-arch.** Diff de pixel (B) pode divergir entre
  x64 e arm64 por renderização de fontes/subpixel. **Mitigação:** snapshots **por arquitetura**
  (projetos separados do Playwright por `runner.arch`) **ou** tolerância via
  `maxDiffPixelRatio` / `threshold` no `toHaveScreenshot`. O Lookout (veredito semântico) seria
  teoricamente mais estável a isto — mas só **se** a Confirmação #1 passasse, o que não ocorreu.
  Este trade-off é aceito como custo de uma opção que de fato funciona.
- **Aceitação de nova baseline.** Toda regressão visual vira falso-positivo permanente sem processo
  de re-baseline quando o design muda legitimamente (ex.: troca de tokens em
  [T-013](../../tasks/T-013.md)). **Mitigação:** `playwright test --update-snapshots` para aceitar a
  nova baseline, com **review humano** dos diffs no PR (o snapshot re-gerado é versionado). O
  equivalente no Lookout seria `lookout --rebaseline` (modo de re-baseline) — irrelevante aqui.
- **Portais (Tier B da [T-018](../../tasks/T-018.md) — `Popover`, `Tooltip`, `DropdownMenu`).**
  Renderizam **fora** do container raiz (portal em `document.body`). **Mitigação:** a asserção
  `toHaveScreenshot` deve fotografar `document.body` inteiro (ou o `page`), não o container do
  componente — caso contrário o portal fica fora do frame. Anotado para a task de implementação.
- **"Loop infinito de CSS" de agentes de IA** (argumento original do RFC a favor do veredito
  semântico). Mitigado **operacionalmente**, não por ferramenta: o gate é `toHaveScreenshot` num
  pipeline de CI determinístico; agentes não consomem seu veredito em loop — o veredito é
  Pass/Fail binário no PR, igual ao do Lookout na prática de integração.

---

## Riscos mitigados

| Risco | Mitigação |
| :--- | :--- |
| Divergência de pixel x64↔arm64 quebra o CI em um dos runners | Snapshots por `runner.arch` (projeto Playwright por arquitetura) e/ou `maxDiffPixelRatio` |
| Baselines desatualizadas geram ruído permanente em mudanças legítimas de design | `--update-snapshots` com review obrigatório do diff no PR; baseline versionada |
| Portais fotografados parcialmente (fora do frame) | Especificar `fullPage`/`document.body` no `toHaveScreenshot` dos componentes com portal |
| Decide-se reintroduzir Lookout futuramente | A porta fica aberta: se (a) GPU for provisionada no CI **ou** credencial de LLM, **e** (b) houver binário/build arm64, reabrir como nova ADR. Esta ADR descarta para a infra **atual** |

---

## Recorte da task de implementação subsequente

Esta ADR **não implementa** o gate — apenas decide a ferramenta. A implementação é uma task
criável via `generate-task.mjs`, **reusando o arcabouço compartilhado da T-021** (`@plataforma/testkit`,
showcase como 1º consumidor), **sem** infra local no design-system:

> **Task subsequente (B vencedor) — ativar `toHaveScreenshot` + baselines no showcase:**
> - Em `apps/design-system-showcase`, adicionar asserções `toHaveScreenshot(...)` aos specs E2E
>   existentes/criados (showcase = 1º consumidor), **reutilizando o `webServer`/preset da T-021**
>   (`createPlaywrightConfig`, boot via `pnpm --filter design-system-showcase dev`).
> - Capturar baselines iniciais (`--update-snapshots`) e versioná-las (em
>   `apps/design-system-showcase/e2e/` ou diretório de snapshots do Playwright).
> - Estratégia cross-arch: snapshots por `runner.arch` **ou** `maxDiffPixelRatio` — decidir na task
>   com PoC nos dois runners da T-019.
> - Para componentes com portal (Tier B da T-018), fotografar `document.body`/`fullPage`.
> - **Não** criar `lookout.config.yaml`, binário, `visual:check` próprio, nem step de CI novo — o
>   gate visual entra pelo mesmo `test:e2e`/preset da T-021.
> - CI: roda nos dois runners da T-019 (já com Chromium via `npx playwright install --with-deps`).

> **Se a Opção A (Lookout) houvesse vencido** (não é o caso), o recorte seria: instalar binário
> Lookout + config do gate visual + step de CI (com build arm64 via Go e/ou GPU/credencial), subindo
> o showcase pelo mesmo harness da T-021. Descartado pelas confirmações.

---

## Referências cruzadas

- [T-020](../../tasks/T-020.md) — spike originária (regra de decisão §4, confirmações §5, DoD §7)
- [T-021](../../tasks/T-021.md) — preset compartilhado `createPlaywrightConfig` (`@plataforma/testkit`),
  showcase como 1º consumidor, Playwright+Chromium no CI
- [T-019](../../tasks/T-019.md) — matriz de CI `ubuntu-latest` (x64) + `ubuntu-24.04-arm` (arm64)
- [T-018](../../tasks/T-018.md) — tiers de componentes (A/B); portais que fotografam `document.body`
- [T-013](../../tasks/T-013.md) — mudança legítima de tokens (gatilho de re-baseline)
- [RFC `rfc- plugin_architecture_blueprint - draft.md`](../rfcs/rfc-%20plugin_architecture_blueprint%20-%20draft.md)
  §3.1 — argumento (em `draft`, não-absorvido) a favor do Lookout
- Evidência externa (Lookout):
  - README e descrição do repo: <https://github.com/alexmchughdev/lookout> — "chromedp + local vision
    model"; modelo local via Ollama exige GPU, ou API key Anthropic/OpenAI (paga)
  - Makefile (`make cross`): <https://github.com/alexmchughdev/lookout/blob/main/Makefile> — alvos
    sem `linux-arm64`
  - Releases: <https://github.com/alexmchughdev/lookout/releases> — assets acompanham o `make cross`
