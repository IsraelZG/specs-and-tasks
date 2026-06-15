---
title: Private Swarm
aliases:
  - Private Swarm
  - Sincronização Cross-Device
tags:
  - sdk
  - transporte
modo: canonical
---

# Private Swarm

## Definição
O **Private Swarm** é o canal de sincronização cross-device exclusivo e isolado de um mesmo usuário, separado da malha/swarm principal. Ele viabiliza que dados classificados como locais e persistentes (como rascunhos não publicados, preferências de interface de usuário, cache de prefetch e histórico local de peers) sejam replicados com segurança entre múltiplos dispositivos de um mesmo proprietário (cross-device), sem serem expostos a outros participantes da rede.

## Por quê ([[vision]])
Na filosofia [[local-first]] e no [[pragmatismo-topologico]], certos dados não são de interesse público nem devem ser replicados para terceiros, preservando privacidade e conformidade regulatória. No entanto, o usuário necessita de uma experiência de uso contínua ao transitar entre diferentes dispositivos (ex: começar um rascunho no dispositivo móvel e concluí-lo no desktop). O **Private Swarm** resolve essa necessidade de sincronização cross-device sem expor os dados a outros peers do swarm público ou corporativo, mantendo a custódia e a decifragem desses dados estritamente sob o controle do mesmo proprietário.
*Lente de Visão relacionada:* [RFC — Camada de Transporte P2P §4.7.5](../caderno-5-transport/01-p2p-transport-and-reconciliation.md#L614)

## Contrato ([[protocol]])
O canal de sincronização do Private Swarm opera sob as seguintes regras e estruturas criptográficas:

### Derivação Segura do RendezvousId
O `RendezvousId` do Private Swarm não é derivado via hash simples da Chave Mestra. Em vez disso:

```
Device_Sync_Key = HKDF-Expand(master_key, "device-sync-v1", 32 bytes)
RendezvousId    = blake2s256(Device_Sync_Key)
```

Isso protege o segredo principal contra ataques de análise de tráfego na DHT: mesmo que o `RendezvousId` seja observado, a [[chave-mestra-ed25519]] não pode ser derivada dele.

### Resolução de Conflitos
Como não há um Validador de Domínio no Private Swarm:
- **Preferências de UI:** Last-Write-Wins (LWW) baseado no [[hlc]].
- **Rascunhos de documentos:** Operam nativamente como CRDTs do [[automerge]] (utilizando o [[automerge-repo]]). Texto digitado offline no celular e no desktop é mesclado sem perda quando os dispositivos se encontram.
- **Cache de prefetch:** Merge union-based — a lista completa de chunks cacheados é unificada. Se cada dispositivo baixou chunks diferentes, ambos passam a ter os chunks do outro.

### Criptografia e Segurança
Todo o tráfego que transita pelo Private Swarm é criptografado ponta-a-ponta com a chave `Device_Sync_Key` derivada do segredo master do usuário.
*Lente de Protocolo relacionada:* [RFC — Camada de Transporte P2P §4.7.1, §4.7.3](../caderno-5-transport/01-p2p-transport-and-reconciliation.md#L579)

## Implementação ([[sdk]])
Na camada do SDK, o Private Swarm sincroniza um banco SQLite secundário e isolado (`device_state.db`), contendo exclusivamente dados classificados como "Local + Persistente (mesmo usuário)" conforme a [[matriz-de-classificacao-transporte]] (decorrente das flags de [[transport-hints]]):
- Rascunhos não publicados.
- Cache de prefetch (evitando baixar o mesmo BLOB in cada dispositivo).
- Preferências de UI (tema, layout, idioma).
- Histórico de peers já sincronizados.

### Operação e Priorização
- Utiliza o mesmo mecanismo de [[documento-casca]] do [[automerge-repo]].
- Não passa pelo [[rbsr]] do swarm principal.
- **Priorização:** Tráfego do Private Swarm possui prioridade maior que a de swarms em background, mas menor que a do swarm da aba ativa e do tráfego de replicação auditável do grafo principal.
*Lente de SDK relacionada:* [RFC — Camada de Transporte P2P §4.7.2, §4.7.4](../caderno-5-transport/01-p2p-transport-and-reconciliation.md#L590)

## Evolução ([[governance]])
A governança e evolução do Private Swarm são centradas na soberania do usuário. Políticas de retenção, expurgo local de cache de prefetch e rotação da `Device_Sync_Key` são configuradas no escopo do cliente local, sem depender de consenso de rede ou validação de terceiros. A estrutura do banco de dados `device_state.db` acompanha as atualizações de esquema do SDK da plataforma.
*Lente de Governança relacionada:* [RFC — Camada de Transporte P2P §4.7.5](../caderno-5-transport/01-p2p-transport-and-reconciliation.md#L614)

## Aparições a consolidar
As definições e implementações de suporte originais a serem consolidadas sob este verbete canônico encontram-se em:
- `docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.7` ([RFC — Camada de Transporte P2P](../caderno-5-transport/01-p2p-transport-and-reconciliation.md#L575))
- `docs/glossary.md §Private Swarm` ([[tombstone-lapide]])


