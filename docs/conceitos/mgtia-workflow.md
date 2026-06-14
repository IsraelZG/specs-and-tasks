# Modelo de Gestão de Tarefas Interoperável para Agentes (MGTIA) v2

## 1. Visão Geral
O MGTIA é o fluxo oficial de desenvolvimento (SDLC) para a Plataforma V3.1/v4. Ele foi desenhado para suportar um ecossistema onde múltiplos agentes de Inteligência Artificial (Antigravity, Claude, OpenCode) e desenvolvedores humanos colaboram na mesma base de código. 

A V2 adiciona restrições determinísticas extremas para eliminar alucinações ("agente criativo demais") e paralisações ("agente cego").

## 2. O Ciclo de Vida da Tarefa (Fluxo Agile)
Cada tarefa segue o pipeline de status:
`draft` ➔ `ready` ➔ `in_progress` ➔ `review` ➔ `rework` ➔ `done`

### Papéis e Target Agents:
As tarefas no MGTIA definem OBRIGATORIAMENTE um \`target_agent\`. O sistema possui 4 perfis estritos de agentes:
- **`devops_agent`**: Especialista em bash, YAML, orquestração (Turborepo), containers e deploy.
- **`logic_agent`**: Especialista TS focado no core puro. Não possui visão computacional e não lida com DOM/UI. Focado no Vitest.
- **`crypto_agent`**: Especialista em protocolos (Noise), WebCrypto e isolamento de runtime.
- **`frontend_agent`**: Proficiente em PWA, React, Tailwind e DOM. Requer Testes em JSDOM ou Playwright.
- **`agile_reviewer`**: Agente de Quality Gate (QA). Ele não codifica features, ele avalia PRs, roda os testes e rejeita (`rework`) tarefas ruins.

### Modos de Execução (`execution_mode`):
As tarefas definem como se comportam no orquestrador:
- **`sequential`**: Modo padrão. Um agente assume a tarefa de forma exclusiva e passa o bastão para o próximo apenas quando concluir.
- **`parallel`**: A tarefa pode ser executada ao mesmo tempo que suas tarefas irmãs (não possui \`dependencies\` que bloqueiem a atual).
- **`broadcast`**: Múltiplos agentes (de perfis ou modelos diferentes) executam a **mesma** tarefa de forma isolada, e o `agile_reviewer` aprova apenas a melhor implementação.

## 3. Estrutura Estrita da Tarefa (`T-XXX.md` v2)
Toda tarefa deve possuir Frontmatter YAML e as seguintes seções estruturadas:

1. **Ambiente de Execução:** Define runtime (Node v20+), Test Runner, Package Manager (\`pnpm\`). Impede o uso acidental de \`npm\`.
2. **Escopo de Arquivos (Inputs/Outputs):** A regra mais sagrada da v2. A tarefa define exatamente o que o agente deve \`[READ]\`, \`[CREATE]\` ou \`[UPDATE]\`. **É terminantemente proibido** alterar ou criar arquivos que não estejam listados nesta seção. Isso previne agentes espalhando config files inúteis.
3. **Estratégia de Testes (TDD):** Define a cobertura, o framework, o que \`não\` testar e as limitações do ambiente (Node puro vs Headless).
4. **Instruções de Execução (Do & Don't):** Passo a passo restritivo com foco no "Que Não Fazer".
5. **Feedback de Especificação (Spec Loop):** Se a spec estiver confusa ou errada, o executor marca a tarefa como `blocked` e relata o gap estrutural. O agente NUNCA preenche uma lacuna inventando requisitos não documentados.
6. **Definition of Done (DoD) & Reviewer Checklist:** Checklist focada para uso do `agile_reviewer`.
7. **Grafo de Dependências:** O YAML define \`dependencies\` e \`blocks\`, estabelecendo DAG estrito e \`execution_mode\` (sequencial/paralelo). Agentes pulam tarefas se as dependências não estiverem em \`done\`.
