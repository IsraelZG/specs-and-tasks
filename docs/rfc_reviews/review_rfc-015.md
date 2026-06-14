# Revisão RFC-015: Anúncios e Promoção Cross-Módulo

## 1. Validação da Ideia Central
Tratar anúncios não como novos objetos, mas como conexões promocionais (`RELATES:AD:PROMOTES`) que apontam para entidades já existentes, elimina duplicação massiva de metadados. A integração explícita das transversais mais recentes (`SPEC:WORKFLOW` para campanhas e Comandos de Profile RFC-027 para "Arrastar para Virar Anúncio") conserta a ponte entre a arquitetura e a interação do usuário na interface Shell.

## 2. Refinamentos e Adições Sugeridas
- **Verificação Distribuída de Fraudes (A.5):** Na medição de cliques/impressões (`CONTENT:EVENT`) num modelo P2P, a plataforma está sujeita a Sybil Attacks (nós forjando cliques). A RFC menciona "anomalia". Sugere-se especificar que impressões faturáveis requeiram a Assinatura Criptográfica do Espectador (o `PROFILE` de quem viu) no evento. Cliques de contas recém-criadas sem saldo ou reputação devem receber "peso zero" no cálculo de cobrança `Zen` para proteger os anunciantes.
- **Segmentação Contextual vs RAG (A.3):** Segmentar via GraphRAG (traversal) é poderoso, mas perigoso do ponto de vista de privacidade implícita. Um anunciante poderia tentar inferir dados E2E criptografados enviando uma segmentação altamente restrita ("Mulheres que moram na rua X e compraram Y"). Se o anúncio for entregue a 1 pessoa, o anunciante inferiu a identidade. Recomenda-se um k-anonymity hardcoded: Campanhas não entregam impressões se o coorte de segmentação for menor que N indivíduos.

## 3. Design System & UI Layout
### Ideias de Layout
- Gestor de Campanhas: UI no estilo "Business Manager" governado pelo fluxo StateMachine (`SPEC:WORKFLOW` RFC-022) com funis visuais.
- Injeção em Superfícies: O Design System precisa de um slot universal (`AdSlotPlaceholder`) que a Shell (RFC-026) possa injetar. O componente resolve sozinho se renderiza algo ou fica oculto, sem quebrar o layout grid.

### Componentes Necessários
- **Atoms:** `SponsoredLabel` (Obrigatório e padronizado), `BudgetMeterBar` (Visualiza o Pacing).
- **Molecules:** `CampaignRow` (Tabela de campanhas ativas com RoAS e CTR).
- **Organisms:** `AdPlacementWidget` (A casca que injeta o componente promovido), `AudienceBuilderForm` (UI interativa que traduz seleções visuais em queries RAG de segmentação).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `SPECIFICATION:AD_CAMPAIGN` (Orçamento e Política).
  - `CONTENT:AD` (O criativo, a ponte visual).
- **Arestas:** 
  - `RELATES:AD:PROMOTES` (Do Anúncio para o Produto/Post).
  - Arestas financeiras `SPENDS`/`CREDITS` fechando o loop na carteira da campanha.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** O anunciante provisiona a `SPEC:AD_CAMPAIGN`, bloqueando o Lock no `BALANCE_STATE`.
- **Mutação:** Impressões e cliques geram eventos de intenção (`INTENT`) que o motor Zen coleta. A campanha vai consumindo orçamentos.
- **Fim de Vida:** O saldo da campanha acaba ou o período expira. O nó da campanha não sofre mais ações, cessa a veiculação, tornando-se histórico de performance.
