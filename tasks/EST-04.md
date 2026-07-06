---
id: EST-04
title: "Migração das ~200 tasks .md do Docs para o plugin-tasks (parser frontmatter→DB, stress-test)"
status: done
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-03"]
blocks: []
capacity_target: haiku # parser + migrator + validador — decomposta em EST-04a/b/c
children: ["EST-04a", "EST-04b", "EST-04c"]
subtasks: ["EST-04a", "EST-04b", "EST-04c"] # mirror de children: — habilita parentAutoClose (T-1029) quando o fix do service ler este campo (atualmente lê só subtasks:, auto-close é no-op para EST-04)
---

# EST-04 · Migração de dados: ~200 tasks .md → plugin-tasks

## 0. Ambiente de Execução Obrigatório
- **Task-casca decomposta.** Esta task não executa diretamente — seu escopo foi fatiado em:
  - **EST-04a** — Parser frontmatter+seções (.md → schema)
  - **EST-04b** — Corpus completo + stress-test (~200 tasks)
  - **EST-04c** — Validação pós-migração (checksum, integridade)

  Cada filha segue o fluxo MGTIA independente. Esta casca fecha quando as 3 filhas estiverem `done`.

## 1. Objetivo
Migrar **todas** as ~200 tasks `.md` existentes (`tasks/*.md` no Docs) para o schema completo do
`plugin-tasks` (EST-03) — RFC-018 B2: migrar tudo, inclusive como stress-test do parser (tasks
antigas têm formatos de seção inconsistentes entre si, é o teste mais realista do parser). Nenhuma
task perde histórico (Log §9, Parecer §8, frontmatter completo).

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (B2) — decisão de migrar tudo.
- [ ] `tasks/*.md` (Docs) — o corpus real a migrar; usar como fixtures de teste (variação de formato entre tasks antigas e recentes).
- [ ] `docs/task-template.md` — o formato-alvo que o parser precisa reconhecer (mesmo em tasks que se desviam dele).
- [ ] `packages/plugin-tasks/src/schema.*` (EST-03) — o destino.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-tasks/scripts/migrate.*` — parser frontmatter+seções → registros do schema.
- **[CREATE]** relatório de migração (contagem, falhas, tasks que exigiram fallback manual).

## 4. Estratégia de Testes
- [ ] Rodar contra uma amostra representativa (tasks antigas T-0xx, recentes ORQ-1x, com/sem Parecer preenchido) antes do corpus inteiro. Validação pós-migração: contagem de tasks migradas == contagem de arquivos .md; nenhum Log §9/Parecer §8 truncado (checagem de tamanho/hash de conteúdo).

## 5. Instruções de Execução
1. Escrever o parser contra uma amostra pequena primeiro (TDD com fixtures reais).
2. Rodar o corpus inteiro; documentar falhas/casos-limite no relatório.
3. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 B2. Se o parser não conseguir migrar uma task sem perda, PARE e
  registre como decisão em aberto (não invente heurística que perde dado silenciosamente).

## 7. Definition of Done (DoD)
- [ ] Todas as tasks migradas (ou falhas documentadas com motivo)?
- [ ] Nenhuma perda de Log/Parecer verificável?
- [ ] Relatório de migração gerado?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-tasks migrate -- --dry-run
pnpm --filter @plataforma/plugin-tasks migrate
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — migracao ~200 tasks, capacity=haiku, complexidade 5 requer decomposicao
- **[2026-07-06T13:01]** - *deepseek* - `[Decomposto]`: decomposta em EST-04a (parser) + EST-04b (corpus) + EST-04c (validacao)
- **[2026-07-06T19:54]** - *system* - `[Auto-encerrado retroativo]`: M-016: todas as 3 filhas done — backfill one-shot
