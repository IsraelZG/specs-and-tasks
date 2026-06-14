# RFC-027 — Módulos como Profiles e Mensageria Inter-Módulo
> **Status:** Proposta
> **Precedência:** transversal; **emenda** `caderno-4-governance/02-module-architecture-and-code-splitting.md` (módulo = lente + ator + profile) e as costuras das RFCs 012/013 (adiciona o plano de comando ao plano de dados). Apoia-se em RFC-011 (persona-agente) e Automerge. **Zero tipo de nó novo.** Onde não tocada, a doc vigente prevalece.
> **Tese:** módulo é, simultaneamente, **lente** sobre o subgrafo (plano de dados, inalterado) e **ator** com profile (plano de comando, novo). Integração de dados segue zero-API; comando entre módulos é mensageria uniforme. E nenhum profile de sistema é global: tudo é compartimentado por usuário × módulo.

## A.1 — Dois planos ortogonais

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-4-governance/02-module-architecture-and-code-splitting.md` | §novo | Emendar: módulo tem dois planos |
| `docs/conceitos/modulo-lente-e-ator.md` | novo verbete | dados (lente) × comando (ator) |

**Texto normativo:**

1. **Plano de dados — lente (inalterado):** módulos compartilham nós; integração é projeção, não API. O produto anunciado **é o mesmo nó** que o anúncio referencia; zero sync, zero API entre módulos (reafirma RFC-012 A.9 / RFC-013 A.1).
2. **Plano de comando — ator (novo):** o módulo ganha um `PROFILE` e recebe **mensagens** que interpreta para agir. "Mover item entre módulos" (produto → vira anúncio; email → vira evento) é **mensagem endereçada ao profile do módulo**. Como intent já é mensagem, isto é apenas endereçá-la a um módulo.
3. Os planos são ortogonais e não conflitam: o item movido é dado compartilhado (lente); a ordem de movê-lo é comando (mensagem). Integração permanece zero-API nos dois — dados por compartilhamento, comandos por mensageria uniforme.

## A.2 — Mensagem de comando: durável vs. efêmera

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-4-governance/02-module-architecture-and-code-splitting.md` | §comando | Adicionar |

**Texto normativo:**

1. **Comando durável** (precisa ser fato auditável: "criar anúncio a partir deste produto") = `CONTENT:INTENT` endereçado ao profile do módulo, no grafo, validado pelo pipeline normal e assinado pela persona do usuário.
2. **Comando efêmero** (coordenação transiente de UI: focar painel, abrir aba, destacar item) = sinal efêmero não-durável (como presença, RFC-018 A.4) — nunca nó append-only.
3. O módulo receptor interpreta a mensagem com sua própria lógica (workflow/handlers, RFC-022). A mensagem nunca executa código no remetente; ela **propõe** uma ação que o receptor valida e realiza.

## A.3 — Profiles de sistema compartimentados (por usuário × módulo)

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-4-governance/02-module-architecture-and-code-splitting.md` | §profiles | Adicionar |
| `docs/conceitos/profile-de-modulo.md` | novo verbete | delegado escopado, sem god-mode |

**Texto normativo:**

1. **Não existe profile de sistema global com acesso cross-user.** Cada par **(usuário × módulo)** instancia um **profile-delegado** próprio, escopado por `ASSET:ROLE` à fatia daquele usuário naquele módulo. Quando o módulo "age por você", é o *seu* delegado — que só enxerga os *seus* dados daquele módulo. Compartimentação por construção; o perigo de misturar dados de usuários num profile gordo é eliminado.
2. **Operações inerentemente cross-user** (busca, feed, ranking, seleção de anúncio) **rodam com as permissões de leitura do próprio usuário** — só dado público + o próprio. Nenhum profile privilegiado lê dado privado de terceiros. Agregação cross-user é limitada ao que é público.
3. **Conectores de operador (RFC-007)** seguem o mesmo princípio: persona escopada ao que processam (RFC-007 A.2.2), nunca acesso amplo implícito.
4. **Modalidade gerenciada:** um operador *pode* declarar profiles de serviço com acesso mais amplo (índice global, moderação) — mas **declarado e auditado** ([[modalidade-de-rede]]), nunca implícito; P2P puro não os tem. Espelha a delegação revogável e escopada do agente de IA (RFC-011 A.5).

## A.4 — Sessão como doc colaborativo (onde há edição)

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-4-governance/02-module-architecture-and-code-splitting.md` | §sessao | Adicionar |
| `docs/conceitos/sessao-colaborativa.md` | novo verbete | doc Automerge efêmero, opt-in para persistir |

**Texto normativo:**

1. Uma seção **editorial/estatal** de módulo (compor, configurar, IA-assistir) é modelada como **doc colaborativo Automerge, local-first e efêmero por padrão**; compartilhar/persistir é **opt-in** (como convidar para um Live Share). Isso respeita a regra de que estado de sessão não é nó mutável replicado (saga/workflow): o doc vive no store local e só sincroniza por escolha.
2. O **profile do módulo participa como co-editor** (peer Automerge): suas "edições" são intents — a persona-agente (RFC-011) propõe, o usuário aceita/edita. IA-assistência vira co-edição natural.
3. **Sessão de leitura pura** (rolar feed, ver dashboard) **não** é doc colaborativo — é página sobre projeção, sem custo de CRDT. O modelo-doc aplica-se só onde há edição.

## A.5 — Limites honestos

1. O plano de comando não dá god-mode: mensagem só *propõe*; o pipeline do receptor valida e pode recusar.
2. Compartimentação por (usuário × módulo) tem custo de orquestração de muitos delegados; é o preço da não-mistura de dados, e vale.
3. Doc de sessão é efêmero por padrão — fechar sem persistir perde o rascunho (comportamento esperado, sinalizado), salvo opt-in de persistência.

## A.6 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-MOD-01..04 |

**T-MOD-01** profile de módulo + mensageria de comando (intent durável endereçado + sinal efêmero) — DoD Protocolo/core; **T-MOD-02** delegado por (usuário × módulo) escopado por `ASSET:ROLE` + operações cross-user com permissão do próprio usuário; **T-MOD-03** sessão como doc Automerge efêmero local-first + opt-in de persistência + profile como co-editor; **T-MOD-04** vetores adversariais (§0.1.7): delegado tentando ler dado de outro usuário (recusa), comando acima do privilégio do remetente (recusa), sessão efêmera não vira nó durável sem opt-in, agregação cross-user limitada ao público.
