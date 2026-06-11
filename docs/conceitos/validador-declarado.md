---
title: "Validador Declarado"
slug: validador-declarado
aliases: ["validador declarado", "declared validator", "conjunto de validadores declarado"]
tags: [protocol, serialização, linhagem, validadores, segurança, v4]
modo: hub
fonte-canonica: docs/rfc-v4.md §2.3, Apêndice B
aparicoes-consolidadas:
  - caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5
dependencias:
  - [[serialization-por-linhagem]]
  - [[invariante-de-core]]
  - [[specification]]
  - [[linhagem-de-versoes]]
  - [[congelamento-escopado]]
  - [[aplicador-deterministico]]
  - [[comutativo-vs-nao-comutativo]]
---

# Validador Declarado

## Definição

**Validador declarado** é o conjunto ou regra de validadores que a `SPECIFICATION` de um ativo declara como responsáveis por serializar as operações não-comutativas daquela linhagem. É o mecanismo pelo qual o core sabe *quem* tem autoridade para finalizar uma operação — sem consultar código fixo ou um conjunto global.

Definido canonicamente no Apêndice B da `rfc-v4.md`:

> **Validador Declarado** — Conjunto/regra de validadores que a SPEC do ativo declara; fallback ao anel de custódia determinístico.

## Conteúdo normativo

O texto normativo completo — bloco YAML de política, modos `leader` vs. `quorum`, modelos de falta, lease, defaults por modalidade, e o raciocínio sobre por que a invariante não pode ser delegada à SPEC — está em:

> `rfc-v4.md §2.3` — *Serialização por Linhagem — a Invariante de Core*

A seção `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5` (Serialização por Linhagem v4) formaliza o mesmo conteúdo no contexto de governança. Leia as fontes diretamente para regras normativas.

## Resumo estrutural

### Como a SPEC declara o validador

Conforme `rfc-v4.md §2.3`, a `SPECIFICATION` que governa o ativo inclui um bloco de política:

```yaml
serialization:
  mode: "leader" | "quorum"
  set: [validator_ids…] | "custody_ring"
  k: N
  fault_model: "crash" | "byzantine"
  lease: { ttl, renew_quorum }   # apenas no modo leader
```

O campo `set` admite:

- **Lista fixa de `validator_ids`**: ex., agentes com `ASSET:ROLE=auditor` emitido por entidade X, ou o super peer corporativo.
- **`"custody_ring"`**: fallback determinístico baseado em `hash(entity_id)` sobre os agentes disponíveis — reutiliza a custódia da v3.1 para ativos cuja SPEC não declara nada explícito (P2P puro).

### Propriedade de determinismo da linhagem

A posse de uma linhagem por um validador é **determinística** — `hash(AA.entity_id)` mapeia para um agente do conjunto declarado — e nunca pega-quem-agarra-primeiro. Isso evita que dois validadores aprovem intents conflitantes gastando o mesmo `head`. Conforme `rfc-v4.md §2.4`, regra 4:

> A fila efêmera do grupo de validadores distribui *linhagens diferentes* entre os agentes (load-balancing) e sinaliza liveness; dentro de uma linhagem, sempre o mesmo dono.

### K=1 é o caso comum

Para a maioria dos ativos não-financeiros (cashback, fidelidade), `k=1`: um único validador serializa a linhagem. Casos financeiros ou de alta criticidade usam `quorum` com `K > N/2` (crash-fault) ou `K ≥ 2f+1, N ≥ 3f+1` (byzantine-fault).

### Relação com a invariante de core

O validador declarado é o executor da [[invariante-de-core]], mas a invariante em si é propriedade do core — não do validador. O core verifica se a evidência apresentada (≥K aprovações válidas do conjunto declarado, ancoradas ao `head` consumido via `SPENDS`) satisfaz a regra declarada; a colisão, se detectada, é falta forense com responsabilização direta dos assinantes.

Conforme `rfc-v4.md §5.1`:

> Auditor aleatório não pode ler saldo cifrado; o validador declarado **já é custódio com a chave** — é a razão pela qual K=5 auditores aleatórios (v3.1) foram substituídos por K=1 validador declarado (v4).

### Relação com partição e congelamento escopado

Quando o validador declarado (ou o quórum declarado) de uma linhagem está inalcançável, aquela linhagem **congela escopadamente** — apenas aquele ativo, não a rede inteira. Não há eleição de substituto sem cerco (mecanismo removido na v4). Ver [[congelamento-escopado]] e [[serialization-por-linhagem]].

### Finalização pelo aplicador determinístico

A aprovação pelo conjunto declarado não é suficiente para materializar a finalização — esta é responsabilidade do [[aplicador-deterministico]] (menor `entity_id` entre os aprovadores), que evita duplicação sob aprovação assíncrona com K>1.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-4-governance/03-specification-lifecycle-and-rfcs.md` | `§3.5` | Substituir referência local por resumo + wikilink `[[validador-declarado]]` |

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[linhagem-de-versoes]] | 1 | criado |
| [[specification]] | 1 | criado |
| [[congelamento-escopado]] | 8 | criado |
| [[serialization-por-linhagem]] | 9 | criado |
| [[invariante-de-core]] | 9 | criado |
| [[aplicador-deterministico]] | 9 | placeholder (onda 9) |
| [[comutativo-vs-nao-comutativo]] | 9 | placeholder (onda 9) |


