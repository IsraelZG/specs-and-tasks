# Revisão RFC-013: ERP Operacional e CRM

## 1. Validação da Ideia Central
A quebra do paradigma "ERP = Banco de Dados próprio" para "ERP = Projeção Lógica do Subgrafo Transacional do Marketplace" reduz à metade o código da plataforma. A atualização alinhando o ciclo de pedidos aos `SPEC:WORKFLOW` da RFC-022 e Dashboards à RFC-026 finaliza o desenho. O aviso honesto sobre "Limites de BI cifrado em Append-Only" (A.6.2 e A.7.2) blinda o sistema contra expectativas inatingíveis (Ex: Queries OLAP cruas ad-hoc no cliente P2P mobile).

## 2. Refinamentos e Adições Sugeridas
- **Resiliência do Lock de Estoque na Linha do Tempo (A.3):** A reserva temporária com `ASSET:LOCK` é poderosa, mas ERPs tradicionais sofrem com *Ghost Reservations* (reservas que esqueceram de expirar). Como o protocolo P2P é descentralizado, a liberação por expiração não pode depender de um CRON server-side ativo (em P2P puro). O motor de Timeline tem que tratar nativamente "Locks Vencidos" como "Estoque Disponível" na projeção visual imediata, mesmo antes da Tombstone materializar no SQLite.
- **Conciliação Bancária Idempotente (A.4):** A junção de extrato externo com a `external_ref` é o calcanhar de Aquiles de qualquer ERP. Muitos bancos (OFX/QIF) mandam o mesmo lançamento repetido. A `external_ref` deve ser um hash criptográfico gerado não só do ID do Banco, mas também da (Data + Valor + CNPJ Contraparte), evitando duplicação cega caso o conector Classe C oscile e reenvie com UUID diferente.
- **CRM e GDPR/LGPD (A.5):** Se toda interação do CRM é amarrada num Grafo Append-Only, o Direito ao Esquecimento fica em risco (não posso apagar o passado). O dado do Cliente Pessoa Física tem que ser ancorado em chaves simétricas separadas. Se o cliente pedir deleção, o gestor exclui a chave (Crypto Shredding), transformando as amarrações do CRM em "Cliente Anonimizado XYZ", mantendo a integridade matemática da linhagem financeira.

## 3. Design System & UI Layout
### Ideias de Layout
- Dashboards Modulares Shell (RFC-026): Tiles de BI customizáveis na Homepage do Usuário Corporativo.
- Visão 360 Graus CRM: Um componente Master-Detail onde o centro é a Timeline do Lead (Traversals do Grafo exibindo intents, faturas e logs do Livekit na mesma régua de tempo).

### Componentes Necessários
- **Atoms:** `WorkflowStateTag`, `InventoryCountPill`.
- **Molecules:** `BankReconciliationRow` (Match verde vs vermelho do extrato contra o lançamento).
- **Organisms:** `CRMPipelineKanban` (O board interativo reagindo aos Intents e arrastando cards usando a StateMachine subjacente).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** `SPEC:SALES_ORDER` / `SPEC:CRM_PIPELINE`.
- **Arestas:** Mapeamentos estruturais ligando Profile de Leads aos Eventos de Agendamento, Vendas e Anotações Livres.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Intents de transição nascem de gatilhos do Workspace.
- **Mutação:** Workflows e Sagas progridem as compras/leads pelas pipelines.
- **Fim de Vida:** Pedidos fechados/faturados e Clientes perdidos não são deletados, mantendo-se acessíveis às views analíticas incrementais.
