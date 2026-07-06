---
id: EST-05
title: "plugin-fs-tools: migrar o harness de tools do ORQ-09a (readFile/writeFile/bash gated) pro monorepo superapp"
status: draft:triaged
complexity: 2
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: []
capacity_target: haiku
---

# EST-05 · plugin-fs-tools (move do ORQ-09a)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-fs-tools/`. **Move mecânico** — o código já existe,
  testado e aprovado (ORQ-09a, `done`). Baixa complexidade: adaptar para o contrato de host (EST-02),
  não reescrever a lógica.

## 1. Objetivo
Mover `tools/orchestrator/tools.poc.mjs` (harness readFile/writeFile/bash com gating — allowlist,
timeout, cwd-lock, guarda anti-git-no-Docs) do Docs para `packages/plugin-fs-tools/` no monorepo
superapp, adaptando as chamadas de fs/bash para passar pela mediação do host (EST-02, decisão A2)
em vez de acesso direto. Lógica de gating **não muda** — só o ponto de entrada.

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (G2 — migração como task MGTIA normal) e §3 (plugin-fs-tools no diagrama).
- [x] `tools/orchestrator/tools.poc.mjs` (ORQ-09a, done) — o código-fonte a mover, com a suite de testes existente.
- [x] `docs/adr/0008-agent-adapter-in-process.md` Decisão B — o desenho de gating a preservar.
- [x] `packages/estaleiro/core/src/ports/fs.*` (EST-02) — a porta mediada que o plugin agora usa.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-fs-tools/src/*` — código movido/adaptado.
- **[CREATE]** `packages/plugin-fs-tools/tests/*` — suite existente do ORQ-09a, portada.
- **[UPDATE]** manifest do plugin (EST-02 A1) para `plugin-fs-tools`.

## 4. Estratégia de Testes
- [x] Reusar a suite de testes já existente do ORQ-09a (roundtrip readFile/writeFile, gating de bash: allowlist/timeout/cwd), adaptada ao novo ponto de entrada mediado pelo host.

## 5. Instruções de Execução
1. Copiar código + testes; adaptar chamadas de fs/bash para a porta mediada.
2. Rodar a suite — deve passar sem alteração de comportamento observável.
3. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 G2. Gating (allowlist/timeout/cwd-lock) é herdado do ADR-0008, não
  reabrir essas escolhas aqui.

## 7. Definition of Done (DoD)
- [ ] Código movido e adaptado ao host mediado?
- [ ] Suite de testes do ORQ-09a passando no novo local?
- [ ] Manifest do plugin registrado?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-fs-tools test
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
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-fs-tools move ORQ-09a, capacity=haiku, depende de EST-02 (draft)
