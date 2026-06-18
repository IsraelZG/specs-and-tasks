---
title: "Oráculo (Ponte BaaS)"
slug: oraculo-baas
aliases: ["oráculo", "ponte BaaS", "validador-ponte-BaaS", "oráculo de fato externo"]
tags: [protocol, transações, multidomínio, baas, oráculo, confiança, v4]
modo: canonical
fonte-canonica: docs/rfc-transacoes-multidominio.md §2, §7
aparicoes-consolidadas:
  - glossary.md §Oráculo (Ponte BaaS)
dependencias:
  - [[saga]]
  - [[asset-lock]]
  - [[linhagem-de-versoes]]
  - [[invariante-de-core]]
  - [[serialization-por-linhagem]]
---

# Oráculo (Ponte BaaS)

## Definição

**Oráculo (Ponte BaaS)** é o validador que afirma ao grafo um fato gerado fora dele — tipicamente o resultado de uma transação em um sistema de pagamento ou Backend-as-a-Service (BaaS) externo.

É a **única classe de afirmação que o grafo aceita sem verificação criptográfica interna**: o fato vive fora do grafo, portanto o grafo não pode prová-lo nem refutá-lo por si mesmo. O oráculo é, por definição, *trusted input*.

## Contexto: por que o oráculo existe

Em uma [[saga]] multidomínio que envolve uma perna externa (BaaS, processadora de pagamentos, sistema legado), a perna externa continua cross-domínio mesmo quando o restante da operação degenera em single-domain (ver `rfc-transacoes-multidominio.md §7`). Não há como aplicar a [[invariante-de-core]] de [[serialization-por-linhagem]] sobre um sistema externo opaco.

O oráculo é o adaptador entre o mundo externo e o grafo: recebe a confirmação ou rejeição do sistema externo e a publica como um fato durável na linhagem correta.

### Exemplo canônico (checkout fiat ⊗ estoque)

Conforme `rfc-transacoes-multidominio.md §2.3`:

> 1. Cliente inicia compra → authorize no BaaS (terceiro, oráculo).
> 2. Sistema recebe confirmação BaaS → debita estoque local.
> 3. BaaS falha pós-authorize → compensação local reverte estoque.
> 4. Estoque falha pós-authorize-BaaS → compensação BaaS (chargeback ou reversal) via oráculo.

## Propriedades normativas

O texto normativo completo — posição do oráculo na topologia de saga, ausência de verificação criptográfica e mecanismos de mitigação — está em:

> `rfc-transacoes-multidominio.md §7` — Degeneração Sob Autoridade Forte

Pontos centrais extraídos literalmente da fonte:

- O **validador-ponte-BaaS é um oráculo** — a única classe de afirmação que o grafo aceita sem verificar (fato vive fora do grafo).
- Mitigado por **bonding/redundância de oráculos** (vários bridges, votação) — não por cripto; oráculo por definição é trusted input.
- Em deployments corporativos, a exceção BaaS é a perna que permanece cross-domínio mesmo após a degeneração das demais pernas em single-domain.

## Modelo de confiança e mitigação

O oráculo **não é confiável por construção criptográfica**; é confiável por contrato social, bonding e redundância:

| risco | mitigação |
|:---|:---|
| Oráculo adultera resultado | Redundância: múltiplos bridges votam; maioria decide. |
| Oráculo fica offline | TTL do [[asset-lock]] expira; saga aborta automaticamente. |
| Oráculo forja autorização BaaS | [[bond-caucao|Bond/caução]] do operador; [[fato-negativo-verificavel|fato negativo verificável]] no grafo. |

Não há mecanismo criptográfico que force o BaaS a agir corretamente; a dissuasão é ex-post (reputação, bond) conforme `rfc-transacoes-multidominio.md §6`.

## Posição no fluxo de saga

```
[Iniciador]
    │
    ▼
ASSET:LOCK (leg interna) ──── validado por linhagem interna
    │
    ▼
[Oráculo BaaS] ──── chama API externa
    │
    ▼
Resultado externo (authorize / reject / timeout)
    │
    ▼
Fato publicado na linhagem ──── consome lock / emite compensação
```

O oráculo opera como um [[profile-system]] especializado — um [[agente-de-sistema]] que age em nome de um domínio mas relata fatos de outro. Não se confunde com o [[validador-declarado]]: o validador serializa operações da própria linhagem; o oráculo atesta fatos externos ao domínio.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Oráculo (Ponte BaaS)` | Substituir por wikilink `[[oraculo-baas]]` |

## Dependências

| slug | onda | status |
|:---|:---|:---|
| [[linhagem-de-versoes]] | 1 | criado |
| [[invariante-de-core]] | 9 | criado |
| [[serialization-por-linhagem]] | 9 | criado |
| [[asset-lock]] | 3 | criado |
| [[saga]] | 9 | criado |
| [[profile-system]] | 3 | criado |
| `agente-de-sistema` | 10 | onda futura |
| `bond-caucao` | 10 | onda futura |


