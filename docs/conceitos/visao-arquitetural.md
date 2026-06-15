# Visão Arquitetural
Este documento serve como fonte única de contexto arquitetural para o AI assistant, utilizando diagramas para representar as camadas, comunicação e ontologia de dados.

## 1. Topologia Macro

```mermaid
graph TD
    subgraph Browser ["Frontend React (PWA Local-First)"]
        UI["Componentes UI (React)"]
        TB["Estado Reativo (TinyBase)"]
        SDK["Client SDK [Phase 2 target]"]
        
        subgraph Workers ["Web Workers (Core Lógico)"]
            SW["Sync Worker (RBSR) & Zen Engine"]
            CW["Crypto Worker & Key Vault"]
            IW["Index Worker"]
        end
        
        SQLite_OPFS[("SQLite (wa-sqlite em OPFS)")]
        
        UI -->|Renderiza / Interage| TB
        TB -->|Query / Mutate| SDK
        SDK <--> Workers
        Workers <--> SQLite_OPFS
    end

    subgraph Transporte ["Camada de Rede (Network Adapters)"]
        WS["WebSocket"]
        WebRTC["WebRTC DataChannel (Handshake Noise_XX)"]
        AM["Automerge Repo (Rendezvous / Efêmero)"]
    end

    subgraph NodeBackend ["Backend Node.js (System Peer / Cloud)"]
        API["Conectores (SMTP / Admin API)"]
        MCP["MCP Server (nexus-backend)"]
        NodeCore["Core Isomórfico (protocol + core)"]
        Tracker["SwarmRegistry WSS & Signaling Hub"]
        SQLite_Node[("SQLite (better-sqlite3)")]
        
        API --> NodeCore
        MCP --> NodeCore
        NodeCore <--> SQLite_Node
        Tracker --> NodeCore
    end

    SDK --> WS
    SDK --> WebRTC
    SDK -.->|Micro-updates| AM
    
    WS <--> NodeCore
    WebRTC <-->|Direto p/ Outros Browsers| WebRTC
```

## 2. Entidades do Grafo

A plataforma baseia-se num modelo de grafo append-only replicado suportado por duas estruturas primitivas: `nodes` e `edges`.

```mermaid
erDiagram
    nodes {
        string id "ULID PRIMARY KEY (11º char='N')"
        string entity_id "ULID da linhagem NOT NULL"
        string type "TEXT NOT NULL (ex: PROFILE:USER)"
        blob pub_key "BLOB"
        blob payload "BLOB [IV 12B] + [AES-256-GCM]"
        int epoch "INTEGER NOT NULL"
        int created_at "INTEGER NOT NULL"
        int hlc "INTEGER NOT NULL"
        blob signature "BLOB Ed25519"
        int retention_state "INTEGER (0=integral,1=pruned,2=expunged,3=orphan)"
    }

    edges {
        string id "ULID PRIMARY KEY (11º char='E')"
        string entity_id "TEXT NOT NULL"
        string source_id "TEXT NOT NULL (sempre nó 'N')"
        string target_id "TEXT NOT NULL (polimórfico via VFK)"
        string type "TEXT NOT NULL (ex: MUTATES, SPENDS)"
        blob previous_hash "BLOB"
        blob payload "BLOB"
        int epoch "INTEGER NOT NULL"
        int active "INTEGER DEFAULT 1 (0=lápide)"
        int created_at "INTEGER NOT NULL"
        int hlc "INTEGER NOT NULL"
        blob signature "BLOB Ed25519"
        int retention_state "INTEGER"
    }

    nodes ||--o{ edges : "origem (source_id)"
    nodes ||--o{ edges : "destino (target_id)"
    edges ||--o{ edges : "destino (target_id polimórfico)"
```

### Subtipos de Nós (campo `type`)

| Categoria | Subtipos Canônicos |
| :--- | :--- |
| **PROFILE** | `AUTHENTICATION`, `PERSONA`, `ORGANIZATION`, `SYSTEM` |
| **CONTENT** | `DOCUMENT`, `MESSAGE`, `INTENT`, `THEME`, `TRANSLATION` |
| **ASSET** | `BALANCE_STATE`, `INVENTORY`, `PERMISSION`, `ROLE`, `CONSENT`, `LOCK`, `INVITE`, `PIN` |
| **SPECIFICATION** | `SCHEMA`, `WORKFLOW`, `NETWORK_GOVERNANCE` |

### Exemplos de Arestas (campo `type`)

- **`MUTATES`**: atualiza versão (liga nó anterior à nova versão)
- **`SPENDS`**: ancora débito (aponta para `nodes.id` específico do asset a ser gasto)
- **`CREDITS`**: ancora crédito (aponta para `entity_id` de destino)
- **`AUTHORED`**: estabelece autoria, fundamental pois toda entidade tem `AUTHORED`
- **`DELEGATED_TO`**: delegação de capability
- **`GOVERNED_BY`**: aplicação de `SPECIFICATION`
- **`PARTICIPATES_IN:*:*`**: pertencimento a grupos/projetos
- **`VOUCHES_FOR`**: delega confiança (fluxo de convite `ASSET:INVITE`)

## 3. Web Workers Communication Stack

```mermaid
graph LR
    subgraph MainThread ["Main Thread (React)"]
        UI["Componentes React"]
        TB["TinyBase (cache reativo)"]
    end
    subgraph SyncWorker ["Sync Worker (orquestrador)"]
        RBSR["RBSR Anti-Entropy"]
        ZE["Zen Engine (WASM)"]
        GC["GC & Poda"]
    end
    subgraph CryptoWorker ["Crypto Worker"]
        KV["Key Vault (4h TTL)"]
        ED["Ed25519 Sign/Verify"]
        AES["AES-256-GCM Encrypt/Decrypt"]
    end
    subgraph IndexWorker ["Index Worker"]
        FTS["FTS5 (busca textual)"]
        GEO["Geo Index"]
    end
    SQLite[("SQLite WASM (OPFS)")]

    UI <-->|"Comlink (postMessage)"| TB
    TB <-->|"Persister async"| SyncWorker
    SyncWorker <-->|"encrypt/sign/verify"| CryptoWorker
    SyncWorker <-->|"index writes"| IndexWorker
    SyncWorker <-->|"nodes/edges R/W"| SQLite
    CryptoWorker <-->|"key fetch"| SQLite
    IndexWorker <-->|"FTS5 R/W"| SQLite
```

## 4. Mapeamento de Restrições Arquiteturais

Para garantir que a base seja estruturada conforme estipulado nos cadernos e RFCs da Plataforma V0.41, existem restrições estritas durante a implementação que o Agente ou Desenvolvedor de Software deve obedecer.

> [!IMPORTANT]
> - **O Frontend nunca acessa o banco de dados diretamente:** Componentes React lêem e manipulam estado **exclusivamente através do TinyBase**. O TinyBase é alimentado pelos Workers que controlam a lógica da porta de Storage (`wa-sqlite`).
> - **Zero "Drift de Protocolo" entre Cliente e Servidor:** O Backend Node.js NÃO reimplementa a lógica de negócio em controladores soltos. Ele importa e executa estritamente `@plataforma/protocol` e `@plataforma/core`. 
> - **Imutabilidade Dupla e Causalidade Lógica:** Nunca faça `UPDATE` SQL sobrescrevendo registros da tabela persistente. Toda mudança gera um novo nó temporal assinado no Grafo, conectado ao hash anterior.

> [!WARNING]
> - **Limites do Automerge Repo:** O Automerge é usado *unicamente* como trilha de rede colaborativa para Rendezvous e micro-updates em RAM de edição conjunta ao vivo. Ele **nunca** deve persistir o grafo ou ser o núcleo central da aplicação.
> - **Controle Capability-Based (UCAN):** Tokens UCAN carregam permissões, não chaves criptográficas. As chaves AES são retidas em memória via **Key Vault** e distribuídas dinamicamente, expirando a cada 4 horas (TTL). 
> - **Prevenção de Duplo-Gasto (Atomicidade no P2P):** O "Backend" em Node.js não possui exclusividade na atomicidade das transações financeiras. A não-violação do sistema baseia-se na `Invariante T1` e **Zen Engine** embarcado, validados antes do commit via consistência de regras `SPECIFICATION` e resolução estrutural de conflitos por linhagem determinística, provados pela assinatura de um Quórum (Agente do Sistema em caso de modelo corporativo).
