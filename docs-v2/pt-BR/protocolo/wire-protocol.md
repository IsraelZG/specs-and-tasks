---
id: wire-protocol
tipo: protocolo
status: ativo
versao-protocolo: 1
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seção 9)
  - docs/caderno-2-protocol/05-wire-protocol.md (frame físico herdado)
substitui:
  - docs/caderno-2-protocol/05-wire-protocol.md
conceitos:
  - network-adapter-port
  - canal-logico
---

# Wire Protocol — frames e canais lógicos

## 1. Frame físico

```
[LENGTH: uint32 BE] [VERSION: uint8] [CHANNEL: uint8] [FRAME_TYPE: uint8] [PAYLOAD: MessagePack]
```

- `LENGTH` exclui o próprio campo. Valor acima do teto do canal implica
  rejeição sem parse.
- `VERSION` corrente é `0x01`. O valor `0x00` é inválido.
- `CHANNEL` identifica o canal lógico (seção 2).
- `FRAME_TYPE` identifica a mensagem dentro do canal (seção 3).
- `PAYLOAD` usa MessagePack. Campos desconhecidos são preservados e
  ignorados.

## 2. Canais lógicos

Uma conexão física por peer multiplexa os protocolos sobre o
`NetworkAdapterPort`. Cada canal lógico tem versão, limite de tamanho,
backpressure, timeout e cancelamento próprios.

| Código | Canal | Teto do frame | Timeout padrão |
| :--- | :--- | :--- | :--- |
| `0x01` | `FEED_SYNC` — sincronização do change feed | 1 MiB | 30 s |
| `0x02` | `CONTROL` — controle e ACK | 64 KiB | 10 s |
| `0x03` | `AUTOMERGE` — mensagens do Automerge Repo | 1 MiB | 30 s |
| `0x04` | `EPHEMERAL` — mensagens efêmeras direcionadas | 64 KiB | 5 s |
| `0x05` | `IDENTITY` — identidade e chaves | 256 KiB | 15 s |
| `0x06` | `TELEMETRY` — telemetria permitida | 64 KiB | 10 s |
| `0xF0–0xFF` | reservado a extensão por `SPECIFICATION` de rede | — | — |

O cancelamento de um canal não derruba a conexão física. O backpressure de
um canal não bloqueia os demais canais.

## 3. Tipos de frame por canal

### 3.1 Canal `FEED_SYNC`

| Código | Tipo | Direção |
| :--- | :--- | :--- |
| `0x01` | `FEED_SUBSCRIBE` (cursor inicial por partição) | cliente → autoridade |
| `0x02` | `MANIFEST` (manifesto de lote) | autoridade → cliente |
| `0x03` | `RECORD_REQUEST` (ids solicitados) | cliente → fonte |
| `0x04` | `RECORD_BATCH` (registros solicitados) | fonte → cliente |
| `0x05` | `PROPOSAL` (proposta de escrita) | cliente → autoridade |
| `0x06` | `PROPOSAL_RESULT` (confirmação ou rejeição) | autoridade → cliente |
| `0x07` | `GAP_REQUEST` (pedido de lacunas) | cliente → autoridade |

### 3.2 Canal `CONTROL`

| Código | Tipo |
| :--- | :--- |
| `0x01` | `ACK` |
| `0x02` | `NACK` (com código de erro normativo) |
| `0x03` | `HEARTBEAT_PING` |
| `0x04` | `HEARTBEAT_PONG` |
| `0x05` | `CHANNEL_CLOSE` |

### 3.3 Canal `AUTOMERGE`

| Código | Tipo |
| :--- | :--- |
| `0x01` | `AM_MESSAGE` (bytes opacos do Automerge Repo) |

As mensagens internas do Automerge são bytes opacos. O transporte não
converte esses bytes para o schema de domínio.

### 3.4 Canal `EPHEMERAL`

| Código | Tipo |
| :--- | :--- |
| `0x01` | `EPHEMERAL_MESSAGE` (descartável, sem ACK) |
| `0x02` | `DIRECTED_FRAME` (RPC, ACK, chaves, controle crítico) |

Mensagens críticas usam `DIRECTED_FRAME` com ACK ou persistência na outbox.
Nunca use `EPHEMERAL_MESSAGE` como prova de uma operação.

### 3.5 Canal `IDENTITY`

| Código | Tipo |
| :--- | :--- |
| `0x01` | `IDENTITY_CATCHUP` |
| `0x02` | `KEY_REQUEST` |
| `0x03` | `KEY_RESPONSE` |

## 4. Autenticação da conexão

A conexão usa Noise_XX com autenticação mútua. A chave estática é a chave do
dispositivo. O handshake troca o `identity_epoch_index`. Divergência de
época desvia o canal para `IDENTITY_CATCHUP` antes de qualquer tráfego de
domínio. O erro `STALE_EPOCH` refere-se somente à época de identidade.

## 5. Evolução de versão

1. Versão superior em canal volátil (`EPHEMERAL`, `CONTROL`, `TELEMETRY`):
   descarte o frame e mantenha a conexão.
2. Versão superior em canal auditável (`FEED_SYNC`, `IDENTITY`): grave em
   quarentena, fora das projeções, e emita `UPGRADE_REQUIRED`.
3. Versão inferior: tente o schema regressivo. Em falha, quarentena.
4. O envelope assinado dos registros é invariante entre versões.

## 6. Erros normativos

| Código | Condição |
| :--- | :--- |
| `FRAME_TOO_LARGE` | `LENGTH` acima do teto do canal |
| `VERSION_UNSUPPORTED` | versão sem schema regressivo |
| `STALE_EPOCH` | época de identidade divergente |
| `CHANNEL_TIMEOUT` | resposta ausente no timeout do canal |
| `BACKPRESSURE_APPLIED` | fila do canal no limite |

## 7. Testes de conformidade

1. Um frame com `LENGTH` acima do teto é rejeitado sem parse.
2. Um frame de versão futura não causa crash nem corrompe projeções.
3. O cancelamento de um canal preserva os demais canais e a conexão.
4. Um `DIRECTED_FRAME` sem ACK dentro do timeout é retransmitido.
5. Bytes do canal `AUTOMERGE` chegam ao adapter sem interpretação.
