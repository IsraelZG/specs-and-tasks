# RFC-023 — Logística, Estoque (WMS) e Fulfillment
> **Status:** Proposta
> **Precedência:** módulo de produto próprio; estende a RFC-013 §A.3 (estoque) com operações de armazém, e apoia-se na RFC-012 (item/serviço negociável, checkout-saga, split), na RFC-021 (mapa: localização e rota), na RFC-022 (workflow: todo ciclo logístico é um `SPEC:WORKFLOW`) e na RFC-007 (transportadora externa como conector). **Zero tipo de nó novo.** Onde não tocada, a doc vigente prevalece.
> **Transversais posteriores a aplicar na absorção:** `DispatchBoard` (mapa + quadro) e o rastreio seguem o shell (RFC-026); o entregador age como profile e o dispatch/compartilhamento de corrida usa o plano de comando (RFC-027). (Os ciclos de WMS/fulfillment/reversa já estão como `SPEC:WORKFLOW`, RFC-022.)
> **Tese:** logística é **operação de processos sobre estoque e transporte**. E pode ser **operada internamente** (rede própria de entregadores/motoristas, modelo Mercado Envios / Uber), não só despachada a terceiros — reusando o marketplace para encontrar quem entrega, o mapa para localizar e rotear, e o workflow para reger o ciclo.

## A.1 — Operações de armazém (WMS)

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/25-logistica-reference-spec.md` | novo | Documento canônico, §1 |
| `caderno-3-sdk/15-erp-crm-reference-spec.md` | §A.3 | Editar: WMS estende o estoque básico daqui |

**Texto normativo:**

1. Operações de armazém — recebimento/conferência, endereçamento (putaway), separação (picking), embalagem (packing), expedição, inventário cíclico — são **`SPEC:WORKFLOW`** (RFC-022) sobre `ASSET:INVENTORY`. Cada transição é intent, o histórico é a linhagem.
2. **Endereçamento:** posição/bin é atributo do inventário (sub-linhagem por local), não tipo novo; transferência interna entre posições é saga de duas pernas (RFC-012 A.4), como entre depósitos (RFC-013 A.3.1).
3. **Acuracidade** é derivada da linhagem de contagens (append-only); divergência de inventário é um fato registrado e conciliado, nunca sobrescrita silenciosa de saldo.
4. **Onda (wave/batch):** agrupar pedidos para picking conjunto é um workflow que orquestra múltiplas reservas (`ASSET:LOCK`) — pacing por TTL.

## A.2 — Fulfillment e alocação

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/25-logistica-reference-spec.md` | §2 | Adicionar |

**Texto normativo:**

1. **Alocação multi-depósito** (qual local atende qual pedido) é **decisão Zen** sobre distância, estoque, custo e SLA — não regra fixa. Resultado reserva estoque por `ASSET:LOCK` no local eleito.
2. O ciclo de fulfillment (aceito → separado → embalado → despachado → em trânsito → entregue) é `SPEC:WORKFLOW`; cada estado é projeção sobre os eventos, visível ao comprador (A.5).
3. Falha em qualquer perna (sem estoque no local, coleta não realizada) compensa via saga (RFC-012 A.4.2) — re-alocar ou cancelar com estorno, nunca estado "entregue" falso.

## A.3 — Transporte: dois modos

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/25-logistica-reference-spec.md` | §3 | Adicionar |

**Texto normativo:** o transporte de um envio resolve-se por um de dois modos, escolhido por Zen (custo/SLA/disponibilidade):

1. **Transportadora externa (conector):** cotação de frete, geração de etiqueta e eventos de rastreio via conector (RFC-007 — classe C para emissão/contratação, classe E para consulta de rastreio). A transportadora é autoridade sobre o status externo; o grafo espelha por `external_ref` idempotente.
2. **Operação interna (rede própria):** a plataforma **opera o transporte ela mesma** (§A.4) — entregadores/motoristas da própria rede.

Os dois alimentam o mesmo workflow de rastreamento (A.5); a UI não distingue a origem do status.

## A.4 — Operação interna de transporte (modelo Mercado Envios / Uber)

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/25-logistica-reference-spec.md` | §4 | Adicionar |
| `docs/conceitos/dispatch-saga.md` | novo verbete | matching de entregador como saga |

**Texto normativo:**

1. **Entregador/motorista = `PROFILE`** que oferta capacidade de transporte como **serviço negociável** (RFC-012, classe `servico` / `reserva_capacidade`) — uma listing de disponibilidade. Encontrar quem entrega é, portanto, o **marketplace** operando sobre ofertas de transporte; nenhum mecanismo de matching novo.
2. **Dispatch = saga (RFC-012 A.4):** ofertar a corrida/entrega reserva a disponibilidade do entregador com `ASSET:LOCK` (TTL — o exemplo já registrado na RFC-012); aceite confirma, recusa/expiração libera e oferta ao próximo. Estado do dispatch é orquestração efêmera não-replicada (A.4.6 da 012), só pernas finalizadas vão ao grafo.
3. **Localização ao vivo = sinal efêmero** (como presença, RFC-018 A.4 / RFC-021 A.4): posição do entregador é volátil, best-effort, nunca nó append-only durável. **Rota e ETA** vêm do mapa (RFC-021, conector classe E).
4. **Ciclo da corrida/entrega = `SPEC:WORKFLOW`** (ofertado → aceito → a caminho da coleta → coletado → a caminho da entrega → entregue), com prova de entrega (foto/assinatura) como `CONTENT`.
5. **Precificação dinâmica (surge/distância/tempo) = Zen** (RFC-012 A.7); **pagamento e split** (plataforma + entregador) na mesma op (RFC-012 A.5.2); **repasse ao entregador** é liquidação por SPEC ([[economia-como-modulo]]). **Reputação** do entregador é o sinal de confiança (mesma defesa Sybil da rede).

## A.5 — Rastreamento

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/25-logistica-reference-spec.md` | §5 | Adicionar |

**Texto normativo:** o status de um envio é o estado de seu `SPEC:WORKFLOW`; eventos de rastreio chegam por conector (transportadora externa) ou por intents do app do entregador (operação interna), unificados na mesma linha do tempo. O comprador vê a projeção; posição ao vivo (quando disponível) é o sinal efêmero do A.4.3.

**Prova de entrega e disputa.** A entrega final registra **prova** (`CONTENT`: foto, assinatura, geolocalização do momento, código de confirmação) anexada ao envio — é o que distingue "marcado como entregue" de "comprovadamente entregue". Uma **disputa** ("não chegou" / "chegou danificado") é um `SPEC:WORKFLOW` próprio (aberta → evidências das duas partes → análise → resolução), que **suspende a liberação do valor em escrow** (RFC-012 A.4.5) até resolver; resolução roteia para reembolso (estorno, RFC-012 A.4.2), reenvio (novo envio) ou indeferimento, sempre como fato append-only com a evidência ligada. Limite honesto: prova de entrega depende de cliente/entregador honesto na captura; ela **eleva o ônus**, não prova absoluta — fraude é mitigada por reputação e escrow, não eliminada em P2P.

## A.6 — Logística reversa

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/25-logistica-reference-spec.md` | §6 | Adicionar |

**Texto normativo:** devolução, troca e recall são **`SPEC:WORKFLOW`** próprios (solicitado → autorizado → coletado → recebido → inspecionado → estornado/reenviado). A reentrada de estoque é `CREDITS` em `ASSET:INVENTORY` (RFC-013 A.2.3); o estorno financeiro liga-se ao checkout original via compensação (RFC-012 A.4.2). Reversa reusa o transporte (A.3/A.4) no sentido inverso.

## A.7 — Limites honestos

1. Localização ao vivo é best-effort e falsificável por cliente adversário — não é prova de posição; serve à UX, não à liquidação.
2. Matching interno depende de oferta de entregadores disponível na região; sem oferta, degrada para transportadora externa ou indisponibilidade declarada.
3. SLA de entrega não é garantia em P2P puro; rota/ETA dependem de provedor de mapa externo (RFC-021 A.5).
4. Acuracidade de estoque depende de a linhagem de movimentos estar sincronizada; divergência é sinalizada, não estimada.

## A.8 — Costuras

Marketplace (item + checkout + oferta de transporte), ERP (estoque + pedido), Mapa (localização + rota), Workflow (todos os ciclos), Conectores (transportadora externa), Anúncios (frete grátis como promoção, RFC-015), Economia (repasse ao entregador). Tudo a mesma lente sobre os mesmos nós — sem ETL entre módulos.

## A.9 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-LOG-01..05 |

**T-LOG-01** WMS: operações de armazém como `SPEC:WORKFLOW` sobre `INVENTORY` + endereçamento + inventário cíclico (DoD Protocolo/core); **T-LOG-02** fulfillment: alocação multi-depósito por Zen + reserva por `LOCK` + ciclo como workflow com compensação; **T-LOG-03** transporte externo: conector de transportadora (cotação/etiqueta/rastreio) idempotente por `external_ref`; **T-LOG-04** operação interna: dispatch-saga (oferta→aceite→TTL), entregador como listing, localização efêmera, ciclo de entrega como workflow, surge por Zen, repasse por SPEC; **T-LOG-05** logística reversa como workflow + reentrada de estoque + estorno; vetores adversariais (§0.1.7): oversell multi-local na janela declarada, localização forjada não vira fato, dispatch sem oferta degrada, devolução reentra estoque sem duplicar.
