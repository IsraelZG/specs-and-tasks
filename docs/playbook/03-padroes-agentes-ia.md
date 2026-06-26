# 03 - Padrões de Agentes de IA

Sendo um projeto fortemente auxiliado por agentes autônomos (Claude Code, OpenCode, Crush, Antigravity, etc.), as heurísticas e prompts locais são centralizados e regidos pelas mesmas convenções de código clássico.

## 1. Escopo de Regras e Personalização

As personalizações são descobertas pelas raízes globais ou de workspace.
- Regras globais afetam todo o projeto (`.claude/`, `.cursorrules`, `AGENTS.md`).
- Regras locais de pacotes ou áreas afetam apenas a execução naquele subdiretório (Ex: `packages/transport/.claude/`).

**A Regra do Ponto de Entrada**: Todos os modelos (independente da vendor) são instruídos a checar os arquivos raízes. O `CLAUDE.md`, `.cursorrules`, `AGENTS.md` funcionam como "índices". **Nenhum detalhe denso de engenharia vai na raiz**. A raiz aponta para `docs/playbook/` ou `docs/caderno-*/`.

## 2. Agentes vs Skills

Para manter a testabilidade e o reúso:
- **Skills (Ferramentas)**: Scripts idempotentes (geralmente Bash, Node.js ou prompts isolados de passo único) que resolvem um problema mecânico determinístico (Ex: `verificar-links`, `endurecer-task`). Vivem na pasta `.claude/skills/` (ou análogas de outros modelos).
- **Agentes (Personas)**: Sub-sistemas complexos acionados para tarefas cognitivas de múltiplos passos (Ex: `agile-reviewer`, `auditor-consistencia`). Possuem instruções complexas de sistema e delegam trabalho para as Skills. Vivem na pasta `.claude/agents/`.

## 3. Convenções de Hooks e Escapes (Regex)

Sistemas de IA executam comandos gerados em tempo de execução via shell (como Bash ou PowerShell no Windows).

**O Paradoxo do Escape**: Ferramentas declaradas em arquivos JSON (como `settings.json`) que invocam PowerShell com regex exigem uma cadeia complexa de *decoding*:
1. O interpretador lê o JSON source (ex: `\\\\`).
2. Converte para string JS (`\\`).
3. Envia para o shell PowerShell.
4. O PowerShell aplica o match em Regex (1 backslash literal).

Sempre que a infraestrutura de agentes (ex: Hooks Pós-Build) exigir Regex no shell, **use o helper oficial de teste**:
- `@plataforma/testkit/src/psRegex.ts`

Esse utilitário simula o motor case-insensitive do PowerShell localmente no Node, garantindo que o agente possa usar o TDD para testar se as injeções de CLI que ele criará nos *settings* das IAs vão funcionar em produção.
