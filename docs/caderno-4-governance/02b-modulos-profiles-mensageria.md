# 02b-modulos-profiles-mensageria.md — Módulos como Profiles e Mensageria Inter-Módulo

> Fonte: RFC-027 (absorvida e deletada). Emenda `caderno-4/02` (módulo = lente + ator + profile). Zero tipo de nó novo.

---

## §1 — Dois planos ortogonais

1. **Plano de dados — lente (inalterado):** módulos compartilham nós; integração é projeção, não API. O produto anunciado **é o mesmo nó** que o anúncio referencia; zero sync, zero API entre módulos (reafirma RFC-012 A.9 / RFC-013 A.1).
2. **Plano de comando — ator (novo):** o módulo ganha um `PROFILE` e recebe **mensagens** que interpreta para agir. "Mover item entre módulos" (produto → vira anúncio; email → vira evento) é **mensagem endereçada ao profile do módulo**. Como intent já é mensagem, isto é apenas endereçá-la a um módulo.
3. Os planos são ortogonais e não conflitam: o item movido é dado compartilhado (lente); a ordem de movê-lo é comando (mensagem). Integração permanece zero-API nos dois — dados por compartilhamento, comandos por mensageria uniforme.

---

## §2 — Mensagem de comando: durável vs. efêmera

1. **Comando durável** (precisa ser fato auditável: "criar anúncio a partir deste produto") = `CONTENT:INTENT` endereçado ao profile do módulo, no grafo, validado pelo pipeline normal e assinado pela persona do usuário.
2. **Comando efêmero** (coordenação transiente de UI: focar painel, abrir aba, destacar item) = sinal efêmero não-durável (como presença, RFC-018 A.4) — nunca nó append-only.
3. O módulo receptor interpreta a mensagem com sua própria lógica (workflow/handlers, RFC-022). A mensagem nunca executa código no remetente; ela **propõe** uma ação que o receptor valida e realiza.
4. **Autor efetivo no audit trail.** Todo comando durável (`CONTENT:INTENT`) registra o **autor efetivo da ação**: a persona do usuário (ação direta) ou o profile-delegado do módulo agindo por regra/automação. A linhagem/audit trail expõe essa distinção de forma cristalina, garantindo atribuição inequívoca para compliance (RH/Fisco). Ação por delegado nunca é apresentada como ação direta do usuário.
5. **Registry de sinais de coordenação.** Os comandos efêmeros (item 2) trafegam por um **registry padronizado de sinais de coordenação de UI**: cada sinal tem tipo e contrato declarados, validados pelo módulo receptor. Coordenação lateral fora do registry (hacks ad-hoc entre iframes) é proibida — sem contrato declarado, o sinal é ignorado.

---

## §3 — Profiles de sistema compartimentados (por usuário × módulo)

1. **Não existe profile de sistema global com acesso cross-user.** Cada par **(usuário × módulo)** instancia um **profile-delegado** próprio, escopado por `ASSET:ROLE` à fatia daquele usuário naquele módulo. Quando o módulo "age por você", é o *seu* delegado — que só enxerga os *seus* dados daquele módulo. Compartimentação por construção; o perigo de misturar dados de usuários num profile gordo é eliminado.
2. **Operações inerentemente cross-user** (busca, feed, ranking, seleção de anúncio) **rodam com as permissões de leitura do próprio usuário** — só dado público + o próprio. Nenhum profile privilegiado lê dado privado de terceiros. Agregação cross-user é limitada ao que é público.
3. **Conectores de operador (RFC-007)** seguem o mesmo princípio: persona escopada ao que processam (RFC-007 A.2.2), nunca acesso amplo implícito.
4. **Modalidade gerenciada:** um operador *pode* declarar profiles de serviço com acesso mais amplo (índice global, moderação) — mas **declarado e auditado** ([[modalidade-de-rede]]), nunca implícito; P2P puro não os tem. Espelha a delegação revogável e escopada do agente de IA (RFC-011 A.5).

---

## §4 — Sessão como doc colaborativo (onde há edição)

1. Uma seção **editorial/estatal** de módulo (compor, configurar, IA-assistir) é modelada como **doc colaborativo Automerge, local-first e efêmero por padrão**; compartilhar/persistir é **opt-in** (como convidar para um Live Share). Isso respeita a regra de que estado de sessão não é nó mutável replicado (saga/workflow): o doc vive no store local e só sincroniza por escolha.
2. O **profile do módulo participa como co-editor** (peer Automerge): suas "edições" são intents — a persona-agente (RFC-011) propõe, o usuário aceita/edita. IA-assistência vira co-edição natural.
3. **Sessão de leitura pura** (rolar feed, ver dashboard) **não** é doc colaborativo — é página sobre projeção, sem custo de CRDT. O modelo-doc aplica-se só onde há edição.

---

## §5 — Limites honestos

1. O plano de comando não dá god-mode: mensagem só *propõe*; o pipeline do receptor valida e pode recusar.
2. Compartimentação por (usuário × módulo) tem custo de orquestração de muitos delegados; é o preço da não-mistura de dados, e vale.
3. Doc de sessão é efêmero por padrão — fechar sem persistir perde o rascunho (comportamento esperado, sinalizado), salvo opt-in de persistência.
4. **Custo de delegados no payload.** Cada (usuário × módulo) instancia um delegado; com muitos módulos ativos o conjunto de delegados pesa no payload de sincronização inicial da conta. É custo aceito da compartimentação (cf. §3.1), mitigável por **instanciação preguiçosa**: o delegado nasce só quando o usuário ativa/entra no módulo (sob demanda), não antecipadamente.
