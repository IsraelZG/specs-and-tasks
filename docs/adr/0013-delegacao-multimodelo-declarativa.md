# ADR 0013 — Arquitetura de Delegação Multi-Modelo Híbrida (Declarativa)

- **Status:** Aceita (2026-07-08)
- **Contexto:** Estaleiro (RFC-018) — camada de workflow sobre os plugins `@plataforma/*` já entregues.
- **Implementada por:** tasks `DMM-01`…`DMM-10`.

---

## Contexto

Os plugins-base do Estaleiro já existem e estão `done`: `plugin-workflows` (EST-16, engine JDM/Zen),
`plugin-agent-harness` (EST-06, `runner.ts` + personas), `plugin-dispatcher` (EST-07), `plugin-fs-tools`
(EST-05, bash gated), além de `plugin-context`, `plugin-providers`, `plugin-local-inference`,
`plugin-knowledge`. Falta a **camada de delegação multi-modelo** que os compõe numa esteira de trabalho.

**Princípio central:** flexibilidade extrema e reuso via **orquestração declarativa**. Em vez de
acoplar ("hardcodar") traduções, compressões ou papéis específicos nos plugins-base
(`plugin-context`, `plugin-dispatcher`), esses estágios são **nós (etapas) configuráveis** dentro do
`plugin-workflows`. Assim a arquitetura pode ser alterada, testada e evoluída **sem modificar o
código do núcleo**.

---

## Decisão

### 1. Frontend (Interface do Usuário)

UI em FlexLayout + TinyBase (Estaleiro v1) dá visibilidade total do workflow declarativo e do estado
dos agentes.

**1.1. Visão de Execução (Kanban de Fluxos e Terminal)**
- **Árvore de Execução do Workflow:** visualização gráfica do fluxo da tarefa, mostrando em qual nó
  (ex.: Ingress, Explorer, Editor) a execução está.
- **Cards de Task Dinâmicos:** color-coded por status.
- **Painel Lateral (Terminal do Agente):** ao clicar numa task, uma aba revela o stream de log
  (`runner.ts`) do `plugin-agent-harness` — em tempo real o que a persona ativa faz (Explorer rodando
  `bash grep`, Editor alterando arquivo), além do contexto já processado.

**1.2. Visão de Planejamento (Editor de Workflows e Wiki)**
- **Editor Visual JDM (`@gorules/jdm-editor`):** montar/alterar livremente a esteira (o "cérebro" da
  delegação): quais etapas a task passa (Tradução → Macro Planejamento → Exploração → Edição).
- **Gestão de RAG/Wiki:** curadoria do contexto semântico que alimenta os agentes (reaproveita a UI v1).

### 2. Backend (Delegação via Workflows Declarativos)

A infraestrutura `@plataforma/plugin-*` permanece isolada e enxuta. Os 4 estágios **não são hardcoded**
nos plugins — são **templates de workflow**, permitindo alterar ordem/provedores via UI.

**Estágio 1 — Tradução e Filtro (Ingress).** Processa specs de entrada, traduz para inglês e remove
tokens redundantes. **No workflow:** primeiro nó da esteira; chama função de computação simples que
aciona o modelo desejado (via `plugin-local-inference` ou `plugin-providers` com fallback) para a
tradução, e repassa o texto pelo `crusher.ts` e `l2Compressor.ts` (`plugin-context`). Amarrado pelo
`plugin-workflows`, sem lógica customizada dentro do `plugin-context`.

**Estágio 2 — Orquestrador Macro (The Architect).** Planeja a execução, quebra problemas e avalia
progresso **sem abrir arquivos**. **No workflow:** nó avaliador; a engine submete o contexto traduzido
e comprimido (saída do Estágio 1) ao modelo de fronteira (via `plugin-providers`). A resposta define
quais ramificações do workflow seguir ou quais sub-tarefas criar.

**Estágio 3 — Abstração de Tools (The Explorer).** Levanta coordenadas, buscas e faz "crawling" do
repositório, convertendo saídas extensas para CSV denso. **No workflow:** nó de invocação delegada; a
engine aciona o `plugin-agent-harness` com `maxSteps` baixo e system prompt restrito a **leitura**. O
agent usa `plugin-fs-tools` (bash restrito). A saída bruta interceptada passa pela função
`crushToCsv` do `plugin-context` (transição declarada no workflow) antes de alimentar nós seguintes.

**Estágio 4 — Micro-Codificação e Loop de Testes (The Editor).** Implementa lógica, altera código e
roda validações autônomas. **No workflow:** último nó ativo; instancia um run no `plugin-agent-harness`
com a persona **Editor** e acesso de **escrita** no `plugin-fs-tools`. Pelo design do `runner.ts`, o nó
gira internamente (autocorreção até `maxSteps=40`) verificando logs de erro até o sucesso (`exit === 0`).
O workflow só avança quando o nó relata conclusão, atualizando o UI Terminal durante o processo.

---

## Verificação (Testes de Integração)

- **Engine de Workflow Flexível:** o `plugin-workflows` encadeia chamadas a plugins diferentes — o
  output de um run do `plugin-agent-harness` (modo Explorer) é passado como payload para `crushToCsv`
  do `plugin-context`, e o resultado vira input do próximo nó.
- **Stream para UI:** os eventos emitidos pelo `runner.ts` (`type: 'tool-call'`, `'step'`, etc.) são
  roteados via WebSocket corretamente pelo host para o Terminal de Agente no painel lateral.

---

## Decisões Fechadas (Open Questions Resolvidas)

- **Definição de Fluxos:** **totalmente declarativa** — a conexão entre agentes, etapas de tradução e
  compressão são nós num grafo JDM operado pelo `plugin-workflows`.
- **Tradução (Ingress):** declarativa, sem hardcoding. O workflow padrão começa usando
  `plugin-local-inference` (economia), mas basta o usuário alterar o nó na UI para usar API externa
  (`plugin-providers`). A infraestrutura base não muda.

---

## Consequências

- (+) Arquitetura evolutiva: trocar ordem/modelo/estágio é edição de grafo na UI, não deploy de código.
- (+) Reuso máximo dos plugins `done`; núcleo permanece enxuto e testável.
- (−) O poder declarativo depende de um **contrato de nó/transição** robusto no `plugin-workflows`
  (ver `DMM-01`, spike) — é o ponto onde a complexidade se concentra.
