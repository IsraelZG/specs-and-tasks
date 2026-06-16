# Plano de Implementação — Plataforma Projeto SuperApp V0.41
## Transporte de Dados · Descoberta de Peers · Sincronização · Auth · Segurança

> **Escopo:** primeiro ciclo de desenvolvimento (Cloud + Web PWA local-first), com a base preparada para Desktop/Mobile/TV via Capacitor/Electron.
> **Fontes normativas:** `caderno-5-transport/01-p2p-transport-and-reconciliation.md`, `rfc-v4.md`, `caderno-2-protocol/02..04`, `caderno-3-sdk/01..06`, verbetes em `docs/conceitos/`.
> **Formato:** Marcos (M0–M9) → Épicos (E) → Tarefas atômicas (T-xxx) com dependências e critérios de aceite, dimensionadas para 1 tarefa = 1 sessão de agente = 1 PR.

---

## 0. Princípios do Plano

### 0.1 Regras para atribuição a agentes de IA

1. **Uma tarefa = um PR revisável.** Cada T-xxx tem entregável fechado, critérios de aceite executáveis (testes) e toca o mínimo de pacotes possível.
2. **Spec-first.** Toda tarefa referencia a seção normativa do caderno/RFC que implementa. O agente não inventa comportamento: em ambiguidade, deixa `// TODO(spec)` e reporta.
3. **Teste acompanha a tarefa.** Nenhuma tarefa de protocolo é "pronta" sem teste determinístico (Vitest) usando os adapters de simulação do M0. Tarefas de UI exigem teste Playwright.
4. **Portas antes de adapters.** Toda fronteira de I/O (rede, relógio, storage, cripto, random) é uma interface injetável. Isso é o que torna o P2P *testável em CI* — e é pré-requisito arquitetural, não estilo.
5. **Isomorfismo obrigatório no core.** `@plataforma/protocol` e `@plataforma/core` rodam idênticos em browser, Node (peer cloud) e Electron. Nada de `window`/`fs` direto no core — só via portas.
6. **Decisão em SPECIFICATION, nunca hardcoded.** Políticas (transport_hints, serialização, validadores, TTLs de UCAN) entram como dados de `SPECIFICATION` desde o primeiro commit (doutrina já estabelecida no projeto).
7. **Honestidade radical nos testes.** Cenários que a arquitetura declara como limite (NAT simétrico, validador ausente → freeze escopado, revogação por cortesia) têm testes que *comprovam o comportamento degradado esperado*, não testes que fingem que o limite não existe.

### 0.2 Definição de Pronto (DoD) por tipo de tarefa

| Tipo | DoD |
| :--- | :--- |
| Protocolo/core | Testes unit determinísticos + teste de integração multi-peer in-memory + tipos exportados + doc curto no README do pacote |
| Transporte real | Tudo acima + teste E2E Playwright (2+ contexts) no cenário feliz |
| Cloud (peer do sistema) | Teste de integração Node + endpoint coberto + reset funcional |
| UI da Bancada | Teste Playwright + screenshot no PR |
| Segurança | Vetores de teste adversariais explícitos (ver §2.5) |

---

## 1. Arquitetura de Implementação

### 1.1 Monorepo (pnpm workspaces + turborepo)

```
plataforma/
├── packages/
│   ├── protocol/        # PURO e isomórfico: ULID, HLC, fingerprints, RBSR,
│   │                    #   wire format, Noise_XX, máquinas de estado (FPP),
│   │                    #   tipos do grafo, TransportBehavior, validações
│   ├── crypto/          # Ed25519, AES-256-GCM, HKDF, BIP39, PBKDF2, SSS,
│   │                    #   blake2s256 — wrappers sobre WebCrypto/noble
│   ├── core/            # Storage (SQLite), linhagem, heads, forks, UCAN,
│   │                    #   Key Vault, épocas, Zen Engine, serialização v4
│   ├── transport/       # NetworkAdapters: in-memory(sim), ws, webrtc,
│   │                    #   relay, rendezvous, SwarmRegistry, promotion,
│   │                    #   trust model, throttle, private swarm
│   ├── media/           # Chunking, cifra por chunk, manifesto, WebTorrent,
│   │                    #   WebSeed adapter (fase posterior do ciclo)
│   ├── workers/         # Sync/Crypto/Index Workers (browser) + Comlink RPC
│   ├── client-sdk/      # API pública p/ apps: TinyBase bridge, persister,
│   │                    #   bootstrap, session
│   └── testkit/         # Simulador de rede, relógio virtual, fábricas de
│                        #   peers, cenários, asserções de convergência
├── apps/
│   ├── system-peer/     # Peer do sistema (Node): WS hub, signaling,
│   │                    #   tracker WSS, relay, super peer, Central Custody,
│   │                    #   conector SMTP, admin/reset
│   ├── bancada/         # PWA de teste/diagnóstico (a "UI funcional p/ testes")
│   └── web/             # PWA produto (consome client-sdk; cresce depois)
└── tools/
    ├── scenarios/       # Seeds e cenários reproduzíveis (JSON + scripts)
    └── e2e/             # Playwright multi-peer orquestrado
```

**Decisões fixadas:**

- **TypeScript estrito** em tudo; ESM; `tsup` para build; **Vitest** (unit/integração) e **Playwright** (E2E multi-context).
- **SQLite**: `wa-sqlite` ou SQLite WASM oficial com OPFS (browser, dentro do Sync Worker) e `better-sqlite3` (Node/peer do sistema) atrás da **mesma porta `StoragePort`** — schema e migrations compartilhados em `core`.
- **Peer do sistema = mesmo core.** O peer cloud é o mesmo `@plataforma/protocol` + `@plataforma/core` rodando em Node com adapters de servidor (WS hub, tracker, relay). Isso valida na prática o princípio v4 do "mesmo código reproduzível em todo lugar" e elimina drift de protocolo entre cloud e clientes.
- **Automerge Repo** entra somente nos papéis que a RFC permite: network adapters, documentos casca (rendezvous) e ephemeral messages — nunca como storage do grafo.

### 1.2 Ordem topológica do ciclo

```
M0 Fundação & Testabilidade
 └─► M1 Cripto & Identidade
      └─► M2 Peer do Sistema + Transporte WS + Handshake + FPP
           ├─► M3 RBSR + Ondas + Sync UCAN-scoped (sobre WS)
           │     └─► M6 Linhagem, Forks, Serialização v4
           ├─► M4 Malha WebRTC (rendezvous, promoção, relay, throttle)
           │     └─► M7 Private Swarm
           └─► M5 Auth completo (UCAN, épocas, recuperação, conectores)
                       └─► M8 BLOBs / Media Plane
M9 Endurecimento PWA + Suíte Adversarial + Observabilidade (transversal, fecha o ciclo)
```

A escolha de fazer **RBSR sobre WebSocket antes da malha WebRTC** é deliberada: o protocolo de reconciliação é validado de forma determinística contra o peer do sistema (caso corporativo/cloud-tronco, o foco comercial), e a malha WebRTC entra depois como *segundo* NetworkAdapter sob a mesma porta — exatamente como a arquitetura de adapters prevê.

---

## 2. Estratégia de Testes P2P (fundacional, não acessória)

O requisito "testar funcionalidades P2P, não só client/server" é resolvido em **três anéis**, do determinístico ao real:

### 2.1 Anel 1 — Simulação determinística (CI, milissegundos)

- **`SimNetwork` (testkit):** implementação in-memory de `NetworkAdapterPort` que conecta N peers no mesmo processo Node. Parametriza por link: latência (distribuição), perda de pacotes, jitter, banda, **partições nomeadas** (`net.partition(['A','B'], ['C'])`, `net.heal()`), e **perfis de NAT** (`open | cone | symmetric`) que determinam se a "promoção STUN" simulada sucede ou falha.
- **`VirtualClock`:** relógio injetado em HLC, timers do FPP (8s), heartbeats (15s/45s), TTL do Key Vault (4h), leases — testes avançam tempo sem esperar.
- **`SeededRandom`:** todo random do core via porta; cenários 100% reproduzíveis por seed.
- **Asserções de convergência:** helper `expectConverged(peers, scope)` compara root fingerprints e dumps das tabelas autorizadas.

### 2.2 Anel 2 — Integração multi-processo (CI, segundos)

- Peer do sistema real (Node) + 2–5 peers headless Node usando o adapter WS real. Valida wire format, Noise_XX real, reconexão, STALE_EPOCH, snapshots de bootstrap.

### 2.3 Anel 3 — E2E real (CI noturno + manual)

- **Playwright multi-context:** cada `browserContext` é um peer (OPFS isolado por origem+context). Orquestrador sobe peer do sistema + N abas; cenários: edição colaborativa, queda da cloud (`context.setOffline` / kill do processo) com **continuidade P2P entre peers conhecidos**, resume com anti-entropy O(1).
- **WebRTC real:** dois contexts trocando dados por data channel com signaling do peer do sistema; variante com TURN (coturn em docker-compose) para o caminho relay.
- **Limite honesto:** NAT simétrico real não é reproduzível em CI. A *lógica* de promoção/fallback é coberta no Anel 1 (perfil `symmetric` ⇒ relay permanece); um runbook manual (`tools/e2e/manual-nat.md`) documenta o teste de campo.

### 2.4 Reset de bancos e cenários limpos (requisito explícito)

| Superfície | Mecanismo |
| :--- | :--- |
| Browser (peer) | `resetLocalState()` no client-sdk: fecha workers → apaga OPFS (`navigator.storage.getDirectory()` recursivo), IndexedDB, CacheStorage, localStorage → `unregister()` do Service Worker → reload. Exposto como botão **"Reset deste peer"** na Bancada e via `window.__bancada.reset()` para o Playwright. |
| Peer do sistema | `POST /admin/reset` (somente `NODE_ENV!==production`, token de admin): trunca SQLite, limpa blobs, reinicia SwarmRegistry. `POST /admin/seed/:cenario` aplica seeds de `tools/scenarios/`. |
| Suíte | `pnpm scenario <nome>` — derruba tudo, reseta, sobe peer do sistema + N peers com identidades pré-geradas do cenário. Cenários iniciais: `vazio`, `genesis-corporativa`, `dois-peers-divergentes`, `fork-pendente`, `epoca-rotacionada`, `saldo-com-validador`. |
| Identidades de teste | Seeds BIP39 fixas por cenário (geração determinística de chaves) para que IDs/fingerprints sejam estáveis entre execuções. |

### 2.5 Vetores adversariais obrigatórios (segurança testada, não declarada)

Cada item vira teste permanente na suíte (`testkit/adversarial/`):

1. Assinatura inválida em nó recebido → rejeição + shadowban 24h no `RelayTrustModel`.
2. `STALE_EPOCH` no meio de RBSR → interrupção + desvio para catch-up Onda 0.
3. HLC futuro-distante (`pt > wall + MAX_DRIFT`) → quarentena, relógio local não poluído.
4. Filho `MUTATES` com `HLC ≤ pai` → rejeitado como malformado.
5. `RangeFooter` divergente com fingerprint coincidente → rodada de desafio com nonce.
6. UCAN expirado/cadeia quebrada/fora do escopo de traversal → peer fornecedor nega; nenhum fingerprint do subgrafo vaza.
7. Requisição de chave por peer presente em `BLOCKS` do autor → Key Vault nega (predicado de bloqueio).
8. Duas intents com `SPENDS` para o mesmo head → segunda não finaliza (invariante de core); double-spend sob partição → freeze escopado da linhagem.
9. Convite (`ASSET:INVITE`) reutilizado/expirado → cerimônia de consumo falha.
10. Rendezvous adivinhado só com `PERMISSION_ID` (sem `rendezvous_secret`) → sala inacessível.
11. Saldo bem-assinado com aritmética divergente (`anterior + delta ≠ novo`) → Zen Engine rejeita (invariante T1).
12. Peer sem token de fundação em rede vazia → `OFFLINE_RETRY`, nunca `GENESIS`.

---

## 3. M0 — Fundação do Monorepo & Testabilidade

**Objetivo:** esqueleto compilando, simulador de rede funcionando, Bancada abrindo, reset operacional. Sem nada disso, nenhuma tarefa de protocolo é verificável.

### E0.1 — Esqueleto e tooling

- **T-001 · Bootstrap do monorepo.** pnpm workspaces + turborepo + tsconfig base estrito + ESLint/Prettier + Vitest configurado por pacote. *Aceite:* `pnpm build && pnpm test` verdes com pacotes vazios exportando versão.
- **T-002 · CI.** GitHub Actions: build, unit, integração; job noturno E2E. Cache de pnpm/turbo. *Aceite:* pipeline verde no PR de T-001.
- **T-003 · Pacote `testkit` — relógio e random.** `VirtualClock` (now/setTimeout/advance), `SeededRandom`, e contrato `ClockPort`/`RandomPort` consumível pelos demais pacotes. *Aceite:* testes do próprio testkit; timers disparam sob `advance()`.
- **T-004 · Portas fundamentais.** Definir em `protocol`: `NetworkAdapterPort` (connect/listen/send/onMessage/close + metadados de peer), `StoragePort` (exec/transaction/migrate), `KeyStorePort`, `ClockPort`, `RandomPort`, `LoggerPort`. *Aceite:* type-check + doc de contrato em README.

### E0.2 — Simulador de rede

- **T-005 · `SimNetwork` v1.** Peers in-memory, entrega ordenada por link, latência fixa, API de partição/heal. Implementa `NetworkAdapterPort`. *Aceite:* teste com 3 peers trocando echo sob partição e cura.
- **T-006 · `SimNetwork` v2 — degradação.** Perda, jitter, banda, perfis de NAT (`open|cone|symmetric`) afetando "tentativa de conexão direta". *Aceite:* teste estatístico com seed fixa; perfil `symmetric` nunca permite direta.
- **T-007 · Asserções de convergência.** `expectConverged(peers, scope)`, dump/diff de tabelas, snapshot de fingerprints. *Aceite:* detecta divergência plantada em fixture.

### E0.3 — Bancada (UI de testes) v0 + Reset

- **T-008 · App `bancada` (Vite + React, PWA-ready).** Shell com abas vazias: Identidade, Rede, Sync, Auth, Dados, Cenários. *Aceite:* abre, instala como PWA, Playwright smoke test.
- **T-009 · Reset local do peer.** `resetLocalState()` no client-sdk (OPFS+IDB+Cache+SW+LS) + botão na Bancada + hook `window.__bancada`. *Aceite:* Playwright cria dado em OPFS, reseta, verifica limpeza total.
- **T-010 · Peer do sistema v0 + admin.** App Node com healthcheck, `POST /admin/reset`, `POST /admin/seed/:id`, gate por env+token. *Aceite:* integração: reset trunca DB e responde 403 em produção simulada.
- **T-011 · Runner de cenários.** `pnpm scenario <nome>`: reset geral → seed → sobe peer do sistema → instruções/URLs para abrir N peers. Cenário `vazio` implementado. *Aceite:* execução idempotente.

---

## 4. M1 — Núcleo Criptográfico, Identidade e Storage Local

**Objetivo:** identidade Ed25519 multi-camada, primitivas (ULID, HLC, blake2s, AES-GCM), schema SQLite com as otimizações v4, assinatura/validação de nós e arestas.

### E1.1 — Primitivas (`crypto`, `protocol`)

- **T-101 · Wrappers cripto.** Ed25519 (sign/verify), AES-256-GCM, SHA-256, blake2s256, HKDF — via `@noble/*` + WebCrypto onde disponível; isomórfico. *Aceite:* vetores de teste conhecidos (RFC/test vectors) passando em Node e em browser (Vitest browser mode ou Playwright).
- **T-102 · ULID + EntityId.** Geração via `ClockPort`+`RandomPort`; convenção do 11º caractere (`N`/`E`) da VFK; ordenação lexicográfica testada. *Aceite:* propriedade: ordenação ≡ ordem temporal sob clock virtual.
- **T-103 · HLC completo.** Empacotamento `(pt<<16)|c`, eventos local/envio/recepção (algoritmo do caderno-2/02 §3.5.3), ordem total `(pt, c, author_pubkey)`, `MAX_DRIFT` com quarentena. *Aceite:* testes de propriedade (causalidade ⇒ HLC crescente) + vetores adversariais 3 e 4 do §2.5.
- **T-104 · BIP39 + derivação + desbloqueio.** Seed 12/24 palavras → chave mestra Ed25519; chave do dispositivo via PBKDF2 da senha (senha = fator de desbloqueio, nunca identidade). *Aceite:* mesmo mnemônico ⇒ mesmas chaves; senha errada falha sem vazar timing grosseiro.
- **T-105 · PeerId (duas variantes — RFC-005 §A.5).** `DevicePeerId = blake2s256(DEVICE_PUB_KEY)` (identidade de transporte, chave estável do dispositivo) e `PersonaPeerId = blake2s256(PERSONA_PUB_KEY)` (identidade de aplicação); utilidades de encode/parse de multiaddr básico (`/dns4|ip4/.../wss/...#fragment`). *Aceite:* derivação estável das duas variantes; parsing round-trip.

### E1.2 — Schema e linhagem básica (`core`)

- **T-106 · Migrations + schema `nodes`/`edges`.** Conforme caderno-3/01 com otimizações v4: `pub_key`/`previous_hash` BLOB, `payload = [IV 12B][ciphertext]`, `retention_state` INTEGER, IDs TEXT, coluna `hlc` INTEGER assinada, índice `(entity_id, hlc)`. Roda em wa-sqlite (OPFS) e better-sqlite3. *Aceite:* migrations idempotentes nas duas engines; smoke de insert/select.
- **T-107 · Assinatura universal Layer 1.** Serialização canônica dos campos planos + payload cifrado → assinatura Ed25519; verificação isolada O(1). *Aceite:* alteração de qualquer campo invalida; vetor adversarial 1 (parcial — rejeição local).
- **T-108 · Linhagem Layer 2.** Aresta `MUTATES` com `previous_hash` = hash da assinatura da `MUTATES` anterior; validação topológica sem decifrar payloads. *Aceite:* remoção/reordenação de elo detectada.
- **T-109 · Projeção `entity_heads` + tombstones.** Trigger de head por maior HLC (equivalência estrutural garantida pela monotonicidade); deleção via lápide `active=0` + projeção `active_edges`. *Aceite:* head correto sob mutações concorrentes simuladas; lápide some das consultas e permanece no grafo.
- **T-110 · Key Vault v0 (Crypto Worker-ready).** Custódia de chaves de época em RAM com TTL 4h (via `ClockPort`), envelope/desenvelope AES, API local `requestKey(ucan, scope)` com validação stub (UCAN real no M5). **Ganha a face de rede (RFC-005 §A.12):** API `requestEpochKey(ucan, scope, prova_de_delegação)` servida a peers remotos dentro do canal Noise (frames `KEY_REQUEST`/`KEY_RESPONSE`); `requestKey` permanece interna e nunca exposta. *Aceite:* expiração de TTL limpa material; teste de não-vazamento por referência; `requestEpochKey` nega sem delegação `DELEGATED_TO` válida.
- **T-111 · Bancada: aba Identidade.** Criar/importar mnemônico, exibir PeerId/pub keys, travar/destravar com senha, reset de identidade. *Aceite:* Playwright: cria identidade, recarrega, destrava.

---

## 5. M2 — Peer do Sistema, Transporte WS, Handshake e Gênese

**Objetivo:** dois peers (browser) + peer do sistema (Node) se encontrando, autenticando com Noise_XX e mantendo o SwarmRegistry vivo. First Peer Protocol completo. É o tronco cloud que o restante assume.

### E2.1 — Wire protocol e handshake

- **T-201 · Wire format v1 (fixado — RFC-005 §A.2).** **MessagePack + Length-Prefixed Framing** (`[LENGTH u32 BE][VERSION u8][FRAME_TYPE u8][PAYLOAD MessagePack]`, conforme `caderno-2-protocol/05-wire-protocol.md`): tipos de frame `0x01–0x0B` (+`0xF0–0xFF` reservados), `identity_epoch_index`, `hlc`, payload; evolução de versão com quarentena `retention_state=3` para auditáveis não-parseáveis. *Aceite:* round-trip + fuzz leve de decoder (inputs malformados não derrubam o processo); frame de versão futura volátil é descartado mantendo a conexão.
- **T-202 · Noise_XX sobre porta de transporte.** Handshake 3-RT trocando `DevicePeerId`, `identity_epoch_index` (Época de Identidade — RFC-005 §A.1) e nonce assinado **com a chave do dispositivo** (RFC-005 §A.5); integração com lib Noise WASM/JS escolhida (ADR). Roda sobre qualquer `NetworkAdapterPort` (WS agora, DataChannel no M4). *Aceite:* mutual auth no SimNetwork e sobre WS real; chave errada → falha + evento para shadowban (vetor 1).
- **T-203 · Validação precoce de época.** Divergência de `identity_epoch_index` (Época de Identidade — RFC-005 §A.1) no handshake → conexão mantida e desviada para pipeline de catch-up (stub que será ligado à Onda 0 no M3). *Aceite:* teste com épocas divergentes não derruba conexão; flag de desvio emitida.
- **T-204 · Adapter WebSocket.** Cliente (browser/Node) e servidor (peer do sistema) implementando `NetworkAdapterPort` com reconexão exponencial e backpressure básico. *Aceite:* Anel 2: browser↔system-peer com Noise completo.

### E2.2 — SwarmRegistry e ciclo de vida

- **T-205 · SwarmRegistry em RAM.** Mapa de peers indexado por `DevicePeerId`: estado de conexão, latência (EWMA), tier declarado, score de relay, época de identidade. **Ganha a tabela auxiliar `device_personas`** (personas ativas/atestadas por dispositivo, com a época de identidade da validação — RFC-005 §A.5). API de consulta para roteamento. *Aceite:* unit com SimNetwork; eventos de entrada/saída corretos; troca de persona não abre conexão nova.
- **T-206 · Heartbeat implícito/explícito + evicção.** Tráfego zera timer; 15s ocioso → PING 8B; 3 falhas/45s → evicção + cool-off 5min + remoção de candidaturas. Modo economia (bateria <15%, via porta de ambiente) desativa PING explícito. *Aceite:* tudo sob VirtualClock; evicção e cool-off exatos.
- **T-207 · RelayTrustModel v0.** Score local não-transitivo por relay (uptime/latência/descartes), janela deslizante com histerese, shadowban silencioso; gancho consumido pelo registry. *Aceite:* relay degradado entra em shadowban só após histerese; congestionamento transitório não bane (anti falso-positivo).
- **T-208 · First Peer Protocol.** Máquina de estados JOINING → WAITING_FOR_SWARM(8s) → CONNECTED | GENESIS | OFFLINE_RETRY com backoff 10→60s; GENESIS exige bootstrap token ou ação explícita "Criar Nova Rede"; cria `PROFILE` admin + `SPECIFICATION` do workspace + `SPECIFICATION:NETWORK_BIRTH` imutável + flag `PROVISIONAL_SYSTEM_PEER`; transição a peer normal na chegada do segundo peer. *Aceite:* todos os ramos sob VirtualClock; vetor adversarial 12; NETWORK_BIRTH presente e imutável.
- **T-209 · Gênese gerida (peer do sistema).** Peer do sistema sobe com token de fundação via config e funda a rede corporativa/pública; URL de onboarding `https://host/sync#multiaddr=...` (fragment, não query). *Aceite:* cenário `genesis-corporativa` do runner: cloud funda, browser entra por URL e conecta.
- **T-210 · Convite `ASSET:INVITE` — emissão e cerimônia.** Asset consumível com expiry/single-use, payload `{multiaddr hints, invite_code, inviter_peer_id, assinatura, expiry}`; cerimônia: conexão → Noise → validação não-gasto → criação de `PROFILE:AUTHENTICATION` → aresta `VOUCHES_FOR` → lápide do convite. *Aceite:* fluxo feliz multi-peer + vetor adversarial 9.
- **T-211 · Bancada: aba Rede.** Visualização ao vivo do SwarmRegistry (peers, latência, estado, época, score de relay), log de handshakes, botões "derrubar conexão", "gerar convite", "entrar por convite/URL". *Aceite:* Playwright: dois contexts se enxergam via system-peer; convite consumido pela UI.

**Marco demo M2:** `pnpm scenario genesis-corporativa` → abrir duas abas → ver os dois peers autenticados e vivos na Bancada, com a cloud como hub.

---

## 6. M3 — Sincronização: RBSR, Ondas e Escopo por UCAN

**Objetivo:** convergência de grafo entre peers via Range-Based Set Reconciliation com fingerprints de 256 bits, ondas 0–2, snapshots de bootstrap e coordenação anti-thundering-herd — primeiro sobre WS/cloud, pronto para WebRTC.

### E3.1 — Núcleo RBSR (`protocol`)

- **T-301 · B-Tree de fingerprints.** Estrutura em memória ordenada por `id` com fingerprint individual `SHA-256(id‖signature)` e XOR agregado por sub-range; root cacheado com invalidação incremental por escrita durável. *Aceite:* propriedade: XOR(range) = ⊕ filhos; invalidação incremental ≡ recomputo total.
- **T-302 · Protocolo de troca RBSR.** Mensagens: root, split de sub-ranges equilibrados, recursão até isolar IDs, `REQUEST_NODES` cirúrgico, aplicação transacional dos registros recebidos (com validação Layer 1/2 + HLC na recepção). *Aceite:* SimNetwork 2 peers com divergências plantadas convergem; `expectConverged` verde; latência/perda não corrompem.
- **T-303 · RangeFooter + rodada de desafio.** Footer `{count, checksum}` em toda transferência de range; divergência ⇒ re-sync em modo desafio com nonce por sessão (nonce fora do caminho rápido). *Aceite:* vetor adversarial 5; cache do root preservado no caminho rápido.
- **T-304 · `ConcurrentReconciliationGuard`.** `BEGIN DEFERRED` sob WAL para snapshot da B-Tree; budget de tempo → abort + `wal_checkpoint(TRUNCATE)` + retomada do range pendente; "Diff Complementar" quando o usuário escreve durante o sync. *Aceite:* escrita local durante sync gera diff complementar; WAL não cresce além do budget em sync artificialmente lento.

### E3.2 — Escopo, ondas e coordenação

- **T-305 · Sync dirigido por UCAN (enforcement bilateral).** Extração da query de traversal do UCAN (root, depth≤6, direction, edge_filter) → CTE recursiva no SQLite delimitando a B-Tree; lado fornecedor valida UCAN anexado à requisição antes de servir qualquer fingerprint/delta. *Aceite:* vetor adversarial 6; peer sem UCAN não recebe nem o root do subgrafo.
- **T-306 · Ondas 0–2.** Onda 0: troca do root (anti-entropy O(1)) — inclui o catch-up de identidades acionado pelo T-203; Onda 1: cabeçalhos críticos/tela ativa (priorização por escopo declarado); Onda 2: histórico podado em background. Máscara de **ranges conhecidos-divergentes-mas-adiados** para não re-disparar reconciliação a cada resume. *Aceite:* resume com estado idêntico encerra em O(1); divergência adiada não re-processa até abertura do escopo.
- **T-307 · Coordenação de sync + failover.** Eleição determinística do líder local (menor `entity_id` ativo), sessão RBSR única com o líder; timer 5s → PING 2s → shadowban temporário → rollback WAL → re-eleição → retomada do último sub-range. *Aceite:* matar o líder no meio do RBSR sob SimNetwork: retomada sem perda nem duplicação.
- **T-308 · Snapshot de bootstrap.** Peer do sistema gera pacote compactado (`nodes`/`edges` podados) por escopo; novo peer baixa na Onda 1 e reidrata incrementalmente. *Aceite:* onboarding de peer novo com grafo de 50k registros fica ordens de magnitude mais rápido que RBSR puro (benchmark no CI noturno).
- **T-309 · GlobalThrottle.** Executa **no contexto dono do banco** (SharedWorker singleton ou Líder por Web Locks — RFC-005 §A.4; caderno-3/02 §1.4). Token bucket por swarm com cotas 70/20/10 por visibilidade (Page Visibility API atrás de porta), degradação mobile (bateria <30% / dados móveis ⇒ só aba ativa), reavaliação 30s. *Aceite:* unit sob VirtualClock; swarm sincronizado consome 0 tokens.
- **T-310 · Matriz de transporte (IoC).** `evaluateTransportHints()` como união discriminada; Persister consulta `SPECIFICATION.transport_hints` e roteia para `nodes/edges` (RBSR), `pending_changes` (efêmero), `device_state.db` (private swarm), RAM. *Aceite:* tabela de verdade completa testada; tipo errado não compila/roteia.
- **T-311 · Bancada: aba Sync.** Root fingerprints lado a lado, progresso por onda, ranges divergentes/adiados, log RBSR, botões "plantar divergência", "forçar resync", "simular partição" (via system-peer dev API). *Aceite:* Playwright: divergência plantada visível e convergida pela UI.
- **T-312 · Eleição de dono do banco por Web Locks + crash-recovery (NOVA — RFC-005 §A.4).** Caminho B do multi-aba: lock exclusivo `navigator.locks.request('plataforma-db-owner')`; primeira aba = Líder (inicializa a pilha), demais = Seguidoras (BroadcastChannel/MessageChannel); troca de posse **sem `beforeunload`** — liberação do lock ⇒ próxima aba assume via crash-recovery (abrir banco, checkpoint WAL, retomar do último checkpoint de range). *Aceite:* Playwright multi-context: matar a aba Líder transfere a posse e o sync retoma sem corrupção; Seguidora nunca abre OPFS.
- **T-313 · Archive Cargo — custódia cega (NOVA — RFC-005 §A.11; deps: T-301, T-305).** Empacotamento de lote por época (zstd + AES-256-GCM com a chave de época do escopo), `archive_id = blake2s256(ciphertext)`, manifesto `CONTENT` sob `SPECIFICATION:ARCHIVE_MANIFEST` (payload `{archive_id, blind_scope_id, epoch_index, hlc_range, size, expires_at}`), arestas `ARCHIVES` sob sync UCAN-scoped; entrega via canal `EPHEMERAL`; armazenamento do custodiante em `device_state.db` (tabela `blind_archives`); atribuição por consistent hashing sobre `blind_scope_id`; GC por `expires_at`. *Aceite:* custodiante recupera o ciphertext por `archive_id` sem jamais ver `pub_key`/autoria; integridade self-certifying (`blake2s256` + tag GCM); peer sem UCAN não enxerga as arestas `ARCHIVES` (vetor 6 estendido).

**Marco demo M3:** dois browsers + cloud; criar nós em A, ver em B; derrubar a cloud; reconectar; anti-entropy O(1) confirmando convergência na Bancada.

---

## 7. M4 — Malha WebRTC: Rendezvous, Promoção, Relay e Continuidade sem Cloud

**Objetivo:** peers conhecidos continuam trocando dados **sem o peer do sistema** (requisito explícito da PWA local-first). WebRTC como segundo adapter sob a mesma porta; cloud vira fallback/âncora, não dependência.

- **T-401 · Signaling no peer do sistema.** Troca de SDP/ICE via WS; salas derivadas de capability: `RendezvousId = SHA-256(rendezvous_secret ‖ ASSET:PERMISSION_ID)`; secret distribuído junto ao UCAN. *Aceite:* vetor adversarial 10; dois browsers estabelecem DataChannel real (Anel 3).
- **T-402 · Adapter WebRTC DataChannel.** `NetworkAdapterPort` sobre DataChannel; Noise_XX roda por cima (T-202 reutilizado); multiplexação de canais lógicos (RBSR, ephemeral, controle). *Aceite:* RBSR completo (suite do M3) rodando sobre WebRTC real entre dois contexts.
- **T-403 · Documentos casca (Automerge Repo).** **Pré-requisito: ADR-001 (Automerge como trilha única de CRDT — `docs/adr/adr-001-automerge-unico.md`).** Integração do Automerge Repo estritamente para rendezvous + ephemeral messages (RAM, sem histórico); ponte com o adapter WebRTC. Nenhuma dependência de Y.js é introduzida. *Aceite:* ephemeral broadcast entre 3 peers; nada persiste no grafo.
- **T-404 · `ConnectionPromotionEngine`.** Início ancorado (relay/cloud) para nós leves; tentativa de hole punching STUN em background; promoção imperceptível para direta quando NAT permite; **modo reverso** ao ir para background (fecha diretas, migra para relay — economia de sockets ~30). *Aceite:* SimNetwork perfis `cone` (promove) e `symmetric` (permanece relay, sem erro); E2E real com STUN público no job noturno.
- **T-405 · Relay de circuito.** Peer do sistema (e, futuramente, super peers desktop) retransmite frames entre dois peers sem decifrá-los (Noise é fim-a-fim); contabilização para o trust model. *Aceite:* dois peers `symmetric` simulados conversam via relay; payloads opacos ao relay (asserção de não-decifração).
- **T-406 · Descoberta morna (Graph-Based Routing v0).** `device_state.db` guarda histórico de peers (multiaddrs, últimas latências); no resume, tenta peers conhecidos em paralelo ao fallback WS; presença efêmera só em cache local, nunca no grafo. *Aceite:* cenário "cloud morta": A e B já se conhecem, cloud cai, ambos reabrem e se reconectam direto (Anel 1 determinístico + Anel 3 real em LAN do CI runner).
- **T-407 · Link multiaddr out-of-band.** Geração/parse de link/QR com multiaddr no fragment; primeiro contato via relay stateless. *Aceite:* peer novo entra numa rede P2P-pura de teste por link, sem cloud.
- **T-408 · Tracker WSS privado (peer do sistema).** Endpoint tracker para descoberta de seeders por InfoHash (consumido no M8; descoberta de swarm já validada aqui). *Aceite:* announce/scrape básico com autenticação por UCAN.
- **T-409 · Bancada: topologia.** Grafo visual de conexões (direta/relay/ws), estado de promoção por par, botão "forçar relay"/"tentar promoção", indicador de quem é âncora. *Aceite:* Playwright: promoção visível ao trocar perfil de NAT no system-peer dev API.

**Marco demo M4 (o teste-chave do produto):** dois browsers sincronizando **com a cloud desligada**, via WebRTC direto, com a Bancada mostrando a topologia.

---

## 8. M5 — Auth Completo: UCAN, Épocas, Recuperação e Conectores

**Objetivo:** o modelo de segurança inteiro operável: emissão/validação/delegação/revogação de UCAN, permissões físicas no grafo, rotação de época com forward secrecy pragmático, predicado de bloqueio, e os três modelos de recuperação — com o corporativo (Central Custody + senha/2FA/e-mail) completo de ponta a ponta.

### E5.1 — UCAN e permissões

- **T-501 · UCAN core.** Emissão/validação com cadeia de delegação (assinaturas Ed25519), `delegatable:false`, TTLs por tier de criticidade; payload **nunca** carrega chaves. *Aceite:* cadeias válidas/quebradas/expiradas; delegação recursiva respeitando limites do escopo original.
- **T-502 · `ASSET:PERMISSION`/`ASSET:ROLE` físicos.** Nós + arestas `AGGREGATES`/`REQUIRES` para `entity_id`; resolução de direitos **somente** pelo DAG físico (nunca payload de SPECIFICATION); invariante de traversal profundo (depth>1 ⇒ `edge_filter` obrigatório com pares `aresta→tipo_alvo`). *Aceite:* emissão de UCAN sem edge_filter com depth>1 rejeitada; resolução de papéis compostos correta.
- **T-503 · Validação de consentimento single-pass.** Traversal que alcança `ASSET:CONSENT`/`CONTENT:PERSONAL_DATA` rebaixa tier de TTL; emissão com TTL longo nesses escopos barrada (Zen Engine); checagem de consentimento + edge_filter num único passe. *Aceite:* matriz de casos de emissão; custo O(1 traversal).
- **T-504 · Revogação + revogação por cortesia.** Lápide de revogação de UCAN; sinal de expurgo (`retention_state=expunged`) propagado a peers cooperativos; documentar e testar o limite (peer não-cooperativo retém). *Aceite:* UCAN revogado deixa de servir dados na próxima requisição; expurgo aplicado em peers honestos do SimNetwork.

### E5.2 — Épocas e Key Vault completo

- **T-505 · Rotação de épocas.** **Pré-requisitos: RFC-005 §A.12 (Key Vault de Rede) e §A.10 (modo cooperativo).** Geração de nova chave AES por época de conteúdo; disponibilização **via Key Vault de Rede (`requestEpochKey`, uma operação por escopo — sem envelopes por dispositivo)** só a quem tem UCAN + delegação ativos; índice de época de conteúdo (`current_epoch_index`) por escopo; gravações novas usam a época nova; histórico legível com chaves antigas; **rotação offline enfileirada** com consolidação na reconexão; **estendido com o modo cooperativo P2P puro** (anel por `entity_id`, ata `SPECIFICATION:EPOCH_ROTATION`, freeze escopado por TTL — caderno-2/02 §3.3.1). *Aceite:* membro revogado lê histórico antigo mas não nós novos (mesmo com UCAN ainda em cache offline — distinção `UCAN válido ≠ acesso pós-rotação`).
- **T-506 · Predicado de bloqueio na liberação.** Key Vault consulta arestas `BLOCKS` do autor antes de entregar chave; latência de bloqueio = TTL da chave em RAM; bloqueio social (filtro de leitura) para escopo público. *Aceite:* vetor adversarial 7; rotação de época **não** é disparada por bloqueio.
- **T-507 · STALE_EPOCH no transporte.** Wire frames carregam `identity_epoch_index`; **`STALE_EPOCH` refere-se exclusivamente à Época de Identidade** (RFC-005 §A.1 — divergência de época de conteúdo é negativa do Key Vault na aplicação, nunca erro de transporte); drift durante transferência interrompe RBSR com `STALE_EPOCH` e força catch-up. *Aceite:* vetor adversarial 2 com rotação no meio de um sync longo.

### E5.3 — Recuperação e conectores

- **T-508 · Conector SMTP.** Interface `NotificationConnector` + implementação SMTP self-hostable no peer do sistema; templates spec-driven; creds fora do grafo; conteúdo bearer com TTL curto/single-use. *Aceite:* integração com mailhog no docker-compose; template de convite e de recovery enviados.
- **T-509 · Central Custody (corporativo).** Chave mestra do funcionário cifrada sob chave da empresa no peer do sistema; provisionamento; reset pelo admin; login usuário/senha (PBKDF2 desbloqueio) + 2FA TOTP + recuperação por e-mail (T-508). *Aceite:* E2E: provisionar → logar → perder senha → recuperar por e-mail → 2FA → acesso restaurado; limite honesto documentado no painel admin.
- **T-510 · Shamir 2-de-3.** Split/reconstrução sobre GF(2^8): shard dispositivo + shard provedor (protegido por hash de senha) + shard canal externo. *Aceite:* qualquer 2 shards reconstroem; 1 não; vetores de teste fixos.
- **T-511 · Modelo soberano.** Fluxo BIP39 puro com avisos de perda definitiva; export/import seguro. *Aceite:* round-trip de identidade entre dois "devices" (contexts) sem nenhum servidor.
- **T-512 · Bancada: aba Auth.** Inspetor de UCANs (cadeia, escopo, TTL), épocas por escopo, lista BLOCKS, simular revogação/rotação, fluxos de recuperação acionáveis. *Aceite:* Playwright cobre revogar → observar negativa de chave.

---

## 9. M6 — Linhagem Avançada: Forks, Automerge e Serialização por Linhagem (v4)

**Objetivo:** a camada de consistência que diferencia a plataforma: forks estruturais com merge determinístico, commit colaborativo via Automerge, e a invariante de core de não-duplo-gasto com validadores declarados.

- **T-601 · Detecção estrutural de fork + merge.** Duas `MUTATES` ativas no mesmo `source_id` sem ancestralidade ⇒ fork; mergeador eleito deterministicamente (preferência `PROFILE:SYSTEM`); nó de merge com duas `MUTATES` e HLC superior; convergência pela projeção de heads; head provisório = ramo de maior HLC. *Aceite:* partição no SimNetwork gera fork; cura propaga o merge via RBSR sem reconciliação extra.
- **T-602 · Ciclo de commit Automerge.** **Pré-requisito: ADR-001 (Automerge como trilha única; `pending_staging`/`CONTENT:AUDIT` legados substituídos por `pending_changes` + sumário em `AUTHORED`).** `pending_changes` local; ephemeral Changes entre co-editores (canal do T-403); gatilhos de commit por inatividade/limiar (configuráveis por SPEC); consolidação `Automerge.save()` → nó-versão assinado + `MUTATES` + `AUTHORED` com sumário; limpeza de staging. *Aceite:* dois editores digitando concorrentemente convergem; tabela `nodes` recebe só commits, nunca micro-changes.
- **T-603 · Committer determinístico (colapso v4).** Comutativo: agente local commita com desempate determinístico; co-assinatura opcional via ephemeral quando a SPEC exigir. *Aceite:* N peers commitando simultaneamente não geram fork no caso comum; co-assinaturas persistidas no nó final.
- **T-604 · Zen Engine embarcado + invariante T1.** Motor de regras (GoRules Zen WASM) lazy no Sync Worker; validação de mutação de saldo: payload carrega delta + referência causal; `anterior + delta == novo` obrigatória. *Aceite:* vetor adversarial 11.
- **T-605 · Fluxo de intent não-comutativo.** `CONTENT:INTENT` + arestas `SPENDS→head` (âncora de serialização), `CREDITS→entity_id`, `APPROVES` (K=1 caso comum, posse determinística da linhagem por `hash(entity_id)`), aplicador determinístico criando `MUTATES` + `TRANSFERS`; merge **aditivo** de créditos concorrentes (nunca LWW); `pending` local-não-replicado vs `finalized` durável. *Aceite:* vetor adversarial 8 completo: conflito estrutural detectável sem decifrar valores; double-spend impossível em operação normal.
- **T-606 · Congelamento escopado por linhagem.** Ausência do validador/quórum da linhagem ⇒ só aquele ativo congela read-only; resto da rede (leitura, gossip, RBSR, comutativos) segue; UI sinaliza o freeze. *Aceite:* derrubar validador no SimNetwork: débito pende, créditos e documentos fluem; retorno do validador drena a fila.
- **T-607 · Política de serialização em SPEC.** Bloco `serialization: {mode, set, k, fault_model, lease}` lido da SPEC do ativo; defaults por modalidade (corporativo `leader`=super peer; P2P `quorum` no anel de custódia); invariante de não-conflito permanece no core independente da política. *Aceite:* trocar política via seed muda comportamento sem recompilar; `k=0` malicioso não desativa a invariante.
- **T-608 · Bancada: aba Dados.** Navegador de linhagens (cadeia MUTATES, heads, forks pendentes, merges), inspetor de intents (pending/finalized, aprovações), botão "forçar fork" e "derrubar validador". *Aceite:* Playwright: fork forçado aparece e resolve visualmente.

---

## 10. M7 — Private Swarm (Cross-Device do Mesmo Usuário)

- **T-701 · `device_state.db`.** Banco SQLite isolado para a categoria Local+Persistente: rascunhos, cache de prefetch, preferências, histórico de peers (já consumido pelo T-406). *Aceite:* roteamento via matriz IoC (T-310) cai aqui automaticamente.
- **T-702 · Canal do Private Swarm.** `Device_Sync_Key = HKDF(master, "device-sync-v1")`; `RendezvousId = blake2s256(Device_Sync_Key)`; documento casca dedicado; E2E com a Device_Sync_Key; fora do RBSR principal; prioridade entre background e aba ativa. *Aceite:* RendezvousId observado não permite derivar a mestra (teste de derivação unidirecional); tráfego ilegível para o relay.
- **T-703 · Estratégias de merge por classe.** Preferências LWW por HLC; rascunhos via Automerge; cache de prefetch union-based. *Aceite:* dois devices offline editando rascunho convergem sem perda; união de caches verificada.
- **T-704 · Bancada: simulador de segundo device.** Botão "abrir como novo device da mesma identidade" (novo context com a mesma seed) + visualização do estado do private swarm. *Aceite:* Playwright: preferência muda no device A e aparece no B.
- **T-705 · Cerimônia QR + SAS — pareamento de dispositivo (NOVA — RFC-005 §A.5; deps: M1 cripto, M2 transporte WS).** Par efêmero de pareamento (TTL 5 min) + QR (multiaddr transiente, chave efêmera, nonce); canal Noise_XX de cerimônia; confirmação SAS derivada do transcript; emissão de `ASSET:PERMISSION` + `DELEGATED_TO` → chave definitiva do novo dispositivo + bump da Época de Identidade; destruição das efêmeras. A chave mestra **nunca** atravessa o canal; o novo dispositivo obtém chaves de época via `requestEpochKey` (T-110). *Aceite:* Playwright 2 contexts: pareamento completo via QR simulado; SAS divergente aborta (vetor MITM); revogação do dispositivo (lápide + bump) nega `requestEpochKey` subsequente.
- **T-706 · Documentação: padrões de descoberta (NOVA — RFC-005 §A.13).** Validar e manter `caderno-3-sdk/08-discovery-patterns.md` (Peer Propagation, Presence Announcement, Authoritative Directory; nota técnica OPRF **sem tarefa de implementação**). O core não implementa diretório; a descoberta do mensageiro (ciclo M-MSG futuro) usará o Pattern 3 na modalidade gerida. *Aceite:* doc revisado e linkado pelos verbetes/cadernos pertinentes; auditor do wiki verde.

---

## 11. M8 — Plano de Mídia (BLOBs)

**Objetivo:** transporte de arquivos pesados isolado do grafo, com cifra por chunk e fallback de fontes — priorizando o caminho gerido (WebSeed/cloud), que é o foco comercial.

- **T-801 · Chunking + cifra por chunk.** Fatiamento potência-de-2 (1 MiB), AES-256-GCM por chunk, região trailing de tags (`tag_region`), InfoHash sobre o ciphertext. Modos `convergent` (HKDF do conteúdo + salt_rede, nonce determinístico) e `unique` (HKDF da época + entity_id). *Aceite:* mesmo arquivo ⇒ mesmo InfoHash no convergent e InfoHashes distintos no unique; vetores GCM válidos por chunk; streaming decifra progressivamente sem carregar o arquivo inteiro.
- **T-802 · Manifesto, renditions e fontes.** Nó `CONTENT` por rendition com schema do caderno-3/05 §4.3; arestas `RELATES:MEDIA:RENDITION` e `SERVES` (fontes duráveis); `MUTATES` proibido entre renditions (lint de grafo). *Aceite:* validação de schema; fontes adicionadas/removidas por aresta/lápide.
- **T-803 · Adapter WebTorrent (browser).** Download por WebRTC + tracker WSS privado (T-408); entrega de chunks ao pipeline de decifração. *Aceite:* dois browsers seedando/baixando um blob cifrado de 50 MB no Anel 3.
- **T-804 · Cloud WebSeed + Edge translation.** Upload consolidado pelo agente do sistema; objeto único com tag_region; Edge stateless content-blind traduzindo Range↔peça e injetando token de bucket; fallback swarm→WebSeed. *Aceite:* download funciona com zero seeders P2P; Edge nunca recebe a chave AES (asserção de interface).
- **T-805 · Pipeline de reidratação no browser.** Service Worker intercepta `/blobs/{infohash}` → MessageChannel → Sync Worker → adapter → Crypto Worker (zero-copy transferables) → ReadableStream/SourceBuffer; tag_region buscada primeiro; backpressure 20/5 MB; chunks decifrados nunca expostos ao JS da página. *Aceite:* `<video>` toca um MP4 cifrado via P2P/WebSeed; PAUSE/RESUME observados sob throttling do Playwright.
- **T-806 · Onda 3 + G4 v0.** Reidratação lazy de payloads podados via `REQUEST_NODES`/blobs sob demanda; GC com pools (LRU para grafo, rarest-first p/ blobs), pins (`ASSET:PIN`), pausa tier-aware por bateria, e protocolo de poda segura (jitter + RELEASE/ACK + health-check) — **a confirmação de N≥3 usa o Archive Cargo (T-313) como mecanismo de custódia quando audiência < N (RFC-005 §A.11)**. *Aceite:* poda nunca reduz cópias íntegras abaixo de N=3 no SimNetwork (teste de corrida com todos os custódios podando "ao mesmo tempo").
- **T-807 · Bancada: aba Mídia.** Upload de arquivo de teste, escolha de modo de cifra, visualização de seeders/fontes, player, botão "derrubar WebSeed". *Aceite:* Playwright smoke do fluxo upload→play.

---

## 12. M9 — Endurecimento, Observabilidade e Fechamento do Ciclo

- **T-901 · PWA produto v0 (`apps/web`).** Shell instalável offline-first consumindo o client-sdk: login (3 modelos), lista/edição de um tipo de CONTENT colaborativo, indicador de conectividade/topologia. Prova que o SDK é consumível fora da Bancada. *Aceite:* Lighthouse PWA ≥ 90; funciona offline após primeiro load; edita e sincroniza ao voltar.
- **T-902 · Suíte adversarial consolidada.** Os 12 vetores do §2.5 como suíte nomeada e obrigatória no CI; relatório de cobertura de invariantes (mapa vetor→teste→seção da spec). *Aceite:* `pnpm test:adversarial` verde e bloqueante.
- **T-903 · Telemetria local + painel.** Métricas (RTT, bytes por onda, tempo de Onda 0 em resume, taxa de promoção de conexão, WAL size) expostas na Bancada e exportáveis; **meta medida:** Onda 0 < 100 ms em malha quente, < 500 ms no resume morno. *Aceite:* benchmark no CI noturno com limiares de regressão.
- **T-904 · Caos programado.** Modo "chaos" no SimNetwork e no system-peer dev API: quedas aleatórias, partições, rotações de época, kills de líder — rodando a suíte de convergência por N minutos com seed. *Aceite:* 30 min de caos sem violação de invariantes (assinaturas, heads, não-duplo-gasto, convergência pós-cura).
- **T-905 · Documentação de integração + ADRs.** ADRs acumulados (wire format, lib Noise, wa-sqlite, etc.) revisados; guia "como escrever um módulo sobre o SDK"; runbook de NAT manual; atualização dos verbetes afetados no wiki Foam. *Aceite:* auditor-wiki sem links quebrados para os novos conceitos.

---

## 12.1 Preparativos do Design System (RFC-006 §A.5)

> Estas tarefas seguem o DoD "UI da Bancada" (§0.2) onde aplicável; T-DS-01/02 seguem DoD "Protocolo/core" (build determinístico + tipos exportados). Fonte normativa: `caderno-3-sdk/10-design-system.md §1–§3`.

- **T-DS-01 · Importar pacote de tokens + build multi-plataforma.** Mover os artefatos de tokens JSON e `style-dictionary.config.js` do protótipo para `core/design-system`. Configurar build Style Dictionary gerando CSS custom properties, JS/TS, React Native, iOS Swift, Android XML e variante TV. *Aceite:* `pnpm --filter @plataforma/design-system build` verde; tipos exportados; nenhuma variável literal hardcoded.
- **T-DS-02 · Importar schema de metadados + índice + CI.** Mover o schema TypeScript canônico (`ComponentIdentity`, `Usage`, etc.) e o gerador de `components.index.json` para o pacote. Integrar ao CI validação de drift de schema, tokens mal classificados e anti-patterns malformados. *Aceite:* CI verde com testes de validação automáticos.
- **T-DS-03 · Portar componentes-piloto para `core/design-system` consumindo tokens semânticos.** Migrar `Button`, `Input`, `Card`, `Message`, `NavItem`, `Toast` (shadcn-based) para consumir exclusivamente tokens semânticos exportados pelo build do T-DS-01. Nenhum componente consome primitivos diretamente nem valores literais. *Aceite:* lint anti-literal (I3) verde; teste Playwright de smoke para cada componente.
- **T-DS-04 · Lint anti-literal (I3).** Implementar regra de lint de CI que bloqueia qualquer declaração de cor/fonte/dimensão literal em qualquer módulo. Integrar ao pipeline de build do monorepo. *Aceite:* `pnpm lint` falha em caso de literal hardcoded; passe no código limpo.

---

## 12.2 Preparativos de IA e RAG (RFC-011 §A.8)

> Estas tarefas integram o substrato de IA e RAG como capacidades do monorepo, estendendo o motor SQLite e o Crypto Worker. Fonte normativa: `docs/caderno-3-sdk/14-ia-rag-e-agentes.md`.

- **T-IA-01 · Projeção vector_index + Crypto Worker.** Implementar a 7ª projeção `vector_index` usando sqlite-vec (WASM/nativo) e integrá-la ao pipeline do Crypto Worker para disparar geração de embedding ao decifrar payloads com campos `embeddable: true`. *Aceite:* banco local cria e atualiza vetores nas mutations; testes de integridade da projeção.
- **T-IA-02 · Capacidades compute de IA como plugins.** Registrar LLM e embedding como capacidades `compute` do protocolo de plugins da RFC-010, permitindo execução local (on-device), remota (peer serves) ou external (APIs de provedores via conector Classe E). *Aceite:* chamada unificada via ComputePort resolvendo modelo/site corretamente.
- **T-IA-03 · Recuperação Híbrida (RRF).** Desenvolver a lógica de Reciprocal Rank Fusion (RRF) combinando busca léxica (FTS5), semântica (sqlite-vec) e estrutural (arestas de travessia do grafo), aplicando filtros de permissão baseados nas UCANs do principal. *Aceite:* queries RRF retornam apenas nós que o usuário logado tem permissão para visualizar.
- **T-IA-04 · Persona de Agente de IA com escopo.** Modelar a persona do agente de IA com `ASSET:ROLE` delegado e escopado pelo usuário principal, permitindo propor `CONTENT:INTENT` e gerar código declarativo `SPEC:PAGE` validado na autoria/ingestão. *Aceite:* intents propostos fora do escopo do ASSET:ROLE são rejeitados na validação.
- **T-IA-05 · Command Palette e resoluções de IA.** Implementar a command palette no shell com classificação de intenção (busca, ação ou geração), suporte a render progressivo por streaming de páginas geradas por IA. *Aceite:* classificação barata on-device e UI Lovable streams corretamente.
- **T-IA-06 · Vetores adversariais de IA.** Baterias de teste provando contenção: agente agindo fora do escopo, tentativa de furar bloqueio (UCAN), embedding de campo restrito roteado a external, agente agindo sobre fato superado (supersessão heads-only), command palette executando ação acima do privilégio. *Aceite:* todos os testes adversariais resultam em recusa/bloqueio ou fato-negativo-verificável.

---

## 12.3 Preparativos do Workflow (RFC-022 §A.10)

> Estas tarefas integram o interpretador e a máquina de estados rasa de workflows na engine da plataforma. Fonte normativa: `docs/caderno-3-sdk/24-workflow-reference-spec.md`.

- **T-WF-01 · Formato SPEC:WORKFLOW Nível 1 + Validador.** Definir a estrutura do nó `SPECIFICATION` (kind: `WORKFLOW`) e implementar o validador estático de boa-formação (unidade de guarda, envelope de segurança contra JS inline, limites de recursos ZEN). *Aceite:* validador bloqueia workflows malformados ou com JS inline; build determinístico.
- **T-WF-02 · Interpretador Nível 1 sobre Event Sourcing.** Desenvolver o interpretador de mestre rasa de estados (estados, transições simples com guardas Zen, entry/exit, timers baseados em deadlines HLC com processamento assíncrono via Job Queue/agentes de sistema). *Aceite:* reconstrução de estado via re-fold da linhagem de eventos finalizados; testes unitários.
- **T-WF-03 · Integração com Saga (ASSET:LOCK) + Escalabilidade Humana.** Integrar o interpretador com a saga de compensação da RFC-012 A.4 e criar suporte para tarefas de aprovação (`APPROVED_BY`) com SLAs de escalonamento. *Aceite:* tarefas humanas estourando SLA ativam a política de escalonamento; reversão de locks limpa estados.
- **T-WF-04 · Geração Mermaid e Leitura Visual.** Implementar gerador determinístico que lê a definição da máquina e reconstrói o diagrama em Mermaid para exibição no shell e na suíte office. *Aceite:* diagramas refletem fielmente estados e transições em runtime.
- **T-WF-05 · Vetores adversariais de Workflow.** Testes provando contenção de segurança: guarda fora do registro Zen rejeitada, ação proposta acima do privilégio da persona do autor bloqueada, tentativa de mutar e replicar o nó de estado do workflow recusada, e aborto automático ao estourar orçamento de recursos. *Aceite:* testes adversariais de segurança executados com 100% de sucesso.

---

## 12.4 Preparativos dos Plugins de Frontend (RFC-024 §A.8)

> Estas tarefas definem o suporte à categoria `ui` de plugins isolados em sandbox de iframe e o motor de jogos data-driven. Fonte normativa: `docs/caderno-3-sdk/26-plugins-frontend.md`.

- **T-UI-01 · Categoria ui no modelo de plugins.** Adicionar a categoria `ui` na especificação do manifesto do plugin (props de entrada, intents de saída, capacidades requeridas), estendendo as tarefas do protocolo de computação. *Aceite:* manifesto validado no marketplace e assinatura verificada; build determinístico.
- **T-UI-02 · Host de Sandbox e Bridge postMessage.** Criar o host de sandbox para execução do plugin via iframe sandbox (ou Worker com OffscreenCanvas para renderização headless), implementando a bridge postMessage tipada e autenticada com rate-limit anti-flood. *Aceite:* execução sem acesso ao DOM externo, rede restrita e comunicação controlada pela ponte; testes Playwright.
- **T-UI-03 · Componente rico GameEngine.** Desenvolver o componente rico `GameEngine` no catálogo de componentes para rodar jogos 2D/3D data-driven estruturados como especificação baseada em dados + ZEN. *Aceite:* componentes Phaser/PixiJS/three.js interpretam specs de cena e interagem via intents com a plataforma.
- **T-UI-04 · Validação estrita e Vetores adversariais de UI.** Implementar regras estritas de análise estática e de runtime e criar testes provando contenção: plugin tentando tocar o DOM externo ou rede não declarada, intents acima do privilégio do usuário rejeitados, e suspensão do plugin ao exceder a cota de CPU/memória/mensagens. *Aceite:* tentativas de quebra da sandbox resultam em bloqueio imediato e alertas na UI.

---

## 12.5 Preparativos de Módulos (RFC-027 §A.6)

> Estas tarefas definem o plano de comando e a compartimentação de profiles de módulos e mensageria. Fonte normativa: `docs/caderno-4-governance/02b-modulos-profiles-mensageria.md`.

- **T-MOD-01 · Profile de Módulo e Mensageria de Comando.** Implementar a entidade de profile de módulo e o barramento de mensagens de comando (intents duráveis `CONTENT:INTENT` e sinais efêmeros de coordenação em canal isolado). *Aceite:* envio e processamento síncrono/assíncrono de intents/sinais tipados; barramento no CI.
- **T-MOD-02 · Delegados Compartimentados e Operações Cross-User.** Criar o mecanismo de profile-delegado instanciado preguiçosamente por par (usuário × módulo) e escopado pelo `ASSET:ROLE` do usuário, garantindo que operações cross-user rodem estritamente com as permissões de leitura do próprio usuário. *Aceite:* isolamento de dados entre usuários no mesmo módulo comprovado via testes.
- **T-MOD-03 · Sessões Colaborativas CRDT.** Desenvolver sessões editoriais como documentos CRDT Automerge efêmeros e local-first, integrando o profile do módulo como co-editor via intents de proposta e implementando fluxo de opt-in para persistência. *Aceite:* sincronização em tempo real de rascunhos de edição e salvamento definitivo sob comando manual.
- **T-MOD-04 · Vetores Adversariais de Módulos.** Testar contenção adversária: delegado de módulo tentando acessar dados fora da área do usuário (recusa), mensagem de comando com privilégio superior ao remetente (recusa), e agregação de dados restrita ao escopo público. *Aceite:* todos os acessos indevidos são bloqueados e logados com alertas.

---

## 12.6 Preparativos do Shell e Composição (RFC-026 §A.12)

> Estas tarefas definem a árvore FlexLayout do shell, gerenciamento de espaço e a composição visual de painéis de módulos. Fonte normativa: `docs/caderno-3-sdk/28-shell-e-composicao.md`.

- **T-SHL-01 · Shell FlexLayout + SPEC:WORKSPACE.** Construir o shell baseado em árvore FlexLayout polimórfica ligando cada painel a uma tupla (módulo, rota, params), implementando o nó `SPEC:WORKSPACE` para serializar e salvar os layouts de workspaces. *Aceite:* layouts de colunas aninhadas renderizam corretamente na Bancada e salvam/restauram dinamicamente.
- **T-SHL-02 · Solver de Layout e Pilha de Colapsados.** Implementar o gerenciador de espaço determinístico resolvendo as restrições declaradas nos manifestos (larguras, colapso) e empilhando painéis excedentes em uma pilha visível de colapsados. *Aceite:* redimensionamentos recalculam e colapsam painéis sem perda silenciosa de estado.
- **T-SHL-03 · Responsividade Contínua e Chrome como Módulo.** Adaptar o shell para transição contínua (multi-colunas no desktop ↔ tela única com footer no mobile) e modelar os menus/headers/footers (chrome) como módulos comuns spec-driven reconfiguráveis. *Aceite:* layouts mobile e desktop usam a mesma lógica unificada de navegação; themeable.
- **T-SHL-04 · Drag-and-Drop e Compartilhamento como Comandos.** Implementar gestos de arrastar (desktop) e compartilhar (mobile) como mensagens de comando dirigidas ao profile do módulo de destino, com regras de drop zones e undo para intents irreversíveis. *Aceite:* arrastar itens destaca alvos válidos; confirmações barram intents irreversíveis acidentais.
- **T-SHL-05 · Command Palette, Camada de Overlay e Suspense.** Implementar a command palette (Cmd/Ctrl-K) como overlay do shell, e o render-sleep para desmontagem de painéis ocultos ou colapsados mantendo o estado de sessão em memória. *Aceite:* desmontagem de painéis WebGL/mídia libera RAM/GPU; palette binda buscas e ações de IA.

---

## 13. Tabela-Resumo de Dependências entre Marcos

| Marco | Depende de | Entrega demo-ável |
| :--- | :--- | :--- |
| M0 | — | Monorepo + simulador + Bancada vazia + reset total |
| M1 | M0 | Identidade criada/destravada na Bancada; grafo assinado local |
| M2 | M1 | 2 browsers + cloud autenticados; gênese; convites |
| M3 | M2 | Convergência RBSR via cloud; anti-entropy O(1) no resume |
| M4 | M3 | **Sync P2P direto com a cloud desligada** |
| M5 | M2 (paralelo a M3/M4) | Login corporativo completo; revogação/rotação ao vivo |
| M6 | M3, M5 | Fork+merge; intent financeira com validador; freeze escopado |
| M7 | M4, M5 | Rascunho sincronizando entre 2 devices da mesma pessoa |
| M8 | M4, M5 | Vídeo cifrado tocando via P2P com fallback WebSeed |
| M9 | todos | PWA produto v0 + suíte adversarial + caos verde |

> **Inserções da RFC-005 (verificadas sem ciclo):** T-312 e T-313 em M3 (T-313 depende de T-301/T-305, ambos M3; T-806/M8 consome T-313 — M8 já depende de M4/M5 ⇒ ordem topológica preservada); T-705 e T-706 em M7 (dependem de M1 cripto + M2 transporte, já transitivas em M7); ADR-001 é pré-requisito documental de T-403 (M4) e T-602 (M6) — já aceita, sem aresta nova; Key Vault de Rede (§A.12, em T-110/M1) é pré-requisito de T-505 (M5) — M5 já depende de M2→M1.

## 14. Riscos Técnicos a Validar Cedo (spikes curtos, 1 tarefa cada)

1. **S-01 (antes do T-202):** escolha da lib Noise_XX (WASM vs JS puro) — benchmark de handshake no mobile-class CPU.
2. **S-02 (antes do T-106):** wa-sqlite OPFS vs SQLite WASM oficial — performance de CTE recursiva e WAL em OPFS. **A parte multi-tab foi resolvida e promovida de spike a seção de caderno (RFC-005 §A.4 → caderno-3/02 §1.4):** SharedWorker singleton (Caminho A) com fallback de eleição de Líder por Web Locks + crash-recovery (Caminho B); resta no spike apenas o benchmark de storage.
3. **S-03 (antes do T-301):** custo de manter a B-Tree de fingerprints para 1M de registros em RAM de mobile — decidir paginação/persistência parcial.
4. **S-04 (antes do T-803):** estado atual do ecossistema WebTorrent em 2026 (manutenção, trackers WSS) — plano B: implementação própria mínima de troca de chunks sobre os DataChannels já existentes (a malha do M4 já dá 80% do caminho).
5. **S-05 (antes do T-403):** versão/API do Automerge Repo para ephemeral + network adapter custom — confirmar que documentos casca sem histórico não vazam memória em sessões longas.

---

*Plano gerado a partir da documentação V0.41 em 10/06/2026. Cada T-xxx referencia as seções normativas correspondentes; em divergência entre este plano e os cadernos, os cadernos prevalecem e o plano deve ser corrigido via PR.*
