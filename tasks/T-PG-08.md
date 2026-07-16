---
id: T-PG-08
title: "Sessão colaborativa e propostas de IA no editor visual"
status: draft:triaged
complexity: 5
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PG-07", "T-MOD-03", "T-IA-04"]
blocks: []
capacity_target: opus-spike
ui: true
---

# T-PG-08 · Sessão colaborativa e propostas de IA no editor visual

## 0. Ambiente de Execução Obrigatório
- **Repo:** `C:\Dev2026\superapp`, worktree `task/T-PG-08`.
- **Runtime:** browser real/React; `@plataforma/pages`; contratos colaborativos de T-MOD-03.
- **Capacidade-alvo:** `opus-spike` no endurecimento JIT.

## 1. Objetivo
Integrar ao `PageEditor` uma sessão efêmera colaborativa e propostas de edição produzidas pelo agente.
Edições locais/remotas convergem por Automerge; propostas de IA aparecem como patch revisável e só
entram no documento após aceite explícito. Persistir/publicar é uma ação separada, opt-in e auditável.

## 2. Contexto RAG
- `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §§7–8.
- `docs/especificacao-estaleiro.md` — autoria assistida e responsabilidade humana.
- `tasks/T-PG-07.md` — editor visual consumidor.
- `tasks/T-MOD-03.md` — sessão Automerge efêmera e persistência opt-in.
- `tasks/T-IA-04.md` — geração validada de `SPEC:PAGE`.
- Automerge core, snapshot
  [`b4a1bbe`](https://github.com/automerge/automerge/tree/b4a1bbe9fc17d26c4d3f1819f9ee3b318de3a516), especialmente
  [`javascript/src/index.ts`](https://github.com/automerge/automerge/blob/b4a1bbe9fc17d26c4d3f1819f9ee3b318de3a516/javascript/src/index.ts).
- Automerge Repo, snapshot
  [`281ebc0`](https://github.com/automerge/automerge-repo/tree/281ebc0ef7a6a6c8e984da3831ddc1dba1fd401c), especialmente
  [`Repo.ts`](https://github.com/automerge/automerge-repo/blob/281ebc0ef7a6a6c8e984da3831ddc1dba1fd401c/packages/automerge-repo/src/Repo.ts),
  [`DocHandle.ts`](https://github.com/automerge/automerge-repo/blob/281ebc0ef7a6a6c8e984da3831ddc1dba1fd401c/packages/automerge-repo/src/DocHandle.ts) e interfaces de
  [`storage`](https://github.com/automerge/automerge-repo/blob/281ebc0ef7a6a6c8e984da3831ddc1dba1fd401c/packages/automerge-repo/src/storage/StorageAdapterInterface.ts)/
  [`network`](https://github.com/automerge/automerge-repo/blob/281ebc0ef7a6a6c8e984da3831ddc1dba1fd401c/packages/automerge-repo/src/network/NetworkAdapterInterface.ts).
- Dashi [`persist-deck-state.mjs`](https://github.com/chuspeeism/dashi-ppt-skill/blob/16cbc33d6c3f7fca3da6db349bbc244fe1d3d568/skills/dashi-ppt/project/scripts/persist-deck-state.mjs) como referência de estados editáveis; o SuperApp inverte a política de persistência para opt-in.

## 3. Escopo de Arquivos (provisório até dependências done)
- **[READ]** outputs públicos de T-PG-07, T-MOD-03 e T-IA-04.
- **[CREATE]** `packages/pages/src/editor/collaboration/*` — adapter fino entre session/DocHandle e dispatcher.
- **[CREATE]** `packages/pages/src/editor/proposals/*` — estado `pending/accepted/rejected/stale`, diff e ações.
- **[CREATE]** componentes de presença, conflito/proposta e ação Publish usando DS canônico.
- **[UPDATE]** `packages/pages/src/editor/PageEditor.tsx` e barrels públicos.
- **[CREATE]** testes unitários/integração e `packages/pages/e2e/page-editor-collaboration.spec.ts`.
- **[NO CHANGE]** protocolo Automerge, engine de IA, renderer, DS, storage/network adapters.

### Invariantes obrigatórios
- Documento de trabalho nasce efêmero; nenhuma gravação durável ocorre ao abrir/editar/aceitar proposta.
- Publish chama somente a porta opt-in de T-MOD-03 e mostra destino/revisão antes da confirmação.
- Proposta carrega base revision/heads e comandos estruturados; se a base ficou stale, revalidar/rebase
  explícito ou rejeitar — nunca aplicar silenciosamente.
- Aceitar aplica comandos pelo núcleo T-PG-06 e validador canônico; rejeitar não altera documento.
- Eventos distinguem autor humano, peer remoto e agente; prompt/conteúdo sensível não vira telemetria.
- Desconexão mantém edição local e sinaliza estado; reconexão converge sem auto-publicar.

## 4. Estratégia de Testes Estrita
- **Vitest:** proposal lifecycle, stale base, validação, rejeição, publish opt-in e ausência de storage implícito.
- **Integração Automerge:** dois peers editam nós distintos e o mesmo nó; convergência e conflito visível.
- **Playwright obrigatório:** abrir duas páginas/contextos, observar presença/edição, aceitar/rejeitar proposta,
  ficar offline/reconectar e publicar mediante confirmação.
- **Anti-fake:** spy no storage adapter prova zero writes antes de Publish e uma escrita explícita depois.
- **Acessibilidade:** diff/proposta e conflito têm nome/estado acessível, foco e fluxo completo por teclado.
- **Fora de escopo:** novo servidor de sync, modelo de IA, ACL, billing ou persistence automática.

## 5. Instruções de Execução
1. Reendurecer depois das três dependências `done`; fixar assinaturas reais e o harness E2E.
2. Implementar primeiro o anti-fake de persistência e o lifecycle puro de propostas.
3. Integrar Automerge por adapter mínimo; não espelhar o documento em um segundo store.
4. Integrar UI e executar o cenário multi-contexto/offline em Playwright.

### Não fazer / pegadinhas
- NÃO copiar o auto-save do Dashi nem chamar `Repo.flush()`/storage a cada alteração.
- NÃO aplicar texto/JSON bruto do agente; somente comandos/spec validados e revisáveis.
- NÃO resolver conflito com last-write-wins escondido na UI.
- NÃO criar protocolo de sync, CRDT ou sistema de presença próprio.

## 6. Feedback de Especificação
- **JIT obrigatório:** esta task depende de três contratos ainda abertos. O worker não pode iniciar com
  imports hipotéticos; o arquiteto deve substituir esta seção e o escopo pelos símbolos entregues.
- Snapshot OSS é referência de pesquisa, não pin de produção; versão instalada será decidida/registrada
  pela task T-MOD-03.

## 7. Definition of Done
- [ ] Dois peers convergem e conflitos são visíveis/revisáveis.
- [ ] Propostas de IA nunca entram sem aceite e validação.
- [ ] Nenhum write durável ocorre antes de Publish explícito.
- [ ] Browser E2E cobre colaboração, offline/reconnect, proposta e publish.

### Gate de Evidência (fixar filtro no endurecimento JIT)
```bash
pnpm --filter @plataforma/pages build
pnpm --filter @plataforma/pages test
pnpm --filter @plataforma/pages lint
pnpm --filter @plataforma/pages exec playwright test e2e/page-editor-collaboration.spec.ts
```

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração
- **Evidência:** build/test/lint + Playwright multi-contexto + prova anti-write.

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-15T20:18]** - *gpt-5* - `[Triado]`: Colaboração efêmera e propostas de IA triadas; persistência somente por Publish opt-in.
