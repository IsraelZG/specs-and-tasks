# Triagem — rfc-018 (Mensagens: Chat, Chamadas, Presença)

> Fonte: `docs/rfcs/rfc-018-mensagens.md` × `docs/rfc_reviews/review_rfc-018.md`

## Contagens por veredito
- **INCORPORAR:** 3
- **JA-COBERTO:** 4
- **UI->INVENTARIO:** 3
- **REJEITAR:** 0
- **REVISAR-HUMANO:** 1
- **Σ achados:** 11

## ⚠ REVISAR-HUMANO (decisão arquitetural pendente)
- **018-03 — E2E em grupos grandes (Sender Keys / Group Ratchets, limiar ~50 membros).**
  A RFC-018 **não especifica** gestão de chaves de grupo nem limiar numérico para E2E (grep confirma: nenhuma menção a E2E/ratchet/chaves/limite de membros). O review propõe estipular o limite onde E2E deixa de ser forçado e passa para Sender Keys/Group Ratchets — decisão de protocolo/cripto que toca o caderno-3/07 e a camada de transporte. **Não redigir norma.** Tensão: o caderno-3/07 (spec de chat vigente) é a fonte de verdade sobre durabilidade/entrega; introduzir mecânica de chaveamento de grupo é decisão arquitetural transversal, não um refinamento local da RFC-018.

> Nota de auditoria de consistência: o concern E2E-group × audit-trail (rfc-013) foi **VERIFICADO como NÃO-contradição** (gravação é opt-in; AuditTrail lê linhagem, não conteúdo E2E). Isso não afeta o veredito acima — o ponto pendente é a mecânica de chaves de grupo, não o audit-trail.

## Tabela de triagem

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 018-01 | §2 — Marcos duráveis de chamada: nós `CONTENT:CALL_START` e `CONTENT:CALL_END` (com duração/participantes) assentados na conversa do grafo, vinculando horas de chamada ao histórico permanente | INCORPORAR | A.3 §3 (item novo, 4) | "**Logging durável de chamada.** Embora a mídia rode em canais WebRTC próprios fora do reconciliador, dois marcos duráveis são assentados na conversa: `CONTENT:CALL_START` e `CONTENT:CALL_END` (este carregando duração e participantes). Eles vinculam o histórico de chamadas à linhagem permanente da conversa; nenhum evento intra-chamada é logado." | [x] |
| 018-02 | §2 — Presença: rate-limits rígidos + expiração local rápida do sinal (ex.: typing expira nativamente após 5 s sem refresh) para evitar lixo nas views e spam de clientes modificados | INCORPORAR | A.4 (acréscimo) | "O sinal de presença embute **rate-limit rígido** por cliente e **auto-expiração local**: o indicador de digitação expira nativamente após ~5 s sem refresh, evitando retenção de lixo nas views ativas e limitando o spam de clientes adversários." | [x] |
| 018-03 | §2 — E2E em grupos grandes: estipular limite numérico (ex.: > 50 membros) onde E2E não é mais forçado ou passa para Sender Keys / Group Ratchets | REVISAR-HUMANO | — (gestão de chaves de grupo; caderno-3/07 + transporte) | Ver bloco REVISAR-HUMANO acima. RFC-018 não especifica chaveamento de grupo nem limiar; decisão de protocolo/cripto transversal. Não redigir. | [x] |
| 018-04 | §3 — Layout: Chat Híbrido Shell — Split-View Master-Detail (lista de conversas à esquerda, thread à direita) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Layout (organismo): `MessagesSplitView` — master-detail (lista de conversas + thread) seguindo o shell de colunas (RFC-026) · módulo: Mensagens | [x] |
| 018-05 | §3 — Indicadores flutuantes: `CallPanel` em PIP (Picture-in-Picture) universal, persistindo enquanto o usuário navega em outros módulos | UI->INVENTARIO | `inventario-componentes-layouts.md` | Organismo: `CallPanel` (PIP universal, fora do fluxo de coluna; chamada persiste durante navegação) · módulo: Mensagens | [x] |
| 018-06 | §3 — Átomos/moléculas/organismos: `ReadReceiptTick`, `OnlineDot`, `TypingBubble`, `CallDurationTimer`, `ChatMessageBubble`, `CallLogBanner`, `ChatWindow`, `VideoConferenceGrid` | UI->INVENTARIO | `inventario-componentes-layouts.md` | Átomos: `ReadReceiptTick`, `OnlineDot`, `TypingBubble`, `CallDurationTimer` · Moléculas: `ChatMessageBubble` (reply de contexto), `CallLogBanner` ("Chamada finalizada — 45 min") · Organismos: `ChatWindow` (lista virtualizada na ponta do log), `VideoConferenceGrid` (LiveKit Room) · módulo: Mensagens | [x] |
| 018-07 | §1 — Validação da ideia central (conversa única como base + master-detail RFC-026 + doc colaborativo RFC-027) | JA-COBERTO | A.1, preâmbulo (transversais), A.2 | RFC já firma conversa única (A.1), master-detail/CallPanel via shell (preâmbulo) e sessão-doc colaborativa (RFC-027). Validação sem objeção. | [x] |
| 018-08 | §4 — Nós `SPECIFICATION:CHAT_MESSAGE` e `CONTENT:FILE` (gravação consolidada); aresta para `Conversa` raiz | JA-COBERTO | A.2, A.3 §2 | A.2 referencia `SPECIFICATION:CHAT_MESSAGE` (caderno-3/07); A.3 §2 define a gravação como `CONTENT:FILE` anexado à conversa. Descreve o que a RFC já diz. | [x] |
| 018-09 | §4 — Aresta `REPLIES_TO` para threads/citações | JA-COBERTO | A.2 (via caderno-3/07) | Threads/citações herdam o modelo de mensagem do caderno-3/07, que a RFC integra sem redefinir (A.2). Mecânica de aresta é da spec de chat vigente, não norma nova da RFC-018. | [x] |
| 018-10 | §5 — Ciclo de vida: presença via canal de gossip volátil lateral; mensagens duráveis no grafo; voláteis/auto-destrutivas eliminadas do SQLite pós-TTL | JA-COBERTO | A.4, A.2 | A.4 define presença como estado efêmero não-durável (sinal volátil); A.2 herda efêmero-vs-grafo e durabilidade do caderno-3/07. Descreve o vigente. | [x] |
| 018-11 | §5 — Mutação: mensagens editadas sofrem supersession (selo "Editado") | JA-COBERTO | A.2 (via caderno-3/07) | Supersession/edição é mecânica da spec de chat do caderno-3/07, que a RFC-018 integra sem redefinir (A.2). Não é norma nova. | [x] |
