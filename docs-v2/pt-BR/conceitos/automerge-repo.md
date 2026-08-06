---
id: automerge-repo
tipo: conceito
status: ativo
fontes:
  - docs-v2/protocolo/automerge-integration.md
  - https://automerge.org/docs/reference/concepts/
substitui:
  - docs/conceitos/automerge-repo.md
---

# automerge-repo

Subsistema local-first para documentos colaborativos. Gerencia a DAG de
Changes de cada documento e o merge CRDT.

O Automerge Repo não replica o grafo oficial. O grafo oficial sincroniza
pelo change feed autoritativo. O Automerge Repo não valida regras jurídicas
nem executa autorização por travessia de subgrafo.

O `NetworkAdapterPort` cria e mantém as conexões. O Automerge Repo consome
cada conexão por um adapter fino.

Contrato completo: `docs-v2/protocolo/automerge-integration.md`.
