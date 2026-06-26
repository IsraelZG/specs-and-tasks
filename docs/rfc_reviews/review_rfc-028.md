# Review rfc-028-aresta-merges.md

> **Data:** 2026-06-26
> **Revisor:** arquiteto (auto-revisão inline — sessão de escrita da própria RFC)
> **Veredito global:** APROVADO COM EMENDAS — todas as emendas já aplicadas à RFC (ver §"Aplicadas").

## Sumário

A RFC-028 propõe a introdução de uma nova aresta estrutural `MERGES` para resolver o achado B4
da T-601 (1 vs. 2 arestas `MUTATES` no merge de fork). A auto-revisão confirma que a tese
arquitetural é sólida e resolve o deadlock entre caderno-2 canônico e rework-3 da T-108. Três
achados menores foram identificados e emendados.

## Achados

| ID | Veredito | Achado | Ação |
| :--- | :--- | :--- | :--- |
| R1 | INCORPORAR | §4 checklist não mencionava ajustar o **passo 4** (Convergência) do caderno-2/04 §4.2 — ainda diz "ambos os ramos", mas a mecânica MERGES suporta N ramos | Emenda aplicada em `rfc-028 §4` linha da caderno-2/04, e §5.2 agora contém a reescrita dos passos 3 **e** 4 |
| R2 | INCORPORAR | §5.1 (verbete) não mencionava fork de N ramos; falava "ramos concorrentes" implicitamente binário | Emenda aplicada: agora explicita "para forks de 2 ou mais ramos (uma aresta `MERGES` por ramo incorporado)" |
| R3 | INCORPORAR | §8.1 (exemplo de TS) omitia `previous_hash` do INSERT — falha na DDL se `NOT NULL` | Emenda aplicada: código-exemplo agora inclui `previousHashForMerges` (decidido em runtime via `PRAGMA table_info(edges)`) e I-MERGES-2 mantém a estratégia dupla NULL \| ZERO_HASH |
| R4 | JA-COBERTO | Verificação de "arestas `MERGES` são aresta estrutural primitiva sem subtipo" — já coberto por `mutates.md:36` citando que mudança de política exige RFC (a própria rfc-028 é essa RFC) | Nada a emendar |
| R5 | REVISAR-HUMANO | Estratégia NULL vs. ZERO_HASH em I-MERGES-2 — qual adotar como canônica? (Se NULL, é mais limpo; se ZERO_HASH, é coerente com a coluna de `MUTATES` que pode ser NOT NULL.) | Decisão de design pendente; mitigada pela RFC com estratégia runtime. Recomendação: absorver na primeira rodada, decidir durante implementação (rework-1). |

## Aplicadas

- [x] R1 (§4 linha do caderno-2/04 §4.2 + §5.2 reescrita) — já Incorporado na RFC.
- [x] R2 (§5.1 verbete) — já Incorporado.
- [x] R3 (§8.1 exemplo TS) — já Incorporado.

## Tensões que persistem (não bloqueiam absorção)

- R5: NULL vs. ZERO_HASH para `previous_hash` em arestas `MERGES`. Decisão concreta fica para a
  rework-1 da T-601 (que fará `PRAGMA table_info(edges)` para determinar a constraint real).
- A absorção nos cadernos e a criação do ADR-0005 ficam outside da rework-1.

## Conclusão

RFC em estado **APROVADO COM EMENDAS** — pronto para `/absorver-rfc`.