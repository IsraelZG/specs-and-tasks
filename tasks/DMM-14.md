---
id: DMM-14
title: "PluginRegistry no core do superapp (lookup-por-nome/capability) — sucessor do handler-map DI"
status: in_progress
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-01"] # generaliza o handler-map do orquestrador
blocks: []
capacity_target: sonnet
---

# DMM-14 · PluginRegistry no core do superapp

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
No spike DMM-01 a resolução de plugin do orquestrador é um **handler-map por DI** (mapa `{nome→fn}`
injetado) — entrega o objetivo (JDM 100% JSON, decisão por string) sem infra nova. Descoberto em
DMM-01: **NÃO existe PluginRegistry no EST-02** (`estaleiro-core` só expõe `PluginManifest` + ports).
Esta task cria o **mecanismo de registro/lookup de plugins por nome/capability no core do superapp**
(`packages/core`), do qual o handler-map passa a ser uma projeção — o orquestrador resolve plugins
sem um mapa montado à mão. (Pedido explícito do humano, 2026-07-08: "deve existir no core do superapp também".)

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0014-contrato-orquestrador-declarativo.md` (DMM-01) — contrato handler-map a generalizar.
- [ ] `apps/estaleiro/core/src/manifest.ts` — `PluginManifest` (Zod) existente.
- [ ] `packages/core/src/index.ts` — módulo do superapp onde o registry deve viver (confirmar no endurecimento).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/adr/0014-...md`, `apps/estaleiro/core/src/manifest.ts`, `packages/core/src/index.ts`.
- **[CREATE]** `packages/core/src/pluginRegistry.ts` (path a fixar) — `register(manifest, impl)` + `resolve(name): impl`.
- **[UPDATE]** `packages/plugin-workflows` (orquestrador) p/ aceitar um `PluginRegistry` como fonte do handler-map.

## 4. Estratégia de Testes Estrita
- Vitest: registrar 2 plugins fake, resolver por nome, erro em nome inexistente. **Fora de Escopo:** hot-reload/descoberta dinâmica.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** quebrar o handler-map DI do DMM-01 — o registry o **alimenta**, não o remove à força.
> - **NÃO** acoplar o registry ao Zen — resolução é do orquestrador.

## 6. Feedback de Especificação
### Decisões Arquiteturais Fechadas (2026-07-09)
1. **Localização do PluginManifest e Registry:** Opção A (Mover para o Core). O arquivo `PluginManifestSchema` (e a tipagem) será movido de `apps/estaleiro/core/src/manifest.ts` para `packages/core/src/pluginManifest.ts` (ou similar). O `PluginRegistry` viverá nativamente no core. Isso quebra a dependência invertida, respeita o fluxo unidirecional e centraliza a definição de plugin para todo o Superapp. O "churn" no Estaleiro (refatoração de imports) é aceito como custo menor para sanear o débito técnico.

### Classificação (pass-2)
- **Status:** `draft:hardened`
- **Motivo:** Decisão A aprovada pelo arquiteto; escopo alinhado com a topologia do monorepo. Pronta para Worker.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Registry no `packages/core` resolve plugin por nome; orquestrador pode usá-lo como fonte do handler-map.
### Verificação automática
```bash
pnpm --filter @plataforma/core test
pnpm --filter @plataforma/plugin-workflows test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-09T12:06]** - *Antigravity* - `[Reconciliado]`: status restaurado de draft:placeholder para draft:pending_decision (drift corrigido)
- **[2026-07-09T17:38]** - *Antigravity* - `[Decidido]`: Decisão A fechada
- **[2026-07-09T17:43]** - *Antigravity* - `[Promovida p/ ready]`: Pronta para execução
- **[2026-07-09T17:55]** - *deepseek* - `[Iniciado]`: iniciando implementação
