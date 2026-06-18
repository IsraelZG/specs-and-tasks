# 23-mapa-reference-spec.md — Mapa

> Fonte: RFC-021 (absorvida e deletada). Apoia-se na engine `GeoSpatial` e no índice `geo_index` (R*Tree) existentes, e no conector Classe E (RFC-007 A.5) para geocoding/places/rotas externos. Zero tipo de nó novo — lugar é `CONTENT`. Onde não tocada, a doc vigente prevalece.

---

## §1 — Lugar e índice espacial

Lugar = `CONTENT` governado por `SPEC:PLACE` (coordenadas, endereço, categoria), indexado no `geo_index` (R*Tree) para consulta por proximidade/bounding box. Renderização e interação pela engine `GeoSpatial` (tiles via provedor de mapa-base).

---

## §2 — Consultas espaciais e provedores externos

1. Proximidade/dentro-de-área são consultas locais sobre o `geo_index` (sem rede).
2. **Geocoding, places e rotas** externos = conector **Classe E** (RFC-007 A.5, consulta): resultado pode materializar como `SPEC:PLACE` com **TTL de validade** e proveniência (`provider`/`fetched_at`); a SPEC declara se é cacheável/replicável ou `LOCAL_TRANSIENT`, respeitando os termos do provedor.
3. **Geofencing por polígono.** O `geo_index` (R*Tree) estende-se a **polígonos simples** além de pontos (Long/Lat), permitindo consulta "dentro-de-polígono" local. Isso habilita que uma `SPEC:WORKFLOW` (RFC-022/Logística) valide um *Proof of Delivery* apenas quando a coordenada cai dentro do polígono da região. A consulta de contenção é local sobre o `geo_index`, sem rede.
4. **Proxy seguro de chave de API.** A **chave de API** de provedores externos (geocoding/places/rotas) **NUNCA** é exposta no frontend React nem a clients P2P. Por não haver backend, a chave é retida no **System Peer do Operador de Node**, que atua como *proxy seguro* para os requests Classe E ao provedor.

---

## §3 — Consumo por outros módulos

O mapa é consumido por referência ao `PLACE` ou por coordenada no payload: produto/loja no mapa (RFC-012), check-in social (RFC-016), geolocalização de live (RFC-017), local de evento (RFC-020), roteirização de entrega/serviço (RFC-013). Nenhum módulo reimplementa geo — todos consomem esta lente.

---

## §4 — Privacidade de localização

Localização do usuário é **dado sensível** — captura sob consentimento explícito, granularidade declarada (precisa vs. aproximada), e nunca exposta a segmentação de anúncios fora do que o usuário liberou (RFC-015 A.3.2). Compartilhamento de localização em tempo real é sinal efêmero (como presença, RFC-018 A.4), não nó durável.

---

## §5 — Limites honestos

1. Geocoding/rotas dependem de provedor externo; sem conector, opera só com `PLACE`s locais (sem rota dinâmica).
2. Cacheabilidade de resultados externos é limitada pelos termos do provedor (RFC-007 A.5.1) — declarado por SPEC, não política única.
3. Mapa-base (tiles) é serviço de terceiro; offline depende de tiles pré-baixados.
