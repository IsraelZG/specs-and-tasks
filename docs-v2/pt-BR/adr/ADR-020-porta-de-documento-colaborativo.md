---
id: adr-020-porta-de-documento-colaborativo
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling de Marilda 2026-08-03
  - docs-v2/pt-BR/protocolo/automerge-integration.md
  - docs-v2/pt-BR/adr/ADR-005-interface-reativa-entre-produtos.md
resolve:
  - decisão 008-02 do backlog (namespace $doc)
---

# ADR-020 — Porta de documento colaborativo, separada da porta tabular

## Decisão

Contratos declara uma **segunda porta de leitura**, com a forma da API de handle
de um CRDT: documento, mudança, patch, cursor e presença. Avelino a implementa
com o Automerge Repo. Marilda programa contra a porta e não importa a
biblioteca — o mesmo padrão que o ADR-005 aplicou ao store tabular.

| Porta | Forma | Cobre |
| :--- | :--- | :--- |
| leitura reativa | tabular, observável | grafo e projeções |
| documento colaborativo | handle CRDT | documentos, planilhas e quadros colaborativos, rascunhos entre dispositivos, presença |

## Por que duas portas

As formas divergem de fato. Texto rico com edição concorrente precisa de patch,
cursor e presença; nada disso cabe em linha e célula. Forçar um CRDT dentro de
um store tabular produziria um tipo opaco cuja API não seria contrato de
ninguém, e Marilda acabaria dependendo do Automerge por dentro dele.

A separação não é especulativa. Ela é imposta por uma diferença de forma que já
existe.

## Uma autorização, dois caminhos

A decisão de autorização é **única** e acontece antes de o dado ser entregue,
nos dois casos. Na porta colaborativa, ela acontece na obtenção do handle.

Isto é invariante, não detalhe. O Automerge Repo, por si, não executa
autorização por travessia de subgrafo. Se cada porta decidisse por conta, os
dois caminhos de leitura divergiriam no filtro de permissão — e caminho de
leitura duplicado com filtro divergente é vazamento por construção.

A suíte de conformidade precisa provar que as duas portas recusam exatamente o
mesmo conjunto para o mesmo portador.

## Escrita continua uma só

Nenhum caminho de escrita novo. O ciclo colaborativo já desemboca no fluxo de
proposta: edição alimenta o repo em tempo real, o gatilho de commit gera
snapshot, o snapshot vira **proposta** à autoridade, e a confirmação cria o
nó-versão oficial. Existem dois estados, `pending` e `finalized`, e não há
terceiro.

## Resolve a decisão 008-02

`$doc` **não é** um namespace de primeira classe da linguagem de página. Um
documento colaborativo é obtido pela porta e entra como mais uma fonte de
contexto, ao lado do estado de vista e dos resultados de consulta. A linguagem
de expressão não ganha um terceiro namespace mágico.

## Consequências

- O rascunho do `SmartForm`, que a doc herdada mandava gravar direto no
  Automerge (ADR-019), passa a ter duas formas legítimas: estado de vista, ou
  documento colaborativo pela porta. Nunca acesso direto.
- Mensagens efêmeras e presença associada a documento trafegam por esta porta.
- Marilda precisa distinguir `pending` de `finalized` na interface. O usuário
  tem de saber se o que ele vê já é registro ou ainda é rascunho local. Se essa
  distinção pertence ao piso do ADR-017 é decisão em aberto.
