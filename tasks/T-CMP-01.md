---
id: T-CMP-01
title: "SPIKE: compressão format-aware para dados estruturados"
status: draft:triaged
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-WASM-03"]
blocks: []
capacity_target: opus-spike
---

# T-CMP-01 · SPIKE: compressão format-aware para dados estruturados

## 0. Ambiente de Execução Obrigatório
- **Código observado:** `C:\Dev2026\superapp`, após T-WASM-03 fornecer corpus e perfil reais do Automerge.
- **Runtimes:** Node.js e Chromium instalados; registrar SO, CPU, memória e versões resolvidas.
- **Capacidade-alvo:** `opus-spike`; entregável = benchmark reproduzível + ADR curta/veredito. Não troca codecs de produção.
- **PoC descartável:** `C:\tmp\t-cmp-01-structured-compression`; não armazenar documentos de usuário nem estado cifrado real.

## 1. Objetivo
Testar se a compressão format-aware do OpenZL entrega ganho líquido para **um** caso de dados estruturados, comparada a codecs simples e maduros. Decidir separadamente para batch/snapshot do Automerge, logs estruturados e snapshot/export de `VectorIndex`; não pressupor um motor único para os três.

## 2. Contexto RAG
- `tasks/T-WASM-03.md` — perfil da fronteira Automerge e corpus/limiares reais antes de otimizar transporte.
- `tasks/T-313.md` e `tasks/T-313a.md` — archive cifrado já usa zstd; não substituir sem ganho medido.
- `tasks/T-308.md` e `docs/adr/0003-snapshot-persistence-model.md` — bootstrap usa gzip como decisão de interoperabilidade.
- `tasks/T-IA-01.md` e `tasks/T-WASM-01.md` — `VectorIndex` é hot-path; apenas snapshot pode ser candidato.
- [OpenZL README](https://github.com/facebook/openzl), [conceitos](https://openzl.org/getting-started/concepts/) e [guia de uso](https://openzl.org/getting-started/using-openzl/) — grafo de compressão, perfil estrutural e APIs em evolução.

## 3. Matriz Obrigatória
Para cada corpus elegível, comparar:

1. Sem compressão, como controle.
2. gzip nativo (`node:zlib`), baseline sem dependência nova e codec de T-308.
3. zstd na configuração real de T-313/T-313a, baseline de archive.
4. Brotli nativo para payloads cujo orçamento de latência permita.
5. OpenZL somente se perfil/SDDL e codec forem reproduzidos a partir de release ou commit fixado no endurecimento.

Corpora mínimos: batches incrementais e snapshots do Automerge observados em T-WASM-03; logs estruturados sintéticos com schema/cardinalidade documentados; e snapshot/export de `VectorIndex` se T-IA-01 existir. Medir tamanho, razão, compressão/descompressão p50/p95, CPU, heap/RSS, cold start, custo do parser/perfil e acesso aleatório. No sync, medir antes de criptografar e depois de descriptografar sem mudar integridade, framing ou semântica CRDT.

## 4. Critérios de Evidência e Decisão
- >=30 repetições após warm-up por célula; seed, dados brutos e hardware registrados.
- Mesmo corpus para todos os codecs; não comparar OpenZL em JSON contra zstd em bytes já compactados.
- `GO` para um caso exige >=20% menor que o melhor baseline simples, sem piorar p95/E2E >10% nem elevar memória >25%.
- Para deltas pequenos, `none`/gzip/zstd vencem se OpenZL dominar latência.
- Para `VectorIndex`, descompressão global em consulta implica `NO-GO` para o índice ativo.
- Fixar licença BSD, release/commit e maturidade de API antes de qualquer task de integração.

## 5. Não Fazer / Pegadinhas
- **NÃO** substituir gzip de bootstrap, zstd de archive ou qualquer wire-format nesta task.
- **NÃO** comprimir ciphertext e concluir sobre dados estruturados; medir plaintext autorizado antes de criptografar.
- **NÃO** adicionar binding nativo/Wasm ao monorepo ou colocar OpenZL no hot-path de `VectorIndex`.
- **NÃO** alegar que OpenZL entende tabelas/JSON automaticamente: registrar schema, parser/perfil e grafo usados.

## 6. Feedback de Especificação
Reendurecer após T-WASM-03 `done`, com corpus, SLO e pontos reais de compressão. Binding incompatível ou integração C/C++ desproporcional é uma célula inviável, não autorização para inventar binding. Decidir primeiro por caso de uso e depois por codec.

## 7. Definition of Done
- [ ] Harness reproduzível com corpora anonimizados/sintéticos e versões fixadas.
- [ ] Tabela `none`, gzip, zstd, Brotli e OpenZL, incluindo células inviáveis com evidência.
- [ ] Medidas de tamanho, tempo, memória e acesso aleatório/E2E com dados brutos preservados.
- [ ] Veredito independente para Automerge, logs e snapshots vetoriais; task posterior só para casos aprovados.

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-16T14:21]** - *gpt-5* - `[Triado]`: Spike OpenZL e codecs alternativos triada; aguarda perfil real do Automerge em T-WASM-03.
