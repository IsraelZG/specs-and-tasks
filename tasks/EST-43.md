---
id: EST-43
title: "P1: gate remoto DeepSeek — casca decomposta"
status: done
complexity: 3
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-41", "EST-42"]
blocks: ["EST-43a", "EST-43b"]
subtasks: ["EST-43a", "EST-43b"]
capacity_target: sonnet
---

# EST-43 · P1: gate remoto DeepSeek — casca decomposta

## 1. Objetivo
Fechar P1 por duas provas ordenadas: **EST-43a** demonstra que o host chama DeepSeek remoto sem UI;
**EST-43b** demonstra que o operador observa a mesma prova pela Config. O runtime local permanece
fora da onda atual.

## 2. Contexto RAG
- `docs/especificacao-estaleiro.md` §1 — Conexões Híbridas, P1 remoto.
- `tasks/EST-41.md`, `tasks/EST-42.md`, `tasks/EST-43a.md`, `tasks/EST-43b.md`.

## 5. Instruções
Não execute esta casca. Trabalhe as filhas em ordem: EST-43a após o rework de EST-41; EST-43b após
EST-42 e EST-43a. A casca é encerrada automaticamente quando ambas estiverem `done`.

## 7. Definition of Done
- [ ] EST-43a concluída: gate remoto pelo host, com evidência redigida.
- [ ] EST-43b concluída: UI observa o resultado remoto sem segredo.

## 9. Log de Execução
- **[2026-07-13T17:21]** - *gpt-5* - `[Triado]`: P1: gate real remoto e local
- **[2026-07-13T23:01]** - *gpt-5* - `[Decidido]`: roster remoto usa `ESTALEIRO_REMOTE_ROSTER`; runtime local adiado
- **[2026-07-14T00:48]** - *gpt-5* - `[Decomposto]`: decomposição: P1a prova backend remoto; P1b prova observação pela UI
- **[2026-07-15T23:50]** - *system* - `[Auto-encerrado]`: todas as filhas done
