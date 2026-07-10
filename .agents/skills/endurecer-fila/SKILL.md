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

## Dois passes (POLÍTICA): triagem cedo, profundo just-in-time
Endurecer **tudo-fundo no início** é trabalho que você refaz — a task que executa por último foi
escrita quando a fundação dela ainda não existia, então só podia citar contrato vago. Por isso:
- **Pass 1 — triagem (este lote, cedo, raso):** para cada task, classifique no gate de 4 destinos
  do `/endurecer-task` (`draft:hardened` se já dá / `draft:pending_decision` / `draft:decomposed` / `draft:triaged`) e atribua
  `capacity_target`. O valor é pegar **decisões abertas e spikes cedo** — não escrever assinaturas que
  ainda não pode saber. Tasks sem deps reais ainda → ficam `draft:triaged`.
- **Pass 2 — profundo (JIT, depois, fora deste lote):** roda task-a-task pelo `/endurecer-task`
  quando as deps já estão `done` (ver candidatas em `node tools/scripts/hardening.mjs`).

## Ordem (CRÍTICO): dependências primeiro
Endureça em **ordem topológica**. Uma task só pode *derivar* contratos de dependências **já
endurecidas** — então:
1. Monte a fila lendo `tasks/INDEX.md` (filtrando pelo prefixo `$ARGUMENTS` e tasks `draft:*`).
2. Para cada candidata, processe ANTES as `dependencies:` dela que ainda estão `draft:*`.
3. Comece pelas de menor profundidade no grafo (as fundacionais).
4. **Uma task cujas dependências ainda estão `draft:*` NÃO pode chegar a `draft:hardened`** — seus tipos
   seriam chute. Marque `draft:triaged` e deixe até as deps fecharem (pass 2).

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
**Ao final do lote, rode o painel** e cole a saída: `node tools/scripts/hardening.mjs $ARGUMENTS`.

**Persiste o lote — ENFILEIRE, não comite** (agentes não rodam git no Docs; ver Paralelismo no
AGENTS.md). Enfileire UMA intenção com todas as tasks que editou (a 1ª é o id, as demais são paths
extras): `node tools/scripts/fila.mjs add T-301 "chore(endurece): lote $ARGUMENTS — N tasks"
tasks/T-302.md tasks/T-303.md`. Um `/drenar-fila` commita+pusha depois.

O arquiteto então resolve as decisões abertas com `/arquiteto-decisoes` e promove os hardened com
`/arquiteto-promover` (o flip `draft→ready` agora é automatizado pelo serviço, não manual). Re-rode
esta skill iterativamente — "#aberto" e o nº de `triaged` devem encolher a cada passada/onda.

## NÃO faça
- NÃO invente contrato sem fonte (vira ABERTO).
- NÃO escreva código nem toque arquivos além de `tasks/*.md`.
- NÃO altere `status`/`INDEX`/Log (nem na mão nem pelo serviço) — você só edita o corpo das specs
  e o frontmatter de autoria. O flip `draft→ready` é do arquiteto.
- NÃO recomende `ready` numa task com decisão em aberto OU com dependência ainda `draft`.
