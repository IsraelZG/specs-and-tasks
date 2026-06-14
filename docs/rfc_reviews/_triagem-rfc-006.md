# Triagem — rfc-006 (Design System Canônico)

Fonte: `docs/rfcs/rfc-006-design-system.md` + `docs/rfc_reviews/review_rfc-006.md`

## Contagens por veredito

| veredito | nº |
| :--- | :--- |
| INCORPORAR | 3 |
| JA-COBERTO | 1 |
| UI->INVENTARIO | 1 |
| REJEITAR | 0 |
| REVISAR-HUMANO | 3 |
| **Σ achados** | **8** |

## ⚠ REVISAR-HUMANO (decisão arquitetural pendente)

- **006-06** — Aresta nova `HAS_THEME` ligando `CONTENT:THEME` a `PROFILE` (org/usuário). Cria mecânica de ontologia de grafo não prevista na RFC nem no canônico.
- **006-07** — Versionamento de tema por ponteiro `SUPERSEDED_BY` (edição de tema gera novo nó). Mecânica de ciclo de vida/ontologia; interage com o canônico de supersessão.
- **006-08** — Colisão de numeração (audit O-01): A.1 mira `caderno-3-sdk/09-design-system.md` como "novo", mas `caderno-3-sdk/09-hierarchical-theme-customization.md` já existe. Decisão de numeração/realocação do caderno-3/09 é humana.

## Tabela de achados

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 006-01 | §2 — Clarificar shadcn vs. Tailwind: definir se Style Dictionary injeta variáveis no `tailwind.config.js` ou usa CSS modules puro | INCORPORAR | A.1 (existente) | Adicionar como invariante de distribuição: "Os componentes são shadcn-based, mas o vínculo com Tailwind é mediado: **Style Dictionary é a fonte única** das variáveis, exportadas como CSS custom properties; o `tailwind.config.js` (quando presente) **referencia** essas custom properties e nunca declara valores literais. Componentes nunca dependem de utilitários Tailwind com valores embutidos." | [x] |
| 006-02 | §2 — Metadados de catálogo devem carregar marcação de versão/depreciação (ex. `ReplacedBy`) para impedir geração por agentes com componentes legados | INCORPORAR | A.3 (existente) | Estender o schema canônico de metadados: "Cada `ComponentIdentity` carrega marcação de ciclo de vida (`status: stable | deprecated`, `replacedBy?`, `deprecatedSince?`). Componentes `deprecated` permanecem por retrocompatibilidade mas são excluídos das `AIHints` de descoberta para geração — agentes não os propõem para telas novas." | [x] |
| 006-03 | §2 — Fallback automático: `CONTENT:THEME` com buracos semânticos deve cair silenciosa e seguramente para a raiz do tema `light` do core | INCORPORAR | A.1 (existente) | Adicionar invariante I4: "Se um `CONTENT:THEME` injetado omitir tokens da camada de tema, a resolução faz fallback silencioso e determinístico para a raiz do tema `light` do core — nenhum token semântico fica não resolvido em runtime. (Acessibilidade do usuário, I2, ainda prevalece sobre o tema resolvido.)" | [x] |
| 006-04 | §3 — Variáveis ortogonais de Densidade (Compact/Cozy/TV) para dashboards vs. POS touch | JA-COBERTO | A.1 (§Densidade) | RFC A.1 já define densidade como dimensão ortogonal ao tema com modos `compact | cozy | tv` e seletor `:root[data-theme][data-density]`. Sem texto. | [x] |
| 006-05 | §3 — Catálogo de componentes (Atoms/Molecules/Organisms) além do piloto: Label, Avatar, Badge, SkeletonLoader, Switch, Checkbox, CardHeader, FormGroup, Breadcrumb, Dialog/Modal, NavigationSidebar, DataGrid, PageHeader | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Acrescentar linhas (componente · nível atômico · módulo `core/design-system`): Label (átomo), Avatar (átomo), Badge (átomo), SkeletonLoader (átomo), Switch (átomo), Checkbox (átomo), CardHeader (molécula), FormGroup (molécula), Breadcrumb (molécula), MessageBubble (molécula), Dialog/Modal (organismo), NavigationSidebar (organismo), DataGrid (organismo), PageHeader (organismo). Piloto (`Button`, `Input`, `Card`/SuperCard, `Message`, `NavItem`, `Toast`) já coberto por A.2. | [x] |
| 006-06 | §4 — Aresta `HAS_THEME` vinculando `CONTENT:THEME` ao `PROFILE` da org/usuário ativo | REVISAR-HUMANO | — | Tensão: cria tipo de aresta novo de ontologia, ausente da RFC e do canônico de grafo. Não redigir norma; exige decisão arquitetural de modelagem. | [x] |
| 006-07 | §5 — Edição de tema não muta o nó: gera novo `CONTENT:THEME` atado por `SUPERSEDED_BY`, preservando reprodutibilidade de specs passadas | REVISAR-HUMANO | — | Tensão: mecânica de supersessão/ciclo de vida sobre nós de tema; interage com o canônico de supersessão e reprodutibilidade do grafo. Decisão arquitetural. | [x] |
| 006-08 | Audit O-01 — alvo "Onde integrar" de A.1 é `caderno-3-sdk/09-design-system.md` (novo), mas `09-hierarchical-theme-customization.md` já existe (colisão de numeração, severidade alta) | REVISAR-HUMANO | — | Tensão: número 09 já ocupado. Decidir se o design system reusa/funde o 09 existente ou recebe novo número. Não redigir norma. | [x] |
