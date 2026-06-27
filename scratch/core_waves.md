# Ondas de Implementação da Plataforma Core

Este documento organiza as tarefas de desenvolvimento do protocolo e infraestrutura core em **Ondas sequenciais de execução paralela**.

- **Onda Atual (Onda 1)**: Tarefas cujas dependências já foram 100% concluídas. Podem ser iniciadas imediatamente em paralelo.
- **Ondas Seguintes**: Tarefas que dependem da finalização de itens da onda anterior.

## 🌊 Onda 1

| ID | Tarefa | Status | Dependências Core |
| :--- | :--- | :---: | :--- |
| [T-006](file:///c:/Dev2026/Docs/tasks/T-006.md) | SimNetwork v2 — Degradação e NAT | `draft` | [T-005](file:///c:/Dev2026/Docs/tasks/T-005.md) |
| [T-007](file:///c:/Dev2026/Docs/tasks/T-007.md) | Asserções de convergência (Testkit) | `review` | [T-005](file:///c:/Dev2026/Docs/tasks/T-005.md) |
| [T-014](file:///c:/Dev2026/Docs/tasks/T-014.md) | Migrar hook de metadados + skill para .claude da raiz | `review` | [T-011](file:///c:/Dev2026/Docs/tasks/T-011.md) |
| [T-020](file:///c:/Dev2026/Docs/tasks/T-020.md) | Spike: decidir gate de regressao visual (Lookout vs Playwright toHaveScreenshot) -> ADR | `ready` | [T-011](file:///c:/Dev2026/Docs/tasks/T-011.md), [T-012](file:///c:/Dev2026/Docs/tasks/T-012.md), [T-015](file:///c:/Dev2026/Docs/tasks/T-015.md), [T-019](file:///c:/Dev2026/Docs/tasks/T-019.md) |
| [T-021](file:///c:/Dev2026/Docs/tasks/T-021.md) | Arcabouco de E2E Playwright compartilhado (@plataforma/testkit) + showcase como 1o consumidor | `ready` | [T-011](file:///c:/Dev2026/Docs/tasks/T-011.md), [T-012](file:///c:/Dev2026/Docs/tasks/T-012.md), [T-015](file:///c:/Dev2026/Docs/tasks/T-015.md), [T-018](file:///c:/Dev2026/Docs/tasks/T-018.md), [T-019](file:///c:/Dev2026/Docs/tasks/T-019.md) |
| [T-108](file:///c:/Dev2026/Docs/tasks/T-108.md) | Linhagem Layer 2 | `blocked` | [T-107](file:///c:/Dev2026/Docs/tasks/T-107.md), [T-106](file:///c:/Dev2026/Docs/tasks/T-106.md) |
| [T-202-followup-1](file:///c:/Dev2026/Docs/tasks/T-202-followup-1.md) | Robustez de testes Noise_XX — SimNetwork + reason específico + canais pós-epochMismatch + simetria do pinning | `review` | [T-202](file:///c:/Dev2026/Docs/tasks/T-202.md) |
| [T-202-followup-3](file:///c:/Dev2026/Docs/tasks/T-202-followup-3.md) | Awareness multi-peer no makeInbox — filtro por peerId do handshake | `rework` | [T-202](file:///c:/Dev2026/Docs/tasks/T-202.md), [T-202-followup-2](file:///c:/Dev2026/Docs/tasks/T-202-followup-2.md) |
| [T-208](file:///c:/Dev2026/Docs/tasks/T-208.md) | First Peer Protocol (FPP) | `ready` | [T-205](file:///c:/Dev2026/Docs/tasks/T-205.md), [T-004](file:///c:/Dev2026/Docs/tasks/T-004.md) |
| [T-211](file:///c:/Dev2026/Docs/tasks/T-211.md) | Bancada: aba Rede | `draft` | [T-008](file:///c:/Dev2026/Docs/tasks/T-008.md), [T-009](file:///c:/Dev2026/Docs/tasks/T-009.md), [T-205](file:///c:/Dev2026/Docs/tasks/T-205.md) |
| [T-212](file:///c:/Dev2026/Docs/tasks/T-212.md) | Codec MessagePack — suporte nativo a bigint | `ready` | [T-203](file:///c:/Dev2026/Docs/tasks/T-203.md) |
| [T-302](file:///c:/Dev2026/Docs/tasks/T-302.md) | Protocolo de troca RBSR | `draft` | [T-301](file:///c:/Dev2026/Docs/tasks/T-301.md), [T-204](file:///c:/Dev2026/Docs/tasks/T-204.md) |
| [T-505](file:///c:/Dev2026/Docs/tasks/T-505.md) | Rotação de Épocas (Forward Secrecy) | `draft` | [T-501](file:///c:/Dev2026/Docs/tasks/T-501.md), [T-110](file:///c:/Dev2026/Docs/tasks/T-110.md) |
| [T-701](file:///c:/Dev2026/Docs/tasks/T-701.md) | device_state.db — store Local+Persistente | `ready` | [T-004](file:///c:/Dev2026/Docs/tasks/T-004.md), [T-105](file:///c:/Dev2026/Docs/tasks/T-105.md) |
| [T-802](file:///c:/Dev2026/Docs/tasks/T-802.md) | Remontagem verificada por Merkle/InfoHash (fronteira de confiança do BlobStorage) | `ready` | [T-801](file:///c:/Dev2026/Docs/tasks/T-801.md) |

## 🌊 Onda 2

| ID | Tarefa | Status | Dependências Core |
| :--- | :--- | :---: | :--- |
| [T-108-rework-3](file:///c:/Dev2026/Docs/tasks/T-108-rework-3.md) | T-108 rework-3 — parentHash validation + entity_members table (ADR) + entity_heads maintenance (ADR) + test 4 fix | `review` | [T-108](file:///c:/Dev2026/Docs/tasks/T-108.md) |
| [T-305](file:///c:/Dev2026/Docs/tasks/T-305.md) | Sync dirigido por UCAN | `draft` | [T-302](file:///c:/Dev2026/Docs/tasks/T-302.md), [T-501](file:///c:/Dev2026/Docs/tasks/T-501.md) |
| [T-311](file:///c:/Dev2026/Docs/tasks/T-311.md) | Bancada: aba Sync | `draft` | [T-008](file:///c:/Dev2026/Docs/tasks/T-008.md), [T-009](file:///c:/Dev2026/Docs/tasks/T-009.md), [T-302](file:///c:/Dev2026/Docs/tasks/T-302.md) |
| [T-402](file:///c:/Dev2026/Docs/tasks/T-402.md) | Adapter WebRTC DataChannel | `draft` | [T-204](file:///c:/Dev2026/Docs/tasks/T-204.md), [T-302](file:///c:/Dev2026/Docs/tasks/T-302.md) |
| [T-601-rework-1](file:///c:/Dev2026/Docs/tasks/T-601-rework-1.md) | Rework-1 de T-601: rebase contra rework-3 + MERGES (RFC-028) + maxDepth recursivo + projectProvisionalHead async | `review` | [T-108](file:///c:/Dev2026/Docs/tasks/T-108.md) |
| [T-601](file:///c:/Dev2026/Docs/tasks/T-601.md) | Detecção Estrutural de Fork e Merge | `rework` | [T-108](file:///c:/Dev2026/Docs/tasks/T-108.md) |

## 🌊 Onda 3

| ID | Tarefa | Status | Dependências Core |
| :--- | :--- | :---: | :--- |
| [T-404](file:///c:/Dev2026/Docs/tasks/T-404.md) | ConnectionPromotionEngine (Hole Punching) | `draft` | [T-402](file:///c:/Dev2026/Docs/tasks/T-402.md) |
| [T-604](file:///c:/Dev2026/Docs/tasks/T-604.md) | Zen Engine Embarcado + Invariante T1 | `draft` | [T-601](file:///c:/Dev2026/Docs/tasks/T-601.md) |

## 🌊 Onda 4

| ID | Tarefa | Status | Dependências Core |
| :--- | :--- | :---: | :--- |
| [T-905](file:///c:/Dev2026/Docs/tasks/T-905.md) | Bateria de Testes Adversariais (Chaos/Fuzzer) | `draft` | [T-404](file:///c:/Dev2026/Docs/tasks/T-404.md), [T-601](file:///c:/Dev2026/Docs/tasks/T-601.md), [T-801](file:///c:/Dev2026/Docs/tasks/T-801.md) |

