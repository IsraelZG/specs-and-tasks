# 02-sync-worker-and-memory-lifecycle.md — Sync Worker & Memory Lifecycle

Este documento especifica a arquitetura de execução em segundo plano, a sincronização em ondas, o ciclo de vida do cache em memória e o Garbage Collection da Plataforma Projeto SuperApp V0.41.

---

## 1. Orquestração de Web Workers

Para garantir que a Main Thread da interface (UI) permaneça responsiva durante operações de sync e criptografia em lote, a camada lógica da aplicação executa dividida em três **Web Workers** assíncronos no navegador/WebView:

```
                  ┌─────────────────────────────────┐
                  │      Main Thread (React UI)     │
                  └────────────────┬───▲────────────┘
                        postMessage│   │Reactive updates
                      (via Comlink)│   │(TinyBase Store)
                  ┌────────────────▼───┴────────────────┐
                  │             Sync Worker             │
                  └──────────────┬──────────┬───────────┘
                                 │          │
                     postMessage │          │ postMessage
                                 ▼          ▼
                       ┌───────────┐      ┌───────────┐
                       │Crypto Wkr │      │ Index Wkr │
                       └───────────┘      └───────────┘
```

### 1.1 Sync Worker
O Worker central do sistema operacional de dados local. Suas responsabilidades são:
* Orquestrar o **Automerge Repo** (carregamento de snapshots, aplicação de Changes e controle de conexões WebRTC).
* Manter o loop de sincronização por **Range-Based Set Reconciliation** de dados estruturados.
* Gerenciar as transações diretas no banco de dados SQLite WASM persistido em OPFS.
* **Zen Engine (Validador Procedural)**: Motor leve de execução procedural (WASM com interpretador AST simplificado) embutido no worker. Ele executa de maneira preguiçosa (lazy-loading no mobile) as regras de negócio declaradas nas `SPECIFICATION`s (validações locais, processamento de migrações estruturais de dados e políticas multi-sig), garantindo economia de RAM e CPU.
  * **Invariante de Validação de Saldos (T1)**: No modelo *state-based* (onde o saldo `ASSET:BALANCE_STATE` é atualizado via linhagem de versões e não por somatórios físicos do banco de dados), a auditabilidade reside inteiramente na integridade da linhagem e do validador. Assim, o Zen Engine **obrigatoriamente exige** que toda mutação de saldo carregue, em seu payload criptografado: (a) o delta de alteração (valor transferido), e (b) a referência causal à transação ou aresta correspondente. Em contextos de fintech regulada, o validador do Zen Engine executa obrigatoriamente a validação aritmética no momento do commit: `saldo_anterior + delta == saldo_novo`, rejeitando qualquer nó de saldo cuja matemática declarada divirja, protegendo o sistema contra adulterações de saldo bem-assinadas.
* Comunicar-se com a Main Thread via RPC utilizando a biblioteca **Comlink**.

### 1.2 Crypto Worker
Worker isolado para processamento criptográfico pesado.
* Executa encriptação e decifração de payloads (AES-256-GCM) em batch.
* Valida assinaturas Ed25519 em blocos durante sincronizações em massa (Onda 1 e 2).
* **Cofre de Chaves (Key Vault)**: Subsistema interno para custódia segura de chaves. Intercepta tokens UCAN para validar direitos (`ASSET:PERMISSION` ou `ASSET:ROLE`) e entrega a chave de conteúdo correspondente baseada no TTL do papel ativo.
* Armazena em RAM as chaves de época decifradas, com **TTL rígido de 4 horas**. Após a expiração, as chaves são limpas da memória física do worker.

### 1.3 Index Worker
Worker que processa mensagens e payloads decifrados de forma assíncrona.
* Reconstrói e atualiza as tabelas virtuais locais do indexador FTS5 (`search_index_fts`) e dados geográficos do `geo_index`.

### 1.4 Propriedade do Banco Multi-Aba: SharedWorker com Posse por Web Locks

A pilha local ([[sync-worker]]/[[crypto-worker]]/[[index-worker]] + `StoragePort`) tem **um dono por origem**.

- **Caminho A (preferencial; desktop, Android Chrome):** workers e `StoragePort` num `SharedWorker` singleton, dono do lock OPFS. Abas conectam via `MessagePort`/Comlink e operam como terminais de UI ([[tinybase]] local por aba). O `GlobalThrottle` roda no SharedWorker.
- **Caminho B (fallback; Safari/iOS sem SharedWorker):** posse representada pelo lock exclusivo `navigator.locks.request('plataforma-db-owner', ...)`. A primeira aba a obtê-lo é **Líder** e inicializa a pilha; as demais ficam enfileiradas no lock e operam como Seguidoras (encaminham via `BroadcastChannel`/`MessageChannel`). **A troca de posse não depende de `beforeunload`:** ao fechar/travar/morrer a Líder, o navegador libera o lock e a próxima aba o adquire, assumindo pelo caminho normal de **crash-recovery** (abrir banco, checkpoint do WAL, retomar do último checkpoint de range). Despedida graciosa é otimização quando ocorrer, nunca premissa.

Toda menção a "o Sync Worker" lê-se "o Sync Worker do contexto dono"; abas nunca abrem conexão própria com o OPFS.

### 1.5 Key Vault de Rede — API `requestEpochKey`

> **Normativo (RFC-005 §A.12).** Estende o [[key-vault]] local (§1.2) com a face **de rede**, usada para re-entrega de chaves de época a dispositivos delegados. Definição normativa completa em [[caderno-2-protocol/02-cryptographic-lineage-and-auth#332-re-entrega-de-chave-de-época-a-dispositivos-delegados-key-vault-de-rede]].

* **API de rede:** `requestEpochKey(ucan, scope, prova_de_delegação) → chave_de_época | DENIED`. Valida cadeia UCAN do escopo, `DELEGATED_TO` (dispositivo → persona membro), predicado `BLOCKS` e frescor da Época de Identidade. A resposta trafega **dentro** do canal Noise (frames `KEY_REQUEST`/`KEY_RESPONSE` do [[caderno-2-protocol/05-wire-protocol]]).
* **API local:** `requestKey(scope)` (consumo do Sync Worker para decifrar payloads) permanece interna e **nunca** é exposta a peers remotos.
* **Hot start natural:** dispositivo recém-delegado sincroniza o grafo (RBSR), chama `requestEpochKey`, recebe a chave e lê o histórico — O(1) por escopo, sem envelopes por dispositivo.
* **Limite honesto (P2P puro):** sem peer online detentor da chave, o pedido aguarda reconexão (liveness). Na modalidade gerida, o peer do sistema elimina o limite.

---

## 2. TinyBase como Ponte Reativa

A Main Thread da interface de usuário nunca realiza conexões diretas ou consultas SQL no banco SQLite local. 

* **Cache em Memória**: A UI lê e escreve exclusivamente em uma Store do **TinyBase** em memória.
* **Política de Espelhamento Parcial**: TinyBase retém em cache (`nodes_cache` e `edges_cache`) apenas o conjunto de dados ativamente assinados pela janela visível da UI atual, mais um buffer de virtualização. Quando componentes se desinscrevem, a RAM é limpa.
* **Persistência Assíncrona (Persister)**: Um persister customizado do TinyBase intercepta escritas e envia os deltas de forma assíncrona ao Sync Worker para gravação durável no SQLite. Triggers SQLite atualizam `entity_heads` no banco, e o persister lê a alteração atualizando reativamente a store do TinyBase.

---

## 3. Sincronização em Ondas (Waves)

Ao realizar o primeiro login ou retornar após longa ausência, o Sync Worker prioriza a transferência de dados em ondas sucessivas para tornar a interface usável em segundos:

* **Onda 0: Operacional (Segundos)**: Baixa a identidade-âncora (`PROFILE:AUTHENTICATION`), as personas do usuário, as permissões ativas (`local_permissions`) obtidas via UCAN, configurações básicas e as specifications de rede. **A UI abre.**
* **Onda 1: Domínios Prioritários (Minutos)**: Baixa o saldo quente de ativos (`ASSET:BALANCE_STATE`), as notificações recentes e o histórico de conversas dos últimos 30 dias.
* **Onda 2: Histórico em Segundo Plano (Background)**: Baixa o histórico completo em estado **Podado** (apenas IDs, signatures e arestas do grafo, sem payloads pesados).
* **Onda 3: Sob Demanda (Lazy)**: Quando o usuário rola o histórico ou abre um documento antigo que está podado, o Sync Worker executa **Graph-Based Routing** em tempo real para solicitar o payload criptografado aos peers conectados e reidratar o nó para o estado **Integral**.

### 3.1 Sincronização Oportunística e Anti-Entropy no Mobile
Para evitar o consumo excessivo de bateria e CPU no mobile sem causar perda de consistência, o agendamento de sincronização adota duas estratégias:
*   **Anti-Entropy em $O(1)$**: Ao inicializar o aplicativo ou retornar do modo suspenso (resume), o Sync Worker realiza uma troca rápida apenas do fingerprint raiz ($XOR$ total) do escopo autorizado do usuário com os peers conectados. Se os fingerprints coincidirem, o estado é considerado idêntico e o processo encerra instantaneamente em $O(1)$, economizando recursos.
*   **Reconciliação Oportunística por Janela Temporal**: Caso ocorra divergência de fingerprints, o Sync Worker restringe a reconciliação recursiva baseada em ranges estritamente ao **contexto que o usuário está visualizando ativamente** e limitando a busca a uma **janela temporal recente** (ex: do timestamp do último sincronismo bem-sucedido até o presente). O restante do grafo é deixado para reidratação sob demanda (Onda 3).
*   **Memória de Divergências Adiadas**: Para evitar que a divergência de dados históricos não-sincronizados (adiados para a Onda 3) fique re-disparando o loop de reconciliação a cada *resume* do aplicativo devido à falha do fingerprint raiz $O(1)$, o Sync Worker local mantém um conjunto dinâmico em RAM de **`ranges conhecidos-divergentes-mas-adiados`**. Esse conjunto age como uma máscara sobre o cálculo de anti-entropy, evitando que desvios em contextos passivos forcem processamentos redundantes até que o usuário ativamente abra o escopo correspondente.
*   **Trilha Única de CRDT (ADR-001)**: A sincronização e persistência de dados colaborativos seguem a arquitetura de trilha única do Automerge definida em [[adr/adr-001-automerge-unico]], abolindo por completo o Y.js.

---

## 4. Garbage Collection Híbrido (G4) e Quotas

O dispositivo monitora o armazenamento ocupado pelo OPFS. Ao atingir o limiar de **90% da quota** disponível ou o limite fixado pelo usuário:

1. **Notificação Proativa**: O sistema sugere a liberação de espaço de forma transparente.
2. **Execução do G4**: O Garbage Collector executa a compactação local:
   * **Poda do SQLite**: Converte registros do estado Integral para Podado (`retention_state = 'pruned'`), removendo fisicamente a coluna `payload` e `payload_iv` do SQLite. As assinaturas e arestas de relacionamento são mantidas intactas para auditoria.
   * **Compactação do CRDT (Automerge)**: O GC limpa os micro-updates históricos e Changes brutas da tabela local `pending_changes` e consolida o log do Automerge Repo correspondente aos blocos podados.
   * **Pins e Proteções**: O G4 **nunca** poda registros protegidos por nós de prioridade (`ASSET:PIN` do usuário) ou sob conformidade de retenção regulatória obrigatória (dados fiscais/financeiros).
   * **Restrição de Bateria (Tier-aware Pause)**: A execução do G4 e a poda de payloads são **pausadas automaticamente** se a degradação de tier por bateria baixa estiver ativa. Como o mobile em economia de energia limita conexões a no máximo 2 peers WebRTC, ele não consegue rodar o protocolo de gossip com quórum suficiente para garantir o Replication Factor ($N=3$) exigido antes de podar, evitando perda permanente de dados na rede.

---

## 5. `SwarmRegistry` — Heartbeat e Health Check

O `SwarmRegistry` mantém a vivacidade dos peers por um protocolo de dois níveis:

- **Heartbeat implícito:** Qualquer frame recebido no canal de dados (RBSR, Automerge ephemeral messages, WebTorrent) zera o timer de inatividade do peer remetente. Não há keep-alive enquanto o canal estiver ativo.
- **Heartbeat explícito (PING/PONG):** Canal ocioso por **15 s** → PING de 8 bytes. Peer responde com PONG de 8 bytes + timestamp local.
- **Evicção:** 3 falhas consecutivas (45 s sem resposta):
  - Removido da lista de candidatos do `SyncCoordinator`
  - Removido como relay elegível no `RelayTrustModel`
  - Cool-off de **5 min** para novas tentativas de conexão
  - Se era o líder eleito de sync, re-eleição imediata (§5.1)
- **Degradação em economia de energia:** Em mobile com bateria < 15%, o heartbeat explícito é desativado. O sistema confia exclusivamente nos timeouts do RBSR para limpeza de conexões fantasma.

### 5.1 Failover — Timeout e Re-eleição do Líder de Sync

Se o líder eleito falhar durante uma sessão RBSR ativa:

1. **Monitoramento:** Timer de inatividade de 5 s por sessão RBSR. Cada mensagem recebida zera o timer.
2. **Desconfiança:** Timer expirado → PING ao líder. Sem resposta em 2 s → líder declarado inativo e recebe shadowban temporário no `SwarmRegistry`.
3. **Rollback WAL:** O `ConcurrentReconciliationGuard` aborta imediatamente a transação `DEFERRED` aberta no SQLite e executa `PRAGMA wal_checkpoint(TRUNCATE)` para liberar o arquivo `-wal`, prevenindo crescimento infinito.
4. **Re-eleição:** A função determinística (menor `entity_id` ativo) é reaplicada excluindo o líder falho. O próximo da lista é eleito.
5. **Retomada:** Nova transação `DEFERRED` aberta; o RBSR retoma do último sub-range não resolvido (checkpoint salvo antes do timeout).

---

## 6. Gênese da Rede — First Peer Protocol

A inicialização e o cold start da topologia de rede local e global do dispositivo seguem o contrato especificado no [[first-peer-protocol]]. 

A lógica operacional e a máquina de estados (JOINING ➔ WAITING_FOR_SWARM ➔ CONNECTED / GENESIS / OFFLINE_RETRY) são orquestradas pelo [[sync-worker]] e mantidas no [[swarm-registry]]. Chaves criptográficas de fundação de rede e a criação do nó imutável [[specification-network-birth]] são coordenadas em cooperação com o [[crypto-worker]] para validação de privilégios.

---

## 7. Global Network Throttle — Alocação de Banda entre Swarms

Um mesmo peer pode pertencer a múltiplos swarms simultaneamente (workspaces abertos em abas diferentes). O `GlobalThrottle` governa a disputa por recursos:

### 7.1 Cotas por Visibilidade

| Prioridade | Estado da Aba/Swarm | Quota de Banda | Sockets |
| :--- | :--- | :--- | :--- |
| 1 | Aba ativa (foco do usuário) | 70% | Conexão direta (STUN/WebRTC) |
| 2 | Aba visível (não ativa) | 20% | Relay ancorado (Super Peer) |
| 3 | Abas em background | 10% (dividido) | Relay ancorado |

### 7.2 Topologia Dinâmica

Swarms movidos para background disparam o `ConnectionPromotionEngine` no modo **reverso**: fechamento voluntário de túneis P2P diretos (STUN) e migração para relays. Isso economiza sockets do SO (cada túnel WebRTC consome um socket; navegadores têm limite ~30 simultâneos).

### 7.3 Degradação em Mobile

- Bateria < 30% ou dados móveis (4G/5G): swarms em background pausados (0% de banda, fechamento de sockets).
- Apenas o swarm da aba ativa sincroniza.
- Reavaliado a cada ciclo de sync ou a cada 30 s.

**Implementação:** Token bucket por swarm, recarregado proporcionalmente à cota. Swarms com fingerprint já sincronizado consomem 0 tokens — banda só consumida durante RBSR ativo.

---

## 8. Transporte de BLOBs no Browser (Service Worker + MediaSource)

No Electron, BLOBs são servidos via `localhost/blobs/<hash>` diretamente para `<video>`/`<img>`. No browser sem localhost disponível, o fluxo é:

1. `<video src="/blobs/{infohash}">` emite uma requisição HTTP interceptada pelo **Service Worker** via evento `fetch`.
2. O SW abre um `MessageChannel` com o Sync Worker:
   `SW → Sync Worker: REQUEST_CHUNK(infohash, range)` → `Sync Worker → WebTorrent` (busca P2P) → `Sync Worker → Crypto Worker` (decifra AES-256-GCM com chave do nó `ASSET:FILE` sincronizado via RBSR).
3. **Transferable Objects (zero-copy):** O Crypto Worker devolve os bytes via `postMessage(buffer, [buffer])`, transferindo propriedade de memória sem cópia para evitar pausas do GC.
4. **Backpressure:** Buffer de leitura antecipada > 20 MB → SW envia `PAUSE_STREAM` ao Sync Worker; buffer < 5 MB → `RESUME_STREAM`.
5. Chunks entregues via `ReadableStream` e anexados ao `SourceBuffer` do MediaSource. Chunks fora de ordem (comum no WebTorrent) são bufferizados até o antecessor chegar.
6. **Segurança:** Chunks decifrados residem apenas no `ReadableStream`/`SourceBuffer` — nunca expostos ao JavaScript da página.

---

## 9. Private Swarm — Sincronização Cross-Device do Mesmo Usuário

Dados locais que precisam sobreviver à sessão e estar disponíveis em todos os dispositivos do mesmo dono (rascunhos, cache de prefetch, preferências de UI) trafegam por um canal separado e invisível: o **Private Swarm**.

### 9.1 Derivação Segura do RendezvousId

O `RendezvousId` do Private Swarm **não** é derivado via hash simples da Chave Mestra (evita análise de tráfego na DHT):

```
Device_Sync_Key = HKDF-Expand(master_key, "device-sync-v1", 32 bytes)
RendezvousId    = blake2s256(Device_Sync_Key)
```

Mesmo que o `RendezvousId` seja observado, a Chave Mestra não pode ser derivada.

### 9.2 Banco Sincronizado (`device_state.db`)

O Private Swarm sincroniza um banco SQLite secundário isolado (`device_state.db`), contendo exclusivamente dados da categoria "Local + Persistente (mesmo usuário)" (caderno-3/01 §4):

- Rascunhos não publicados
- Cache de prefetch (evita re-download do mesmo BLOB em cada dispositivo)
- Preferências de UI (tema, layout, idioma)
- Histórico de peers já sincronizados
- Tabela `blind_archives` (armazenamento local de [[custodia-cega-archive|Archive Cargos]], indexada por `archive_id` e contendo o payload cifrado)

### 9.3 Resolução de Conflitos

| Dado | Estratégia |
| :--- | :--- |
| Preferências de UI | Last-Write-Wins (LWW) baseado em HLC |
| Rascunhos de documentos | CRDT nativo do Automerge (merge sem perda) |
| Cache de prefetch | Union-based (lista de chunks unificada) |

### 9.4 Operação

- Usa o mesmo mecanismo de **Documento Casca** (caderno-2/04 §2) do Automerge Repo.
- Tráfego E2E com a `Device_Sync_Key` (não passa pelo RBSR do swarm principal).
- Prioridade: maior que swarms em background, menor que o swarm da aba ativa e replicação auditável.

### 9.5 Relação com as Modalidades

| Modalidade | Private Swarm opera? | Notas |
| :--- | :--- | :--- |
| P2P Puro | ✅ Sim | Relay ou direto, indistintamente |
| Corporativa | ✅ Sim | Isolado do grafo corporativo; empresa sem acesso |
| Pública | ✅ Sim | Chave Mestra é do usuário, não da plataforma |


