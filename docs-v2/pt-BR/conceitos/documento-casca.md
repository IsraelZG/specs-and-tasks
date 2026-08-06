---
id: documento-casca
tipo: conceito
status: ativo
fontes:
  - docs-v2/protocolo/automerge-integration.md
substitui:
  - docs/conceitos/documento-casca.md
---

# documento-casca

Um `DocHandle` vazio ou mínimo do Automerge Repo. Serve para broadcast e
presença da sessão.

O identificador da sala deriva de um segredo de capability:
`RendezvousId = SHA-256(rendezvous_secret || ASSET:PERMISSION_ID)`.

O Documento Casca não cria a conexão WebRTC. O `NetworkAdapterPort` cria e
mantém a conexão. O Documento Casca não persiste dados do grafo.

Contrato completo: `docs-v2/protocolo/automerge-integration.md` seção 2.
