# Triagem — rfc-023 (Logística, Estoque/WMS e Fulfillment)

**Fonte:** `docs/rfcs/rfc-023-logistica.md` + `docs/rfc_reviews/review_rfc-023.md`

## Contagens por veredito
- INCORPORAR: 0
- JA-COBERTO: 5
- UI->INVENTARIO: 6
- REJEITAR: 1
- **REVISAR-HUMANO: 2**

Σ vereditos = 14 = nº de achados extraídos.

## ⚠️ REVISAR-HUMANO (decisão arquitetural — não redigir norma)
- **023-01** — IA Julgadora Neutra via `compute` RAG para resolver disputa de escrow (analisa foto/horário/coordenada vs SLA, resolução inicial antes do apelo humano). A RFC A.5 já tem a disputa como `SPEC:WORKFLOW` que suspende o escrow, **mas não tem mecânica de arbitragem automática**. Isso implica **nova autoridade/mecânica de arbitragem** além do `compute` da RFC-011 — quem julga, com que força vinculante, e relação com o apelo humano são decisões abertas. Tensão a resolver com humano antes de virar norma.
- **023-02** — Wave/Batch picking com `Zen` avaliando distância nos *bins/corredores* + **modelar o depósito como subtipo de `SPEC:PLACE` com roteirização interna**. **CONTRADIZ** a RFC A.1.2, que define bin/posição como **atributo do inventário, "não tipo novo"**. Criar um subtipo `SPEC:PLACE` com pathfinding interno é mecânica de ontologia nova vs. a tese "zero tipo de nó novo" da RFC. Decisão arquitetural.

## Tabela

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 023-01 | §2 — IA Julgadora Neutra (compute RAG) resolve disputa de escrow antes do apelo humano | REVISAR-HUMANO | — | Introduz autoridade/mecânica de arbitragem automática além do compute (RFC-011); a RFC A.5 só tem disputa como workflow + suspensão de escrow. Força vinculante e relação com apelo humano em aberto. | [x] |
| 023-02 | §2 — Wave-picking com Zen sobre bins; depósito como subtipo `SPEC:PLACE` com roteirização interna | REVISAR-HUMANO | — | CONTRADIZ A.1.2 ("bin é atributo do inventário, não tipo novo") e a tese "zero tipo de nó novo". Subtipo de SPEC:PLACE com pathfinding interno = mecânica de ontologia nova. | [x] |
| 023-03 | §1 — "Logística é orquestração de workflow sobre estoque" + gig/fleet via reserva_capacidade do marketplace (validação) | JA-COBERTO | Tese + A.4.1 | Validação da ideia central; é exatamente a tese da RFC e o A.4.1 (entregador = PROFILE ofertando `reserva_capacidade`). Sem norma nova. | [x] |
| 023-04 | §4 — Nós: Intents de separação (kickstart do workflow) | JA-COBERTO | A.1.1 | A.1.1 já define operações de armazém (inclusive picking) como `SPEC:WORKFLOW` cuja transição é intent. | [x] |
| 023-05 | §4 — Nós de evidência (`CONTENT:FILE` para assinatura/foto) | JA-COBERTO | A.5 / A.4.4 | A.5 já registra prova de entrega como `CONTENT` (foto, assinatura, geo, código); A.4.4 idem na corrida. | [x] |
| 023-06 | §4 — Arestas: `ASSET:LOCK` reservando estoque / capacidade do entregador | JA-COBERTO | A.2.1 / A.4.2 | A.2.1 reserva estoque por `ASSET:LOCK`; A.4.2 reserva disponibilidade do entregador por `ASSET:LOCK` (TTL). | [x] |
| 023-07 | §5 — Ciclo de vida: kickstart pelo vendedor → transições progressivas inviáveis de sobrescrever → liquidação/arquivamento | JA-COBERTO | A.2.2 / A.4.4 / A.5 | A.2/A.4 já modelam o ciclo como workflow append-only (projeção sobre eventos) e a liquidação/repasse em A.4.5; descreve o que a RFC já diz. | [x] |
| 023-08 | §5 — "Lock de pagamento liquidado em favor do entregador no fim de vida" | REJEITAR | — | Já normado em A.4.5 (split + repasse por SPEC); como achado distinto não acrescenta requisito — apenas reafirma. Fora de escopo como nova norma. | [x] |
| 023-09 | §3 — Layout: DispatchBoard Tático (MapCanvas à esquerda + Orders "Aguardando Coleta" à direita, drag-and-drop p/ entregador) | UI->INVENTARIO | inventario-componentes-layouts.md | Layout `DispatchBoard` (organismo composto) — módulo Logística (RFC-023); reusa MapCanvas (RFC-021) + kanban de dispatch. | [ ] |
| 023-10 | §3 — Layout: WMS Scanner View (mobile, botões grandes, scan câmera/barcode) | UI->INVENTARIO | inventario-componentes-layouts.md | Layout `WMSScannerView` (template mobile) — módulo Logística (RFC-023). | [ ] |
| 023-11 | §3 — Atom: `StatusTimelineDot` | UI->INVENTARIO | inventario-componentes-layouts.md | Átomo `StatusTimelineDot` — módulo Logística (RFC-023). | [ ] |
| 023-12 | §3 — Atom: `BarcodeScannerWidget` | UI->INVENTARIO | inventario-componentes-layouts.md | Átomo `BarcodeScannerWidget` — módulo Logística (RFC-023). | [ ] |
| 023-13 | §3 — Molecule: `DeliveryRouteStop` (card do passo-a-passo do motorista) | UI->INVENTARIO | inventario-componentes-layouts.md | Molécula `DeliveryRouteStop` — módulo Logística (RFC-023). | [ ] |
| 023-14 | §3 — Organisms: `DispatchKanbanBoard`, `FulfillmentWaveManager` | UI->INVENTARIO | inventario-componentes-layouts.md | Organismos `DispatchKanbanBoard` e `FulfillmentWaveManager` — módulo Logística (RFC-023). | [ ] |
</content>
</invoke>
