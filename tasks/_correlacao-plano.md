# Correlação Plano ↔ Tarefas ↔ Status

> **Propósito.** Este documento é a **fonte de verdade da correlação** entre o
> `docs/plano-de-implementacao.md` (intenção) e os arquivos `tasks/*.md` (execução). O
> `plano-de-implementacao.md` **não é** um espelho 1:1 dos arquivos — é um snapshot de intenção;
> divergências legítimas (tasks vindas de RFCs/backlog, ferramentaria MGTIA) são registradas aqui,
> não "corrigidas" forçando o plano a refletir tudo.
>
> **Gerado/auditado em:** 2026-06-19. O lado-arquivo (título/status) é regenerável a partir de
> `tasks/INDEX.md`; o casamento plano↔arquivo e a classe de divergência são curadoria humana.

## 0. Legenda de divergência

| Símbolo | Significado |
|---|---|
| ✅ | Arquivo existe e bate com o plano |
| 🟡 | Arquivo existe; título difere por **reescrita/elaboração** (sem divergência de escopo) |
| ❌ | Arquivo existe mas descreve **escopo diferente** do ID no plano — exige atenção |
| 🚨 | Plano define a task; **não há arquivo** (buraco a preencher) |
| ⚠️ | Arquivo existe e **não está no plano** (extra — ver §3 proveniência) |

---

## 1. Reconciliação de colisões de ID (RESOLVIDO 2026-06-19)

Quatro IDs tinham o arquivo apontando para um escopo diferente do plano. Em todos, **o arquivo
endurecido é o canônico** (tem conteúdo, subtasks e/ou dependentes); o **escopo órfão do plano foi
realocado** para um ID livre (a criar). Renumerar os arquivos cascataria em subtasks/dependentes.

| ID | Arquivo canônico (mantido) | Escopo órfão do plano | Realocado p/ | Obs. |
|---|---|---|---|---|
| **T-009** | Superfície de Controle e Telemetria (Headless) — subtasks T-009a/b; usada por T-901/T-903 | "Reset local do peer" (M0/E0.3) | **T-017** | criar spec do reset local |
| **T-011** | Incorporar @plataforma/design-system — bloqueia T-012–T-015 | "Runner de cenários" (`pnpm scenario`, M0/E0.3) | **T-018** | criar spec do runner |
| **T-701** | AES de Link / LinkCipher — subtasks T-701a/b | "device_state.db" (M7) | **T-707** | **revisar:** LinkCipher é redundante com cifra do Noise_XX (T-202)? |
| **T-905** | *(corrigido)* — conteúdo Chaos/Fuzzer movido p/ **T-904**; enumeração dos 12 vetores p/ **T-902** | "Documentação de integração + ADRs" (M9) | — | T-905 já restaurada ao escopo canônico |

Notas de reconciliação foram inseridas no topo de T-009, T-011, T-701 e T-905.

---

## 2. M9 — corrigido nesta passada

| ID | Plano | Arquivo | Estado |
|---|---|---|---|
| T-901 | PWA produto v0 (`apps/web`) | criado | ✅ (Cap-alvo: opus-spike/épico — ver Seção 6 da task) |
| T-902 | Suíte adversarial consolidada | criado (recebeu os 12 vetores §2.5) | ✅ |
| T-903 | Telemetria local + painel | criado | ✅ |
| T-904 | Caos programado | criado (recebeu o framework Chaos/Fuzzer) | ✅ |
| T-905 | Documentação de integração + ADRs | corrigido | ✅ |

---

## 3. Resumo quantitativo (285 tarefas indexadas)

- **Buracos (🚨) no core M1–M8:** **0** — as 52 specs (49 do core + órfãos T-017/T-018/T-707) foram criadas em `411193b` (2026-06-19) e o INDEX regenerado (285 tarefas). Dimensionamento real: **11 haiku + 41 sonnet**, zero decisões em aberto (Seções 6 limpas).
- **Órfãos de reconciliação:** T-017, T-018, T-707 — **resolvidos** (specs criadas).
- **Extras de produto fora do plano (⚠️):** T-CN-*, T-JU-*, T-PG-*, T-PL-* (~19). Proveniência: RFCs/backlog-modulos. Decisão pendente: absorver no plano ou manter como track de RFC (§5).
- **Extras de ferramentaria (⚠️, legítimos fora do plano):** T-012–T-016 (design-system) e T-1001–T-1027 (Nexus/MGTIA, **congelado**). Não são buracos — só segregados (§5).
- **Drift de título (🟡/❌ nos módulos):** maioria é reescrita/elaboração, sem divergência de escopo. Baixa prioridade.

---

## 4. Core M1–M8 — preenchido ✅ (histórico)

Todos os buracos do core foram preenchidos em `411193b` (2026-06-19). Estado por marco:

**M0 (órfãos):** ✅ T-017 Reset local · T-018 Runner de cenários
**M1 (cripto/dados):** ✅ T-109 · T-111
**M2 (transporte/swarm):** ✅ T-203 · T-206 · T-207 · T-209 · T-210
**M3 (sync/RBSR):** ✅ Completo · **M4 (WebRTC):** ✅ · **M5 (UCAN/chaves):** ✅
**M6 (intents/Zen):** ✅ · **M7 (multi-device/blobs):** ✅ (inc. T-707) · **M8 (mídia):** ✅

> Próximo backlog não-core: governança dos extras (§5) e drift de título (§3, baixa prioridade).

---

## 5. Extras (arquivo existe, fora do plano) — segregação por proveniência

**Ferramentaria / infra (legítimo fora do `plano-de-implementacao.md`):**
- `T-012`–`T-016` — design-system (incorporação + tema multi-nível). Track próprio (RFC-006).
- `T-1001`–`T-1027` — Nexus/MGTIA (a **ferramenta** de gestão; **congelada** — fora do build da raiz). Não pertence ao plano do produto.

**Produto fora do plano (decisão pendente — absorver no plano OU registrar como track de RFC):**
- `T-CN-01..04` — conectores externos (interface/pipeline/Classe D/persona).
- `T-JU-01..04` — jurisdição (cascata/composição/vigência/multi-jurisdição).
- `T-PG-01..05` — dialeto de página (schema/renderer/EXTENDS/forms/vetores).
- `T-PL-01..06` — plugins (SPEC:PLUGIN/sandbox browser/sandbox node/ComputePort/fila/vetores).

### Recomendação de governança (2026-06-19):

| Track | Origem | Recomendação | Ação |
|---|---|---|---|
| **T-CN** (conectores) | backlog-modulos.md, caderno-3-sdk/06-connectors.md | **Absorver no plano** — adicionar M10 "Conectores Externos" após M8. São pré-requisito de T-EML, T-ERP, T-LOG (já no backlog). O grafo de dependências exige que conectores venham antes dos módulos que os consomem. | Arquiteto: criar seção M10 no `plano-de-implementacao.md` com T-CN-01..04. |
| **T-JU** (jurisdição) | backlog-modulos.md, caderno-3-sdk/13-jurisdicao.md | **Absorver no plano** — adicionar M10/M11. Jurisdição é transversal (afeta T-CFR, T-ERP, T-MK). O caderno já está escrito. | Arquiteto: decidir se M10 ou seção dentro de M11 (fiscal). |
| **T-PG** (páginas) | backlog-modulos.md, caderno-3-sdk/11-linguagem-de-paginas.md | **Absorver no plano** — a linguagem de páginas é o runtime de renderização que T-OFF (suite office) e T-SHL (shell) consomem. Deve vir antes deles. | Arquiteto: criar seção M10 "Runtime de Páginas" com T-PG-01..05. |
| **T-PL** (plugins) | backlog-modulos.md, caderno-3-sdk/12-plugins-e-computacao.md | **Manter como track de RFC** — plugins são um subsistema autocontido com seu próprio ciclo de vida (manifesto, sandbox, ComputePort). Pode evoluir em paralelo ao core, consumindo as portas já definidas (T-004). Não bloqueia nenhum módulo core. | Arquiteto: registrar como RFC-007 "Plugin System" e manter tarefas como track independente. |

**Resumo:** 3 tracks (T-CN, T-JU, T-PG) recomendadas para absorção no plano como M10+; 1 track (T-PL) recomendada para track de RFC independente. As 19 tarefas existentes são preservadas — a decisão é só de governança (onde documentar, não o que deletar).

---

## 6. Matriz completa (plano ↔ arquivo)

> Linhas de M9 e colisões já refletem a correção de 2026-06-19.

| ID | Plano de Implementação | Arquivo (tasks/) | Conferem? |
| :--- | :--- | :--- | :--- |
| T-001 | Bootstrap do monorepo | Bootstrap do monorepo | ✅ |
| T-002 | CI | Pipeline de CI (GitHub Actions) | 🟡 |
| T-003 | Pacote testkit — relógio e random | Pacote testkit: Relógio e Random | 🟡 |
| T-004 | Portas fundamentais | Portas fundamentais | ✅ |
| T-005 | SimNetwork v1 | SimNetwork v1 | 🟡 |
| T-006 | SimNetwork v2 — degradação | SimNetwork v2 — Degradação e NAT | 🟡 |
| T-007 | Asserções de convergência | Asserções de convergência (Testkit) | 🟡 |
| T-008 | App bancada (Vite + React, PWA-ready) | App Bancada (PWA-ready) | 🟡 |
| **T-009** | Reset local do peer | Superfície de Controle e Telemetria (Headless) | ❌ → realocado: reset = **T-017** |
| T-010 | Peer do sistema v0 + admin | Peer do sistema v0 + admin | ✅ |
| **T-011** | Runner de cenários | Incorporar @plataforma/design-system | ❌ → realocado: runner = **T-018** |
| T-017 | Reset local do peer *(realocado de T-009)* | Reset local do peer | ✅ |
| T-018 | Runner de cenários *(realocado de T-011)* | Runner de cenários (pnpm scenario) | ✅ |
| T-012–T-016 | *(fora do plano)* | design-system | ⚠️ ferramentaria |
| T-1001–T-1027 | *(fora do plano)* | Nexus/MGTIA (congelado) | ⚠️ ferramentaria |
| T-101 | Wrappers cripto | Wrappers cripto | ✅ |
| T-102 | ULID + EntityId | ULID + EntityId | ✅ |
| T-103 | HLC completo | HLC (Hybrid Logical Clock) completo | 🟡 |
| T-104 | BIP39 + derivação + desbloqueio | BIP39 + Derivação de Chaves + Desbloqueio | 🟡 |
| T-105 | PeerId (duas variantes — RFC-005 §A.5) | PeerId e Multiaddr | 🟡 |
| T-106 | Migrations + schema nodes/edges | Schema SQLite local (nodes/edges) | 🟡 |
| T-107 | Assinatura universal Layer 1 | Assinatura Universal Layer 1 | ✅ |
| T-108 | Linhagem Layer 2 | Linhagem Layer 2 | ✅ |
| T-109 | Projeção entity_heads + tombstones | Projeção entity_heads + tombstones | ✅ |
| T-110 | Key Vault v0 | Key Vault v0 | 🟡 |
| T-111 | Bancada: aba Identidade | Bancada: aba Identidade | ✅ |
| T-201 | Wire format v1 (RFC-005 §A.2) | Wire format v1 | 🟡 |
| T-202 | Noise_XX sobre porta de transporte | Noise_XX sobre porta de transporte | ✅ |
| T-203 | Validação precoce de época | Validação precoce de época | ✅ |
| T-204 | Adapter WebSocket | Adapter WebSocket | ✅ |
| T-205 | SwarmRegistry em RAM | SwarmRegistry em RAM | ✅ |
| T-206 | Heartbeat implícito/explícito + evicção | Heartbeat implícito/explícito + evicção | ✅ |
| T-207 | RelayTrustModel v0 | RelayTrustModel v0 | ✅ |
| T-208 | First Peer Protocol | First Peer Protocol (FPP) | 🟡 |
| T-209 | Gênese gerida (peer do sistema) | Gênese gerida | ✅ |
| T-210 | Convite ASSET:INVITE — emissão e cerimônia | Convite ASSET:INVITE | ✅ |
| T-211 | Bancada: aba Rede | Bancada: aba Rede | ✅ |
| T-301 | B-Tree de fingerprints | B-Tree de fingerprints (RBSR) | 🟡 |
| T-302 | Protocolo de troca RBSR | Protocolo de troca RBSR | ✅ |
| T-303 | RangeFooter + rodada de desafio | RangeFooter + desafio | ✅ |
| T-304 | ConcurrentReconciliationGuard | ConcurrentReconciliationGuard | ✅ |
| T-305 | Sync dirigido por UCAN | Sync dirigido por UCAN | 🟡 |
| T-306 | Ondas 0–2 | Ondas 0–2 | ✅ |
| T-307 | Coordenação de sync + failover | Coordenação de sync + failover | ✅ |
| T-308 | Snapshot de bootstrap | Snapshot de bootstrap | ✅ |
| T-309 | GlobalThrottle | GlobalThrottle | ✅ |
| T-310 | Matriz de transporte (IoC) | Matriz de transporte IoC | ✅ |
| T-311 | Bancada: aba Sync | Bancada: aba Sync | ✅ |
| T-312 | Eleição de dono do banco (Web Locks, RFC-005 §A.4) | Eleição de dono do banco por Web Locks | ✅ |
| T-313 | Archive Cargo — custódia cega (RFC-005 §A.11) | Archive Cargo | ✅ |
| T-401 | Signaling no peer do sistema | Signaling no peer do sistema | ✅ |
| T-402 | Adapter WebRTC DataChannel | Adapter WebRTC DataChannel | ✅ |
| T-403 | Documentos casca (Automerge Repo) | Documentos casca Automerge | ✅ |
| T-404 | ConnectionPromotionEngine | ConnectionPromotionEngine (Hole Punching) | 🟡 |
| T-405 | Relay de circuito | Relay de circuito | ✅ |
| T-406 | Descoberta morna (Graph-Based Routing v0) | Descoberta morna Graph Routing | ✅ |
| T-407 | Link multiaddr out-of-band | Link multiaddr out-of-band | ✅ |
| T-408 | Tracker WSS privado (peer do sistema) | Tracker WSS privado | ✅ |
| T-409 | Bancada: topologia | Bancada: topologia | ✅ |
| T-501 | UCAN core | Motor de UCAN Core | 🟡 |
| T-502 | ASSET:PERMISSION/ASSET:ROLE físicos | ASSET:PERMISSION/ROLE físicos | ✅ |
| T-503 | Validação de consentimento single-pass | Consentimento single-pass | ✅ |
| T-504 | Revogação + revogação por cortesia | Revogação + cortesia | ✅ |
| T-505 | Rotação de épocas | Rotação de Épocas (Forward Secrecy) | 🟡 |
| T-506 | Predicado de bloqueio na liberação | Predicado de bloqueio na liberação | ✅ |
| T-507 | STALE_EPOCH no transporte | STALE_EPOCH no transporte | ✅ |
| T-508 | Conector SMTP | Conector SMTP | ✅ |
| T-509 | Central Custody (corporativo) | Central Custody | ✅ |
| T-510 | Shamir 2-de-3 | Shamir 2-de-3 | ✅ |
| T-511 | Modelo soberano | Modelo soberano | ✅ |
| T-512 | Bancada: aba Auth | Bancada: aba Auth | ✅ |
| T-601 | Detecção estrutural de fork + merge | Detecção Estrutural de Fork e Merge | 🟡 |
| T-602 | Ciclo de commit Automerge | Ciclo de commit Automerge | ✅ |
| T-603 | Committer determinístico (colapso v4) | Committer determinístico | ✅ |
| T-604 | Zen Engine embarcado + invariante T1 | Zen Engine Embarcado + Invariante T1 | ✅ |
| T-605 | Fluxo de intent não-comutativo | Fluxo intent não-comutativo | ✅ |
| T-606 | Congelamento escopado por linhagem | Congelamento escopado | ✅ |
| T-607 | Política de serialização em SPEC | Política de serialização em SPEC | ✅ |
| T-608 | Bancada: aba Dados | Bancada: aba Dados | ✅ |
| **T-701** | device_state.db | AES de Link (LinkCipher) | ❌ → realocado: device_state = **T-707** |
| T-702 | Canal do Private Swarm | Canal do Private Swarm | ✅ |
| T-703 | Estratégias de merge por classe | Estratégias de merge por classe | ✅ |
| T-704 | Bancada: simulador de segundo device | Bancada: simulador 2º device | ✅ |
| T-705 | Cerimônia QR + SAS (RFC-005 §A.5) | Cerimônia QR + SAS | ✅ |
| T-706 | Documentação: padrões de descoberta (RFC-005 §A.13) | Documentação padrões descoberta | ✅ |
| T-707 | device_state.db *(realocado de T-701)* | device_state.db | ✅ |
| T-801 | Chunking + cifra por chunk | Storage Engine de BLOBs (Chunking) | 🟡 |
| T-802 | Manifesto, renditions e fontes | Manifesto, renditions e fontes | ✅ |
| T-803 | Adapter WebTorrent (browser) | Adapter WebTorrent | ✅ |
| T-804 | Cloud WebSeed + Edge translation | Cloud WebSeed + Edge translation | ✅ |
| T-805 | Pipeline de reidratação no browser | Reidratação no browser | ✅ |
| T-806 | Onda 3 + G4 v0 | Onda 3 + G4 v0 | ✅ |
| T-807 | Bancada: aba Mídia | Bancada: aba Mídia | ✅ |
| T-901 | PWA produto v0 (apps/web) | PWA produto v0 (criado) | ✅ |
| T-902 | Suíte adversarial consolidada | Suíte adversarial consolidada (criado) | ✅ |
| T-903 | Telemetria local + painel | Telemetria local + painel (criado) | ✅ |
| T-904 | Caos programado | Caos programado / Chaos-Fuzzer (criado) | ✅ |
| T-905 | Documentação de integração + ADRs | Documentação de integração + ADRs (corrigido) | ✅ |

> **Módulos de produto** (T-AD, T-CAL, T-CFR, T-EML, T-ERP, T-IA, T-LOG, T-MAP, T-MK, T-MOD,
> T-MSG, T-OFF, T-SHL, T-SOC, T-STR, T-UI, T-WF, T-DS): todos **têm arquivo**; divergências são
> 🟡/❌ de reescrita de título, sem buraco de escopo. Tratados em lote (baixa prioridade) — ver §3.
> **Tracks de produto fora do plano** (T-CN, T-JU, T-PG, T-PL): ⚠️ — decisão de absorção em §5.
