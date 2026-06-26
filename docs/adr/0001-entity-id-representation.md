# ADR 0001 — Representação de `entity_id`: tabela `entity_members` (canonical)

- **Status:** aceito (2026-06-25 — arquiteto, destrava T-108-rework-3 [M1])
- **Contexto:** T-108-rework-3 escalou a divergência entre spec original (coluna `entity_id` em
  `nodes`) e implementação entregue em T-108 (tabela separada `entity_members(node_id PK → entity_id)`).
- **Decisores:** arquiteto

## Problema

A spec T-108 §1 (linhas 73-91) prescrevia `entity_id` como coluna de `nodes`. A implementação
adicionou, em V2 de `packages/core/src/schema.ts`, a tabela `entity_members`:

```sql
CREATE TABLE entity_members (
  node_id    TEXT NOT NULL PRIMARY KEY REFERENCES nodes(id),
  entity_id  TEXT NOT NULL
);
CREATE INDEX idx_entity_members_entity ON entity_members(entity_id);
```

Auditando o código (`lineage.ts:88-93, 113-116`): o `entity_id` deriva do pai quando há pai, ou
do próprio `node.id` quando raiz; `entity_heads` (V2) já é keyed por `entity_id`. Logo, `entity_id`
é **invariante da entidade, não do nó** — pertence a uma relação 1:N entity→nodes, não a uma
coluna em `nodes`.

## Decisão

**Opção B (manter `entity_members`).**

Justificativa técnica:

1. **Forma normal.** `entity_id` é propriedade da entidade (1:N), não do nó armazenado. Colocá-lo
   como coluna em `nodes` duplica o valor em cada linha do grupo e exige redundância
   mantida. A tabela separada impõe (**PK em `node_id`**) que **1 nó pertence a exatamente 1 entidade**,
   invariante desejado e agora explicitamente normativo (ver §Invariante).
2. **JOINs já pagos.** `insertNode` (T-108) e `validateChain` já fazem a leitura via `entity_members`
   (lineage.ts:88,197). Não há novo custo.
3. **Future-proofing real (não especulativo).** Se entidades compostas ou multi-entity chegarem, a
   tabela separada as absorve sem migration disruptiva. Coluna em `nodes` exigiria migração de schema
   e reescrita de todos os índices.
4. **Alinhamento com `entity_heads`.** `entity_heads` já é keyed por `entity_id`. Manter o
   `entity_id` derivável por relação mantém o modelo interno consistente.

Invariante (normativo a partir deste ADR):

> **U1 — 1:1 nó→entidade.** Cada nó pertence a exatamente uma entidade. A `PRIMARY KEY` em
> `entity_members.node_id` impõe isso no schema. Raiz = a entidade é o próprio `node.id`.
> **U2 — Derivação canônica.** `entity_id` de um nó deriva do nó-raiz da sua linhagem (transitivo
> via `MUTATES` ou armazenado diretamente em `entity_members`).

## Alternativas consideradas

- **A — Reintroduzir coluna `entity_id` em `nodes`.** Rejeitada: viola 1NF (redundância mantida em
  código), aumenta custo de migration, perde o invariante 1:1 (coluna permite NULL ou divergência).
- **C — Híbrido (coluna virtual).** SQLite não suporta-coluna-virtual sem gere materializada via
  trigger, voltando ao problema de M2 (ver ADR 0002). Descartada.

## Consequências

- Atualização normativa apenas: spec T-108 §1 passa a declarar `entity_members` como representação
  canônica. Sem mudança de código (já implementado assim).
- `entity_members` é **relação normalizada estável** — imutável na v0 e na v1.
- Adiciona dependência fraca ao ADR 0002 (manutenção de `entity_heads` precisa saber que
  `entity_id` deriva por `entity_members`, que é mantida por `insertNode`).