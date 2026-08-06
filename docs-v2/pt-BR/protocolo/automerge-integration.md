---
id: automerge-integration
tipo: protocolo
status: ativo
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 8)
  - docs/caderno-2-protocol/04-automerge-integration-spec.md (base herdada)
  - https://automerge.org/docs/reference/concepts/
  - https://automerge.org/docs/reference/repositories/ephemeral/
  - https://automerge.org/docs/reference/repositories/networking/
  - https://automerge.org/docs/reference/under-the-hood/storage/
substitui:
  - docs/caderno-2-protocol/04-automerge-integration-spec.md
  - docs/conceitos/automerge-repo.md
  - docs/conceitos/documento-casca.md
  - docs/conceitos/ephemeral-messages.md
conceitos:
  - documento-casca
  - mensagem-efemera
---

# Integração Automerge

O Automerge Repo é um subsistema local-first para documentos colaborativos.
Ele não replica o grafo oficial. Ele não valida regras jurídicas. Ele não
executa autorização por travessia de subgrafo.

## 1. Escopo de uso

Use o Automerge Repo nestes casos:

- Documentos colaborativos.
- Planilhas e quadros colaborativos.
- Rascunhos entre dispositivos.
- Pequenos estados que precisam de merge CRDT.
- Presença associada a um documento.
- Mensagens efêmeras associadas a uma sessão.
- Documentos vazios usados como salas efêmeras.

Não use o Automerge Repo para replicar tabelas do SQLite do grafo. O grafo
oficial sincroniza pelo change feed (ver
`docs-v2/protocolo/graph-sync-protocol.md`).

## 2. Documento Casca

O Documento Casca é um `DocHandle` vazio ou mínimo. Ele serve para broadcast
e presença da sessão. O identificador da sala deriva de um segredo de
capacidade:

```
RendezvousId = SHA-256(rendezvous_secret || ASSET:PERMISSION_ID)
```

O `rendezvous_secret` é distribuído somente a quem tem o UCAN correspondente.

O Automerge Repo não cria a conexão WebRTC. O `NetworkAdapterPort` cria e
mantém a conexão. O Automerge Repo consome a conexão por um adapter fino.

## 3. Mensagens efêmeras

Use `DocHandle.broadcast()` para mensagens descartáveis da sessão. Exemplos:
cursor, presença, digitação e progresso.

Regras:

1. O broadcast não garante entrega.
2. Não use broadcast como prova final de uma operação.
3. Use frames direcionados para RPC, ACK, chaves e controle crítico.
4. Use a outbox ou o grafo para dados que devem sobreviver à queda.

## 4. Persistência de Changes

Existe um único dono para a persistência dos Changes: o `StorageAdapter` do
Automerge. O adapter salva e compacta os incrementais.

Regras:

1. Não mantenha uma segunda cópia integral dos Changes sem necessidade
   comprovada.
2. Use `pending_changes` somente para metadados de commit ou auditoria.
3. A alternativa admitida é implementar o `StorageAdapter` sobre o storage
   local escolhido.

## 5. Ciclo de commit colaborativo

1. As edições alimentam o Automerge Repo em tempo real.
2. O gatilho de commit dispara por inatividade ou por limiar de operações.
3. O commit gera um snapshot consolidado com `Automerge.save(doc)`.
4. O cliente envia o snapshot como proposta à autoridade.
5. A confirmação cria o nó-versão oficial no change feed.
6. O nó-versão é autossuficiente. A reidratação usa `Automerge.load`.

Antes da confirmação, o estado é `pending` e local. Depois da confirmação, o
estado é `finalized` e durável. Não existe terceiro estado.

## 6. Co-assinatura

Quando a `SPECIFICATION` exige aprovação conjunta, o proponente envia o hash
do snapshot por frame direcionado aos co-signatários. As assinaturas voltam
por frame direcionado com ACK. O conjunto de assinaturas entra no payload da
proposta. Nenhuma mensagem de coordenação fica no grafo.

## 7. Resolução de fork

Forks na linhagem de um documento são resolvidos pela autoridade no caminho
de confirmação. A autoridade serializa as propostas não comutativas. Para
conteúdo comutativo de documento, o merge usa o próprio Automerge. O nó de
merge referencia os dois ramos por duas arestas `MUTATES` e tem HLC superior
a ambos.

## 8. Testes de conformidade

1. Um documento confirmado reidrata com `Automerge.load` sem histórico de
   Changes.
2. Uma mensagem de broadcast perdida não altera o estado oficial.
3. O cliente não abre conexão WebRTC por dentro do Automerge Repo.
4. Não existe segunda cópia integral de Changes fora do `StorageAdapter`.
5. Um snapshot enviado como proposta não vira nó-versão antes da
   confirmação da autoridade.
