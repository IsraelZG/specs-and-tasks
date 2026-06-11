---
title: "Congelamento Escopado"
slug: congelamento-escopado
aliases: ["freeze escopado", "scoped freeze", "congelamento por linhagem", "freeze por linhagem"]
tags: [governance, liveness, linhagem, safety, validadores, serialização, partição]
modo: hub
fonte-canonica: docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4
aparicoes-consolidadas:
  - rfc-v4.md §2.3
dependencias:
  - [[tradeoff-liveness-validadores]]
  - [[serialization-por-linhagem]]
  - [[morte-da-rede]]
  - [[specification-network-governance]]
  - [[invariante-de-core]]
---

# Congelamento Escopado

## Definição

**Congelamento escopado** (ou *scoped freeze*) é o comportamento pelo qual, sob partição de rede, **apenas a linhagem cujo validador/quórum está inalcançável entra em modo read-only** — e não a rede inteira.

Trata-se de uma propriedade de segurança deliberada introduzida na v4: o freeze deixa de ser global e passa a ser **por ativo/linhagem**, mais granular e estritamente mais seguro que o modelo V3.1 (que congelava a rede inteira quando o quórum global era inalcançável).

## Conteúdo normativo

O texto normativo completo — incluindo a atualização v4, a remoção da eleição de emergência a 2/3, o comportamento sob partição nos modos `leader` e `quorum`, e os defaults por modalidade — está definido canonicamente em:

> `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4` (Atualização v4 — congelamento escopado por linhagem)

A seção `rfc-v4.md §2.3` (Serialização por Linhagem — a Invariante de Core) formaliza o congelamento escopado à linhagem no contexto do modo `quorum` (Paxos-like, por op): o lado sem K assinaturas **congela escopadamente**; o outro lado **finaliza**. Leia ambas as fontes diretamente para regras normativas.

## Resumo estrutural

### O que muda em relação à V3.1

| aspecto | V3.1 | V4 (congelamento escopado) |
|:---|:---|:---|
| escopo do freeze | rede inteira | apenas a linhagem cujo validador está inalcançável |
| eleição de emergência a 2/3 | presente (reintroduzia split-brain → double-spend) | **removida** |
| linhagens com validador alcançável | pausam junto | **continuam normalmente** |

### Quando ocorre

- Modo `quorum` (Paxos-like): quando o lado da partição sem K assinaturas tenta finalizar uma operação não-comutativa, aquela linhagem congela; o lado com quórum finaliza normalmente.
- Modo `leader` (Raft-like): líder sem lease válida é inseguro sob partição; a lease (cedida por quórum) é o que garante segurança; sem lease, o líder deixa de aceitar novas ops — congelamento escopado à linhagem sob sua responsabilidade.

### Propriedades do estado congelado

- **Não corrompe dados**: o estado existente permanece íntegro e legível.
- **Não permite operações inválidas**: operações não-comutativas da linhagem congelada são rejeitadas.
- **Não perde auditabilidade**: a linhagem forense permanece intacta.
- **É um *freeze*, não um *crash***: operações comutativas (leitura, gossip, [[rbsr]], chats, rascunhos) continuam operando normalmente.

### Defaults por modalidade (conforme `rfc-v4.md §2.3`)

| modalidade | modo de serialização | comportamento sob partição |
|:---|:---|:---|
| Corporativa | `leader` (super peer) | raro; failover por lease |
| Pública | `quorum` entre validadores licenciados | congelamento escopado à linhagem; autoridade tende a estar presente |
| P2P puro | `quorum` bizantino sobre anel de custódia | congelamento escopado quando quórum inalcançável |

### Relação com outras propriedades

O congelamento escopado é a consequência operacional do [[tradeoff-liveness-validadores]]: a plataforma prioriza integridade sobre disponibilidade transacional de 100% em cenário de desastre. A granularidade por linhagem (em vez de por rede) é o refinamento central da v4. Ver também [[morte-da-rede]] para o caso extremo (extinção total dos validadores de uma rede) e [[serialization-por-linhagem]] para a mecânica completa da invariante de core.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `rfc-v4.md` | `§2.3` (formaliza congelamento escopado à linhagem no contexto do modo `quorum`) | Substituir ocorrências do termo por resumo + wikilink `[[congelamento-escopado]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[tradeoff-liveness-validadores]] | 8 | criado (mesma onda) |
| [[morte-da-rede]] | 8 | criado (mesma onda) |
| [[specification-network-governance]] | 8 | criado (mesma onda) |
| [[serialization-por-linhagem]] | 9 | placeholder (onda futura) |
| [[invariante-de-core]] | 9 | placeholder (onda futura) |
| [[rbsr]] | 4 | criado |


