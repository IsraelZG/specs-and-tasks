# Inventário de Conceitos — Plataforma V3.1

Atualizado em: 2026-06-03. Cobre todos os cadernos (1–4), glossary.md, rfc-transporte-p2p-v3.1.md, rfc-v4.md, rfc-transacoes-multidominio.md e backlog-geral.md. Finalidade: mapear onde cada conceito está definido canonicamente e onde está sendo **redefinido**, sinalizando alvos de consolidação para a Fase 2 (criação de verbetes em `docs/conceitos/<slug>.md`).

**Legenda**:
- Coluna "definição canônica atual": arquivo e seção com a definição mais completa e autoritativa hoje.
- Coluna "outras aparições": entradas que **redefinem** o conceito (descrevem o que é, não apenas o usam). Aparições que só citam foram omitidas.
- ★ = alvo prioritário de consolidação (redefinição substancial em mais de um lugar).

---

## 1. Ontologia do Grafo

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `no` | `caderno-2-protocol/01-graph-ontology.md §3` | `glossary.md §Nó` | protocol |
| `aresta` | `caderno-2-protocol/01-graph-ontology.md §2` | `glossary.md §Aresta` | protocol |
| `substantivo-verbo-principio` | `caderno-2-protocol/01-graph-ontology.md §1` | `glossary.md §Substantivo/Verbo` ★ | protocol |
| `ulid` | `glossary.md §ULID` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §1` (schema) | protocol |
| `id` | `glossary.md §id` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §1` (schema) | protocol |
| `entity-id` | `glossary.md §entity_id` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §1` (schema) | protocol |
| `profile` | `caderno-2-protocol/01-graph-ontology.md §3.1` | `glossary.md §PROFILE` | protocol |
| `profile-authentication` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.1` | `glossary.md §AUTHENTICATION`; `caderno-2-protocol/01-graph-ontology.md §3.1` ★ | protocol |
| `profile-persona` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.3` | `glossary.md §PERSONA`; `caderno-2-protocol/01-graph-ontology.md §3.1` ★ | protocol |
| `profile-organization` | `caderno-2-protocol/01-graph-ontology.md §3.1, §3.5` | — | protocol |
| `profile-system` | `caderno-2-protocol/01-graph-ontology.md §3.1` | `glossary.md §PROFILE:SYSTEM` ★ | protocol |
| `content` | `caderno-2-protocol/01-graph-ontology.md §3.2` | `glossary.md §CONTENT` | protocol |
| `content-document` | `caderno-2-protocol/01-graph-ontology.md §3.2` | `caderno-2-protocol/04-automerge-integration-spec.md §1` (define snapshot) | protocol |
| `content-message` | `caderno-2-protocol/01-graph-ontology.md §3.2` | `glossary.md §CONTENT:MESSAGE` ★ | protocol |
| `content-intent` | `caderno-2-protocol/01-graph-ontology.md §3.2` | `glossary.md §CONTENT:INTENT` (**definido duas vezes** nas linhas 41 e 125); `caderno-1-vision/03-legal-and-compliance-framework.md §2.2, §2.3`; `rfc-v4.md §2.4` (hub model) ★★ | protocol |
| `content-personal-data` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.2` | — | protocol |
| `content-theme` | `caderno-2-protocol/01-graph-ontology.md §3.2` | `caderno-3-sdk/04-theme-and-i18n-data-structures.md §1` (define estrutura completa) ★ | sdk |
| `content-translation` | `caderno-2-protocol/01-graph-ontology.md §3.2` | `caderno-3-sdk/04-theme-and-i18n-data-structures.md §2` (define estrutura completa) ★ | sdk |
| `content-file` | `caderno-3-sdk/05-media-transport-plane.md §8.2` | `backlog-geral.md §6.2` | protocol |
| `asset` | `caderno-2-protocol/01-graph-ontology.md §3.3` | `glossary.md §ASSET` | protocol |
| `asset-permission` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.1` | `glossary.md §ASSET:PERMISSION`; `caderno-2-protocol/01-graph-ontology.md §3.3` ★★ | protocol |
| `asset-role` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.1` | `glossary.md §ASSET:ROLE`; `caderno-2-protocol/01-graph-ontology.md §3.3` ★★ | protocol |
| `asset-consent` | `caderno-2-protocol/01-graph-ontology.md §3.3` | `caderno-1-vision/03-legal-and-compliance-framework.md §2.1` (redefine como primitiva LGPD) ★ | protocol |
| `asset-balance-state` | `caderno-2-protocol/01-graph-ontology.md §3.3` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §2.2` (define mecânica sem somatório) | protocol |
| `asset-lock` | `caderno-2-protocol/01-graph-ontology.md §3.3` | `glossary.md §ASSET:LOCK como Reserva`; `rfc-transacoes-multidominio.md §2` (saga TTL); `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.3` (nota v4) ★★ | protocol |
| `asset-inventory` | `caderno-2-protocol/01-graph-ontology.md §3.3` | — | protocol |
| `asset-invite` | `glossary.md §ASSET:INVITE` | `rfc-transporte-p2p-v3.1.md §2.4.4`; `rfc-v4.md §4.2` ★★ | protocol |
| `asset-reputation` | `caderno-1-vision/01-vision-and-positioning.md §4.1` | — | vision |
| `specification` | `caderno-2-protocol/01-graph-ontology.md §3.4` | `glossary.md §SPECIFICATION`; `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §1` (redefine natureza dual) ★★ | protocol |
| `specification-schema` | `caderno-2-protocol/01-graph-ontology.md §3.4` | — | protocol |
| `specification-workflow` | `caderno-2-protocol/01-graph-ontology.md §3.4` | — | protocol |
| `specification-network-governance` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3` | `caderno-2-protocol/01-graph-ontology.md §3.4`; `caderno-1-vision/01-vision-and-positioning.md §5` ★ | governance |
| `specification-network-birth` | `rfc-transporte-p2p-v3.1.md §3.2.4` | `glossary.md §NETWORK_BIRTH`; `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §6` ★ | protocol |
| `minimalismo-ontologico` | `caderno-2-protocol/01-graph-ontology.md §4` | — | protocol |
| `discovery-by-graph` | `caderno-2-protocol/01-graph-ontology.md §4.1` | — | protocol |

---

## 2. Arestas Estruturais e Verbos

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `verbos-raiz-canonicos` | `caderno-2-protocol/01-graph-ontology.md §2.1` | `glossary.md §Verbos Raiz Canônicos` ★ | protocol |
| `aggregates` | `caderno-2-protocol/01-graph-ontology.md §2.1` | `glossary.md §AGGREGATES` ★ | protocol |
| `requires` | `caderno-2-protocol/01-graph-ontology.md §2.1` | `glossary.md §REQUIRES` ★ | protocol |
| `participates-in` | `caderno-2-protocol/01-graph-ontology.md §2` | `glossary.md §PARTICIPATES_IN` ★ | protocol |
| `resulted-from` | `glossary.md §RESULTED_FROM` | — | protocol |
| `resolves` | `glossary.md §RESOLVES` | — | protocol |
| `mutates` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.2` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §1` (schema); `rfc-transporte-p2p-v3.1.md §2.10.1` | protocol |
| `spends` | `caderno-2-protocol/01-graph-ontology.md §2.2` | `glossary.md §SPENDS`; `rfc-v4.md §3.2` ★ | protocol |
| `credits` | `caderno-2-protocol/01-graph-ontology.md §2.2` | `glossary.md §CREDITS`; `rfc-v4.md §3.2` ★ | protocol |
| `transfers-aresta` | `rfc-v4.md §3.2` | `caderno-2-protocol/01-graph-ontology.md §2.2` (mencionado) | protocol |
| `approves` | `rfc-v4.md §3.2` | `caderno-2-protocol/01-graph-ontology.md §1` (implícito via APPROVED_BY) | protocol |
| `consumes-aresta` | `caderno-2-protocol/01-graph-ontology.md §2.3` | `glossary.md §CONSUMES`; `rfc-v4.md §3.2` ★ | protocol |
| `contributes-aresta` | `caderno-2-protocol/01-graph-ontology.md §2.3` | `glossary.md §CONTRIBUTES`; `rfc-v4.md §3.2` ★ | protocol |
| `blocks-aresta` | `caderno-2-protocol/01-graph-ontology.md §2.3` | `glossary.md §BLOCKS`; `rfc-v4.md §3.2` ★ | protocol |
| `serves-aresta` | `caderno-3-sdk/05-media-transport-plane.md §4.2` | `glossary.md §SERVES` ★ | protocol |

---

## 3. Identidade, Criptografia e Controle de Acesso

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `peer-id` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.4` | `glossary.md §PeerId`; `rfc-transporte-p2p-v3.1.md §2.2` (repete fórmula e contexto) ★★ | protocol |
| `ucan` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2` | `glossary.md §UCAN`; `rfc-transporte-p2p-v3.1.md §2.7` (redefine no contexto de sync) ★★ | protocol |
| `key-vault` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.2`; `rfc-transporte-p2p-v3.1.md §3.1` ★★ | protocol |
| `predicado-de-bloqueio` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2.1` | `rfc-v4.md §2.8` ★ | protocol |
| `linhagem-de-versoes` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.2` | `glossary.md §Linhagem de Versões`; `caderno-2-protocol/04-automerge-integration-spec.md §1`; `rfc-transporte-p2p-v3.1.md §2.10.1` ★★ | protocol |
| `hlc` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.5` | `glossary.md §HLC`; `rfc-transporte-p2p-v3.1.md §2.9` (repete algoritmo completo) ★★ | protocol |
| `head` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.5.1` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.1` (trigger entity_heads) | protocol |
| `imutabilidade-dupla` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.2` | — | protocol |
| `chave-mestra-ed25519` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.1` | — | protocol |
| `chave-de-epoca` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.1, §3.3` | — | protocol |
| `rotacao-de-epocas` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.3` | `caderno-1-vision/03-legal-and-compliance-framework.md §3.1` (aplica no expurgo) | protocol |
| `forward-secrecy` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §3.3` | `caderno-1-vision/03-legal-and-compliance-framework.md §3.1` | protocol |
| `bip39` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §4.3` | `backlog-geral.md §Fase 1` | protocol |
| `modelo-recuperacao-central` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §4.1` | — | governance |
| `shamir-sss` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §4.2` | `backlog-geral.md §Fase 1` | protocol |
| `modelo-soberano-bip39` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §4.3` | — | governance |
| `delegacao-persona-corporativa` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.5` | — | protocol |
| `stale-epoch` | `rfc-transporte-p2p-v3.1.md §2.9` | `glossary.md §STALE_EPOCH` ★ | protocol |
| `noise-xx` | `rfc-transporte-p2p-v3.1.md §2.2.1` | `glossary.md §Noise Protocol Framework / Noise_XX`; `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.4.1` ★ | protocol |
| `bloqueio-social` | `rfc-v4.md §2.8` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2.2.1`; `glossary.md §Bloqueio Social` ★ | protocol |

---

## 4. Sincronização e Transporte

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `rbsr` | `caderno-2-protocol/03-set-reconciliation-protocol.md §1` | `glossary.md §RBSR`; `rfc-transporte-p2p-v3.1.md §2.6` (redefine protocolo completo) ★★ | protocol |
| `fingerprint` | `caderno-2-protocol/03-set-reconciliation-protocol.md §1.1` | `rfc-transporte-p2p-v3.1.md §2.6.1` (repete fórmulas e justificativa 256 bits) ★ | protocol |
| `range-footer` | `caderno-2-protocol/03-set-reconciliation-protocol.md §1.2` | `glossary.md §RangeFooter`; `rfc-transporte-p2p-v3.1.md §2.6.3` (repete struct e semântica) ★★ | protocol |
| `nonce-challenge` | `caderno-2-protocol/03-set-reconciliation-protocol.md §1.3` | `rfc-transporte-p2p-v3.1.md §2.6.4` ★ | protocol |
| `onda` | `caderno-2-protocol/03-set-reconciliation-protocol.md §4` | `glossary.md §Onda`; `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §3`; `rfc-transporte-p2p-v3.1.md §2.8` ★★★ | protocol |
| `anti-entropy` | `caderno-2-protocol/03-set-reconciliation-protocol.md §1.2, §4` | `glossary.md §Anti-Entropy O(1)`; `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §3.1`; `rfc-transporte-p2p-v3.1.md §2.8` ★★ | protocol |
| `replication-factor` | `caderno-2-protocol/03-set-reconciliation-protocol.md §3.1` | `rfc-transporte-p2p-v3.1.md §4.2.1` ★ | protocol |
| `consistent-hashing` | `caderno-2-protocol/03-set-reconciliation-protocol.md §3.3` | `glossary.md §Consistent Hashing`; `rfc-transporte-p2p-v3.1.md §4.2.1` ★ | protocol |
| `snapshot-de-bootstrap` | `caderno-2-protocol/03-set-reconciliation-protocol.md §5` | `rfc-transporte-p2p-v3.1.md §4.2.3` (menciona) | protocol |
| `poda-segura` | `rfc-transporte-p2p-v3.1.md §4.3` | `glossary.md §Poda Segura` ★ | protocol |
| `sync-dirigido-por-ucan` | `caderno-2-protocol/03-set-reconciliation-protocol.md §2` | `rfc-transporte-p2p-v3.1.md §2.7` ★ | protocol |
| `graph-based-routing` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §3 Onda 3` | `glossary.md §Graph-Based Routing`; `rfc-transporte-p2p-v3.1.md §3.4` (indiretamente via WebTorrent) ★ | sdk |
| `connection-promotion-engine` | `rfc-transporte-p2p-v3.1.md §2.5.1` | `glossary.md §ConnectionPromotionEngine` ★ | protocol |
| `relay-trust-model` | `rfc-transporte-p2p-v3.1.md §2.5.2` | `glossary.md §RelayTrustModel` ★ | sdk |
| `swarm-registry` | `rfc-transporte-p2p-v3.1.md §3.2.2` | `glossary.md §SwarmRegistry` ★ | sdk |
| `bootstrap-hibrido` | `rfc-transporte-p2p-v3.1.md §2.4` | — | protocol |
| `bootstrap-frio-absoluto` | `glossary.md §Bootstrap Frio Absoluto` | `rfc-transporte-p2p-v3.1.md §2.4.1` | protocol |
| `bootstrap-morno` | `glossary.md §Bootstrap Morno` | `rfc-transporte-p2p-v3.1.md §2.4.1` | protocol |
| `dht-descartada` | `glossary.md §DHT` | `rfc-transporte-p2p-v3.1.md §2.4` (motivação explícita) | protocol |
| `link-multiaddr` | `glossary.md §Link Multiaddr` | `rfc-transporte-p2p-v3.1.md §2.4.4` | protocol |
| `global-network-throttle` | `rfc-transporte-p2p-v3.1.md §3.2.5` | `glossary.md §GlobalThrottle`; `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §7` ★ | sdk |
| `concurrent-reconciliation-guard` | `rfc-transporte-p2p-v3.1.md §3.3` | — | sdk |
| `private-swarm` | `rfc-transporte-p2p-v3.1.md §4.7` | `glossary.md §Private Swarm` ★ | sdk |
| `webtorrent-blobs` | `rfc-transporte-p2p-v3.1.md §3.4` | — | sdk |
| `genesis-da-rede` | `rfc-transporte-p2p-v3.1.md §3.2.4` | — | governance |
| `matriz-de-classificacao-transporte` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §4` | `rfc-transporte-p2p-v3.1.md §2.11` ★ | protocol |

---

## 5. Automerge e Edição Colaborativa

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `crdt` | `glossary.md §CRDT` | — | protocol |
| `automerge` | `caderno-2-protocol/04-automerge-integration-spec.md` (todo caderno) | `glossary.md §Automerge` | protocol |
| `automerge-repo` | `caderno-2-protocol/04-automerge-integration-spec.md §2` | `glossary.md §Automerge Repo`; `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1`; `rfc-transporte-p2p-v3.1.md §2.1` ★★ | protocol |
| `changes` | `caderno-2-protocol/04-automerge-integration-spec.md §3.1` | `glossary.md §Changes` ★ | protocol |
| `ephemeral-messages` | `caderno-2-protocol/04-automerge-integration-spec.md §4.1` | `glossary.md §Ephemeral Messages`; `rfc-transporte-p2p-v3.1.md §2.1` ★ | protocol |
| `documento-casca` | `caderno-2-protocol/04-automerge-integration-spec.md §2` | `glossary.md §Documento Casca`; `rfc-transporte-p2p-v3.1.md §2.3`; `rfc-transporte-p2p-v3.1.md Apêndice B` ★★★ | protocol |
| `ciclo-de-commit` | `caderno-2-protocol/04-automerge-integration-spec.md §3` | — | protocol |
| `eleicao-de-committer` | `caderno-2-protocol/04-automerge-integration-spec.md §4` | — | protocol |
| `fork-resolucao` | `caderno-2-protocol/04-automerge-integration-spec.md §4.2` | `rfc-transporte-p2p-v3.1.md §2.10.2`; `rfc-transporte-p2p-v3.1.md §4.6` ★ | protocol |
| `merge-aditivo` | `caderno-2-protocol/04-automerge-integration-spec.md §4.3` | `rfc-v4.md §2.4` ★ | protocol |
| `mfa-s` | `glossary.md §MFA-S` | `caderno-4-governance/01-development-roadmap.md §Fase 2` (redefine como "Multi-Factor Audit Semantic") ★ | protocol |
| `pending-changes` | `caderno-2-protocol/04-automerge-integration-spec.md §3.1` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §4` (menciona) | sdk |

---

## 6. Banco de Dados e Projeções (SQLite / SDK)

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `sqlite-wasm` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §1` | `caderno-1-vision/01-vision-and-positioning.md §3.2` (menciona) | sdk |
| `opfs` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §1` | `caderno-1-vision/01-vision-and-positioning.md §3.2` | sdk |
| `vfk` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §2.1` | `glossary.md §Virtual Foreign Key` ★ | sdk |
| `retention-state` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §1` (schema `integral\|pruned\|expunged`) | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §4`; `rfc-transporte-p2p-v3.1.md §4.3` | sdk |
| `tombstone-lapide` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §2.2` | `glossary.md §Tombstone` ★ | sdk |
| `transport-hints` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §4.2` | `glossary.md §transport_hints` ★ | sdk |
| `entity-heads` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.1` | — | sdk |
| `active-edges` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.2` | — | sdk |
| `asset-balances` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.3` | — | sdk |
| `local-permissions` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.4` | — | sdk |
| `validator-serialization-log` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.5` | — | sdk |
| `peer-reputation-table` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.6` | — | sdk |
| `fts5` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §4` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.3` (menciona) | sdk |
| `rtree` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §4` | — | sdk |
| `qualidade-dependente-de-vantagem` | `glossary.md §Qualidade Dependente de Vantagem` | `caderno-3-sdk/01-sqlite-and-projections-schema.md §5` (contexto feed ranking) | sdk |

---

## 7. Workers e Ciclo de Vida em Memória

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `sync-worker` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1` | `glossary.md §Sync Worker`; `rfc-transporte-p2p-v3.1.md §3.1` ★★ | sdk |
| `crypto-worker` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.2` | `glossary.md §Crypto Worker`; `rfc-transporte-p2p-v3.1.md §3.1` ★★ | sdk |
| `index-worker` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.3` | `glossary.md §Index Worker`; `rfc-transporte-p2p-v3.1.md §3.1` ★ | sdk |
| `tinybase` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §2` | `glossary.md §TinyBase` ★ | sdk |
| `g4-garbage-collection` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §4` | `rfc-transporte-p2p-v3.1.md §4.5` (redefine pools LRU/Rarest-First) ★ | sdk |
| `zen-engine` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1` | `glossary.md §Validador de Domínio` (nome diferente!); `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §1.1` ★★ | sdk |
| `first-peer-protocol` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §6` | `glossary.md §First Peer Protocol` ★ | sdk |
| `genesis-state` | `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §6` | `glossary.md §GENESIS` ★ | sdk |
| `notification-connector` | `caderno-3-sdk/06-connectors.md §1` | `glossary.md §NotificationConnector` ★ | sdk |
| `tier-aware-degradation` | `glossary.md §Tier-aware Degradation` | `caderno-1-vision/01-vision-and-positioning.md §2.2`; `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §4` (G4 pause) | vision |

---

## 8. Engines de UI (Padrão A)

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `padrao-a-puro` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §1` | `caderno-4-governance/02-module-architecture-and-code-splitting.md §2` (menciona) | sdk |
| `spec-driven-ui` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §3` | — | sdk |
| `timeline-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.1` | — | sdk |
| `layout-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.1` | — | sdk |
| `filter-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.1` | — | sdk |
| `supercard-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.1` | — | sdk |
| `assetcard-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.1` | — | sdk |
| `smartform-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.1` | — | sdk |
| `composer-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.2` | — | sdk |
| `contextmenu-bottomsheet-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.2` | — | sdk |
| `statemachine-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.2` | — | sdk |
| `audittrail-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.2` | — | sdk |
| `geospatial-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.3` | — | sdk |
| `relationgraph-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.3` | — | sdk |
| `workspaceshell-engine` | `caderno-3-sdk/03-engines-and-spec-driven-ui.md §2.3` | — | sdk |

---

## 9. Customização: Temas e i18n

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `tokens-css-hsl` | `caderno-3-sdk/04-theme-and-i18n-data-structures.md §1.1` | — | sdk |
| `marketplace-customizacoes` | `caderno-3-sdk/04-theme-and-i18n-data-structures.md §3` | `caderno-1-vision/02-business-models-and-licensing.md §1.3` (menciona) | vision |

---

## 10. Governança, Ciclo de Vida e Compliance

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `specification-versionamento-semver` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §1.2` | — | governance |
| `specification-extensao-extends` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §1.3` | — | governance |
| `rfc-processo` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §2` | — | governance |
| `tradeoff-liveness-validadores` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4` | `rfc-transporte-p2p-v3.1.md §4.6` (repete propriedades e esclarecimento SPOF) ★ | governance |
| `consenso-emergencia` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4` | `rfc-transporte-p2p-v3.1.md §4.6` ★ | governance |
| `morte-da-rede` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.3` | `rfc-transporte-p2p-v3.1.md §4.6` ★ | governance |
| `sucessao-por-quorum` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.2` | — | governance |
| `congelamento-escopado` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4` | `rfc-v4.md §2.3` (formaliza por linhagem) ★ | governance |
| `defesa-sybil` | `rfc-v4.md §4.2` | — | governance |
| `economia-como-modulo` | `rfc-v4.md §4.1` | `glossary.md §Economia-como-Módulo (v4)` ★ | governance |

---

## 11. Visão, Produto e Modalidades

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `local-first` | `caderno-1-vision/01-vision-and-positioning.md §1` | `glossary.md §Local-First` | vision |
| `modalidade-de-rede` | `caderno-1-vision/01-vision-and-positioning.md §4` | `glossary.md §Modalidade de Rede` ★ | vision |
| `rede-publica` | `caderno-1-vision/01-vision-and-positioning.md §4.1` | `caderno-1-vision/03-legal-and-compliance-framework.md §1.2` | vision |
| `rede-corporativa-whitelabel` | `caderno-1-vision/01-vision-and-positioning.md §4.2` | `glossary.md §Whitelabel`; `caderno-1-vision/02-business-models-and-licensing.md §2`; `caderno-1-vision/03-legal-and-compliance-framework.md §1.1` ★ | vision |
| `rede-p2p-pura` | `caderno-1-vision/01-vision-and-positioning.md §4.3` | `caderno-1-vision/03-legal-and-compliance-framework.md §1.3` | vision |
| `pragmatismo-topologico` | `caderno-1-vision/01-vision-and-positioning.md §2.1` | `rfc-transporte-p2p-v3.1.md §1.2` (repete raciocínio) ★ | vision |
| `redes-sao-silos` | `caderno-1-vision/01-vision-and-positioning.md §4.4` | — | vision |
| `formato-de-software` | `caderno-1-vision/01-vision-and-positioning.md §3` | — | vision |
| `fundador` | `caderno-1-vision/01-vision-and-positioning.md §5` | `glossary.md §Fundador`; `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3` ★ | vision |
| `peer` | `glossary.md §Peer` | `caderno-1-vision/01-vision-and-positioning.md §3` (menciona formatos) | vision |
| `peer-do-sistema` | `glossary.md §Peer do Sistema` | `caderno-1-vision/01-vision-and-positioning.md §5` ★ | vision |
| `honestidade-radical` | `caderno-1-vision/01-vision-and-positioning.md §2.4` | `rfc-transporte-p2p-v3.1.md §1.3` ★ | vision |
| `moderacao-via-profile-organization` | `caderno-2-protocol/01-graph-ontology.md §3.5` | — | protocol |
| `expurgo-lgpd` | `caderno-1-vision/03-legal-and-compliance-framework.md §3.1` | — | governance |

---

## 12. Primitivas de Transação Multidomínio

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `saga` | `rfc-transacoes-multidominio.md §2` | `glossary.md §Saga (Tier 1)` ★ | protocol |
| `2pc-com-lock-ttl` | `rfc-transacoes-multidominio.md §3` | `glossary.md §2PC com Lock TTL (Tier 2)` ★ | protocol |
| `politica-de-ttl` | `rfc-transacoes-multidominio.md §5` | `glossary.md §Política de TTL` ★ | protocol |
| `linhagem-de-coordenacao` | `rfc-transacoes-multidominio.md §8` | `glossary.md §Linhagem de Coordenação` ★ | protocol |
| `revogacao-por-cortesia` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §5.2` | `glossary.md §Revogação por Cortesia (Expunge)`; `rfc-transacoes-multidominio.md §6` ★ | protocol |
| `oraculo-baas` | `rfc-transacoes-multidominio.md §2, §7` | `glossary.md §Oráculo (Ponte BaaS)` ★ | protocol |
| `comutativo-vs-nao-comutativo` | `rfc-v4.md §2.1` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.4` | protocol |
| `serialization-por-linhagem` | `rfc-v4.md §2.3` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5`; `glossary.md §Serialização por Linhagem (v4)` ★★ | protocol |
| `invariante-de-core` | `rfc-v4.md §2.3` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5`; `glossary.md §Invariante de Core (v4)` ★★ | protocol |
| `validador-declarado` | `rfc-v4.md §2.3, Apêndice B` | `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5` ★ | protocol |
| `aplicador-deterministico` | `rfc-v4.md §2.4` | `glossary.md §Aplicador Determinístico (v4)`; `caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3.5` ★ | protocol |

---

## 13. Plano de Mídia (BLOBs e Stream)

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `convergent-encryption` | `caderno-3-sdk/05-media-transport-plane.md §3.2` | `glossary.md §Convergent Encryption (modo convergent)` ★ | sdk |
| `rendition` | `caderno-3-sdk/05-media-transport-plane.md §4.1` | `glossary.md §Rendition` ★ | protocol |
| `webseed-bep19` | `caderno-3-sdk/05-media-transport-plane.md §5.2` | `glossary.md §WebSeed (BEP 19)` ★ | sdk |
| `edge-translation` | `caderno-3-sdk/05-media-transport-plane.md §5.2` | `glossary.md §Edge Translation` ★ | sdk |
| `consolidacao-de-live` | `caderno-3-sdk/05-media-transport-plane.md §8.2` | `glossary.md §Consolidação de Live` ★ | sdk |
| `livekit` | `caderno-3-sdk/05-media-transport-plane.md §8.1` | — | sdk |

---

## 14. Agente de Sistema, Economia e Contribuição (v4)

| conceito (slug) | definição canônica atual (arquivo:seção) | outras aparições (redefinições) | nível |
|:---|:---|:---|:---|
| `agente-de-sistema` | `rfc-v4.md §1.1` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.6`; `glossary.md §Agente de Sistema (v4)` ★★ | protocol |
| `desafio-canary` | `rfc-v4.md §2.7` | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.6`; `glossary.md §Desafio Canary (v4)` ★ | protocol |
| `contribuicao-verificavel` | `rfc-v4.md §3.3` | `glossary.md §Contribuição Verificável (v4)` ★ | protocol |
| `standing` | `rfc-v4.md §3.3` | `glossary.md §Standing (v4)` ★ | protocol |
| `reputacao-local` | `rfc-v4.md §3.4` | `glossary.md §Reputação Local (v4)`; `caderno-3-sdk/01-sqlite-and-projections-schema.md §3.6` ★ | protocol |
| `fato-negativo-verificavel` | `rfc-v4.md §2.5` | `glossary.md §Fato Negativo Verificável (v4)` ★ | protocol |
| `bond-caucao` | `rfc-v4.md §4.2` | `rfc-transacoes-multidominio.md §6.3` | governance |

---

## Sumário de Alvos de Consolidação (★★ e ★★★)

Os conceitos a seguir possuem redefinições substanciais em **dois ou mais arquivos distintos** e devem ser priorizados na criação de verbetes canônicos:

| slug | redefinições em | gravidade |
|:---|:---|:---|
| `onda` | glossary + caderno-2/03 + caderno-3/02 + rfc §2.8 | ★★★ |
| `documento-casca` | glossary + caderno-2/04 + rfc §2.3 + rfc Apêndice B | ★★★ |
| `hlc` | glossary + caderno-2/02 §3.5 + rfc §2.9 | ★★ |
| `rbsr` | glossary + caderno-2/03 §1 + rfc §2.6 | ★★ |
| `ucan` | glossary + caderno-2/02 §2.2 + rfc §2.7 | ★★ |
| `peer-id` | glossary + caderno-2/02 §1.4 + rfc §2.2 | ★★ |
| `key-vault` | caderno-2/02 + caderno-3/02 + rfc §3.1 | ★★ |
| `linhagem-de-versoes` | glossary + caderno-2/02 + caderno-2/04 + rfc §2.10.1 | ★★ |
| `asset-permission` | glossary + caderno-2/01 + caderno-2/02 §2.1 | ★★ |
| `asset-role` | glossary + caderno-2/01 + caderno-2/02 §2.1 | ★★ |
| `asset-lock` | glossary + caderno-2/01 + rfc-transacoes §2 + caderno-3/01 §3.3 | ★★ |
| `asset-invite` | glossary + rfc-transporte §2.4.4 + rfc-v4 §4.2 | ★★ |
| `sync-worker` | glossary + caderno-3/02 + rfc §3.1 | ★★ |
| `crypto-worker` | glossary + caderno-3/02 + rfc §3.1 | ★★ |
| `zen-engine` | glossary (como "Validador de Domínio") + caderno-3/02 + caderno-4/03 | ★★ |
| `specification` | glossary + caderno-2/01 + caderno-4/03 | ★★ |
| `anti-entropy` | glossary + caderno-2/03 + caderno-3/02 + rfc §2.8 | ★★ |
| `content-intent` | glossary (2×!) + caderno-2/01 + caderno-1/03 + rfc-v4 §2.4 | ★★ |
| `automerge-repo` | glossary + caderno-2/04 + caderno-3/02 + rfc §2.1 | ★★ |
| `range-footer` | glossary + caderno-2/03 §1.2 + rfc §2.6.3 | ★★ |
| `agente-de-sistema` | rfc-v4 §1 + caderno-2/02 §1.6 + glossary | ★★ |
| `serialization-por-linhagem` | rfc-v4 §2.3 + caderno-4/03 §3.5 + glossary | ★★ |
| `invariante-de-core` | rfc-v4 §2.3 + caderno-4/03 §3.5 + glossary | ★★ |
