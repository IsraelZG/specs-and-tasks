# Triagem — rfc-027 (Módulos como Profiles e Mensageria Inter-Módulo)

**Fonte:** `docs/rfcs/rfc-027-modulos-profiles-mensageria.md` + `docs/rfc_reviews/review_rfc-027.md`

## Contagens por veredito

| veredito | nº |
| :--- | :--- |
| INCORPORAR | 3 |
| JA-COBERTO | 2 |
| UI->INVENTARIO | 7 |
| REJEITAR | 0 |
| REVISAR-HUMANO | 2 |
| **Σ achados** | **14** |

## ⚠ REVISAR-HUMANO (decisão arquitetural pendente)

- **027-01 — Derivação de sub-chaves do Usuário-Pai (Keychain) sem aprovação interativa.**
  O review pede que a Keychain "rotacione ou derive sub-chaves do Usuário-Pai" para que cada
  delegado assine sem exigir aprovação na UI. Isto colide com o modelo canônico de delegação:
  `delegacao-de-dispositivo.md` e a RFC-011 A.5 delegam por **aresta assinada com escopo
  `ASSET:PERMISSION`/`ASSET:ROLE`** — o delegado NÃO importa nem deriva a chave mestra
  (`chave-mestra-ed25519.md`). Introduzir derivação HD de sub-chaves é mecânica criptográfica
  nova de keychain, transversal à `caderno-2-protocol/02-cryptographic-lineage-and-auth.md`.
  Decidir: assinatura de delegado via aresta `DELEGATES_TO`/`DELEGATED_TO` escopada (canônico)
  vs. derivação de sub-chaves. NÃO redigir norma sem decisão humana.

- **027-04 — `DELEGATES_TO` como aresta de confiança Mestre→Módulo (review §4).**
  A RFC declara "**Zero tipo de nó novo**" e modela o profile-delegado por `ASSET:ROLE`. O review
  propõe a aresta nova `DELEGATES_TO` (pai→módulo) + "intentions assinadas vinculadas ao perfil
  delegado". Já existe `DELEGATED_TO` (device→persona) no canônico. Há tensão: criar/reusar aresta
  de delegação módulo-profile toca a ontologia de grafo e a tese "zero nó novo" da própria RFC.
  Requer decisão sobre reuso de `DELEGATED_TO` vs. aresta nova. Descrita, não normatizada.

## Tabela de triagem

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 027-01 | §2 — Explosão combinatória: Keychain deve derivar/rotacionar **sub-chaves do Usuário-Pai** para assinar sem aprovação interativa constante | REVISAR-HUMANO | `caderno-2-protocol/02-cryptographic-lineage-and-auth.md` (transversal) | Mecânica de keychain nova; contradiz delegação por aresta escopada (sem derivar chave mestra) de `delegacao-de-dispositivo.md` / RFC-011 A.5. Ver bloco em destaque. | [x] |
| 027-02 | §2 — Explosão de N delegados afeta o **payload de sincronização inicial** | INCORPORAR | A.5 (Limites honestos) — novo item | "Cada (usuário × módulo) instancia um delegado; com muitos módulos ativos o conjunto de delegados pesa no payload de sincronização inicial da conta. É custo aceito da compartimentação (cf. A.5.2), mitigável por instanciação preguiçosa: o delegado nasce só quando o usuário ativa/entra no módulo (sob demanda), não antecipadamente." | [ ] |
| 027-03 | §2 — Audit trail deve diferenciar **"João clicou" vs. "Delegado CRM do João agiu por régua"** | INCORPORAR | A.2 (Mensagem de comando) — novo item | "Todo comando durável (`CONTENT:INTENT`) registra o **autor efetivo da ação**: a persona do usuário (ação direta) ou o profile-delegado do módulo agindo por regra/automação. A linhagem/audit trail expõe essa distinção de forma cristalina, garantindo atribuição inequívoca para compliance (RH/Fisco). Ação por delegado nunca é apresentada como ação direta do usuário." | [ ] |
| 027-04 | §4 — Aresta nova `DELEGATES_TO` (Mestre→Módulo) + intents assinadas vinculadas ao delegado | REVISAR-HUMANO | `caderno-2-protocol/01-graph-ontology.md` | Toca ontologia de grafo e a tese "zero nó novo" da RFC; já existe `DELEGATED_TO`. Ver bloco em destaque. | [x] |
| 027-05 | §2 — Sinal efêmero de coordenação precisa de **Registry padronizado** (evitar RPC/iframe esotérico não documentado) | INCORPORAR | A.2 (Mensagem de comando) — novo item | "Os comandos efêmeros (focar painel, abrir aba, destacar item) trafegam por um **registry padronizado de sinais de coordenação de UI**: cada sinal tem tipo e contrato declarados, validados pelo módulo receptor. Coordenação lateral fora do registry (hacks ad-hoc entre iframes) é proibida — sem contrato declarado, o sinal é ignorado." | [ ] |
| 027-06 | §3 layout — Indicador Universal de Modo-Agente ("Sombra do Profile Delegado" com animação ao agir em doc aberto) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Organism `AgentModeIndicator` ("sombra" do delegado ativa durante ação assistida em doc aberto) — módulo: Shell/transversal | [ ] |
| 027-07 | §3 layout — Central de Permissões: página com todos delegados vivos, papéis `ASSET:ROLE` e revogação | UI->INVENTARIO | `inventario-componentes-layouts.md` | Organism `DelegatePermissionCenter` (lista delegados vivos + `ASSET:ROLE` + revogação) — módulo: Settings/transversal | [ ] |
| 027-08 | §3 atom — `BotCursorIndicator` | UI->INVENTARIO | `inventario-componentes-layouts.md` | Atom `BotCursorIndicator` — módulo: Shell/transversal | [ ] |
| 027-09 | §3 atom — `SystemMessageChip` | UI->INVENTARIO | `inventario-componentes-layouts.md` | Atom `SystemMessageChip` — módulo: Shell/transversal | [ ] |
| 027-10 | §3 atom — `ScopeRevokeButton` | UI->INVENTARIO | `inventario-componentes-layouts.md` | Atom `ScopeRevokeButton` — módulo: Settings/transversal | [ ] |
| 027-11 | §3 molecule — `ModuleActivityLog` (o que o módulo fez por você na última hora) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Molecule `ModuleActivityLog` — módulo: transversal | [ ] |
| 027-12 | §3 organism — `CrossModulePermissionModal` (autorização OAuth-like ao módulo novo pedir acesso/delegação) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Organism `CrossModulePermissionModal` (consentimento estilo OAuth para nova delegação cross-módulo) — módulo: transversal | [ ] |
| 027-13 | §5 — Ciclo de vida do delegado: nascimento ao ativar módulo; ampliação de `ASSET:ROLE` via `SUPERSEDED_BY` na aceitação; revogação por tombstone ao desativar, sem alterar legalidade das ações passadas | JA-COBERTO | — | RFC A.3.1 (delegado por usuário×módulo escopado por `ASSET:ROLE`) + A.3.4 (delegação revogável e escopada, espelha RFC-011 A.5). Revogação revogável-e-escopada já é tese central; mutação por `SUPERSEDED_BY`/append-only é regra de protocolo vigente, não norma nova da RFC. | [x] |
| 027-14 | §5 — Operações cross-user (busca/feed/ranking) e agregação limitada ao público | JA-COBERTO | — | RFC A.3.2 já normatiza: operações cross-user rodam com a permissão de leitura do próprio usuário; agregação cross-user limitada ao público. | [x] |

---

**Notas de confirmação (Grep na RFC):**
- A.2 menciona sinal efêmero, mas **não** define registry padronizado → 027-05 ausente, INCORPORAR.
- A.2/audit: "fato auditável" e assinatura pela persona existem, mas **não** há diferenciação visual/atribuição usuário-vs-delegado → 027-03 ausente, INCORPORAR.
- A.5 lista custo de orquestração de muitos delegados, mas **não** o impacto no payload de sync nem mitigação preguiçosa → 027-02 ausente, INCORPORAR.
- Keychain/derivação de chave: ausente na RFC; modelo canônico delega por aresta escopada sem importar/derivar a mestra → 027-01 REVISAR-HUMANO.
