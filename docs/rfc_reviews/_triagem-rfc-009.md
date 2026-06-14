# Triagem rfc-009 — Jurisdição e Regionalização de Regras

Fonte: `docs/rfcs/rfc-009-jurisdicao.md` + `docs/rfc_reviews/review_rfc-009.md`
(+ achado de auditoria de consistência: L-03, O-03)

## Contagens por veredito

| veredito | n |
| :--- | :---: |
| INCORPORAR | 1 |
| JA-COBERTO | 0 |
| UI->INVENTARIO | 4 |
| REJEITAR | 0 |
| REVISAR-HUMANO | 2 |
| **Σ** | **7** |

## ⚠ REVISAR-HUMANO (decisão arquitetural — norma NÃO redigida)

- **009-01 — Âncora Merchant-of-Record (MoR).** Tensão arquitetural: A.5.1 define
  o conjunto de âncoras de papel como *fechado e fixo* (vendedor/estabelecimento,
  comprador/entrega, local de prestação, titular), resolvendo "conflito de papel"
  como erro de modelagem. O review pede um modelo de **MoR** (a plataforma/marketplace
  intermedia e assume o papel de revendedor-de-direito), que exige uma âncora
  *adicional e possivelmente extensível* (`RoleAnchor` customizado). Isso supera a
  premissa de conjunto fechado de A.5 e cria mecânica nova de ontologia (papéis
  declaráveis por SPEC vs. enumerados). Toca a fronteira com RFC-012-Marketplace+Fintech.
  Decisão necessária: o conjunto de âncoras é fechado (e MoR é mapeado nas existentes)
  ou aberto/extensível (e como se garante que dois RoleAnchors não reivindiquem o
  mesmo tributo)?

- **009-02 — Modo bloqueante "hard-stop" (fato gerador legalmente bloqueante).**
  Tensão arquitetural: A.4.3 e A.5.3 definem que a ausência de conector degrada
  *silenciosamente* para `fato-negativo-verificável` / "modo degradado declarado",
  e A.5.3 isola a degradação "só naquele papel, sem contaminar os demais". O review
  observa que certos fatos geradores são **legalmente bloqueantes** (sem NF-e não se
  pode expedir mercadoria no BR): a degradação deveria poder *travar o estado da
  operação* (ex.: bloquear `Status de Expedição`), não apenas registrar a obrigação
  não cumprida e seguir. Isso introduz um modo de regra novo — "predicado de bloqueio
  rígido" que altera/impede transição de estado — ausente do modelo atual de degradação
  e potencialmente em contradição com o princípio de "nunca bloquear, sempre registrar
  fato-negativo". Decisão necessária: a SPEC jurisdicional pode declarar uma regra como
  *blocking* e travar o ciclo de vida da operação, e onde mora esse predicado (regra
  própria vs. workflow)?

## Tabela de achados

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 009-01 | §2 — Âncoras de papel extensíveis por `RoleAnchor` p/ modelo Merchant-of-Record (MoR) em marketplace multi-vendor | REVISAR-HUMANO | A.5 (âncoras de papel) ↔ RFC-012 | Supera o conjunto fechado de âncoras de A.5.1; cria mecânica de ontologia (papéis declaráveis vs. enumerados). Tensão descrita no destaque acima. Norma não redigida. | [x] |
| 009-02 | §2 — Fallback degradado deve acionar "Hard Stop Workflow" / predicado de bloqueio quando fato gerador é legalmente bloqueante (ex.: sem NF-e → não expedir) | REVISAR-HUMANO | A.4.3 / A.5.3 (modo degradado) | Contradiz a degradação silenciosa para fato-negativo de A.4.3/A.5.3; introduz modo de regra "blocking" que trava transição de estado. Tensão descrita no destaque acima. Norma não redigida. | [x] |
| 009-03 | Auditoria O-03 — cabeçalho da RFC rotula Marketplace como "RFC-011" e ERP/CRM como "RFC-012" (refs incorretas) | INCORPORAR | Cabeçalho `> **Precedência:**` (linha 3) | Substituir "Pré-requisito de RFC-011-Marketplace+Fintech e RFC-012-ERP/CRM" por "Pré-requisito de **RFC-012**-Marketplace+Fintech e **RFC-013**-ERP/CRM". (Idem demais menções no corpo: `RFC-012 A.5.2` em A.5.2 refere-se ao ERP/CRM → deve apontar para **RFC-013**; verificar e corrigir junto.) | [x] |
| 009-04 | §3 — Atom `JurisdictionBadge` (ícone de bandeira/UF + sigla tributária) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | `JurisdictionBadge` · átomo · módulo Jurisdição/Fiscal — badge com bandeira/UF e sigla tributária resolvida (A.1). | [ ] |
| 009-05 | §3 — Molecule `TaxCompositionRow` (mostra qual regra/variante gerou cada valor) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | `TaxCompositionRow` · molécula · módulo Jurisdição/Fiscal — linha de composição tributária expondo a variante jurisdicional que originou o valor (A.5 composição por papel). | [ ] |
| 009-06 | §3 — Organism `PolicyFallbackBanner` (alerta de conector fiscal falho / contingência-degradação) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | `PolicyFallbackBanner` · organismo · módulo Jurisdição/Fiscal — banner de modo degradado declarado quando conector indisponível (A.4.3/A.5.3). | [ ] |
| 009-07 | §3 — Layout "Máquina do Tempo de Auditoria": seletor de competência (recalcular sob regras de 2024 × atuais) com diff | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | `AuditTimeMachine` · organismo · módulo Jurisdição/Fiscal — seletor de competência para recálculo retroativo sob a vigência da época, com painel de diff (A.3 vigência temporal). | [ ] |

## Notas de extração

- §4 (Modelagem de Grafo) e §5 (Ciclo de Vida) do review apenas **descrevem** o que a
  RFC já normatiza (variantes `SPEC:*@<jur>`, arestas `EXTENDS`/`SUPERSEDED_BY` — A.2.2,
  A.3.3; nascimento/mutação por supersessão/fim-de-vida com persistência para recálculo —
  A.3.2/A.3.3). Não propõem norma nova → não geram achado.
- Layout "Indicador de Multi-Soberania" (§3) foi absorvido no átomo `JurisdictionBadge`
  (009-04); não duplicado como achado próprio.
