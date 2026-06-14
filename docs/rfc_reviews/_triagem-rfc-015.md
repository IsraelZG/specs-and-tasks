# Triagem — rfc-015 (Anúncios e Promoção Cross-Módulo)

**Achados extraídos:** 11 · **Σ vereditos:** 11

| veredito | contagem |
| :--- | :---: |
| INCORPORAR | 2 |
| JA-COBERTO | 5 |
| UI->INVENTARIO | 3 |
| REJEITAR | 0 |
| **REVISAR-HUMANO** | **1** |

## ⚠ REVISAR-HUMANO (decisão arquitetural pendente)

- **015-03 — Invariante de coorte mínimo (k-anonymity).** O review (§2) recomenda um `k-anonymity` hardcoded: campanhas não entregam impressões se o coorte segmentado for menor que `N` indivíduos. A RFC §A.3.2 **proíbe ler plaintext de classe restrita / cruzar fronteira E2E**, mas **não impõe** nenhuma garantia de coorte mínimo — uma campanha hiper-restrita entregue a 1 pessoa **de-anonimiza o alvo mesmo sem ler dado restrito** (auditoria de consistência L-02, alta, confirmada). É decisão de política de produto + escolha arquitetural: o limiar `N` (e se ele é global, por classe de sinal, ou por superfície) não está definido por nenhum canônico. **Não redigir norma** — humano decide o invariante e o valor de `N`.

---

## Tabela de triagem

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 015-01 | §2 — Impressão faturável requer **assinatura criptográfica do espectador** (`PROFILE` de quem viu) no evento medido | INCORPORAR | A.4 (medição/liquidação), §4.1 | "O registro assinado do evento cobrável carrega a assinatura do `PROFILE` do espectador: impressão/clique sem assinatura válida do observador não é faturável. Isso amarra a medição a uma identidade real e eleva o custo de forja." | [x] |
| 015-02 | §2 — Cliques de contas recém-criadas sem saldo/reputação recebem **peso zero** na cobrança Zen | INCORPORAR | A.4 (medição/liquidação), §4.4 nova ("Ponderação anti-fraude do evento") | "A liquidação Zen pondera o evento pela reputação do espectador: eventos de `PROFILE` recém-criado, sem saldo nem reputação, recebem peso zero no cálculo da cobrança, protegendo o anunciante de Sybil sem bloquear participação legítima." | [x] |
| 015-03 | §2 — `k-anonymity` hardcoded: não entregar impressões se coorte < `N` indivíduos | **REVISAR-HUMANO** | — (ver seção em destaque) | Tensão: A.3.2 proíbe ler dado restrito mas não garante coorte mínimo; coorte de 1 de-anonimiza. Limiar `N` é escolha arquitetural — não redigir. | [x] |
| 015-04 | §1 — Validação da ideia central (anúncio como `RELATES:AD:PROMOTES`, sem duplicação) | JA-COBERTO | cabeçalho + A.1.1 | RFC define `RELATES:AD:PROMOTES` e "não duplica o item — referencia-o". Sem objeção. | [x] |
| 015-05 | §1 — Transversais (`SPEC:WORKFLOW` campanha, comando de profile "arrastar para virar anúncio" RFC-027) integradas | JA-COBERTO | cabeçalho ("Transversais posteriores a aplicar na absorção") | RFC já lista WORKFLOW/024/026/027 no cabeçalho. | [x] |
| 015-06 | §4 — Nós `SPECIFICATION:AD_CAMPAIGN` e `CONTENT:AD` | JA-COBERTO | A.1.1 / A.1.2 | RFC define `SPEC:AD` (`CONTENT` criativo) e `SPECIFICATION:AD_CAMPAIGN`. | [x] |
| 015-07 | §4 — Arestas `RELATES:AD:PROMOTES` e financeiras `SPENDS`/`CREDITS` no loop da carteira | JA-COBERTO | A.1 / A.4.2 | RFC define a aresta de promoção (A.1.1) e o split debita orçamento / credita plataforma e publicador na mesma op (A.4.2, RFC-012 A.5.2). | [x] |
| 015-08 | §5 — Ciclo de vida (nascimento via Lock no `BALANCE_STATE`; consumo por impressão/clique; fim por saldo/período → histórico) | JA-COBERTO | A.1.3 / A.4.3 | RFC cobre orçamento via `BALANCE_STATE`+`LOCK`, pacing e "esgotou → campanha pausa". Apenas redescreve a RFC. | [x] |
| 015-09 | §3 — `SponsoredLabel` (átomo), `BudgetMeterBar` (átomo, pacing), `AdSlotPlaceholder` (slot universal injetado pela Shell) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | `SponsoredLabel` (átomo · Anúncios); `BudgetMeterBar` (átomo · Anúncios); `AdSlotPlaceholder` (átomo/molécula de slot · Shell+Anúncios) | [x] |
| 015-10 | §3 — `CampaignRow` (molécula, RoAS/CTR) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | `CampaignRow` (molécula · Anúncios) | [x] |
| 015-11 | §3 — `AdPlacementWidget` (organismo, injeta componente promovido), `AudienceBuilderForm` (organismo, traduz seleção visual em query RAG), Gestor de Campanhas "Business Manager" + funis | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | `AdPlacementWidget` (organismo · Anúncios); `AudienceBuilderForm` (organismo · Anúncios); `CampaignManagerView` (organismo/layout, Business Manager + funil WORKFLOW · Anúncios) | [x] |

## Notas de confirmação (JA-COBERTO)

- **015-04/05** confirmados no cabeçalho e A.1.1.
- **015-06/07/08** confirmados via grep (`AD_CAMPAIGN`, `RELATES:AD:PROMOTES`, `BALANCE_STATE`/`LOCK` nas linhas 18-20, 60-62).
- A fraude de clique/impressão por anomalia/reputação já é declarada em A.5.1; 015-01 e 015-02 são **refinamentos normativos** que adicionam o *mecanismo* (assinatura do espectador + ponderação por reputação), ausente do texto vigente — por isso INCORPORAR e não JA-COBERTO.
