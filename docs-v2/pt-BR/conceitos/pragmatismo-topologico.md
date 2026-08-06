---
id: pragmatismo-topologico
tipo: conceito
status: substituido
fontes:
  - docs-v2/adr/ADR-001-autoridade-logica.md
  - docs-v2/arquitetura/topologia-e-autoridade.md
substitui:
  - docs/conceitos/pragmatismo-topologico.md
---

# pragmatismo-topologico (substituído)

A ideia "P2P-first, não P2P-purista" evoluiu para um modelo mais estrito:
toda rede tem autoridade lógica, e conexões P2P diretas são uma otimização
sob autorização da autoridade.

A motivação original permanece: usar cada topologia pelo que ela oferece de
melhor, sem dogma. A diferença é que o modelo de confiança agora é fixo.
Peers entregam bytes. Somente a autoridade confirma o grafo.

Definição corrente: `docs-v2/arquitetura/topologia-e-autoridade.md` seção 3.
