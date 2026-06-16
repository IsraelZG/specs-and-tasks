# 15-marketplace-reference-spec.md — Marketplace e Negociação de Ativos

> Fonte: RFC-012 (absorvida e deletada). Apoia-se em toda a camada transversal (006 design system, 007 conectores, 008 páginas, 009 jurisdição, 010 plugins/computação, 011 IA). Consolida a RFC de transações multidomínio (saga/2PC/TTL) e a modelagem de fluxos financeiros sobre o subgrafo transacional. Zero tipo de nó novo — é uma lente sobre a ontologia (PROFILE/CONTENT/ASSET/SPECIFICATION). Onde não tocada, a doc vigente prevalece.

---

## §1 — Item negociável: a máquina genérica

1. **Produto canônico** = `CONTENT` governado por `SPEC:PRODUCT` (a "ficha" compartilhada — um livro, um curso, um modelo de tênis). **Anúncio (listing)** = `CONTENT` governado por `SPEC:PRODUCT_LISTING`, com aresta `BELONGS_TO` agrupando-o sob o produto canônico. Catálogo canônico vs. oferta de vendedor é distinção **por grafo**, não por flag. Ranking de ofertas do mesmo produto é traversal.
2. O que pode ser negociado é **aberto**: a `SPEC` do item declara sua **classe de liquidação** (§2), que determina o que a compra entrega. Cursos, assinaturas e serviços não são módulos nem tipos — são `SPEC`s de item.
3. Toda operação que muda posse/saldo é **não-comutativa** e passa pelo fluxo intent-hub (`CONTENT:INTENT` → validador → finalização), nunca escrita direta.

---

## §2 — Classes de liquidação

A classe declarada na SPEC do item determina o que o `CREDITS` entrega ao comprador:

| Classe | Entrega | Exemplos |
| :--- | :--- | :--- |
| `bem_serializado` | `ASSET:INVENTORY` decrementado/transferido (escasso, anti-oversell §3) | produto físico, ingresso, recebível |
| `bem_digital` | concessão de `ASSET:PERMISSION` sobre `CONTENT` (não-escasso, replicável) | e-book, música, arquivo, software |
| `acesso_licenca` | `ASSET:PERMISSION` ou tier de audiência, escopo declarado | curso, conteúdo pago, paywall |
| `assinatura` | `ASSET:ROLE` com ciclo/TTL + intent recorrente | streaming premium, SaaS, clube |
| `servico` | `CONTENT:INTENT` com workflow de execução (StateMachine, RFC-013) | serviço sob demanda, frete, consultoria |
| `reserva_capacidade` | unidade de `ASSET:INVENTORY` ligada a janela temporal | hotel, mesa, slot de agenda (RFC-019) |
| `instrumento_financeiro` | `ASSET:INVENTORY` com payload financeiro (§8) | recebível, aporte, cota de garantia |

A lista é extensível: nova classe é nova SPEC + declaração de "o que o CREDITS materializa", sem tipo de nó novo. Classes podem compor (assinatura *de* acesso a um acervo digital).

---

## §3 — Estoque, escassez e anti-oversell

1. Estoque escasso = `ASSET:INVENTORY`. **Anti-oversell é de graça** pela [[serialization-por-linhagem]]: duas compras competindo pela última unidade emitem `SPENDS` sobre o mesmo head; só uma finaliza, a outra colide e é rejeitada — sem lock global, sem contador mutável.
2. Bem digital/não-escasso não decrementa estoque: a venda concede `PERMISSION` e o conteúdo replica normalmente. Escassez é propriedade declarada da classe, não pressuposto.
3. **Reserva de capacidade** (§2 `reserva_capacidade`) modela unidades indexadas por janela temporal; a colisão de duas reservas no mesmo slot é a mesma colisão estrutural de head (não há "overbooking" silencioso). Disponibilidade futura é projeção, não nó mutável.
4. **Limite honesto:** a garantia anti-oversell vale **dentro de uma linhagem** (um emissor de estoque). Estoque espelhado por múltiplos emissores sem coordenador cai no padrão de saga (§4), com janela observável declarada — não na garantia estrutural.

---

## §4 — Checkout como saga multidomínio (a cola entre módulos)

1. **Afirmação honesta primeiro:** atomicidade cross-domínio **não é** invariante de core (como a serialização por linhagem é). O core garante safety **por perna**; consistência cross-domínio é **padrão de composição**, não primitiva. Há janela intermediária observável, exceto sob isolamento.
2. **Tier 1 (default) — saga com `ASSET:LOCK` (TTL):** o checkout decompõe-se em ops single-domain coladas por reservas com TTL. Reservar = op cujo output é um `ASSET:LOCK` ancorado no head (herda detecção estrutural de conflito); confirmar = consome o lock e materializa; expirar/falhar = lock vira lápide e libera o head — **o TTL é a compensação automática**, sem coordenador vivo. Reversão = lançamento compensatório idempotente com retry. Ex.: autoriza pagamento no BaaS → baixa estoque → reverte se falhar.
3. **`ttl_policy` por processo:** quatro políticas selecionáveis na SPEC do processo, caso a caso — `fixed`, `per-leg`, `renewable_lease` (com teto duro), `risk_scaled`. Não há default global. A política `risk_scaled` pode ancorar o TTL no **pulso de presença** do comprador (heartbeat WebRTC, RFC-018): enquanto há presença viva o lock se mantém; queda de presença encurta o TTL, liberando o head sem punir desconexão de boa-fé. Item escasso de alta concorrência (ingresso) é o caso-motivador — TTL `fixed` longo é destrutivo.
4. **Tier 2 — 2PC sobre os mesmos locks**, quando há coordenador confiável *e* isolamento é exigido: coordenador dirige prepare/commit; o bloqueio clássico é resolvido pelo TTL (coordenador cai → locks expiram → aborta). Coordenador legítimo = validador declarado da [[linhagem-de-coordenacao]] (a autoridade dona do contexto: o marketplace, o banco corporativo), que só faz *liveness* — safety segue nos locks. Não é super-peer contrabandeado.
5. **Tier 3 (HTLC) — descartado** (griefing real; P2P puro é boost, não foco). **Escrow por terceiro acordado** é o meio-termo opcional quando valor alto sem confiança: reintroduz um mini-coordenador explícito — sem almoço trustless grátis, e tudo bem assumir.
6. **Estado da saga é orquestração efêmera:** `pending` vive in projeção local não-replicada do orquestrador; só as pernas finalizadas (duráveis) e, opcionalmente, um `CONTENT` "saga liquidada" vão ao grafo. Aresta com `state` mutável replicado **reabriria** o buraco que o append-only fechou — proibido.

---

## §5 — Caixa, verbos econômicos e split

1. Saldos (dinheiro, pontos, créditos) = `ASSET:BALANCE_STATE`; débito = [[spends]], crédito = [[credits]]. **Partida dobrada interna compõe numa op só:** um `SPENDS` na origem, N `CREDITS` nos destinos, atômico por ser uma única finalização de linhagem.
2. **Split de pagamento** é caso direto do (1): uma venda credita vendedor + comissão da plataforma + afiliado + imposto de rede em destinos distintos, na mesma op. Impostos a recolher acumulam em `BALANCE_STATE` próprio.
3. **Comissão e "imposto de rede" são liquidação por SPEC** ([[economia-como-modulo]]: core mede, SPEC liquida). Percentuais (ex.: comissão de marketplace), isenções, tiers e a própria existência de imposto de manutenção são Zen na SPEC econômica da rede — variam por implementação ([[modalidade-de-rede]]).
4. A mesma máquina roda economia de pontos/fidelidade e economia de contribuição da rede — `ASSET` é o tipo comum, SPEC é o lugar da política.
5. **Multi-moeda:** cada `ASSET:BALANCE_STATE` é **denominado numa única moeda** (BRL, USD, pontos, token de rede); não há saldo "polimoeda". Um ator que opera em N moedas tem N saldos. Conversão entre moedas é uma **operação explícita** (§6.4), não soma implícita. A exibição usa o atom `Money`, formatado por jurisdição/locale (RFC-009).

---

## §6 — Liquidação externa e meios de pagamento

1. Movimentação de dinheiro real é delegada a **conector BaaS (RFC-007 classe C, oráculo):** o conector afirma o fato externo (liquidação PIX, boleto, cartão) como perna da saga, assinado pela persona-oráculo; reversão = compensatório. O grafo nunca dispara cobrança como efeito de escrita replicada (A.4 idempotência + RFC-007 A.3.3).
2. Meio de pagamento, parcelamento e moeda são parâmetros do fluxo, roteados por `connector_id` que a **variante jurisdicional** (RFC-009 A.4) pode selecionar (PIX no BR, equivalentes em outras regiões).
3. Modo degradado declarado: sem conector de pagamento, registra-se a obrigação sem liquidar — nunca finge liquidação.
4. **Câmbio/conversão** é operação própria, não aritmética silenciosa: converter moeda A→B é um `SPENDS` no saldo A + `CREDITS` no saldo B (§5.5), com a **taxa afirmada por oráculo** no momento da liquidação (conector de câmbio, RFC-007 classe C/E) e registrada no fato. Preço de item em moeda diferente da do comprador é exibido com conversão **indicativa** (taxa de consulta, classe E), mas a liquidação usa a taxa do momento — a diferença (spread/variação) é declarada, nunca absorvida sem rastro. Quando comprador e vendedor operam em moedas distintas, a conversão A→B (§5.5) é **uma perna da mesma saga** (§4.2), não uma operação solta: o lock no saldo de origem (BRL), a perna do conector de câmbio e o `CREDITS` no saldo de destino (USD) compartilham a janela de TTL e compensam juntos. Liquidação parcial cross-moeda é proibida — ou toda a saga finaliza, ou o lock expira e reverte.

---

## §7 — Modelos de precificação e promoção (brainstorm normatizado)

Preço e promoção são **Zen na SPEC do item/campanha**, nunca código. Modelos previstos:

- **Preço:** fixo; tabelado por tier; **dinâmico** (Zen sobre demanda/estoque/tempo); **leilão** (lances como `CONTENT:INTENT` serializados, maior lance vigente é traversal); **pay-what-you-want** com piso; recorrente (assinatura); **escalonado por faixa** (ex.: preço por banda de aging de um recebível — o motivador original da garantidora).
- **Promoção:** cupom (consumível, anti-reuso por serialização), desconto por volume/combo, **cashback/fidelidade** (crédito em `BALANCE_STATE` de pontos, com **análise de valor presente** quando o resgate é diferido), brinde, frete grátis condicional.
- **Recorrência e churn:** assinatura = `ASSET:ROLE` com ciclo; renovação = intent recorrente; falha de cobrança → política de retry/grace na SPEC; cancelamento = revogação do ROLE.

---

## §8 — Fluxos financeiros sobre a mesma máquina

Recebíveis, aportes e garantias são **itens negociáveis classe `instrumento_financeiro`** — por isso fintech e marketplace são uma RFC só.

1. **Cessão (compra de recebível):** recebível = `ASSET:INVENTORY` (instrumento discreto, consumido uma vez — *não* `BALANCE_STATE`). Validação modelada como aresta `APPROVED_BY` de uma persona analista com `ASSET:ROLE` (gate por descoberta-de-grafo); evidência fiscal externa (NF-e via conector) entra **em paralelo**, sem mudar o gate. Aquisição = saída do caixa central.
2. **Captação (aporte):** aporte = `ASSET:INVENTORY` **espelho** do recebível, governado por `SPEC:APORTE` com **discriminador modal no payload** (confissão de dívida vs. SCP) em vez de tipos separados. Lastro via aresta `RELATES:FINANCE:LASTRO`. Captação = entrada no caixa.
3. **Garantia (garantidora):** terceira **variante de SPEC** sobre a mesma maquinaria, diferenciada por **precificação por taxa de garantia** e declaração `recourse: false`. **Cobrança ativa elevada a processo de primeira classe** (StateMachine de régua, disparo externo via conector classe A — WhatsApp/SMS/email — RFC-007).
4. **Propagação de inadimplência unificada e declarada na Zen:** investidor SCP absorve perda por traversal do `RELATES:FINANCE:LASTRO` de transação; modal confissão absorve no nível da operação. Caixa central `ASSET:BALANCE_STATE` é o eixo: captação e cobrança são entradas; aquisição/garantia e resgate são saídas. A **regra de haircut** — quando a perda excede o fundo de reserva — é declarada Zen no payload da `SPEC:APORTE`: rateio **pro-rata** entre cotistas ou **subordinação por série** (sênior absorve por último, mezanino/júnior primeiro). A ordem de absorção é traversal sobre `RELATES:FINANCE:LASTRO` ponderado pela série declarada em cada cota; não há regra global de subordinação embutida no core.

---

## §9 — Costuras com ERP/CRM e Anúncios

1. **ERP/CRM (RFC-013):** a venda **não** "envia dados" ao ERP — é o **mesmo subgrafo** visto por outra lente. O vendedor lê pedido/estoque/financeiro da venda porque são os mesmos nós (`INTENT`, `INVENTORY`, `BALANCE_STATE`) que ele governa. Integração = projeção, não API entre módulos.
2. **Anúncios (rfc-015):** um `SPEC:PRODUCT_LISTING` pode virar `CONTENT` de anúncio referenciando o item via aresta de promoção, sem duplicar o item. A liquidação do anúncio (impressão/clique/conversão) usa esta mesma máquina econômica.

---

## §10 — Limites honestos

1. Atomicidade cross-domínio tem janela observável (§4.1); só os tiers de isolamento a fecham, ao custo de um coordenador.
2. Anti-oversell estrutural vale por linhagem; multi-emissor é saga (§3.4).
3. Escrow/2PC reintroduzem âncora de confiança — assumido, não escondido.
4. Validação financeira por `APPROVED_BY` humano é gate social/processual; o conector externo é a autoridade sobre o cálculo oficial (fisco, BaaS), não a plataforma.

---

## Apêndice — Catálogo de modalidades de negociação

| Modalidade | Status | Nota |
| :--- | :--- | :--- |
| Venda direta (bem físico/digital) | modelado | §2 |
| Curso / acesso / paywall | modelado | classe `acesso_licenca` |
| Assinatura / clube / SaaS | modelado | classe `assinatura` |
| Serviço sob demanda | modelado | classe `servico` + StateMachine |
| Reserva (hotel, mesa, agenda) | modelado | classe `reserva_capacidade` |
| Leilão / lance | modelado | §7, lances serializados |
| Aluguel / locação | modelado | `acesso_licenca` com TTL + caução (lock) |
| Recebível / aporte / garantia | modelado | §8 |
| Crowdfunding / vaquinha | modelado | N `CREDITS` → meta; reversão se não atingir (saga) |
| Afiliados / split / dropshipping | modelado | split §5.2 |
| Escambo / troca direta | diferido | precisa escrow (§4.5); sem HTLC |
| Tokenização de ativo / fração | diferido | `INVENTORY` fracionável; estudar antes |
| Swap valor-por-valor trustless P2P | descartado | HTLC/griefing (§4.5) |
| Mercado secundário (revenda de ingresso/licença) | diferido | transferência de `PERMISSION`/`INVENTORY` com regra de revenda na SPEC |
