---
name: desafio-canary
title: "Desafio Canary (v4)"
aliases: ["desafio canary", "canary challenge", "Desafio Canary v4", "canary"]
tags: [protocol, economia, agente, v4, reputacao, defesa-sybil]
---

# Desafio Canary (v4)

> **Modo hub** — este verbete resume e linka. Conteúdo normativo completo em
> `rfc-v4.md §2.7` e `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.6`.
> Aparições consolidadas: `glossary.md §Desafio Canary (v4)`.

---

## Definição

**Desafio canary** é uma tarefa de gabarito conhecido, indistinguível do trabalho
real, injetada proativamente pela rede para amostrar a integridade de um
[[agente-de-sistema]].

> Definição canônica (`rfc-v4.md` Apêndice B, glossário):
>
> "Tarefa de gabarito conhecido, indistinguível do trabalho real, para amostrar
> a integridade do agente. Forte no determinístico/storage/banda; fraco em
> compute não-determinístico."

O mecanismo complementa a auditoria reativa: em vez de só re-verificar o que o
agente *já fez*, a rede **testa proativamente** com estímulos sintéticos
(amostragem proativa, não só reativa).

---

## Força por regime de trabalho

Conforme `rfc-v4.md §2.7`:

| Trabalho | Desafio indistinguível? |
| :--- | :--- |
| Determinístico (assinatura, merge CRDT, regra Zen) | **Forte** — objeto sintético válido com resultado conhecido; qualquer um re-verifica o gabarito |
| Storage | **Forte** — desafio-resposta de retrievability (`hash(nonce ‖ byte-range)`) |
| Banda/serving | **Forte** — peer-sonda pede chunk; o agente não sabe que é sonda |
| Compute não-determinístico (IA) | **Fraco** — não dá para fabricar gabarito indistinguível |

> Texto normativo integral: `rfc-v4.md §2.7`.

---

## Honestidade e limites

Conforme `rfc-v4.md §2.7`:

> "Honestidade: **eleva o custo de trapacear, não o elimina** (risco *defeat
> device* se o desafio for distinguível por canal lateral)."

O emissor do desafio precisa de gabarito confiável:

- **Forte no determinístico** — re-verificável por qualquer um.
- **Forte em redes com autoridade** — suíte contínua de honeypots =
  **integridade-como-serviço**, vendável nas modalidades comerciais.
- **Fraco em compute não-determinístico bem desenhado** — vira mercado de
  reputação com disputa (ver `rfc-v4.md §5.2`).

O risco aceito de agente substituído por versão maliciosa é mitigado por
**detecção pós-hoc** (auditoria + canary), não por TEE/TPM (ver
`caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.6`).

---

## Consequências de falha

Um agente que falha o desafio canary:

1. Tem [[reputacao-local]] caindo em todo peer honesto que detectou a falha.
2. É despriorizado e perde remuneração.
3. Falhas graves (duplo-sinal, etc.) geram [[fato-negativo-verificavel]], durável
   no grafo e re-verificável por qualquer um.

O mecanismo é parte do modelo de detecção descrito em `rfc-v4.md §5.1`:

> "Agente adultera resultado verificável (merge, validação) → Auditoria +
> desafio canary detectam → Eficácia: Forte."

---

## Contexto de integridade-como-serviço

Conforme `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.6`:

> "Em redes com autoridade, a suíte contínua de honeypots é um recurso gerenciado
> (**integridade-como-serviço**)."

O princípio derivado: o agente é confiável para **orquestrar**, nunca para
**afirmar** o não-verificável.

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Desafio Canary (v4)` | substituir por link para este verbete |
| `caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | `§1.6` | menciona o conceito; manter — texto normativo de integridade do agente permanece no caderno |

---

## Conceitos relacionados

- [[agente-de-sistema]] — sujeito auditado pelo desafio canary
- [[reputacao-local]] — score que cai quando o agente falha o desafio
- [[fato-negativo-verificavel]] — mau ato grave persistido no grafo como consequência de desonestidade detectada
- [[defesa-sybil]] <!-- Foam placeholder — verbete Onda 10 --> — o desafio canary é parte da estratégia de defesa econômica
- [[contribuicao-verificavel]] — os regimes de trabalho que o canary amostra
- [[standing]] — perde-se standing ao ser detectado desonesto
- [[bond-caucao]] <!-- Foam placeholder — verbete Onda 10 --> — caução que pode ser cortada em caso de desonestidade comprovada
