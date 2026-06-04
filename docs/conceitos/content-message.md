---
name: content-message
title: "CONTENT:MESSAGE (Mensagem)"
aliases: ["CONTENT:MESSAGE", "mensagem de chat", "mensagem de infraestrutura", "system message"]
tags: [protocol, ontologia, graph, content]
---

# CONTENT:MESSAGE (Mensagem)

## Definição

`CONTENT:MESSAGE` é um **subtipo de [[content]]** usado para toda comunicação no grafo — tanto mensagens de chat entre personas quanto instruções internas de microsserviços e notificações entre agentes do sistema.

Conforme `caderno-2-protocol/01-graph-ontology.md §3.2`:

> `CONTENT:MESSAGE` — Mensagens de chat ou instruções internas de microsserviços.

Conforme `glossary.md §CONTENT:MESSAGE`:

> `CONTENT:MESSAGE` — Subtipo de CONTENT usado para toda comunicação interna de infraestrutura (como `SYSTEM_QUERY` ou `SYSTEM_RESPONSE`) e notificações entre agentes do sistema, operando de modo offline-first.

`CONTENT:MESSAGE` **não** é um quinto tipo de nó; é um `CONTENT`. Toda semântica de criação, mutação e governança de `CONTENT` se aplica.

## Casos de Uso

| contexto | emissor | exemplo de payload |
|:---|:---|:---|
| Chat entre personas | `PROFILE:PERSONA` | Texto livre, mídia (`CONTENT:FILE` como anexo) |
| Comunicação de infraestrutura | `PROFILE:SYSTEM` | `SYSTEM_QUERY`, `SYSTEM_RESPONSE` |
| Notificações internas de agentes | `PROFILE:SYSTEM` | Eventos de orquestração entre agentes do sistema |

A aresta `DIRECTED_TO` roteia a mensagem para o destinatário. `PROFILE:SYSTEM` utiliza especificamente nós `CONTENT:MESSAGE` roteados por arestas `DIRECTED_TO` para comunicação interna do sistema (ver [[profile-system]]).

## Comutatividade

`CONTENT:MESSAGE` é classificado como **comutativo** em `rfc-v4.md §2.1`:

> **Comutativo** — `CONTENT:DOCUMENT`, `CONTENT:MESSAGE`, créditos a saldo: mescla sem ordem (Automerge para documento; merge aditivo para saldo). Qualquer agente aplica; desempate determinístico. Otimista.

Isso significa que mensagens concorrentes são mescladas sem serialização por linhagem — a ordem de aplicação é irrelevante para a consistência final.

## Comportamento Offline-First

Mensagens operam em modo offline-first: são criadas e armazenadas localmente, sincronizadas via [[rbsr]] quando conexão é restabelecida. A comutatividade garante que a ordem de sincronização não afeta o resultado final.

## Arestas Típicas

| aresta | direção | papel |
|:---|:---|:---|
| `AUTHORED` | `PROFILE` → `CONTENT:MESSAGE` | quem criou a mensagem |
| `DIRECTED_TO` | `CONTENT:MESSAGE` → `PROFILE` | destinatário (roteamento) |
| `REPLIES_TO` | `CONTENT:MESSAGE` → `CONTENT:MESSAGE` | encadeamento de conversa |
| `MUTATES` | nó novo → nó anterior | edição de mensagem (linhagem) |
| `GOVERNED_BY` | `CONTENT:MESSAGE` → `SPECIFICATION` | schema e regras de validação aplicáveis |

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[content]] | 1 | criado (placeholder) |
| [[no]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[substantivo-verbo-principio]] | 1.5 | criado |
| [[mutates]] | 1 | criado |
| [[linhagem-de-versoes]] | 1 | criado |
| [[profile-system]] | 3 | criado |

Dependências de ondas futuras (Foam placeholders — não criar agora):

- `[[rbsr]]` — Onda 4; protocolo de sincronização usado na entrega offline-first

## Aparições a Consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§3.2` | Substituir linha de definição inline por `[[content-message]]` |
| `glossary.md` | `§CONTENT:MESSAGE` (linha 127) | Substituir definição por referência a `[[content-message]]` |
| `glossary.md` | `§PROFILE:SYSTEM` (linha 123) | Adicionar link `[[content-message]]` na menção ao subtipo |
| `docs/conceitos/profile-system.md` | menções inline | Substituir referências literais a `CONTENT:MESSAGE` por `[[content-message]]` |
