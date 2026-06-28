---
title: Aresta SERVES
slug: serves-aresta
aliases:
  - SERVES
  - serves-aresta
  - serves
  - aresta serves
tags:
  - protocol
  - media
  - arestas
  - canonical
  - onda-11
modo: canonical
fonte-canonica: docs/caderno-3-sdk/05-media-transport-plane.md §4.2
aparicoes-consolidadas:
  - docs/glossary.md §SERVES
  - docs/caderno-3-sdk/05-media-transport-plane.md §4.2
  - docs/rfc-v4.md §3.3
dependencias:
  - [[aresta]]
  - [[profile]]
  - [[content]]
  - [[substantivo-verbo-principio]]
  - [[verbos-raiz-canonicos]]
  - [[tombstone-lapide]]
  - [[rbsr]]
  - [[swarm-registry]]
  - [[graph-based-routing]]
  - [[rendition]]
  - [[webseed-bep19]]
  - [[agente-de-sistema]]
  - [[contribuicao-verificavel]]
  - [[standing]]
---

# Aresta SERVES

## Definição

A aresta **SERVES** (ou `serves-aresta`) é uma primitiva de relação de infraestrutura no grafo de dados que declara que um provedor de infraestrutura (ou operador de fonte) hospeda fisicamente um determinado ciphertext de mídia.

Conforme a definição em `caderno-3-sdk/05-media-transport-plane.md §4.2`:

> `PROFILE (operador da fonte) —SERVES→ CONTENT:rendition`, com a URL/CID/magnet como **atributo da aresta**. Adicionar fonte = nova aresta (append‑only); remover = lápide (`weight = 0`).

Definição complementar em `glossary.md`:

> **SERVES** — Aresta `PROFILE → CONTENT` que declara que uma fonte (peer/cloud/IPFS) hospeda um ciphertext; durável no grafo (fontes estáveis) ou no cache efêmero (seeders‑peer). Ver caderno‑3/05 §4.2.

---

## Por quê → [[caderno-1-vision]]

O design de arquitetura de dados descentralizada da plataforma estabelece que o grafo de dados nunca armazena o binário físico (BLOB) ou o stream de mídia em si — apenas metadados de controle, hashes de integridade e direitos de acesso. A reconciliação do grafo via [[rbsr]] é mantida leve e desacoplada do plano de transporte físico de mídia.

Para resolver a descoberta de fontes de forma descentralizada e eficiente sem redefinir o grafo de metadados, a plataforma modela a relação entre o operador físico e a [[rendition]] do arquivo usando a aresta `SERVES`. Esse design respeita o [[minimalismo-ontologico]], evitando o antipadrão de nós mutáveis de fontes (como `CONTENT:SOURCE`), e canaliza a redundância física do conteúdo diretamente como arestas associadas ao nó do arquivo correspondente.

---

## Contrato → [[caderno-2-protocol]]

A aresta `SERVES` opera sob as seguintes regras e estruturas normativas no grafo de dados:

- **Direção:** Conecta um nó do tipo [[profile]] (operador da fonte de mídia) a um nó [[content]] (tipicamente um subtipo [[rendition]]).
- **Atributos (Payload):** O payload da aresta carrega as coordenadas físicas e ponteiros de rede para a recuperação do dado criptografado (como magnet links, InfoHash do torrent, hashes CID do IPFS ou URLs de buckets HTTP).
- **Cardinalidade:** `N ↔ N` (uma fonte/profile pode servir muitas renditions; uma rendition pode ser servida por múltiplos profiles).
- **Mutabilidade / Deleção:** Respeita o paradigma append-only do grafo. Novas fontes adicionadas geram novos registros de aresta. Para revogar ou desativar uma fonte de dados física, aplica-se uma lápide na aresta ([[tombstone-lapide]]), alterando seu peso ou estado de atividade para inativo (`weight = 0`).

---

## Implementação → [[caderno-3-sdk]]

O SDK otimiza a sincronização e armazenamento da aresta `SERVES` separando as fontes físicas entre a persistência em disco do grafo global e a memória efêmera local:

- **Split Durável / Efêmero:**
  - **Fontes Duráveis (no grafo):** Fontes estáveis de alta disponibilidade (como servidores em nuvem operando como WebSeeds HTTP [[webseed-bep19]], pins fixos de IPFS, ou super-peers corporativos de backup) são persistidas como arestas `SERVES` normais no banco local e distribuídas a todos os peers participantes via [[rbsr]].
  - **Seeders-Peer Efêmeros (fora do grafo):** Dispositivos clientes de usuários (desktops, celulares) que servem chunks do arquivo temporariamente e podem dormir a qualquer momento **nunca** gravam arestas `SERVES` no grafo persistente. Suas coordenadas físicas de conexão são distribuídas por sinalização WebRTC (trackers WSS e PEX) e cacheadas apenas localmente na memória RAM do [[swarm-registry]] via [[graph-based-routing]], poupando largura de banda de sincronização.
- **Reidratação de Mídia:** Durante o streaming sequencial, o cliente processa as arestas `SERVES` do grafo para identificar os endpoints disponíveis, priorizando adapters (P2P Swarm vs. WebSeed HTTP vs. IPFS) conforme as diretrizes declaradas na política de entrega da rede.

---

## Evolução → [[caderno-4-governance]]

A partir da versão 4 (`rfc-v4.md`), a aresta `SERVES` passa a exercer papel duplo, integrando o comportamento do plano de mídia à camada de incentivos econômicos da rede:

- **Agregação em Épocas:** Para conter o crescimento acelerado de dados do grafo global, as arestas de tráfego físico (`CONSUMES`, `SERVES` e `CONTRIBUTES`) são consolidadas em termos de granularidade de **sessão ou época criptográfica**. Detalhes de transferências e recibos de chunks individuais permanecem efêmeros e puramente locais.
- **Banda como Contribuição Verificável:** O fornecimento de bytes (serving de banda) por um [[agente-de-sistema]] operando sob a aresta `SERVES` gera recibos assinados pelo peer destinatário. Essas provas constituem o regime de banda da [[contribuicao-verificavel]], influenciando positivamente a reputação local e o saldo acumulado de [[standing]] do operador na rede de acordo com a política de liquidação configurada na SPEC da economia modular.

---

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[aresta]] | 1 | criado |
| [[profile]] | 1 | criado |
| [[content]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[verbos-raiz-canonicos]] | 1.5 | criado |
| [[tombstone-lapide]] | 7 | criado |
| [[rbsr]] | 4 | criado |
| [[swarm-registry]] | 5 | criado |
| [[graph-based-routing]] | 5 | criado |
| [[rendition]] | 11 | criado |
| [[webseed-bep19]] | 11 | criado |
| [[agente-de-sistema]] | 10 | criado |
| [[contribuicao-verificavel]] | 10 | criado |
| [[standing]] | 10 | criado |


