---
name: absorver-rfc
description: Absorve UMA RFC nos cadernos/conceitos — roteia, revisa, despacha
  incorporadores baratos por subtask, audita e deleta a RFC. Invocar com o caminho,
  ex.: /absorver-rfc docs/rfcs/rfc-005.md
---
# Absorver $ARGUMENTS

## 1. Rotear
Despache `rfc-roteador` para $ARGUMENTS. Ele grava o manifesto e retorna o resumo.

## 2. PORTÃO de revisão
Apresente: total de subtasks, n haiku, n revisar-humano, e a LISTA DE SUPERSESSÕES.
PARE. Só prossiga com confirmação. As subtasks revisar-humano são tratadas pela
sessão forte / pelo usuário — nunca despachadas ao incorporador.

## 3. Executar (barato, sequencial, idempotente)
Para cada subtask executor=haiku com status [ ], na ordem do manifesto:
- Despache `incorporador` com os campos da linha.
- Ao concluir, marque [x] no manifesto.
- Pule linhas já [x] (permite retomar após /clear).

## 4. Auditar
Despache `auditor-wiki` sobre docs/.

## 5. Relatório e deleção
Relate: subtasks feitas, supersessões pendentes de revisão humana, achados do auditor.
DELETE a RFC (`git rm $ARGUMENTS`) SOMENTE quando TODAS as subtasks (inclusive
revisar-humano) estiverem [x]. Enquanto houver pendência, mantenha a RFC.
PARE.

