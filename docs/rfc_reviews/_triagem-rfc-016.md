# Triagem — rfc-016 (Rede Social e Feed)

**Fonte:** `docs/rfcs/rfc-016-social.md` + `docs/rfc_reviews/review_rfc-016.md`

## Contagens por veredito
- INCORPORAR: 3
- JA-COBERTO: 3
- UI->INVENTARIO: 8
- REJEITAR: 1
- REVISAR-HUMANO: 2
- **Σ achados: 17**

## REVISAR-HUMANO (em destaque)
- **016-02** — Gate forte de moderação na **replicação** para barrar conteúdo ilegal em massa: mecânica nova de censura/replicação que SUPERSEDE a tese P2P honest-client; decisão arquitetural cross-RFC (RFC-022/RFC-027).
- **016-16** — Histórico de edições publicamente rastreável via `SUPERSEDED_BY` como **garantia** anti-fake-news: tensão com o limite honesto da RFC (privacidade retroativa impossível; honest-client não garante retenção/auditoria em P2P). Não redigir norma.

## Tabela

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 016-01 | §2 Hot-spotting: 1M likes geram 1M arestas sobre o mesmo Nó Head → gargalo de validação/replicação; usar *Batched Intent Projections* (reações agregadas periodicamente num novo Nó de métrica assinado por peers orquestradores) | INCORPORAR | A.3 §3 (refina o limite honesto de contadores virais) | Acrescentar a A.3.3: "Em posts hiper-virais, a contagem direta de reações cria *hot-spotting* — N arestas leves sobre o mesmo nó-cabeça, gargalo de validação/replicação. Mitiga-se por **projeções de intent em lote**: reações agregadas periodicamente num **Nó de métrica** assinado por peers orquestradores, descongestionando a raiz do post. A métrica é projeção agregada (RFC-013 A.6), não delegação." | [ ] |
| 016-02 | §2 Moderação: gate distribuído na UI (cliente esconde takedown pendente) + gate forte na replicação para barrar conteúdo ilegal massivo | REVISAR-HUMANO | — | Gate de replicação para censura ilegal é mecânica nova que tensiona o modelo honest-client/P2P e cruza RFC-022 (workflow) + RFC-027 (compartimentação). Decisão arquitetural. | [x] |
| 016-03 | §2 Stories: TTL de cortesia honest-client suportado por deletes lógicos agressivos no SQLite subjacente (GC forte) | JA-COBERTO | A.3 §2 + A.6 T-SOC-03 | RFC já declara story como `CONTENT` efêmero com "TTL declarado (poda por G4)" e prova em T-SOC-03 que "story expirado some na UI honesta". O detalhe de implementação (deletes lógicos no SQLite) é nota de execução, não norma nova. | [x] |
| 016-04 | §3 Layout: navegação de Stories fluida com pre-fetching dos primeiros nós das arestas antes do deslize | UI->INVENTARIO | `inventario-componentes-layouts.md` | Comportamento/layout — Story viewer com pré-busca de arestas (organismo, módulo social). | [ ] |
| 016-05 | §3 Layout: `SuperCard` salta do Feed para Coluna Detail expandida sem repaint (shell em colunas RFC-026) | UI->INVENTARIO | `inventario-componentes-layouts.md` | Layout `FeedColumn`→`PostDetail` (organismo/disposição, módulo social) — já antecipado no header transversal da RFC; registrar no inventário. | [ ] |
| 016-06 | §3 Atom: `AvatarRing` (anel colorido = story novo) | UI->INVENTARIO | `inventario-componentes-layouts.md` | `AvatarRing` (átomo, módulo social). | [ ] |
| 016-07 | §3 Atom: `LikeHeartToggle` | UI->INVENTARIO | `inventario-componentes-layouts.md` | `LikeHeartToggle` (átomo, módulo social). | [ ] |
| 016-08 | §3 Atom: `FollowButton` | UI->INVENTARIO | `inventario-componentes-layouts.md` | `FollowButton` (átomo, módulo social). | [ ] |
| 016-09 | §3 Molecule: `StoryBubbleList` | UI->INVENTARIO | `inventario-componentes-layouts.md` | `StoryBubbleList` (molécula, módulo social). | [ ] |
| 016-10 | §3 Molecule: `SocialActionRow` (Like, Comment, Share, Save) | UI->INVENTARIO | `inventario-componentes-layouts.md` | `SocialActionRow` (molécula, módulo social). | [ ] |
| 016-11 | §3 Organism: `InfiniteFeedRenderer` (usa `SuperCard` p/ instâncias paginadas combinando posts orgânicos e anúncios) + `ProfileHeaderArea` | UI->INVENTARIO | `inventario-componentes-layouts.md` | `InfiniteFeedRenderer` e `ProfileHeaderArea` (organismos, módulo social). | [ ] |
| 016-12 | §3 Feed como projeção de `SuperCard` em tempo real baseada em GraphRAG (§1 validação) | JA-COBERTO | A.4 §1 | RFC já define "Feed = `SuperCard` + `Layout` compondo conteúdo recuperado (traversal social + RRF RFC-011)". Validação, sem norma nova. | [x] |
| 016-13 | §4 Aresta de Menção `@` para instigar notificações cruzadas | INCORPORAR | A.2 §1 (estende arestas sociais) | Acrescentar a A.2.1: "Menção `@` = aresta social leve (`RELATES:SOCIAL:MENTIONS`) que dispara notificação cruzada ao perfil mencionado; é intent, não tipo de nó novo." | [ ] |
| 016-14 | §4 Arestas diretivas vs. não-diretivas para Seguindo/Seguidor | JA-COBERTO | A.2 §1 | RFC já modela seguir/amizade como arestas sociais (`RELATES:SOCIAL:FOLLOWS`) com pedido/aceite como intent. Descreve o que a RFC diz. | [x] |
| 016-15 | §5 Nascimento: nó publicado com flag de visibilidade estática (Pública/Mútua) | INCORPORAR | A.1 §1 (precisa a visibilidade declarada) | Acrescentar a A.1.1: "A visibilidade (pública/privada/mútua) é flag **estática** declarada no nascimento do nó na SPEC; ver A.1.2 quanto ao limite de privacidade retroativa." | [ ] |
| 016-16 | §5 Mutação: edições são `SUPERSEDED_BY` com histórico de edições publicamente rastreável (auditoria anti-fake-news) | REVISAR-HUMANO | — | Tratar histórico de edições como **garantia** de auditoria colide com o limite honesto da RFC (retenção/visão depende do agente em P2P; nada garante que cópias antigas permaneçam). `SUPERSEDED_BY` é canônico, mas a *garantia* de rastreabilidade pública é decisão arquitetural. | [x] |
| 016-17 | §5 Fim de vida: aresta de bloqueio oculta dado das views nativas mesmo presente no storage local | REJEITAR | — | Já coberto literalmente por A.2.2 ("bloqueio é social, não criptográfico... oculta na UI honesta... não impede cliente adversário"); reafirmação, não achado novo. | [x] |

### Nota de fechamento
Achados de §1 (validação da privacidade retroativa, shell de colunas, editores ricos) não geraram linha por serem elogio/validação do que a RFC e seus transversais já declaram. REJEITAR contém apenas 016-17 (reafirmação literal de A.2.2). O override do orquestrador foi aplicado em 016-01: hot-spotting / *Batched Intent Projections* tratado como refinamento normativo à seção de contadores virais (A.3.3). Σ vereditos (17) = nº de achados extraídos.
