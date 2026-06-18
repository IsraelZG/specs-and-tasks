---
title: LiveKit
slug: livekit
aliases:
  - livekit
  - LiveKit
  - LiveKit Integration
  - CONTENT:LIVE_SESSION
tags:
  - sdk
  - media
  - tempo-real
  - stream
  - canonical
  - onda-11
modo: canonical
fonte-canonica: docs/caderno-3-sdk/05-media-transport-plane.md §8.1
aparicoes-consolidadas:
  - docs/caderno-3-sdk/05-media-transport-plane.md §8.1
dependencias:
  - [[matriz-de-classificacao-transporte]]
  - [[ephemeral-messages]]
  - [[consolidacao-de-live]]
  - [[serves-aresta]]
  - [[content-file]]
---

# LiveKit

## Definição

**LiveKit** é o ecossistema integrado para a transmissão e orquestração de streams de mídia em tempo real (áudio e vídeo síncronos) na plataforma. Ele fornece comunicações de baixa latência usando WebRTC em topologias ponto a ponto (P2P 1-para-1) ou via fanout por relays distribuídos (1-para-muitos). Uma transmissão em tempo real via LiveKit é representada no grafo pelo nó efêmero de metadados `CONTENT:LIVE_SESSION` vinculado ao broadcaster por uma aresta não-durável `STREAMS` e categorizada como `REPLICABLE_VOLATILE`, garantindo que os streams efêmeros de mídia não sobrecarreguem o grafo durável e não persistam no histórico após o término da sessão.

## Por quê → [[caderno-1-vision]]

A plataforma prioriza a descentralização e a comunicação de baixa latência diretamente entre peers. Ao mesmo tempo, segue a filosofia de minimalismo no armazenamento do grafo distribuído.

A integração com o LiveKit atende a esses princípios ao:
- **Separar Planos de Mídia e Estado**: Mantém o tráfego pesado e em tempo real de áudio/vídeo fora do ciclo de reconciliação e anti-entropia do grafo. O LiveKit gerencia a orquestração do stream em tempo real de maneira efêmera, enquanto o grafo armazena apenas metadados mínimos de presença da live.
- **Escalabilidade Distribuída**: Utiliza conexões WebRTC P2P diretas quando possível e servidores relay distribuídos na rede para suportar fanout com alta eficiência, reduzindo o custo de largura de banda e latência.

## Contrato → [[caderno-2-protocol]]

No nível do protocolo de sincronização e ontologia do grafo:
1. **Dados Voláteis**: O stream de mídia em tempo real do LiveKit é enquadrado estritamente como `REPLICABLE_VOLATILE` na [[matriz-de-classificacao-transporte]]. Ele não é auditável historicamente, não sobrevive além da sessão e não é reconciliado pelo protocolo anti-entropia RBSR.
2. **Sinalização do Grafo**: A presença ativa de uma transmissão é sinalizada pelo nó efêmero `CONTENT:LIVE_SESSION` (contendo dados como identidade do broadcaster, instante de início e ponteiros de conexão do relay). Este nó é ligado ao emissor através de uma aresta temporária `STREAMS`.
3. **Criptografia na Camada de Transporte**: A criptografia de áudio/vídeo é negociada na sessão de transporte via DTLS/SRTP (WebRTC padrão), de forma independente e ortogonal ao envelopamento de chaves estáticas do Key Vault usado no plano de BLOBs duráveis.

## Implementação → [[caderno-3-sdk]]

O comportamento técnico detalhado de transporte em tempo real está descrito em [`caderno-3-sdk/05-media-transport-plane.md §8.1`](../caderno-3-sdk/05-media-transport-plane.md).

### Regras de Transporte (Original Literal)

- Áudio/vídeo síncronos via **LiveKit**; `REPLICABLE_VOLATILE` (caderno‑3/02): não sobrevive ao ciclo de reconciliação.
- WebRTC P2P (1‑para‑1) ou fanout via relay (1‑para‑muitos / lives). Referência ao stream = `CONTENT:LIVE_SESSION` (metadata: quem está live, desde quando), ligada ao broadcaster por aresta `STREAMS` (não‑durável).
- Fanout em P2P puro sem relay permanece problema aberto (pesquisa); mitigado por super‑peer observador que replica o stream (hierarquia temporária aceitável).

## Evolução → [[caderno-4-governance]]

A alocação de recursos e servidores relay do LiveKit é governada com base nas capacidades declaradas e verificadas dos peers (Tiers). 

- **Disponibilidade**: Servidores de sistema (`peer-do-sistema` <!-- Foam placeholder — Onda 12 (futura) -->) ou peers corporativos são incentivados a atuar como relays na modalidade correspondente da rede.
- **Gravação e Persistência**: A transição do estado efêmero e volátil do LiveKit para um arquivo de mídia permanente e persistente no grafo ocorre ao final da transmissão por meio do mecanismo de [[consolidacao-de-live]], que empacota os segmentos voláteis em um nó de arquivo `CONTENT:FILE` durável (`REPLICABLE_AUDITABLE`).

---

## Aparições a consolidar

- `docs/caderno-3-sdk/05-media-transport-plane.md §8.1` — seção sobre streaming de tempo real consolidada neste verbete.
- `docs/backlog-geral.md` §6.2 (linha 173) — especificação sobre integração LiveKit, metadados `CONTENT:LIVE_SESSION` e classificação `REPLICABLE_VOLATILE`.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[matriz-de-classificacao-transporte]] | 5 | criado |
| [[ephemeral-messages]] | 6 | criado |
| [[consolidacao-de-live]] | 11 | criado |
| [[serves-aresta]] | 11 | criado |
| [[content-file]] | 11 | criado |
| [[peer-do-sistema]] | 12 | <!-- Foam placeholder — Onda 12 (futura) --> |


