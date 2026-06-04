---
title: NotificationConnector
slug: notification-connector
aliases:
  - NotificationConnector
  - notification-connector
tags:
  - sdk
  - canonical
  - onda-7
modo: canonical
fonte-canonica: docs/caderno-3-sdk/06-connectors.md §1
aparicoes-consolidadas:
  - docs/glossary.md §NotificationConnector
dependencias:
  - [[specification]]
  - [[asset-invite]]
  - [[peer-do-sistema]]
---

# NotificationConnector

## Definição

**`NotificationConnector`** é a interface única de **egress out-of-band** — camada lateral que entrega mensagens a humanos por canais externos ao grafo (e-mail, SMS, mensageria). Não é transporte de grafo; é canal auxiliar para tokens de recuperação, links de convite e códigos 2FA.

## Interface

O contrato normativo completo está em [`caderno-3-sdk/06-connectors.md §1`](../caderno-3-sdk/06-connectors.md):

```typescript
interface NotificationConnector {
  send(recipient: Recipient, template: TemplateRef, payload: Record): Promise;
  capabilities(): ConnectorCapabilities; // canais suportados, rate limits
}
```

Implementações previstas:

| Adapter | Prioridade | Observação |
|:---|:---|:---|
| SMTP (base) | Prioridade de desenvolvimento | Self-hostable; atende Desktop-servidor corporativo on-prem |
| Gmail API | Secundária | Entrega mais rica sobre a mesma interface |
| WhatsApp Business API | Secundária | Idem |
| SMS (Twilio) | Secundária | Idem |

A interface abstrai o backend: o resto do sistema chama `notify()` agnóstico de canal.

## Propriedades arquiteturais

- **Capacidade do peer do sistema, não do core.** Amarra no tier (RFC §4.1.1): "recuperação por e-mail" é dependência declarada do papel. P2P puro sem conector não faz recuperação por e-mail (limite honesto, modality-gated). Ver [[peer-do-sistema]].
- **Spec-driven (IoC):** a [[specification]] declara `connector` + `template`; o [[peer-do-sistema]] resolve e despacha. A UI não sabe qual backend.
- **Config sensível fora do grafo:** credenciais SMTP / API keys são infra do operador — nunca no grafo.
- **Conteúdo bearer:** o que é enviado (link de convite, token de recovery, código 2FA) é segredo portador com TTL curto e single-use.

## Casos de uso

| Caso | Conteúdo | Origem |
|:---|:---|:---|
| Recuperação de conta (corporativo) | token de reset | `caderno-3-sdk/06-connectors.md §3` → `caderno-2/02 §4.1` |
| Distribuição de convite | link [[asset-invite]] + multiaddr | RFC §2.4.4 |
| 2FA | código de fator | fluxo de desbloqueio (`caderno-2/02 §4.1`) |

## Limites honestos

- O conector é infra operada por alguém: introduz dependência de disponibilidade e um ponto de confiança (o operador do SMTP vê destinatários e conteúdo dos e-mails de sistema).
- Entrega não é garantida (spam filters, indisponibilidade do provedor) — fluxos de recuperação devem ter canal alternativo (ex.: shard externo do SSS; ver `caderno-2/02 §4.2`).

## Aparições consolidadas

- `docs/glossary.md §NotificationConnector` — definição em uma linha; consolidada neste verbete.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[specification]] | 1 | criado |
| [[asset-invite]] | 3 | criado |
| [[peer-do-sistema]] | 12 | pendente (Foam placeholder) |
