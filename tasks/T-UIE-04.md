---
id: T-UIE-04
title: "Workflow de geração de SPEC:PAGE via catálogo e UI Engines"
status: draft:triaged
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-DS-06", "T-IA-04", "T-UIE-01", "T-UIE-03", "DMM-17"]
blocks: []
capacity_target: sonnet
ui: true
---

# T-UIE-04 · Workflow de geração de `SPEC:PAGE` via catálogo e UI Engines

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp`; confirmar packages de Design System, UI Engines e workflow após dependências.
- **Runtime:** Node.js/TypeScript; `pnpm`; Vitest e Playwright.
- **Capacidade-alvo:** sonnet; triagem inicial.

## 1. Objetivo
Integrar intenção → `query` → `inspect` → `SPEC:PAGE` → validação → UI Engine → gates de a11y/layout em workflow declarativo. O agente só preenche schema e propriedades permitidas; não emite HTML/CSS livre nem escolhe tokens fora do catálogo.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §§2–3 e 9.
- [T-DS-06](./T-DS-06.md) — porta canônica `query → inspect`.
- [T-IA-04](./T-IA-04.md) — proposta de `SPEC:PAGE` validada e persona delegada.
- [T-UIE-01](./T-UIE-01.md) e [T-UIE-03](./T-UIE-03.md) — contratos/UI Engines.
- [DMM-17](./DMM-17.md) — invocação uniforme do workflow.
- [Dashi PPT Skill](https://github.com/chuspeeism/dashi-ppt-skill) — inspiração clean-room de catálogo/spec/validação.

## 3. Escopo a endurecer
- **[READ]** catálogo query/inspect, validator de `SPEC:PAGE`, UI Engine e runtime de workflow reais.
- **[CREATE/UPDATE]** recipe/workflow e adapter de renderização no pacote confirmado.
- **[CREATE]** testes de integração e smoke Playwright da geração até renderização.

## 4. Casos obrigatórios no endurecimento
1. Intenção sem componente compatível retorna estado de seleção/erro, sem HTML livre.
2. `query → inspect` limita props ao schema aceito pelo `SPEC:PAGE`.
3. Spec inválida não chega ao renderizador.
4. Spec válida renderiza por UI Engine reutilizável e não por tela hardcoded.
5. Smoke Playwright: usuário inicia geração, obtém página renderizada e vê erro acessível em entrada inválida.
6. Workflow é invocável por UI e por MCP pela mesma Tool, sem caminho visual privilegiado.

## 5. Não fazer
- Não copiar código/exportador do Dashi.
- Não deixar agente escolher CSS literal, componente inexistente ou token arbitrário.
- Não pular gate E2E por ser task de UI.

## 6. Feedback de Especificação
Interfaces concretas aguardam T-DS-06, T-IA-04 e DMM-17; reendurecer após dependências. A decisão de fluxo e teto de abuso está fechada pela ADR 0019.

## 7. Gate futuro
Fixar `build`, `test`, `lint` dos pacotes reais e `pnpm --filter <app> test:e2e` obrigatório no endurecimento JIT.

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triado workflow de geração SPEC:PAGE com gates visuais.
