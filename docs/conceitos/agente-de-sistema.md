---
name: agente-de-sistema
title: "Agente de Sistema (v4)"
aliases: ["PROFILE:SYSTEM agent", "system agent", "agente de sistema v4"]
tags: [protocol, economia, agente, v4, infraestrutura]
---

# Agente de Sistema (v4)

> **Modo hub** — este verbete resume e linka. Conteúdo normativo completo em
> `rfc-v4.md §1` e `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.6`.
> Aparições consolidadas: `glossary.md §Agente de Sistema (v4)`.

---

## Definição

O **agente de sistema** é uma instância de [[profile-system]] (`PROFILE:SYSTEM`)
que roda no device do humano, porém **codificada para servir a rede** — não o
dono do device (que pode ser malicioso).

> Definição canônica (`rfc-v4.md §1.1`):
>
> "Um processo que roda **no device do humano, mas codificado para servir a rede,
> não o dono do device**. O agente otimiza descoberta, replicação e validação, e
> é o ponto natural de orquestração por ser o mesmo código em todo lugar."

A linha que organiza o modelo v4:

> **O agente é confiável para *orquestrar*, nunca para *afirmar* aquilo que não
> é verificável de forma independente.**

---

## Por que "mais confiável" — e por que não é tamper-proof

O agente roda em hardware potencialmente hostil; a plataforma descartou TEE/TPM.
Três razões operacionais justificam a confiança relativa (ver texto normativo em
`rfc-v4.md §1.2`):

1. Mesmo código reproduzível em todo lugar — comportamento honesto é barato de checar.
2. Não tem incentivo armazenado alinhado ao humano dono.
3. A rede só paga e confia nele nas dimensões que consegue verificar.

Um agente adulterado é detectado *pós-hoc*: falha [[desafio-canary]] <!-- Foam placeholder — verbete Onda 10 -->, perde reputação local e deixa de ser remunerado.

---

## Integridade sem TEE

Conforme `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.6`, a
integridade é tratada por **detecção pós-hoc**, não por proteção de hardware:

1. Auditoria do que fez (reexecução determinística onde aplicável).
2. **Desafios "canary"**: tarefas de gabarito conhecido, indistinguíveis do
   trabalho real, injetadas proativamente. Fortes para trabalho determinístico,
   storage e banda; fracos para compute não-determinístico (IA).

Em redes com autoridade, a suíte contínua de honeypots é um recurso gerenciado
(**integridade-como-serviço**).

> Texto normativo integral: `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.6`.

---

## Papel na eleição de committer (v4)

Como todo device roda um agente de sistema, a eleição de committer colapsa para
**sempre determinística entre agentes** (ver `rfc-v4.md §2.2`):

- **Escrita [[comutativo-vs-nao-comutativo|comutativa]]**: agente local commita;
  desempate pelo menor `entity_id` ativo no ciclo.
- **Escrita não-comutativa**: roteada ao validador declarado da linhagem.

Não há mais eleição de líder global nem quórum de emergência a 2/3.

---

## Princípios derivados

Ver tabela completa em `rfc-v4.md §1.3`. Resumo dos princípios centrais:

| Princípio | Implicação |
|:---|:---|
| Orquestração otimista, afirmação verificada | O que persiste/remunera é verificado |
| Rigor proporcional à sensibilidade ontológica | Comutativo = otimista; financeiro = serializado |
| Invariante no core, política na SPEC | A SPEC escolhe a fechadura; o core garante o trancamento |
| Medir é do core; liquidar é do módulo | A rede mede; converter em crédito é decisão de SPEC |

---

## Conceitos relacionados

- [[profile-system]] — tipo ontológico do agente; define chaves, arestas e comunicação interna
- [[comutativo-vs-nao-comutativo]] — divisão fundamental que determina o papel do agente em cada escrita
- [[desafio-canary]] <!-- Foam placeholder — verbete Onda 10 --> — mecanismo de auditoria pós-hoc do agente
- [[contribuicao-verificavel]] <!-- Foam placeholder — verbete Onda 10 --> — o que o agente reporta à rede
- [[serialization-por-linhagem]] — mecanismo que o agente executa para escritas não-comutativas
- [[reputacao-local]] — consequência da detecção de desonestidade do agente


