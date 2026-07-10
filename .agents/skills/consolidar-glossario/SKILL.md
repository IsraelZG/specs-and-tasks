---
name: consolidar-glossario
description: Colapsa docs/glossary.md em _moc.md com passo de resgate preciso
  (sem perder definições, sem criar verbetes desnecessários), reescreve links
  de entrada e deleta o glossário. Rotina única — não chamar duas vezes.
---
# Colapsar o glossário em _moc

NÃO delete o glossário antes de concluir todos os passos.
NÃO crie verbetes de resgate para termos sem ★ que sejam apenas aliases ou
subtipos já cobertos por um verbete-pai — eles viram entrada no `_moc` com
link para o verbete-pai.

---

## Passo 1 — TRIAGEM (read-only, não edita nada ainda)

Para cada entrada de `docs/glossary.md`, classifique em uma das quatro categorias:

**CAT-1 — Verbete existe:** `docs/conceitos/<slug>.md` existe.
→ Ação: entrada do glossário vira `[[slug]]` no `_moc`. Nada a criar.

**CAT-2 — Sem verbete, mas definida canonicamente num caderno:**
a definição real está numa seção de um caderno (não só mencionada).
→ Ação: entrada do glossário vira `[[caderno#secao]]` no `_moc`.
Nada a criar. O consolidador vai ancorar a seção do caderno quando ele passar.

**CAT-3 — Só existe no glossário, mas é alias/subtipo de verbete existente:**
ex.: "CONTENT:PERSONAL_DATA" sem verbete próprio, mas coberto por
`[[content]]` ou `[[asset-consent]]`.
→ Ação: entrada do glossário vira `[[verbete-pai]] (subtipo: termo)` no `_moc`.
Adicione o termo como alias no frontmatter do verbete-pai.
NÃO crie verbete novo.

**CAT-4 — Só existe no glossário, definição real, sem cobertura em outro lugar:**
o glossário é a única fonte e o conceito não é alias nem subtipo trivial.
→ Ação: CRIE um verbete fino canônico via `criador-verbete` antes de continuar.
Esses são os resgates verdadeiros — devem ser poucos (alvo: ≤ 5).

Produza a tabela de triagem completa antes de executar qualquer edição:
`| termo | slug | CAT | destino no _moc | ação |`

**PORTÃO:** se CAT-4 tiver mais de 5 entradas, PARE e reporte.
Muitos resgates indicam que o inventário estava incompleto — revise antes
de prosseguir.

---

## Passo 2 — RESGATES (só CAT-4)

Para cada entrada CAT-4, despache `criador-verbete`:
"Crie verbete fino para <termo>. Modo: canonical. Fonte única: glossary.md §<termo>.
Sem aparições a consolidar. Commit: wiki: verbete-resgate <slug> (fase 3)."

Aguarde cada um antes de chamar o próximo (sequencial).

---

## Passo 3 — GERAR `_moc`

Escreva `docs/conceitos/_moc.md` com base na tabela de triagem:

```markdown
# Mapa de Conceitos (MOC)

Índice canônico. Cada linha leva à definição autoritativa.
Gerado na Fase 3 a partir do glossário consolidado.

## [Grupo por tipo, ex: Ontologia, Acesso, Sync, Workers...]

- [[slug]] — glosa de uma linha      ← CAT-1
- [[caderno#secao|termo]] — glosa    ← CAT-2
- [[verbete-pai]] (subtipo: termo)   ← CAT-3
```

NÃO inclua definições no `_moc` — só links e glosas de uma linha.

---

## Passo 4 — REESCREVER LINKS DE ENTRADA

Em todo o repo (excluindo `docs/glossary.md` e `docs/conceitos/_*`), substitua:
- `[termo](../glossary.md#ancora)` → `[[slug]]`
- `[glossário](../glossary.md)` genérico → `[[_moc]]`
- `glossary.md#<ancora>` em wikilinks → `[[slug]]` correspondente

Use Grep para encontrar todas as ocorrências antes de editar.

---

## Passo 5 — DELETAR o glossário

`git rm docs/glossary.md`

---

## Passo 6 — COMMIT E AUDITORIA

`git add -A && git commit "wiki: colapsa glossário em _moc (fase 3)"`

Despache `auditor-wiki` sobre `docs/`.

Relate:
- Tabela de triagem (contagem por categoria)
- Verbetes de resgate criados (CAT-4)
- Aliases adicionados a verbetes-pai (CAT-3)
- Achados do auditor pós-deleção
- Links quebrados novos (se houver)

PARE — aguarde confirmação.

