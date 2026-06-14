# Revisão RFC-012: Marketplace e Negociação de Ativos

## 1. Validação da Ideia Central
A abstração extrema do conceito de Marketplace para "Negociação de Qualquer Coisa com Classe de Liquidação" é um feito arquitetônico que unifica E-commerce, SaaS, Freelas e Fintechs num único motor transacional. A atualização alinhando o "Arrastar Produto para virar Anúncio" via Planos de Comando (RFC-027) conserta o paradoxo de UI. O modelo de Sagas Multidomínio (Tier 1/2) com Locks e TTLs é brilhante e imensamente superior a 2PC nativo.

## 2. Refinamentos e Adições Sugeridas
- **Desistência de Compra Rápida (TTL tuning) (A.4):** Se um usuário inicia um checkout com `ASSET:LOCK` para o último item escasso, a política de TTL `fixed` não pode ser estática. Em ingressos de alta concorrência (shows), se o usuário perde a conexão, travar o item por 15 minutos é destrutivo. A `risk_scaled` deve incluir "TTL por Pulso de Presença" do WebRTC.
- **Split Multi-Moeda (A.5):** O split e a partida dobrada num "Spends X -> N Credits" funciona perfeitamente, mas no item (A.5.5) a conversão de câmbio é tratada como transação explícita separada por Oráculo. A UX exigirá a colagem dessas pernas na mesma saga. Ex: Comprador BRL paga Vendedor USD, a saga bloqueia (BRL), o conector de Câmbio emite a conversão e o saldo final credita (USD). Tudo atado ao Tier 1.
- **Propagação de Risco Financeiro (A.8):** Em Garantidoras com Captação/SCP, quando a inadimplência bate (A.8.4), a redução patrimonial do lastro afeta o `BALANCE_STATE` do cotista. O Grafo precisa ter a instrução de *Haircut* Zen clara: se a perda passa o fundo de reserva, o rateio de perdas entre cotistas acontece pro-rata ou por série sênior/mezanino? Isso deve ser expresso no Payload da Variante.

## 3. Design System & UI Layout
### Ideias de Layout
- CartDrawer Universal: A gaveta lateral deslizante de Carrinho de Compras do Shell (RFC-026) servirá tanto para Itens Físicos quanto para Títulos de Recebíveis da Fintech.
- Tabela Financeira Expansível: Um data-grid com Tree-View para mostrar "Venda XYZ -> Split -> Imposto -> Comissão".

### Componentes Necessários
- **Atoms:** `CurrencyMoneyView` (Respeitando a Locale do RFC-009).
- **Molecules:** `CartItemRow` (Que suporte renderizar `bem_serializado` ou `assinatura`), `SagaLegStatus` (Tickers visuais do checkout pending).
- **Organisms:** `CheckoutSagaWizard` (A interface que acompanha a progressão visual das pernas do Orquestrador Local).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `CONTENT:INTENT` (Checkout/Pedido).
  - `ASSET:BALANCE_STATE` (Caixas).
  - `ASSET:INVENTORY` / `ASSET:PERMISSION` / `ASSET:ROLE`.
- **Arestas:** 
  - `SPENDS` / `CREDITS` (Saldos).
  - `BELONGS_TO` (Listing para Produto Original).

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Instanciados pelos Comandos (RFC-027) do UI para a Maquininha.
- **Mutação:** Sagas criam Intents pendentes de Confirmação local. Finalização acopla na Head.
- **Fim de Vida:** Expiração de Locks (`ttl_policy`) ou liquidação total dos saldos em zero, embora o registro da movimentação siga pendurado no grafo perenemente.
