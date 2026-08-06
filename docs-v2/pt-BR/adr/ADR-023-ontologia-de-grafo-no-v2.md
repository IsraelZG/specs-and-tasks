---
id: adr-023-ontologia-de-grafo-no-v2
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling 2026-08-03
  - docs/caderno-2-protocol/01-graph-ontology.md (fonte de migração)
  - docs-v2/pt-BR/adr/ADR-021-portao-de-asset-em-avelino.md
resolve:
  - questoes-abertas.md Q-07
---

# ADR-023 — Tipos-base fechados, subtipos como registro sob portão

## Decisão

A ontologia de grafo entra em `docs-v2` em duas partes, com estatutos
diferentes.

### Normativo e fechado

Quatro tipos-base. São protocolo — afetam formato de fio, armazenamento e
validação — e são caros de mudar.

| Tipo | O que é |
| :--- | :--- |
| `PROFILE` | quem age; tem par de chaves e assina |
| `CONTENT` | informação passiva e versionada |
| `ASSET` | valor, direito, saldo ou autorização |
| `SPECIFICATION` | contrato formal; pode ser schema declarativo, procedimento executável, ou ambos |

Também normativos: a convenção de nomenclatura de arestas, e o **portão de
minimalismo** abaixo.

### Registro extensível

Subtipos (`ASSET:PERMISSION`, `CONTENT:MESSAGE`, …) formam um registro que
cresce. Um subtipo é discriminador de payload, não formato de fio — adicionar é
barato, e por isso não precisa ser antecipado.

## Portão de minimalismo

Um subtipo novo só entra no registro se satisfizer **todos** os critérios:

1. **Diferenciação de comportamento sistêmico.** Se dois tipos têm regras
   idênticas de validação, cifra e sincronização, são o mesmo tipo com payload
   diferente.
2. **Impossibilidade de resolver por payload mais `SPECIFICATION`.** A distinção
   estrutural é último recurso, não primeiro.
3. **Existência de aresta exclusiva.** O tipo participa de ao menos uma relação
   que não faz sentido para nenhum outro.
4. **Reusabilidade multidomínio.** Útil em vários módulos, ou crucial para um
   domínio central.

Este portão é a forma bem-formada da tese "zero tipo de nó novo" que aparece
repetidamente no backlog antigo como objeção solta.

## Resolve o drift existente

`docs-v2` já usa `ASSET:INVITE` normativamente (topologia §4), e a ontologia
antiga não o lista como canônico. `ASSET:REPUTATION` existe como verbete e
também não é listado.

Nenhum dos dois é julgado aqui por antiguidade ou por onde foi encontrado. Ambos
passam pelo portão como qualquer outro candidato, ou saem.

## Por que isto sustenta o ADR-021

O portão de verificação do ADR-021 incide sobre `ASSET`, que é **tipo-base** —
fechado e estável. Ele não precisa enumerar subtipos, e portanto não quebra
quando o registro cresce. A regra de segurança mais importante do produto passa
a se apoiar na parte da ontologia que não muda.

## O que este ADR não faz

Ele decide o **estatuto**, não o conteúdo. O documento de ontologia ainda
precisa ser escrito em `docs-v2`, no registro que o README exige — tipos
exatos, invariantes, erros e testes. A fonte de migração é
`docs/caderno-2-protocol/01-graph-ontology.md`, cujos wikilinks para
`docs/conceitos/` não viajam e precisam ser resolvidos ou reafirmados no texto.

## Consequências

- `SPECIFICATION` de natureza executável é o que hospeda a regra do ADR-014. A
  ontologia precisa dizer isso explicitamente, porque a camada de proposta
  depende disso.
- `CONTENT:DOCUMENT` cobre planilha e texto colaborativo, e é o que a porta de
  documento colaborativo do ADR-020 entrega.
- Seções do documento antigo que são orientação de módulo — moderação por grupo,
  descoberta por grafo, antipadrão dual-nó — não são ontologia e não precisam
  entrar junto.
