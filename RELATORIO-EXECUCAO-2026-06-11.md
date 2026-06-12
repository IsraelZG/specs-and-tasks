# Relatório de Execução — Finalização da Documentação Plataforma V3.1/v4
**Data:** 2026-06-11 · **Escopo:** Blocos 1A–1G + Bloco 2 do prompt único

> **Nota sobre os anexos:** dos 5 arquivos referidos no prompt, 3 foram anexados. A RFC-005 estava presente **dentro do snapshot do wiki** como `docs/rcf-005.md` (**versão v2 consolidada**), junto com o manifesto de absorção `docs/rfcs/_absorcao-rcf-005.md`. O plano de implementação foi anexado em Markdown (versão ciclo transporte/discovery/sync/auth, mais nova que o PDF M0–M9 referido). A especificação IAM (PDF) não foi anexada — o item 1C/vfk foi resolvido com o verbete `vfk.md` já existente no snapshot.
>
> **Precedência aplicada:** a RFC-005 **v2** substitui o submecanismo `K_df`/envelope (descrito no resumo do prompt como resolução de B.2) pelo **Key Vault de Rede com `requestEpochKey`** (modelo direto, recomendado; variante KEK registrada como opcional). Conforme instrução de que os arquivos reais prevalecem sobre o resumo, o modelo direto foi adotado. **Decisão pendente do arquiteto formalmente fechada como: modelo direto.**

---

## Bloco 1A — 50 Links Quebrados: TODOS CORRIGIDOS

Ferramenta: o script `scripts/audit-links.mjs` não veio no snapshot (placeholder binário); o auditor foi reconstruído com lógica equivalente (wikilinks, slugger github-style, órfãos ignorando arquivos `_`, alvos ausentes conhecidos como INFO).

Padrões de quebra identificados e corrigidos:

| Padrão | Causa | Exemplos |
|:---|:---|:---|
| Slugger antigo `N-M-...` → atual `NM-...` | Migração de slugger ("2.1" gerava `2-1`, hoje gera `21`) | 18 links (`#2-1-verbos…`→`#21-verbos…`, `#3-2-duas-camadas…`→`#32-duas-camadas…`, `#4-1-co-assinatura`→`#41-…`) |
| Acentos removidos no slug antigo | Slugger antigo transliterava; o atual preserva Unicode | 14 links (`rotacao`→`rotação`, `nos`→`nós`, `genese`→`gênese`, `versoes`→`versões`) |
| Mojibake (cp850/UTF-8) | Corrupção de encoding no próprio arquivo | 6 links (`delega‡├║o`, `g├¬nese`, `ÔÇö`, `princ├¡pio`, `adequa├º├úo`, `aloca├º├úo`) |
| Seção renomeada | Evolução da documentação | `#35-hlc`→`#36-ordenação-causal-hlc-e-seleção-de-head` (2×); `#8-2-consolidação-de-live`→`#82-gravação-de-live-em-andamento-segmentos-voláteis--blob-consolidado`; `#2-2-engines-de-processo-e-interacao`→`#22-interação-e-processos`; `#6-inicializacao-e-first-peer-protocol`→`#6-gênese-da-rede--first-peer-protocol`; `#4-matriz-de-classificação-de-transporte`→`…-as-3-perguntas` (2×); `#1-o-coupling-…`→`#1-o-acoplamento-…` |
| Travessão em heading | `—` gera `--` no slug, link tinha `-—-` | `#6-gênese-da-rede-—-first-peer-protocol`→`…-rede--first-peer…` (2×); `#211--matriz`, `#324--gênese`, `#3241--os-dois-modelos` |
| Alvo ausente | `backlog-geral.md` não existe no repositório | `mfa-s.md:48` → redirecionado para `[[caderno-4-governance/01-development-roadmap#fase-2-motor-operacional-e-consistência-mfa-s-e-validação]]` |
| Falso positivo | — | `[[…01-sqlite…#31-tabela-entity_heads]]` (hlc.md:33) **já era válido** pelo slugger github (heading `### 3.1 Tabela \`entity_heads\``); mantido |

**Bônus (mesma classe, fora do relatório):** 5 âncoras corrigidas em `_moc.md` (o auditor oficial pula arquivos `_`).

Lista exaustiva arquivo→correção: aggregates.md:18, aresta.md:20, asset-consent.md:20, asset-role.md:12, changes.md:26(2×)/33/43/44, chave-de-epoca.md:20, ephemeral-messages.md:38–55 (8 links), fundador.md:34(2×)/44, genesis-state.md:32/48, hlc.md:20/46, imutabilidade-dupla.md:22/26, marketplace-customizacoes.md:40/41, mfa-s.md:34/35/43/47/48, mutates.md:16/20, no.md:22, peer-do-sistema.md:38(2×)/48, rede-corporativa-whitelabel.md:21/32(2×), rotacao-de-epocas.md:12, specification-network-birth.md:32/43, tier-aware-degradation.md:16/19/34.

---

## Bloco 1B — Incorporação da RFC-005 (itens pendentes do manifesto)

O manifesto `_absorcao-rcf-005.md` registrava 38 subtasks: 18 já estavam `[x]` no snapshot (verbetes novos, ADR-001, §3.3.1, §3.4, caderno-3/06 §5, etc.). As **16 pendentes** foram aplicadas:

| Resolução | Arquivo | Correção aplicada |
|:---|:---|:---|
| A.1 | caderno-2/02 | Novo **§3.1.1** (Época de Identidade vs. Épocas de Conteúdo + consequência `STALE_EPOCH`) |
| A.1 | caderno-2/02 §1.4.1 | `current_epoch_index` → `identity_epoch_index`; nota de que Épocas de Conteúdo nunca transitam no handshake |
| A.1 | rfc-transporte §2.2.1, §2.9 | Idem; carimbo do envelope assinado passa a `identity_epoch_index`; `STALE_EPOCH` exclusivo da identidade |
| A.2 | **caderno-2-protocol/05-wire-protocol.md (NOVO)** | Frame físico, tabela `FRAME_TYPE 0x01–0x0B`, ADR MessagePack>CBOR/FlatBuffers, evolução de versão, quarentena `retention_state=3`, vetor adversarial M9 |
| A.2 | rfc-transporte §2.1, §2.9 | Anotada referência normativa ao wire protocol |
| A.4 | rfc-transporte §3.2.5 | `GlobalThrottle` executa no contexto dono (SharedWorker/Líder Web Locks) |
| A.5 | caderno-2/02 §1.4 | Redefinido: **DevicePeerId** + **PersonaPeerId**, vínculo `DELEGATED_TO`, canal único multiplexado |
| A.5 | caderno-2/02 **§1.7 (NOVO)** | Cerimônia de Provisionamento QR + SAS (5 passos; mestra nunca atravessa o canal) |
| A.5 | rfc-transporte §2.2, §3.2.2 | Duas variantes no transporte; `SwarmRegistry` indexa por `DevicePeerId` + `device_personas` |
| A.5 | conceitos/peer-id.md | Reescrito (era placeholder Onda 2) — modo hub, duas variantes |
| A.6 | rfc-transporte §1.5 | Anotada capacidade modality-gated do Push Connector content-blind |
| A.8+A.9 | **caderno-3-sdk/07-chat-reference-spec.md (NOVO)** | Mensagem/DM sem contêiner/grupo `PROFILE:ORGANIZATION`/`PARTICIPATES_IN:GROUP:MEMBER`/`BELONGS_TO`/`conversation_id` canônicos/projeção `chat_conversations`/recibos efêmero+consolidação |
| A.8 | rfc-transporte §2.11 | Exemplo de enquadramento de recibos na matriz de transporte |
| A.12 | caderno-2/02 §3.3 | Removida menção a "envelopes por dispositivo" (passo 2); §3.3.1 passo 3 alinhado ao modelo direto |
| A.12 | caderno-2/02 **§3.3.2 (NOVO)** | Re-entrega via Key Vault de Rede: `requestEpochKey`, hot start, revogação em dois níveis, O(1), limite P2P puro, variante KEK + registro da Caixa de Revisão (descarte do `K_df`) |
| A.12 | caderno-3/02 **§1.5 (NOVO)** | "Key Vault de Rede — API `requestEpochKey`" — **o destino `caderno-3-sdk/04-key-vault.md` do manifesto não existe** (04 é theme-and-i18n); resolvido no caderno onde o Key Vault já vive (§1.2), documentado no manifesto |
| A.13 | **caderno-3-sdk/08-discovery-patterns.md (NOVO)** | Três padrões (Peer Propagation / Presence Announcement / Authoritative Directory), spec de referência do diretório pseudônimo (A.7 rebaixado), nota OPRF sem tarefa, limites honestos |

Manifesto atualizado: 16 subtasks marcadas `[x]` + nota de conclusão; `_status.md` registra RFC-005 como **Absorvida (2026-06-11)** — pronta para deleção conforme convenção do CLAUDE.md (mantida no pacote para sua conferência).

---

## Bloco 1C — Verbetes Órfãos: AMBOS RESOLVIDOS (mantidos e de-orfanizados)

**`[[mfa-s]]`** — *mantido*. Segue referenciado nos cadernos (caderno-3/03 §2.2 "AuditTrail"; roadmap caderno-4/01 Fase 2) e seu conteúdo **já descreve o modelo normativo da ADR-001** (`pending_changes` + sumário em `AUTHORED`), não o legado Y.js. Ações: wikilinks `[[mfa-s]]` adicionados em caderno-3/03, caderno-4/01 e `changes.md`; link quebrado para `backlog-geral` (ausente) redirecionado ao roadmap; 4 âncoras internas corrigidas (1A).

**`[[vfk]]`** — *mantido*. Conceito vivo e normativo (caderno-3/01 §2.1; rfc-v4 §225; mencionado textualmente em ulid/aresta/id/entity-id). Ações: wikilinks `[[vfk]]` adicionados em `ulid.md`, `aresta.md`, `id.md` e caderno-3/01 §2.1.

Auditoria pós-correção: **0 órfãos**.

---

## Bloco 1D — Plano de Implementação Atualizado (A.14)

**Observação:** o plano anexado (`plano-implementacao-transporte-discovery-sync-auth.md`) já é a versão pós-Y.js (nenhuma tarefa `crdt-manager`/`yjs_updates`/`pending_staging`/`CONTENT:AUDIT` existia — a remoção do legado já estava consumada nesta versão; nada a remover).

**Tarefas alteradas (10):**

| Tarefa | Alteração |
|:---|:---|
| T-105 | Ganha as duas variantes: `DevicePeerId` e `PersonaPeerId` |
| T-110 | Ganha a face de rede `requestEpochKey` (frames `KEY_REQUEST`/`KEY_RESPONSE`); `requestKey` permanece interna |
| T-201 | Wire format **fixado**: MessagePack + Length-Prefixed Framing (removido "CBOR ou flatbuffers — decidir em ADR"); `identity_epoch_index`; quarentena de versão futura |
| T-202 | Handshake com chave de dispositivo + `DevicePeerId` + `identity_epoch_index` |
| T-203 | Validação precoce opera sobre `identity_epoch_index` |
| T-205 | `SwarmRegistry` indexado por `DevicePeerId`; ganha tabela auxiliar `device_personas` |
| T-309 | Executa no contexto dono do banco (SharedWorker/Web Locks) |
| T-403 / T-602 | ADR-001 declarada como pré-requisito explícito |
| T-505 | Disponibilização via Key Vault de Rede (sem envelopes por dispositivo); pré-requisitos §A.10/§A.12; estendido com modo cooperativo + ata |
| T-507 | `STALE_EPOCH` refere-se exclusivamente à Época de Identidade |
| T-806 | Hook do Archive Cargo (T-313) na confirmação N≥3 da poda segura |
| S-02 | Parte multi-aba promovida de spike a seção de caderno (caderno-3/02 §1.4); resta só o benchmark de storage |

**Tarefas novas (4):**

- **T-312 · Eleição por Web Locks + crash-recovery** (M3 — §A.4)
- **T-313 · Archive Cargo — custódia cega** (M3; deps T-301/T-305 — §A.11)
- **T-705 · Cerimônia QR + SAS — pareamento de dispositivo** (M7; deps M1+M2 — §A.5)
- **T-706 · Documentação: padrões de descoberta** (M7 — §A.13; OPRF sem tarefa de implementação)

Itens M-MSG (A.6 push, A.8/A.9 chat) anotados como ciclo futuro — fora do escopo deste ciclo, conforme o próprio plano declara.

---

## Bloco 1E — Classificação dos Placeholders

Censo: **219 ocorrências · 38 slugs únicos** de alvos ausentes (os "147" do relatório original correspondem ao subconjunto KNOWN_PLACEHOLDERS do script ausente; a classificação abaixo cobre o universo completo por slug).

**Conflitavam com a RFC-005 — CORRIGIDOS (3 contextos):**

| Placeholder (arquivo:linha) | Conflita? | Ação |
|:---|:---|:---|
| `[[stale-epoch]]` em noise-xx.md:52 (contexto usava `current_epoch_index`) | **Sim** (A.1) | **Corrigido** — contexto agora usa `identity_epoch_index`; campos do handshake em noise-xx.md (linhas 29–30, 39) atualizados para `DevicePeerId` + Época de Identidade |
| Entrada noise-xx em _moc.md:37 | **Sim** (A.1/A.5) | **Corrigido** — `DevicePeerId` + `identity_epoch_index` |
| Entrada stale-epoch em _moc.md:50 ("nova chave de época") | **Sim** (A.1) | **Corrigido** — semântica exclusiva de Época de Identidade |

**Não conflitam — MANTER (35 slugs):** `automerge`, `pending-changes` (reafirmados pela ADR-001); `retention-state` (verbete futuro deve incluir `3=orphan` do A.2 — anotação registrada aqui); `delegacao-persona-corporativa` (distinto de delegação de dispositivo; §1.5 segue válido); `profile-organization` (reforçado pelo A.9); `stale-epoch` como verbete futuro (criar já com semântica A.1); demais — `active-edges`, `asset-balance-state`, `asset-reputation`, `audittrail-engine`, `bond-caucao`, `bootstrap-frio-absoluto`, `bootstrap-morno`, `credits`, `defesa-sybil`, `dht-descartada`, `fts5`, `link-multiaddr`, `local-first`, `minimalismo-ontologico`, `opfs`, `peer`, `peer-reputation-table`, `rede-p2p-pura`, `snapshot-de-bootstrap`, `sqlite-wasm`, `sucessao-por-quorum`, `tokens-css-hsl`, `transfers-aresta`, `webtorrent-blobs` — todos intactos pela RFC-005, válidos para ondas futuras. Os 4 slugs de lente (`vision`, `protocol`, `sdk`, `governance`, ~66 ocorrências) e os 4 `caderno-N-*` (~24) são **artefatos do template de verbete** (links de seção para as lentes), não verbetes futuros — manter até a Fase 3 de consolidação decidir convertê-los em links de caderno.

**Arquivar:** nenhum.

---

## Bloco 1F — Re-auditoria e Agents/Skills

**1F.1 — Resultado da auditoria pós-correção:**

```
AUDITORIA DO WIKI — 2026-06-11 (PÓS-CORREÇÃO)
════════════════════════════════════════════════
CRÍTICO — Links quebrados: 0   (era 50)
AVISO   — Verbetes órfãos:  0   (era 2)
INFO    — Placeholders intencionais: 219 ocorrências / 38 slugs (classificados em 1E)
```

**1F.2 — Auditor:** `auditor-wiki.md` não referencia seções/âncoras/conceitos renomeados — nenhuma atualização necessária. (O script determinístico `audit-links.mjs` não veio no snapshot; a lógica de verificação foi reconstruída e validada contra o relatório original.)

**1F.3 — Agents/Skills:** varredura completa por `MEMBER_OF`, `current_epoch_index`, `Y.js`, `crdt-manager`, `pending_staging`, `K_df`, `requestKdf` e âncoras antigas em `.claude/agents/` e `.claude/skills/`: **zero ocorrências** — já coerentes com a documentação.

---

## Bloco 1G — Descrição de Alto Nível da Arquitetura

A descrição imprecisa (Automerge como núcleo / "somente TinyBase acessa SQL") **não existe literalmente nos arquivos do snapshot** (provavelmente vivia em README/PDF não anexados). A versão corrigida fornecida no prompt foi instituída como documento canônico:

- **Criado `docs/visao-arquitetural.md`** — as 10 seções da versão corrigida (cinco camadas do núcleo; papel restrito do Automerge Repo; regra correta TinyBase/StoragePort; três categorias de tabela; imutabilidade dupla; quatro tipos de nó; autorização capability-based invertida; RBSR dirigido por UCAN; agente maestro-não-roteador; 12 vetores adversariais desde M0), com wikilinks para os verbetes canônicos.
- **caderno-1/01 §1** passou a apontar para `[[visao-arquitetural]]` como mapa técnico de alto nível.

---

## Bloco 2 — Checklist de Prontidão para RAG

| # | Item | Resposta |
|:--|:---|:---|
| 1 | Todos os 50 links quebrados foram corrigidos? | **Sim** (49 corrigidos + 1 falso positivo já válido; +5 bônus em `_moc.md`) |
| 2 | Todas as resoluções da RFC-005 Parte A foram incorporadas? | **Sim** (38/38 subtasks do manifesto: 18 pré-existentes + 16 aplicadas + 4 descartadas-por-legado conforme manifesto) |
| 3 | Os reflexos da Parte B na Parte A foram aplicados? | **Sim** — A.5 (passo 4 do QR como otimização, não obrigatório), A.7 (rebaixado a spec de referência no 08-discovery-patterns), A.10 (ata simplificada, 1 operação por escopo), Key Vault (`requestEpochKey`; chave trafega só dentro do Noise; modelo direto adotado conforme RFC v2 — *nota: a v2 substituiu o `K_df` do resumo por construção sólida*) |
| 4 | Os 2 verbetes órfãos foram resolvidos? | **Sim** (ambos mantidos e de-orfanizados com referências cruzadas) |
| 5 | O plano de implementação foi atualizado com as alterações da RFC-005? | **Sim** (12 tarefas alteradas, 4 novas; remoções Y.js já consumadas na versão anexada) |
| 6 | O auditor do wiki roda limpo (zero críticos)? | **Sim** (0 críticos, 0 órfãos) |
| 7 | A estrutura de metadados dos verbetes está consistente? | **Sim** — 124 verbetes, 124 com frontmatter (corrigido `custodia-cega-archive.md`, que estava sem); modos `canonical`(34)/`hub`(31) válidos; 58 sem campo `modo` são placeholders de onda futura/verbetes legados do template antigo — não bloqueia RAG, mas recomenda-se preencher `modo` na Fase 3; 19 `dependencias` apontam para verbetes de ondas futuras (intencional, = placeholders) |
| 8 | A nomenclatura está consistente? | **Sim** — `identity_epoch_index` (handshake/wire) vs `current_epoch_index` (épocas de conteúdo por escopo, ex. T-505) coexistem com clareza; `DevicePeerId`/`PersonaPeerId` refletidos em peer-id.md, caderno-2/02 e rfc-transporte; `MEMBER_OF` aparece apenas em notas históricas "substitui o abolido"; `PARTICIPATES_IN:GROUP:MEMBER` é a aresta vigente (07-chat-reference-spec); `K_df` aparece só na Caixa de Revisão da RFC (registro do descarte) — `requestEpochKey` é a API vigente; `blind_scope_id`/`archive_id` definidos em [[custodia-cega-archive]] + caderno-2/02 §3.4 (verbete próprio dispensável — conceitos internos do Archive Cargo) |
| 9 | As dependências entre marcos estão íntegras (sem ciclos)? | **Sim** — T-313→{T-301,T-305} intra-M3 (consumo por T-806/M8 ✓); T-705/T-706→{M1,M2} transitivos em M7 ✓; ADR-001→T-403/T-602 documental, sem aresta nova ✓; §A.12 (T-110/M1)→T-505 (M5) ✓; nota de verificação adicionada à tabela do plano |
| 10 | Os placeholders foram classificados? | **Sim** — 38 slugs: 3 contextos conflitantes **corrigidos**, 35 válidos **mantidos**, 0 arquivados (tabela no Bloco 1E) |

**Prontidão RAG: 10/10 Sim.** A documentação está apta ao modelo epochdb (tarefa → contexto mínimo apontando doc relevante): verbetes com fonte única, cadernos como lentes que linkam, zero links críticos quebrados, plano com tarefas atômicas referenciando seções normativas.

---

## Resumo Executivo

- **Links corrigidos:** 49 (+1 falso positivo validado, +5 bônus em `_moc.md`) = 0 críticos restantes
- **Novos documentos criados:** `caderno-2-protocol/05-wire-protocol.md` · `caderno-3-sdk/07-chat-reference-spec.md` · `caderno-3-sdk/08-discovery-patterns.md` · `docs/visao-arquitetural.md` · `docs/plano-de-implementacao.md` (plano incorporado ao repo)
- **Verbetes editados:** `peer-id` (reescrito), `chave-de-epoca`*, `rotacao-de-epocas`*, `content-message`* (*já editados no snapshot, conferidos), `noise-xx`, `mfa-s`, `vfk`-refs (`ulid`, `aresta`, `id`), `changes`, `custodia-cega-archive` (frontmatter), `_moc`, mais 20 verbetes com âncoras corrigidas (1A)
- **Verbetes criados:** nenhum novo nesta rodada (`epoca-de-identidade`, `delegacao-de-dispositivo`, `push-cego`, `custodia-cega-archive` já existiam no snapshot via absorção prévia)
- **Verbetes removidos/arquivados:** nenhum (mfa-s e vfk mantidos com justificativa)
- **Cadernos/RFCs editados:** caderno-2/02 (§1.4, §1.4.1, §1.7 novo, §3.1.1 novo, §3.3, §3.3.1, §3.3.2 novo), caderno-3/02 (§1.5 novo), caderno-3/03, caderno-3/01, caderno-4/01, caderno-1/01, rfc-transporte (§1.5, §2.1, §2.2, §2.2.1, §2.9, §2.11, §3.2.2, §3.2.5)
- **Tarefas do plano alteradas:** T-105, T-110, T-201, T-202, T-203, T-205, T-309, T-403, T-505, T-507, T-602, T-806, S-02
- **Tarefas novas no plano:** T-312 (Web Locks + crash-recovery), T-313 (Archive Cargo), T-705 (Cerimônia QR+SAS), T-706 (doc padrões de descoberta)
- **Tarefas removidas do plano:** nenhuma (legado Y.js já ausente da versão anexada do plano)
- **Agents/Skills atualizados:** nenhum necessário (varredura limpa)
- **Governança:** `_absorcao-rcf-005.md` 38/38 concluído; `_status.md` → RFC-005 Absorvida (pronta para deleção conforme CLAUDE.md)
- **Checklist RAG: 10/10 Sim**
