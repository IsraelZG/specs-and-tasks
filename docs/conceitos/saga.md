---
title: "Saga"
slug: saga
aliases: ["saga multidomínio", "Saga Tier 1", "saga com lock TTL", "transação multidomínio Tier 1"]
tags: [protocol, transações, multidomínio, saga, asset-lock, ttl, consistência-eventual, v4]
modo: hub
fonte-canonica: docs/rfc-transacoes-multidominio.md §2
aparicoes-consolidadas:
  - glossary.md §Saga (Tier 1)
dependencias:
  - [[asset-lock]]
  - [[ucan]]
  - [[linhagem-de-versoes]]
  - [[hlc]]
  - [[invariante-de-core]]
  - [[serialization-por-linhagem]]
  - [[politica-de-ttl]]
  - [[linhagem-de-coordenacao]]
  - [[oraculo-baas]]
---

# Saga

## Definição

**Saga** (Tier 1 de transações multidomínio) é o padrão de composição que decompõe uma operação cross-domínio em operações single-domain já serializáveis, coladas por **reservas temporárias com prazo de expiração** (`[[asset-lock]]` com TTL). Oferece consistência eventual sem isolamento de snapshot; é o default para transações multidomínio na plataforma.

Não é uma primitiva do core — é um **protocolo de composição**. O core garante safety por perna (cada leg respeita a [[invariante-de-core]] de [[serialization-por-linhagem]] da sua linhagem) mas não garante atomicidade cross-domínio.

## Conteúdo normativo

O texto normativo completo — anatomia da saga (reservar/confirmar/expirar perna), limite honesto do Tier 1, exemplos reais, invariantes transversais de TTL e regra inviolável do estado de saga — está definido canonicamente em:

> `rfc-transacoes-multidominio.md §2` — Tier 1 (Default): Saga com `ASSET:LOCK` e TTL

Para políticas de TTL (`fixed`, `per_leg`, `renewable_lease`, `risk_scaled`) e o bloco de configuração SPEC ver:

> `rfc-transacoes-multidominio.md §5` — Políticas de TTL (e verbete [[politica-de-ttl]])

Para o estado de coordenação da saga (efêmero, local, nunca replicado) ver:

> `rfc-transacoes-multidominio.md §8` — Estado da Saga (e verbete [[linhagem-de-coordenacao]])

## Resumo estrutural

### Premissa: atomicidade cross-domínio não é invariante de core

Conforme `rfc-transacoes-multidominio.md §1`, o core não enforça tudo-ou-nada entre domínios sem coordenador confiável. Consistência cross-domínio é um **padrão de composição**, não uma primitiva. Sempre existe janela intermediária observável.

### Anatomia de uma perna de saga

| fase | mecanismo |
|:---|:---|
| **Reservar** | Op não-comutativa cujo output é um `[[asset-lock]]` temporário; ancora no head do recurso via aresta `SPENDS`; herda detecção estrutural de conflito. |
| **Confirmar** | Op que consome o lock e materializa o efeito (transferência); adjudicada pelo validador da linhagem do lock; usa aresta `CREDITS` existente. |
| **Expirar / Falhar** | TTL adjudicado pelo **validador-dono da linhagem** contra o [[hlc]] dele; expiração = lápide, libera o head automaticamente. |
| **Reverter** | Lançamento compensatório append-only (nunca deleção); deve ser idempotente com retry automático. |

### Limite honesto do Tier 1

- **Sem isolamento de snapshot:** existe janela onde a perna A commitou e a B não.
- Padrão de mercado aceitável, declarado explicitamente na SPEC com tag `consistency: eventual` / `isolation: none`.
- UI deve sinalizar operações em andamento como "não-garantidas / baseadas em confiança".

### Regra inviolável: estado da saga

Estado mutável replicado da saga é **proibido**. O estado de coordenação (quais pernas reservadas/confirmadas) fica em projeção local não-replicada do agente orquestrador ([[linhagem-de-coordenacao]]). Criar aresta com `state` mutável replicado reabriria o buraco append-only que a v4 já fechou.

Opcionalmente, após liquidação final: um `CONTENT:INTENT` consolidador "saga liquidada" pode ir ao grafo durável para auditoria.

### Degradação em single-domain (deployments corporativos)

Em deployments com autoridade central (validador-dono de quase todos os recursos contendidos), a multidomínio degenera: as pernas compartilham um domínio e a saga vira um único `CONTENT:INTENT` com N `CREDITS` e N `SPENDS`. Não embutir maquinaria de saga por padrão em deployments corporativos.

**Exceção:** a perna externa (BaaS, terceiro) continua cross-domínio; o validador-ponte-BaaS é um [[oraculo-baas]] — única afirmação aceita sem verificação criptográfica. Mitigado por bonding/redundância, não por cripto.

### Relação com Tier 2 (2PC)

Quando exige-se isolamento de snapshot **e** há coordenador confiável, usa-se o [[2pc-com-lock-ttl]] (Tier 2). O TTL resolve o bloqueio clássico do 2PC: janela em-dúvida = TTL, não indefinida. Ver `rfc-transacoes-multidominio.md §3`.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Saga (Tier 1)` | Substituir por wikilink `[[saga]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[linhagem-de-versoes]] | 1 | criado |
| [[hlc]] | 1 | criado |
| [[ucan]] | 2 | criado |
| [[asset-lock]] | 3 | criado |
| [[invariante-de-core]] | 9 | criado |
| [[serialization-por-linhagem]] | 9 | criado |
| [[politica-de-ttl]] | 9 | placeholder (mesma onda) |
| [[linhagem-de-coordenacao]] | 9 | placeholder (mesma onda) |
| [[oraculo-baas]] | 9 | placeholder (mesma onda) |
| [[2pc-com-lock-ttl]] | 9 | placeholder (mesma onda) |


