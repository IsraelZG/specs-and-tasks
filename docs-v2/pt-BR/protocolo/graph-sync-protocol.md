---
id: graph-sync-protocol
tipo: protocolo
status: ativo
versao-protocolo: 1
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 7)
  - docs/caderno-2-protocol/03-set-reconciliation-protocol.md (histórico)
substitui:
  - docs/caderno-2-protocol/03-set-reconciliation-protocol.md
  - docs/conceitos/rbsr.md (como caminho normal)
conceitos:
  - change-feed
  - manifesto-de-lote
  - cursor-monotonico
  - outbox
  - evento-compensatorio
---

# Graph Sync Protocol — change feed autoritativo

Este documento define o protocolo de sincronização do grafo oficial. Ele
substitui o RBSR como caminho normal. O RBSR permanece como algoritmo
auxiliar de auditoria entre réplicas da autoridade.

## 1. Modelo

A autoridade mantém um change feed por partição autorizada. O feed é uma
sequência append-only de registros oficiais. Cada partição tem um cursor
monotônico.

A autoridade agrupa registros em lotes. Cada lote tem um manifesto assinado.
O manifesto prova a ordem e a completude do lote. Peers podem entregar os
bytes dos registros. Somente o manifesto prova a posição no feed.

## 2. Tipos exatos

Todos os identificadores são ULIDs de 26 caracteres em Crockford Base32.
Todos os hashes são SHA-256 de 32 bytes. Todas as assinaturas são Ed25519 de
64 bytes. A codificação de transporte é MessagePack. Na persistência e em
logs, hashes e chaves usam hex minúsculo.

```typescript
type Ulid = string;          // 26 chars, Crockford Base32
type Hash32 = Uint8Array;    // 32 bytes, SHA-256
type PubKey = Uint8Array;    // 32 bytes, Ed25519 pública
type Signature = Uint8Array; // 64 bytes, Ed25519

// Cursor monotônico de uma partição. Começa em 0. Incrementa de 1 em 1.
type Cursor = bigint;        // uint64, sem lacunas na partição

interface PartitionId {
  network_id: Ulid;
  partition: string;         // slug da partição autorizada, max 64 chars
}

interface FeedRecord {
  network_id: Ulid;
  partition: string;
  cursor: Cursor;            // posição no feed da partição
  record_id: Ulid;           // id do nó ou da aresta do grafo
  record_hash: Hash32;       // SHA-256 do envelope canônico do registro
  record_kind: 'node' | 'edge' | 'compensating_event';
  author_key: PubKey;        // chave do autor da proposta confirmada
  authority_epoch: number;   // época da autoridade que confirmou
  confirmed_at: number;      // ms Unix, relógio da autoridade
}

interface BatchManifest {
  version: 1;
  network_id: Ulid;
  partition: string;
  cursor_start: Cursor;      // cursor do primeiro registro do lote
  cursor_end: Cursor;        // cursor do último registro do lote
  prev_manifest_hash: Hash32;  // hash do manifesto anterior da partição
  record_ids: Ulid[];        // ids na ordem do feed
  record_hashes: Hash32[];   // hashes na mesma ordem de record_ids
  authority_epoch: number;
  issued_at: number;         // ms Unix
  authority_key: PubKey;
  signature: Signature;      // assina a serialização canônica dos campos acima
}

interface Proposal {
  proposal_id: Ulid;         // idempotência: gerado pelo cliente
  network_id: Ulid;
  partition: string;
  author_key: PubKey;
  ucan: Uint8Array;          // token de autorização serializado
  payload: Uint8Array;       // operação de domínio serializada
  created_at: number;        // ms Unix, relógio do cliente
  signature: Signature;      // assina todos os campos acima
}

type ProposalResult =
  | { status: 'confirmed'; cursor: Cursor; record_hash: Hash32 }
  | { status: 'rejected'; error: SyncError };
```

## 3. Limites e codificação

| Item | Limite |
| :--- | :--- |
| Registros por lote | máximo 1.024 |
| `record_ids.length` | igual a `record_hashes.length` |
| Intervalo do lote | `cursor_end - cursor_start + 1 == record_ids.length` |
| Payload de proposta | máximo 256 KiB |
| Tamanho do frame de transporte | máximo 1 MiB antes do parse |
| Versão do protocolo | `1`. Versões maiores entram em quarentena |

Os cursores de uma partição não têm lacunas. Um lote com intervalo inválido
ou contagens divergentes é rejeitado antes de qualquer escrita.

## 4. Fluxo de leitura

1. O cliente autentica a autoridade pelo handshake do wire protocol.
2. O cliente envia seu último cursor aplicado por partição.
3. A autoridade envia o próximo manifesto autorizado.
4. O cliente escolhe uma fonte para cada registro do lote.
5. A fonte pode ser a autoridade ou um peer autorizado.
6. O cliente valida o hash de cada registro contra `record_hashes`.
7. O cliente valida a assinatura e a permissão de cada registro.
8. O cliente valida a assinatura do manifesto e o encadeamento
   `prev_manifest_hash`.
9. O cliente grava todo o lote em uma única transação local.
10. O cliente avança o cursor local depois do commit.
11. O cliente pede à autoridade qualquer lacuna de registros.

Um peer pode entregar bytes. O cliente trata bytes de peer como não
confiáveis até a validação dos passos 6 a 8.

## 5. Fluxo de escrita

1. O cliente grava cada proposta offline em uma outbox durável local.
2. Uma proposta na outbox não pertence ao grafo oficial.
3. O cliente envia a proposta quando recupera a conexão.
4. A autoridade valida identidade, poderes, permissão e regras de domínio.
5. A autoridade rejeita ou confirma a proposta.
6. A confirmação cria um registro oficial no change feed.
7. O cliente marca a proposta como confirmada ao observar seu `record_hash`
   no feed.

A autoridade responde a toda proposta com `ProposalResult`. O cliente repete
o envio após timeout. O `proposal_id` garante idempotência: uma proposta
repetida retorna o mesmo resultado sem criar segundo registro.

## 6. Correções

Nenhuma correção altera um registro confirmado. Toda correção cria um evento
compensatório. O evento compensatório é um `FeedRecord` com
`record_kind = 'compensating_event'`. Ele referencia o registro corrigido no
payload. O registro original permanece no feed.

## 7. Operação sem a autoridade

Durante uma falha temporária da autoridade:

1. O cliente lê seu cache local.
2. O cliente edita documentos locais e cria propostas na outbox.
3. Peers trocam registros cobertos por manifestos já conhecidos.
4. Peers não avançam a finalidade oficial do grafo.
5. O cliente exibe na interface que os dados podem estar desatualizados.

Operações comutativas locais continuam. Operações não comutativas aguardam a
autoridade. O escopo afetado degrada para leitura, sem perda de integridade.

## 8. Erros normativos

| Código | Condição | Ação do cliente |
| :--- | :--- | :--- |
| `STALE_EPOCH` | `authority_epoch` divergente | sincronizar identidade antes de continuar |
| `CURSOR_GAP` | `cursor_start` maior que o esperado | pedir lacunas à autoridade |
| `MANIFEST_SIGNATURE_INVALID` | assinatura do manifesto falhou | descartar o lote e reportar |
| `RECORD_HASH_MISMATCH` | hash do registro diverge do manifesto | descartar o registro e trocar de fonte |
| `PROPOSAL_REJECTED` | regra de domínio ou permissão falhou | remover da outbox e registrar o motivo |
| `PERMISSION_DENIED` | UCAN inválido ou insuficiente | renovar credencial com a autoridade |
| `QUARANTINE` | versão ou formato desconhecido | preservar bytes fora das projeções |

## 9. Persistência e transação

O cliente aplica um lote em uma transação SQLite única. A transação grava os
registros, o manifesto e o novo cursor. Se qualquer validação falhar, a
transação aborta por inteiro. O cursor local nunca avança sem o commit.

## 10. Idempotência

- Receber o mesmo lote duas vezes não altera o estado. O cliente compara o
  hash do manifesto com o cursor local.
- Enviar a mesma proposta duas vezes retorna o mesmo `ProposalResult`.
- Reaplicar um registro já presente é um no-op determinístico.

## 11. Compatibilidade

- Campos desconhecidos em maps MessagePack são preservados e ignorados.
- O envelope assinado dos registros é invariante entre versões do frame.
- Um manifesto de `version` maior que a suportada entra em quarentena.

## 12. Testes de conformidade

1. Dois clientes com o mesmo cursor inicial convergem para o mesmo estado
   após o mesmo lote.
2. Um lote entregue por peer hostil com um byte alterado falha no passo 6.
3. Um manifesto com `prev_manifest_hash` incorreto é rejeitado.
4. Uma proposta enviada duas vezes gera um único registro no feed.
5. Uma queda da autoridade durante a escrita não confirma proposta parcial.
6. Um evento compensatório não altera o registro original.
7. O cursor local nunca ultrapassa o último manifesto validado.
