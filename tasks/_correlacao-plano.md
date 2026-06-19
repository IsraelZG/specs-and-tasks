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

## 3. Resumo quantitativo (233 arquivos)

- **Buracos (🚨) no core M1–M8:** ~49 tasks de protocolo definidas no plano sem arquivo. **Maior risco** — várias são dependência de tasks já endurecidas (ex.: T-902 depende de T-303/T-401/T-506/T-507/T-605/T-210, todas faltando). Lista em §4.
- **Órfãos de reconciliação (a criar):** T-017, T-018, T-707.
- **Extras de produto fora do plano (⚠️):** T-CN-*, T-JU-*, T-PG-*, T-PL-* (~19). Proveniência: RFCs/backlog-modulos. Decisão pendente: absorver no plano ou manter como track de RFC (§5).
- **Extras de ferramentaria (⚠️, legítimos fora do plano):** T-012–T-016 (design-system) e T-1001–T-1027 (Nexus/MGTIA, **congelado**). Não são buracos — só segregados (§5).
- **Drift de título (🟡/❌ nos módulos):** maioria é reescrita/elaboração, sem divergência de escopo. Baixa prioridade.

---

## 4. Buracos a preencher — core M1–M8 (entrada para `/endurecer-fila`)

Ordem sugerida = ordem de dependência (M1→M8), priorizando o que destrava tasks já endurecidas.

**M1 (cripto/dados):** T-109 Projeção `entity_heads` + tombstones · T-111 Bancada: aba Identidade
**M2 (transporte/swarm):** T-203 Validação precoce de época · T-206 Heartbeat + evicção · T-207 RelayTrustModel v0 · T-209 Gênese gerida · T-210 Convite `ASSET:INVITE`
**M3 (sync/RBSR):** T-303 RangeFooter + desafio · T-304 ConcurrentReconciliationGuard · T-306 Ondas 0–2 · T-307 Coordenação de sync + failover · T-309 GlobalThrottle · T-310 Matriz de transporte (IoC) · T-312 Eleição de dono do banco (Web Locks, RFC-005 §A.4) · T-313 Archive Cargo (RFC-005 §A.11)
**M4 (WebRTC/descoberta):** T-401 Signaling no peer do sistema · T-403 Documentos casca (Automerge Repo) · T-405 Relay de circuito · T-406 Descoberta morna (Graph Routing v0) · T-407 Link multiaddr out-of-band · T-408 Tracker WSS privado · T-409 Bancada: topologia
**M5 (UCAN/chaves):** T-502 `ASSET:PERMISSION`/`ROLE` físicos · T-503 Consentimento single-pass · T-504 Revogação + cortesia · T-506 Predicado de bloqueio na liberação · T-507 STALE_EPOCH no transporte · T-508 Conector SMTP · T-509 Central Custody · T-510 Shamir 2-de-3 · T-511 Modelo soberano · T-512 Bancada: aba Auth
**M6 (intents/Zen):** T-602 Ciclo de commit Automerge · T-603 Committer determinístico (colapso v4) · T-605 Fluxo de intent não-comutativo · T-606 Congelamento escopado por linhagem · T-607 Política de serialização em SPEC · T-608 Bancada: aba Dados
**M7 (multi-device/blobs):** T-702 Canal do Private Swarm · T-703 Estratégias de merge por classe · T-704 Bancada: simulador de 2º device · T-705 Cerimônia QR + SAS (RFC-005 §A.5) · T-706 Doc: padrões de descoberta (RFC-005 §A.13)
**M8 (mídia):** T-802 Manifesto/renditions/fontes · T-803 Adapter WebTorrent · T-804 Cloud WebSeed + Edge translation · T-805 Reidratação no browser · T-806 Onda 3 + G4 v0 · T-807 Bancada: aba Mídia

**+ órfãos de reconciliação:** T-017 Reset local do peer (M0) · T-018 Runner de cenários (M0) · T-707 `device_state.db` (M7).

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
| T-017 | Reset local do peer *(realocado de T-009)* | *a criar* | 🚨 |
| T-018 | Runner de cenários *(realocado de T-011)* | *a criar* | 🚨 |
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
| T-109 | Projeção entity_heads + tombstones | *INEXISTENTE* | 🚨 |
| T-110 | Key Vault v0 | Key Vault v0 | 🟡 |
| T-111 | Bancada: aba Identidade | *INEXISTENTE* | 🚨 |
| T-201 | Wire format v1 (RFC-005 §A.2) | Wire format v1 | 🟡 |
| T-202 | Noise_XX sobre porta de transporte | Noise_XX sobre porta de transporte | ✅ |
| T-203 | Validação precoce de época | *INEXISTENTE* | 🚨 |
| T-204 | Adapter WebSocket | Adapter WebSocket | ✅ |
| T-205 | SwarmRegistry em RAM | SwarmRegistry em RAM | ✅ |
| T-206 | Heartbeat implícito/explícito + evicção | *INEXISTENTE* | 🚨 |
| T-207 | RelayTrustModel v0 | *INEXISTENTE* | 🚨 |
| T-208 | First Peer Protocol | First Peer Protocol (FPP) | 🟡 |
| T-209 | Gênese gerida (peer do sistema) | *INEXISTENTE* | 🚨 |
| T-210 | Convite ASSET:INVITE — emissão e cerimônia | *INEXISTENTE* | 🚨 |
| T-211 | Bancada: aba Rede | Bancada: aba Rede | ✅ |
| T-301 | B-Tree de fingerprints | B-Tree de fingerprints (RBSR) | 🟡 |
| T-302 | Protocolo de troca RBSR | Protocolo de troca RBSR | ✅ |
| T-303 | RangeFooter + rodada de desafio | *INEXISTENTE* | 🚨 |
| T-304 | ConcurrentReconciliationGuard | *INEXISTENTE* | 🚨 |
| T-305 | Sync dirigido por UCAN | Sync dirigido por UCAN | 🟡 |
| T-306 | Ondas 0–2 | *INEXISTENTE* | 🚨 |
| T-307 | Coordenação de sync + failover | *INEXISTENTE* | 🚨 |
| T-308 | Snapshot de bootstrap | Snapshot de bootstrap | ✅ |
| T-309 | GlobalThrottle | *INEXISTENTE* | 🚨 |
| T-310 | Matriz de transporte (IoC) | *INEXISTENTE* | 🚨 |
| T-311 | Bancada: aba Sync | Bancada: aba Sync | ✅ |
| T-312 | Eleição de dono do banco (Web Locks, RFC-005 §A.4) | *INEXISTENTE* | 🚨 |
| T-313 | Archive Cargo — custódia cega (RFC-005 §A.11) | *INEXISTENTE* | 🚨 |
| T-401 | Signaling no peer do sistema | *INEXISTENTE* | 🚨 |
| T-402 | Adapter WebRTC DataChannel | Adapter WebRTC DataChannel | ✅ |
| T-403 | Documentos casca (Automerge Repo) | *INEXISTENTE* | 🚨 |
| T-404 | ConnectionPromotionEngine | ConnectionPromotionEngine (Hole Punching) | 🟡 |
| T-405 | Relay de circuito | *INEXISTENTE* | 🚨 |
| T-406 | Descoberta morna (Graph-Based Routing v0) | *INEXISTENTE* | 🚨 |
| T-407 | Link multiaddr out-of-band | *INEXISTENTE* | 🚨 |
| T-408 | Tracker WSS privado (peer do sistema) | *INEXISTENTE* | 🚨 |
| T-409 | Bancada: topologia | *INEXISTENTE* | 🚨 |
| T-501 | UCAN core | Motor de UCAN Core | 🟡 |
| T-502 | ASSET:PERMISSION/ASSET:ROLE físicos | *INEXISTENTE* | 🚨 |
| T-503 | Validação de consentimento single-pass | *INEXISTENTE* | 🚨 |
| T-504 | Revogação + revogação por cortesia | *INEXISTENTE* | 🚨 |
| T-505 | Rotação de épocas | Rotação de Épocas (Forward Secrecy) | 🟡 |
| T-506 | Predicado de bloqueio na liberação | *INEXISTENTE* | 🚨 |
| T-507 | STALE_EPOCH no transporte | *INEXISTENTE* | 🚨 |
| T-508 | Conector SMTP | *INEXISTENTE* | 🚨 |
| T-509 | Central Custody (corporativo) | *INEXISTENTE* | 🚨 |
| T-510 | Shamir 2-de-3 | *INEXISTENTE* | 🚨 |
| T-511 | Modelo soberano | *INEXISTENTE* | 🚨 |
| T-512 | Bancada: aba Auth | *INEXISTENTE* | 🚨 |
| T-601 | Detecção estrutural de fork + merge | Detecção Estrutural de Fork e Merge | 🟡 |
| T-602 | Ciclo de commit Automerge | *INEXISTENTE* | 🚨 |
| T-603 | Committer determinístico (colapso v4) | *INEXISTENTE* | 🚨 |
| T-604 | Zen Engine embarcado + invariante T1 | Zen Engine Embarcado + Invariante T1 | ✅ |
| T-605 | Fluxo de intent não-comutativo | *INEXISTENTE* | 🚨 |
| T-606 | Congelamento escopado por linhagem | *INEXISTENTE* | 🚨 |
| T-607 | Política de serialização em SPEC | *INEXISTENTE* | 🚨 |
| T-608 | Bancada: aba Dados | *INEXISTENTE* | 🚨 |
| **T-701** | device_state.db | AES de Link (LinkCipher) | ❌ → realocado: device_state = **T-707** |
| T-702 | Canal do Private Swarm | *INEXISTENTE* | 🚨 |
| T-703 | Estratégias de merge por classe | *INEXISTENTE* | 🚨 |
| T-704 | Bancada: simulador de segundo device | *INEXISTENTE* | 🚨 |
| T-705 | Cerimônia QR + SAS (RFC-005 §A.5) | *INEXISTENTE* | 🚨 |
| T-706 | Documentação: padrões de descoberta (RFC-005 §A.13) | *INEXISTENTE* | 🚨 |
| T-707 | device_state.db *(realocado de T-701)* | *a criar* | 🚨 |
| T-801 | Chunking + cifra por chunk | Storage Engine de BLOBs (Chunking) | 🟡 |
| T-802 | Manifesto, renditions e fontes | *INEXISTENTE* | 🚨 |
| T-803 | Adapter WebTorrent (browser) | *INEXISTENTE* | 🚨 |
| T-804 | Cloud WebSeed + Edge translation | *INEXISTENTE* | 🚨 |
| T-805 | Pipeline de reidratação no browser | *INEXISTENTE* | 🚨 |
| T-806 | Onda 3 + G4 v0 | *INEXISTENTE* | 🚨 |
| T-807 | Bancada: aba Mídia | *INEXISTENTE* | 🚨 |
| T-901 | PWA produto v0 (apps/web) | PWA produto v0 (criado) | ✅ |
| T-902 | Suíte adversarial consolidada | Suíte adversarial consolidada (criado) | ✅ |
| T-903 | Telemetria local + painel | Telemetria local + painel (criado) | ✅ |
| T-904 | Caos programado | Caos programado / Chaos-Fuzzer (criado) | ✅ |
| T-905 | Documentação de integração + ADRs | Documentação de integração + ADRs (corrigido) | ✅ |

> **Módulos de produto** (T-AD, T-CAL, T-CFR, T-EML, T-ERP, T-IA, T-LOG, T-MAP, T-MK, T-MOD,
> T-MSG, T-OFF, T-SHL, T-SOC, T-STR, T-UI, T-WF, T-DS): todos **têm arquivo**; divergências são
> 🟡/❌ de reescrita de título, sem buraco de escopo. Tratados em lote (baixa prioridade) — ver §3.
> **Tracks de produto fora do plano** (T-CN, T-JU, T-PG, T-PL): ⚠️ — decisão de absorção em §5.
