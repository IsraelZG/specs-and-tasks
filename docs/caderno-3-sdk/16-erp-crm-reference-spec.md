# 16-erp-crm-reference-spec.md — ERP Operacional e CRM

> Fonte: RFC-013 (absorvida e deletada). É a terceira lente sobre o subgrafo transacional da RFC-012 (a primeira é marketplace, a segunda fintech). Apoia-se nas engines `StateMachine` e `AuditTrail` (caderno-3/03) e na camada transversal. Zero tipo de nó novo. Contábil/fiscal/RH são tratados na RFC-014. Onde não tocada, a doc vigentes prevalece.

---

## §1 — ERP como lente do subgrafo transacional

1. ERP e CRM são wrappers + projeções sobre nós já definidos na RFC-012; não há "sincronização" marketplace→ERP. O vendedor enxerga a venda no ERP porque governa os mesmos `CONTENT:INTENT` (pedido), `ASSET:INVENTORY` (estoque) e `ASSET:BALANCE_STATE` (financeiro).
2. O que o ERP acrescenta é **estado operacional de processo** (ciclo de vida de pedido/compra) modelado por `StateMachine`, e **projeções gerenciais** (§6) — não tipos nem dados paralelos.
3. Toda transição é não-comutativa via intent-hub; o histórico de estados é a própria linhagem (`AuditTrail` lê a linhagem, não mantém log paralelo).

---

## §2 — Pedidos, vendas e suprimentos (ciclo de vida)

1. **Venda:** `CONTENT:INTENT` governado por `SPEC:SALES_ORDER`, com `StateMachine` declarando o ciclo (cotação → pedido → faturado → expedido → entregue → pós-venda), cada transição um intent validado. Itens do pedido referenciam o item negociável (RFC-012 A.1) por aresta.
2. **Compras/suprimentos:** simétrico — `SPEC:PURCHASE_ORDER` com ciclo (requisição → cotação → ordem → recebimento → conferência). Recebimento credita `ASSET:INVENTORY`; a venda debita. Mesma maquinaria, papéis invertidos.
3. **Devolução/cancelamento** = transição reversa que emite compensação (RFC-012 A.4.2), nunca deleção. A reentrada de estoque é um `CREDITS` em `INVENTORY`.

---

## §3 — Estoque e movimentação

1. Estoque = `ASSET:INVENTORY` por SKU **por depósito** (múltiplos locais = múltiplas linhagens de inventário). Transferência entre depósitos = saga de duas pernas (RFC-012 A.4) — sai de um head, entra noutro.
2. **Custeio (custo médio, PEPS) é projeção/Zen**, não estado mutável: derivado da linhagem de entradas; o relatório de custo lê a história, não um campo sobrescrito.
3. Reserva de estoque para pedido em aberto = `ASSET:LOCK` com TTL (mesma primitiva do checkout); cancelou/expirou → libera. Em rede P2P pura não há CRON central que dispare a liberação; portanto a **expiração do TTL é avaliada na projeção**, não materializada por um agente server-side. O motor de timeline trata um `ASSET:LOCK` com TTL vencido como **estoque disponível** na leitura imediata (`available = on_hand − locks_com_ttl_vigente`), mesmo antes de a tombstone de liberação materializar no SQLite local — evitando *ghost reservations* que travam o último item.
4. **Extensão de Armazém (WMS):** As operações de armazém (endereçamento, picking, packing, expedição e contagens cíclicas) estendem esse modelo básico de estoque, sendo descritas como [[caderno-3-sdk/25-logistica-reference-spec|SPEC:WORKFLOW]]s (RFC-023) sobre o mesmo `ASSET:INVENTORY`.


---

## §4 — Financeiro operacional

1. **Contas a pagar/receber** = obrigações futuras sobre `ASSET:BALANCE_STATE`, com vencimento e contraparte no payload; baixa = liquidação (intent) com origem interna (caixa) ou externa (conector BaaS, RFC-007 C).
2. **Conciliação bancária:** o extrato chega por conector (classe C/D); o casamento extrato↔obrigação usa `external_ref` (RFC-007 A.3.2) — idempotente, sem duplicar baixa. Para sobreviver à reemissão (conectores OFX/QIF e BaaS frequentemente reenviam o mesmo lançamento com UUID novo), a `external_ref` usada no casamento extrato↔obrigação é um **hash criptográfico determinístico** sobre `(data_compensação, valor, identificador_da_contraparte)` — não o ID volátil do banco. Dois extratos com o mesmo hash são o mesmo fato; a baixa é idempotente por construção, sem depender de o conector preservar IDs estáveis.
3. **Fluxo de caixa** é projeção temporal sobre os `BALANCE_STATE` e obrigações; previsão é Zen sobre vencimentos, não nó.
4. A contabilização formal desses fatos é tratada na RFC-014 (lançamentos derivados), não aqui.

---

## §5 — CRM: relacionamento como grafo

1. **Contatos/contas/leads** = `PROFILE` (pessoa/organização), relacionados por arestas; a visão 360° do cliente é **traversal** (pedidos, interações, financeiro, tickets), não uma tabela agregada.
2. **Pipeline de vendas** = `StateMachine` (`SPEC:CRM_PIPELINE`): estágios configuráveis, transição como intent, probabilidade/forecast como Zen. Múltiplos pipelines (vendas, suporte, sucesso) coexistem como SPECs distintas.
3. **Interações** (e-mail, ligação, reunião, mensagem) = `CONTENT` ligado ao contato; integra-se com os módulos de Mensagens/Email/Calendário (RFCs posteriores) pela mesma lente — uma reunião agendada é o mesmo `CONTENT:EVENT`.
4. **Régua de relacionamento** (follow-up, nutrição, cobrança amistosa) = Zen disparando intents/notificações; disparo externo via conector classe A (RFC-007).
5. **Dado pessoal do CRM e direitos do titular.** Contatos/leads `PROFILE` que carregam dado pessoal de pessoa física são **dado tratado sob consentimento**: cada finalidade de uso liga-se a um `ASSET:CONSENT` ([03-legal-and-compliance-framework](../caderno-1-vision/03-legal-and-compliance-framework.md) §2.1), e o pedido de exclusão segue o **expurgo por rotação de época** (§3.1) — revogada a permissão, as épocas seguintes ficam inacessíveis e as interações de CRM materializam como *Cliente Anonimizado*, preservando a integridade matemática da linhagem financeira retida (§2.3). O CRM não cria mecanismo de privacidade próprio: **invoca** as primitivas legais do caderno-1.

---

## §6 — Relatórios e BI

1. Relatórios são **projeções** sobre a linhagem; dashboards leem projeções, nunca o grafo cru.
2. **Limite dimensionado:** BI sobre append-only **cifrado** é caro — agregar exige decifrar no device. Estratégia: projeções analíticas **materializadas e incrementais** (atualizadas no mesmo ponto pós-decifra que FTS/embeddings), com granularidade declarada na SPEC; consultas pesadas/ad-hoc cross-tenant em rede pública são explicitamente fora do caminho quente. Esse custo é registrado, não escondido.
3. Análise aberta/semântica ("por que as vendas caíram?") cai no RAG da RFC-011 (RRF + traversal), respeitando permissão.

---

## §7 — Limites honestos

1. Atomicidade de processos cross-domínio herda a janela observável da RFC-012 A.4.1.
2. BI cifrado tem teto de desempenho (§6.2); redes que querem analytics pesado escolhem a modalidade gerenciada com projeções no operador.
3. Custeio/forecast são derivações — corretos por construção, mas dependem de a linhagem estar sincronizada (lacuna de sync = lacuna de relatório, sinalizada).
