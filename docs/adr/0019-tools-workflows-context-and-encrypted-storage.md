# ADR 0019 — Tools atômicas, workflows compostos, contexto canônico e compactação cifrada

- **Status:** Aceita (2026-07-21)
- **Decisor:** Israel (arquiteto da plataforma)
- **Contexto:** Estaleiro e SuperApp; consolida extensibilidade, memória/retrieval, contexto de agentes, armazenamento e compactação.
- **Relacionadas:** ADR 0009, ADR 0010, ADR 0013, ADR 0014, ADR 0015 e ADR 0016; `docs/especificacao-estaleiro.md`; caderno-3 SDK §§01, 02, 30 e 31.

---

## 1. Precedência e escopo

Esta é a fonte canônica para as decisões transversais abaixo. Ela estende as ADRs 0013/0014 (delegação e orquestração), 0015 (GraphStore) e 0016 (FlowGrid), sem substituir contratos que não conflitam.

Em caso de conflito, prevalecem as regras desta ADR sobre: (a) qualquer descrição de sub-workflow como nó nativo; (b) qualquer descrição do filesystem como repositório canônico do produto; (c) qualquer proposta de comprimir ciphertext; e (d) qualquer proposta de adotar integralmente um repositório externo analisado.

O repositório `Docs` continua sendo a fonte de especificações durante a construção. A regra de armazenamento desta ADR descreve o produto final, não a ferramenta temporária que hospeda estas especificações.

---

## 2. Decisão A — Tool é a unidade universal de capacidade

Uma **Tool** é uma capacidade atômica, versionada, com schema de entrada/saída, efeitos, permissões, orçamento e trilha de auditoria declarados. A mesma Tool é invocável por nó de workflow, MCP, ação/botão/função de página e agente autorizado.

O registry é a fonte única da identidade da Tool. Adaptadores de MCP, Workflow e UI não recriam lógica nem inventam contratos paralelos.

Toda Tool declara, no mínimo em seu metadado lógico:

- identidade e versão;
- schema de entrada e saída;
- efeitos (`read`, `write`, `network`, `process`, `gpu` ou equivalente);
- idempotência e prazo;
- capabilities/permissões requeridas;
- classificação de privacidade e política de auditoria;
- variantes de runtime disponíveis.

O contrato TypeScript concreto pertence ao pacote que detém o registry; esta ADR fixa a semântica, não uma assinatura prematura.

### 2.1 Runtime

A escolha de implementação segue esta ordem:

1. script/TS determinístico in-process, quando suficiente;
2. WASM para kernel CPU-bound, puro e reutilizável entre browser e Node;
3. binding nativo in-process se vencer benchmark no runtime específico;
4. conector/processo local para software cuja fronteira natural já é processo;
5. API externa somente como último recurso ou política explícita.

WASM é preferível a sidecar, mas não a uma implementação simples já adequada nem a navegador, LSP, servidor de assinatura ou runtime GPU.

---

## 3. Decisão B — Workflows se compõem pela Tool `invoke_workflow`

O Zen Engine permanece puro: decide o próximo comando; o orquestrador assíncrono executa a Tool e realimenta o envelope, conforme ADR 0014.

Não existe nó nativo `workflowRef` nem tipo especial de sub-workflow. A composição usa a Tool canônica **`invoke_workflow`**, já prevista em `docs/especificacao-estaleiro.md` §§1 e 3 e na ADR 0016. Um workflow filho é chamado pela mesma superfície que página, MCP ou agente usam.

Antes de iniciar, `invoke_workflow` valida:

- workflow alvo e versão resolvida;
- schema de entrada;
- capabilities: o filho nunca recebe mais autoridade que o chamador;
- orçamento, deadline e `correlationId` herdados;
- profundidade máxima e ausência de ciclos;
- idempotência e observabilidade do run.

Repetição no FlowGrid é expressa por essa Tool com orçamento explícito; ela não cria back-edge no grafo visual. A Tool é a unidade auditável de invocação e o workflow é a política composta.

---

## 4. Decisão C — Nodes no banco são o armazenamento canônico do produto

Documentação, contexto, skills, regras de negócio e textos Markdown do produto vivem como conteúdo versionado de nodes no banco/GraphStore. Markdown é rendition textual do conteúdo, não repositório canônico no filesystem.

O banco canônico preserva node, versão/linhagem, relações, permissões, payload cifrado quando a política exigir, proveniência, hash, tempo e retenção. FTS, vetores, grafo de retrieval, embeddings, resumos e índices de código são projeções locais, derivadas e reconstruíveis a partir dos nodes autorizados.

Continuam existindo Tools de filesystem. Elas são adapters de ingestão, busca e exportação: podem indexar repositórios locais, importar documentos e devolver resultados a workflows, mas não definem a fonte de verdade do produto.

---

## 5. Decisão D — Contexto é um artefato explícito e reversível

O output de retrieval/preparação para agentes é um **ContextBundle** auditável, não concatenação implícita de strings. Cada item conserva referência ao node/versão e hash de origem, tipo, idioma, autoridade/freshness, permissões, custo estimado em tokens, cadeia de transformações, referência de CCR e rastreio de retrieval/orçamento.

Preparação de contexto é workflow modular. Exemplos legítimos:

```text
context.prepare.local-native
context.prepare.local-en
context.tool-output
context.rag-pack
context.compact-session
```

RTK opera na fronteira de shell e na filtragem de saída de comando; não é compressor genérico de texto documental. Tradução só incide sobre narrativa autorizada, nunca sobre símbolos, paths, hashes, IDs, blocos de código ou citações literais.

Compressão estrutural, extrativa, nano-sumarização, tradução, CCR e ajuste de orçamento são Tools separadas; uma API composta existente pode sobreviver como fachada/workflow de compatibilidade.

---

## 6. Decisão E — Memória e retrieval são derivados e temporalmente governados

O desenho absorve GraphRAG sem tornar uma base externa opaca a fonte de verdade. Tools de ingestão/retrieval incluem normalização, chunking, deduplicação, embedding, extração e validação de entidades/relações, FTS, busca vetorial, traversal, RRF, filtro de permissões, proveniência, confiança, validade temporal, supersession e esquecimento.

Memória de sessão e memória durável são categorias distintas. A promoção para longa duração é workflow explícito, auditável e sujeito a política; nenhum agente converte saída transitória em conhecimento canônico silenciosamente.

O grafo derivado aponta sempre para nodes/versionamentos canônicos no banco. Ontologias são declaradas por domínio/plugin; a extração por modelo pode sugerir fatos, mas scripts, schemas e políticas validam a aceitação.

---

## 7. Decisão F — Compactação de conteúdo cifrado ocorre no Crypto Worker

Ciphertext AEAD tem entropia próxima de aleatória e não é corpus útil para compressão. Para nodes existentes e cifrados, a ordem obrigatória é:

```text
validar autorização/integridade
→ decifrar em lote no Crypto Worker
→ transformação reversível/delta encoding
→ compressão
→ cifrar o resultado com AEAD
→ persistir o novo blob cifrado
```

Nunca se tenta obter ganho comprimindo ciphertext diretamente.

### 7.1 Retenção e pack de linhagem

O GC mantém os três estados definidos no caderno-3 SDK/02:

```text
integral → compressed → pruned
```

Pins, retenção regulatória, integridade de linhagem e restrições de bateria prevalecem sobre economia de espaço.

Versões superadas são o alvo prioritário. O Crypto Worker decifra N versões autorizadas, aplica delta encoding reversível contra uma versão-base, comprime o conjunto e cifra o pack como blob AEAD da época atual.

Invariantes:

- bytes originais assinados sobrevivem byte a byte após desempacotamento; nunca reserializar/reassinar a versão histórica;
- heads vigentes ficam quentes e fora do pack;
- o pack é unidade fria, indexada por hash;
- hash do ciphertext e tag AEAD são verificados antes de decifrar/descomprimir;
- perda de deduplicação convergente cross-usuário é aceitável para arquivo privado;
- compressão antes da cifra revela tamanho relativo: esse formato é at-rest privado e nunca canal interativo sujeito a CRIME/BREACH.

Para archive criado de dados autorizados já em claro, a ordem é `serializar → comprimir → cifrar`. Isso é distinto de reempacotar conteúdo que já estava cifrado.

---

## 8. Decisão G — Orquestração multiagente é política mensurável

Modelos não são o mecanismo primário de controle. Workflows preferem scripts e validadores determinísticos; modelos locais/especialistas e baratos fazem classificação, tradução, extração ou crítica estruturada. Modelo maior é escalonamento explícito diante de ambiguidade, falha de gate ou dissenso persistente.

As primitives reutilizáveis são classificação, seleção de modelo/equipe, reserva de orçamento, invocação de candidato, verificação, comparação, síntese, acordo/dissenso e proveniência. Estratégias como `best-of-n`, crítica/reparo, painel de especialistas ou debate são workflows versionados — não Tools monolíticas — e precisam provar ganho por custo no laboratório.

---

## 9. Repositórios externos: posição de adoção

Os commits, paths locais ignorados e módulos de referência estão fixados em
[`docs/referencias-codigo-aberto.md`](../referencias-codigo-aberto.md). A task que absorver uma
ideia lê o clone local no commit registrado, verifica a licença e registra no handover o trecho
consultado; nunca depende de `main` remoto mutável.

| Referência | Valor absorvido | Posição |
| --- | --- | --- |
| Cognee | memória, GraphRAG e temporalidade | `docs/_vendor/cognee`; contratos e algoritmos locais, não runtime inteiro |
| Collective Intelligence | estratégias e verificação coletiva | `docs/_vendor/collective-intelligence`; workflows próprios, sem incorporar AGPL |
| Headroom / LLMLingua | crusher, CCR e compressão extrativa | `docs/_vendor/headroom-upstream`, `docs/_vendor/llmlingua`; capacidades próprias em `plugin-context` |
| Dashi | catálogo, inspeção e spec restrita | `docs/_vendor/dashi-ppt-skill`; UI spec-driven clean-room |
| Archify | IR validado, layout e render | `docs/_vendor/archify`; spike/Tools próprias |
| OpenZL | compressão format-aware | `docs/_vendor/openzl`; decisão por benchmark por corpus |
| Lightpanda | browser CDP leve | `docs/_vendor/lightpanda-browser`; adapter com fallback, processo local legítimo |
| DocuSeal | assinatura e evidência | `docs/_vendor/docuseal`; connector/service boundary após discovery jurídico |
| BiGain | aceleração de difusão | `docs/_vendor/bigain`; pesquisa bloqueada e separada de contexto/RAG |
| Serena/tree-sitter | recuperação semântica de código | `docs/_vendor/serena`, `docs/_vendor/tree-sitter`; WASM para parsing, LSP local para semântica |

Licença, maturidade e commit de referência são verificados na task concreta antes de qualquer reuso de código. Inspiração arquitetural não autoriza cópia de implementação.

---

## 10. Consequências e migração

1. `invoke_workflow` torna UI, MCP e workflows consumidores do mesmo contrato.
2. `plugin-knowledge` evolui de corpus markdown-first de desenvolvimento para projeções sobre nodes canônicos, preservando adapters de filesystem.
3. `plugin-context` evolui para Tools atômicas e `ContextBundle`, mantendo fachadas compatíveis se houver consumidores.
4. RAG híbrido recebe projeções e conteúdo liberados pela política de autorização.
5. Armazenamento frio implementa pack/reidratação no Crypto Worker sem expor plaintext a UI, filesystem desprotegido ou processo externo.
6. Tarefas de UI, memória, orquestração coletiva, compressão e retrieval referenciam esta ADR e respeitam sua cadeia de dependências.

---

## 11. Fontes normativas resgatadas

- `docs/especificacao-estaleiro.md` §§1 e 3 — Tools, `invoke_workflow` e contexto por workflows.
- `docs/adr/0014-contrato-orquestrador-declarativo.md` §§D1–D3 — Zen decide; orquestrador executa.
- `docs/adr/0016-ui-engines-e-flow-grid.md` — FlowGrid sem ciclos e repetição por `invoke_workflow`.
- `docs/caderno-3-sdk/01-sqlite-and-projections-schema.md` §§4–5 — nodes/edges como destino, FTS e vetores derivados no caminho pós-decifra.
- `docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md` §4.1 — `integral → compressed → pruned` e pack de linhagem no Crypto Worker.
- `tasks/T-313a.md` — archive existente: serializar, zstd, AES-256-GCM e verificação de integridade.
- `tasks/T-CMP-01.md` — benchmark por corpus, medido antes de cifrar e depois de decifrar.
