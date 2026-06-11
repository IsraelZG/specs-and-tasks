# Absorção rcf-005.md

> **Resumo:** 38 subtasks · 21 haiku · 13 revisar-humano · 4 descartadas

## LISTA DE SUPERSESSÕES
- **RFC-005 v1 e adendos da Parte B:** Esta RFC-005 v2 as supersede integralmente.
- **Precedência:** Altera/estende pontos específicos da v3.1 e da v4 (listados em cada seção). Onde não tocada, a documentação vigente prevalece.
- **Substituições de submecanismo:** Substitui o submecanismo `K_df`/envelope de B.2 por uma construção direta no Key Vault de Rede (§A.13).
- **Remoção do Core:** B.3 (diretório) é removido do core; descoberta vira padrão de módulo (§A.14).

## Tabela de Subtasks

| id | fonte | tipo | destino | acao | executor | status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| a1_1_1 | rcf-005.md §a1 | NOVA-SECAO-CADERNO | `docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | §3.1 — Adicionar §3.1.1 com o texto de Época de Identidade vs. Conteúdo | haiku | [ ] |
| a1_2_2 | rcf-005.md §a1 | EDITA-CADERNO | `docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | §1.4.1 (Noise_XX) — Editar `current_epoch_index` → `identity_epoch_index` | haiku | [ ] |
| a1_3_3 | rcf-005.md §a1 | CONFLITO-REVISAR | `docs/caderno-5-transport` | §2.2.1 e §2.9 — Editar `current_epoch_index` para `identity_epoch_index` | revisar-humano | [ ] |
| a1_4_4 | rcf-005.md §a1 | NOVO-CONCEITO | `docs/conceitos/epoca-de-identidade.md` | Adicionar verbete Época de Identidade | haiku | [x] |
| a1_4_5 | rcf-005.md §a1 | EDITA-CONCEITO | `docs/conceitos/chave-de-epoca.md` | Anotar que trata apenas de Épocas de Conteúdo | haiku | [x] |
| a1_4_6 | rcf-005.md §a1 | EDITA-CONCEITO | `docs/conceitos/rotacao-de-epocas.md` | Anotar que trata apenas de Épocas de Conteúdo | haiku | [x] |
| a2_1_7 | rcf-005.md §a2 | NOVO-CADERNO | `docs/caderno-2-protocol/05-wire-protocol.md` | Adicionar novo caderno de Wire Protocol (MessagePack com Framing e Evolução) | revisar-humano | [ ] |
| a2_2_8 | rcf-005.md §a2 | CONFLITO-REVISAR | `docs/caderno-5-transport` | §2.1, §2.9 — Anotar referência ao Wire Protocol | revisar-humano | [ ] |
| a2_3_9 | rcf-005.md §a2 | EDITA-CADERDEO | `docs/caderno-3-sdk/01-sqlite-and-projections-schema.md` | `retention_state` — Documentar `3 = orphan/quarentena` | haiku | [x] |
| a3_1_10 | rcf-005.md §a3 | ADR | `docs/adr/adr-001-automerge-unico.md` | Adicionar ADR-001: Automerge como Trilha Única de CRDT | haiku | [x] |
| a3_2_11 | rcf-005.md §a3 | DESCARTE | `docs/backlog-geral.md` | Fases 2 e 3 — Marcar `yjs_updates`, `crdt-manager`, etc. como legados | haiku | [DESCARTADA: legado] |
| a3_3_12 | rcf-005.md §a3 | EDITA-CADERNO | `docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md` | §3 — Anotar referência à ADR-001 | haiku | [x] |
| a4_1_13 | rcf-005.md §a4 | NOVA-SECAO-CADERNO | `docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md` | §1.4 — Adicionar SharedWorker com Posse por Web Locks | haiku | [x] |
| a4_2_14 | rcf-005.md §a4 | CONFLITO-REVISAR | `docs/caderno-5-transport` | §3.2.5 (GlobalThrottle) — Anotar: executa no contexto dono | revisar-humano | [ ] |
| a5_1_15 | rcf-005.md §a5 | EDITA-CADERNO | `docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | §1.4 (+§1.7) — Redefinir PeerId (Device vs. Persona) e cerimônia de provisionamento | revisar-humano | [ ] |
| a5_2_16 | rcf-005.md §a5 | CONFLITO-REVISAR | `docs/caderno-5-transport` | §2.2, §3.2.2 — Adotar variantes de PeerId e canal único por dispositivo | revisar-humano | [ ] |
| a5_3_17 | rcf-005.md §a5 | EDITA-CONCEITO | `docs/conceitos/peer-id.md` | Redefinir e documentar DevicePeerId vs. PersonaPeerId | revisar-humano | [ ] |
| a5_3_18 | rcf-005.md §a5 | NOVO-CONCEITO | `docs/conceitos/delegacao-de-dispositivo.md` | Adicionar verbete Delegação de Dispositivo | haiku | [x] |
| a6_1_19 | rcf-005.md §a6 | NOVA-SECAO-CADERNO | `docs/caderno-3-sdk/06-connectors.md` | §5 — Adicionar Push Connector Content-Blind | haiku | [x] |
| a6_2_20 | rcf-005.md §a6 | NOVO-CONCEITO | `docs/conceitos/push-cego.md` | Adicionar verbete Push Cego e limites honestos | haiku | [x] |
| a6_3_21 | rcf-005.md §a6 | CONFLITO-REVISAR | `docs/caderno-5-transport` | §1.5 — Anotar capacidade modality-gated do peer do sistema | revisar-humano | [ ] |
| a8_1_22 | rcf-005.md §a8 | NOVO-CADERNO | `docs/caderno-3-sdk/07-chat-reference-spec.md` | §recibos — Adicionar Recibos de Entrega e Leitura (Efêmero + Consolidação) | revisar-humano | [ ] |
| a8_2_23 | rcf-005.md §a8 | CONFLITO-REVISAR | `docs/caderno-5-transport` | §2.11 — Anotar exemplos de enquadramento de recibos | revisar-humano | [ ] |
| a9_1_24 | rcf-005.md §a9 | NOVO-CADERNO | `docs/caderno-3-sdk/07-chat-reference-spec.md` | Adicionar modelagem de DM sem Contêiner e Grupo como PROFILE:ORGANIZATION | revisar-humano | [ ] |
| a9_2_25 | rcf-005.md §a9 | EDITA-CONCEITO | `docs/conceitos/content-message.md` | Tabela de arestas — Anotar `BELONGS_TO` e referenciar a spec | haiku | [x] |
| a9_3_26 | rcf-005.md §a9 | EDITA-CADERNO | `docs/caderno-2-protocol/01-graph-ontology.md` | §4.2 — Anotar conversa como caso de antipadrão dual-nó evitado | haiku | [x] |
| a10_1_27 | rcf-005.md §a10 | NOVA-SECAO-CADERNO | `docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | §3.3.1 — Adicionar Rotação Cooperativa de Época de Grupo | haiku | [x] |
| a10_2_28 | rcf-005.md §a10 | EDITA-CONCEITO | `docs/conceitos/rotacao-de-epocas.md` | Anotar o modo cooperativo de rotação em grupo | haiku | [x] |
| a11_1_29 | rcf-005.md §a11 | NOVA-SECAO-CADERNO | `docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | §3.4 — Adicionar Custódia Cega: Archive Cargo (encomenda cifrada) | haiku | [x] |
| a11_2_30 | rcf-005.md §a11 | EDITA-CADERNO | `docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md` | `device_state.db` — Anotar nova tabela `blind_archives` | haiku | [ ] |
| a11_3_31 | rcf-005.md §a11 | NOVO-CONCEITO | `docs/conceitos/custodia-cega-archive.md` | Adicionar verbete Custódia Cega com Archive Cargo e limites honestos | haiku | [ ] |
| a11_4_32 | rcf-005.md §a11 | DESCARTE | `docs/backlog-geral.md` | Registrar resolução de B.1 para M3/M4 com T-301/T-305 | haiku | [DESCARTADA: legado] |
| a12_1_33 | rcf-005.md §a12 | EDITA-CADERNO | `docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | §3.3 — Re-entrega a dispositivos delegados e substituição de envelopes | revisar-humano | [ ] |
| a12_2_34 | rcf-005.md §a12 | NOVA-SECAO-CADERNO | `docs/caderno-3-sdk/04-key-vault.md` | Key Vault de Rede — API `requestEpochKey` | haiku | [ ] |
| a12_3_35 | rcf-005.md §a12 | EDITA-CONCEITO | `docs/conceitos/chave-de-epoca.md` | Documentar fluxo de re-entrega no Key Vault de Rede | haiku | [ ] |
| a12_4_36 | rcf-005.md §a12 | DESCARTE | `docs/backlog-geral.md` | Registrar resolução de B.2 como pré-requisito de T-505 | haiku | [DESCARTADA: legado] |
| a13_1_37 | rcf-005.md §a13 | NOVO-CADERNO | `docs/caderno-3-sdk/08-discovery-patterns.md` | Adicionar Padrões de Descoberta de Peers | revisar-humano | [ ] |
| a13_2_38 | rcf-005.md §a13 | DESCARTE | `docs/backlog-geral.md` | Remover B.3 do core; adicionar tarefa de documentação | haiku | [DESCARTADA: legado] |
