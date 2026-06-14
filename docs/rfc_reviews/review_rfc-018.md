# Revisão RFC-018: Mensagens (Chat, Chamadas, Presença)

## 1. Validação da Ideia Central
Tratar Mensagens DMs, Chats em grupo e Chamadas A/V sob a mesma entidade de base (`Conversa`) garante a persistência fluida de contexto entre diferentes modalidades. A visão atualizada aplicando `Master-Detail` do Shell de Colunas (RFC-026) para visualização e elevando a conversa ao status de "Doc Colaborativo" (RFC-027) para rascunhos assíncronos é fantástica.

## 2. Refinamentos e Adições Sugeridas
- **Desincronização de Chamadas vs Grafo:** O LiveKit é o SFU escolhido e tem seus canais WebRTC próprios. Uma chamada não loga eventos a cada segundo. No entanto, é fundamental assentar dois marcos duráveis na conversa do Grafo: o Nó `CONTENT:CALL_START` e o Nó `CONTENT:CALL_END` (com duração/participantes). Isso vincula as horas de chamada ao histórico permanente do chat.
- **Limitação de Falsificação de Presença (A.5):** Clientes modificados podem spammar "typing..." indefinidamente. O sistema Ephemeral de presença deve embutir Rate Limits rígidos e Expiração local rápida (ex: o sinal de typing expira nativamente após 5 segundos se não houver refresh), para evitar a retenção de lixo nas Views ativas.
- **Criptografia E2E em Grupos Grandes:** Mensagens 1:1 podem rodar em E2E, mas em grupos massivos a troca de chaves inviabiliza. Como o media plane é regido pela camada central, a RFC deve estipular o limite numérico (ex: > 50 membros) onde E2E não é mais forçado ou passa para Sender Keys (Group Ratchets).

## 3. Design System & UI Layout
### Ideias de Layout
- Chat Híbrido Shell: O Split-View clássico com a Lista na Esquerda (Conversations) e Thread de Mensagens na Direita (Master-Detail).
- Indicadores Flutuantes: CallPanel em PIP (Picture-in-Picture) universal para chamadas rolando enquanto o usuário navega na rede social ou ERP.

### Componentes Necessários
- **Atoms:** `ReadReceiptTick`, `OnlineDot`, `TypingBubble`, `CallDurationTimer`.
- **Molecules:** `ChatMessageBubble` (Suporta reply de contexto), `CallLogBanner` (Mensagem "Chamada de Vídeo Finalizada - 45 min").
- **Organisms:** `ChatWindow` (Lista virtualizada ultra-rápida renderizando a ponta do log), `VideoConferenceGrid` (Integração visual com LiveKit Room).

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `SPECIFICATION:CHAT_MESSAGE` (Cada fala durável).
  - `CONTENT:FILE` (A gravação consolidada).
- **Arestas:** 
  - Mensagens atadas a uma `Conversa` raiz e enlaçadas por `REPLIES_TO` em caso de threads/citações.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** Mensagens são enviadas no sync do Grafo; Presença é enviada por canal de Gossip volátil lateral.
- **Mutação:** Mensagens editadas sofrem Supersession (Aparece selo "Editado").
- **Fim de Vida:** Mensagens duráveis seguem a persistência do Grafo. Mensagens voláteis/auto-destrutivas seguem o caminho do Story: são eliminadas do SQLite pós-TTL.
