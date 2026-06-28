---
name: ucan
title: "UCAN (User Controlled Authorization Network)"
aliases: ["UCAN", "User Controlled Authorization Network", "token UCAN"]
tags: [protocol, acesso, criptografia, identidade]
---

# UCAN (User Controlled Authorization Network)

**Modo hub** — definição normativa completa em
[[caderno-2-protocol/02-cryptographic-lineage-and-auth]] §2.2.

> A repetição presente em `caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.7` é alvo de consolidação
> (remover redundância; manter apenas o link para este verbete).

---

## O que é

Um UCAN é um token de autorização delegável que prova direitos de acesso a um
subgrafo e possibilita a solicitação de [[chave-de-epoca|chaves de época]] ao
[[key-vault]]. O payload de um UCAN **nunca** contém material de chaves
criptográficas (chaves AES ou privadas).

## Papel no controle de acesso

A plataforma separa *fatos sociais/estruturais* (ex: pertencer a um grupo via
`PARTICIPATES_IN`) de *autorizações técnicas de acesso*. A existência de uma
aresta `PARTICIPATES_IN` **não** concede permissão criptográfica de leitura ou
escrita — apenas um UCAN válido faz isso.

### Fluxo de acesso inverso (capabilities-based)

1. O peer solicitante **anexa o UCAN à requisição**.
2. O UCAN descreve a *query de traversal* (`root`, `depth ≤ 6`, `direction`,
   filtros de arestas/nós) que será executada localmente.
3. O peer fornecedor (ou o [[key-vault]] local) valida assinaturas e cadeias de
   delegação; se válido, entrega as [[chave-de-epoca|chaves de época]] AES-256
   correspondentes aos payloads solicitados.

### Invariante de traversal profundo

Para `depth > 1`, o UCAN **deve** incluir um `edge_filter` em pares
`(tipo_aresta → tipo_nó_alvo)` (ex: `AGGREGATES → ASSET:PERMISSION`), impedindo
que o traversal alcance dados pessoais ou sensíveis fora do escopo autorizado.

### Delegação e revogação

- **Delegação recursiva**: A → B → C, sempre dentro dos limites de traversal
  originais. Desativável via `delegatable: false` na especificação governante.
- **Revogação**: gravação de lápide (aresta com `active = 0` ou aresta de
  expiração) no grafo.

## Relação com [[key-vault]] e [[predicado-de-bloqueio]]

O UCAN é o *direito de pedir*; o [[key-vault]] valida e decide se libera. A
partir da v4, um predicado adicional verifica se o solicitante **não** está na
lista `BLOCKS` do autor antes de liberar a chave de época — ver
`caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2.1`.

## Sincronização dirigida por UCAN

O [[sync-worker]] lê o UCAN ativo, extrai a query de traversal e a injeta como
restrição na CTE recursiva do SQLite; fingerprints e deltas são calculados
**exclusivamente** sobre o subgrafo autorizado. Enforcement é bilateral: o peer
fornecedor valida o UCAN antes de servir qualquer delta.

> Detalhes do mecanismo de sync: `caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.7` (conteúdo
> redundante a ser removido — canonical aqui e em
> `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2`).

## Conceitos relacionados

- [[asset-permission]] — o ativo cujo template define as queries contidas no UCAN
- [[asset-role]] — agrupamento de permissões; instâncias físicas validadas pelo UCAN
- [[key-vault]] — custodia as chaves de época; valida o UCAN antes de liberá-las
- [[chave-de-epoca]] — chave AES-256-GCM entregue após validação do UCAN
- [[predicado-de-bloqueio]] — predicado extra (v4) na decisão de liberação (Onda 3)
- [[rotacao-de-epocas]] — mecanismo substituído parcialmente pelo predicado de bloqueio (v4)
- [[sync-dirigido-por-ucan]] <!-- Foam placeholder — verbete Onda 4 -->


