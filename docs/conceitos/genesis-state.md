---
title: "Genesis State"
slug: genesis-state
aliases: ["GENESIS", "estado gênese", "gênese da rede"]
tags: [sdk, topology, bootstrap, SwarmRegistry, first-peer-protocol]
modo: canonical
fonte-canonica: docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §6
aparicoes-consolidadas:
  - glossary.md §GENESIS
dependencias:
  - [[first-peer-protocol]]
  - [[swarm-registry]]
  - [[specification-network-birth]]
  - [[profile]]
  - [[specification]]
  - [[sync-worker]]
  - [[peer-do-sistema]]
---

# Genesis State

## Definição

O **Genesis State** (ou estado `GENESIS`) é o estado transitório atingido na máquina de estados do [[first-peer-protocol]] quando o timer de busca ativa por peers expira e o peer local é portador do *bootstrap token* (chave de fundação) ou o usuário opta explicitamente por criar uma nova rede. Nesse estado de fundação, o peer cria as estruturas iniciais e imutáveis do grafo do workspace e anuncia-se como seed ativo para aceitar novos participantes.

## Por quê

Em arquiteturas [[local-first|local-first]] e descentralizadas, a criação de uma nova rede de colaboração não pode depender de um servidor de coordenação central. O **Genesis State** viabiliza o bootstrap frio absoluto da rede, permitindo que o primeiro nó estabeleça o grafo localmente de forma soberana. A restrição desse estado a portadores do *bootstrap token* impede a criação acidental ou maliciosa de redes paralelas (splits) concorrentes sob o mesmo tópico.

## Contrato

O comportamento normativo do estado `GENESIS` conforme especificado em [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#6-gênese-da-rede--first-peer-protocol]] é definido da seguinte forma:

Ocorre **apenas** se o timer de busca expirou sem peers conectados **e** o peer local detém o **bootstrap token** (chave de fundação gerada na criação do workspace) ou o usuário manifestou a intenção de "Criar Nova Rede". Neste estado, o peer realiza as seguintes ações de forma atômica:

1. **Criação dos registros de bootstrap**:
   - Nó de [[profile|PROFILE]] do administrador (admin).
   - Nó de [[specification|SPECIFICATION]] que rege o workspace.
   - Nó imutável do tipo `SPECIFICATION:NETWORK_BIRTH` (ver [[specification-network-birth]]), registrando o timestamp físico e lógico de fundação da rede.
2. **Anúncio de Seed**: Anuncia-se na DHT como seed do tópico do workspace.
3. **Status de Sistema**: Marca-se como `PROVISIONAL_SYSTEM_PEER` no [[swarm-registry]] local.
4. **Aceitação de Conexões**: Inicia a escuta ativa de novas conexões entrantes.

**Transição GENESIS → CONNECTED**: Assim que um segundo peer se conecta com sucesso, o nó local perde o status provisório de `PROVISIONAL_SYSTEM_PEER` e passa a operar como um peer normal. O nó `SPECIFICATION:NETWORK_BIRTH` permanece gravado e imutável no grafo como prova histórica de fundação.

## Implementação

O `Genesis State` é orquestrado localmente no [[sync-worker]] dentro do fluxo do [[first-peer-protocol]] (ver [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#6-gênese-da-rede--first-peer-protocol]]):

- **Timer de Espera**: O protocolo inicia a busca em paralelo via mDNS (LAN), DHT (WAN) e conexões de fallback via WebSocket. O temporizador de 8 segundos em `WAITING_FOR_SWARM` aguarda retornos.
- **Resolução sem Peers**: Se a busca falhar ao fim do timer, o Sync Worker verifica a posse do token ou a intenção do usuário:
  - Se positivo, transita para o estado `GENESIS` e executa as transações de fundação do banco de dados SQLite local persistido via OPFS.
  - Se negativo (ex.: um usuário convidado com rede lenta), transita para `OFFLINE_RETRY`, suspendendo a busca ativa e agendando tentativas com recuo exponencial.

## Evolução

A capacidade de inicializar o `Genesis State` e a posse do *bootstrap token* são reguladas pelas chaves e papéis administrativos estabelecidos na governança do workspace. A evolução das especificações da rede e a inclusão de novos validadores e nós de fundação seguem as regras de ciclo de vida definidos em [[governance]].

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§GENESIS` | Substituir pelo wikilink `[[genesis-state]]` |
| `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md` | `§6` | Consolidar com wikilink `[[genesis-state]]` |

---

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[first-peer-protocol]] | 5 | pendente (mesma onda) |
| [[swarm-registry]] | 5 | criado (mesma onda) |
| [[specification-network-birth]] | 5 | pendente (mesma onda) |
| [[profile]] | 1 | criado |
| [[specification]] | 1 | criado |
| [[sync-worker]] | 7 | placeholder (onda futura) |
| [[peer-do-sistema]] | 12 | placeholder (onda futura) |


