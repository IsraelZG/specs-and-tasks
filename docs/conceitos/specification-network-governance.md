---
title: "SPECIFICATION:NETWORK_GOVERNANCE"
slug: specification-network-governance
aliases: ["network governance spec", "nó de governança de rede", "NETWORK_GOVERNANCE", "governança de rede"]
tags: [governance, specification, bootstrap, succession, liveness]
modo: hub
fonte-canonica: docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3
aparicoes-consolidadas:
  - caderno-2-protocol/01-graph-ontology.md §3.4
  - caderno-1-vision/01-vision-and-positioning.md §5
dependencias:
  - [[specification]]
  - [[zen-engine]]
  - [[fundador]]
  - [[sucessao-por-quorum]]
  - [[morte-da-rede]]
  - [[tradeoff-liveness-validadores]]
  - [[congelamento-escopado]]
  - [[profile-system]]
  - [[serialization-por-linhagem]]
  - [[invariante-de-core]]
---

# SPECIFICATION:NETWORK_GOVERNANCE

## Definição

`SPECIFICATION:NETWORK_GOVERNANCE` é um subtipo de [[specification]] que atua como **nó de bootstrap da governança** de toda rede. Criado durante a gênese, ele declara: a linha de sucessão dos validadores autorizados, os modelos de tomada de decisão (top-down ou comunitário/híbrido), e as condições de dissolução irreversível dos poderes do fundador.

É um dos três subtipos canônicos de [[specification]]: `SPECIFICATION:SCHEMA`, `SPECIFICATION:WORKFLOW` e **`SPECIFICATION:NETWORK_GOVERNANCE`** (ver [[caderno-2-protocol/01-graph-ontology#34-specification-a-lei]]).

## Por quê

Em uma arquitetura descentralizada, regras de quem pode aprovar mutações não-comutativas, como se dá a sucessão em caso de incapacidade do [[fundador]], e o que acontece com a rede quando validadores ficam permanentemente offline precisam estar declaradas **no próprio grafo**, não em código externo. O nó `SPECIFICATION:NETWORK_GOVERNANCE` é a única fonte de verdade auditável e replicável para essas políticas.

## Conteúdo normativo

O texto normativo completo desta especificação — modelos de governança (top-down vs. híbrido/comunitário), mecânica de sucessão por quórum M-de-N, dissolução de poderes, morte da rede por leis físicas e o tradeoff de liveness dos validadores — está definido canonicamente em:

> `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3` (§3.1 a §3.5)

Leia aquele documento diretamente para regras normativas. O resumo abaixo cobre apenas a navegação entre conceitos.

## Resumo estrutural

### Modelos de governança (`§3.1`)

Dois modelos declaráveis na `SPECIFICATION:NETWORK_GOVERNANCE`:

- **Top-down (corporativa/pública tradicional):** o [[fundador]] ou board centralizado detém controle dos validadores e aprovações críticas.
- **Híbrida/comunitária:** decisões operacionais residem no consórcio fundador; alterações estruturais exigem quórum de votos criptográficos assinados pelos peers.

### Linha de sucessão e dissolução de superpoderes (`§3.2`)

Ver [[sucessao-por-quorum]]. O fundador pode alterar de forma **irreversível** a `SPECIFICATION:NETWORK_GOVERNANCE` para abrir mão de seus poderes e migrar para modelo P2P puro distribuído ou base de votação.

### Morte da rede (`§3.3`)

Ver [[morte-da-rede]]. A plataforma não exige código específico para desativar redes: se todos os validadores ficam offline permanentemente, operações não-comutativas param por design (leis físicas do sistema), enquanto operações comutativas (leitura, gossip, RBSR, navegação) continuam entre peers ativos.

### Tradeoff de liveness dos validadores (`§3.4`)

Ver [[tradeoff-liveness-validadores]] e [[congelamento-escopado]]. A degradação para read-only por linhagem é propriedade intencional e defensável — documentada como garantia de segurança, não como defeito.

### Serialização por linhagem (`§3.5`)

Ver [[serialization-por-linhagem]] e [[invariante-de-core]]. Operações não-comutativas são serializadas por linhagem de ativo, executadas pelo [[zen-engine]] sob a política declarada na SPEC do ativo ([[profile-system]] valida como agente de sistema credenciado).

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-2-protocol/01-graph-ontology.md` | `§3.4` (subtipo `SPECIFICATION:NETWORK_GOVERNANCE`) | Substituir menção por wikilink `[[specification-network-governance]]` |
| `caderno-1-vision/01-vision-and-positioning.md` | `§5` (relações de governança e fundador) | Substituir por wikilink `[[specification-network-governance]]` + `[[fundador]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[specification]] | 1 | criado |
| [[zen-engine]] | 7 | criado |
| [[fundador]] | 12 | placeholder (onda futura) |
| [[sucessao-por-quorum]] | 8 | placeholder (mesma onda) |
| [[morte-da-rede]] | 8 | placeholder (mesma onda) |
| [[tradeoff-liveness-validadores]] | 8 | placeholder (mesma onda) |
| [[congelamento-escopado]] | 8 | placeholder (mesma onda) |
| [[profile-system]] | 3 | placeholder (onda futura) |
| [[serialization-por-linhagem]] | 9 | placeholder (onda futura) |
| [[invariante-de-core]] | 9 | placeholder (onda futura) |


