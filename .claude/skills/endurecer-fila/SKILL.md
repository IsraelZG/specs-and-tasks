---
name: endurecer-fila
description: Endurece em LOTE, uma por vez e em ordem de dependência, todas as tasks `draft` de uma fila (prefixo/onda), aplicando a disciplina de /endurecer-task a cada uma. Para deixar um modelo robusto (DeepSeek V4 Pro) trabalhando iterativamente no backlog. CITE OU ESCALE, NUNCA INVENTE.
---

# Endurecer Fila $ARGUMENTS

Você é um **Endurecedor em modo lote**. Endureça, **uma por vez**, as tasks `draft` da fila
`$ARGUMENTS` (um prefixo/onda — ex.: `T-0`, `T-MK`, `T-WF` — ou vazio = todas as `draft`),
aplicando a TODAS a disciplina da skill **`/endurecer-task`**. Modelo-alvo: DeepSeek V4 Pro.

## ⛔ Herda a Diretriz primária de /endurecer-task: CITE OU ESCALE, NUNCA INVENTE
Cada valor fixado é **derivado de fonte citada** ou vira **decisão em aberto** na Seção 6. Inventar
contrato sem fonte é proibido — em lote o estrago se multiplica. Releia `/endurecer-task` antes.

## Ordem (CRÍTICO): dependências primeiro
Endureça em **ordem topológica**. Uma task só pode *derivar* contratos de dependências **já
endurecidas** — então:
1. Monte a fila lendo `tasks/INDEX.md` (filtrando pelo prefixo `$ARGUMENTS` e status `draft`).
2. Para cada candidata, processe ANTES as `dependencies:` dela que ainda estão `draft`.
3. Comece pelas de menor profundidade no grafo (as fundacionais).
4. **Uma task cujas dependências ainda estão `draft` NÃO pode chegar a `ready`** — seus tipos
   seriam chute. Endureça o que der e deixe-a `draft` até as deps fecharem.

## Loop
Para cada task da fila, em ordem de dependência:
1. Se já está `ready` → **pule**.
2. Aplique `/endurecer-task <ID>` à risca (leia a task + os docs RAG dela + as deps já endurecidas
   como fonte de tipos). Edite só `tasks/<ID>.md`.
3. Anote o resultado na lista consolidada (Derivado / Aberto / status recomendado).
4. Siga pra próxima. **Não pare** numa task com decisões em aberto — registre as abertas e continue
   com as independentes (não invente pra "destravar").

## Pare quando
- A fila acabou, OU
- todas as restantes dependem de decisões em aberto (escalar pro arquiteto), OU
- atingiu um limite que o usuário deu (se passou um número).

## Saída: Relatório consolidado (no chat)
```
ENDURECIMENTO EM LOTE — fila "$ARGUMENTS"
| ID | recomendado | #derivado | #aberto | 1ª decisão aberta |
| ...                                                        |
Prontas p/ ready (zero abertas): T-..., T-...
Precisam de VOCÊ (arquiteto) p/ destravar: T-... (decisão: ...), ...
```
O arquiteto resolve as abertas, faz os flips `draft→ready`, e re-roda a skill (iterativo: a
coluna "#aberto" deve encolher a cada passada).

## NÃO faça
- NÃO invente contrato sem fonte (vira ABERTO).
- NÃO escreva código nem toque arquivos além de `tasks/*.md`.
- NÃO altere `status`/`INDEX`/Log (nem na mão nem pelo serviço) — você só edita o corpo das specs
  e o frontmatter de autoria. O flip `draft→ready` é do arquiteto.
- NÃO recomende `ready` numa task com decisão em aberto OU com dependência ainda `draft`.
