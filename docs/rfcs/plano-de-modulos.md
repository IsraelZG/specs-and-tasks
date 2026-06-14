# Plano de Módulos — Marcos por Produto
> Plano separado do `plano-de-implementacao.md` (que fecha o ciclo de transporte/sync/auth, M0–M9). Aqui ficam os **marcos de produto**, construídos sobre as transversais. Cada marco lista o que entrega, de que depende e qual o critério de validação. As tasks atômicas estão no [diff de preparativos](diff-preparativos-plano.md); a ordem de escrita de cadernos está na [ordem de absorção](ordem-de-absorcao.md).

## Princípios
1. **Transversais primeiro.** Nenhum marco de produto começa antes de sua dependência transversal (P0) estar entregue.
2. **1 marco = capacidade demonstrável** (um app validável de ponta a ponta), não um bloco de código solto.
3. **Spec-first + DoD por tipo** (herda §0.2 do plano principal). Vetores adversariais (§0.1.7) fecham cada marco.
4. **Lente sobre subgrafo:** produtos que compartilham subgrafo (012/013/014) reusam, não duplicam.

---

## Marco 0 — Fundação Transversal (pré-requisito de tudo)
**Entrega:** P0.1–P0.10 do diff de preparativos (design system, conectores, plugins/computação, páginas, jurisdição, IA, workflow, plugins-frontend, módulos-profiles, shell).
**Validação:** uma página spec renderiza no shell, com componente do catálogo, fonte de dados por projeção, ação por intent, e um workflow Nível 1 dirigindo uma transição — tudo sem código compilado novo além do substrato.
**Dependência:** ciclo M0–M9 do plano principal (transporte/sync/auth/media/engines).

---

## Marco 1 — Mensageria (primeiro alvo de validação)
**Produto:** RFC-018 (sobre o chat do caderno-3/07).
**Entrega:** chat 1:1 e grupo, chamadas via LiveKit (SDK embutido + SFU plugin), presença efêmera.
**Depende de:** M0 (shell, plugins, páginas) + media plane.
**Validação:** app de mensagens estilo WhatsApp ponta a ponta — o alvo de validação já previsto (M0–M5 + M7 + subset M8 do plano principal). Marco de prova do substrato.

---

## Marco 2 — Marketplace + Fintech (núcleo comercial IZG)
**Produto:** RFC-012.
**Sub-marcos:**
- **2a — Negociação:** SPECs `PRODUCT`/`PRODUCT_LISTING`, classes de liquidação, anti-oversell, checkout-saga (Tier 1).
- **2b — Economia:** `SPENDS`/`CREDITS` com split, comissão/imposto por SPEC, multi-moeda + câmbio por oráculo.
- **2c — Liquidação externa:** conector BaaS (RFC-007 classe C), pagamento/estorno como saga.
- **2d — Instrumentos financeiros:** cessão/aporte/garantia, `APPROVED_BY`, lastro, régua de cobrança.
**Depende de:** M0 (páginas, jurisdição, workflow, conectores).
**Validação:** vender um item, pagar via BaaS sandbox, ver split e imposto provisionados; ceder um recebível com aprovação de analista. Reversão comprovada.

---

## Marco 3 — ERP/CRM
**Produto:** RFC-013.
**Entrega:** ciclo de pedido/compra como workflow, estoque multi-depósito + custeio, contas a pagar/receber + conciliação, CRM (pipeline + visão 360 + régua), projeções analíticas incrementais.
**Depende de:** M2 (mesmo subgrafo transacional), workflow.
**Validação:** a venda do M2 aparece no ERP **sem ETL** (mesma lente); pipeline de CRM avança por intents; relatório lê projeção dentro do limite de custo dimensionado.

---

## Marco 4 — Contábil, Fiscal e RH
**Produto:** RFC-014.
**Entrega:** plano de contas + lançamentos derivados, apuração fiscal por competência (vigência), persona contador lendo o subgrafo do cliente, RH + folha derivada jurisdicional, fechamento de período.
**Depende de:** M3 (fonte dos lançamentos), jurisdição, conectores (NF-e/SPED/eSocial).
**Validação:** fechar uma competência; recalcular folha retroativa aplicando a regra da época; contador exporta SPED; jurisdição ausente degrada sem aplicar regra alheia.

---

## Marco 5 — Mapa
**Produto:** RFC-021.
**Entrega:** `SPEC:PLACE` no `geo_index`, consultas de proximidade, conector classe E (geocoding/rotas) com cache TTL.
**Depende de:** M0 (shell, conectores).
**Validação:** buscar lugares por proximidade offline; rota via conector com proveniência; consumível por outro módulo por referência. **Pré-requisito de M6.**

---

## Marco 6 — Logística & Fulfillment
**Produto:** RFC-023.
**Sub-marcos:**
- **6a — WMS:** operações de armazém como workflow, endereçamento, inventário cíclico.
- **6b — Fulfillment:** alocação multi-depósito por Zen, ciclo com compensação.
- **6c — Transporte externo:** conector de transportadora (cotação/etiqueta/rastreio).
- **6d — Operação interna (Mercado Envios/Uber):** dispatch-saga, entregador como listing, localização efêmera, surge por Zen, repasse.
- **6e — Reversa & disputa:** devolução/recall como workflow, prova de entrega, disputa com escrow.
**Depende de:** M2 (marketplace), M3 (estoque), M5 (mapa), workflow.
**Validação:** despachar um pedido por entregador interno com rastreio ao vivo; abrir disputa "não chegou" que segura o escrow até resolver.

---

## Marco 7 — Social & Feed
**Produto:** RFC-016.
**Entrega:** perfis público/privado, grafo social, posts/stories, feed (`SuperCard` + ranking Zen + RRF), slot de anúncio, DM (reusa M1).
**Depende de:** M0 (páginas, shell, IA/RRF), M1 (DM).
**Validação:** feed compõe conteúdo + anúncio distinguível; story expira na UI honesta; limites honestos (privacidade retroativa, bloqueio) provados como limites.

---

## Marco 8 — Streaming
**Produto:** RFC-017.
**Entrega:** VOD (renditions como compute assíncrono), Live (LiveKit + consolidação → `CONTENT:FILE`), Áudio, monetização (assinatura/PPV/ads/tip).
**Depende de:** M0 (plugins-frontend, compute), media plane, M1 (live-chat).
**Validação:** publicar VOD com qualidades adaptativas; transmitir ao vivo e ver a live virar VOD ao encerrar; sem seeder → degradação declarada.

---

## Marco 9 — Anúncios
**Produto:** RFC-015.
**Entrega:** `SPEC:AD`/`AD_CAMPAIGN`, promoção por aresta, seleção por superfície no contexto do espectador, medição e liquidação (CPM/CPC/CPA), pacing.
**Depende de:** M2 (economia/item), M7 e M8 (superfícies feed/streaming), IA (segmentação).
**Validação:** produto vira anúncio sem duplicar o item; veicula em feed e pré-roll; cobra por evento; segmentação não lê dado restrito.

---

## Marco 10 — Email
**Produto:** RFC-019.
**Entrega:** conector classe D (IMAP/SMTP), espelho idempotente por Message-ID, envio como saga com supressão de eco, multi-conta por (usuário × conta).
**Depende de:** M0 (conectores).
**Validação:** receber/enviar email real; reentrega vira no-op; eco suprimido; duas contas do mesmo usuário isoladas.

---

## Marco 11 — Calendário
**Produto:** RFC-020.
**Entrega:** `SPEC:EVENT` + recorrência RRULE (instâncias virtuais), convites/RSVP, capacidade por reserva, sync externo classe D + `.ics`.
**Depende de:** M0 (workflow), M5/M10 (lugar, email para `.ics`).
**Validação:** recorrência longa não materializa em massa; exceção não muta o mestre; convite externo via `.ics`.

---

## Marco 12 — Suíte Office & Criação
**Produto:** RFC-025.
**Entrega:** perfis de capacidade do motor (emenda RFC-008), docs (blocos + Automerge + backlinks), planilha first-party + base como view, apresentações + export, editores de mídia (com IA via compute).
**Depende de:** M0 (páginas, plugins-frontend, shell, IA), Automerge.
**Validação:** doc colaborativo multiplayer; planilha com fórmulas; slide exportado para PPTX; imagem editada com filtro de IA — tudo no mesmo motor com perfis distintos.

---

## Sequência resumida
**M0 (fundação) → M1 (mensageria, validação) → M2–M4 (núcleo IZG: marketplace/fintech, ERP, contábil) → M5–M6 (mapa, logística) → M7–M9 (social, streaming, anúncios) → M10–M12 (email, calendário, office).**

A ordem prioriza: prova do substrato (M1), valor comercial IZG (M2–M4), depois a cadeia de dependência técnica (mapa antes de logística; superfícies antes de anúncios; office por último por depender de shell + plugins-frontend).
