# Plano de Aplicação (Camada 2) — Marcos por Produto

> **Canônico.** Roadmap da **camada de aplicação**, construída sobre a plataforma
> (`plano-de-implementacao.md`, M0–M9). Aqui ficam as **fundações de aplicação** (transversais) e os
> **produtos** (módulos de negócio). Promovido de `docs/rfcs/plano-de-modulos.md` +
> `docs/rfcs/diff-preparativos-plano.md` (2026-06-19), agora reconciliado com os IDs de task reais.
> Correlação task↔plano↔status: [`tasks/_correlacao-plano.md`](../tasks/_correlacao-plano.md).

## Duas camadas
- **Camada 1 — Plataforma** (`plano-de-implementacao.md`, M0–M9): protocolo/SDK + harness (Bancada) + PWA-prova. Inclui UI de teste.
- **Camada 2 — Aplicação** (este doc): fundações de app (páginas, workflow, conectores, jurisdição, plugins, design-system, shell) + módulos de negócio + UI de produto.

## Princípios
1. **Transversais primeiro.** Nenhum produto (P1) começa antes da sua fundação transversal (P0) entregue.
2. **1 marco = capacidade demonstrável** ponta a ponta, não bloco de código solto.
3. **Spec-first + DoD por tipo** (herda §0.2 do plano da plataforma). Vetores adversariais fecham cada grupo.
4. **Lente sobre subgrafo:** produtos que compartilham subgrafo (marketplace/ERP/contábil) reúsam, não duplicam.
5. **Dependência de fronteira:** toda task P0/P1 que depende da plataforma declara a task M0–M9 correspondente em `dependencies:`.

---

## Invariantes de TODA UI (cross-cutting — DoD de qualquer task com superfície)
Toda task que renderiza UI (Bancada, shell, páginas, módulos, PWA) DEVE satisfazer, no DoD:
1. **i18n como dado** — nenhuma string literal na UI. Todo rótulo consome `CONTENT:TRANSLATION`
   reativamente (`caderno-3-sdk/04-theme-and-i18n-data-structures.md §2`); placeholders (`{count}`,
   `{name}`) preservados. *(Lint/checagem: sem texto hard-coded em componente.)*
   - **Locales de lançamento:** `pt-BR` (base), `en`, `es`, `fr`, `de`, `it` — toda copy/label nasce com os 6.
   - **Preparado para outros, incluindo RTL** (`ar`, `he`): use **propriedades lógicas** de CSS
     (`margin-inline-start`, `padding-block`, `inset-inline`) e tokens direcionais — **nunca** `left/right`
     físicos — para que `dir="rtl"` espelhe o layout sem reescrita. Ícones direcionais (setas, voltar)
     espelham por `dir`. *(Decisão registrada 2026-06-19; era lacuna — RTL não estava no caderno-04.)*
   - **Formatação locale-aware** de datas/números/moeda via `Intl`, com a moeda/jurisdição resolvida
     por [[jurisdicao]] (T-JU) quando aplicável — não hard-codar `R$`/`,`/`.`.
2. **Tema por tokens** — só variáveis `--ds-*` do design-system; zero literais de cor/espaçamento
   (invariante **I3**, lint anti-literal — T-DS-04). Customização em 4 níveis (app→módulo→página→componente).
3. **A11y baseline** — navegável por teclado, contraste AA, rótulos ARIA nas superfícies interativas.
4. **Responsividade contínua** — multi-coluna ↔ mobile (mecanismo do shell, T-SHL-03).

> Estes 4 itens entram no checklist do `agile-reviewer` para qualquer task `ui: true`.
> Detalhamento de UX: [`diretrizes-ux.md`](diretrizes-ux.md). Telas para mockup: [`inventario-de-telas.md`](inventario-de-telas.md).

---

## Marco 0 (P0) — Fundação Transversal (pré-requisito de todo produto)
**Validação do marco:** uma página spec renderiza no shell, com componente do catálogo, fonte de dados
por projeção, ação por intent, e um workflow Nível 1 dirigindo uma transição — sem código novo além do substrato.
**Depende de:** ciclo M0–M9 da plataforma (transporte/sync/auth/media/engines).

| P0 | Fundação | Tasks | Pode paralelizar com Camada 1? |
|----|----------|-------|-------------------------------|
| P0.1 | **Design System** | T-DS-01..04 (+ incorporação T-011→T-016) | **Sim** — só depende de T-001 (bootstrap), não do protocolo |
| P0.2 | **Conectores externos** | T-CN-01..04 | Após M2 (transporte) p/ Classe D real |
| P0.3 | **Plugins & Computação** | T-PL-01..06 | Após M0/M1 (portas, cripto) |
| P0.4 | **Linguagem de Páginas** | T-PG-01..05 | Após design-system + engines |
| P0.5 | **Jurisdição** | T-JU-01..04 | Após M1 (cripto/SPEC base) |
| P0.6 | **IA, RAG & Agentes** | T-IA-01..06 | Após projeções (M1/M3) + plugins (P0.3) |
| P0.7 | **Workflow** | T-WF-01..05 | Após M6 (intents/Zen) |
| P0.8 | **Plugins de Frontend** | T-UI-01..04 (estende T-PL-01) | Após P0.3 |
| P0.9 | **Módulos como Profiles** | T-MOD-01..04 | Após M5 (UCAN/ASSET:ROLE) |
| P0.10 | **Shell & Composição** | T-SHL-01..05 | Após P0.1 + P0.4 |

---

## Produtos (P1) — Marcos de negócio

| Marco | Produto | Tasks | Depende de |
|-------|---------|-------|-----------|
| **M1** | **Mensageria** (prova do substrato) | T-MSG-01..03 | P0 (shell, plugins, páginas) + media plane |
| **M2** | **Marketplace + Fintech** | T-MK-01..06 | P0 (páginas, jurisdição, workflow, conectores) |
| **M3** | **ERP/CRM** | T-ERP-01..05 | M2 (mesmo subgrafo) + workflow |
| **M4** | **Contábil/Fiscal/RH** | T-CFR-01..05 | M3 + jurisdição + conectores (NF-e/SPED) |
| **M5** | **Mapa** | T-MAP-01..03 | P0 (shell, conectores) · *pré-req de M6* |
| **M6** | **Logística & Fulfillment** | T-LOG-01..05 | M2 + M3 + M5 + workflow |
| **M7** | **Social & Feed** | T-SOC-01..03 | P0 (páginas, IA/RRF) + M1 (DM) |
| **M8** | **Streaming** | T-STR-01..04 | P0 (plugins-frontend, compute) + media + M1 (live-chat) |
| **M9** | **Anúncios** | T-AD-01..03 | M2 (economia) + M7/M8 (superfícies) + IA |
| **M10** | **Email** | T-EML-01..03 | P0 (conectores) |
| **M11** | **Calendário** | T-CAL-01..03 | P0 (workflow) + M5/M10 |
| **M12** | **Suíte Office & Criação** | T-OFF-01..05 | P0 (páginas, plugins-frontend, shell, IA) + Automerge |

> Critérios de validação detalhados por marco: ver a narrativa em `docs/rfcs/plano-de-modulos.md`
> (a ser absorvida aqui na próxima passada).

## Sequência resumida
**P0 (fundação) → M1 (mensageria, validação) → M2–M4 (núcleo comercial) → M5–M6 (mapa, logística) →
M7–M9 (social, streaming, anúncios) → M10–M12 (email, calendário, office).**

Prioriza: prova do substrato (M1), valor comercial (M2–M4), depois cadeia técnica (mapa antes de
logística; superfícies antes de anúncios; office por último — depende de shell + plugins-frontend).

## Contagem
- **P0 (transversais):** 10 fundações, ~46 tasks. **P1 (produtos):** 12 marcos, ~50 tasks. **Total: ~96** (sobre M0–M9).
