---
name: chave-mestra-ed25519
title: "Chave Mestra Ed25519"
aliases: ["master key", "chave raiz Ed25519", "ed25519 master key"]
tags: [protocol, criptografia, identidade]
---

# Chave Mestra Ed25519

## Definição

A Chave Mestra Ed25519 é o par de chaves assimétrico gerado no momento da criação do [[profile-authentication]] de um usuário. A chave pública é usada para derivar o [[peer-id]] (via `blake2s256(pub_key)`) e para verificar as assinaturas de todos os nós e arestas emitidos por esse peer. A chave privada é armazenada de forma inviolável no Secure Enclave ou Keychain do dispositivo local — gerida pelo [[key-vault]] — e **nunca sai desse perímetro**: nunca é transmitida em rede, nunca consta em payload de UCAN e nunca é exposta a outros peers.

## Por quê

O sistema é local-first e P2P sem autoridade central: cada peer precisa de uma âncora criptográfica não-falsificável para assinar suas emissões e provar sua identidade no handshake Noise_XX. O par Ed25519 cumpre esse papel com custo computacional baixo (verificação de assinatura em ~50 µs), chaves compactas (32 bytes pub / 64 bytes sig) e resistência a ataques de canal lateral por design.

## Contrato

O texto autoritativo da camada de chaves está em [[caderno-2-protocol/02-cryptographic-lineage-and-auth#31-as-camadas-de-chaves]].

Propriedades-chave (extraídas literalmente da fonte):

- **Armazenamento:** "Armazenada de forma inviolável no Secure Enclave ou Keychain do dispositivo local."
- **Uso de assinatura:** "Usada para assinar nós/arestas emitidos e assinar tokens UCAN locais."
- **PeerId:** `PeerId = blake2s256(PROFILE:PERSONA_PUB_KEY)` — auto-certificável: o handshake exige desafio-resposta provando posse da chave privada antes de qualquer troca de dados.
- **Separação de papéis:** a Chave Mestra assina; a [[chave-de-epoca]] (AES-256-GCM, custodiada no [[key-vault]]) cifra payloads. As duas camadas são distintas e nunca se substituem.

## Implementação

O [[key-vault]] — implementado como subsistema interno do Crypto Worker — é responsável pela custódia em runtime. Ver [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#12-crypto-worker]] para detalhes do worker e do TTL de 4 horas das chaves de época em RAM.

## Evolução

Ed25519 é estável; não há planos de migração para outro algoritmo de assinatura. Uma substituição futura exigiria RFC de identidade com estratégia de migração de `pub_key` em nós históricos.

## Aparições a consolidar

Nenhuma (conceito sem redefinições espalhadas — `★` ausente no inventário).


