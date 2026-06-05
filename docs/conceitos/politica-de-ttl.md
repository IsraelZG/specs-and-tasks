---
title: Política de TTL
aliases:
  - politica-de-ttl
  - TTL policy
  - ttl_policy
tags:
  - protocol
  - transacoes
  - onda-9
---
# Política de TTL

> Definição canônica — fonte única. Em qualquer outro doc, escreva [[politica-de-ttl]] em vez de redefinir.

## Definição

Política de TTL é a estratégia, declarada na SPEC de cada processo de saga ou 2PC, que governa como o prazo de expiração de um [[asset-lock]] é calculado e renovado. A política é selecionável por processo — não é um default global — e determina quando o lock expira automaticamente na ausência de confirmação explícita, funcionando como mecanismo de compensação automática. Há quatro variantes: `fixed`, `per_leg`, `renewable_lease` e `risk_scaled`.

## Por quê → [[caderno-1-vision]]

Consistência cross-domínio é um padrão de composição, não uma primitiva. Ao expor a política de TTL como configuração da SPEC, o protocolo permite que cada fluxo escolha o equilíbrio entre latência de confirmação e risco de contenção sem impor garantias tudo-ou-nada caras. Ver `caderno-1-vision/01-vision-and-positioning.md §2.1` (pragmatismo topológico) e `rfc-transacoes-multidominio.md §1`.

## Contrato → [[caderno-2-protocol]]

Definição normativa completa em **`rfc-transacoes-multidominio.md §5` e §5.1**. Resumo das quatro variantes:

| Política | Comportamento |
|:---|:---|
| `fixed` | TTL constante declarado na SPEC; determinístico, auditável. |
| `per_leg` | TTL distinto por perna; deadline efetivo = mínimo das pernas abertas. |
| `renewable_lease` | Agente mantém vivo via heartbeat efêmero; teto rígido de lifetime obrigatório (anti-grief). |
| `risk_scaled` | TTL dinâmico por valor ou contenção do recurso; requer projeção local de demanda. |

**Bloco de configuração SPEC** (canônico em `rfc-transacoes-multidominio.md §5.5`):

```yaml
saga:
  mode: "saga" | "2pc"
  ttl_policy: "fixed" | "per_leg" | "renewable_lease" | "risk_scaled"
  ttl: 60000                    # ms (para fixed)
  legs: [...]                   # (para per_leg)
  lease:
    ttl: 10000
    renew_via: "ephemeral"
    max_lifetime: 600000        # teto rígido
  scale:
    by: "value" | "contention"
    min_ttl: 30000
    max_ttl: 300000
  compensation: "compensating_entry"
```

**Invariantes transversais** (canônico em `rfc-transacoes-multidominio.md §5.1`):

- Adjudicação pelo **validador-dono da linhagem do lock**, contra o relógio dele ([[hlc]]). Não há oracle de tempo global; skew limitado por `MAX_DRIFT` (ver `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.5.4`).
- **Corrida confirm-vs-expira**: ambas as operações serializam pela regra de [[serialization-por-linhagem]] (v4 §2.3); apenas uma finaliza.
- No P2P puro, o peer que criou o lock é o juiz de sua expiração. Em rede corporativa, o validador é o servidor (relógio sincronizado).

Relacionamentos:
- Política de TTL é um atributo do [[saga]] (Tier 1) e do [[2pc-com-lock-ttl]] (Tier 2).
- A expiração opera sobre o [[asset-lock]].
- A corrida confirm-vs-expira é resolvida via [[serialization-por-linhagem]].
- A linhagem de coordenação que enquadra a saga é descrita em [[linhagem-de-coordenacao]].

<!-- TODO(revisar): §5.1.2 menciona "op normal de consumo" e "sinal de morte/lápide" — confirmar terminologia exata contra rfc-transacoes-multidominio.md §5.1.2 na Fase 3. -->

## Implementação → [[caderno-3-sdk]]

Nenhuma seção SDK específica para política de TTL identificada no inventário. O lock em si é projetado via [[asset-lock]] e rastreado na tabela `asset_balances` / `retention-state` (`caderno-3-sdk/01-sqlite-and-projections-schema.md §3.3`).

## Evolução → [[caderno-4-governance]]

Política `renewable_lease` com teto rígido foi introduzida para mitigar grief em processos longos (colaboração de documentos). A dinâmica `risk_scaled` permanece experimental e sujeita a gaming local — ver `rfc-transacoes-multidominio.md §5.4`.

## Aparições a consolidar

- `glossary.md §Política de TTL` — linha 157: parágrafo de definição. Substituir por [[politica-de-ttl]].
