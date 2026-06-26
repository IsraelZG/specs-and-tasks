# ADR 0005 — Aresta `MERGES` para resolução de forks (em vez de `MUTATES` multiparental)

- **Status:** aceito (2026-06-26 — arquiteto, resolve bloco B4 do rework-1 de T-601)
- **Contexto:** o achado B4 do Cycle 1 review da T-601 (2026-06-26) expôs uma contradição
  triway entre (a) a implementação do worker (1 aresta `MUTATES`), (b) o caderno-2 §4.2 canônico
  ("duas arestas `MUTATES`, uma de cada ponta"), e (c) a invariante U1 do rework-3 da T-108
  (`parentHash: NodeHash` único, multiparental direto exigiria `parentHash: NodeHash[]`).
- **Decisores:** arquiteto

## Problema

A especificação canônica atual (caderno-2-protocol/04-automerge-integration-spec.md §4.2,
fonte-canonica de fork-resolucao) exige que o nó de merge `C` seja criado com "duas arestas
`MUTATES` (uma de cada ponta do fork)" com hlc superior aos ramos. Há três problemas:

1. **Ambiguidade direcional.** A convenção `MUTATES` (mutates.md:24) é "source = nova versão →
   target = versão anterior". Aplicada a "B1→C" significaria "B1 é nova versão e C anterior", o
   inverso da intuição "merge consome B1 em C".
2. **Quebra do `parentHash` único.** Um merge multiparental (git DAG) com dois pais diretos
   `B1` e `B2` exigiria `UnsignedNode.parentHash: NodeHash[]`, revertendo o rework-3 da T-108
   recentemente mergeado e quebrando `insertNode`, `hashNode`, `canonicalizeNode`, `getLineage`.
3. **Conflito interno na T-601.** As regras 2 e 4 da própria spec T-601 exigiam pai único
   (`parentHash = hashNode(forkPoint)` e "duas `MUTATES` com mesmo source = forkPoint"), já
   contradizendo o caderno-2 §4.2.

## Alternativas consideradas

- **Opção 1 — Multiparental canônico (caderno-2 §4.2 literal):** estender `UnsignedNode.parentHash`
  para `NodeHash[]`, reverter parte do rework-3 da T-108. Custo alto em código; semântica CRDT
  correta mas desestabiliza o códigobase acabado de aterrissar.
- **Opção 2 — `MUTATES` único + 2ª aresta `MUTATES` duplicada do forkPoint:** a proposta do
  Parecer Ciclo 1 (Reading 1). Preserva `parentHash` único mas é semanticamente redundante (mesmo
  source e target) e não atesta quais ramos foram incorporados. Rejeita o caderno-2 canônico.
- **Opção 3 — 1 `MUTATES` apenas, emendar spec:** mais simples, mas perde totalmente auditoria
  de ramos e desestimula o caminho de replay/reconciliação. Rejeita caderno-2 e a T-601.
- **Opção 4 — Híbrido: 2 arestas branchTip→C via `MUTATES` + `parentHash` reinterpretado como
  "atestado do ancestral comum":** honra caderno-2 + preserva auditoria, mas parte a semântica
  de `parentHash` (pai imediato em nós normais vs ancestral comum em merges) — exige ADR, muda
  `getLineage(merge)` para seguir arestas ao invés de `parentHash`.
- **Opção 5 — Nova aresta estrutural `MERGES` (escolhida):** `C ──MUTATES──→ A` (continuação
  linear com `previous_hash`, `parentHash = hashNode(A)`) + `C ──MERGES──→ Bi` por ramo
  incorporado (atestado, sem `previous_hash`). Separa ontologicamente "continuação linear" de
  "incorporação de ramo concorrente".

## Decisão

**Opção 5 — `MERGES`.** Introduzida como nova aresta estrutural primitiva no catálogo ontológico,
com 6 invariantes formais (I-MERGES-1..6) documentados em caderno-2/02 §3.2 e em
[docs/conceitos/merges.md](../conceitos/merges.md).

## Justificativa

1. **Preserva o invariante U1 do rework-3 da T-108 sem reverter código recentemente estabilizado.**
   `parentHash` segue sendo `NodeHash` único; o merge tem `parentHash = hashNode(forkPoint)`
   como qualquer nó linear.
2. **Clareza ontológica.** `MUTATES` continua fazendo exatamente um papel (sucessão linear); o
   leitor do grafo não precisa inferir do contexto se um `MUTATES` é normal ou de merge.
3. **Auditoria completa.** A topologia preserva bifurcação (B1, B2) e reconvergência (C). Replays
   e replicações (RBSR) conseguem distinguir quais ramos entraram em `C` consultando `MERGES`.
4. **Compatibilidade com `entity_heads`.** `C` torna-se head por monotonicidade HLC; a projeção
   `entity_heads` (caderno-3/01 §3.1) não muda.
5. **Custo de implementação isolado.** Toda a mudança em código fica dentro de
   `packages/core/src/merge.ts` (rework-1). `insertNode`, `hashNode`, `canonicalizeNode`,
   `signature.ts` ficam intocados; `schema.ts` só precisa validar que `previous_hash` é nullable
   (oração já confirmada em caderno-3/01 §1).
6. **Peers desatualizados degradam benignamente** para "fork ativo" ao não reconhecer `MERGES` —
   não corrompem o grafo, sincronizam via RBSR sem interpretar a nova aresta.

## Trade-offs aceitos

- **Custo de processo:** introdução de nova primitiva exige atualização em 8 arquivos
  normativos (cadernos 2/01, 2/02, 2/04, 3/01, 5/01; verbetes mutates, fork-resolucao, merges
  novo) e este ADR. Custo pago nesta absorção (2026-06-26).
- **`detectStructuralFork` precisa aprender `MERGES`:** caso contrário, ramificações já
  incorporadas ficariam reportadas como "fork ativo" para sempre. Implementado na rework-1 de
  T-601, com novo teste "fork resolvido não é re-detectado".
- **Se uma futura versão do protocolo evoluir para multiparental real (git DAG), `MERGES` poderia
  ser posteriormente deprecated.** Hoje é mais expressiva e estável; o caminho de deprecação fica
  aberto para revisão futura.

## Riscos mitigados

| Risco | Mitigação |
| :--- | :--- |
| `MERGES` interpretado por peers desatualizados como aresta desconhecida, deadlock de sync | RBSR replica `type` desconhecido sem interpretar; degradação benigna |
| `previous_hash NOT NULL` na DDL de `edges` | Confirmado BLOB nullable em caderno-3/01 §1; I-MERGES-2 explicita NULL para `MERGES` |
| `MERGES` pode ser criado para nó que não é branchTip ativo do fork | I-MERGES-6 + validação em `resolveFork` (rework-1 test 13) |
| Resolução multi-fork (N ramos) pode causar explosão de arestas | O conhecimento referenciado (insertNode/resolveFork) N-merge=max-fill-rate; N ramos é situação excepcional e rara em prática (caderno-2 §4.2 diz que forks são exceção esperada como rara) |

## Referências cruzadas

- [RFC-028](../rfcs/rfc-028-aresta-merges.md) — documento de proposta original
- [T-601 §8.1](../../tasks/T-601.md) — achado B4 originário do Cycle 1 review
- [T-108 rework-3](../../tasks/T-108-rework-3.md) — baseline do invariante `parentHash: NodeHash`
  único que esta decisão preserva
- [caderno-2/01 §2.1](../caderno-2-protocol/01-graph-ontology.md) — catálogo de arestas
  estruturais permanentes (atualizado com `MERGES`)
- [caderno-2/02 §3.2](../caderno-2-protocol/02-cryptographic-lineage-and-auth.md) — invariantes
  I-MERGES-1..6
- [caderno-2/04 §4.2](../caderno-2-protocol/04-automerge-integration-spec.md) — mecânica de
  resolução de fork (passo 3 e 4 reescritos)
- [caderno-3/01 §1](../caderno-3-sdk/01-sqlite-and-projections-schema.md) — DDL `edges` com
  `type` aceitando `MERGES`, `previous_hash` nullable confirmado
- [caderno-5/01 §2.10.2](../caderno-5-transport/01-p2p-transport-and-reconciliation.md) — nota
  de degradação benigna em peers desatualizados
- [conceitos/mutates](../conceitos/mutates.md) e [conceitos/fork-resolucao](../conceitos/fork-resolucao.md)