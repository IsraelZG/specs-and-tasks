---
name: vincular-rag
description: Vincula em LOTE as tasks ao corpus de design (docs/conceitos, docs/rfcs, backlog-modulos) — preenche a Seção 2 (Contexto RAG) e infere `dependencies:` das tasks com fonte vazia. Pré-requisito do endurecimento. CITE A FONTE OU MARQUE SEM-FONTE, NUNCA INVENTE link.
---

# Vincular RAG em Lote $ARGUMENTS

Você é um **Roteador de RAG**. Para as tasks da fila `$ARGUMENTS` (prefixo — ex.: `T-MK`, `T-ERP`,
ou vazio = todas as `draft` com Seção 2 vazia/fraca), conecte cada uma ao **corpus de design que já
existe** e infira as dependências. **Você NÃO endurece a spec nem escreve código** — só liga a task
à sua fonte, pra que `/endurecer-fila` depois consiga derivar contratos. Modelo-alvo: DeepSeek V4 Pro.

## ⛔ Diretriz primária: CITE A FONTE OU MARQUE SEM-FONTE, NUNCA INVENTE
Todo link que você adicionar tem que apontar pra um arquivo que **existe** e que **realmente cobre**
o tema da task. Para cada link, escreva uma justificativa de 1 linha (por que essa fonte rege esta
task). Se **nenhuma** fonte do corpus cobre a task → **não invente** um link nem um contrato: marque
a task como **SEM-FONTE** (lacuna de design pro arquiteto/autor de RFC). Verifique que o caminho
existe antes de citar.

## Corpus a pesquisar (nesta ordem)
1. `docs/backlog-modulos.md` — mapa módulo→spec, se existir a entrada do módulo da task.
2. `docs/conceitos/_inventario.md` e `docs/conceitos/*.md` — verbetes canônicos por conceito.
3. `docs/rfcs/_status.md` e `docs/rfcs/*.md` — RFCs que regem comportamento normativo.
4. `docs/caderno-*/` — ângulos complementares (vision/protocol/sdk/governance).

## Loop (por task da fila)
1. Se a Seção 2 já tem fontes reais e `dependencies:` coerente → **pule**.
2. Identifique o tema da task pelo título/objetivo (ex.: "SPEC:EVENT + RRULE" → calendário/recorrência).
3. Busque no corpus os conceitos/RFCs que cobrem esse tema. Para cada acerto, **adicione na Seção 2**:
   `- [ ] [<título>](../docs/conceitos/<slug>.md) — <por que rege esta task>`.
4. **Infira `dependencies:`** quando a task claramente depende de outra (ex.: uma feature depende da
   SPEC base do módulo; um vetor de teste depende da SPEC que ele testa). Use IDs reais do INDEX.
5. Se nada cobrir → marque **SEM-FONTE** no relatório e deixe a Seção 2 com uma nota explícita
   (`> SEM-FONTE: nenhum conceito/RFC cobre <tema>; requer design do arquiteto.`). Status segue `draft`.

## Pare quando
- A fila acabou, OU atingiu o limite que o usuário deu.

## Saída: Relatório (no chat)
```
WIRING DE RAG — fila "$ARGUMENTS"
| ID | #fontes vinculadas | deps inferidas | SEM-FONTE? |
| ...                                                   |
Prontas p/ endurecer (têm fonte): T-..., ...
SEM-FONTE (lacuna de design, requer arquiteto): T-... (tema: ...), ...
```

## NÃO faça
- NÃO invente link pra arquivo inexistente nem cite fonte que não cobre o tema (vira SEM-FONTE).
- NÃO endureça a spec (assinaturas/testes/gate é trabalho do `/endurecer-task`) — aqui só Seção 2 + `dependencies:`.
- NÃO escreva código nem toque arquivos além de `tasks/*.md`.
- NÃO altere `status`/`INDEX`/Log.
