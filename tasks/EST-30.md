---
id: EST-30
title: "plugin-skills: layout real .claude/skills/<nome>/SKILL.md"
status: draft:triaged
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-12", "EST-22"]
blocks: []
capacity_target: haiku
---

# EST-30 · plugin-skills layout real

## 1. Objetivo
Corrigir o plugin para ler/escrever o layout real de skills (`<nome>/SKILL.md`) e agentes (`<nome>.md`), sempre via portas mediadas e commit serial.

## 2. Contexto RAG
- `docs/rfcs/rfc-018-estaleiro.md`, B5.
- `packages/plugin-skills/src/index.ts`.
- `.claude/skills/` e `.claude/agents/` do repo de controle.

## 3. Escopo
- **[UPDATE]** `packages/plugin-skills/src/index.ts`.
- **[CREATE]** testes com fixture de diretórios reais.

## 4. Testes
List/read/write de skill, agente e CLAUDE.md; traversal/path inválido; commit recebe caminho correto.

## 5. DoD
Uma skill real é listada e editada sem achatamento de diretório.

## 6. Feedback
Não copiar skills para dentro do bundle standalone; usar as portas do host.

## 7. Verificação
`pnpm --filter @plataforma/plugin-skills build`, `test`, `lint`.

## 8. Handover e revisão

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
