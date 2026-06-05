---
title: "Comutativo vs. Não-Comutativo"
slug: comutativo-vs-nao-comutativo
aliases: ["divisão fundamental comutativo", "comutativo", "não-comutativo", "operação comutativa", "operação não-comutativa"]
tags: [protocol, transações, serialização, v4, consenso, automerge, linhagem]
modo: canonical
fonte-canonica: docs/rfc-v4.md §2.1
aparicoes-consolidadas:
  - caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4
dependencias:
  - [[linhagem-de-versoes]]
  - [[merge-aditivo]]
  - [[serialization-por-linhagem]]
  - [[validador-declarado]]
  - [[invariante-de-core]]
  - [[automerge-repo]]
  - [[content-intent]]
---

# Comutativo vs. Não-Comutativo

## Definição

A **divisão fundamental** da v4 classifica toda escrita no grafo em duas classes segundo a necessidade de ordenação total:

| Classe | Exemplos | Resolução |
| :--- | :--- | :--- |
| **Comutativo** | `CONTENT:DOCUMENT`, `CONTENT:MESSAGE`, créditos a saldo | Mescla sem ordem (Automerge para documento; [[merge-aditivo]] para saldo). Qualquer agente aplica; desempate determinístico. Otimista. |
| **Não-comutativo** | Débito de `ASSET:BALANCE_STATE`, emissão de `ASSET:PERMISSION`, alteração de `SPECIFICATION` | Exige **[[serialization-por-linhagem]]** (rfc-v4 §2.3). [[validador-declarado]] serializa; UI otimista mostra `pending` local até finalizar. |

> Fonte normativa: `rfc-v4.md §2.1` — *A Divisão Fundamental: Comutativo vs. Não-Comutativo*

## Por que a distinção existe

Operações **comutativas** produzem o mesmo resultado independentemente da ordem de aplicação — dois agentes podem aplicá-las localmente e mesclar sem conflito semântico. Operações **não-comutativas** alteram estado finito disputado (saldo, permissão, política): ordens diferentes produzem estados finais diferentes, e a plataforma não pode escolher um arbitrariamente sem comprometer segurança ou integridade financeira.

A distinção determina o caminho de commit (rfc-v4 §2.2):

- **Comutativo**: o agente local commita; coordenação entre agentes pelo desempate determinístico já existente (menor `entity_id` ativo no ciclo); Automerge resolve o conteúdo. Caem `first_proposer` (racy) e `manual` (político).
- **Não-comutativo**: roteado ao [[validador-declarado]] da linhagem (rfc-v4 §2.3). Não há mais eleição de líder global nem quórum de emergência a 2/3.

## Princípios derivados

Extraídos de `rfc-v4.md §1.3`:

| Princípio | Implicação |
| :--- | :--- |
| Rigor proporcional à sensibilidade ontológica | Conteúdo (comutativo) = efêmero/otimista; financeiro (não-comutativo) = serializado/persistido |
| Comutativo se resolve sozinho; não-comutativo se serializa | Documentos via Automerge; saldo via [[validador-declarado]] da linhagem |

## Implicação no modelo de aresta

A distinção reflete-se na semântica das arestas de [[content-intent]] (rfc-v4 §3.1):

- `SPENDS → head` ancora a versão consumida — gastar é **não-comutativo**; pinar o head exato é o ponto.
- `CREDITS → entity_id` aponta a linhagem estável — creditar é **comutativo**; fixar o head de destino serializaria o recebimento sem necessidade.

Créditos concorrentes fazem [[merge-aditivo]] (soma dos deltas, nunca LWW). Só o débito é serializado.

## Relação com a [[invariante-de-core]]

A [[invariante-de-core]] só faz sentido dentro do domínio não-comutativo: "duas escritas conflitantes na mesma linhagem não-comutativa não podem ambas chegar ao estado `finalized`". Operações comutativas não têm escrita conflitante por definição — convergem sempre.

## Dependências

| slug | onda | status |
|:---|:---|:---|
| [[linhagem-de-versoes]] | 1 | criado |
| [[automerge-repo]] | 6 | criado |
| [[merge-aditivo]] | 6 | criado |
| [[serialization-por-linhagem]] | 9 | criado |
| [[invariante-de-core]] | 9 | criado |
| [[validador-declarado]] | 9 | criado |
| [[content-intent]] | 3 | criado |
