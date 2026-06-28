---
title: "Saga de Dispatch"
slug: dispatch-saga
aliases: ["dispatch-saga", "saga de dispatch", "dispatch"]
tags: [sdk, logistica, saga, matching]
---

# Saga de Dispatch

## Definição

A **saga de dispatch** é a coordenação transacional multidomínio (conforme RFC-012 A.4) para realizar o matching de entregadores/motoristas em serviços de transporte próprios da rede. Ofertar a corrida reserva temporariamente a disponibilidade do entregador com um `ASSET:LOCK` (TTL), confirmando a corrida com o aceite ou liberando o entregador com a recusa/expiração do lock.

## Contrato

As especificações do matching e dispatch de transporte interno estão em [[caderno-3-sdk/25-logistica-reference-spec#4-operação-interna-de-transporte-modelo-mercado-envios-uber]].
