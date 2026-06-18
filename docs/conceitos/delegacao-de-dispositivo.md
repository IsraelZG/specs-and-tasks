---
name: delegacao-de-dispositivo
title: "Delegação de Dispositivo (Device Delegation)"
aliases: ["device delegation", "delegação de dispositivo", "DELEGATED_TO"]
tags: [protocol, identidade, acesso]
---

# Delegação de Dispositivo (Device Delegation)

## Definição

A Delegação de Dispositivo é o mecanismo criptográfico e lógico pelo qual um dispositivo físico (representado por seu `DevicePeerId`) é autorizado a assinar mensagens e realizar transações em nome de uma `PROFILE:PERSONA` sem precisar possuir ou importar a chave mestra do usuário.

## Por quê

O compartilhamento ou transferência direta de chaves mestras de identidade entre múltiplos dispositivos viola o isolamento de hardware e dificulta a revogação seletiva. Delegar permissões por dispositivo garante:
- **Isolamento de hardware:** A chave privada do dispositivo nunca deixa o enclave seguro.
- **Revogação granular:** Um dispositivo roubado ou inativo pode ser revogado sem invalidar a chave mestra do usuário ou de outros dispositivos associados.
- **Aderência ao capability model:** O acesso é concedido por meio de escopos delimitados.

## Contrato

O texto normativo estabelece:

- **Vínculo dispositivo ↔ identidade:** Um dispositivo fala por uma persona somente se existir no grafo a relação:
  `ASSET:PERMISSION` (escopo de operação do dispositivo) ligado por aresta **`DELEGATED_TO`** à chave pública do dispositivo, assinado pela identidade-âncora.
- **Ciclo de vida e Rotação:** A emissão ou revogação de uma delegação de dispositivo **incrementa a Época de Identidade** ([[epoca-de-identidade]]).
- **Revogação:** Revogar um dispositivo consiste em emitir uma aresta de lápide na delegação correspondente e incrementar a época de identidade. A chave mestra e os demais dispositivos associados continuam intactos.

## Implementação

No provisionamento (pareamento via QR Code e código SAS), a chave definitiva do novo dispositivo é registrada na aresta `DELEGATED_TO` assinada pelo dispositivo confiável detentor do poder.

## Evolução

Futuros aprimoramentos nos níveis de restrição de capabilities em `DELEGATED_TO` (ex: rate limits de transações por dispositivo) serão especificados na governança.

## Aparições a consolidar

Nenhuma.


