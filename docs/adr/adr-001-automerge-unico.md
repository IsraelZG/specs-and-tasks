# ADR-001: Automerge como Trilha Única de CRDT (Depreciação do Y.js)

* **Status:** Aceita (anterior a qualquer tarefa de CRDT; pré-requisito de T-403/T-602).
* **Data:** 11/06/2026.

## Contexto

Previamente existia uma inconsistência e duplicidade na modelagem de CRDT entre Y.js (legado) e Automerge (especificação). O acúmulo de rascunhos e atualizações usando múltiplos motores de CRDT gerava complexidade desnecessária no ciclo de vida da memória e na replicação P2P.

## Decisão

Adota-se o [[automerge-repo]] como a biblioteca exclusiva de CRDT na plataforma, cobrindo dois papéis fundamentais:

1. **Transiente (RAM):** Micro-updates em RAM via ephemeral messages entre co-editores trabalhando no mesmo [[documento-casca]] (sem histórico persistido no grafo).
2. **Persistente (Grafo):** Acúmulo em `pending_changes`. No gatilho de consolidação definido pela `SPECIFICATION`, executa-se `Automerge.save(doc)` produzindo um nó-versão imutável assinado na tabela `nodes`, com arestas `MUTATES` e `AUTHORED`.

Todo o código legado de Y.js (`crdt-manager`, `yjs_updates`, `snapshots`) é **removido**, em vez de adaptado. As estruturas `pending_staging` e `CONTENT:AUDIT` legadas divergem do modelo normativo (`pending_changes` + sumário em `AUTHORED`) e são inteiramente substituídas.

## Consequências

- Nenhuma nova tarefa ou módulo introduzirá dependência de Y.js.
- O ciclo de vida e sincronização de dados colaborativos passam a ser unificados sob o motor do Automerge.


