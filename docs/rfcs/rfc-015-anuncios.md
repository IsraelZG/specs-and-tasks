# RFC-015 — Anúncios e Promoção Cross-Módulo
> **Status:** Proposta
> **Precedência:** módulo transversal entre produtos; consome a máquina econômica da RFC-012 (liquidação), o RAG da RFC-011 (segmentação) e as superfícies de Social (016) e Streaming (017). **Zero tipo de nó novo** — anúncio é `CONTENT`; a relação de promoção é aresta hierárquica `RELATES:AD:PROMOTES` (justificada pelos 4 critérios de minimalismo: relação durável, consultável, com payload próprio, distinta de autoria). Onde não tocada, a doc vigente prevalece.
> **Transversais posteriores a aplicar na absorção:** o ciclo da campanha é `SPEC:WORKFLOW` (RFC-022); o `AdCreativeEditor` reusa os editores de mídia como `ui` plugin/componente rico (RFC-024); `AdSlot` é renderizado nas superfícies via shell (RFC-026); "arrastar produto para virar anúncio" é comando ao profile do módulo (RFC-027).
> **Tese:** anunciar é **promover um item que já existe**, não criar conteúdo paralelo. O anúncio referencia o item negociável por aresta, é governado por uma campanha, segmenta por traversal/RAG e liquida pela mesma economia da RFC-012 — atravessando marketplace, feed e streaming sem integração ponto a ponto.

## A.1 — Anúncio e campanha

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/16-anuncios-reference-spec.md` | novo | Documento canônico, §1 |
| `docs/conceitos/anuncio.md` | novo verbete | anúncio + campanha + promoção |

**Texto normativo:**

1. **Anúncio** = `CONTENT` (criativo) governado por `SPEC:AD`, ligado ao item promovido (produto, listing, perfil, conteúdo) por `RELATES:AD:PROMOTES`. Não duplica o item — referencia-o.
2. **Campanha** = `SPECIFICATION:AD_CAMPAIGN`: orçamento, período, modelo de cobrança, segmentação, superfícies elegíveis. Múltiplos anúncios sob uma campanha.
3. Orçamento da campanha = `ASSET:BALANCE_STATE` dedicado; reserva de verba por veiculação usa `ASSET:LOCK` (pacing), liquidando ao evento cobrável.

## A.2 — Superfícies de veiculação

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/16-anuncios-reference-spec.md` | §2 | Adicionar |

**Texto normativo:**

1. Uma **superfície** é um ponto de renderização que um módulo consumidor expõe: item patrocinado no feed (Social), pré/mid-roll e banner (Streaming), listagem patrocinada e recomendação (Marketplace), resultado patrocinado em busca. O módulo consumidor renderiza o anúncio com seus próprios componentes do catálogo (RFC-006) — o anúncio não traz UI própria.
2. A campanha declara superfícies elegíveis; a seleção de qual anúncio mostrar em uma superfície é decisão Zen (lance × relevância × pacing), avaliada no contexto do consumidor.
3. Anúncio é sempre **distinguível** de conteúdo orgânico na UI (rótulo "patrocinado") — requisito de produto, não opcional.

## A.3 — Segmentação

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/16-anuncios-reference-spec.md` | §3 | Adicionar |

**Texto normativo:**

1. Segmentação = consulta sobre sinais que o usuário **expôs** (interesses públicos, contexto da superfície, traversal do grafo social/de consumo) e, quando aberta, recuperação semântica (RFC-011 RRF). Roda com a fronteira de permissão do usuário-alvo.
2. **Privacidade por construção:** segmentação **nunca** acessa plaintext de classe restrita nem cruza fronteira E2E (RFC-010 A.6 / RFC-011 A.3.2). Dado privado não vira critério de anúncio. Em P2P puro, a seleção roda no device do espectador (o anunciante não vê o indivíduo, só recebe a métrica agregada).
3. Contexto > perfil: a segmentação contextual (o que a pessoa está vendo agora) é o caminho default; perfilamento profundo é limitado pelo que foi exposto.

## A.4 — Medição e liquidação

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/16-anuncios-reference-spec.md` | §4 | Adicionar |

**Texto normativo:**

1. Eventos cobráveis (impressão, clique, conversão) são **medidos pelo core** (registro assinado de evento) e **liquidados por Zen** ([[economia-como-modulo]]: core mede, SPEC liquida) — CPM, CPC ou CPA são modelos na `SPEC:AD_CAMPAIGN`. O registro assinado do evento cobrável carrega a assinatura do `PROFILE` do espectador: impressão/clique sem assinatura válida do observador não é faturável. Isso amarra a medição a uma identidade real e eleva o custo de forja.
2. Cobrança debita o orçamento da campanha e credita a plataforma e (quando aplicável) o publicador da superfície — split na mesma op (RFC-012 A.5.2). Conversão atribuível a uma venda fecha o ciclo com o checkout da RFC-012.
3. Pacing: a verba liberada por período é controle Zen sobre o `BALANCE_STATE` + `LOCK`; esgotou → campanha pausa.
4. **Ponderação anti-fraude do evento:** a liquidação Zen pondera o evento pela reputação do espectador: eventos de `PROFILE` recém-criado, sem saldo nem reputação, recebem peso zero no cálculo da cobrança, protegendo o anunciante de Sybil sem bloquear participação legítima.

## A.5 — Limites honestos

1. **Fraude de clique/impressão** depende de cliente honesto para a medição; mitigável por reputação e anomalia (mesma lógica anti-Sybil), não eliminável em P2P puro. Declarado.
2. Qualidade de segmentação depende da vantagem observacional do agente (mesmo limite do ranking de feed, RFC-016).
3. Atribuição de conversão é probabilística, não prova — modelada como estimativa declarada.
4. **Brand safety:** controlar ao lado de que conteúdo um anúncio aparece é limitado em rede aberta/P2P — a seleção roda no device do espectador (RFC-015 A.3.2) e o anunciante não escolhe vizinhança item a item. Mitigável por regras de exclusão na campanha, não garantível.
5. **Distinção orgânico × patrocinado** depende de cliente honesto na renderização: o rótulo "patrocinado" (A.2.3) é requisito de produto, mas um cliente adversário pode omiti-lo localmente — a integridade é social/reputacional, não criptográfica.
6. **Verificabilidade de métrica:** impressão/clique medidos no device são tão confiáveis quanto o device; auditoria de terceiro independente (como no mercado tradicional) não é nativa em P2P puro — fica para a modalidade gerenciada com medição no operador.

## A.6 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-AD-01..03 |

**T-AD-01** `SPEC:AD`/`AD_CAMPAIGN` + `RELATES:AD:PROMOTES` + orçamento/pacing por `BALANCE_STATE`/`LOCK` (DoD Protocolo/core); **T-AD-02** seleção de anúncio por superfície (Zen lance×relevância×pacing) rodando no contexto do espectador + medição assinada de evento; **T-AD-03** vetores adversariais (§0.1.7): segmentação tentando ler dado restrito (rejeição), verba estourada não veicula, clique inflado detectado por anomalia.
