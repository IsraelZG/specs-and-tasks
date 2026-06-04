---
name: noise-xx
title: "Noise_XX (Noise Protocol Framework)"
aliases: ["Noise Protocol Framework", "Noise_XX", "handshake Noise", "autenticação mútua de peer"]
tags: [protocol, identidade, p2p, criptografia, acesso]
---

# Noise_XX (Noise Protocol Framework)

**Modo hub** — definição normativa completa em
`rfc-transporte-p2p-v3.1.md §2.2.1` e `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.4.1`.

---

## O que é

Noise_XX é o padrão de **handshake de autenticação mútua** entre peers adotado
pela plataforma. É executado imediatamente após o estabelecimento do WebRTC Data
Channel (SDP exchange concluído), usando o data channel como transporte
subjacente.

O padrão pertence ao **Noise Protocol Framework** e é o mesmo usado no
ecossistema libp2p para autenticação mútua entre nós.

## Fluxo resumido (3 round-trips)

O handshake troca os seguintes elementos em 3 round-trips:

- `PeerId = blake2s256(PROFILE:PERSONA_PUB_KEY)` — ver [[peer-id]]
- `current_epoch_index` — índice da [[chave-de-epoca|época criptográfica]] vigente
- Nonce assinado com a chave privada Ed25519

> Especificação completa (sequência exata de mensagens, campos e validações):
> `rfc-transporte-p2p-v3.1.md §2.2.1` e
> `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.4.1`.

## Comportamento em caso de divergência de época

Se o `current_epoch_index` divergir entre os peers durante o Noise_XX, a
conexão **não é descartada** — o data channel é imediatamente desviado para o
pipeline de **Catch-up de Identidades (Onda 0)**, forçando a sincronização de
chaves e UCANs atualizados antes de qualquer tráfego de domínio.

Ver [[ucan]] para o modelo de autorização que depende das chaves sincronizadas.

## Efeitos pós-handshake

| Resultado | Consequência |
|:---|:---|
| Épocas alinhadas, assinaturas válidas | Peer registrado como "conectado" no [[swarm-registry]] <!-- Foam placeholder — verbete Onda 5 --> |
| Falha criptográfica (assinatura inválida ou chave incorreta) | Shadowban de 24 h no [[relay-trust-model]] <!-- Foam placeholder — verbete Onda 5 --> do peer local |
| Divergência de `current_epoch_index` | Desvio para Catch-up de Identidades (Onda 0); ver [[stale-epoch]] <!-- Foam placeholder — verbete futuro --> |

## Implementações de referência

- Browser/WASM: `@noise-crypto/noise`
- Electron/Node: `noise-c.wasm`

## Conceitos relacionados

- [[peer-id]] — identificador trocado no handshake; derivado de `blake2s256(PUB_KEY)`
- [[chave-de-epoca]] — índice de época validado durante o handshake
- [[ucan]] — autorização que pressupõe épocas alinhadas após o Noise_XX
- [[swarm-registry]] <!-- Foam placeholder — verbete Onda 5 --> — registro de peers conectados
- [[relay-trust-model]] <!-- Foam placeholder — verbete Onda 5 --> — política de shadowban pós-falha
- [[stale-epoch]] <!-- Foam placeholder — verbete futuro --> — condição de época divergente
