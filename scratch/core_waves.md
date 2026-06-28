# Ondas de Implementação da Plataforma Core

Este documento organiza as tarefas de desenvolvimento do protocolo e infraestrutura core em **Ondas sequenciais de execução paralela**.

- **Onda Atual (Onda 1)**: Tarefas cujas dependências já foram 100% concluídas. Podem ser iniciadas imediatamente em paralelo.
- **Ondas Seguintes**: Tarefas que dependem da finalização de itens da onda anterior.

## 🌊 Onda 1

| ID | Tarefa | Status | Dependências Core |
| :--- | :--- | :---: | :--- |
| [T-006](file:///c:/Dev2026/Docs/tasks/T-006.md) | SimNetwork v2 — Degradação e NAT | `draft` | [T-005](file:///c:/Dev2026/Docs/tasks/T-005.md) |
| [T-021](file:///c:/Dev2026/Docs/tasks/T-021.md) | Arcabouco de E2E Playwright compartilhado (@plataforma/testkit) + showcase como 1o consumidor | `ready` | [T-011](file:///c:/Dev2026/Docs/tasks/T-011.md), [T-012](file:///c:/Dev2026/Docs/tasks/T-012.md), [T-015](file:///c:/Dev2026/Docs/tasks/T-015.md), [T-018](file:///c:/Dev2026/Docs/tasks/T-018.md), [T-019](file:///c:/Dev2026/Docs/tasks/T-019.md) |
| [T-108](file:///c:/Dev2026/Docs/tasks/T-108.md) | Linhagem Layer 2 | `ready` | [T-107](file:///c:/Dev2026/Docs/tasks/T-107.md), [T-106](file:///c:/Dev2026/Docs/tasks/T-106.md) |
| [T-111](file:///c:/Dev2026/Docs/tasks/T-111.md) | Bancada: aba Identidade | `draft` | [T-008](file:///c:/Dev2026/Docs/tasks/T-008.md) |
| [T-202-followup-3](file:///c:/Dev2026/Docs/tasks/T-202-followup-3.md) | Awareness multi-peer no makeInbox — filtro por peerId do handshake | `review` | [T-202](file:///c:/Dev2026/Docs/tasks/T-202.md), [T-202-followup-2](file:///c:/Dev2026/Docs/tasks/T-202-followup-2.md) |
| [T-206](file:///c:/Dev2026/Docs/tasks/T-206.md) | Heartbeat implícito/explícito + evicção | `draft` | [T-205](file:///c:/Dev2026/Docs/tasks/T-205.md), [T-003](file:///c:/Dev2026/Docs/tasks/T-003.md) |
| [T-207](file:///c:/Dev2026/Docs/tasks/T-207.md) | RelayTrustModel v0 | `draft` | [T-205](file:///c:/Dev2026/Docs/tasks/T-205.md) |
| [T-208](file:///c:/Dev2026/Docs/tasks/T-208.md) | First Peer Protocol (FPP) | `ready` | [T-205](file:///c:/Dev2026/Docs/tasks/T-205.md), [T-004](file:///c:/Dev2026/Docs/tasks/T-004.md) |
| [T-210](file:///c:/Dev2026/Docs/tasks/T-210.md) | Convite ASSET:INVITE | `draft` | - |
| [T-211](file:///c:/Dev2026/Docs/tasks/T-211.md) | Bancada: aba Rede | `draft` | [T-008](file:///c:/Dev2026/Docs/tasks/T-008.md), [T-009](file:///c:/Dev2026/Docs/tasks/T-009.md), [T-205](file:///c:/Dev2026/Docs/tasks/T-205.md) |
| [T-212](file:///c:/Dev2026/Docs/tasks/T-212.md) | Codec MessagePack — suporte nativo a bigint | `ready` | [T-203](file:///c:/Dev2026/Docs/tasks/T-203.md) |
| [T-302](file:///c:/Dev2026/Docs/tasks/T-302.md) | Protocolo de troca RBSR | `draft` | [T-301](file:///c:/Dev2026/Docs/tasks/T-301.md), [T-204](file:///c:/Dev2026/Docs/tasks/T-204.md) |
| [T-303](file:///c:/Dev2026/Docs/tasks/T-303.md) | RangeFooter + rodada de desafio | `draft` | - |
| [T-304](file:///c:/Dev2026/Docs/tasks/T-304.md) | ConcurrentReconciliationGuard | `draft` | - |
| [T-306](file:///c:/Dev2026/Docs/tasks/T-306.md) | Ondas 0–2 | `draft` | [T-203](file:///c:/Dev2026/Docs/tasks/T-203.md) |
| [T-307](file:///c:/Dev2026/Docs/tasks/T-307.md) | Coordenação de sync + failover | `draft` | [T-205](file:///c:/Dev2026/Docs/tasks/T-205.md) |
| [T-310](file:///c:/Dev2026/Docs/tasks/T-310.md) | Matriz de transporte IoC | `draft` | [T-004](file:///c:/Dev2026/Docs/tasks/T-004.md) |
| [T-312](file:///c:/Dev2026/Docs/tasks/T-312.md) | Eleição de dono do banco por Web Locks | `draft` | - |
| [T-313](file:///c:/Dev2026/Docs/tasks/T-313.md) | Archive Cargo | `draft` | - |
| [T-401](file:///c:/Dev2026/Docs/tasks/T-401.md) | Signaling no peer do sistema | `draft` | [T-010](file:///c:/Dev2026/Docs/tasks/T-010.md), [T-204](file:///c:/Dev2026/Docs/tasks/T-204.md) |
| [T-406](file:///c:/Dev2026/Docs/tasks/T-406.md) | Descoberta morna Graph Routing | `draft` | [T-205](file:///c:/Dev2026/Docs/tasks/T-205.md) |
| [T-407](file:///c:/Dev2026/Docs/tasks/T-407.md) | Link multiaddr out-of-band | `draft` | - |
| [T-408](file:///c:/Dev2026/Docs/tasks/T-408.md) | Tracker WSS privado | `draft` | [T-010](file:///c:/Dev2026/Docs/tasks/T-010.md) |
| [T-502](file:///c:/Dev2026/Docs/tasks/T-502.md) | ASSET:PERMISSION/ROLE físicos | `draft` | - |
| [T-504](file:///c:/Dev2026/Docs/tasks/T-504.md) | Revogação + cortesia | `draft` | [T-109](file:///c:/Dev2026/Docs/tasks/T-109.md) |
| [T-505](file:///c:/Dev2026/Docs/tasks/T-505.md) | Rotação de Épocas (Forward Secrecy) | `draft` | [T-501](file:///c:/Dev2026/Docs/tasks/T-501.md), [T-110](file:///c:/Dev2026/Docs/tasks/T-110.md) |
| [T-506](file:///c:/Dev2026/Docs/tasks/T-506.md) | Predicado de bloqueio na liberação | `draft` | - |
| [T-507](file:///c:/Dev2026/Docs/tasks/T-507.md) | STALE_EPOCH no transporte | `draft` | [T-203](file:///c:/Dev2026/Docs/tasks/T-203.md) |
| [T-508](file:///c:/Dev2026/Docs/tasks/T-508.md) | Conector SMTP | `draft` | [T-010](file:///c:/Dev2026/Docs/tasks/T-010.md) |
| [T-510](file:///c:/Dev2026/Docs/tasks/T-510.md) | Shamir 2-de-3 | `draft` | - |
| [T-511](file:///c:/Dev2026/Docs/tasks/T-511.md) | Modelo soberano | `draft` | - |
| [T-512](file:///c:/Dev2026/Docs/tasks/T-512.md) | Bancada: aba Auth | `draft` | [T-008](file:///c:/Dev2026/Docs/tasks/T-008.md) |
| [T-604](file:///c:/Dev2026/Docs/tasks/T-604.md) | Zen Engine Embarcado + Invariante T1 | `draft` | [T-601](file:///c:/Dev2026/Docs/tasks/T-601.md) |
| [T-607](file:///c:/Dev2026/Docs/tasks/T-607.md) | Política de serialização em SPEC | `draft` | - |
| [T-608](file:///c:/Dev2026/Docs/tasks/T-608.md) | Bancada: aba Dados | `draft` | [T-008](file:///c:/Dev2026/Docs/tasks/T-008.md) |
| [T-701](file:///c:/Dev2026/Docs/tasks/T-701.md) | device_state.db — store Local+Persistente | `ready` | [T-004](file:///c:/Dev2026/Docs/tasks/T-004.md), [T-105](file:///c:/Dev2026/Docs/tasks/T-105.md) |
| [T-702](file:///c:/Dev2026/Docs/tasks/T-702.md) | Canal do Private Swarm | `draft` | - |
| [T-705](file:///c:/Dev2026/Docs/tasks/T-705.md) | Cerimônia QR + SAS | `draft` | [T-110](file:///c:/Dev2026/Docs/tasks/T-110.md) |
| [T-706](file:///c:/Dev2026/Docs/tasks/T-706.md) | Documentação padrões descoberta | `draft` | - |
| [T-707](file:///c:/Dev2026/Docs/tasks/T-707.md) | device_state.db | `draft` | - |
| [T-802](file:///c:/Dev2026/Docs/tasks/T-802.md) | Remontagem verificada por Merkle/InfoHash (fronteira de confiança do BlobStorage) | `ready` | [T-801](file:///c:/Dev2026/Docs/tasks/T-801.md) |
| [T-804](file:///c:/Dev2026/Docs/tasks/T-804.md) | Cloud WebSeed + Edge translation | `draft` | [T-010](file:///c:/Dev2026/Docs/tasks/T-010.md) |
| [T-807](file:///c:/Dev2026/Docs/tasks/T-807.md) | Bancada: aba Mídia | `draft` | [T-008](file:///c:/Dev2026/Docs/tasks/T-008.md) |
| [T-901](file:///c:/Dev2026/Docs/tasks/T-901.md) | PWA produto v0 (apps/web) — prova de consumo do SDK | `draft` | - |
| [T-903](file:///c:/Dev2026/Docs/tasks/T-903.md) | Telemetria local + painel (métricas na Bancada + benchmark de regressão no CI) | `draft` | [T-009](file:///c:/Dev2026/Docs/tasks/T-009.md) |
| [T-905](file:///c:/Dev2026/Docs/tasks/T-905.md) | Documentação de integração + ADRs | `draft` | - |

## 🌊 Onda 2

| ID | Tarefa | Status | Dependências Core |
| :--- | :--- | :---: | :--- |
| [T-022](file:///c:/Dev2026/Docs/tasks/T-022.md) | Ativar regressao visual Playwright toHaveScreenshot no design-system (gate ADR-0006) | `ready` | [T-021](file:///c:/Dev2026/Docs/tasks/T-021.md), [T-019](file:///c:/Dev2026/Docs/tasks/T-019.md), [T-012](file:///c:/Dev2026/Docs/tasks/T-012.md), [T-015](file:///c:/Dev2026/Docs/tasks/T-015.md), [T-018](file:///c:/Dev2026/Docs/tasks/T-018.md) |
| [T-209](file:///c:/Dev2026/Docs/tasks/T-209.md) | Gênese gerida | `draft` | [T-208](file:///c:/Dev2026/Docs/tasks/T-208.md), [T-010](file:///c:/Dev2026/Docs/tasks/T-010.md) |
| [T-305](file:///c:/Dev2026/Docs/tasks/T-305.md) | Sync dirigido por UCAN | `draft` | [T-302](file:///c:/Dev2026/Docs/tasks/T-302.md), [T-501](file:///c:/Dev2026/Docs/tasks/T-501.md) |
| [T-309](file:///c:/Dev2026/Docs/tasks/T-309.md) | GlobalThrottle | `draft` | [T-205](file:///c:/Dev2026/Docs/tasks/T-205.md), [T-312](file:///c:/Dev2026/Docs/tasks/T-312.md) |
| [T-311](file:///c:/Dev2026/Docs/tasks/T-311.md) | Bancada: aba Sync | `draft` | [T-008](file:///c:/Dev2026/Docs/tasks/T-008.md), [T-302](file:///c:/Dev2026/Docs/tasks/T-302.md) |
| [T-402](file:///c:/Dev2026/Docs/tasks/T-402.md) | Adapter WebRTC DataChannel | `draft` | [T-204](file:///c:/Dev2026/Docs/tasks/T-204.md), [T-302](file:///c:/Dev2026/Docs/tasks/T-302.md) |
| [T-503](file:///c:/Dev2026/Docs/tasks/T-503.md) | Consentimento single-pass | `draft` | [T-502](file:///c:/Dev2026/Docs/tasks/T-502.md) |
| [T-509](file:///c:/Dev2026/Docs/tasks/T-509.md) | Central Custody | `draft` | [T-110](file:///c:/Dev2026/Docs/tasks/T-110.md), [T-508](file:///c:/Dev2026/Docs/tasks/T-508.md) |
| [T-605](file:///c:/Dev2026/Docs/tasks/T-605.md) | Fluxo intent não-comutativo | `draft` | [T-604](file:///c:/Dev2026/Docs/tasks/T-604.md) |
| [T-606](file:///c:/Dev2026/Docs/tasks/T-606.md) | Congelamento escopado | `draft` | [T-604](file:///c:/Dev2026/Docs/tasks/T-604.md) |
| [T-704](file:///c:/Dev2026/Docs/tasks/T-704.md) | Bancada: simulador 2º device | `draft` | [T-008](file:///c:/Dev2026/Docs/tasks/T-008.md), [T-702](file:///c:/Dev2026/Docs/tasks/T-702.md) |
| [T-805](file:///c:/Dev2026/Docs/tasks/T-805.md) | Reidratação no browser | `draft` | [T-804](file:///c:/Dev2026/Docs/tasks/T-804.md) |
| [T-806](file:///c:/Dev2026/Docs/tasks/T-806.md) | Onda 3 + G4 v0 | `draft` | [T-313](file:///c:/Dev2026/Docs/tasks/T-313.md) |
| [T-904](file:///c:/Dev2026/Docs/tasks/T-904.md) | Caos programado (Chaos/Fuzzer sobre SimNetwork) | `draft` | [T-006](file:///c:/Dev2026/Docs/tasks/T-006.md), [T-007](file:///c:/Dev2026/Docs/tasks/T-007.md), [T-505](file:///c:/Dev2026/Docs/tasks/T-505.md), [T-601](file:///c:/Dev2026/Docs/tasks/T-601.md), [T-604](file:///c:/Dev2026/Docs/tasks/T-604.md) |

## 🌊 Onda 3

| ID | Tarefa | Status | Dependências Core |
| :--- | :--- | :---: | :--- |
| [T-403](file:///c:/Dev2026/Docs/tasks/T-403.md) | Documentos casca Automerge | `draft` | [T-402](file:///c:/Dev2026/Docs/tasks/T-402.md) |
| [T-404](file:///c:/Dev2026/Docs/tasks/T-404.md) | ConnectionPromotionEngine (Hole Punching) | `draft` | [T-402](file:///c:/Dev2026/Docs/tasks/T-402.md) |
| [T-405](file:///c:/Dev2026/Docs/tasks/T-405.md) | Relay de circuito | `draft` | [T-402](file:///c:/Dev2026/Docs/tasks/T-402.md), [T-207](file:///c:/Dev2026/Docs/tasks/T-207.md) |
| [T-409](file:///c:/Dev2026/Docs/tasks/T-409.md) | Bancada: topologia | `draft` | [T-008](file:///c:/Dev2026/Docs/tasks/T-008.md), [T-402](file:///c:/Dev2026/Docs/tasks/T-402.md) |
| [T-803](file:///c:/Dev2026/Docs/tasks/T-803.md) | Adapter WebTorrent | `draft` | [T-402](file:///c:/Dev2026/Docs/tasks/T-402.md), [T-408](file:///c:/Dev2026/Docs/tasks/T-408.md) |
| [T-902](file:///c:/Dev2026/Docs/tasks/T-902.md) | Suíte adversarial consolidada (12 vetores §2.5 + mapa de cobertura) | `draft` | [T-103](file:///c:/Dev2026/Docs/tasks/T-103.md), [T-107](file:///c:/Dev2026/Docs/tasks/T-107.md), [T-208](file:///c:/Dev2026/Docs/tasks/T-208.md), [T-210](file:///c:/Dev2026/Docs/tasks/T-210.md), [T-303](file:///c:/Dev2026/Docs/tasks/T-303.md), [T-305](file:///c:/Dev2026/Docs/tasks/T-305.md), [T-401](file:///c:/Dev2026/Docs/tasks/T-401.md), [T-506](file:///c:/Dev2026/Docs/tasks/T-506.md), [T-507](file:///c:/Dev2026/Docs/tasks/T-507.md), [T-604](file:///c:/Dev2026/Docs/tasks/T-604.md), [T-605](file:///c:/Dev2026/Docs/tasks/T-605.md) |

## 🌊 Onda 4

| ID | Tarefa | Status | Dependências Core |
| :--- | :--- | :---: | :--- |
| [T-602](file:///c:/Dev2026/Docs/tasks/T-602.md) | Ciclo de commit Automerge | `draft` | [T-403](file:///c:/Dev2026/Docs/tasks/T-403.md) |
| [T-703](file:///c:/Dev2026/Docs/tasks/T-703.md) | Estratégias de merge por classe | `draft` | [T-403](file:///c:/Dev2026/Docs/tasks/T-403.md) |

## 🌊 Onda 5

| ID | Tarefa | Status | Dependências Core |
| :--- | :--- | :---: | :--- |
| [T-603](file:///c:/Dev2026/Docs/tasks/T-603.md) | Committer determinístico | `draft` | [T-602](file:///c:/Dev2026/Docs/tasks/T-602.md) |

