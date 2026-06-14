# Revisão RFC-023: Logística, Estoque (WMS) e Fulfillment

## 1. Validação da Ideia Central
A ideia de que a "Logística é apenas Orquestração de Workflow sobre o Estoque Existente" é impecável. Expandir o escopo para abarcar a "Gig Economy / Fleet Própria" através do mesmo modelo do Marketplace (onde o Entregador "lista" sua disponibilidade como `reserva_capacidade`) é genial, eliminando a necessidade de construir um motor de 'Uber' do zero, pois ele roda em cima do motor econômico base.

## 2. Refinamentos e Adições Sugeridas
- **Resolução Automática de Dispute Escrow (A.5):** Disputas suspendem o lock financeiro. Mas numa plataforma híbrida com entregadores P2P, fraudes de "Comprador disse que não chegou vs Entregador provou com foto" podem dar stalement. É recomendável instituir uma IA Julgadora Neutra via `compute` RAG que analisa foto, horário e coordenada contra a promessa da SLA, oferecendo uma resolução inicial antes do apelo humano.
- **Agrupamento Otimizado (Wave/Batch Picking - A.1):** Orquestrar N reservas (`ASSET:LOCK`) para separar itens em massa exige que a engine `Zen` avalie as restrições locais de distância nos *bins/corredores* do armazém. O Grafo local precisa modelar o mapa físico do Depósito como um subtipo de `SPEC:PLACE` com caminhos de roteirização interna.

## 3. Design System & UI Layout
### Ideias de Layout
- DispatchBoard Tático: Tela combinada: Esquerda contendo o MapCanvas (RFC-021) com Entregadores e Direita contendo as Orders em estado *Aguardando Coleta*, prontas para "Drag and Drop" para o entregador desejado.
- WMS Scanner View: Interface hiper-focada, otimizada para coletores de dados e smartphones (Modo Mobile), com botões gigantes e foco no Scan de Câmera/Barcode.

### Componentes Necessários
- **Atoms:** `StatusTimelineDot`, `BarcodeScannerWidget`.
- **Molecules:** `DeliveryRouteStop` (Card do passo-a-passo do motorista).
- **Organisms:** `DispatchKanbanBoard`, `FulfillmentWaveManager`.

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** Intents de separação, Nós de Evidência (`CONTENT:FILE` para assinatura/foto).
- **Arestas:** `ASSET:LOCK` (Reservando Estoque / Capacidade do Entregador).

## 5. Ciclo de Vida dos Dados
- **Nascimento:** O Vendedor aprova o pedido, dando kickstart no Workflow.
- **Mutação:** Transições progressivas (Separado -> Empacotado -> Despachado). O histórico de "Mudanças de Status" é inviolável na linhagem.
- **Fim de Vida:** Entrega finalizada, o Lock de pagamento é liquidado em favor do Entregador e o Pedido é arquivado/resolvido.
