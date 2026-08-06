---
id: ephemeral-messages
tipo: conceito
status: ativo
fontes:
  - docs-v2/protocolo/automerge-integration.md
  - https://automerge.org/docs/reference/repositories/ephemeral/
substitui:
  - docs/conceitos/ephemeral-messages.md
---

# ephemeral-messages

Mensagens descartáveis de uma sessão, enviadas por `DocHandle.broadcast()`.
Exemplos: cursor, presença, digitação e progresso.

O broadcast não garante entrega. Ele não é prova de uma operação. RPC, ACK,
chaves e controle crítico usam frames direcionados. Dados que devem
sobreviver à queda usam a outbox ou o grafo.

Contrato completo: `docs-v2/protocolo/automerge-integration.md` seção 3.
