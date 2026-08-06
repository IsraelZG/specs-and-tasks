---
id: private-swarm
tipo: conceito
status: ativo
fontes:
  - docs-v2/arquitetura/topologia-e-autoridade.md (seção 3.1)
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 6)
substitui:
  - docs/conceitos/private-swarm.md
---

# private-swarm

Canal de sincronização entre dispositivos do mesmo titular. Cobre rascunhos,
preferências e caches privados. O tráfego usa a chave de sincronização do
titular, derivada da chave mestra por HKDF.

O Private Swarm não usa DHT público. A descoberta usa o diretório da
autoridade ou canais fora de banda. O Private Swarm não carrega registros do
grafo oficial.
