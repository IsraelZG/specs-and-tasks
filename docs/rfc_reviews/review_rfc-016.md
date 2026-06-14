# Revisão RFC-016: Rede Social e Feed

## 1. Validação da Ideia Central
A constatação bruta e honesta de que "Privacidade retroativa é criptograficamente impossível" é um frescor num mundo de falsas promessas de Big Techs. A adoção da Shell de Colunas (`FeedColumn` -> `PostDetail`) (RFC-026) junto aos editores de media ricos (RFC-024) traz a aplicação a um patamar moderno de UX estilo Notion/Arc, mantendo o feed como uma projeção de `SuperCard` em tempo real baseada em GraphRAG.

## 2. Refinamentos e Adições Sugeridas
- **Contadores Virais e Hot-Spots (A.3):** Uma postagem de celebridade recebendo 1 milhão de likes num grafo de eventos append-only geraria 1 milhão de arestas de reação apontando pro mesmo Nó Head, causando um gargalo violento de validação e replicação (hot-spotting). A RFC deve sugerir o uso de *Batched Intent Projections* (Reações agregadas periodicamente em um novo Nó de métrica assinado por peers orquestradores) para descongestionar a raiz do post principal em posts hipe-virais.
- **Moderação Via StateMachine:** A RFC agora diz que moderação é `SPEC:WORKFLOW` (RFC-022). Em cenários sociais, o workflow de denúncia ("Denunciado -> Em Análise -> Takedown") precisa ter um gate distribuído na UI (o cliente esconde posts em takedown pendente) e um gate forte nas replicação para barrar conteúdo ilegal massivamente.
- **Stories Efêmeros (A.3):** Sendo P2P puro ou híbrido, Stories que expiram precisam de uma rotina de Garbage Collection forte. O TTL de cortesia honest-client precisa ser suportado por deletes lógicos agressivos no SQLite subjacente.

## 3. Design System & UI Layout
### Ideias de Layout
- Navegação de Stories fluida: Utilização massiva de pre-fetching (carregar os primeiros nós das arestas antes do usuário deslizar).
- Feed Cards Dinâmicos: O `SuperCard` na disposição em colunas (Shell) deve poder saltar do Feed para uma Coluna Detail Expandida sem piscar a tela.

### Componentes Necessários
- **Atoms:** `AvatarRing` (Colorido para indicar story novo), `LikeHeartToggle`, `FollowButton`.
- **Molecules:** `StoryBubbleList`, `SocialActionRow` (Like, Comment, Share, Save).
- **Organisms:** `InfiniteFeedRenderer` (Usa o `SuperCard` para renderizar instâncias paginadas combinando posts orgânicos e anúncios), `ProfileHeaderArea`.

## 4. Modelagem de Grafo (Nós e Arestas)
- **Nós:** 
  - `PROFILE` (Usuário).
  - `CONTENT:POST` / `CONTENT:STORY`.
- **Arestas:** 
  - Arestas diretivas e não-diretivas para "Seguindo/Seguidor".
  - Arestas de Menção `@` para instigar notificações cruzadas.

## 5. Ciclo de Vida dos Dados
- **Nascimento:** O nó é publicado, com sua flag de visibilidade estática setada (Pública/Mútua).
- **Mutação:** Edições (se permitidas) são `SUPERSEDED_BY`, mas o histórico de edições é publicamente rastreável (garantia de auditoria contra Fake News retroativas).
- **Fim de Vida:** Expiração (para Stories) purga o dado localmente. Aresta de bloqueio "oculta" o dado das views nativas, mesmo estando no storage local.
