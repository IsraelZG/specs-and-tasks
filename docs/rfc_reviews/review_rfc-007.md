# Revisão RFC-007: Conectores de Mundo Externo

## 1. Validação da Ideia Central
A taxonomia de conectores em cinco classes (A até E) resolve com elegância o tratamento caótico de integrações em sistemas distribuídos. Ao forçar a pergunta "o resultado entra na linhagem como fato durável?", a RFC estabelece uma fronteira clara entre I/O efêmero (como consultar rotas) e I/O crítico (como espelhar caixas de email IMAP).

## 2. Refinamentos e Adições Sugeridas
- **Webhook Seguro como "Wake-up Call":** Muitos ERPs legados não suportam assinatura criptográfica em webhooks. Deve-se adicionar uma regra de que payloads não-autenticáveis no ingresso sejam reclassificados como Classe B (content-blind), acionando imediatamente um polling transacional seguro em vez de injetar o fato diretamente.
- **Circuit Breaker em Sagas:** O estouro de quota hoje impõe enfileiramento e backoff. Porém, em fluxos da Classe C (Oráculos transacionais), um backoff muito longo pode segurar locks de assets indefinidamente. Sugere-se formalizar que conectores degradados disparem falhas (fail-fast) nas sagas afetadas ou acionem o timeout de saga preventivamente.
- **Semântica CRDT para Disputas de Espelho:** A RFC (A.4.5) diz que conflitos são resolvidos pela "SPEC do domínio". Sugere-se definir nativamente o uso de Last-Writer-Wins com Vector Clocks para espelhos bidirecionais (Classe D) para resolver automaticamente desvios com sistemas externos que suportem essa rastreabilidade.

## 3. Design System & UI Layout
### Ideias de Layout
- A interface principal de administração precisará de um **Painel de Saúde e Roteamento de Conectores**.
- Visão clara do funil de ingressos e egressos com identificação visual do status.

### Componentes Necessários
- **Atoms:** `StatusBadge` (Up, Degraded, Down), `ConnectorIcon` (Email, API, ERP), `ProgressBar` (Quotas).
- **Molecules:** `ConnectorHealthCard` (Mostra última sincronização e latência), `RateLimitWarning`.
- **Organisms:** `ConnectorConfigForm` (JSON Forms para injeção das credentials/templates via SPEC), `SagaExecutionLog` (Painel lateral visualizando a perna bloqueada de uma transação).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `PROFILE:SYSTEM` (A persona do próprio conector).
  - `ASSET:ROLE` (As permissões do conector para ler/afirmar).
  - `CONTENT` ou fatos operacionais que representam o dado inserido.
- **Arestas:** 
  - `APPROVED_BY` (Conectando o fato oracular gerado ao `PROFILE:SYSTEM` do conector, garantindo auditabilidade).

## 5. Ciclo de Vida dos Dados
- **Nascimento:** O fato nasce via ingresso por Polling/Webhook assinado pela persona do conector. A chave de idempotência (`external_ref`) previne clones.
- **Mutação:** Para a Classe D, uma sincronização incremental substitui o fato antigo via linhagem (`SUPERSEDED_BY`).
- **Fim de vida:** O dado bruto do provedor (payload) anexado como evidência pode morrer rápido via expiração temporal (TTL de G4), enquanto o fato em si sobrevive como audit trail perene no grafo.
