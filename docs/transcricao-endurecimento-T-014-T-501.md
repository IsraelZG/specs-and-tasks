# Transcrição de Endurecimento — T-014, T-018, T-019, T-109, T-301, T-501

**Data:** 2026-06-22 | **Executor:** DeepSeek (via Crush) | **Skill:** `/endurecer-task`

---

## 1. Fontes consultadas

| Fonte | Path | Relevância |
|-------|------|-----------|
| Gold Standard | `tasks/T-001.md` | Forma de spec-executável de referência |
| Dimensionamento | `CLAUDE.md` §Dimensionamento | Regras de `Capacidade-alvo` (haiku/sonnet/opus-spike) |
| T-004 (done) | `tasks/T-004.md` + `packages/protocol/src/ports.ts` | Contratos `NetworkAdapterPort`, `StoragePort`, `ClockPort`, etc. |
| T-011 (done) | `tasks/T-011.md` | Paths do design-system no monorepo |
| T-002 (done) | `tasks/T-002.md` | CI single-job `ubuntu-latest` |
| T-101 (done) | `tasks/T-101.md` + `packages/crypto/src/wrappers.ts` | `Ed25519Sign`, `sha256`, `aesGcmEncrypt` |
| T-107 (done) | `tasks/T-107.md` + `packages/core/src/signature.ts` | `SignedNode`, `canonicalizeNode`, `signNode` |
| T-106 (done) | `tasks/T-106.md` + `packages/core/src/schema.ts` | `MIGRATIONS`, schema nodes/edges |
| RBSR | `docs/conceitos/rbsr.md` | XOR recursivo de fingerprints, B-Tree em RAM |
| Fingerprint | `docs/conceitos/fingerprint.md` | `F(x) = SHA-256(id‖sig)`, `F(range) = XOR` |
| UCAN | `docs/conceitos/ucan.md` | Token delegável, query de traversal, edge_filter |
| Crypto Lineage | `docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | UCAN §2, predicado de bloqueio |

---

## 2. T-014 — Migrar hook de metadados + skill

**Estado inicial:** `draft`, sem `Capacidade-alvo`.

**Análise:** Task de complexidade 1 — copiar arquivo de skill, mesclar hook no `settings.json` da raiz, smoke test manual. Zero contratos TS. A única dependência é T-011 (design-system já incorporado ao monorepo, paths conhecidos).

**Endurecimento aplicado:**
- Adicionado `capacity_target: haiku` ao frontmatter
- Nenhuma decisão em aberto — paths exatos derivados de T-011

**Status recomendado:** `ready`

---

## 3. T-018 — Cobertura de testes do design-system

**Estado inicial:** `draft`, subdividida em 5 subtasks (T-018a a T-018e), sem `Capacidade-alvo`.

**Análise:** 39 componentes em 3 tiers (A: 16 interativos, B: 8 overlay/portal, C: 15 display/estrutural). Moldes existentes: `Button, Checkbox, Input, Modal, Switch, Tabs.test.tsx`. Padrão JSDOM + `@testing-library/react`. Haiku-compatível por componente.

**Endurecimento aplicado:**
- Adicionado `capacity_target: haiku`
- Tier breakdown e critérios já estavam bem definidos (Seção 4)
- Pegadinhas documentadas (Seção 5) cobrem portal, transições, refs

**Status recomendado:** `ready`

---

## 4. T-019 — Matriz de CI multiplataforma

**Estado inicial:** `draft`, sem `Capacidade-alvo`.

**Análise:** Expansão do CI existente (T-002, single-job `ubuntu-latest`) para `strategy.matrix.os: [ubuntu-latest, ubuntu-24.04-arm]`. 4 casos de verificação já enumerados. Pegadinhas: cache colide com `runner.os` (ambos são `Linux`), dependências nativas (`better-sqlite3`) podem precisar rebuild em arm64.

**Endurecimento aplicado:**
- Adicionado `capacity_target: haiku` (single-file update, mecânico)
- Contratos: CI YAML da T-002 é a única fonte; path `strategy.matrix.os` é padrão GitHub Actions
- Nenhuma decisão em aberto

**Status recomendado:** `ready`

---

## 5. T-109 — NetworkAdapterPort multi-subscriber

**Estado inicial:** `draft`, sem `Capacidade-alvo`.

**Análise:** `onMessage` atual aceita único handler (sobrescreve). Trocar para `onMessage(handler): () => void` (unsubscribe). 7 casos de teste já enumerados na Seção 4. Única dependência: T-004 (done, define `NetworkAdapterPort`). Bloqueia T-204 e T-402 (consumidores futuros).

**Endurecimento aplicado:**
- Adicionado `capacity_target: sonnet` (julgamento sobre API de multi-subscriber — broadcast, ordem, idempotência)
- Contratos derivados de T-004: `MessageHandler` mantido, retorno de `onMessage` muda de `void` para `() => void`
- Testes cobrem broadcast, unsubscribe, idempotência, sem replay, close limpa, type-safe stub

**Status recomendado:** `ready`

---

## 6. T-301 — B-Tree de fingerprints (RBSR)

**Estado inicial:** `draft`, sem `Capacidade-alvo`. Seção 1 descreve o objetivo, Seção 3 lista arquivos a criar. Contratos implícitos (não há assinaturas TS fixadas na spec).

**Análise:** Estrutura em memória ordenada por ID com fingerprint individual e XOR agregado por sub-range. Derivado de `docs/conceitos/rbsr.md` (XOR recursivo) e `docs/conceitos/fingerprint.md` (`F(x) = SHA-256(id‖sig)`). B-Tree pura (não SQLite). Complexidade 4 justifica `sonnet`.

**Endurecimento aplicado:**
- Adicionado `capacity_target: sonnet`
- Contratos (derivados dos docs canônicos, NÃO inventados):
  - **Fingerprint:** `type Fingerprint = Uint8Array` (32 bytes, SHA-256), `XOR` como operação de agregação
  - **Nó da B-Tree:** `{ id: ULID, fingerprint: Fingerprint, xorAgg: Fingerprint, left?, right? }`
  - **Operações:** `insert(id, fp)`, `remove(id)`, `xorRange(start, end)` → O(1) por sub-range
  - **Split:** quando nó excede `MAX_DEGREE`, divide no meio e propaga XOR

**Status recomendado:** `ready`

---

## 7. T-501 — Motor de UCAN Core

**Estado inicial:** `draft`, sem `Capacidade-alvo`. Seção 2 referencia `docs/caderno-4-governance/01-ucan.md` (arquivo inexistente).

**Análise:** Doc real está em `docs/conceitos/ucan.md` + `docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md §2`. UCAN = token de autorização delegável com query de traversal (`root`, `depth ≤ 6`, `direction`, `edge_filter`). Assinatura Ed25519 sobre payload canônico. Delegação recursiva (A→B→C), revogação por lápide, predicado de bloqueio (v4).

**Endurecimento aplicado:**
- Adicionado `capacity_target: sonnet`
- Seção 2 (Contexto RAG) corrigida — referência trocada para `docs/conceitos/ucan.md`
- Contratos (derivados dos docs canônicos, NÃO inventados):
  - **Payload UCAN:** `{ iss: PeerId, aud: PeerId, att: Capability[], exp: number, nbf: number, delegatable: boolean, traversal?: TraversalQuery }`
  - **Traversal:** `{ root: ULID, depth: number, direction: 'forward' | 'backward' | 'both', edge_filter?: Array<[string, string]> }`
  - **Assinatura:** `Ed25519` sobre `canonicalize(payload)` — mesmo padrão de T-107
  - **Funções:** `issue(payload, key): UCAN`, `verify(ucan): boolean`, `delegate(ucan, subPayload, key): UCAN`, `validateChain(ucans: UCAN[]): boolean`
  - **NÃO** acessa SQLite, **NÃO** carrega chaves privadas no payload

**Status recomendado:** `ready`

---

## 8. Sumário

| Task | Capacidade | Decisões abertas | Status |
|------|-----------|-------------------|--------|
| T-014 | `haiku` | 0 | `ready` |
| T-018 | `haiku` | 0 | `ready` |
| T-019 | `haiku` | 0 | `ready` |
| T-109 | `sonnet` | 0 | `ready` |
| T-301 | `sonnet` | 0 | `ready` |
| T-501 | `sonnet` | 0 | `ready` |

**Total: 6 tasks endurecidas, 0 decisões em aberto, 0 invenções.** Todos os contratos são derivados de tasks `done` ou docs canônicos. O flip `draft → ready` é decisão do arquiteto.
