# Triagem — rfc-021 (Mapa)

**Achados:** 12 · **INCORPORAR:** 2 · **JA-COBERTO:** 2 · **UI->INVENTARIO:** 6 · **REJEITAR:** 0 · **REVISAR-HUMANO:** 2

## ⚠ REVISAR-HUMANO (decisão arquitetural — não redigir norma)

- **021-10 — Aresta `LOCATED_AT`** (review §4): o review propõe uma aresta nova ligando Perfil/Evento/Empresa/Anúncio à coordenada. A RFC é explícita em "**Zero tipo de nó novo** — lugar é `CONTENT`" e modela consumo "por referência ao `PLACE` ou por coordenada no payload" (A.3), sem introduzir aresta de ontologia. Criar `LOCATED_AT` é mecânica nova de grafo que pode contradizer a tese de minimalismo ontológico da RFC e tocar o caderno-2 (ontologia/arestas). Decisão humana: adotar aresta canônica vs. manter referência por payload.
- **021-12 — Colisão de numeração caderno-3 slot 22** (auditoria O-02): rfc-021 §A.1 cria `caderno-3-sdk/22-mapa-reference-spec.md`, mas rfc-022 também reivindica o slot 22 (severidade alta). A decisão de numeração do caderno-3 (qual RFC fica com 22, renumeração) exige decisão humana antes da absorção de qualquer das duas.

## Tabela de triagem

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 021-01 | Geofencing nativo: R*Tree suporta polígonos simples, não só pontos (§2) | INCORPORAR | A.5 nova — `A.5 — Geofencing por polígono` (renumerar atuais A.5/A.6) ou §5 do reference-spec | O `geo_index` (R*Tree) estende-se a **polígonos simples** além de pontos (Long/Lat), permitindo consulta "dentro-de-polígono" local. Isso habilita que uma `SPEC:WORKFLOW` (RFC-022/Logística) valide um *Proof of Delivery* apenas quando a coordenada cai dentro do polígono da região. A consulta de contenção é local sobre o `geo_index`, sem rede. | [x] |
| 021-02 | Prevenção de fuga de chave de API: proxy seguro via System Peer (§2) | INCORPORAR | A.2 existente (provedores externos) — acrescentar item | A **chave de API** de provedores externos (geocoding/places/rotas, A.2) **NUNCA** é exposta no frontend React nem a clients P2P. Por não haver backend, a chave é retida no **System Peer do Operador de Node**, que atua como *proxy seguro* para os requests Classe E ao provedor. | [x] |
| 021-03 | MapCanvas integrado: aceita pins reativos injetados por outros módulos (§3) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Organism · `InteractiveMapCanvas` (canvas cartográfico que aceita injeção de pins reativos cross-módulo) · módulo Mapa (RFC-021) — ver 021-08 (mesmo organism). | [x] |
| 021-04 | Map-Overlay Card: cards transparentes flutuando sobre o mapa (§3) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Molécula · `MapOverlayCard` (card transparente flutuante sobre a visualização cartográfica) · módulo Mapa (RFC-021). | [x] |
| 021-05 | Atom `CustomGeoPin` com ícones temáticos por SPEC (§3) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Átomo · `CustomGeoPin` (pin com ícone temático derivado da SPEC) · módulo Mapa (RFC-021). | [x] |
| 021-06 | Atom `ZoomControl` (§3) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Átomo · `ZoomControl` (controle de zoom do mapa) · módulo Mapa (RFC-021). | [x] |
| 021-07 | Molecule `PlaceAutocompleteInput` (busca híbrida RRF local + Places fallback) (§3) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Molécula · `PlaceAutocompleteInput` (campo de busca híbrido: RRF local + fallback de places externo Classe E) · módulo Mapa (RFC-021). | [x] |
| 021-08 | Organism `InteractiveMapCanvas` (tela primária gerida pela lib de mapa) (§3) | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Organismo · `InteractiveMapCanvas` (tela primária gerida pela lib de mapa) · módulo Mapa (RFC-021). | [x] |
| 021-09 | Nó `SPEC:PLACE` (materializado ou `LOCAL_TRANSIENT`) (§4) | JA-COBERTO | — | RFC A.1 já define lugar = `CONTENT` governado por `SPEC:PLACE` indexado no `geo_index`; A.2 já prevê materialização com TTL ou `LOCAL_TRANSIENT`. | [x] |
| 021-10 | Aresta `LOCATED_AT` ligando Perfil/Evento/Empresa/Anúncio à coordenada (§4) | REVISAR-HUMANO | — | Mecânica nova de ontologia; contradiz "zero nó novo" + consumo por referência/payload (A.3). Ver bloco em destaque. | [x] |
| 021-11 | Ciclo de vida: nascimento (geocode→R*Tree), mutação com histórico, TTL de cache de terceiros (§5) | JA-COBERTO | — | RFC A.2.2 (cache externo com TTL/proveniência, cacheável vs. `LOCAL_TRANSIENT`) e A.5.2 (cacheabilidade limitada por termos do provedor) já cobrem nascimento e fim-de-vida; mutação/histórico segue o regime `CONTENT` vigente. | [x] |
| 021-12 | Colisão de numeração: caderno-3 slot 22 disputado com rfc-022 (auditoria O-02) | REVISAR-HUMANO | — | Decisão de numeração do caderno-3 antes da absorção. Ver bloco em destaque. | [x] |
