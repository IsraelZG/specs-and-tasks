---
title: "Poda Segura"
slug: poda-segura
aliases: ["protocolo de poda segura", "poda segura"]
tags: [protocol, sincronizacao, reconciliacao, hub]
modo: hub
---

# Poda Segura

**Modo hub** — definição normativa completa em `caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.3`.

---

## Definição

Poda Segura é um protocolo descentralizado de três camadas projetado para gerenciar a transição do estado de retenção de dados de um dispositivo de `integral` para `pruned` (podado). Seu objetivo é eliminar condições de corrida em que múltiplos custódios redundantes descartam dados simultaneamente, o que causaria a perda irreversível de informações na rede [[local-first]].

---

## Por quê

No ecossistema da plataforma, os peers dedicam recursos de armazenamento e banda para manter a redundância dos dados. Para evitar o crescimento ilimitado do uso de disco, dados históricos ou BLOBs pesados que já foram sincronizados por outros nós podem ser podados localmente.

Entretanto, se todos os $N$ custódios de um subgrafo (onde $N$ é o [[replication-factor]]) realizarem a poda de forma concorrente, o dado desaparece da rede. O protocolo de Poda Segura garante que a transição de retenção ocorra sem quebrar o fator de replicação mínimo exigido pela topologia do grafo.

---

## Contrato

O protocolo é executado na camada de transporte e opera em três barreiras de proteção sequenciais:

1. **Jitter aleatório com reverificação:** Ao atingir o limite de armazenamento ou o tempo limite do ciclo de auditoria, o peer agenda a poda com um atraso aleatório:
   $$\text{delay} = \text{random}(30, 300)\text{ segundos}$$
   Ao despertar do timer, ele **reverifica** na tabela de hash se $\ge N$ peers ainda possuem o dado íntegro antes de tomar qualquer ação física.
2. **Custódia designada (RELEASE/ACK):** O custódio primário determinado pelo [[consistent-hashing]] nunca descarta um registro sem antes assegurar que o próximo peer ativo assumiu a custódia:
   - O peer $A$ envia uma mensagem `RELEASE(chunkId)` para o peer $B$ (próximo no anel de hash);
   - O peer $B$ registra os dados, assume a responsabilidade de custódia primária e responde com um `ACK(chunkId)`;
   - Somente após receber o `ACK`, o peer $A$ efetiva a poda local. Se $B$ falhar ou estiver offline, $A$ retenta o handshake com o próximo peer do anel ($C$).
3. **Health-check pré-poda:** Imediatamente antes de apagar o payload físico, o peer executa um `PING` de vivacidade para os outros $N-1$ custódios. A poda só é autorizada se pelo menos $N-1$ peers responderem positivamente confirmando que possuem o dado.

---

## Implementação

- A especificação física do estado de retenção (`retention-state`) está definida em `caderno-3-sdk/01-sqlite-and-projections-schema.md §1` (valores `integral`, `pruned` ou `expunged`).
- O [[sync-worker]] gerencia as transições de estado na B-Tree e envia as mensagens `RELEASE` e `ACK` através dos canais do Automerge Repo.
- A exclusão ou redução física dos payloads é acionada pelo garbage collector local ([[g4-garbage-collection]]), que depende da validação prévia de todas as camadas do protocolo de Poda Segura.

---

## Evolução

- **Em redes corporativas:** A topologia conta com um Super Peer always-on que detém 100% da integridade do grafo. O Super Peer emite um Manifesto de Retenção que autoriza podas mais agressivas e simplificadas nos nós mais leves da rede.
- **Em redes P2P puras:** A governança de redundância é distribuída e depende exclusivamente das regras dinâmicas do anel de custódia, e falhas sistemáticas na retenção degradam a reputação dos peers no [[peer-reputation-table]] <!-- Foam placeholder — Onda 7 -->.

---

## Dependências

| conceito | onda | status |
|:---|:---|:---|
| [[replication-factor]] | 4 | criado |
| [[consistent-hashing]] | 4 | criado |
| [[sync-worker]] | 7 | placeholder |
| [[g4-garbage-collection]] | 7 | placeholder |
| [[peer]] | 12 | placeholder |
| [[local-first]] | 12 | placeholder |

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md` | `§4.3` | Fonte canônica — acrescentar link `[[poda-segura]]` no título |
| `docs/glossary.md` | `§Poda Segura` | Substituir definição redundante por link `[[poda-segura]]` |


