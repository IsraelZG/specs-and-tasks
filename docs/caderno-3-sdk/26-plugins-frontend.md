# 26-plugins-frontend.md — Plugins de Frontend (UI)

> Fonte: RFC-024 (absorvida e deletada). Estende a RFC-010 (nova categoria de plugin `ui`) e a RFC-008 (página referencia componente isolado como qualquer item do catálogo). Caminho primário = spec-page + componentes ricos providos; o `ui` plugin em iframe é escape hatch (último recurso, validação estrita), não o default. Zero tipo de nó novo.

---

## §1 — O espectro de componentes

Um componente referenciável por uma página vive num espectro de confiança:

1. **First-party (catálogo, RFC-006):** compilado com o app, auditado pelo fluxo de autoria, confiável. Inclui os componentes ricos centrais (planilha, charts, player, game engine — §5).
2. **`ui` plugin de terceiro (§2):** código de terceiro, distribuído por marketplace, isolado em sandbox, validação estrita.

A página (RFC-008) referencia os dois pela mesma sintaxe (nome de catálogo). A diferença é invisível ao autor da página e visível ao renderizador, que isola o plugin de terceiro.

---

## §2 — Categoria `ui` no modelo de plugins

`ui` é a quarta categoria de plugin (ao lado de `compute`, `connector`, `infra` — RFC-010 A.3): plugin tipo `browser` que **renderiza interface**. Declara no manifesto: **props de entrada** (ligadas pela página via ZEN), **intents de saída** (o que pode emitir), e **capacidades solicitadas** (ex.: media plane, WebGPU, câmera) — brokeradas, não ambientes. Distribuição marketplace-only e assinatura como qualquer plugin (RFC-010 A.2).

---

## §3 — Sandbox e envelope

1. `ui` plugin roda **isolado**: iframe sandbox (UI completa) ou Worker + OffscreenCanvas (render headless), com bridge `postMessage`. **Sem DOM** fora da sua fronteira, **sem rede** exceto portas declaradas, **sem grafo** exceto as props recebidas.
2. **Mesmo teto de abuso das páginas (RFC-008 A.5):** o plugin só **emite intents** pela ponte; tudo que muda o mundo passa pelo pipeline normal, assinado pela persona do usuário. Plugin malicioso no máximo *propõe* o que o pipeline rejeita.
3. Orçamento de recurso (CPU/memória/tempo de frame) declarado e imposto pelo host; estouro suspende o plugin, não o app.
4. **Bridge tipada e autenticada.** A bridge `postMessage` é fortemente tipada (esquema declarado no manifesto) e **bidirecionalmente autenticada**: host e plugin verificam a identidade do par a cada mensagem; mensagens fora do esquema declarado são descartadas.
5. **Anti-flood.** A comunicação host↔plugin usa um `MessageChannel` dedicado (porta isolada, não o `window.postMessage` global) com **rate-limit por segundo** imposto pelo host; um plugin que excede o teto de mensagens é throttled e, persistindo, suspenso (item 3), protegendo a aba host de denial-of-service.
6. **Sem canal lateral entre plugins.** Comunicação **direta entre iframes de plugins** é proibida: dois `ui` plugins na mesma tela nunca trocam mensagens entre si. A plataforma é o **broker único** — toda coordenação passa pelo state global (ZEN) e pelo pipeline de intents (item 2), eliminando exfiltração colateral entre plugins.
7. **Origin nulo, sem persistência opaca.** O iframe sandbox é servido em **origin nulo** (`sandbox` sem `allow-same-origin`), desabilitando `localStorage`, `IndexedDB` e qualquer armazenamento persistente opaco. Todo estado do plugin atravessa a bridge via props (entrada) e intents (saída) — não há canal de persistência fora do controle do host.

---

## §4 — Caminho primário: spec-page + componentes providos

1. A regra de ouro: **se cabe em spec + componentes do catálogo, é página** (RFC-008) — não plugin de iframe. Editores, dashboards, ferramentas e a maior parte dos "apps" internos são páginas.
2. O `ui` plugin em iframe é **escape hatch**: reservado ao que genuinamente não se exprime como spec (código arbitrário de terceiro, runtime visual proprietário). Por ser código opaco isolado, recebe o **tier de validação mais estrito** (§6).
3. Critério de admissão como página vs. iframe: é composição de componentes + dados + ZEN? → página. É um motor de render/lógica arbitrário? → componente rico (se genérico e nosso) ou iframe (se de terceiro).

---

## §5 — Games como páginas

1. **Jogos não são compilações em iframe; são páginas** com um componente rico **`GameEngine`** que disponibilizamos (motor 2D e/ou 3D opensource — p.ex. Phaser/PixiJS para 2D, three.js/Babylon para 3D), rodando **spec**: cenas, entidades, regras e níveis são dados + ZEN; o loop de render pesado vive no componente provido.
2. Isso cobre jogos **data-driven**. Jogos de **código arbitrário** caem no escape hatch (§4.2, iframe, validação estrita) — mas não são o caminho recomendado.
3. O `GameEngine` expõe pontos de customização ZEN (regras, física parametrizada, eventos) como qualquer componente rico (RFC-008 A.4), e emite intents (pontuação, conquista, compra in-game via RFC-012).

---

## §6 — Tiers de validação

O gate de marketplace (RFC-010 A.2) aplica tiers por risco: página spec (validação leve, é segura por construção), componente rico first-party (auditoria de autoria RFC-006), `ui` plugin sandbox (validação média), **iframe de código arbitrário / 3D pesado (tier mais estrito** — análise de recurso, fingerprinting, abuso de GPU). Critérios variam por implementação ([[modalidade-de-rede]]).

---

## §7 — Limites honestos

1. Iframe de terceiro tem custo e superfície de risco reais (recurso, fingerprinting) — por isso é exceção, não default.
2. Game data-driven é limitado pelo que o `GameEngine` expõe; jogo que exige código próprio paga o preço do escape hatch (validação longa, isolamento).
3. Isolamento de sandbox não é perfeito contra side-channels; o tier estrito mitiga, não elimina.
