# RFC-013 — ERP Operacional e CRM
> **Status:** Proposta
> **Precedência:** segundo módulo de produto; é a **terceira lente** sobre o subgrafo transacional da RFC-012 (a primeira é marketplace, a segunda fintech). Apoia-se nas engines `StateMachine` e `AuditTrail` (caderno-3/03) e na camada transversal. **Zero tipo de nó novo.** Contábil/fiscal/RH são tratados na RFC-014. Onde não tocada, a doc vigente prevalece.
> **Transversais posteriores a aplicar na absorção:** os ciclos de pedido/compra e o pipeline de CRM (hoje descritos como `StateMachine`) são instâncias de `SPEC:WORKFLOW` (RFC-022); `dashboard`/master-detail seguem o shell (RFC-026); o módulo age como profile compartimentado por (usuário × módulo) e recebe comandos por mensageria (RFC-027), além de ler a mesma venda por lente (plano de dados inalterado).
> **Tese:** o ERP não importa dados da venda — ele **lê o mesmo subgrafo** que o marketplace escreveu. Pedido, estoque e financeiro são os mesmos nós (`INTENT`, `INVENTORY`, `BALANCE_STATE`), vistos pela lente operacional do negócio. Integração é projeção, não API entre módulos.

## A.1 — ERP como lente do subgrafo transacional

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/14-erp-crm-reference-spec.md` | novo | Documento canônico, §1 |
| `docs/conceitos/lente-de-modulo.md` | novo verbete | módulo = projeção+wrapper sobre subgrafo compartilhado |

**Texto normativo:**

1. ERP e CRM são wrappers + projeções sobre nós já definidos na RFC-012; não há "sincronização" marketplace→ERP. O vendedor enxerga a venda no ERP porque governa os mesmos `CONTENT:INTENT` (pedido), `ASSET:INVENTORY` (estoque) e `ASSET:BALANCE_STATE` (financeiro).
2. O que o ERP acrescenta é **estado operacional de processo** (ciclo de vida de pedido/compra) modelado por `StateMachine`, e **projeções gerenciais** (A.6) — não tipos nem dados paralelos.
3. Toda transição é não-comutativa via intent-hub; o histórico de estados é a própria linhagem (`AuditTrail` lê a linhagem, não mantém log paralelo).

## A.2 — Pedidos, vendas e suprimentos (ciclo de vida)

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/14-erp-crm-reference-spec.md` | §2 | Adicionar |

**Texto normativo:**

1. **Venda:** `CONTENT:INTENT` governado por `SPEC:SALES_ORDER`, com `StateMachine` declarando o ciclo (cotação → pedido → faturado → expedido → entregue → pós-venda), cada transição um intent validado. Itens do pedido referenciam o item negociável (RFC-012 A.1) por aresta.
2. **Compras/suprimentos:** simétrico — `SPEC:PURCHASE_ORDER` com ciclo (requisição → cotação → ordem → recebimento → conferência). Recebimento credita `ASSET:INVENTORY`; a venda debita. Mesma maquinaria, papéis invertidos.
3. **Devolução/cancelamento** = transição reversa que emite compensação (RFC-012 A.4.2), nunca deleção. A reentrada de estoque é um `CREDITS` em `INVENTORY`.

## A.3 — Estoque e movimentação

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/14-erp-crm-reference-spec.md` | §3 | Adicionar |

**Texto normativo:**

1. Estoque = `ASSET:INVENTORY` por SKU **por depósito** (múltiplos locais = múltiplas linhagens de inventário). Transferência entre depósitos = saga de duas pernas (RFC-012 A.4) — sai de um head, entra noutro.
2. **Custeio (custo médio, PEPS) é projeção/Zen**, não estado mutável: derivado da linhagem de entradas; o relatório de custo lê a história, não um campo sobrescrito.
3. Reserva de estoque para pedido em aberto = `ASSET:LOCK` com TTL (mesma primitiva do checkout); cancelou/expirou → libera. Em rede P2P pura não há CRON central que dispare a liberação; portanto a **expiração do TTL é avaliada na projeção**, não materializada por um agente server-side. O motor de timeline trata um `ASSET:LOCK` com TTL vencido como **estoque disponível** na leitura imediata (`available = on_hand − locks_com_ttl_vigente`), mesmo antes de a tombstone de liberação materializar no SQLite local — evitando *ghost reservations* que travam o último item.

## A.4 — Financeiro operacional

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/14-erp-crm-reference-spec.md` | §4 | Adicionar |

**Texto normativo:**

1. **Contas a pagar/receber** = obrigações futuras sobre `ASSET:BALANCE_STATE`, com vencimento e contraparte no payload; baixa = liquidação (intent) com origem interna (caixa) ou externa (conector BaaS, RFC-007 C).
2. **Conciliação bancária:** o extrato chega por conector (classe C/D); o casamento extrato↔obrigação usa `external_ref` (RFC-007 A.3.2) — idempotente, sem duplicar baixa. Para sobreviver à reemissão (conectores OFX/QIF e BaaS frequentemente reenviam o mesmo lançamento com UUID novo), a `external_ref` usada no casamento extrato↔obrigação é um **hash criptográfico determinístico** sobre `(data_compensação, valor, identificador_da_contraparte)` — não o ID volátil do banco. Dois extratos com o mesmo hash são o mesmo fato; a baixa é idempotente por construção, sem depender de o conector preservar IDs estáveis.
3. **Fluxo de caixa** é projeção temporal sobre os `BALANCE_STATE` e obrigações; previsão é Zen sobre vencimentos, não nó.
4. A contabilização formal desses fatos é tratada na RFC-014 (lançamentos derivados), não aqui.

## A.5 — CRM: relacionamento como grafo

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/14-erp-crm-reference-spec.md` | §5 | Adicionar |
| `docs/conceitos/pipeline-crm.md` | novo verbete | pipeline como StateMachine |

**Texto normativo:**

1. **Contatos/contas/leads** = `PROFILE` (pessoa/organização), relacionados por arestas; a visão 360° do cliente é **traversal** (pedidos, interações, financeiro, tickets), não uma tabela agregada.
2. **Pipeline de vendas** = `StateMachine` (`SPEC:CRM_PIPELINE`): estágios configuráveis, transição como intent, probabilidade/forecast como Zen. Múltiplos pipelines (vendas, suporte, sucesso) coexistem como SPECs distintas.
3. **Interações** (e-mail, ligação, reunião, mensagem) = `CONTENT` ligado ao contato; integra-se com os módulos de Mensagens/Email/Calendário (RFCs posteriores) pela mesma lente — uma reunião agendada é o mesmo `CONTENT:EVENT`.
4. **Régua de relacionamento** (follow-up, nutrição, cobrança amistosa) = Zen disparando intents/notificações; disparo externo via conector classe A (RFC-007).

## A.6 — Relatórios e BI

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/14-erp-crm-reference-spec.md` | §6 | Adicionar |
| `docs/conceitos/projecao-analitica.md` | novo verbete | agregados incrementais + custo do append-only cifrado |

**Texto normativo:**

1. Relatórios são **projeções** sobre a linhagem; dashboards leem projeções, nunca o grafo cru.
2. **Limite dimensionado:** BI sobre append-only **cifrado** é caro — agregar exige decifrar no device. Estratégia: projeções analíticas **materializadas e incrementais** (atualizadas no mesmo ponto pós-decifra que FTS/embeddings), com granularidade declarada na SPEC; consultas pesadas/ad-hoc cross-tenant em rede pública são explicitamente fora do caminho quente. Esse custo é registrado, não escondido.
3. Análise aberta/semântica ("por que as vendas caíram?") cai no RAG da RFC-011 (RRF + traversal), respeitando permissão.

## A.7 — Limites honestos

1. Atomicidade de processos cross-domínio herda a janela observável da RFC-012 A.4.1.
2. BI cifrado tem teto de desempenho (A.6.2); redes que querem analytics pesado escolhem a modalidade gerenciada com projeções no operador.
3. Custeio/forecast são derivações — corretos por construção, mas dependem de a linhagem estar sincronizada (lacuna de sync = lacuna de relatório, sinalizada).

## A.8 — Costuras

1. **Marketplace (RFC-012):** mesma venda, outra lente — sem ETL.
2. **Contábil/Fiscal/RH (RFC-014):** os fatos operacionais aqui são a **fonte** dos lançamentos derivados de lá; esta RFC não contabiliza nem apura tributo.
3. **Mensagens/Email/Calendário:** interações de CRM são os mesmos nós desses módulos.

## A.9 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-ERP-01..05 |

**T-ERP-01** SPECs `SALES_ORDER`/`PURCHASE_ORDER` + `StateMachine` de ciclo (DoD Protocolo/core); **T-ERP-02** estoque multi-depósito + custeio como projeção + reserva por `ASSET:LOCK`; **T-ERP-03** contas a pagar/receber + conciliação por `external_ref` (idempotência); **T-ERP-04** CRM (pipeline `StateMachine`, visão 360 por traversal, régua Zen); **T-ERP-05** projeções analíticas incrementais + teste de custo (volume) comprovando o limite dimensionado (§0.1.7).
