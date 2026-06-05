---
title: "Serialização por Linhagem"
slug: serialization-por-linhagem
aliases: ["serialização por linhagem", "serialization por linhagem", "serialização por linhagem v4"]
tags: [protocol, serialização, linhagem, validadores, não-comutativo, segurança, v4]
modo: hub
fonte-canonica: docs/rfc-v4.md §2.3
aparicoes-consolidadas:
  - caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5
  - glossary.md §Serialização por Linhagem (v4)
dependencias:
  - [[linhagem-de-versoes]]
  - [[congelamento-escopado]]
  - [[invariante-de-core]]
  - [[validador-declarado]]
  - [[aplicador-deterministico]]
  - [[comutativo-vs-nao-comutativo]]
  - [[asset-lock]]
  - [[ucan]]
---

# Serialização por Linhagem

## Definição

**Serialização por linhagem** é o mecanismo pelo qual operações não-comutativas (débito de `ASSET:BALANCE_STATE`, emissão de `ASSET:PERMISSION`, alteração de `SPECIFICATION`) são ordenadas e finalizadas **pelo validador declarado daquela linhagem de ativo** — e não por um quórum global.

Introduzido na v4, substitui o quórum global K-de-N de validadores e a eleição de emergência a 2/3 da v3.1. O consenso deixa de ser de rede e passa a ser **escopado ao ativo**: cada linhagem tem seu próprio conjunto de validadores e sua própria fila de operações.

## Conteúdo normativo

O texto normativo completo — invariante de core, bloco de política YAML, raciocínio de por que a invariante não pode ser definida por SPEC, modos `leader` vs. `quorum`, e defaults por modalidade — está definido canonicamente em:

> `rfc-v4.md §2.3` — Serialização por Linhagem — a Invariante de Core

A seção `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5` (Serialização por Linhagem v4) reproduz e formaliza o mesmo conteúdo no contexto de governança. Leia as fontes diretamente para regras normativas.

## Resumo estrutural

### Divisão fundamental: comutativo vs. não-comutativo

Conforme `rfc-v4.md §2.1`, operações se dividem em:

| classe | exemplos | resolução |
|:---|:---|:---|
| **Comutativa** | `CONTENT:DOCUMENT`, `CONTENT:MESSAGE`, créditos a saldo | Mescla sem ordem (Automerge / merge aditivo). Qualquer agente aplica. |
| **Não-comutativa** | Débito de `ASSET:BALANCE_STATE`, emissão de `ASSET:PERMISSION`, alteração de `SPECIFICATION` | Exige serialização por linhagem (§2.3). |

### O que substitui em relação à v3.1

| mecanismo v3.1 | substituído por (v4) | motivo |
|:---|:---|:---|
| Quórum global K-de-N + eleição de emergência a 2/3 | Serialização por linhagem com validadores declarados por SPEC | Localiza o consenso ao ativo; elimina congelamento de rede inteira |
| K=5 auditores aleatórios para finança | K=1 (caso comum), validador determinístico por linhagem | Auditor aleatório não pode ler saldo cifrado; o validador declarado já tem direito de leitura |

### A invariante de core

A invariante é enforçada pelo core, independente de qualquer política de SPEC:

> Duas escritas conflitantes na mesma linhagem não-comutativa **não podem** ambas chegar ao estado `finalized`.

Ver [[invariante-de-core]] para o verbete dedicado.

### A política (declarada na SPEC do ativo)

A `SPECIFICATION` que governa o ativo declara o conjunto de validadores e a regra de acordo. Bloco YAML normativo em `rfc-v4.md §2.3` / `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5`:

```yaml
serialization:
  mode: "leader" | "quorum"
  set: [validator_ids…] | "custody_ring"
  k: N
  fault_model: "crash" | "byzantine"
  lease: { ttl, renew_quorum }   # apenas no modo leader
```

Pontos-chave da política (resumo; texto normativo nas fontes):

- **K=1 é o caso comum**. A posse da linhagem é determinística (`hash(entity_id)` → um agente do conjunto), nunca pega-quem-agarra-primeiro.
- **`leader` (Raft-like)**: amortiza o quórum numa lease e serializa muitas ops baratas. Líder sem lease é inseguro sob partição.
- **`quorum` (Paxos-like, por op)**: cada op precisa de K assinaturas. Seguro sob partição por construção — o lado sem K congela escopadamente (ver [[congelamento-escopado]]).
- **Finalização pelo [[aplicador-deterministico]]** (menor `entity_id` entre os aprovadores), não "o N-ésimo".
- **Evidência inline**, não agregada (BLS), para preservar atribuição individual e permitir corte de caução.

### Defaults por modalidade

| modalidade | modo padrão |
|:---|:---|
| Corporativa | `leader` (super peer) |
| Pública | `quorum` entre validadores licenciados |
| P2P puro | `quorum` bizantino sobre anel de custódia |

### Por que a invariante não pode ser definida por SPEC

Três razões, conforme `rfc-v4.md §2.3`:

1. SPEC é dado mutável e não-confiável no grafo; confiar nela para definir segurança financeira seria a mesma circularidade já proibida em `caderno-2-protocol/02 §2.1`.
2. O modo de falha de um `k=0` não é UX degradada — é **cunhagem silenciosa**.
3. **Accountability** exige invariante conhecida pelo core: só assim é possível dizer "esta finalização violou a invariante, eis a prova, corte estas cauções".

### Relação com partição e liveness

Sob partição, o comportamento depende do modo:

- **`quorum`**: o lado sem K assinaturas congela escopadamente à linhagem; o outro finaliza. Ver [[congelamento-escopado]].
- **`leader`**: líder sem lease válida para de aceitar novas ops — congelamento escopado à linhagem sob sua responsabilidade.

Operações comutativas continuam funcionando independentemente de qualquer partição de validadores. Ver [[tradeoff-liveness-validadores]].

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-4-governance/03-specification-lifecycle-and-rfcs.md` | `§3.5` | Substituir definição local por resumo + wikilink `[[serialization-por-linhagem]]` |
| `glossary.md` | `§Serialização por Linhagem (v4)` | Substituir por wikilink `[[serialization-por-linhagem]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[linhagem-de-versoes]] | 1 | criado |
| [[ucan]] | 2 | criado |
| [[asset-lock]] | 3 | criado |
| [[congelamento-escopado]] | 8 | criado |
| [[invariante-de-core]] | 9 | placeholder (mesma onda) |
| [[validador-declarado]] | 9 | placeholder (mesma onda) |
| [[aplicador-deterministico]] | 9 | placeholder (mesma onda) |
| [[comutativo-vs-nao-comutativo]] | 9 | placeholder (mesma onda) |
| [[tradeoff-liveness-validadores]] | 8 | criado |
