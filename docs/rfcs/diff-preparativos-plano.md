# Diff consolidado — Preparativos de Módulos
> **Aplicar em:** `docs/plano-de-implementacao.md`, como nova faixa **"Preparativos de Módulos"** após o ciclo atual (M0–M9). São as tarefas de fundação que cada RFC declarou em seu bloco "Preparativos no plano", consolidadas e ordenadas pela [ordem de absorção](ordem-de-absorcao.md). Cada task = 1 PR, spec-first, com o DoD indicado (perfis §0.2: Protocolo/core, Cloud, UI da Bancada). Vetores adversariais (§0.1.7) são parte do DoD de cada grupo.

---

## P0 — Transversais (fundação; bloqueiam os produtos)

### P0.1 — Design System (RFC-006) · DoD UI da Bancada / Protocolo-core
- **T-DS-01** importar pacote de tokens + build multi-plataforma (Style Dictionary).
- **T-DS-02** importar schema de metadados AI-ready + índice + CI.
- **T-DS-03** portar componentes-piloto para `core/design-system` consumindo tokens semânticos.
- **T-DS-04** lint anti-literal (invariante I3).

### P0.2 — Conectores Externos (RFC-007) · DoD Cloud
- **T-CN-01** interface `ExternalConnector` + registro + health/quotas no system-peer.
- **T-CN-02** pipeline de tradução com idempotência por `external_ref` + testes de reentrega.
- **T-CN-03** esqueleto Classe D (cursor, polling/webhook, supressão de eco) com provedor fake.
- **T-CN-04** persona agente-de-sistema por conector com `ASSET:ROLE` escopado + vetor (afirmar fora do escopo → rejeição).

### P0.3 — Plugins & Computação (RFC-010) · DoD Protocolo-core / Cloud
- **T-PL-01** `SPEC:PLUGIN` + manifesto + verificação de assinatura/listagem no loader.
- **T-PL-02** sandbox browser (Worker/WASM, sem autoridade ambiente) + bridge de componente.
- **T-PL-03** sandbox node (processo/isolate, capacidades por `ASSET:ROLE`).
- **T-PL-04** `ComputePort` + escalonador com anúncio de runtime via `serves` + casamento de site.
- **T-PL-05** fila assíncrona (task=nó, claim por `ASSET:LOCK`, resultado assinado, idempotência).
- **T-PL-06** vetores: bundle não-listado, plugin com rede fora das portas, classe restrita→`external`, dois workers/uma task.

### P0.4 — Linguagem de Páginas (RFC-008) · DoD Protocolo-core
- **T-PG-01** schema JSON do dialeto v1 + validador estático (lib isomórfica).
- **T-PG-02** renderizador React sobre o catálogo (resolve `sources`, avalia ZEN sob orçamento, render progressivo).
- **T-PG-03** mecanismo `EXTENDS`/override por id estável + testes de precedência.
- **T-PG-04** sub-dialeto de formulários sobre dataschema de SPEC.
- **T-PG-05** vetores: componente fora do catálogo, expressão estourando orçamento, intent acima do privilégio, árvore acima dos limites.

### P0.5 — Jurisdição (RFC-009) · DoD Protocolo-core
- **T-JU-01** resolução de jurisdição efetiva (cascata) + registro no fato + testes de precedência.
- **T-JU-02** composição base+variante por `EXTENDS` + validação "variante não contradiz invariante" + degradação para base.
- **T-JU-03** seleção por vigência na competência + recálculo retroativo + vetor (regra errada nunca aplicada).
- **T-JU-04** resolução multi-jurisdição por âncora de papel (origem/destino/prestação/titular) + provisão dupla + vetor cross-border.

### P0.6 — IA, RAG & Agentes (RFC-011) · DoD Protocolo-core
- **T-IA-01** projeção `vector_index` (sqlite-vec/WASM) + embedding no pipeline pós-decifra (irmã do FTS).
- **T-IA-02** capacidades `compute` de embedding e LLM como plugins (on-device + conector external).
- **T-IA-03** recuperação híbrida RRF (FTS+vetor+traversal) com filtro de permissão + bypass escalar.
- **T-IA-04** persona de agente com `ASSET:ROLE` delegado + geração de `SPEC:PAGE` validada.
- **T-IA-05** classificação de intenção da command palette (busca/ação/geração) + render progressivo.
- **T-IA-06** vetores: agente acima do escopo, recuperação furando bloqueio, embedding restrito→external, fato superado, palette acima do privilégio.

### P0.7 — Workflow (RFC-022) · DoD Protocolo-core
- **T-WF-01** formato `SPEC:WORKFLOW` Nível 1 + validador + envelope (guardas Zen, ações intent, orçamento).
- **T-WF-02** interpretador Nível 1 (estado único, transição evento+guarda, entry/exit, timers HLC) event-sourced.
- **T-WF-03** integração com saga/TTL (compensação) e tarefa humana (`APPROVED_BY`).
- **T-WF-04** geração Mermaid + read view na suíte office.
- **T-WF-05** vetores: guarda fora do registro, ação acima do privilégio, estado nunca mutável-replicado, orçamento estourado aborta. *(Nível 2 = marco futuro condicionado.)*

### P0.8 — Plugins de Frontend (RFC-024) · DoD Protocolo-core
- **T-UI-01** categoria `ui` no modelo de plugins + manifesto (props/intents/capacidades) — estende T-PL-01.
- **T-UI-02** host de sandbox (iframe + Worker/OffscreenCanvas, bridge postMessage, orçamento, brokering).
- **T-UI-03** componente rico `GameEngine` (2D/3D) data-driven com pontos ZEN + emissão de intent.
- **T-UI-04** tier estrito de validação + vetores (DOM externo/rede não declarada, intent acima do privilégio, orçamento estourado suspende).

### P0.9 — Módulos como Profiles (RFC-027) · DoD Protocolo-core
- **T-MOD-01** profile de módulo + mensageria de comando (intent durável endereçado + sinal efêmero).
- **T-MOD-02** delegado por (usuário × módulo) escopado por `ASSET:ROLE` + operações cross-user com permissão do próprio usuário.
- **T-MOD-03** sessão como doc Automerge efêmero local-first + opt-in de persistência + profile como co-editor.
- **T-MOD-04** vetores: delegado lendo dado de outro usuário, comando acima do privilégio, sessão efêmera sem opt-in, agregação cross-user só pública.

### P0.10 — Shell & Composição (RFC-026) · DoD UI da Bancada
- **T-SHL-01** shell FlexLayout + `SPEC:WORKSPACE` (default + salvos nomeados) + painel binda (módulo+página+params).
- **T-SHL-02** restrições de layout no manifesto + gerenciador determinístico (recência+pinos) + pilha de colapsados.
- **T-SHL-03** responsividade contínua (multi-coluna ↔ mobile) + chrome-como-módulo (menu reposicionado).
- **T-SHL-04** drag/share como mensagem de comando (RFC-027) + contrato de aceite + falha controlada; rota + deep-link.
- **T-SHL-05** camada de overlay + command palette (superfície) + ciclo de vida de painel (suspensão).

---

## P1 — Produtos

### P1.1 — Marketplace + Fintech (RFC-012) · DoD Protocolo-core
- **T-MK-01** SPECs base `PRODUCT`/`PRODUCT_LISTING` + classes de liquidação.
- **T-MK-02** anti-oversell por linhagem + vetor de corrida (uma unidade → uma finaliza).
- **T-MK-03** motor de saga Tier 1 (`ASSET:LOCK`, `ttl_policy`, compensação) + Tier 2 opcional, estado efêmero.
- **T-MK-04** `SPENDS`/`CREDITS` com split multi-destino + comissão/imposto por SPEC + multi-moeda (saldo por moeda, câmbio por oráculo).
- **T-MK-05** SPECs `instrumento_financeiro` (cessão/aporte/garantia) com `APPROVED_BY`, `LASTRO`, `recourse`, régua de cobrança.
- **T-MK-06** vetores: oversell multi-emissor, saga com perna externa falha, lance perdedor, cupom reusado.

### P1.2 — ERP/CRM (RFC-013) · DoD Protocolo-core
- **T-ERP-01** SPECs `SALES_ORDER`/`PURCHASE_ORDER` + ciclo como `SPEC:WORKFLOW`.
- **T-ERP-02** estoque multi-depósito + custeio como projeção + reserva por `ASSET:LOCK`.
- **T-ERP-03** contas a pagar/receber + conciliação por `external_ref`.
- **T-ERP-04** CRM (pipeline workflow, visão 360 por traversal, régua Zen).
- **T-ERP-05** projeções analíticas incrementais + teste de custo (volume).

### P1.3 — Contábil/Fiscal/RH (RFC-014) · DoD Protocolo-core
- **T-CFR-01** plano de contas como SPEC + mapeamento fato→conta por Zen jurisdicional.
- **T-CFR-02** apuração fiscal por competência + provisão em `BALANCE_STATE` + arquivo SPED como projeção.
- **T-CFR-03** persona contador (`ASSET:ROLE` escopado lendo subgrafo do cliente) + exportações formais.
- **T-CFR-04** RH: colaborador/vínculo/eventos + folha derivada jurisdicional + provisão e lançamentos.
- **T-CFR-05** vetores: recálculo retroativo da época, fechamento imutável, jurisdição ausente degrada, conector fiscal ausente.

### P1.4 — Mapa (RFC-021) · DoD Cloud
- **T-MAP-01** `SPEC:PLACE` + consulta sobre `geo_index` + render `GeoSpatial`.
- **T-MAP-02** conector Classe E (geocoding/places/rotas) com cache TTL + proveniência + flag cacheável.
- **T-MAP-03** consumo cross-módulo + localização como dado sensível/efêmero + vetores.

### P1.5 — Logística (RFC-023) · DoD Protocolo-core
- **T-LOG-01** WMS: operações de armazém como `SPEC:WORKFLOW` + endereçamento + inventário cíclico.
- **T-LOG-02** fulfillment: alocação multi-depósito por Zen + reserva por `LOCK` + ciclo com compensação.
- **T-LOG-03** transporte externo: conector de transportadora (cotação/etiqueta/rastreio) idempotente.
- **T-LOG-04** operação interna: dispatch-saga, entregador como listing, localização efêmera, surge por Zen, repasse por SPEC.
- **T-LOG-05** logística reversa + prova de entrega/disputa (escrow) + reentrada de estoque + vetores.

### P1.6 — Mensagens (RFC-018) · DoD Protocolo-core
- **T-MSG-01** envoltório sobre o chat existente + integração com DM social.
- **T-MSG-02** chamadas/conferência via LiveKit (SDK embutido + SFU plugin) + gravação consolidada.
- **T-MSG-03** presença efêmera não-replicada + vetores.

### P1.7 — Social (RFC-016) · DoD Protocolo-core
- **T-SOC-01** SPECs de perfil/post/story + arestas sociais + visibilidade pública/privada.
- **T-SOC-02** feed via `SuperCard`/`Layout` + ranking Zen + RRF + slot de anúncio.
- **T-SOC-03** vetores: privacidade retroativa e bloqueio como limites, story expirado, contadores como projeção.

### P1.8 — Streaming (RFC-017) · DoD Cloud
- **T-STR-01** SPECs de conteúdo/canal/coleção + reprodução adaptativa sobre o media plane.
- **T-STR-02** renditions como utilitário `compute` assíncrono + irmãos `CONTENT`.
- **T-STR-03** live via LiveKit (SDK embutido + SFU plugin) + consolidação → `CONTENT:FILE`.
- **T-STR-04** monetização (assinatura/PPV/ads/tip) + repasse por SPEC + vetor sem-seeder.

### P1.9 — Anúncios (RFC-015) · DoD Protocolo-core
- **T-AD-01** `SPEC:AD`/`AD_CAMPAIGN` + `RELATES:AD:PROMOTES` + orçamento/pacing por `BALANCE_STATE`/`LOCK`.
- **T-AD-02** seleção por superfície (Zen) no contexto do espectador + medição assinada de evento.
- **T-AD-03** vetores: segmentação lendo dado restrito, verba estourada, clique inflado.

### P1.10 — Email (RFC-019) · DoD Cloud
- **T-EML-01** conector Classe D (IMAP/SMTP, cursor, polling/IDLE) — depende de T-CN-03.
- **T-EML-02** espelho `SPEC:EMAIL` idempotente por Message-ID + threading + anexos + envio como saga com supressão de eco.
- **T-EML-03** vetores: reentrega→no-op, envio falho não marca "enviado", eco suprimido.

### P1.11 — Calendário (RFC-020) · DoD Protocolo-core
- **T-CAL-01** `SPEC:EVENT` + recorrência RRULE com instâncias virtuais + override de exceção.
- **T-CAL-02** convites/RSVP + capacidade por `reserva_capacidade` + render `Timeline`.
- **T-CAL-03** sync externo Classe D + `.ics` por email + vetores.

### P1.12 — Suíte Office (RFC-025) · DoD Protocolo-core / UI da Bancada
- **T-OFF-01** perfis de capacidade no motor de páginas + validador por perfil (emenda RFC-008).
- **T-OFF-02** doc perfil `documento` (blocos, Automerge, backlinks) + markdown simples.
- **T-OFF-03** planilha first-party (motor de fórmulas + ZEN) + base como view estruturada/sobre-planilha.
- **T-OFF-04** apresentação perfil `slide` + export PDF/PPTX.
- **T-OFF-05** editores de mídia (imagem/vídeo/áudio) como componente/`ui` plugin + IA via `compute`.

---

## Contagem
- **P0 (transversais):** 10 grupos, ~46 tasks.
- **P1 (produtos):** 12 grupos, ~50 tasks.
- **Total:** ~96 tasks atômicas de preparativos, além do ciclo M0–M9 já existente.
