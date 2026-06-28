---
name: epoca-de-identidade
title: "Época de Identidade (Identity Epoch)"
aliases: ["identity epoch", "época de identidade", "identity_epoch_index"]
tags: [protocol, identidade, handshake]
---

# Época de Identidade (Identity Epoch)

## Definição

A Época de Identidade (`identity_epoch_index`) é o escalar que versiona o estado de atestação de uma identidade no sistema, abrangendo a cadeia de UCANs raiz, delegações de dispositivo e material de chaves de identidade. Ela funciona como o único índice de época trafegado no handshake [[noise-xx]] e nos envelopes do wire protocol.

## Por quê

Para evitar ambiguidade na camada de transporte (handshake e wire protocol) entre o ciclo de vida das atestações de identidade e o ciclo de vida das chaves de conteúdo de subgrafos. A divergência de época de identidade não derruba a conexão, mas desvia o fluxo para o Catch-up de Identidades (Onda 0).

## Contrato

O texto normativo de [[caderno-2-protocol/02-cryptographic-lineage-and-auth#31-as-camadas-de-chaves]] (conforme emenda de §A.1 da RFC-005) define:

> Duas camadas de época, ortogonais e com ciclos de vida independentes:
> 
> 1. **Época de Identidade (`identity_epoch_index`, escalar por identidade/dispositivo).** Versiona o estado de atestação da identidade: cadeia de UCANs raiz, delegações de dispositivo (§A.5) e material de chaves de identidade. É o **único** índice no handshake Noise_XX e nos envelopes do wire protocol. Divergência não derruba a conexão — desvia para o Catch-up de Identidades (Onda 0). **Eventos que incrementam (lista fechada):** rotação/substituição da chave mestra ou de persona; revogação de UCAN raiz; emissão ou revogação de delegação de dispositivo (§A.5); mudança em modelo de recuperação que altere material público verificável.
> 2. **Épocas de Conteúdo (escopadas por permissão).** Chaves AES-256-GCM de payload pertencem aos subgrafos; cada `ASSET:PERMISSION`/grupo tem sua linhagem de épocas (§3.3). **Nunca** transitam nem são avaliadas no handshake; são obtidas sob demanda do Key Vault pelo fluxo capability-based (§A.13).
> 
> **Consequência:** `STALE_EPOCH` no wire protocol refere-se exclusivamente à Época de Identidade. Divergência de época de conteúdo manifesta-se como negativa do Key Vault ou payload ilegível pendente de reidratação de chave, na camada de aplicação.

## Implementação

Verificado durante o handshake [[noise-xx]]. O Sync/Crypto Worker local gerencia a Época de Identidade e engaja o Catch-up de Identidades na Onda 0 quando necessário.

## Evolução

Alterações na lista fechada de eventos que incrementam a Época de Identidade exigem aprovação por RFC.

## Aparições a consolidar

Nenhuma.


