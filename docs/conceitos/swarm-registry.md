---
title: Swarm Registry
slug: swarm-registry
aliases: ["SwarmRegistry", "swarm-registry", "Swarm Registry"]
tags: [sdk, transporte, network]
modo: canonical
---

# Swarm Registry

**Modo canonical** — fonte normativa: `caderno-5-transport/01-p2p-transport-and-reconciliation.md §3.2.2`. Glossário (`glossary.md §SwarmRegistry`) consolidado aqui.

> Aparições consolidadas:
> - `glossary.md §SwarmRegistry` — definição curta (canonical aqui).
> - `caderno-5-transport/01-p2p-transport-and-reconciliation.md §3.2.2` — heartbeat, health check e timers (fonte normativa principal).
> - `caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.5.2` / `glossary.md §RelayTrustModel` — score local e shadowban de relays.
> - `caderno-5-transport/01-p2p-transport-and-reconciliation.md §3.2.3` — monitoramento de líder e failover de RBSR.

---

## Definição

O **Swarm Registry** (geralmente referido como `SwarmRegistry`) é o mapa em RAM mantido pelo [[sync-worker]] contendo o estado atualizado dos peers ativos do swarm e seus metadados de conectividade (latência, capacidades, score de relay e estado de promoção de conexão). Ele atua como a única fonte de verdade em tempo de execução para decisões de roteamento, shadowban de relays e eleição oportunística de líderes de sincronização.

---

## Por quê ([[vision]])

A plataforma adota o paradigma [[local-first]] e opera em redes distribuídas oportunísticas. O Swarm Registry permite aos peers manterem uma visão precisa e atualizada da vivacidade e qualidade da vizinhança na malha local, sem depender de um servidor central de status ou de uma DHT lenta e ineficiente para descoberta quente. Ele otimiza a alocação de recursos de rede locais ao delegar responsabilidades apenas a peers com tiers de capacidade e conectividade compatíveis, degradando as garantias de transporte de forma transparente quando as condições físicas mudam.

Para detalhes de produto e o papel do transporte como recurso gerido, consulte o [caderno-1-vision/01-vision-and-positioning.md](file:///c:/Dev2026/Docs/docs/caderno-1-vision/01-vision-and-positioning.md#L11-L28).

---

## Contrato ([[protocol]])

O comportamento e as regras de controle do `SwarmRegistry` são regidos pela especificação de protocolo descrita em [caderno-5-transport/01-p2p-transport-and-reconciliation.md](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L355-L371). Como este verbete em modo `canonical` é o lugar canônico de sua definição no wiki, o contrato normativo do protocolo de heartbeat e a máquina de estados associada estão descritos abaixo.

### Heartbeat e Health Check (RFC §3.2.2)

O SwarmRegistry mantém a vivacidade dos peers através de um protocolo de heartbeat implícito com fallback explícito:

* **Heartbeat implícito:** Qualquer tráfego recebido no canal de dados (frames do [[rbsr]], Automerge ephemeral messages, ou WebTorrent) zera o timer de inatividade do peer remetente no SwarmRegistry. Não há necessidade de mensagens de keep-alive adicionais enquanto o canal estiver ativo.
* **Heartbeat explícito (PING/PONG):** Se o canal permanecer ocioso por 15 segundos sem tráfego detectado, um PING de 8 bytes é disparado. O peer destino responde com um PONG de 8 bytes + timestamp local.
* **Evicção:** Três falhas consecutivas (45s sem resposta) marcam o peer como inativo:
  * Removido da lista de candidatos do SyncCoordinator
  * Removido como relay elegível no [[relay-trust-model]]
  * Evitado para novas conexões por 5 minutos (cool-off)
  * Se era o líder eleito do sync, re-eleição imediata.
* **Degradação em economia de energia:** Em dispositivos mobile com bateria < 15%, o heartbeat explícito é desativado. O sistema confia exclusivamente nos timeouts de aplicação (inatividade do [[rbsr]]) para limpeza de conexões fantasma.

### Conexão e Handshake (Noise_XX) (RFC §2.2.1)

Concluído o handshake [[noise-xx]] com épocas alinhadas, o [[peer-id]] é registrado como **"conectado"** no SwarmRegistry. Falhas criptográficas (assinatura inválida, chave incorreta) resultam em shadowban de 24h no [[relay-trust-model]] local.

---

## Implementação ([[sdk]])

A execução lógica reside no [[sync-worker]] rodando fora da Main Thread, comunicando-se via Comlink com a UI. O SwarmRegistry fornece dados vitais para os seguintes componentes e fluxos locais:

* **[[first-peer-protocol]] (Gênese da Rede):** Máquina de estados executada em cold starts, gerenciando as fases `JOINING` $\to$ `WAITING_FOR_SWARM` (timer de 8s) $\to$ `CONNECTED` | `GENESIS` (detentor da chave de fundação) | `OFFLINE_RETRY`.
* **[[global-network-throttle]] (Alocação de Banda):** Alocação de banda e recursos de soquetes locais com base na visibilidade dos swarms (70% para aba ativa, 20% para aba visível, 10% para background; mobile com bateria < 30% causa pausa de background).
* **[[connection-promotion-engine]] (Promoção de Conexões):** Tentativas em segundo plano para perfurar NAT (STUN) e migrar túneis de relays WebRTC para conexões P2P diretas.

Para a arquitetura detalhada e orquestração de workers no cliente, consulte o [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md) e a [caderno-5-transport/01-p2p-transport-and-reconciliation.md §3.2.2](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L355-L371).

---

## Evolução ([[governance]])

O SwarmRegistry atua como o validador em tempo de execução da integridade da malha e dos compromissos assumidos pelos peers na rede. Tiers de capacidade e compromisso (banda, armazenamento, uptime) declarados e observados orientam a eleição de líderes e a distribuição de custódia na modalidade de rede adotada (Corporativa, Pública ou P2P Pura). Mudanças nas quotas globais, tempos de cool-off e limites de inatividade são definidos no nível de especificação de rede (`SPECIFICATION:NETWORK_GOVERNANCE`).

A governança de rede e o ciclo de vida do bootstrap da rede estão descritos no [caderno-4-governance/03-specification-lifecycle-and-rfcs.md](file:///c:/Dev2026/Docs/docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md) e na [caderno-5-transport/01-p2p-transport-and-reconciliation.md §3.2.4](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L386-L438).

---

## Dependências por onda

A tabela abaixo lista os conceitos associados ao Swarm Registry. Dependências de ondas futuras são marcadas e mantidas como Foam placeholders.

| slug | onda | status |
|:-----|:-----|:-------|
| [[peer-id]] | 2 | criado |
| [[noise-xx]] | 2 | criado |
| [[rbsr]] | 4 | criado |
| [[anti-entropy]] | 4 | criado |
| [[connection-promotion-engine]] | 5 | Foam placeholder (Onda 5) |
| [[relay-trust-model]] | 5 | Foam placeholder (Onda 5) |
| [[first-peer-protocol]] | 5 | Foam placeholder (Onda 5) |
| [[global-network-throttle]] | 5 | Foam placeholder (Onda 5) |
| [[private-swarm]] | 5 | Foam placeholder (Onda 5) |
| [[automerge-repo]] | 6 | Foam placeholder (Onda 6) |
| [[sync-worker]] | 7 | Foam placeholder (Onda 7) |


