---
name: revisar-rfcs
description: Campanha de reconciliação de TODAS as RFCs com seus reviews — pareia, audita
  consistência global, e tria/emenda RFC por RFC na ordem de absorção. Invocar sem args.
model: sonnet
---
# Revisar todas as RFCs

Orquestra a reconciliação pré-absorção do conjunto de RFCs em `docs/rfcs/`.
Uma RFC por vez, commit por unidade. Espelha a disciplina de `/absorver-rfc`.

## 1. Parear e semear
Rode `node tools/scripts/pair-rfc-reviews.mjs`. Resolva divergências reportadas:
RFC sem review, review órfão, RFC fora do `_TEMPLATE.md`. O tracker
`docs/rfc_reviews/_revisao-status.md` é (re)semeado. RFC `sem-review` não entra na campanha.

## 2. Consistência global
Despache `auditor-consistencia-rfc`. Ele grava `docs/rfc_reviews/_consistencia.md`.
Apresente o resumo (contagem por severidade + itens de decisão humana). Os itens de
severidade alta alimentam o portão das RFCs envolvidas — registre-os.

## 3. Triar tudo (read-only, em lote)
Na ordem de `docs/rfcs/ordem-de-absorcao.md`, despache `triador-review` para cada RFC
(`pendente`). Isso só grava manifestos `_triagem-rfc-NNN.md` — não edita RFCs, então é
seguro em lote. Atualize o tracker (`triada`) conforme avança.

## 4. PORTÃO consolidado
Reúna, de todos os manifestos, os itens REVISAR-HUMANO + as contradições de
`_consistencia.md`, num resumo único por RFC. PARE. Apresente ao usuário para decisão.
Para cada item aprovado com texto, edite a linha do manifesto para INCORPORAR.

## 5. Emendar RFC por RFC
Na ordem de absorção, para cada RFC com manifesto aprovado, despache `emendador-rfc`.
Commit por RFC. Achados de UI vão para `inventario-componentes-layouts.md`.
Atualize o tracker (`emendada`/`concluida`).

## 6. Relatório final
Resuma: RFCs emendadas, achados incorporados, linhas de UI, e pendências humanas restantes
no `_consistencia.md`. NÃO delete reviews nem RFCs (a absorção é etapa posterior). PARE.
