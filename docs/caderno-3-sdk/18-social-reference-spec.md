# 18-social-reference-spec.md — Rede Social e Feed

> Fonte: RFC-016 (absorvida e deletada). Consome engines `SuperCard` e `Layout` (caderno-3/03), DMs da RFC-018 (mensagens) e anúncios da RFC-015. **Zero tipo de nó novo** — validado contra os comportamentos de Instagram/Twitter/Facebook em sessão anterior. Onde não tocada, a doc vigente prevalece. Transversais posteriores a aplicar na absorção: `FeedColumn`→`PostDetail` segue a disposição em colunas do shell (RFC-026); o `PostComposer` usa editores de mídia como `ui` plugin (RFC-024); DMs são o chat da RFC-018 e o módulo segue o plano de comando/compartimentação (RFC-027); moderação/denúncia, se houver, é `SPEC:WORKFLOW` (RFC-022).

---

## §1 — Perfis e visibilidade

1. Perfil = `PROFILE`; público vs. privado é visibilidade declarada na SPEC. Conteúdo público distribui chave universal; privado restringe por chave/`PERMISSION`. A visibilidade (pública/privada/mútua) é flag **estática** declarada no nascimento do nó na SPEC; ver §6 quanto ao limite de privacidade retroativa.
2. **Limite honesto:** **privacidade retroativa é criptograficamente impossível** — uma vez distribuída a chave de um conteúdo público, torná-lo privado depois não revoga cópias. Tornar privado afeta o futuro, não o passado.

---

## §2 — Grafo social

1. Seguir/ser amigo = arestas sociais (`RELATES:SOCIAL:FOLLOWS`, etc.). Pedido/aceite de amizade = intent. Menção `@` = aresta social leve (`RELATES:SOCIAL:MENTIONS`) que dispara notificação cruzada ao perfil mencionado; é intent, não tipo de nó novo.
2. **Bloqueio é social, não criptográfico:** em rede pública, bloquear oculta na UI honesta e corta entrega por cortesia; não impede um cliente adversário de ler conteúdo já público. Declarado como controle de UX, não de segurança.

---

## §3 — Publicações, stories, reações

1. Post = `CONTENT` (texto/mídia via media plane RFC-017); comentário = `CONTENT` ligado; reação = aresta/intent leve.
2. **Stories** = `CONTENT` efêmero com TTL declarado (poda por G4) — expiração é cortesia honest-client em P2P, durável no operador na modalidade gerenciada.
3. **Limite honesto:** contadores virais (curtidas, views) inflam o grafo social com arestas leves; alta escala vira custo de projeção, não de delegação — dimensionado como projeção agregada (RFC-013 A.6). Em posts hiper-virais, a contagem direta de reações cria *hot-spotting* — N arestas leves sobre o mesmo nó-cabeça, gargalo de validação/replicação. Mitiga-se por **projeções de intent in lote**: reações agregadas periodicamente num **Nó de métrica** assinado por peers orquestradores, descongestionando a raiz do post. A métrica é projeção agregada (RFC-013 A.6), não delegação.

---

## §4 — Feed e ranking

1. Feed = `SuperCard` + `Layout` compondo conteúdo recuperado (traversal social + RRF RFC-011) e anúncios (RFC-015) como itens distinguíveis.
2. Ranking é Zen na SPEC do feed; cronológico, algorítmico ou híbrido são variantes configuráveis.
3. **Limite honesto:** a qualidade do ranking depende da **vantagem observacional do agente** — quanto o device/operador enxerga do grafo. Em P2P puro com visão parcial, o ranking é mais fraco que num operador com visão ampla. Declarado.

---

## §5 — Mensagens diretas

DM é o **chat da RFC-018** visto pela lente social — mesma conversa, mesmos nós; sem mecânica própria.

---

## §6 — Limites honestos

1. **Privacidade retroativa:** É criptograficamente impossível. Uma vez distribuída a chave de um conteúdo público, torná-lo privado depois não revoga cópias. Tornar privado afeta o futuro, não o passado.
2. **Bloqueio social:** Bloquear oculta na UI honesta e corta entrega por cortesia; não impede um cliente adversário de ler conteúdo já público. Declarado como controle de UX, não de segurança.
3. **Contadores virais (likes/views):** Criam gargalo de validação/replicação (hot-spotting) por múltiplas arestas leves no mesmo nó. Mitiga-se por projeções de intent em lote consolidadas num nó de métrica assinado por peers.
4. **Ranking do feed:** A qualidade depende da vantagem observacional do agente (o quanto o device/operador enxerga do grafo).
