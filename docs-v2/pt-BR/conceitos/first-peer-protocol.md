---
id: first-peer-protocol
tipo: conceito
status: historico
fontes:
  - docs-v2/adr/ADR-001-autoridade-logica.md
substitui:
  - docs/conceitos/first-peer-protocol.md
---

# first-peer-protocol (histórico)

O First Peer Protocol regulava a gênese autônoma de uma rede pelo primeiro
peer, com a máquina de estados JOINING, WAITING_FOR_SWARM, CONNECTED,
GENESIS e OFFLINE_RETRY.

A gênese autônoma pelo primeiro peer deixou de existir. Toda rede é criada
pela autoridade lógica. O primeiro contato de um cliente usa o diretório da
autoridade, mDNS, link multiaddr assinado ou convite.

Decisão: `docs-v2/adr/ADR-001-autoridade-logica.md`.
