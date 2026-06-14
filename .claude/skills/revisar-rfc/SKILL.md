---
name: revisar-rfc
description: Reconcilia UMA RFC com seu review — tria os achados, portão humano, e emenda
  a RFC com os aprovados. Invocar com o número/caminho, ex.: /revisar-rfc rfc-009.
model: sonnet
---
# Revisar $ARGUMENTS

Reconciliação pré-absorção de UMA RFC com `docs/rfc_reviews/review_rfc-NNN.md`.
NÃO absorve nos cadernos (isso é `/absorver-rfc`, etapa seguinte) nem deleta a RFC/review.

## 1. Triar
Despache `triador-review` para $ARGUMENTS. Ele grava `docs/rfc_reviews/_triagem-rfc-NNN.md`
e retorna o resumo. Atualize `_revisao-status.md`: status → `triada`.

## 2. PORTÃO de revisão
Apresente: contagens por veredito (INCORPORAR / JA-COBERTO / UI->INVENTARIO / REJEITAR /
REVISAR-HUMANO) e a **LISTA REVISAR-HUMANO** com a tensão de cada item.
PARE. Só prossiga com confirmação. Itens REVISAR-HUMANO são decididos pela sessão forte /
pelo usuário — nunca despachados ao emendador. Se o usuário aprovar texto para um deles,
edite a linha do manifesto para `INCORPORAR` antes de seguir.

## 3. Emendar
Despache `emendador-rfc` com o caminho do manifesto. Ele aplica as linhas `[ ]` com
veredito INCORPORAR/UI->INVENTARIO, marca `[x]`, e commita por RFC.

## 4. Atualizar tracker
`_revisao-status.md`: status → `emendada` (ou `concluida` se nada ficou pendente de humano).

## 5. Relatório
Relate: achados incorporados, linhas de UI no inventário, pendências humanas em aberto.
NÃO delete o review nem a RFC. PARE.
