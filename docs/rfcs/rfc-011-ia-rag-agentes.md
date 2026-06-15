# RFC-011 — IA, RAG e Agentes de Plataforma
> **Status:** Proposta
> **Precedência:** cabalga no substrato da `RFC-010` (inferência = utilitário `compute`; execução local/peer/external/fila já resolvida lá) e na `RFC-008` (agente gera `SPEC:PAGE`). Estende `caderno-3-sdk/01-sqlite-and-projections-schema.md` (nova projeção vetorial, irmã do FTS) e formaliza as lacunas de RAG-readiness levantadas na exploração do EpochDB. Onde não tocada, a doc vigente prevalece. Pré-requisito de qualquer experiência assistida por IA nos produtos (011+).
> **Escopo:** esta RFC **não** redefine execução de IA (isso é RFC-010); define o *substrato de recuperação* (embeddings, índice vetorial, RRF/GraphRAG, supersessão) e a *persona de agente* (delegação, teto de abuso, geração de UI).

## A.1 — Inferência como utilitário de computação (sem mecânica nova)

**Resolve:** ancorar IA no protocolo existente para não duplicar lógica de execução.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/13-ia-rag-e-agentes.md` | novo | Documento canônico, §1 |
| `docs/conceitos/utilitario-de-ia.md` | novo verbete | LLM/embedding/transcrição como capacidades `compute` |

**Texto normativo:**

1. Todo modelo (LLM, embedding, transcrição, classificação, visão) é uma **capacidade `compute`** da RFC-010: contrato tipado, flag de determinismo (IA = não-determinística → confiança por assinatura, RFC-010 A.5.4), classe de privacidade (RFC-010 A.6).
2. Os três sites e os dois modos vêm prontos da RFC-010: IA on-device quando o runtime permite; síncrona em peer que anuncia o modelo via [[serves]]; via conector `external` (classe E) para API de provedor; ou na fila assíncrona para lotes (embeddings em massa, sumarização de acervo).
3. IA **não é privilégio especial**: convive com utilitários determinísticos (codec, OCR de regra fixa) no mesmo paradigma — esta RFC só acrescenta o que é específico de *recuperação* e *agência*.

## A.2 — Substrato de embeddings (irmão do FTS)

**Resolve:** onde e quando vetores são gerados, fechando a lacuna de "estratégia de embedding por tipo de nó".

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/13-ia-rag-e-agentes.md` | §2 | Adicionar |
| `caderno-3-sdk/01-sqlite-and-projections-schema.md` | §projeções | Editar: adicionar **7ª projeção** `vector_index` (sqlite-vec/WASM), irmã de `search_index_fts` |

**Texto normativo:**

1. A `SPECIFICATION` do nó declara campos `embeddable: true` (irmão de `searchable: true`), e **qual capacidade de embedding** usar por tipo de conteúdo (texto, código, imagem) — a "estratégia de embedding por tipo de nó".
2. **Mesmo ponto do pipeline que o FTS:** embeddings são computados quando o payload é decifrado pelo Crypto Worker (onde `search_index_fts` já é populado — caderno-3/01), invocando a capacidade `compute` de embedding (preferencialmente on-device, modo assíncrono para lotes). Plaintext de campo restrito nunca vai a embedding `external` (RFC-010 A.6).
3. **`vector_index` é a 7ª projeção**, mantida pelo mesmo regime das demais (derivada, reconstruível, local). Vetor de campo cifrado/sem-chave não é gerado (coerente com [[predicado-de-bloqueio]]).
4. **Regime de indexação configurável no edge:** a geração de embedding pós-decifra é eager por padrão, mas o runtime expõe política por dispositivo — `proativa` (indexa ao decifrar) ou `sob-demanda` (indexa o conteúdo só quando alcançado por busca) — e suspende o RAG indexer sob restrição de recurso (bateria/CPU baixa), retomando depois. Coerente com A.6.1: ausência de recurso degrada, não força resposta.
5. **Ciclo de vida casado com a origem:** entradas do `vector_index` seguem a vigência e as políticas de retenção/arquivamento do nó de origem — vetor de nó expurgado/arquivado é descartado junto, evitando inchaço da projeção. Como projeção derivada e reconstruível, pode ser podada e reconstruída sob demanda.

## A.3 — Recuperação híbrida: RRF + GraphRAG

**Resolve:** o pipeline de retrieval, fechando "pipeline RRF" e "GraphRAG nativo".

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/13-ia-rag-e-agentes.md` | §3 | Adicionar |
| `docs/conceitos/recuperacao-hibrida.md` | novo verbete | RRF sobre FTS + vetor + traversal |

**Texto normativo:**

1. Recuperação combina três sinais por **Reciprocal Rank Fusion (RRF)**: léxico (`search_index_fts`), semântico (`vector_index`) e **estrutural** (traversal de arestas a partir dos candidatos) — este último é o que torna o RAG *nativo do grafo* (GraphRAG): o contexto recuperado não é só "documentos parecidos", mas a vizinhança de relações (quem assinou, o que supersede, a que `SPEC` obedece).
2. **Permissão na recuperação:** o retrieval roda com as capacidades do principal — só recupera nós que o principal poderia ler (mesma fronteira de A.2.3 e das fontes da RFC-008). IA não fura `predicado-de-bloqueio`.
3. **Bypass escalar via projeções SQLite:** consultas que são filtro/agregação determinística (contagem, soma, status) **não passam por IA** — resolvem-se nas projeções relacionais, reservando RRF para busca semântica/aberta. Otimização registrada na exploração EpochDB.
4. **Traversal ancorado em projeções, não em JOIN recursivo *ad hoc*:** o sinal estrutural do RRF (A.3.1) resolve-se sobre projeções relacionais já materializadas (Views/índices das projeções SQLite), e não por travessia recursiva em runtime, mantendo o GraphRAG dentro do orçamento de latência. *Paths* de relação recorrentes podem ser materializados como projeção derivada adicional, sob o mesmo regime (reconstruível, local).

## A.4 — Controle de supersessão para agentes

**Resolve:** o que um agente "enxerga" do grafo append-only, fechando "supersession control for agents".

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/13-ia-rag-e-agentes.md` | §4 | Adicionar |

**Texto normativo:**

1. **Default: só heads vigentes.** Recuperação e contexto de agente expõem, por padrão, apenas as versões correntes (`entity_heads`), nunca a linhagem inteira — evita que o agente raciocine sobre fatos revogados/superados como se valessem.
2. **Linhagem sob pedido explícito:** consultas de auditoria/histórico (RFC-009 A.3 recálculo, trilha contábil) acessam versões superadas explicitamente; o agente só vê o passado quando a tarefa o pede, com a vigência marcada.
3. Resultado de IA que vira fato no grafo (sumário, classificação publicada) é nó assinado pela persona do agente (A.5) e **ele próprio supersedível** — IA não cria fatos imutáveis privilegiados.

## A.5 — Agente como persona: delegação e teto de abuso

**Resolve:** o que um agente pode fazer e por que é seguro, fechando o elo com RFC-008 (geração de UI).

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/13-ia-rag-e-agentes.md` | §5 | Adicionar |
| `docs/conceitos/agente-de-ia.md` | novo verbete | persona delegada + escopo |

**Texto normativo:**

1. Um **agente de IA** atua no grafo exclusivamente via `CONTENT:INTENT`, com `ASSET:ROLE` **delegado e escopado** pelo principal que o instanciou. Teto de abuso idêntico ao da linguagem de páginas (RFC-008 A.5): **o agente não consegue fazer nada que seu principal não pudesse fazer** — todo intent passa pelo pipeline normal de permissões e validadores.
2. **Delegação explícita e revogável:** o escopo do agente (quais tipos de nó pode propor, quais valores-limite, por quanto tempo) é declarado no `ASSET:ROLE`; revogação segue o mecanismo normal ([[revogacao-por-cortesia]] onde aplicável). Distinção do [[agente-de-sistema]]: este atua em nome da plataforma (validador/oráculo); o agente de IA atua em nome de um usuário.
3. **Geração de UI (caso Lovable):** o agente produz documentos `SPEC:PAGE` (RFC-008) guiado pelos metadados do catálogo (RFC-006 A.3) e publica via intent, sujeito ao validador estático da RFC-008 A.7 — UI gerada por IA é segura pela mesma construção que qualquer página de terceiro, não por confiança no modelo.
4. **Trilha de proveniência:** todo fato publicado por agente registra o modelo/capacidade usada e o principal delegante — auditabilidade de "qual IA propôs isto, em nome de quem".

## A.6 — Limites honestos

**Resolve:** registrar onde a IA falha por construção, fiel à doutrina §0.1.7 do plano.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/13-ia-rag-e-agentes.md` | §6 | Adicionar |

**Texto normativo:**

1. IA on-device é limitada pelo hardware do dispositivo; ausência de runtime/recurso → degrada para peer/external/fila ou indisponibilidade declarada, nunca resposta forjada.
2. Recuperação só alcança o que o principal pode ler e o que está sincronizado localmente; lacuna de sync = lacuna de contexto, sinalizada, não inventada.
3. Saída não-determinística não é verificável por re-execução (ao contrário de utilitário determinístico, RFC-010 A.5.4); confiança vem de assinatura + revisão humana onde o fluxo exigir (ex.: SPEC pode exigir `APPROVED_BY` humano antes de fato proposto por IA virar efetivo).

## A.7 — Command palette: entrada de IA, busca e ação

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/13-ia-rag-e-agentes.md` | §7 | Adicionar |
| `docs/conceitos/command-palette.md` | novo verbete | superfície única de intenção em linguagem natural |

**Texto normativo:**

1. A **command palette** (a camada de overlay do shell — RFC-026 A.8) é a superfície primária de invocação de IA: o usuário descreve a intenção em linguagem natural e o sistema resolve para um de três caminhos — **busca** (recuperação híbrida A.3), **ação** (emite `CONTENT:INTENT`, validado pelo pipeline normal) ou **geração** (agente A.5 produz/edita `SPEC:PAGE`/`SPEC:WORKFLOW`).
2. **Geração-por-IA à la Lovable** entra por aqui: a palette aciona o agente (A.5), que gera o documento guiado pelos metadados do catálogo (RFC-006 A.3), publica via intent sujeito ao validador (RFC-008 A.7), com **render progressivo por streaming** (RFC-008 A.7). A UI gerada é segura pela mesma construção de qualquer página de terceiro, não por confiança no modelo.
3. **Sem privilégio novo:** a palette opera com a persona/permissões do usuário; classificar intenção e gerar conteúdo não eleva acesso. Ação proposta acima do privilégio é recusada pelo pipeline.
4. Divisão com o shell: a *superfície* (palette, atalho Cmd/Ctrl-K, overlay) é da RFC-026; o *comportamento de IA* (classificação de intenção, geração, recuperação) é desta RFC.
5. **Classificação barata primeiro:** a resolução de intenção (busca/ação/geração) usa heurísticas fortes ou um classificador on-device de pequeno porte antes de recorrer a um LLM robusto (`external`); o modelo caro só é acionado quando a heurística/SLM não resolve. Coerente com A.1.2 (preferência on-device) e A.6.1.

## A.8 — Preparativos no plano

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | preparativos de módulos | Adicionar T-IA-01..06 |

**T-IA-01** projeção `vector_index` (sqlite-vec/WASM) + geração de embedding no pipeline pós-decifra, irmã do FTS (DoD Protocolo/core); **T-IA-02** capacidades `compute` de embedding e LLM como plugins (on-device + conector external), reusando RFC-010; **T-IA-03** recuperação híbrida RRF (FTS+vetor+traversal) com filtro de permissão + bypass escalar; **T-IA-04** persona de agente com `ASSET:ROLE` delegado/escopado + geração de `SPEC:PAGE` validada; **T-IA-05** classificação de intenção da command palette (busca/ação/geração) + render progressivo; **T-IA-06** vetores adversariais (§0.1.7): agente propondo acima do escopo, recuperação tentando furar bloqueio, embedding de campo restrito roteado a external, agente raciocinando sobre fato superado, palette gerando ação acima do privilégio — todos com recusa/contenção comprovada.
