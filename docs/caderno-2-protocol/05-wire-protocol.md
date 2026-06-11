# 05-wire-protocol.md — Wire Protocol: MessagePack com Framing e Evolução de Versão

> **Origem normativa:** RFC-005 §A.2 (resolve a ausência de serialização/framing/versionamento — lapso 1.5).
> **Relações:** [[caderno-2-protocol/02-cryptographic-lineage-and-auth#311-época-de-identidade-vs-épocas-de-conteúdo]] (semântica do `identity_epoch_index` e do `STALE_EPOCH`); `rfc-transporte-p2p-v3.1.md §2.9` (consciência de época e relógio); [[caderno-3-sdk/01-sqlite-and-projections-schema]] (`retention_state = 3`, quarentena de órfãos).

---

## 1. Frame Físico

```
[LENGTH: uint32 BE] [VERSION: uint8] [FRAME_TYPE: uint8] [PAYLOAD: MessagePack]
```

* **`LENGTH`** exclui o próprio campo; valor acima do teto negociado (default **1 MiB** para frames de controle/grafo) ⇒ **rejeição sem parse**.
* **`VERSION`** corrente: `0x01`; `0x00` é inválido.
* **`FRAME_TYPE`**:

| Código | Tipo |
| :--- | :--- |
| `0x01` | `RBSR_ROOT` |
| `0x02` | `RBSR_RANGE` |
| `0x03` | `RBSR_REQUEST_NODES` |
| `0x04` | `RBSR_NODES` |
| `0x05` | `EPHEMERAL` |
| `0x06` | `HEARTBEAT_PING` |
| `0x07` | `HEARTBEAT_PONG` |
| `0x08` | `IDENTITY_CATCHUP` |
| `0x09` | `KEY_REQUEST` |
| `0x0A` | `KEY_RESPONSE` |
| `0x0B` | `CONTROL` |
| `0xF0–0xFF` | Reservado a extensão por `SPECIFICATION` de rede |

* **`PAYLOAD`**: MessagePack.

## 2. Decisão de Serialização (ADR embutido)

**MessagePack sobre CBOR** (parsing maduro em JS/WASM, ecossistema); **FlatBuffers rejeitado** (schema compilation sem ganho no volume <10³ msg/s/peer). Campos desconhecidos em maps são **preservados e ignorados** (compatibilidade aditiva intra-versão).

## 3. Evolução de Versão

1. **Versão superior + categoria volátil** (`EPHEMERAL`, `HEARTBEAT_*`, `CONTROL`) ⇒ descartar o frame, manter a conexão.
2. **Versão superior + categoria auditável não-parseável** ⇒ gravar em quarentena com `retention_state = 3` (orphan/quarentena), **fora** das projeções e da B-Tree ativa, preservando os bytes; emitir `UPGRADE_REQUIRED`; **nunca** descartar nem re-propagar enquanto órfão.
3. **Versão inferior** ⇒ tentar schema regressivo; falha ⇒ quarentena.
4. **Invariante:** o envelope assinado dos registros (`id`, `signature`, `hlc`, `identity_epoch_index`) é **invariante entre versões** — a assinatura cobre o registro, não o framing.

## 4. Vetor Adversarial Obrigatório (suíte M9)

Frame de versão futura com payload arbitrário **não** causa crash, **não** corrompe projeções e **não** gera crescimento ilimitado de quarentena (o pool orphan tem quota própria no G4 — ver [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#4-garbage-collection-híbrido-g4-e-quotas]]).
