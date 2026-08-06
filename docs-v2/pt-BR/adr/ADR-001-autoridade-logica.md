---
id: adr-001-autoridade-logica
tipo: adr
status: aceito
data: 2026-08-01
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seções 5, 6 e 7)
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md
substitui:
  - docs/conceitos/first-peer-protocol.md (como fundamento de correção)
  - docs/conceitos/genesis-state.md (como fundamento de correção)
  - docs/conceitos/consenso-emergencia.md
  - docs/conceitos/consistent-hashing.md (como custódia oficial)
  - docs/conceitos/replication-factor.md (como garantia mantida por gossip)
  - docs/caderno-2-protocol/03-set-reconciliation-protocol.md (RBSR como caminho normal)
---

# ADR-001 — Toda rede tem uma autoridade lógica; o modo P2P puro deixa de existir

## Contexto

A especificação anterior admitia três modalidades de rede: P2P puro, corporativa
e pública. A modalidade P2P puro operava sem autoridade identificada. Ela usava
gênese autônoma pelo primeiro peer, consenso de emergência entre clientes,
eleição de validador entre peers comuns e custódia por consistent hashing.

O parecer jurídico de conformidade concluiu que uma trilha técnica sem
autoridade identificada não sustenta um registro nominativo formal. O briefing
de reescrita determinou a remoção do modo P2P puro de todas as especificações
técnicas ativas.

## Decisão

1. Toda rede ativa tem uma autoridade lógica identificada.
2. A autoridade lógica pode usar várias instâncias físicas.
3. Alta disponibilidade não cria autoridades concorrentes.
4. A autoridade não exige provedor de nuvem. Ela pode operar em infraestrutura
   local ou contratada.
5. O change feed autoritativo substitui o RBSR como caminho normal de
   sincronização do grafo.
6. Conexões P2P diretas permanecem como otimização de latência e custo, sob
   sinalização e autorização da autoridade.
7. Mecanismos de reputação permanecem apenas para abuso e qualidade de
   serviço. Eles não decidem a validade do ledger.

## Mecanismos removidos como fundamento de correção

- Gênese autônoma pelo primeiro peer.
- Rede sem dono ou operador identificado.
- Consenso de emergência entre clientes.
- Eleição de validador entre peers comuns.
- Replication factor mantido somente por gossip.
- Custódia oficial por consistent hashing entre clientes.
- DHT público para descobrir o grafo privado.
- RBSR como protocolo obrigatório do caminho normal.
- Peer do sistema como substituto eventual de uma autoridade ausente.

## Consequências

- O conceito de modalidade muda. Restam duas topologias: rede corporativa e
  rede pública operada. Ambas têm responsável jurídico e técnico identificado.
- O perfil regulatório é ortogonal à topologia. O perfil
  `corporate-regulated/securitization` ativa controles obrigatórios sobre
  qualquer topologia.
- Os documentos antigos que autorizavam P2P puro viram histórico. Este ADR não
  altera ADRs anteriores. Ele os substitui para o trabalho futuro.
- O RBSR permanece disponível como algoritmo auxiliar de auditoria entre
  réplicas da autoridade. Ele não é o caminho normal do cliente.
- Tasks que dependem dos mecanismos removidos exigem novo endurecimento. A
  lista está em `tasks-reendurecimento.md`.

## Alternativas consideradas

- **Manter P2P puro como modalidade legada.** Rejeitada. Uma definição ativa
  que autoriza rede sem autoridade contradiz o enquadramento jurídico do
  produto regulado.
- **Autoridade eleita pelos clientes.** Rejeitada. Clientes não elegem
  autoridade. A autoridade é designada na criação da rede e sua rotação é um
  ato de governança, não de consenso entre peers.
