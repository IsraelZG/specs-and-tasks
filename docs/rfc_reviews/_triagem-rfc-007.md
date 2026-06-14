# Triagem — rfc-007 (Conectores de Mundo Externo)

**Fonte:** `docs/rfcs/rfc-007-conectores-externos.md` + `docs/rfc_reviews/review_rfc-007.md`

## Contagens (Σ = 9)

| veredito | qtd |
| :--- | :--- |
| INCORPORAR | 2 |
| JA-COBERTO | 2 |
| UI->INVENTARIO | 4 |
| REJEITAR | 0 |
| REVISAR-HUMANO | 1 |

## ⚠ REVISAR-HUMANO (decisão arquitetural)

- **007-03 — Semântica CRDT (LWW + Vector Clocks) para disputas de espelho (Classe D).**
  O review propõe resolver conflitos automaticamente com Last-Writer-Wins + vector clocks
  nativamente no conector. A RFC, em A.4.5 (invariante D5/Conflito), afirma o **oposto**:
  "Disputas reais são resolvidas pela SPEC do domínio — **nunca pelo conector**", e que o
  sistema externo é autoritativo sobre seu próprio estado. Adotar LWW/vector-clock nativo
  CONTRADIZ essa tese e introduz mecânica de resolução de conflito (CRDT) que hoje vive na
  camada de SPEC/domínio, não no conector. Exige decisão arquitetural sobre onde mora a
  resolução de conflito de espelho. Não redijo norma.

## Tabela

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 007-01 | §2 — Webhook não-autenticável deve ser reclassificado como Classe B (content-blind), acionando polling transacional seguro em vez de injetar o fato | JA-COBERTO | A.2.5 | A.2.5 já normatiza: "ingresso não-autenticável degrada para polling" (validação HMAC/mTLS/assinatura antes de qualquer tradução). A reclassificação explícita p/ Classe B é reframing do mesmo comportamento já coberto. | [x] |
| 007-02 | §2 — Circuit breaker / fail-fast em sagas: conector degradado deve falhar rápido (ou acionar timeout preventivo) para não segurar [[asset-lock]] indefinidamente sob backoff longo | INCORPORAR | A.3 (novo item 5) | "**Fail-fast sob degradação:** quando `health()` de um conector Classe C reporta `degraded`/`down`, o despacho da saga falha imediatamente (ou aciona o timeout de A.3.4 preventivamente) em vez de enfileirar sob backoff — para que um conector indisponível nunca segure [[asset-lock]] além do TTL do lock. O backoff de A.2.6 aplica-se a reentrega assíncrona, não a pernas transacionais com lock ativo." | [x] |
| 007-03 | §2 — Semântica CRDT (LWW + Vector Clocks) nativa para disputas de espelho Classe D | REVISAR-HUMANO | — | CONTRADIZ A.4.5 (conflito resolvido pela SPEC do domínio, nunca pelo conector). Ver destaque acima. | [x] |
| 007-04 | §3 — Painel de Saúde e Roteamento de Conectores (layout admin: funil de ingressos/egressos com status visual) | UI->INVENTARIO | `inventario-componentes-layouts.md` | organismo · `ConnectorHealthDashboard` (painel admin de saúde + roteamento, funil ingresso/egresso) — módulo: conectores/admin | [x] |
| 007-05 | §3 Atoms — `StatusBadge` (Up/Degraded/Down), `ConnectorIcon` (Email/API/ERP), `ProgressBar` (Quotas) | UI->INVENTARIO | `inventario-componentes-layouts.md` | átomo · `StatusBadge`, `ConnectorIcon`, `ProgressBar` (quota) — módulo: conectores/admin | [x] |
| 007-06 | §3 Molecules — `ConnectorHealthCard` (última sync + latência), `RateLimitWarning` | UI->INVENTARIO | `inventario-componentes-layouts.md` | molécula · `ConnectorHealthCard`, `RateLimitWarning` — módulo: conectores/admin | [x] |
| 007-07 | §3 Organisms — `ConnectorConfigForm` (JSON Forms p/ credentials/templates via SPEC), `SagaExecutionLog` (perna bloqueada de transação) | UI->INVENTARIO | `inventario-componentes-layouts.md` | organismo · `ConnectorConfigForm` (JSON Forms, config via SPEC), `SagaExecutionLog` (visualiza perna de saga bloqueada) — módulo: conectores/admin | [x] |
| 007-08 | §4 — Nós (`PROFILE:SYSTEM`, `ASSET:ROLE`, `CONTENT`) e aresta `APPROVED_BY` ligando fato oracular à persona do conector | JA-COBERTO | A.2.2 / A.3.1 | A.2.2 já define persona `PROFILE:SYSTEM` com `ASSET:ROLE` escopado e assinatura por persona; A.3.1 já usa `APPROVED_BY` da persona-oráculo. §4 apenas descreve o que a RFC já normatiza. | [x] |
| 007-09 | §5 — Mutação Classe D: sincronização incremental substitui o fato antigo via linhagem `SUPERSEDED_BY` | INCORPORAR | A.4 (novo item, invariante D6) | "**D6 — Mutação por linhagem:** atualização incremental de um fato espelhado não muta o nó in-place; emite novo fato ligado ao anterior por `SUPERSEDED_BY`, preservando o audit trail. A idempotência por `external_ref` (A.3.2) garante que reentregas não gerem cadeias `SUPERSEDED_BY` espúrias." | [x] |
