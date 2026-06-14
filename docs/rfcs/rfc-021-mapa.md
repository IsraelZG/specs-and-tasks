# RFC-021 — Mapa
> **Status:** Proposta
> **Precedência:** produto **separado, consumível** pelos demais; apoia-se na engine `GeoSpatial` e no índice `geo_index` (R*Tree) existentes, e no conector Classe E (RFC-007 A.5) para geocoding/places/rotas externos. **Zero tipo de nó novo** — lugar é `CONTENT`. Onde não tocada, a doc vigente prevalece.
> **Transversais posteriores a aplicar na absorção:** `MapCanvas` ocupa um painel do shell (RFC-026) e é consumido por outros módulos por referência; o módulo segue o plano de comando/compartimentação (RFC-027).
> **Tese:** um produto de mapa próprio (modelo Google Maps) que é, ao mesmo tempo, uma capacidade consumida por marketplace, social, streaming e logística.

## A.1 — Lugar e índice espacial

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/22-mapa-reference-spec.md` | novo | Documento canônico, §1 |

**Texto normativo:** lugar = `CONTENT` governado por `SPEC:PLACE` (coordenadas, endereço, categoria), indexado no `geo_index` (R*Tree) para consulta por proximidade/bounding box. Renderização e interação pela engine `GeoSpatial` (tiles via provedor de mapa-base).

## A.2 — Consultas espaciais e provedores externos

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/22-mapa-reference-spec.md` | §2 | Adicionar |

**Texto normativo:**

1. Proximidade/dentro-de-área são consultas locais sobre o `geo_index` (sem rede).
2. **Geocoding, places e rotas** externos = conector **Classe E** (RFC-007 A.5, consulta): resultado pode materializar como `SPEC:PLACE` com **TTL de validade** e proveniência (`provider`/`fetched_at`); a SPEC declara se é cacheável/replicável ou `LOCAL_TRANSIENT`, respeitando os termos do provedor.
3. **Geofencing por polígono.** O `geo_index` (R*Tree) estende-se a **polígonos simples** além de pontos (Long/Lat), permitindo consulta "dentro-de-polígono" local. Isso habilita que uma `SPEC:WORKFLOW` (RFC-022/Logística) valide um *Proof of Delivery* apenas quando a coordenada cai dentro do polígono da região. A consulta de contenção é local sobre o `geo_index`, sem rede.
4. **Proxy seguro de chave de API.** A **chave de API** de provedores externos (geocoding/places/rotas) **NUNCA** é exposta no frontend React nem a clients P2P. Por não haver backend, a chave é retida no **System Peer do Operador de Node**, que atua como *proxy seguro* para os requests Classe E ao provedor.

## A.3 — Consumo por outros módulos

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/22-mapa-reference-spec.md` | §3 | Adicionar |

**Texto normativo:** o mapa é consumido por referência ao `PLACE` ou por coordenada no payload: produto/loja no mapa (RFC-012), check-in social (RFC-016), geolocalização de live (RFC-017), local de evento (RFC-020), roteirização de entrega/serviço (RFC-013). Nenhum módulo reimplementa geo — todos consomem esta lente.

## A.4 — Privacidade de localização

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/22-mapa-reference-spec.md` | §4 | Adicionar |

**Texto normativo:** localização do usuário é **dado sensível** — captura sob consentimento explícito, granularidade declarada (precisa vs. aproximada), e nunca exposta a segmentação de anúncios fora do que o usuário liberou (RFC-015 A.3.2). Compartilhamento de localização em tempo real é sinal efêmero (como presença, RFC-018 A.4), não nó durável.

## A.5 — Limites honestos

1. Geocoding/rotas dependem de provedor externo; sem conector, opera só com `PLACE`s locais (sem rota dinâmica).
2. Cacheabilidade de resultados externos é limitada pelos termos do provedor (RFC-007 A.5.1) — declarado por SPEC, não política única.
3. Mapa-base (tiles) é serviço de terceiro; offline depende de tiles pré-baixados.

## A.6 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-MAP-01..03 |

**T-MAP-01** `SPEC:PLACE` + consulta sobre `geo_index` (proximidade/bbox) + render `GeoSpatial` (DoD Cloud); **T-MAP-02** conector Classe E (geocoding/places/rotas) com cache TTL + proveniência + flag cacheável/transiente; **T-MAP-03** consumo cross-módulo por referência + localização como dado sensível/efêmero; vetor (§0.1.7): localização não vai a segmentação sem consentimento, cache respeita TTL/termos, ausência de conector degrada declaradamente.
