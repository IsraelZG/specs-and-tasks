---
id: EST-39
title: "Fase 0: seed bloqueante e primeiro boot determinístico"
status: draft:triaged
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-37", "EST-36"]
blocks: ["EST-40"]
capacity_target: haiku
---

# EST-39 · Fase 0: seed bloqueante e primeiro boot determinístico

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-39`.
- **Runtime:** Node.js 22+ · pnpm · Vitest · SQLite real em diretório temporário.
- **Fase:** reparo de fundação. Importar o corpo/seções da task pertence a P2, não a esta task.

## 1. Objetivo
Remover o encadeamento fire-and-forget do seed: quando `tasksDir` for configurado e o banco estiver
vazio, `startServer()` só fica pronto depois do seed terminar ou falhar explicitamente. Reabrir um
banco já populado continua idempotente e não reimporta tasks.

## 2. Contexto RAG
- `docs/especificacao-estaleiro.md` §1 (Fase 0 separada de P1).
- `tasks/EST-36.md` §1, §5, parecer `[m1]` e código entregue.
- `apps/estaleiro/core/src/bootstrap.ts` e `src/seed.ts`.
- `packages/plugin-tasks/src/{service,sqlite,schema}.ts`.

## 3. Escopo de Arquivos
- **[UPDATE]** `apps/estaleiro/core/src/bootstrap.ts` — readiness aguarda seed no primeiro boot.
- **[UPDATE]** `apps/estaleiro/core/src/seed.ts` somente se necessário para propagar erro/idempotência.
- **[UPDATE]** `apps/estaleiro/core/tests/seed.test.ts`.
- **[UPDATE]** teste de integração de primeiro boot com SQLite temporário.
- **[NO CHANGE]** parser de seções Markdown, providers, UI e state machine.

## 4. Estratégia de Testes
1. DB vazio + `tasksDir` válido: primeiro GET após `startServer()` já contém tasks.
2. DB populado: seeder não é chamado e dados existentes permanecem intactos.
3. `tasksDir` ausente: boot não falha.
4. Erro de seed: `startServer()` rejeita de forma observável; não atende parcialmente.
5. Restart preserva quantidade e conteúdo sem duplicação.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO manter `void ...then(... void import ... void seedDatabase)`.
> - NÃO aumentar sleeps/timeouts.
> - NÃO sobrescrever DB populado.
> - NÃO ampliar o escopo para parsear seções da task; isso será detalhado em P2.

1. Escreva o teste de primeira request antes da correção.
2. Modele readiness interna sem tornar `createBootstrap()` assíncrona se não for necessário.
3. Propague erro e prove restart idempotente.

## 6. Feedback de Especificação
- Manter o bypass de import decidido em EST-36; esta task corrige somente ordenação/readiness.

## 7. Definition of Done
- [ ] Primeira request nunca observa DB vazio durante seed configurado.
- [ ] Restart não duplica nem sobrescreve task.
- [ ] Falha de seed não vira servidor parcialmente pronto.

```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
pnpm --filter @plataforma/estaleiro test:integration
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

- **[2026-07-13T17:21]** - *gpt-5* - `[Triado]`: Fase 0: seed bloqueante
