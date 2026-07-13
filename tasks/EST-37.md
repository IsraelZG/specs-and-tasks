---
id: EST-37
title: "Fase 0: boot determinístico e smoke hermético"
status: draft:triaged
complexity: 3
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-22", "EST-33"]
blocks: ["EST-38", "EST-39", "EST-40"]
capacity_target: sonnet
---

# EST-37 · Fase 0: boot determinístico e smoke hermético

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-37`.
- **Runtime:** Node.js 22+ · pnpm · Vitest.
- **Fase:** reparo de fundação; não entrega capacidade de produto e não pode antecipar P1.

## 1. Objetivo
Eliminar o travamento de `startServer()` quando a porta base está ocupada e tornar o smoke do
standalone independente de resíduos de versões anteriores. Ao final, duas instâncias podem subir
sem Promise pendurada e o smoke sempre escolhe o bundle recém-gerado.

## 2. Contexto RAG
- `docs/especificacao-estaleiro.md` §1 (ordem normativa; esta task é Fase 0).
- `docs/playbook/08-recon-arquitetural-adversarial.md` §0, §7 e §10.
- `PITFALLS.md` P-009 e P-010.
- `tasks/EST-22.md` e `tasks/EST-33.md` (bootstrap e E2E standalone).
- **Código real:** `apps/estaleiro/core/src/bootstrap.ts` (`startServer`, `findFreePort`) e
  `apps/estaleiro/tests/estaleiro-smoke.mjs`.

## 3. Escopo de Arquivos
- **[UPDATE]** `apps/estaleiro/core/src/bootstrap.ts` — erro de bind deve rejeitar ou tentar outra
  porta; nenhuma Promise pode permanecer pendurada.
- **[UPDATE]** `apps/estaleiro/core/tests/bootstrap.test.ts` — regressão com porta base ocupada.
- **[UPDATE]** `apps/estaleiro/tests/estaleiro-smoke.mjs` — seleção semântica da versão, nunca
  ordenação lexicográfica de `v0.0.X`.
- **[UPDATE se necessário]** `apps/estaleiro/tests/integration/server.test.ts` e
  `apps/estaleiro/tests/integration/task-api.test.ts` — somente para teardown/porta determinísticos.
- **[NO CHANGE]** providers, workflows, agentes, UI e lifecycle de tasks.

## 4. Estratégia de Testes
1. Com um servidor já escutando em `8899`, uma segunda instância sobe em outra porta e retorna a
   porta real em tempo limitado.
2. Erro final de bind é propagado; o teste não termina por timeout.
3. `stopServer()` libera porta, WebSocket e SQLite.
4. Com diretórios `v0.0.7`, `v0.0.42` e `v0.0.100`, o smoke seleciona a maior versão semântica.
5. Rodar o teste duas vezes consecutivas não deixa processo/porta órfãos.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO aumentar timeouts para mascarar o defeito.
> - NÃO usar porta aleatória no teste para evitar o cenário de colisão.
> - NÃO escolher `estaleiro-run` por `sort().reverse()` lexicográfico.
> - NÃO tocar no lifecycle MGTIA.

1. Escreva primeiro um reprodutor determinístico da colisão de porta.
2. Corrija a causa no servidor, incluindo o ramo de erro de `srv.listen`.
3. Corrija a seleção do bundle no smoke.
4. Prove repetibilidade e teardown.

## 6. Feedback de Especificação
- A estratégia exata de retry (`base+1` limitado ou fallback `0`) é decisão técnica local, desde
  que preserve a porta real retornada e nunca deixe Promise pendurada.

## 7. Definition of Done
- [ ] A colisão real de porta é reproduzida e corrigida sem aumentar timeout.
- [ ] O smoke seleciona versão semanticamente mais nova.
- [ ] Nenhum processo, handle ou DB fica aberto após os testes.

```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
pnpm --filter @plataforma/estaleiro test:integration
node apps/estaleiro/tests/estaleiro-smoke.mjs
```

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência:**
```
```

## 9. Log de Execução

- **[2026-07-13T17:21]** - *gpt-5* - `[Triado]`: Fase 0: boot e smoke, sem feature
