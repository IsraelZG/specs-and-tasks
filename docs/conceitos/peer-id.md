---
name: peer-id
title: "PeerId (DevicePeerId e PersonaPeerId)"
aliases: ["PeerId", "peer id", "identificador de peer", "DevicePeerId", "PersonaPeerId"]
tags: [protocol, identidade, p2p]
modo: hub
fonte-canonica: "caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.4"
---

# PeerId (DevicePeerId e PersonaPeerId)

**Modo hub** — definição normativa completa em [[caderno-2-protocol/02-cryptographic-lineage-and-auth#14-identidade-de-rede-peerid-duas-variantes]] (redefinido pela RFC-005 §A.5).

## Definição

O PeerId é o identificador de rede auto-certificável da plataforma, derivado deterministicamente de uma chave pública Ed25519 via `blake2s256`. Existe em **duas variantes** com papéis ortogonais:

- **`DevicePeerId = blake2s256(DEVICE_PUB_KEY)`** — identidade **de transporte**. Deriva da chave Ed25519 estável e exclusiva do dispositivo, gerada no provisionamento ([[delegacao-de-dispositivo]]) e nunca exportada.
- **`PersonaPeerId = blake2s256(PROFILE:PERSONA_PUB_KEY)`** — identidade **de aplicação** (endereçamento, arestas, UCANs).

## Por quê

Separar transporte de aplicação resolve a tensão personas × transporte: o dispositivo mantém **uma** conexão Noise_XX estável por par (com reputação e shadowbans acumulando por `DevicePeerId` no [[relay-trust-model]] e no [[swarm-registry]]), enquanto múltiplas personas multiplexam sobre ela em sub-streams, cada mensagem carregando o `PersonaPeerId` emissor e seu UCAN. Trocar de persona não abre conexões novas nem zera reputação.

## Contrato

- O handshake Noise_XX ([[noise-xx]]) usa a **chave do dispositivo** como chave estática e troca o `DevicePeerId` + `identity_epoch_index` ([[epoca-de-identidade]]).
- Um dispositivo fala por uma persona apenas mediante [[delegacao-de-dispositivo]] válida no grafo (`ASSET:PERMISSION` + `DELEGATED_TO`).
- Ambas as variantes são **auto-certificáveis**: desafio-resposta prova posse da chave privada antes de qualquer troca de dados (elimina spoofing; não resolve Sybil — responsabilidade do modelo de convites/web-of-trust).
- O `SwarmRegistry` indexa por `DevicePeerId` e mantém `device_personas` (personas ativas/atestadas por dispositivo, com a época de identidade da validação).

## Implementação

Ver `caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.2` (identidade criptográfica determinística) e `§3.2.2` (`SwarmRegistry`/`device_personas`).

## Evolução

A variante original única (`PeerId = blake2s256(PROFILE:PERSONA_PUB_KEY)`) foi cindida nas duas variantes pela RFC-005 §A.5; textos anteriores que mencionam "PeerId" sem qualificação devem ser lidos como `PersonaPeerId` quando o contexto é aplicação e `DevicePeerId` quando o contexto é transporte.

## Aparições a consolidar

| Arquivo | Seção | Ação |
|:---|:---|:---|
| `glossary.md` | `§PeerId` | Substituir pelo wikilink `[[peer-id]]` |
