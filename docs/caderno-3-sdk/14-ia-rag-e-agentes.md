# 14-ia-rag-e-agentes.md — IA, RAG e Agentes de Plataforma

> Fonte: RFC-011 (absorvida e deletada). Cabalga no substrato da RFC-010 (inferência = utilitário `compute`). Estende caderno-3/01 (nova projeção vetorial). Pré-requisito de qualquer experiência assistida por IA nos produtos.

---

## §1 — Inferência como Utilitário de Computação (sem mecânica nova)

1. Todo modelo (LLM, embedding, transcrição, classificação, visão) é uma **capacidade `compute`** da RFC-010: contrato tipado, flag de determinismo (IA = não-determinística → confiança por assinatura, RFC-010 A.5.4), classe de privacidade (RFC-010 A.6).
2. Os três sites e os dois modos vêm prontos da RFC-010: IA on-device quando o runtime permite; síncrona em peer que anuncia o modelo via [[serves-aresta]]; via conector `external` (classe E) para API de provedor; ou na fila assíncrona para lotes (embeddings em massa, sumarização de acervo).
3. IA **não é privilégio especial**: convive com utilitários determinísticos (codec, OCR de regra fixa) no mesmo paradigma — esta RFC só acrescenta o que é específico de *recuperação* e *agência*.
4. **Coordenação de sessão do agente também não é mecânica nova.** Streaming de progresso, resultado de tool-call em andamento e coordenação com outros agentes/plugins durante uma sessão de trabalho reusam [[documento-casca]] + [[ephemeral-messages]] sobre [[automerge-repo]] (trilha transiente única — ADR-001; nenhum motor de CRDT alternativo é introduzido para agentes). Trabalho durável (o resultado que persiste) reusa a **fila assíncrona** de `caderno-3-sdk/12-plugins-e-computacao.md §5` — task-nó, claim por `ASSET:LOCK`, resultado assinado com aresta `PERFORMED_BY`; a retomada do agente chamador ao concluir é um **sinal efêmero** ou **intent durável** endereçado (`caderno-4-governance/02b-modulos-profiles-mensageria.md §2`), não um orquestrador central novo.

---

## §2 — Substrato de Embeddings (irmão do FTS)

1. A `SPECIFICATION` do nó declara campos `embeddable: true` (irmão de `searchable: true`), e **qual capacidade de embedding** usar por tipo de conteúdo (texto, código, imagem) — a "estratégia de embedding por tipo de nó".
2. **Mesmo ponto do pipeline que o FTS:** embeddings são computados quando o payload é decifrado pelo Crypto Worker (onde `search_index_fts` já é populado — caderno-3/01), invocando a capacidade `compute` de embedding (preferencialmente on-device, modo assíncrono para lotes). Plaintext de campo restrito nunca vai a embedding `external` (RFC-010 A.6).
3. **`vector_index` é a 7ª projeção**, mantida pelo mesmo regime das demais (derivada, reconstruível, local). Vetor de campo cifrado/sem-chave não é gerado (coerente com [[predicado-de-bloqueio]]).
4. **Regime de indexação configurável no edge:** a geração de embedding pós-decifra é eager por padrão, mas o runtime expõe política por dispositivo — `proativa` (indexa ao decifrar) ou `sob-demanda` (indexa o conteúdo só quando alcançado por busca) — e suspende o RAG indexer sob restrição de recurso (bateria/CPU baixa), retomando depois. Coerente com A.6.1: ausência de recurso degrada, não força resposta.
5. **Ciclo de vida casado com a origem:** entradas do `vector_index` seguem a vigência e as políticas de retenção/arquivamento do nó de origem — vetor de nó expurgado/arquivado é descartado junto, evitando inchaço da projeção. Como projeção derivada e reconstruível, pode ser podada e reconstruída sob demanda.

---

## §3 — Recuperação Híbrida: RRF + GraphRAG

1. Recuperação combina três sinais por **Reciprocal Rank Fusion (RRF)**: léxico (`search_index_fts`), semântico (`vector_index`) e **estrutural** (traversal de arestas a partir dos candidatos) — este último é o que torna o RAG *nativo do grafo* (GraphRAG): o contexto recuperado não é só "documentos parecidos", mas a vizinhança de relações (quem assinou, o que supersede, a que `SPEC` obedece).
2. **Permissão na recuperação:** o retrieval roda with as capacidades do principal — só recupera nós que o principal poderia ler (mesma fronteira de A.2.3 e das fontes da RFC-008). IA não fura `predicado-de-bloqueio`.
3. **Bypass escalar via projeções SQLite:** consultas que são filtro/agregação determinística (contagem, soma, status) **não passam por IA** — resolvem-se nas projeções relacionais, reservando RRF para busca semântica/aberta. Otimização registrada na exploração EpochDB.
4. **Traversal ancorado em projeções, não em JOIN recursivo *ad hoc*:** o sinal estrutural do RRF (A.3.1) resolve-se sobre projeções relacionais já materializadas (Views/índices das projeções SQLite), e não por travessia recursiva em runtime, mantendo o GraphRAG dentro do orçamento de latência. *Paths* de relação recorrentes podem ser materializados como projeção derivada adicional, sob o mesmo regime (reconstruível, local).

---

## §4 — Controle de Supersessão para Agentes

1. **Default: só heads vigentes.** Recuperação e contexto de agente expõem, por padrão, apenas as versões correntes (`entity_heads`), nunca a linhagem inteira — evita que o agente raciocine sobre fatos revogados/superados como se valessem.
2. **Linhagem sob pedido explícito:** consultas de auditoria/histórico (RFC-009 A.3 recálculo, trilha contábil) acessam versões superadas explicitamente; o agente só vê o passado quando a tarefa o pede, com a vigência marcada.
3. Resultado de IA que vira fato no grafo (sumário, classificação publicada) é nó assinado pela persona do agente (A.5) e **ele próprio supersedível** — IA não cria fatos imutáveis privilegiados.

---

## §5 — Agente como Persona: Delegação e Teto de Abuso

1. Um **agente de IA** atua no grafo exclusivamente via `CONTENT:INTENT`, com `ASSET:ROLE` **delegado e escopado** pelo principal que o instanciou. Teto de abuso idêntico ao da linguagem de páginas (RFC-008 A.5): **o agente não consegue fazer nada que seu principal não pudesse fazer** — todo intent passa pelo pipeline normal de permissões e validadores.
2. **Delegação explícita e revogável:** o escopo do agente (quais tipos de nó pode propor, quais valores-limite, por quanto tempo) é declarado no `ASSET:ROLE`; revogação segue o mecanismo normal ([[revogacao-por-cortesia]] onde aplicável). Distinção do [[agente-de-sistema]]: este atua em nome da plataforma (validador/oráculo); o agente de IA atua em nome de um usuário.
3. **Geração de UI (caso Lovable):** o agente produz documentos `SPEC:PAGE` (RFC-008) guiado pelos metadados do catálogo (RFC-006 A.3) e publica via intent, sujeito ao validador estático da RFC-008 A.7 — UI gerada por IA é segura pela mesma construção que qualquer página de terceiro, não por confiança no modelo.
4. **Trilha de procedência:** todo fato publicado por agente registra o modelo/capacidade usada e o principal delegante — auditabilidade de "qual IA propôs isto, em nome de quem".
5. **Capacidade injetada por plugin não escapa o teto de abuso.** Um agente nasce sem capacidades próprias — mãos, cérebro, contexto são injetados por instâncias de [[plugin]] (`caderno-3-sdk/12-plugins-e-computacao.md`). O `ASSET:ROLE` de um plugin invocado **por** um agente é a interseção com o `ASSET:ROLE` já delegado ao agente (regra 1 acima) — o plugin nunca é usado para escalar além do que o principal já autorizou, mesmo que o plugin, invocado diretamente por outro chamador, tivesse escopo nominal maior. Exemplo: um `fs-plugin` com acesso de leitura/escrita a uma worktree inteira, invocado por um agente cujo `ASSET:ROLE` só permite ler um subconjunto de arquivos, só pode ler esse subconjunto — a interseção governa, não o escopo nominal do plugin.

---

## §6 — Limites Honestos

1. IA on-device é limitada pelo hardware do dispositivo; ausência de runtime/recurso → degrada para peer/external/fila ou indisponibilidade declarada, nunca resposta forjada.
2. Recuperação só alcança o que o principal pode ler e o que está sincronizado localmente; lacuna de sync = lacuna de contexto, sinalizada, não inventada.
3. Saída não-determinística não é verificável por re-execução (ao contrário de utilitário determinístico, RFC-010 A.5.4); confiança vem de assinatura + revisão humana onde o fluxo exigir (ex.: SPEC pode exigir `APPROVED_BY` humano antes de fato proposto por IA virar efetivo).

---

## §7 — Command Palette: Entrada de IA, Busca e Ação

1. A **command palette** (a camada de overlay do shell — RFC-026 A.8) é a superfície primária de invocação de IA: o usuário descreve a intenção em linguagem natural e o sistema resolve para um de três caminhos — **busca** (recuperação híbrida A.3), **ação** (emite `CONTENT:INTENT`, validado pelo pipeline normal) ou **geração** (agente A.5 produz/edita `SPEC:PAGE`/`SPEC:WORKFLOW`).
2. **Geração-por-IA à la Lovable** entra por aqui: a palette aciona o agente (A.5), que gera o documento guiado pelos metadados do catálogo (RFC-006 A.3), publica via intent sujeito ao validador (RFC-008 A.7), com **render progressivo por streaming** (RFC-008 A.7). A UI gerada é segura pela mesma construção de qualquer página de terceiro, não por confiança no modelo.
3. **Sem privilégio novo:** a palette opera com a persona/permissões do usuário; classificar intenção e gerar conteúdo não eleva acesso. Ação proposta acima do privilégio é recusada pelo pipeline.
4. Divisão com o shell: a *superfície* (palette, atalho Cmd/Ctrl-K, overlay) é da RFC-026; o *comportamento de IA* (classificação de intenção, geração, recuperação) é desta RFC.
5. **Classificação barata primeiro:** a resolução de intenção (busca/ação/geração) usa heurísticas fortes ou um classificador on-device de pequeno porte antes de recorrer a um LLM robusto (`external`); o modelo caro só é acionado quando a heurística/SLM não resolve. Coerente com A.1.2 (preferência on-device) e A.6.1.
