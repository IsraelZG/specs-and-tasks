# Revisão RFC-019: Email (Cliente Real)

## 1. Validação da Ideia Central
Essa é talvez a integração mais pragmática e madura do conjunto. Abstrair as contas de E-mail via conectores IMAP/SMTP (Classe D: Espelho Bidirecional) significa que não se tentará refazer o ecossistema mundial de correio eletrônico, mas sim integrá-lo de forma fluida. O incremento da RFC-022 para orquestração de Regras de Caixa como StateMachine e a instância de Profiles-Delegados individuais para cada conta externa do usuário blindam a permissão rigorosamente.

## 2. Refinamentos e Adições Sugeridas
- **Armazenamento Lógico de Anexos (A.2):** O email entra no conector e os anexos vão para o Media Plane. Porém, emails institucionais/P2P podem possuir anexos absurdamente massivos (vídeos corporativos, PSTs) que entupiriam o media plane em pouco tempo. A importação do conector IMAP não deve materializar automaticamente Anexos pesados > N Megabytes no media plane, criando em vez disso um "Ponteiro Cego" e baixando on-demand quando o cliente explicitamente solicitar, via cache local.
- **Desconexão do Conector (A.5):** Senhas IMAP expiram ou serviços (como OAuth do Google Workspace) revogam o token. Quando o Conector cai para Offline Auth, a UI deve sinalizar imediatamente "Credencial Inválida", pois as sagas de envio do ERP começarão a falhar e tentar compensações (Retries) intermináveis ou cairão num fallback não desejado.
- **Threads Bidirecionais:** Modificar o local de um nó `CONTENT:EMAIL` para "Arquivado" no Grafo força o Conector a mover a mensagem real para a pasta "[Gmail]/All Mails" no servidor. Garantir que esse "Translation Engine" IMAP funcione perfeitamente para labels complexas será crítico.

## 3. Design System & UI Layout
### Ideias de Layout
- Inbox Tri-Pane via Shell (RFC-026): Painéis redimensionáveis de Folders -> Thread List -> Email View.
- Extensibilidade Inteligente: Ao ver um email do fornecedor, a UI injeta um botão no topo "Ligar Pedido ao ERP" sugerido pela IA local-first (RAG context).

### Componentes Necessários
- **Atoms:** `EmailReadDot`, `AttachmentPill`, `ThreadCountBadge`.
- **Molecules:** `EmailThreadItem` (Linha do email na lista com preview e remetente).
- **Organisms:** `EmailComposeWindow` (Editor de HTML rico acoplado ao envio da Saga SMTP), `InboxMailboxViewer`.

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `SPECIFICATION:EMAIL` (O envelope espelhado, idempotente via Message-ID).
- **Arestas:** 
  - `IN_REPLY_TO` / `REFERENCES` (Arestas nativas traduzidas dos cabeçalhos RFC 2822 para as arestas de grafo, montando as threads).

## 5. Ciclo de Vida dos Dados
- **Nascimento:** O conector (Polling/IDLE) puxa as caixas do provedor, assinando a inserção no Grafo via seu Profile Delegado exclusivo.
- **Mutação:** Lidas/Não-Lidas, Mudanças de Label acionam o conector bidirecional para refletir no mundo externo (oráculo espelho).
- **Fim de Vida:** Expurgar a conta do sistema remove o conector. Os e-mails no grafo podem ser definidos para desidratar progressivamente ou persistir como registros atachados em deals do CRM.
