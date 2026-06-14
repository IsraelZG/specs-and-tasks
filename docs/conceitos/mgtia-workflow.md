# Modelo de Gestão de Tarefas Interoperável para Agentes (MGTIA)

## 1. Visão Geral
O MGTIA é o fluxo oficial de desenvolvimento (SDLC) para a Plataforma V3.1/v4. Ele foi desenhado para suportar um ecossistema onde múltiplos agentes de Inteligência Artificial (Antigravity, Claude, OpenCode) e desenvolvedores humanos colaboram na mesma base de código.

O coração do modelo é que **as tarefas não são efêmeras**. Elas vivem no repositório (diretório `/tasks/T-XXX.md`), contêm todo o contexto necessário (RAG) e operam sob regras estritas de TDD (Test-Driven Development) e SDD (Spec-Driven Development).

## 2. O Ciclo de Vida da Tarefa (Fluxo Agile)
Cada tarefa segue o pipeline de status:
`draft` ➔ `ready` ➔ `in_progress` ➔ `review` ➔ `rework` ➔ `done`

### Papéis:
- **Task Architect (Groomer):** Pega um draft do `plano-de-implementacao.md`, lê o Wiki, e preenche o arquivo `T-XXX.md` com os links exatos da especificação (RAG). Move para `ready`.
- **Worker (Executor):** Pega a tarefa `ready`, escreve os testes, escreve o código, altera para `review`.
- **Agile Reviewer:** Pega a tarefa em `review`, avalia a qualidade do código, roda o TDD localmente, checa se a spec foi estritamente seguida. Aprova (`done`) ou rejeita (`rework`).

## 3. Estrutura do Arquivo de Tarefa (`T-XXX.md`)
Toda tarefa deve possuir Frontmatter YAML e as seguintes seções estruturadas (geradas via `tools/scripts/generate-task.mjs`):

1. **Objetivo:** Resumo da meta.
2. **Contexto RAG (SDD):** Links para `docs/rfcs/` ou `docs/cadernos/` relevantes. O executor **deve** ler estes links antes de codar.
3. **Estratégia de Testes (TDD):** Como testar (Vitest, Playwright, ou CLI-only para agentes sem visão).
4. **Referências de Código:** Pontos de injeção (`src/...`).
5. **Instruções de Execução:** Passo a passo, sempre forçando o teste primeiro.
6. **Feedback de Especificação (Spec Feedback Loop):** Ponto de parada. Se a spec estiver confusa ou errada, o executor não adivinha: ele marca a tarefa como `blocked` e escreve aqui.
7. **Definition of Done (DoD):** Checklist final de aceitação.
8. **Log de Handover e Revisão:** Espaço assíncrono de comunicação (PR review).

## 4. Tratamento de Agentes Sem Visão
Nem todo LLM possui capacidades multimodais para rodar um Puppeteer/Playwright e analisar o resultado visualmente.
Para tarefas visuais (UI), a estratégia de teste deve apontar para o uso de `@testing-library/react` com DOM virtual, ou a delegação explícita da fase `review` para um agente humano ou modelo multimodal.

## 5. Fechamento de Épico (Epic Validation)
Ao fim de cada marco (Ex: M0, M1), uma tarefa especial de "Epic Validation" é criada. O objetivo não é feature, mas sim auditoria:
- Verificar coesão da API entre as N tarefas recém completadas.
- Identificar necessidade de refatoração.
- Gerar novas tarefas derivadas para polimento de dívida técnica.
