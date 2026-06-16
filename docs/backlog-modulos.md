# Backlog de Implementação de Módulos

> Consolidado em 2026-06-15 a partir de `docs/rfcs/diff-preparativos-plano.md` (96 tarefas)
> e do histórico Git (commits `9276975`, `3306175`) — Spikes de arquitetura pendentes.
> **As RFCs serão deletadas após absorção; este backlog é a fonte remanescente.**

---

## Spikes de Arquitetura

*Itens extraídos dos reviews (commit `3306175`) e da auditoria de consistência (`9276975:_consistencia.md`) marcados como `REVISAR-HUMANO` — exigem decisão arquitetural antes de implementar. Capacidade-alvo: `opus-spike`.*

### Colisões de Numeração (bloqueiam absorção)

| id | tema | severidade | descrição |
|:---|:---|:---|:---|
| **O-01** | Colisão slot 09 do caderno-3 | **alta** | `caderno-3-sdk/09-hierarchical-theme-customization.md` já existe. rfc-006 quer criar `09-design-system.md`. Toda a cadeia de numeração (rfc-006→027) herda esse deslocamento. Decidir: design-system como 10 (desloca +1) ou incorporar/mover o hierarchical-theme. |
| **O-02** | Colisão slot 22 do caderno-3 | **alta** | rfc-021 (Mapa) e rfc-022 (Workflow) reivindicam ambos `caderno-3-sdk/22-…`. Resolver junto com O-01 num mapa único de numeração. |

### Lacunas de Protocolo/Produto

| id | tema | severidade | descrição |
|:---|:---|:---|:---|
| **L-01** | Ressurreição de deadline P2P | **alta** | Rfc-022 usa "Deadline HLC" para timers de workflow, mas não define como um timer é recuperado se o peer orquestrador cai. Especificar publicação durável/distribuída do deadline e quem assume na queda. Bloqueia confiabilidade da engine de workflow (pré-requisito de checkout, cobrança, fulfillment). |
| **L-02** | k-anonimato na segmentação | **alta** | Rfc-015 proíbe ler plaintext restrito mas não impõe coorte mínimo — campanha entregue a 1 pessoa de-anonimiza o alvo. Definir invariante de coorte mínimo (k-anonymity) e o valor de `N` (global, por classe de sinal, ou por superfície). |
| **L-03** | MoR + hard-stop legal | **alta** | Rfc-009: (a) âncoras de papel não cobrem Merchant of Record (plataforma como intermediária fiscal em marketplace). (b) Degradação silenciosa para "fato-negativo" mesmo onde a lei exige bloqueio rígido (ex.: sem NF-e não se expede). Prever papel MoR e modo hard-stop (predicado de bloqueio rígido). |

### Decisões de Ontologia de Grafo

| id | origem | descrição |
|:---|:---|:---|
| **006-06** | triagem rfc-006 | Aresta nova `HAS_THEME` ligando `CONTENT:THEME` a `PROFILE` (org/usuário). Cria tipo de aresta não previsto no canônico de grafo. |
| **006-07** | triagem rfc-006 | Versionamento de tema por `SUPERSEDED_BY`: edição gera novo nó, preservando reprodutibilidade. Interage com canônico de supersessão. |
| **007-03** | triagem rfc-007 | Semântica CRDT (LWW + Vector Clocks) para disputas de espelho Classe D. **Contradiz** A.4.5 (conflito resolvido pela SPEC do domínio, nunca pelo conector). |
| **021-10** | triagem rfc-021 | Aresta `LOCATED_AT` ligando Perfil/Evento/Empresa à coordenada. Contradiz tese "zero tipo de nó novo" da RFC. |
| **024-15** | triagem rfc-024 | UIs pesadas/iframe como "filhos temporários da árvore virtual da SPEC:PAGE". Aresta persistida vs. montagem efêmera de runtime. |
| **025-09** | triagem rfc-025 | Aresta nova `INCLUDES` (mídia do Media Plane → SPEC:PAGE). Tensão com "zero tipo de nó novo". |
| **027-04** | triagem rfc-027 | Aresta `DELEGATES_TO` (Mestre→Módulo). Toca ontologia de grafo; já existe `DELEGATED_TO`. |

### Decisões de Mecânica/Protocolo

| id | origem | descrição |
|:---|:---|:---|
| **008-02** | triagem rfc-008 | Notação ZEN `$doc.title` para reagir a mutations do CRDT (sessão-doc/Automerge). Introduzir terceiro namespace de fonte (`$doc`) vs. modelar sessão-doc como `source` ordinária. |
| **009-01** | triagem rfc-009 | Âncora Merchant-of-Record (MoR): papéis declaráveis vs. enumerados. Supera o conjunto fechado de âncoras de A.5.1. |
| **009-02** | triagem rfc-009 | Hard Stop Workflow: modo de regra "blocking" que trava transição quando fato é legalmente bloqueante (vs. degradação silenciosa). |
| **014-04** | triagem rfc-014 | Conector nativo de assinatura por Hard Token (A1/A3, PkiBrazil/Smartcard) para Contador assinar SPED/ECD. Encaixe nas classes de conector (RFC-007) e key-vault. |
| **018-03** | triagem rfc-018 | E2E em grupos grandes: limiar (~50 membros) onde E2E passa para Sender Keys/Group Ratchets. Decisão de protocolo/cripto transversal (caderno-3/07 + camada de transporte). |
| **023-01** | triagem rfc-023 | IA Julgadora Neutra (compute RAG) para disputa de escrow. Força vinculante e relação com apelo humano em aberto. |
| **023-02** | triagem rfc-023 | Wave-picking com Zen sobre bins; depósito como subtipo `SPEC:PLACE` com roteirização interna. **Contradiz** A.1.2 ("bin é atributo do inventário, não tipo novo"). |
| **027-01** | triagem rfc-027 | Derivação de sub-chaves do Usuário-Pai (Keychain) sem aprovação interativa. Contradiz delegação por aresta escopada de [[delegacao-de-dispositivo]]. |

---

## Tarefas P0 e P1

> **Nota sobre numeração de caderno-3:** as referências abaixo usam os paths **pretendidos** conforme a ordem de absorção. As colisões O-01 (slot 09) e O-02 (slot 22) estão pendentes de decisão humana — ver seção Spikes acima. Paths a partir do slot 22 podem deslocar após resolução.

### P0 — Transversais (fundação; bloqueiam os produtos)

#### P0.1 — Design System · DoD UI da Bancada / Protocolo-core
Origem: [[caderno-3-sdk/10-design-system]] *(slot 09 — ver Spike O-01)*

- **T-DS-01** importar pacote de tokens + build multi-plataforma (Style Dictionary).
- **T-DS-02** importar schema de metadados AI-ready + CI.
- **T-DS-03** portar componentes-piloto para `core/design-system` consumindo tokens semânticos.
- **T-DS-04** lint anti-literal (invariante I3).

#### P0.2 — Conectores Externos · DoD Cloud
Origem: [[caderno-3-sdk/06-connectors]]

- **T-CN-01** interface `ExternalConnector` + registro + health/quotas no system-peer.
- **T-CN-02** pipeline de tradução com idempotência por `external_ref` + testes de reentrega.
- **T-CN-03** esqueleto Classe D (cursor, polling/webhook, supressão de eco) com provedor fake.
- **T-CN-04** persona agente-de-sistema por conector com `ASSET:ROLE` escopado + vetor (afirmar fora do escopo → rejeição).

#### P0.3 — Plugins & Computação · DoD Protocolo-core / Cloud
Origem: [[caderno-3-sdk/12-plugins-e-computacao]]

- **T-PL-01** `SPEC:PLUGIN` + manifesto + verificação de assinatura/listagem no loader.
- **T-PL-02** sandbox browser (Worker/WASM, sem autoridade ambiente) + bridge de componente.
- **T-PL-03** sandbox node (processo/isolate, capacidades por `ASSET:ROLE`).
- **T-PL-04** `ComputePort` + escalonador com anúncio de runtime via `serves` + casamento de site.
- **T-PL-05** fila assíncrona (task=nó, claim por `ASSET:LOCK`, resultado assinado, idempotência).
- **T-PL-06** vetores: bundle não-listado, plugin com rede fora das portas, classe restrita→`external`, dois workers/uma task.

#### P0.4 — Linguagem de Páginas · DoD Protocolo-core
Origem: [[caderno-3-sdk/11-linguagem-de-paginas]]

- **T-PG-01** schema JSON do dialeto v1 + validador estático (lib isomórfica).
- **T-PG-02** renderizador React sobre o catálogo (resolve `sources`, avalia ZEN sob orçamento, render progressivo).
- **T-PG-03** mecanismo `EXTENDS`/override por id estável + testes de precedência.
- **T-PG-04** sub-dialeto de formulários sobre dataschema de SPEC.
- **T-PG-05** vetores: componente fora do catálogo, expressão estourando orçamento, intent acima do privilégio, árvore acima dos limites.

#### P0.5 — Jurisdição · DoD Protocolo-core
Origem: [[caderno-3-sdk/13-jurisdicao]]

- **T-JU-01** resolução de jurisdição efetiva (cascata) + registro no fato + testes de precedência.
- **T-JU-02** composição base+variante por `EXTENDS` + validação "variante não contradiz invariante" + degradação para base.
- **T-JU-03** seleção por vigência na competência + recálculo retroativo + vetor (regra errada nunca aplicada).
- **T-JU-04** resolução multi-jurisdição por âncora de papel (origem/destino/prestação/titular) + provisão dupla + vetor cross-border.

#### P0.6 — IA, RAG & Agentes · DoD Protocolo-core
Origem: [[caderno-3-sdk/14-ia-rag-e-agentes]]

- **T-IA-01** projeção `vector_index` (sqlite-vec/WASM) + embedding no pipeline pós-decifra (irmã do FTS).
- **T-IA-02** capacidades `compute` de embedding e LLM como plugins (on-device + conector external).
- **T-IA-03** recuperação híbrida RRF (FTS+vetor+traversal) com filtro de permissão + bypass escalar.
- **T-IA-04** persona de agente com `ASSET:ROLE` delegado + geração de `SPEC:PAGE` validada.
- **T-IA-05** classificação de intenção da command palette (busca/ação/geração) + render progressivo.
- **T-IA-06** vetores: agente acima do escopo, recuperação furando bloqueio, embedding restrito→external, fato superado, palette acima do privilégio.

#### P0.7 — Workflow · DoD Protocolo-core
Origem: [[caderno-3-sdk/24-workflow-reference-spec]] *(slot 15 assumindo renumeração pós O-01; ver também Spike O-02)*

- **T-WF-01** formato `SPEC:WORKFLOW` Nível 1 + validador + envelope (guardas Zen, ações intent, orçamento).
- **T-WF-02** interpretador Nível 1 (estado único, transição evento+guarda, entry/exit, timers HLC) event-sourced.
- **T-WF-03** integração com saga/TTL (compensação) e tarefa humana (`APPROVED_BY`).
- **T-WF-04** geração Mermaid + read view na suíte office.
- **T-WF-05** vetores: guarda fora do registro, ação acima do privilégio, estado nunca mutável-replicado, orçamento estourado aborta. *(Nível 2 = marco futuro condicionado.)*

#### P0.8 — Plugins de Frontend · DoD Protocolo-core
Origem: [[caderno-3-sdk/26-plugins-frontend]]

- **T-UI-01** categoria `ui` no modelo de plugins + manifesto (props/intents/capacidades) — estende T-PL-01.
- **T-UI-02** host de sandbox (iframe + Worker/OffscreenCanvas, bridge postMessage, orçamento, brokering).
- **T-UI-03** componente rico `GameEngine` (2D/3D) data-driven com pontos ZEN + emissão de intent.
- **T-UI-04** tier estrito de validação + vetores (DOM externo/rede não declarada, intent acima do privilégio, orçamento estourado suspende).

#### P0.9 — Módulos como Profiles · DoD Protocolo-core
Origem: [[caderno-4-governance/02b-modulos-profiles-mensageria]]

- **T-MOD-01** profile de módulo + mensageria de comando (intent durável endereçado + sinal efêmero).
- **T-MOD-02** delegado por (usuário × módulo) escopado por `ASSET:ROLE` + operações cross-user com permissão do próprio usuário.
- **T-MOD-03** sessão como doc Automerge efêmero local-first + opt-in de persistência + profile como co-editor.
- **T-MOD-04** vetores: delegado lendo dado de outro usuário, comando acima do privilégio, sessão efêmera sem opt-in, agregação cross-user só pública.

#### P0.10 — Shell & Composição · DoD UI da Bancada
Origem: [[caderno-3-sdk/18-shell-composicao]]

- **T-SHL-01** shell FlexLayout + `SPEC:WORKSPACE` (default + salvos nomeados) + painel binda (módulo+página+params).
- **T-SHL-02** restrições de layout no manifesto + gerenciador determinístico (recência+pinos) + pilha de colapsados.### P1 — Produtos

#### P1.1 — Marketplace + Fintech · DoD Protocolo-core
Origem: [[caderno-3-sdk/15-marketplace-reference-spec]]

- **T-MK-01** SPECs base `PRODUCT`/`PRODUCT_LISTING` + classes de liquidação.
- **T-MK-02** anti-oversell por linhagem + vetor de corrida (uma unidade → uma finaliza).
- **T-MK-03** motor de saga Tier 1 (`ASSET:LOCK`, `ttl_policy`, compensação) + Tier 2 opcional, estado efêmero.
- **T-MK-04** `SPENDS`/`CREDITS` com split multi-destino + comissão/imposto por SPEC + multi-moeda (saldo por moeda, câmbio por oráculo).
- **T-MK-05** SPECs `instrumento_financeiro` (cessão/aporte/garantia) com `APPROVED_BY`, `LASTRO`, `recourse`, régua de cobrança.
- **T-MK-06** vetores: oversell multi-emissor, saga com perna externa falha, lance perdedor, cupom reusado.

#### P1.2 — ERP/CRM · DoD Protocolo-core
Origem: [[caderno-3-sdk/16-erp-crm-reference-spec]]

- **T-ERP-01** SPECs `SALES_ORDER`/`PURCHASE_ORDER` + ciclo como `SPEC:WORKFLOW`.
- **T-ERP-02** estoque multi-depósito + custeio como projeção + reserva por `ASSET:LOCK`.
- **T-ERP-03** contas a pagar/receber + conciliação por `external_ref`.
- **T-ERP-04** CRM (pipeline workflow, visão 360 por traversal, régua Zen).
- **T-ERP-05** projeções analíticas incrementais + teste de custo (volume).

#### P1.3 — Contábil/Fiscal/RH · DoD Protocolo-core
Origem: [[caderno-3-sdk/17-contabil-fiscal-rh-reference-spec]]

- **T-CFR-01** plano de contas como SPEC + mapeamento fato→conta por Zen jurisdicional.
- **T-CFR-02** apuração fiscal por competência + provisão em `BALANCE_STATE` + arquivo SPED como projeção.
- **T-CFR-03** persona contador (`ASSET:ROLE` escopado lendo subgrafo do cliente) + exportações formais.
- **T-CFR-04** RH: colaborador/vínculo/eventos + folha derivada jurisdicional + provisão e lançamentos.
- **T-CFR-05** vetores: recálculo retroativo da época, fechamento imutável, jurisdição ausente degrada, conector fiscal ausente.

#### P1.4 — Mapa · DoD Cloud
Origem: [[caderno-3-sdk/23-mapa-reference-spec]] *(slot 22 — ver Spike O-02)*

- **T-MAP-01** `SPEC:PLACE` + consulta sobre `geo_index` + render `GeoSpatial`.
- **T-MAP-02** conector Classe E (geocoding/places/rotas) com cache TTL + proveniência + flag cacheável.
- **T-MAP-03** consumo cross-módulo + localização como dado sensível/efêmero + vetores.

#### P1.5 — Logística · DoD Protocolo-core
Origem: [[caderno-3-sdk/25-logistica-reference-spec]]

- **T-LOG-01** WMS: operações de armazém como `SPEC:WORKFLOW` + endereçamento + inventário cíclico.
- **T-LOG-02** fulfillment: alocação multi-depósito por Zen + reserva por `LOCK` + ciclo com compensação.
- **T-LOG-03** transporte externo: conector de transportadora (cotação/etiqueta/rastreio) idempotente.
- **T-LOG-04** operação interna: dispatch-saga, entregador como listing, localização efêmera, surge por Zen, repasse por SPEC.
- **T-LOG-05** logística reversa + prova de entrega/disputa (escrow) + reentrada de estoque + vetores.

#### P1.6 — Mensagens · DoD Protocolo-core
Origem: [[caderno-3-sdk/20-mensagens-reference-spec]]

- **T-MSG-01** envoltório sobre o chat existente + integração com DM social.
- **T-MSG-02** chamadas/conferência via LiveKit (SDK embutido + SFU plugin) + gravação consolidada.
- **T-MSG-03** presença efêmera não-replicada + vetores.

#### P1.7 — Social · DoD Protocolo-core
Origem: [[caderno-3-sdk/18-social-reference-spec]]

- **T-SOC-01** SPECs de perfil/post/story + arestas sociais + visibilidade pública/privada.
- **T-SOC-02** feed via `SuperCard`/`Layout` + ranking Zen + RRF + slot de anúncio.
- **T-SOC-03** vetores: privacidade retroativa e bloqueio como limites, story expirado, contadores como projeção.

#### P1.8 — Streaming · DoD Cloud
Origem: [[caderno-3-sdk/19-streaming-reference-spec]]

- **T-STR-01** SPECs de conteúdo/canal/coleção + reprodução adaptativa sobre o media plane.
- **T-STR-02** renditions como utilitário `compute` assíncrono + irmãos `CONTENT`.
- **T-STR-03** live via LiveKit (SDK embutido + SFU plugin) + consolidação → `CONTENT:FILE`.
- **T-STR-04** monetização (assinatura/PPV/ads/tip) + repasse por SPEC + vetor sem-seeder.

#### P1.9 — Anúncios · DoD Protocolo-core
Origem: [[caderno-3-sdk/29-anuncios-reference-spec]]

- **T-AD-01** `SPEC:AD`/`AD_CAMPAIGN` + `RELATES:AD:PROMOTES` + orçamento/pacing por `BALANCE_STATE`/`LOCK`.
- **T-AD-02** seleção por superfície (Zen) no contexto do espectador + medição assinada de evento.
- **T-AD-03** vetores: segmentação lendo dado restrito, verba estourada, clique inflado.

#### P1.10 — Email · DoD Cloud
Origem: [[caderno-3-sdk/21-email-reference-spec]]

- **T-EML-01** conector Classe D (IMAP/SMTP, cursor, polling/IDLE) — depende de T-CN-03.
- **T-EML-02** espelho `SPEC:EMAIL` idempotente por Message-ID + threading + anexos + envio como saga com supressão de eco.
- **T-EML-03** vetores: reentrega→no-op, envio falho não marca "enviado", eco suprimido.

#### P1.11 — Calendário · DoD Protocolo-core
Origem: [[caderno-3-sdk/22-calendario-reference-spec]]

- **T-CAL-01** `SPEC:EVENT` + recorrência RRULE com instâncias virtuais + override de exceção.
- **T-CAL-02** convites/RSVP + capacidade por `reserva_capacidade` + render `Timeline`.
- **T-CAL-03** sync externo Classe D + `.ics` por email + vetores.

#### P1.12 — Suíte Office · DoD Protocolo-core / UI da Bancada
Origem: [[caderno-3-sdk/27-suite-office]]

- **T-OFF-01** perfis de capacidade no motor de páginas + validador por perfil (emenda spec de páginas).
- **T-OFF-02** doc perfil `documento` (blocos, Automerge, backlinks) + markdown simples.
- **T-OFF-03** planilha first-party (motor de fórmulas + ZEN) + base como view estruturada/sobre-planilha.
- **T-OFF-04** apresentação perfil `slide` + export PDF/PPTX.
- **T-OFF-05** editores de mídia (imagem/vídeo/áudio) como componente/`ui` plugin + IA via `compute`.

---

## Contagem

- **Spikes de arquitetura:** 23 itens (5 de severidade alta, demais de ontologia/mecânica)
- **P0 (transversais):** 10 grupos, 46 tasks
- **P1 (produtos):** 12 grupos, 50 tasks
- **Total de tasks de implementação:** ~96
