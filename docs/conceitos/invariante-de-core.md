---
title: "Invariante de Core"
slug: invariante-de-core
aliases: ["invariante de core", "invariante de core v4", "core invariant"]
tags: [protocol, segurança, serialização, linhagem, não-comutativo, v4]
modo: hub
fonte-canonica: docs/rfc-v4.md §2.3
aparicoes-consolidadas:
  - caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5
  - glossary.md §Invariante de Core (v4)
dependencias:
  - [[serialization-por-linhagem]]
  - [[linhagem-de-versoes]]
  - [[validador-declarado]]
  - [[aplicador-deterministico]]
  - [[congelamento-escopado]]
  - [[comutativo-vs-nao-comutativo]]
---

# Invariante de Core

## Definição

A **invariante de core** é a propriedade de segurança inviolável que o core da plataforma enforça sobre operações não-comutativas:

> Duas escritas conflitantes na mesma linhagem não-comutativa **não podem** ambas chegar ao estado `finalized`.

Introduzida na v4, é parte central do mecanismo de [[serialization-por-linhagem]]. Não é configurável por `SPECIFICATION` — veja abaixo por quê.

## Conteúdo normativo

O texto normativo completo — definição precisa de "escrita conflitante", mecanismo de detecção de colisão, raciocínio sobre por que a invariante não pode ser delegada à SPEC, e relação com cauções — está em:

> `rfc-v4.md §2.3` — *Serialização por Linhagem — a Invariante de Core*

A seção `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5` (Serialização por Linhagem v4) reproduz e formaliza o mesmo conteúdo no contexto de governança. Leia as fontes diretamente para regras normativas.

## Resumo estrutural

### Enunciado

Conforme `rfc-v4.md §2.3` e `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5`:

> Uma finalização não-comutativa só é válida se carrega evidência satisfazendo a regra declarada **e** não existe finalização conflitante na linhagem; colisões são faltas forenses com assinantes responsabilizáveis.

O core verifica:
1. Evidência de aprovação (≥K aprovações válidas do conjunto [[validador-declarado]], ancoradas ao `head` consumido via `SPENDS`).
2. Ausência de finalização conflitante na linhagem.

Se ambas as condições não forem satisfeitas, a finalização é rejeitada (ou, em caso de colisão detectada pós-hoc, registrada como falta forense).

### Por que não é configurável por SPEC

Três razões, conforme `rfc-v4.md §2.3` e `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5`:

1. **SPEC é dado mutável e não-confiável no grafo.** A mesma doutrina de `caderno-2-protocol/02 §2.1` proíbe consultar payload de SPEC para validação de acesso — o raciocínio se aplica aqui: confiar em SPEC para definir a invariante de segurança financeira seria circular.
2. **O modo de falha de `k=0` não é UX degradada — é cunhagem silenciosa.** Não há nível aceitável de degradação para esta propriedade.
3. **Accountability exige invariante conhecida pelo core.** Só com invariante conhecida pelo core é possível afirmar "esta finalização violou a invariante, eis a prova, corte estas cauções".

### Relação com serialização por linhagem e política de SPEC

A invariante de core é a parte **não-configurável** do mecanismo de [[serialization-por-linhagem]]. A parte configurável — conjunto de validadores, modo (`leader`/`quorum`), K, modelo de falta, lease — é declarada pela `SPECIFICATION` do ativo e constitui a política. Ver [[serialization-por-linhagem]] para o verbete completo.

### Relação com partição e congelamento

Quando o lado de uma partição não reúne K aprovações válidas, a invariante continua sendo respeitada: operações pendentes ficam em `pending` e não avançam para `finalized`. Esse comportamento é o [[congelamento-escopado]] por linhagem. A invariante nunca é violada por partição — ela é a razão pela qual o congelamento escopado é a resposta correta.

### Colisões como fatos forenses

Se dois finalizadores produzirem evidências conflitantes válidas (ataque de dupla-finalização por validadores desonestos), a colisão é registrada como fato negativo verificável. As assinaturas dos aprovadores são individuais (evidência inline, não BLS agregado), permitindo responsabilização direta e corte de caução.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-4-governance/03-specification-lifecycle-and-rfcs.md` | `§3.5` | Substituir definição local por resumo + wikilink `[[invariante-de-core]]` |
| `glossary.md` | `§Invariante de Core (v4)` | Substituir por wikilink `[[invariante-de-core]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[linhagem-de-versoes]] | 1 | criado |
| [[congelamento-escopado]] | 8 | criado |
| [[serialization-por-linhagem]] | 9 | criado (mesma onda) |
| [[validador-declarado]] | 9 | placeholder (mesma onda) |
| [[aplicador-deterministico]] | 9 | placeholder (mesma onda) |
| [[comutativo-vs-nao-comutativo]] | 9 | placeholder (mesma onda) |


