---
id: T-WASM-03
title: "SPIKE: perfil da fronteira JS-Wasm no Automerge Repo"
status: ready
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-403", "T-602"]
blocks: []
capacity_target: opus-spike
---

# T-WASM-03 · SPIKE: perfil da fronteira JS-Wasm no Automerge Repo

## 0. Ambiente de Execução Obrigatório
- **Código observado:** `C:\Dev2026\superapp`, somente após T-403/T-602 integradas.
- **Runtimes:** Chromium e Node 22+; Automerge/Automerge Repo nas versões realmente instaladas.
- **Capacidade-alvo:** `opus-spike`; PoC em `C:\tmp\t-wasm-03-automerge-boundary`.

## 1. Objetivo
Perfilar o fluxo real `Automerge Repo → núcleo Rust/Wasm → Sync Worker → TinyBase` antes de propor
qualquer port. Identificar se o custo dominante está em `applyChanges/save/load/sync`, no formato
dos documentos, em alocações, em `postMessage`/clone ou na frequência de chamadas JS↔Wasm.

## 2. Contexto RAG
- `docs/adr/adr-001-automerge-unico.md`.
- `docs/conceitos/automerge-repo.md`.
- `docs/caderno-2-protocol/04-automerge-integration-spec.md`.
- `docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md` §§1–2.
- `tasks/T-403.md` e `tasks/T-602.md` — implementação real a medir.
- Automerge core commit [`b4a1bbe`](https://github.com/automerge/automerge/tree/b4a1bbe9fc17d26c4d3f1819f9ee3b318de3a516)
  (release v3.3.2):
  [`javascript/src/index.ts`](https://github.com/automerge/automerge/blob/b4a1bbe9fc17d26c4d3f1819f9ee3b318de3a516/javascript/src/index.ts)
  é a superfície JS; os crates/módulos sob [`rust`](https://github.com/automerge/automerge/tree/b4a1bbe9fc17d26c4d3f1819f9ee3b318de3a516/rust)
  comprovam que o núcleo já é Rust/Wasm. Não reescrever o núcleo.
- Automerge Repo commit [`281ebc0`](https://github.com/automerge/automerge-repo/tree/281ebc0ef7a6a6c8e984da3831ddc1dba1fd401c):
  [`Repo.ts`](https://github.com/automerge/automerge-repo/blob/281ebc0ef7a6a6c8e984da3831ddc1dba1fd401c/packages/automerge-repo/src/Repo.ts),
  [`DocHandle.ts`](https://github.com/automerge/automerge-repo/blob/281ebc0ef7a6a6c8e984da3831ddc1dba1fd401c/packages/automerge-repo/src/DocHandle.ts),
  [`StorageAdapterInterface.ts`](https://github.com/automerge/automerge-repo/blob/281ebc0ef7a6a6c8e984da3831ddc1dba1fd401c/packages/automerge-repo/src/storage/StorageAdapterInterface.ts) e
  [`NetworkAdapterInterface.ts`](https://github.com/automerge/automerge-repo/blob/281ebc0ef7a6a6c8e984da3831ddc1dba1fd401c/packages/automerge-repo/src/network/NetworkAdapterInterface.ts)
  delimitam repo, documento, storage e transporte. Snapshot é referência; medir a versão instalada.

## 3. Cenários Obrigatórios
1. Documento pequeno, médio e grande com edições realistas; registrar bytes/changes, não só contagem.
2. `applyChanges`, `save`, `load`, sync incremental e consolidação do limiar definido pela SPEC.
3. 1, 10 e 100 peers simulados; “milhares” só entram se o produto tiver cenário documentado.
4. Chamadas individuais versus batching no mesmo contrato, sem alterar semântica.
5. `postMessage` com clone estruturado versus Transferable quando o tipo permitir.
6. Trace de Main Thread/Sync Worker e memória; medir jank e backlog de mensagens.

## 4. Critérios de Evidência
- Perfis capturados no build de produção e com warm-up.
- ≥30 repetições por cenário determinístico; p50/p95 e bytes processados.
- Decomposição percentual: núcleo Automerge, binding JS/Wasm, worker messaging e trabalho da aplicação.
- Só abrir task de otimização se fronteira/mensageria representar >20% do trace ou se o fluxo perder
  o SLO de interação/commit fixado no endurecimento.
- Primeira alternativa a testar é batching/redução de crossings; Wasm-MT exige spike próprio.

## 5. Não Fazer / Pegadinhas
- NÃO portar `automerge-repo` para Rust nesta task.
- NÃO mover regra de domínio para o CRDT; estados não-comutativos continuam fora do Automerge.
- NÃO medir documento sintético de strings repetidas como único corpus.
- NÃO atribuir a Wasm tempo gasto em serialização/clone sem perfil que separe os dois.
- NÃO otimizar `save()` isoladamente ignorando frequência governada pela SPEC.
- Harness deve registrar versões resolvidas e instrumentar símbolos reais de `DocHandle`/`Repo`; um
  benchmark que chama apenas `automerge-wasm` diretamente não mede o fluxo do produto e deve falhar.

## 6. Feedback de Especificação
Reendurecer após T-403/T-602 `done`, citando versões, paths, limiares de consolidação e SLO reais.
Até lá, esta task fica triada e não bloqueia o caminho funcional.

## 7. Definition of Done
- [ ] Perfis e tabela de cenários com percentuais por camada (núcleo Automerge / binding JS⁠/⁠Wasm / worker messaging / trabalho da aplicação).
- [ ] Veredito `sem ação | batching | transferable | mudança de modelo de documento | novo spike` com limiar quantitativo (>20% de trace).
- [ ] Nenhum fork/port do Automerge criado.
- [ ] Gatilho quantitativo para reavaliar se resultado for NO-GO.
- [ ] Versoões resolvidas registradas: `@automerge/automerge` e `@automerge/automerge-repo` do lockfile real.
- [ ] Harness usa símbolos reais de `DocHandle`/`Repo` (não `automerge-wasm` direto).

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
# Nota: spike gera relatório, não um pacote publicado. O gate de lint/build aplica ao harness do spike:
pnpm --filter <pacote-do-harness-em-tmp> build
pnpm --filter <pacote-do-harness-em-tmp> test
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem
> a tabela de cenários e o veredito colados na Seção 8. Marcar `[x]` sem evidência é violação.

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.

- **[2026-07-15T18:56]** - *gpt-5* - `[Triado]`: Spike da fronteira JS-Wasm do Automerge triado; reendurecer após T-403 e T-602.
- **[2026-07-18T11:32]** - *gemini* - `[Endurecido]`: reendureceu spike: adicionado DoD detalhado e gate de evidencia; T-403 e T-602 sao done
- **[2026-07-18T11:32]** - *system* - `[Auto-promovida]`: deps todas done
