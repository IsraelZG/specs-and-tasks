# Triagem — rfc-011 (IA, RAG e Agentes de Plataforma)

**Fonte:** `docs/rfcs/rfc-011-ia-rag-agentes.md` + `docs/rfc_reviews/review_rfc-011.md`

## Contagens por veredito
- INCORPORAR: 4
- JA-COBERTO: 2
- UI->INVENTARIO: 6
- REJEITAR: 0
- REVISAR-HUMANO: 0
- **Σ achados: 12**

## REVISAR-HUMANO em destaque
> Nenhum. Todos os achados são refinamentos dentro do escopo da RFC ou itens de UI;
> nenhum supersede/contradiz canônico nem cria mecânica nova de ontologia.

---

## Tabela de achados

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 011-01 | §2 — Indexação vetorial roda na decifra (Crypto Worker), gerando carga *on-read* em peers fracos; sugere flag opt-in `Index Only When Searched` vs `Index Proactively` e throttle por bateria/recurso no edge. | INCORPORAR | A.2 (item novo, após A.2.3) | "4. **Regime de indexação configurável no edge:** a geração de embedding pós-decifra é eager por padrão, mas o runtime expõe política por dispositivo — `proativa` (indexa ao decifrar) ou `sob-demanda` (indexa o conteúdo só quando alcançado por busca) — e suspende o RAG indexer sob restrição de recurso (bateria/CPU baixa), retomando depois. Coerente com A.6.1: ausência de recurso degrada, não força resposta." | [x] |
| 011-02 | §2 — GraphRAG por traversal de arestas em Automerge/SQLite vira JOINs recursivos em runtime; *paths* comuns de IA precisam de Views relacionais / índices estruturais para ancorar sem timeout. | INCORPORAR | A.3 (item novo, após A.3.3) | "4. **Traversal ancorado em projeções, não em JOIN recursivo *ad hoc*:** o sinal estrutural do RRF (A.3.1) resolve-se sobre projeções relacionais já materializadas (Views/índices das projeções SQLite), e não por travessia recursiva em runtime, mantendo o GraphRAG dentro do orçamento de latência. *Paths* de relação recorrentes podem ser materializados como projeção derivada adicional, sob o mesmo regime (reconstruível, local)." | [x] |
| 011-03 | §2 — Classificação de intent (Busca×Ação×Geração) da palette gasta calls de IA; pragmático rodar SLM local de poucos parâmetros ou heurísticas fortes antes de delegar a LLM robusto/external. | INCORPORAR | A.7 (item novo, após A.7.4) | "5. **Classificação barata primeiro:** a resolução de intenção (busca/ação/geração) usa heurísticas fortes ou um classificador on-device de pequeno porte antes de recorrer a um LLM robusto (`external`); o modelo caro só é acionado quando a heurística/SLM não resolve. Coerente com A.1.2 (preferência on-device) e A.6.1." | [x] |
| 011-04 | §5 Fim de Vida — Expurgo dos logs vetoriais deve acompanhar TTLs / políticas de arquivamento dos documentos originais, evitando inchaço desproporcional da 7ª projeção. | INCORPORAR | A.2 (item novo, após 011-01) | "5. **Ciclo de vida casado com a origem:** entradas do `vector_index` seguem a vigência e as políticas de retenção/arquivamento do nó de origem — vetor de nó expurgado/arquivado é descartado junto, evitando inchaço da projeção. Como projeção derivada e reconstruível, pode ser podada e reconstruída sob demanda." | [x] |
| 011-05 | §4/§5 Nascimento — RAG ingere o nó após a decifra; LLM formula saídas (SPEC:PAGE ou intents voláteis) a partir do contexto. | JA-COBERTO | A.2.2 (embedding no mesmo ponto do FTS, pós-decifra) + A.5.3 / A.7.2 (geração de SPEC:PAGE) | Descritivo; a RFC já fixa o ponto do pipeline e a geração via agente. Sem texto. | [x] |
| 011-06 | §5 Mutação — Saídas de IA sofrem as mesmas regras de supersessão de outputs humanos; IA não cria verdades intocáveis. | JA-COBERTO | A.4.3 ("Resultado de IA … ele próprio supersedível — IA não cria fatos imutáveis privilegiados") | Restata literalmente A.4.3. Sem texto. | [x] |
| 011-07 | §3 — Command Palette Universal: overlay estilo Spotlight/Raycast, acessível em qualquer tela via Ctrl/Cmd+K. | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Layout — `CommandPaletteOverlay` (organismo · módulo IA/Shell) — overlay global de invocação de IA, atalho Cmd/Ctrl-K. | [x] |
| 011-08 | §3 — Render progressivo de tela na geração por IA: esqueleto com contornos animados enquanto metadados (RFC-006) montam os átomos. | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Layout — `ProgressiveGenerationSkeleton` (organismo · módulo IA) — esqueleto animado durante streaming de geração de página. | [x] |
| 011-09 | §3 — Trilha de "culpa" de agentes: transação assinada por IA brilha diferente; hover revela "Ação por Agente X sob delegação de Maria Silva". | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Molécula — `AgentProvenanceBadge` (molécula · módulo IA) — realce + tooltip de proveniência (modelo + principal delegante). | [x] |
| 011-10 | §3 Atoms — `AgentAvatarIcon`; `RAGScoreChip` (relevância semântica do documento). | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Átomos — `AgentAvatarIcon` (átomo · módulo IA); `RAGScoreChip` (átomo · módulo IA, score de relevância semântica). | [x] |
| 011-11 | §3 Molecules — `OmnibarInput` (placeholders rotativos dinâmicos). | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Molécula — `OmnibarInput` (molécula · módulo IA/Shell) — campo da palette com placeholders rotativos. | [x] |
| 011-12 | §3 Organisms — `LovableUIPreview` (sandbox para aceitar/recusar/alterar a página/fluxo gerado antes do commit ao grafo). | UI->INVENTARIO | `docs/rfcs/inventario-componentes-layouts.md` | Organismo — `LovableUIPreview` (organismo · módulo IA) — sandbox de revisão (aceitar/recusar/editar) de SPEC:PAGE/WORKFLOW antes do intent. | [x] |
