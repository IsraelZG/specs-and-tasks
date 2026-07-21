---
id: DMM-16
title: "Contrato universal de Tool e adaptadores MCP/Workflow/UI"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-14", "DMM-15", "EST-24b"]
blocks: ["DMM-17", "T-CTX-01", "T-COLL-01"]
capacity_target: sonnet
---

# DMM-16 · Contrato universal de Tool e adaptadores MCP/Workflow/UI

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp`; localizar o pacote dono do `PluginRegistry` de DMM-14 antes de editar.
- **Runtime:** Node.js e TypeScript; `pnpm`; Vitest.
- **Capacidade-alvo:** sonnet. Passo 1 de triagem; paths e assinaturas serão reendurecidos contra a master após confirmar o registry real.

## 1. Objetivo
Implementar o metadado/contrato único de Tool que permita invocar a mesma capacidade por workflow, MCP e ação de UI sem duplicar regra de schema, capability, prazo, idempotência ou auditoria. O registry real de DMM-14 continua sendo o ponto de resolução; esta task não cria um segundo registry.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §§2–3 — Tool universal e composição por Tool.
- [ADR 0014](../docs/adr/0014-contrato-orquestrador-declarativo.md) §§D1–D3 — Zen decide; orquestrador resolve/executa handler.
- [DMM-14](./DMM-14.md) — registry real por nome/capability.
- [DMM-15](./DMM-15.md) — estado/fila nativos de execução.
- [EST-24b](./EST-24b.md) — composição real do workflow.

## 3. Escopo e contratos a endurecer no pass 2
- **[READ]** tipos e implementação do `PluginRegistry` entregues por DMM-14.
- **[READ]** ponte do orquestrador de EST-24b e contratos de MCP/UI existentes.
- **[CREATE/UPDATE]** o contrato de descriptor/adapters no pacote dono confirmado pela leitura.
- **[CREATE]** testes de integração do mesmo fake Tool pelas três superfícies.

Não fixar paths nem interfaces nesta etapa: a fonte atual resolve o registry, mas não foi lida nesta task contra a worktree do superapp. O endurecimento JIT deve citar exports e paths reais.

## 4. Casos obrigatórios no endurecimento
1. Uma Tool determinística registrada é resolvida por workflow, MCP e UI com o mesmo schema de entrada/saída.
2. Falha de schema, capability e deadline é idêntica nas três superfícies.
3. Adaptador não pode executar Tool ausente ou versão não resolvida.
4. Um efeito `write` produz registro de auditoria único, sem adaptador duplicar o efeito.
5. Teste anti-fake: a ponte MCP/UI chama o registry real, não uma implementação paralela stubada.

## 5. Não fazer
- Não substituir o `PluginRegistry` de DMM-14.
- Não permitir que UI ou MCP chamem handlers internos diretamente.
- Não criar API remota ou sidecar para capacidade in-process.

## 6. Feedback de Especificação
Passo 1 concluído: a decisão semântica está fechada pela ADR 0019; faltam os exports e paths atuais do registry/adapters para assinaturas e gate por pacote. Reendurecer depois de inspeção da worktree do superapp; manter `draft:triaged` até lá.

## 7. Gate futuro
Fixar no endurecimento `pnpm --filter <pacote-dono> build`, `test` e `lint`, mais teste de integração dos três adapters.

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triada a fundação de Tool universal; aguarda leitura JIT dos exports do registry.
