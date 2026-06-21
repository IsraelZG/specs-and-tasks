# Blueprint de Arquitetura: Ecossistema de Plugins para Orquestrador de Agentes (TS/P2P)

Este documento consolida a arquitetura para a plataforma de orquestração de agentes de IA, com foco em uma estrutura nativa em TypeScript/JavaScript, orientada a plugins e preparada para redes P2P (descentralizadas). 

O objetivo central é eliminar a dependência de ambientes pesados (Python/C++) e construir um sistema modular onde o "Motor" (Orquestrador) seja extremamente leve, delegando todas as capacidades de execução, raciocínio e pesquisa para uma **camada de plugins dinâmicos**.

---

## 1. A Fundação do Motor (Nativo TypeScript & WebAssembly)

A fundação do sistema parte do princípio de que **toda a lógica de roteamento, estado e comunicação deve viver no ecossistema JavaScript** (Node.js, Bun ou Tauri/Electron para interfaces).

*   **Roteamento e Concorrência:** O gateway principal atua como um servidor HTTP ultraleve (via **Hono.js** ou **Fastify**). Isso permite interceptar, rotear e fazer proxy de conexões para modelos de IA sem bloquear a thread principal, aproveitando o Event Loop nativo.
*   **Estado Descentralizado (P2P):** Diferente de sistemas tradicionais que usam bancos vetoriais complexos em servidores centralizados, o estado da sessão de cada agente vive localmente em um **SQLite**. Para permitir que múltiplos desenvolvedores ou agentes colaborem na mesma base de código (o aspecto P2P), o histórico e o contexto são modelados como **CRDTs (Conflict-free Replicated Data Types)** utilizando a biblioteca **Y.js**.
*   **Processamento Local via WASM:** Operações que tradicionalmente exigiriam C++ ou Python são executadas no cliente usando WebAssembly. Isso inclui o parse de código fonte e a geração de embeddings matemáticos.

---

## 2. A Arquitetura Orientada a Plugins

No coração desta plataforma, **um agente nasce "cego e sem mãos"**. Toda capacidade de interagir com o mundo real é injetada nele através de plugins. Um plugin nesta arquitetura atua como uma ponte (Tool/Function Calling) entre o LLM e o Sistema Operacional ou a Web.

Os plugins são instanciados sob demanda dependendo da *Task* (tarefa) que o agente está executando na sua respectiva *Worktree*.

### 2.1. Plugins Essenciais (Core)

#### A. Plugin de Sistema de Arquivos (`fs-plugin`)
*   **Propósito:** Dar "mãos" ao agente para codificar.
*   **Mecanismo:** É um wrapper seguro ao redor de `fs/promises` e `child_process` do Node.js.
*   **Integração:** Expõe funções estruturadas via JSON Schema para que o LLM possa chamar comandos como `read_file`, `write_file`, `list_dir` e `run_command`. No contexto P2P/Local, este plugin garante que o agente só tenha acesso a um diretório restrito (a worktree da task) e não possa comprometer o sistema operacional host do nó.

#### B. Plugin de Provedores de IA (`provider-plugin`)
*   **Propósito:** Dar o "cérebro" ao agente, permitindo a troca transparente de modelos.
*   **Mecanismo:** Construído em cima do **Vercel AI SDK Core**.
*   **Integração:** Em vez de escrever integrações isoladas para OpenAI, Anthropic ou Ollama, o plugin padroniza entradas e saídas (Server-Sent Events). Isso permite o **Roteamento Dinâmico**: o orquestrador pode alocar a tarefa de escrever código backend para o `DeepSeek-Coder` e a tarefa de ler uma imagem para o `Claude-3.5-Sonnet`, tudo sob a mesma interface unificada no plugin.

#### C. Plugin de Contexto e Compressão (`context-plugin` / O "Headroom TS")
*   **Propósito:** Evitar a "amnésia" do agente e economizar tokens.
*   **Mecanismo:**
    1.  **Parse:** Usa **`web-tree-sitter`** (WASM) para ler a árvore sintática (AST) do projeto do usuário em milissegundos.
    2.  **Compressão:** Ao invés de mandar o arquivo inteiro para a IA, ele poda imports e formatações desnecessárias.
    3.  **Embeddings Locais:** Usa **`Transformers.js`** para gerar vetores semânticos diretamente na memória RAM/VRAM usando WebGPU/WASM, sem precisar fazer chamadas externas.

---

## 3. Plugins Avançados: Integração de Ferramentas Específicas

A beleza dessa arquitetura é a facilidade de acoplar binários externos ou bibliotecas de terceiros como plugins nativos, abstraindo a complexidade para o Agente.

### 3.1. O Plugin de QA Visual (`lookout-plugin`)

Sistemas baseados puramente em agentes sofrem com testes visuais: LLMs ficam em loops infinitos tentando corrigir CSS porque "acham" que viram um erro. O Lookout (`alexmchughdev/lookout`) é incorporado como o **Gate Determinístico** do fluxo.

*   **O Conceito:** O Lookout é um binário escrito em Go que levanta um navegador (Chromium) de forma determinística, tira uma screenshot e passa para um modelo de visão computacional, retornando um veredito binário estrito: **Pass ou Fail**.
*   **Como o Plugin funciona:**
    1.  O Worker Agent (que tem o `fs-plugin`) altera o código React/CSS e pede para iniciar o servidor dev.
    2.  O orquestrador pausa o Worker Agent e ativa o `lookout-plugin`.
    3.  O Node.js executa o binário nativo: `child_process.spawn('lookout', ['run', 'tests.yaml'])`.
    4.  O plugin intercepta a saída do Lookout. Se for *Pass*, a tarefa avança na máquina de estados P2P. Se for *Fail*, o log de erro visual e a recomendação voltam como feedback imediato para o Worker Agent consertar, sem loop eterno.

### 3.2. O Plugin de Pesquisa Profunda (`research-plugin` / Inspiração no Agent-Reach)

Agentes precisam de informações atualizadas para trabalhar, mas APIs de plataformas como Twitter, Reddit, YouTube e GitHub são bloqueadas, caras ($200+/mês) ou exigem login. O projeto *Agent-Reach* nos ensina como contornar isso elegantemente.

*   **O Conceito (O Paradigma "Self-Installing"):** Em vez de integrar APIs pesadas, damos ao agente wrappers CLI (ferramentas de linha de comando) baseados em cookies locais do navegador do desenvolvedor.
*   **Como o Plugin funciona:**
    1.  O plugin atua como um repositório de "Skills em Markdown".
    2.  Quando a task exige ler uma thread no Reddit ou ver uma issue fechada no GitHub, o `research-plugin` fornece ao agente instruções (ex: `read_reddit.md` ou `search_github.md`).
    3.  O agente "lê" o plugin e entende que deve usar binários abertos (ex: `gh cli`, `rdt-cli`, `yt-dlp`, ou `Jina Reader`) executando-os através do seu `fs-plugin`.
    4.  **Vantagem P2P:** Como o sistema é local, os cookies do navegador da máquina física de cada peer (nó da rede) são usados para autenticação de forma transparente. Zero custo de API, e o sistema bypassa firewalls/403s nativamente.

---

## 4. Estrutura de Diretórios Recomendada

Para materializar essa visão, a árvore de pacotes do monorepo seria estruturada assim:

```text
/packages
  ├── /core                 # Motor de Estado e Rede
  │     ├── orchestrator/   # Despacho de tarefas, scheduler
  │     └── sync/           # CRDTs (Y.js), SQLite e sync P2P
  │
  ├── /proxy                # Gateway HTTP
  │     └── hono-router/    # Proxy que intercepta chamadas e gerencia o cache
  │
  ├── /plugins              # O "Cinto de Utilidades" dos agentes
  │     ├── fs-agent/       # Tool Calling para filesystem e child_process (seguro)
  │     ├── providers/      # Adapters Vercel AI SDK (LLMs locais e remotos)
  │     ├── context-ts/     # web-tree-sitter e Transformers.js
  │     ├── qa-lookout/     # Wrapper Node.js p/ o binário Go do Lookout (Gate)
  │     └── reach-skills/   # Coleção de Markdown/Scripts CLI para acesso web profundo
  │
  └── /ui                   # Interface da Plataforma
        └── dashboard/      # React/Tauri app para visualizar as tasks, worktrees e logs
```

## 5. Conclusão da Arquitetura

O que criamos aqui não é apenas um assistente de código, mas um **Sistema Operacional Distribuído para IA**. 

1. O **TypeScript** garante que o código roda do Edge ao Browser, do Node ao Electron, viabilizando redes P2P sem fricção.
2. Os **Plugins Core** gerenciam memória e mãos.
3. O **Lookout** age como um Juiz Incorruptível, barrando alucinações visuais do LLM antes que elas consumam todo o seu orçamento de tokens.
4. O paradigma do **Agent-Reach** ensina os agentes a hackearem a internet usando CLIs comuns e recursos locais (cookies), em vez de depender de arquiteturas de nuvem engessadas.
