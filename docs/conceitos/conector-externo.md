---
name: conector-externo
title: "Conector Externo"
aliases: ["conector externo", "external connector", "conector", "conectores externos"]
tags: [sdk, conectores, integracao, protocolo]
---

# Conector Externo

## Definição

Todo acoplamento entre o grafo e um sistema externo pertence a exatamente uma das cinco classes de conector externo. O contrato completo está em `caderno-3-sdk/06-connectors.md`.

## Taxonomia de Classes

| Classe | Nome | Direção | Afirma fato na linhagem? | Exemplo |
| :--- | :--- | :--- | :--- | :--- |
| A | Egresso notificacional | grafo → humano | Não (fire-and-forget) | SMTP de recuperação, WhatsApp/SMS da régua de cobrança |
| B | Ingresso content-blind | externo → dispositivo | Não (só acorda) | Push Connector (VAPID/FCM/APNs) |
| C | Oráculo transacional | bidirecional, por operação | **Sim** (perna de saga) | BaaS de pagamentos, emissão de NF-e, eSocial |
| D | Espelho bidirecional | bidirecional, contínuo | Sim (ingestão assinada) | Cliente de email IMAP/SMTP, API do ERP do cliente (garantidora) |
| E | Provedor de consulta | grafo → externo → grafo | Não (cache com TTL) | Geocoding/places/rotas (mapa), consulta de NF-e |

**Critério de classificação:** a pergunta decisiva é *"o resultado entra na linhagem como fato durável?"*. Se sim e por operação → C; se sim e contínuo → D; se não → A/B/E conforme direção.

## Contrato Comum

Ver `caderno-3-sdk/06-connectors.md §1` para interface `ExternalConnector`, regras de identidade, credenciais e roteamento spec-driven.

## Dependências

| conceito | status |
|:---|:---|
| [[peer-do-sistema]] | criado |
| [[agente-de-sistema]] | criado |
| [[oraculo-baas]] | criado |
| [[fato-negativo-verificavel]] | criado |
| [[asset-lock]] | criado |
