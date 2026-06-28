---
name: fato-negativo-verificavel
title: "Fato Negativo Verificável (v4)"
aliases: ["fato negativo verificável", "fato negativo", "negative verifiable fact", "Fato Negativo Verificável v4"]
tags: [protocol, economia, agente, v4, reputacao, defesa-sybil]
---

# Fato Negativo Verificável (v4)

> **Modo canonical** — fonte normativa: `rfc-v4.md §2.5`.
> Aparições consolidadas: `glossary.md §Fato Negativo Verificável (v4)`.

---

## Definição

**Fato negativo verificável** é um mau ato persistido no grafo como `CONTENT`
autocomprovável — re-checável por qualquer um — embutindo os objetos assinados
como prova. Acusação falsa é autopunitiva via `APPEAL` re-verificado.

> Definição canônica (`rfc-v4.md §2.5`, glossário):
>
> "Mau ato re-checável por qualquer um (assinatura inválida, duplo-sinal de
> validador), persistido como `CONTENT` autocomprovável; acusação falsa é
> autopunitiva via `APPEAL` re-verificado."

---

## O que persiste e o que não persiste

Conforme `rfc-v4.md §2.5` (tabela integral):

| Caso | O que persiste |
| :--- | :--- |
| **Rejeição honesta** (op inválida, validador recusa corretamente) | **Nada no grafo.** A op não finaliza; a UI mostra "falhou", o usuário corrige. Tentativa guardada só localmente (privado, não-replicado). |
| **Proponente malicioso** insistindo em ops inválidas | Apenas **reputação local** caindo em cada validador + rate-limit local. Sem fato de grafo. |
| **Validador se comporta mal** (assina op inválida, ou assina duas ops conflitantes no mesmo head) | **Único caso durável**: um `CONTENT` autocomprovável (a acusação verificável), autorado por quem detectou, embutindo os objetos assinados como prova. Consequência: caução cortada + reputação despenca (qualquer um re-verifica). |
| **Finalizações conflitantes** | **Impossível** sob o quórum recomendado (`K > N/2` / bizantino). Se ocorrer = política insegura ou conjunto comprometido além do limiar (`rfc-v4.md §5.2`). Persiste a evidência do conflito + corte das cauções. |

> Texto normativo integral: `rfc-v4.md §2.5`.

Princípio derivado: "rejeição honesta (incluindo erro de digitação de valor)
**não** gera marca forense permanente. Só o ato provável de uma parte
**caucionada** vai durável."

---

## Propriedades-chave

- **Autocomprovável**: o `CONTENT` carrega a prova embutida (os objetos
  assinados), dispensando testemunha extra.
- **Re-verificável por qualquer um**: qualquer peer pode re-checar a validade
  da acusação a partir dos dados inline.
- **Autopunitivo se falso**: uma acusação falsa é detectável via `APPEAL`
  re-verificado — o acusador mente e o fato se volta contra ele.
- **Sybil-resistant**: conforme `rfc-transacoes-multidominio.md §6.3`, "o fato
  negativo é Sybil-resistant igual (não é possível 'desver' desmentindo)".
- **Durável no grafo**: diferentemente dos scores subjetivos da [[reputacao-local]],
  que ficam locais e nunca são replicados, o fato negativo verificável integra
  os `nodes`/`edges` canônicos e é sincronizado.

---

## Contexto transacional

Conforme `rfc-transacoes-multidominio.md §6.2`:

> "Não-cumprimento até deadline = fato negativo verificável, durável, com
> prova para o ofendido."

E conforme `rfc-transacoes-multidominio.md §6.3`:

- **Com bond/caução:** o sistema corta o bond do não-cumpridor (cortesia executável).
- **Sem bond:** fato negativo verificável + rate-limit (ser marcado no grafo,
  receber menos prioridade de acesso).
- Punição só tem dente se há **custo estrutural de reputação** (bond) ou
  **custo de oportunidade** (rate-limit de acesso).

> Texto normativo integral para o mecanismo transacional: `rfc-transacoes-multidominio.md §6.2–6.3`.

---

## Relação com fatos forenses e invariante de core

Quando dois finalizadores produzem evidências conflitantes válidas — ataque de
dupla-finalização por validadores desonestos — a colisão é registrada como fato
negativo verificável. As assinaturas dos aprovadores são individuais (evidência
inline, não BLS agregado), permitindo responsabilização direta e corte de
caução. Ver [[invariante-de-core]] §"Colisões como fatos forenses".

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Fato Negativo Verificável (v4)` | substituir por link para este verbete |
| `rfc-transacoes-multidominio.md` | `§4.2`, `§6.2`, `§6.3` | menciona o conceito; manter — texto normativo do mecanismo transacional permanece na RFC |

---

## Conceitos relacionados

- [[reputacao-local]] — scores subjetivos ficam locais; só o fato negativo vai ao grafo
- [[desafio-canary]] <!-- Foam placeholder — verbete Onda 10 --> — mecanismo proativo de detecção de desonestidade do agente
- [[defesa-sybil]] <!-- Foam placeholder — verbete Onda 10 --> — o fato negativo é Sybil-resistant por não poder ser "desmentido"
- [[agente-de-sistema]] — sujeito cujo comportamento desonesto pode gerar um fato negativo
- [[invariante-de-core]] — dupla-finalização produz fato negativo como evidência forense
- [[bond-caucao]] <!-- Foam placeholder — verbete Onda 10 --> — caução que o fato negativo pode acionar para corte
- [[comutativo-vs-nao-comutativo]] — apenas operações não-comutativas exigem validadores caucionados
- [[content]] — tipo ontológico no qual o fato negativo é persistido (`CONTENT` autocomprovável)


