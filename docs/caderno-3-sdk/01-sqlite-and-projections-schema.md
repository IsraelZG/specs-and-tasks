# 01-sqlite-and-projections-schema.md — SQLite & Projections Schema

Este documento descreve o schema físico do banco de dados local da Plataforma Projeto SuperApp V0.41 (SQLite WASM / Better-SQLite3) e as tabelas auxiliares não-replicadas mantidas por triggers de banco de dados.

---

## 1. Schema das Tabelas Replicáveis (`nodes` e `edges`)

As tabelas centrais do grafo armazenam todos os nós (substantivos) e arestas (verbos). O banco é append-only: atualizações geram novas linhas conectadas por arestas `MUTATES`.

```sql
-- =========================
--  v4: nodes  (otimizado)
-- =========================
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,            -- ULID; 11º char = 'N'. MANTIDO TEXT (VFK + ordenação + depuração)
  entity_id TEXT NOT NULL,        -- ULID da linhagem; MANTIDO TEXT
  type TEXT NOT NULL,             -- MANTIDO TEXT (dicionarização exigiria registro canônico global; ver Apêndice)
  pub_key BLOB,                   -- v4: TEXT → BLOB (32 bytes crus vs ~44-64 em texto). Verificação O(1), MANTIDA.
  payload BLOB,                   -- v4: [IV 12 bytes] + [Ciphertext AES-256-GCM]  (payload_iv fundido)
  -- payload_iv REMOVIDO (fundido no payload)
  epoch INTEGER NOT NULL,
  created_at INTEGER NOT NULL,    -- MANTIDO (exibição/janela temporal; não extrair de hlc>>16)
  hlc INTEGER NOT NULL,           -- (pt << 16) | c
  signature BLOB,
  retention_state INTEGER NOT NULL DEFAULT 0  -- v4: TEXT → INTEGER (0=integral,1=pruned,2=expunged,3=orphan/quarentena)
);

-- =========================
--  v4: edges  (otimizado)
-- =========================
CREATE TABLE edges (
  id TEXT PRIMARY KEY,            -- ULID; 11º char = 'E'. MANTIDO TEXT
  entity_id TEXT NOT NULL,        -- MANTIDO TEXT
  source_id TEXT NOT NULL,        -- sempre nó (11º char 'N')
  target_id TEXT NOT NULL,        -- polimórfico via VFK (nó ou aresta)
  type TEXT NOT NULL,             -- inclui SPENDS, CREDITS, CONSUMES, CONTRIBUTES, BLOCKS (v4)
  previous_hash BLOB,             -- v4: TEXT → BLOB (hash de 32 bytes vs 64 em hex)
  payload BLOB,                   -- v4: [IV 12 bytes] + [Ciphertext]  (payload_iv fundido)
  -- payload_iv REMOVIDO (fundido no payload)
  epoch INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,    -- MANTIDO
  hlc INTEGER NOT NULL,
  signature BLOB,
  retention_state INTEGER NOT NULL DEFAULT 0  -- v4: TEXT → INTEGER (0=integral,1=pruned,2=expunged,3=orphan/quarentena)
);

-- Índices: idx_nodes_pub_key e idx_edges_previous_hash continuam válidos sobre BLOB.
-- idx_edges_target (target_id, type) já cobre a detecção de conflito (intents com SPENDS → mesmo head).
-- Demais índices da Projeto SuperApp V0.41 inalterados.
```

---

## 2. Decisões de Design do Schema

### 2.1 Virtual Foreign Keys (VFK) por Bitmasking de Caractere
O SQLite não oferece suporte a chaves estrangeiras polimórficas que possam apontar para tabelas distintas. No entanto, o campo `target_id` da tabela `edges` pode apontar para um nó (`nodes(id)`) ou para outra aresta (`edges(id)` - ex: aresta `WITNESSED_BY` apontando para aresta de transação).
* **Solução**: Remoção de FK física no campo `target_id` e aplicação de **[[vfk|Virtual Foreign Keys]]** pela camada do Sync Worker e TinyBase.
* **Mecanismo**: Inspeção em $O(1)$ do **11º caractere** do ULID (posição `index 10`, logo após o timestamp de 48 bits):
  * Letra **`N`**: Indica tabela `nodes`. Ex: `01J2X3Y4Z5N6Y7Z8A9BC...`
  * Letra **`E`**: Indica tabela `edges`. Ex: `01J2X3Y4Z5E6Y7Z8A9BC...`

### 2.2 Estado de Vitalidade (`active`), Lápides e Ciclo de Poda

O campo `active` (anteriormente chamado de `weight`) assume uma semântica puramente de controle de estado e vitalidade de arestas.

A plataforma **não realiza o somatório de pesos de arestas (`SUM(weight)`)** para calcular saldos ou inventários locais. Como o saldo é representado por um nó físico (`ASSET:BALANCE_STATE`), o saldo vigente é obtido diretamente a partir do payload descriptografado da versão mais recente desse nó (o `head` da linhagem). As arestas de movimentação (como `TRANSFERRED_TO`) registram apenas a causalidade e a autoria das transações. Seus volumes financeiros ficam criptografados dentro de seus payloads individuais, eliminando qualquer vazamento de privacidade na camada de banco de dados plano.

**Lápides (Tombstones):** No modelo append-only, deleção **nunca** remove registros fisicamente. O protocolo é:

1. A deleção marca a aresta como inativa (`active = 0`), criando uma lápide.
2. Um trigger local remove a relação da projeção `active_edges`, tornando-a invisível para consultas da aplicação.
3. O registro original e a lápide permanecem no grafo para auditoria.
4. O GC (§4 do caderno 3/02) pode podar lápides expiradas após **N ciclos de auditoria**, respeitando os requisitos de retenção legal de cada modalidade (financeiro: 5 anos; conteúdo comum: configurável pela `SPECIFICATION`). Registros marcados como `retention_state = 2 (expunged)` não preservam nem payload nem assinatura; apenas o `id` permanece como âncora de auditoria.

### 2.3 Ausência de `updated_at`
Como a plataforma é estritamente append-only, modificações nunca disparam comandos `UPDATE` nas linhas replicáveis. Alterações geram novas linhas com novos `id`s vinculados por arestas `MUTATES` compartilhando o mesmo `entity_id`.
O `hlc` é atribuído no momento da criação da linha, é imutável e coberto pela assinatura. Ele — e não o `created_at` — é a chave canônica de ordenação causal entre versões e entre linhagens. O `created_at` permanece apenas para exibição e consultas por janela temporal (ex.: Onda 1, "últimos 30 dias").

---

## 3. Projeções Estruturais Locais (Não-Replicadas)

Para garantir reatividade em $O(1)$ da interface de usuário, triggers locais interceptam inserções nas tabelas físicas e populam tabelas auxiliares que **nunca são sincronizadas via P2P/WebRTC**.

### 3.1 Tabela `entity_heads`
Aponta para o nó-versão vigente (`head_id`) de cada linhagem de entidade (`entity_id`). Elimina a necessidade de varredura recursiva de Linhagem de Versões em tempo de renderização.

```sql
CREATE TABLE entity_heads (
  entity_id TEXT PRIMARY KEY,
  head_id TEXT NOT NULL,
  type TEXT NOT NULL,
  head_hlc INTEGER NOT NULL,   -- HLC do head vigente (ordena a linhagem topologicamente)
  FOREIGN KEY (head_id) REFERENCES nodes(id)
);
```

#### Trigger do SQLite para Atualização:
```sql
-- Head = nó-versão de MAIOR HLC da linhagem.
-- Correto porque a invariante de monotonicidade de pai (caderno-2/02 §3.5) garante
-- HLC(filho) > HLC(pai). Logo o maior HLC é sempre a ponta (tip) da linhagem; em fork,
-- é o desempate determinístico até o nó de merge chegar (merge tem HLC > ambos os ramos
-- e assume a cabeça naturalmente). Como ON CONFLICT mantém o máximo, o resultado independe
-- da ordem de chegada dos nós no sync P2P.
CREATE TRIGGER trg_nodes_insert_entity_head
AFTER INSERT ON nodes
BEGIN
  INSERT INTO entity_heads (entity_id, head_id, type, head_hlc)
  VALUES (NEW.entity_id, NEW.id, NEW.type, NEW.hlc)
  ON CONFLICT(entity_id) DO UPDATE SET
    head_id  = CASE WHEN NEW.hlc > excluded.head_hlc THEN NEW.id  ELSE head_id  END,
    head_hlc = CASE WHEN NEW.hlc > excluded.head_hlc THEN NEW.hlc ELSE head_hlc END;
END;
```

### 3.2 Tabela `active_edges`
Contém os relacionamentos vigentes do grafo. Arestas revogadas (recebimento de aresta lápide com `active = 0`) são limpas da tabela pelo trigger, fornecendo um read model limpo do grafo social.

```sql
CREATE TABLE active_edges (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  type TEXT NOT NULL,
  active INTEGER,
  created_at INTEGER NOT NULL
);
```

### 3.3 Tabela `asset_balances`
Tabela reativa que armazena os saldos consolidados de ativos. Ela é populada e atualizada reativamente na Thread de UI ou pelo Sync Worker sempre que o nó `ASSET:BALANCE_STATE` da linhagem correspondente é descriptografado e atualizado (através de triggers de aplicação sobre a tabela `entity_heads`), eliminando a necessidade de triggers de agregação física baseados em somatórios de arestas.

> **Nota v4.** Quando a linhagem de um `ASSET:BALANCE_STATE` bifurca por créditos concorrentes, o head vigente é o **nó de merge aditivo** (caderno-2/04 §4.2); `asset_balances` lê esse head normalmente.

> **Nota (multidomínio):** `ASSET:LOCK` (reserva temporária com TTL) é um participante das sagas transdomínio (rfc-transacoes-multidominio.md §2, §5). Locks registram seu TTL no payload e expiram via lápide/GC (§2.2 desta seção). Saldos sob reserva permanecem bloqueados no head enquanto lock está ativo; consumir o lock (operação de confirmação) materializa o efeito final.

### 3.4 Tabela `local_permissions`
Materializa as permissões atualmente delegadas e válidas para o usuário do dispositivo local, calculadas a partir das arestas de delegação/composição e resoluções de pré-requisitos (`ASSET:PERMISSION` $\rightarrow$ `ASSET:PERMISSION`).

```sql
CREATE TABLE local_permissions (
  permission_id TEXT PRIMARY KEY,   -- ID da permissão atômica (ASSET:PERMISSION)
  entity_id TEXT NOT NULL,          -- entity_id estável do recurso associado
  persona_id TEXT NOT NULL,         -- PROFILE:PERSONA portadora do direito
  root_node_id TEXT,                -- Raiz autorizada da traversal query
  depth INTEGER DEFAULT 6,          -- Profundidade máxima de traversal (limite 6)
  direction TEXT,                   -- 'outbound' | 'inbound' | 'bidirectional'
  prerequisite_satisfied BOOLEAN NOT NULL DEFAULT 1, -- 0 se houver aresta REQUIRES não atendida
  expires_at INTEGER                -- Expirabilidade da permissão/role associada
);
```

#### Mecânica de Gatilho e Prerequisitos:
Ao inserir arestas `REQUIRES` (`ASSET:PERMISSION` $\rightarrow$ `ASSET:PERMISSION`), triggers locais recalculam se as permissões dependentes possuem a totalidade de seus requisitos satisfeitos:
1. Se uma permissão $A$ requer $B$ (`A REQUIRES B`), e $B$ não está presente no dispositivo local em `local_permissions`, a permissão $A$ é registrada com `prerequisite_satisfied = 0`.
2. Assim que a permissão $B$ é inserida, um trigger propaga a atualização definindo `prerequisite_satisfied = 1` para a permissão $A$.
3. Chamadas de sistema impedem a execução de mutações ou queries recursivas cuja permissão correspondente tenha `prerequisite_satisfied = 0`.

### 3.5 Tabela `validator_serialization_log` (local, não-replicada — v4)

Memória de compromisso do agente validador, que sustenta a recusa de aprovações conflitantes. Sem ela, a garantia de não-conflito (caderno-4/03 §3.5) cai. Nunca sincronizada.

```sql
CREATE TABLE validator_serialization_log (
  consumed_head_id TEXT PRIMARY KEY,  -- head (nodes.id) que uma intent aprovada por este agente consome
  intent_id TEXT NOT NULL,            -- CONTENT:INTENT aprovado
  hlc INTEGER NOT NULL
);
-- Regra: o agente recusa APPROVED_BY de qualquer intent cujo SPENDS aponte a um consumed_head_id já presente.
```

### 3.6 Tabela `peer_reputation` (local, não-replicada — v4)

Reputação de primeira mão, não-transitiva (estilo `RelayTrustModel`). Scores **não** vão ao grafo; apenas **fatos negativos verificáveis** (caderno-4/03 §3.6) são persistidos como `CONTENT`. Nunca sincronizada.

```sql
CREATE TABLE peer_reputation (
  peer_id TEXT PRIMARY KEY,
  first_hand_score REAL NOT NULL DEFAULT 0,
  observed_consistent INTEGER NOT NULL DEFAULT 0,
  observed_inconsistent INTEGER NOT NULL DEFAULT 0,
  last_hlc INTEGER
);
```

## 4. Matriz de Classificação de Transporte (As 3 Perguntas)

O destino físico, o protocolo de rede e a criptografia de um dado não são escolhas arbitrárias — são determinados pelas respostas a três perguntas fundamentais declaradas na `SPECIFICATION` do nó:

1. **Outro peer precisa observar este estado?**
2. **A integridade histórica precisa ser auditada?**
3. **O estado precisa sobreviver ao encerramento da sessão?**

### 4.1 Tabela de Destino

| Q1 (Observável) | Q2/Q3 | Categoria | Destino Físico | Protocolo | Cifra |
| :--- | :--- | :--- | :--- | :--- | :--- |
| SIM | (Q2) SIM | Replicável + Auditável | `nodes`/`edges` | RBSR (Onda 1/2) | Chave de Época |
| SIM | (Q2) NÃO | Replicável + Não-Auditável | `pending_changes` (RAM→RAM) | Ephemeral Msg (WebRTC) | Chave de Época |
| NÃO | (Q3) SIM | Local + Persistente (mesmo usuário) | `device_state.db` (OPFS isolado) | Private Swarm | Chave do Dispositivo (HKDF) |
| NÃO | (Q3) NÃO | Local + Transiente / Efêmero | TinyBase / RAM | Nenhum | N/A |

**Exemplos:**

| Categoria | Exemplo |
| :--- | :--- |
| Replicável + Auditável | `ASSET:BALANCE_STATE`, documento pós-commit |
| Replicável + Não-Auditável | Digitação em tempo real (Changes), posições de cursor |
| Local + Persistente (mesmo usuário) | Rascunhos não publicados, cache de prefetch, preferências de UI |
| Local + Transiente | Estado de rolagem, abas abertas, indicador "digitando" |

### 4.2 Inversão de Controle — `transport_hints`

A classificação é declarada pelo criador do módulo na `SPECIFICATION`, não pelo desenvolvedor de UI durante a submissão:

```yaml
specification:
  type: "SPECIFICATION:DOCUMENT_DRAFT"
  transport_hints:
    observable_by_peers: false
    is_auditable: false
    survives_disconnection: true
```

O Sync Worker lê os `transport_hints`, aplica a tabela acima e despacha os bytes para a fila correta de forma transparente. A UI nunca sabe sobre transporte.

### 4.3 Contrato de Tipos (TypeScript)

```typescript
type TransportBehavior =
  | { category: 'REPLICABLE_AUDITABLE';  destination: 'sqlite_nodes_edges';   protocol: 'RBSR';             requiresLineage: true  }
  | { category: 'REPLICABLE_VOLATILE';   destination: 'sqlite_pending_changes'; protocol: 'EPHEMERAL_WEBRTC'; requiresLineage: false }
  | { category: 'LOCAL_PERSISTENT';      destination: 'sqlite_user_local';     protocol: 'PRIVATE_SWARM';    requiresLineage: false }
  | { category: 'LOCAL_TRANSIENT';       destination: 'ram_tinybase';          protocol: 'NONE';             requiresLineage: false };

function evaluateTransportHints(
  isObservableByOtherPeers: boolean,
  isAuditable: boolean,
  mustSurviveDisconnection: boolean
): TransportBehavior {
  if (isObservableByOtherPeers) {
    return isAuditable
      ? { category: 'REPLICABLE_AUDITABLE',  destination: 'sqlite_nodes_edges',    protocol: 'RBSR',             requiresLineage: true  }
      : { category: 'REPLICABLE_VOLATILE',   destination: 'sqlite_pending_changes', protocol: 'EPHEMERAL_WEBRTC', requiresLineage: false };
  } else {
    return mustSurviveDisconnection
      ? { category: 'LOCAL_PERSISTENT', destination: 'sqlite_user_local', protocol: 'PRIVATE_SWARM', requiresLineage: false }
      : { category: 'LOCAL_TRANSIENT',  destination: 'ram_tinybase',      protocol: 'NONE',          requiresLineage: false };
  }
}
```

### 4.4 Transições de Estado

Dados podem ser promovidos entre categorias. Uma edição começa como "Local + Persistente" (rascunho) ou "Replicável + Não-Auditável" (digitação ao vivo); quando o gatilho de consolidação dispara, o dado é promovido a "Replicável + Auditável" — inserido no grafo e adicionado à B-Tree do RBSR.

```
┌──────────────────┐       ┌──────────────────────┐       ┌─────────────────────┐
│ Local +          │  ──►  │ Replicável +          │  ──►  │ Replicável +        │
│ Persistente      │       │ Não-Auditável         │       │ Auditável           │
│ (Rascunho)       │       │ (digitação ao vivo)   │       │ (documento salvo)   │
│ Private Swarm    │       │ Ephemeral WebRTC       │       │ RBSR Onda 1/2       │
└──────────────────┘       └──────────────────────┘       └─────────────────────┘
```

---

## 5. Índices de Texto (FTS5), Busca Espacial (R*Tree) e Vetores (sqlite-vec)

Para viabilizar pesquisas por autocomplete, raio espacial e similaridade sem vazar payloads descriptografados em arquivos desprotegidos:

* **Índice FTS5 local (`search_index_fts`)**: Preenchido apenas para campos marcados como `searchable: true` pela `SPECIFICATION` do nó no momento em que o payload é descriptografado pelo Crypto Worker.
* **Índice R*Tree local (`geo_index`)**: Permite buscas espaciais baseadas em coordenadas geográficas de texto plano para módulos com suporte geolocalizado.
* **Índice Vetorial local (`vector_index`)**: A 7ª projeção, mantida pelo mesmo regime das demais (derivada, reconstruível, local) via sqlite-vec (WASM/nativo). Preenchido para campos `embeddable: true` definidos na `SPECIFICATION` do nó no momento em que o payload é decifrado (Crypto Worker), chamando a capacidade `compute` de embedding correspondente (RFC-011 §2).
* **Segurança do Índice**: Os arquivos dessas tabelas auxiliares são criptografados localmente no dispositivo via **Chave do Dispositivo**, sendo descriptografados na RAM durante a sessão ativa.

> **Nota (ranking e feed):** O resultado de feed, busca e ranking **não é hardcoded no cliente**. É executado como um **procedimento de `SPECIFICATION` (Zen Engine)**. Feed consome campos `searchable: true` projetados + arestas `INTERACTS` (likes, comments, shares) e roda a lógica de ranking/filtro declarada na SPEC. Resultado é efêmero/local, não replicado. Suporta A/B testing de ranking sem quebrar o protocolo P2P — ranking é policy da SPEC, não primitiva de core.


