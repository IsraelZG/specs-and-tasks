# ADR 0003 — Modelo de persistência byte-level do Snapshot: envelope binário puro (Opção A)

- **Status:** aceito (2026-06-25 — arquiteto, **reverte** rascunho Opção B; destrava T-308-rework-2 [M2])
- **Contexto:** `createBootstrapSnapshot`/`hydrateSnapshot` em `packages/core/src/snapshot.ts`
  operam sobre o **objeto** `Snapshot` em memória; **não há** API de serialização byte-level. O
  caderno-2 §5 designa o snapshot como **"arquivo estático"** (uso primário: download do
  peer-do-sistema no primeiro sync). Sem bytes, persistência em disco (`fs.writeFile`) e
  transmissão (`ws.send`/HTTP) são impossíveis sem `JSON.stringify` — que **lança** em `bigint`.
- **Decisores:** arquiteto

## Problema

O snapshot é hoje um artefato **host-only** em memória. Para o caso de uso normativo (download no
onboarding), precisa virar bytes estáveis, versionáveis e auto-descritivos. Três opções foram
avaliadas (ver T-308-rework-2 §6); o rascunho prévio deste ADR escolheu **Opção B** (envelopar o
`Snapshot` inteiro via codec T-203 MessagePack). **Esta decisão reverte para Opção A.**

## Decisão

**Opção A — `serializeSnapshot`/`deserializeSnapshot` com envelope binário puro auto-descritivo.**

Layout canônico (little-endian salvo onde marcado BE — consistente com Noise):

```
[ magic: 4      bytes BE  = 0x53 50 42 54 ("SPBT") ]   ← identidade do formato
[ version: 1    byte u8                      ]         ← versionamento do envelope
[ compression: 1 byte u8 (0=none, 1=gzip)   ]
[ reserved: 2   bytes (zeros)                ]
[ contextIdLen: 4 bytes BE                   ]
[ contextId:    N bytes UTF-8                ]
[ nodeCount:    4 bytes BE                   ]
[ edgeCount:    4 bytes BE                   ]
[ createdAt:    8 bytes BE (bigint HLC compactado) ]
[ checksum:     32 bytes (SHA-256 do body PRÉ-compressão) ]
[ bodyLen:      4 bytes BE                   ]
[ body:         N bytes (encoded/comprimido) ]
```

### Por que envelope próprio, não codec T-203

1. **Invariante de uso.** Caderno-2 §5 nomeia o snapshot **"arquivo estático"** — artefato de
   arquivo, baixa frequência, alta durabilidade, versionável. Frames de **wire** (mensagens de
   sync contínuo) usam codec T-203. Acoplá-los significa: mudar o wire-codec → snapshot legado
   quebra; mudar schema do snapshot → wire-codec não sabe versionar. Independência de evolução
   é a propriedade que se quer em formato de arquivo.
2. **Magic + version é auto-descritivo.** `fs.readFile` + `readUInt32BE(0)` decide formato sem
   "chutar" msgpack vs json vs outro. Mensagens de wire não precisam disso (nó active negotiates);
   arquivo estático sim.
3. **O argumento "checksum dentro de checksum" é falso-positivo.** SHA-256 do body é
   **autenticidade de conteúdo** (corrupção de arquivo em disco/transporte). Codec T-203 não
   calcula checksum de payload — apenas serializar/desserializar. São propriedades diferentes.
   **Não** há duplicação.
4. **Custo aceitável.** ~100 LOC; o snapshot é o artefato mais valioso do onboarding — durabilidade
   justifica os LOC extras vs Opção B (~30 LOC) acoplando 2 evoluções distintas.

### Integração com codec T-203

O **body interno** (após decompressão) continua sendo `codecEncode({ nodes, edges })` — usa o
codec T-203 com `int64AsType: 'bigint'` para tratar `hlc: bigint` **nativamente**, eliminando o
workaround `bigintToString`/`stringToBigint` em `snapshot.ts:57-113` (M1 do T-308-rework-2). Isto
é consistente: dentro do envelope, payload codecé привычный.

## Alternativas consideradas

- **B — `codecEncode({ header, body })` para o `Snapshot` inteiro.** Rejeitada: acopla formato de
  arquivo a formato de wire; sem magic auto-descritivo; sub-utiliza a propriedade "arquivo estático
  versionável" do caderno-2 §5.
- **C — Persistência é responsabilidade do consumer.** Rejeitada: dívida espalhada, cada consumer
  reinventando encode/decode; corre risco de inconsistência entre peer-do-sistema e clients.
- **D — Híbrido (A + adapters `SnapshotFileStorage`/`SnapshotWSFrame`).** Adia os adapters para
  tasks futuras; a API base é A. Etapa A é suficiente para v0; D fica como future work.

## Consequências

- Novas APIs em `packages/core/src/snapshot.ts`: `serializeSnapshot(snap): Uint8Array` e
  `deserializeSnapshot(bytes): Snapshot`.
- Layout binário com `magic` + `version` próprio — **versionável**; bumpar `version` em mudanças
  incompatíveis (compat-reading de version antigo fica explicitamente out-of-scope hasta v2).
- Persistência trivial: `fs.writeFile('bootstrap-<contextId>.snap', serializeSnapshot(s))`.
- Transmissão trivial: `wsAdapter.send(peer, serializeSnapshot(s))` ou HTTP `Content-Type:
  application/x-plataforma-snapshot`.
- Workaround `bigintToString`/`stringToBigint`/`serializeBigInts`/`deserializeBigInts`/`BIGINT_FIELDS_*`
  (snapshot.ts:57-113) **removido** — codec T-203 já trata bigint (M1 do T-308-rework-2).
- Removes `Math.max(1, Date.now() & 0xffffffff)` mask (m1) e adiciona `nodeCount`/`edgeCount`
  validation (P5) — outer work do T-308-rework-2, endereçado na mesma janela.
- Sem dependência nova; sem mudança em codec T-203.