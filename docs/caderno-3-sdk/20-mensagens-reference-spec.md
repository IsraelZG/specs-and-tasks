# 20-mensagens-reference-spec.md — Mensagens (Chat, Chamadas, Presença)

> Fonte: RFC-018 (absorvida e deletada). Estende a `caderno-3-sdk/07-chat-reference-spec.md` envolvendo chat num produto único com chamadas (LiveKit, plugin `infra` — RFC-010) e presença. **Produto único** (modelo que combina mensageria e conferência); specs por modalidade. **Zero tipo de nó novo.** Onde não tocada, a doc vigente prevalece. Transversais posteriores a aplicar na absorção: master-detail (lista + thread) e `CallPanel` seguem o shell (RFC-026); a sessão de conversa aberta pode ser a sessão-doc colaborativa e o módulo segue a compartimentação por (usuário × módulo) (RFC-027).

---

## §1 — Produto único

Chat, chamada e presença operam sobre a mesma `conversa` (modelagem do caderno-3/07) e os mesmos participantes (`PROFILE`). A modalidade muda o transporte e a durabilidade, não o modelo de conversa.

---

## §2 — Chat

Chat 1:1 e em grupo segue integralmente o `caderno-3-sdk/07-chat-reference-spec.md` (`SPECIFICATION:CHAT_MESSAGE`, projeção `chat_conversations`, efêmero vs. grafo). Esta RFC não o redefine; apenas o integra. DMs da rede social (RFC-016 A.5) são esta mesma conversa.

---

## §3 — Chamadas e conferência

1. Áudio/vídeo 1:1 e conferência via **LiveKit**: **SDK cliente embutido** (first-party), **SFU como plugin `infra`** exigido pelo LiveKit (RFC-010 A.3, modality-gated); canais WebRTC próprios, fora do reconciliador do grafo. Sem SFU (P2P puro): WebRTC bruto para 1:1/grupos pequenos, sem conferência grande. A sinalização de início/convite é intent sobre a conversa.
2. **Gravação** (opcional, com consentimento) = segmentos efêmeros consolidados pela [[consolidacao-de-live]] (utilitário `compute` assíncrono, RFC-017 A.3) num `CONTENT:FILE` anexado à conversa.
3. Tela compartilhada/transcrição são utilitários `compute` (RFC-010/011) sobre a sessão.
4. **Logging durável de chamada.** Embora a mídia rode em canais WebRTC próprios fora do reconciliador, dois marcos duráveis são assentados na conversa: `CONTENT:CALL_START` e `CONTENT:CALL_END` (este carregando duração e participantes). Eles vinculam o histórico de chamadas à linhagem permanente da conversa; nenhum evento intra-chamada é logado.

---

## §4 — Presença

Presença (online, digitando, visto por último) é **estado efêmero não-durável** — sinal volátil, nunca nó append-only replicado (seria poluir a linhagem). Entrega best-effort; "visto por último" é cortesia honest-client, desligável. O sinal de presença embute **rate-limit rígido** por cliente e **auto-expiração local**: o indicador de digitação expira nativamente após ~5 s sem refresh, evitando retenção de lixo nas views ativas e limitando o spam de clientes adversários.

---

## §5 — Limites honestos

1. Chamadas dependem de SFU/relay disponível; P2P puro sem âncora tem alcance limitado de conferência.
2. Presença é best-effort e falsificável por cliente adversário; não é prova de disponibilidade.
3. Entrega/ordenação herdam as garantias do caderno-3/07 (não reabre aqui).
