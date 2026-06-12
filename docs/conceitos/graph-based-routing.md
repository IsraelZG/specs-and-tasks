---
title: Graph-Based Routing
slug: graph-based-routing
aliases: ["Graph-Based Routing", "graph-based-routing", "Roteamento Quente"]
tags: [sdk, p2p, transporte, network, hub]
modo: hub
---

# Graph-Based Routing

**Modo hub** — definição normativa baseada em [02-sync-worker-and-memory-lifecycle.md:L67-L68](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#L67-L68) and [caderno-5-transport/01-p2p-transport-and-reconciliation.md:L97-L98](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L97-L98). Glossário consolidado aqui.

> Aparições consolidadas:
> - [[graph-based-routing]] — definição sucinta no glossário.
> - [02-sync-worker-and-memory-lifecycle.md:L67-L68](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#L67-L68) — execução na Onda 3 de sincronização do SDK (fonte principal).
> - [caderno-5-transport/01-p2p-transport-and-reconciliation.md:L97-L98](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L97-L98) — roteamento quente e exclusão de DHT global (visão e protocolo).
> - [caderno-5-transport/01-p2p-transport-and-reconciliation.md:L478-L493](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L478-L493) — roteamento indireto de BLOBs em conformidade com o grafo.

---

## Definição

O **Graph-Based Routing** é o mecanismo de roteamento quente da camada de transporte responsável por reidratar sob demanda o payload de nós do grafo que se encontram em estado podado (apenas cabeçalhos, IDs e arestas). Quando o usuário navega no histórico ou acessa um documento antigo não-local, o sistema utiliza as relações estruturais do próprio grafo de dados e um diretório de presença efêmera (cache local e relays conhecidos) para identificar e contatar os peers custodiantes que detêm a versão integral daquele nó, solicitando a transferência do payload criptografado em tempo real sem a necessidade de uma Distributed Hash Table (DHT) global para o tráfego em estado quente.

---

## Por quê ([[vision]])

No design local-first da plataforma, dados históricos são eventualmente podados para conservar o armazenamento local nos dispositivos dos usuários. A busca de payloads de forma descentralizada enfrenta desafios de eficiência e privacidade. O uso de uma DHT tradicional é descartado para o core devido a limitações de rede no navegador (restrições a UDP/WebRTC). 

O `Graph-Based Routing` baseia-se no princípio de que a própria topologia do grafo de relações é o melhor guia para encontrar dados associados (quem detém o dado, em quais swarms ele reside e quem são as identidades envolvidas). Isso substitui a DHT no estado quente (live), permitindo que a busca do payload seja direcionada e eficiente, baseando-se em contatos e relays do próprio subgrafo ao qual o nó pertence. Isso mantém a soberania dos dados do usuário e respeita o modelo de acesso sob convites.

Consulte [caderno-5-transport/01-p2p-transport-and-reconciliation.md:L89-L91](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L89-L91) para detalhes sobre a eliminação da DHT e o [caderno-1-vision/01-vision-and-positioning.md](file:///c:/Dev2026/Docs/docs/caderno-1-vision/01-vision-and-positioning.md) para princípios de design local-first.

---

## Contrato ([[protocol]])

O comportamento normativo e as regras operacionais do `Graph-Based Routing` são detalhados nas especificações de transporte:

- **Substituição de DHT:** O roteamento quente utiliza o histórico de peers ativos e a presença efêmera no cache local (resolvendo coordenadas atuais via relays e peers conectados) em vez de recorrer a uma Mainline DHT de lookup generalizado.
- **Roteamento Quente vs. Frio:** O `Graph-Based Routing` opera estritamente no estado quente (swarms ativos, peers descobertos). Não atua no *Bootstrap Frio Absoluto*, onde as coordenadas de conexão inicial com a rede devem ser obtidas fora-de-banda (como links multiaddr ou URLs de convite).
- **Relação com o Transporte de BLOBs:** Para dados e arquivos pesados (BLOBs), o payload relacional no grafo contém a chave criptográfica e o InfoHash/Magnet Link correspondente. O roteamento identifica a fonte do nó `ASSET:FILE` através do grafo e inicia o transporte dos blocos de dados através de WebTorrent/BitTorrent isolado no Service Worker/Crypto Worker.

Consulte a especificação de discovery de peers em [caderno-5-transport/01-p2p-transport-and-reconciliation.md:L93-L108](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L93-L108) e o transporte de BLOBs em [caderno-5-transport/01-p2p-transport-and-reconciliation.md:L478-L493](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L478-L493).

---

## Implementação ([[sdk]])

Na arquitetura do SDK, a execução do roteamento baseado no grafo é gerenciada pelo Sync Worker:

- **Onda 3 de Sincronização:** O Sync Worker dispara o `Graph-Based Routing` de forma oportunista e lazy durante a Onda 3. Se um usuário acessa dados antigos classificados no SQLite local como `retention_state = 'pruned'`, o Sync Worker localiza os peers custodiantes nas tabelas de sincronismo e no `SwarmRegistry`, enviando uma requisição de reidratação em tempo real para obter o payload integral criptografado.
- **Service Worker e Zero-Copy:** Quando ativado para arquivos ou vídeos, o fluxo se integra ao Service Worker e ao Crypto Worker. Chunks decifrados via AES-256-GCM são passados para a interface usando objetos transferíveis (zero-copy) para preservar a thread principal de UI.
- **Mitigação de Recursos:** O processo respeita as quotas do `GlobalThrottle` e é pausado automaticamente sob baterias baixas ou dados móveis para evitar degradação de bateria.

Consulte a especificação de ondas de sincronização em [02-sync-worker-and-memory-lifecycle.md:L60-L73](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#L60-L73) e o transporte de BLOBs em [02-sync-worker-and-memory-lifecycle.md:L189-L200](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#L189-L200).

---

## Evolução ([[governance]])

As políticas de roteamento e custódia evoluem sob os seguintes aspectos regulados por especificações:

- **Políticas de Retenção e Replicação:** Redes sob modalidade corporativa ou pública utilizam o anel de custódia e regras de `replication-factor` governadas por `SPECIFICATION` para garantir que pelo menos $N$ peers (ou super peers dedicados) permaneçam seedando os payloads, garantindo que o roteamento baseado em grafo sempre encontre caminhos válidos e ativos para reidratação.
- **Estratégias de Custódia:** O roteamento pode priorizar relays e super peers estáveis em vez de nós móveis efêmeros, com base no histórico de reputação local (`reputacao-local`) e nos contratos de contribuição declarados nas especificações.

Consulte as especificações do anel de custódia na [caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.2](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L515-L535).

---

## Dependências por onda

A tabela abaixo rastreia os conceitos associados ao roteamento baseado no grafo. Conceitos de ondas futuras permanecem como Foam placeholders.

| slug | onda | status |
|:-----|:-----|:-------|
| [[no]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[peer-id]] | 2 | criado |
| [[ucan]] | 2 | criado |
| [[rbsr]] | 4 | criado |
| [[poda-segura]] | 4 | criado |
| [[onda]] | 4 | criado |
| [[swarm-registry]] | 5 | criado |
| [[connection-promotion-engine]] | 5 | criado |
| [[relay-trust-model]] | 5 | criado |
| [[global-network-throttle]] | 5 | Foam placeholder (Onda 5) |
| [[webtorrent-blobs]] | 6 | Foam placeholder (Onda 6) |
| [[sync-worker]] | 7 | Foam placeholder (Onda 7) |
| [[crypto-worker]] | 7 | Foam placeholder (Onda 7) |
| [[reputacao-local]] | 10 | Foam placeholder (Onda 10) |
| [[local-first]] | 12 | Foam placeholder (Onda 12) |
| [[pragmatismo-topologico]] | 12 | Foam placeholder (Onda 12) |

---

## Aparições a consolidar

Rastreamento de arquivos e locais a consolidar nas etapas subsequentes.

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `docs/glossary.md` | `§Graph-Based Routing` | Substituir por resumo curto e link `[[graph-based-routing]]` |
| `docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md` | `§3 Onda 3` | Inserir referência wikilink `[[graph-based-routing]]` |
| `docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md` | `§2.4.1` | Inserir referência wikilink `[[graph-based-routing]]` |
| `docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md` | `§3.4` | Inserir referência wikilink `[[graph-based-routing]]` |


