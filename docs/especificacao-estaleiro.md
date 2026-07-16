# Documento de Especificação: ESTALEIRO

## 1. Visão Geral e Objetivos Core

O Estaleiro é uma plataforma orquestradora de agentes e fluxos de trabalho. O desenvolvimento e a arquitetura do sistema são guiados pelos seguintes objetivos estruturais, listados na exata ordem de prioridade de implementação:

1. **Conexões Híbridas:** Ser capaz de se conectar com provedores de LLMs locais e remotos.
2. **Reunião de Contexto via Workflows:** Ser capaz de reunir contexto de forma dinâmica (skill, RAG, conteúdo da task) abandonando a concatenação estática. A montagem do *System Prompt* é um pipeline de dados orquestrado por workflows reutilizáveis.
3. **Compressão de Entrada (Token Economy):** Ser capaz de comprimir esse contexto para economizar tokens (utilizando tradução para o inglês, RTK, LLMLingua2, conversão de JSON para CSV, etc) de forma cirúrgica, como passos em um workflow, atualizando o prompt apenas no que for necessário.
4. **Tooling:** Habilitar o uso de ferramentas extensíveis para LLMs (e para o próprio motor).

> **Fatia incremental atual (P1):** a primeira prova executável de Conexões Híbridas usa somente o
> provider remoto DeepSeek, pelo host do Estaleiro e sem expor credenciais à UI. Ollama e LM Studio
> continuam parte da visão de suporte local, mas ficam adiados até haver runtime/teste local
> disponível; não são pré-requisito para validar o caminho remoto.
5. **Compressão de Saída (Token Economy):** Ser capaz de comprimir o retorno dos modelos para economizar tokens, também orquestrado como passos no fluxo.
6. **Orquestração de Agentes:** Acionar agentes automaticamente com base no tipo da task (work, review, hardening, etc).
7. **Workflows Customizáveis (Agnósticos):** Possuir nós flexíveis que apenas executam lógica ZenEngine ou chamam uma Ferramenta (Tool). Sub-workflows e pipelines complexos são criados compondo a ferramenta de invocação de workflows.
8. **Monitoramento e Auditoria:** Operar com supervisão estruturada para evitar loop infinito e promover aprimoramento contínuo via aprendizado com erros e falhas.
9. **Autonomia de Testes:** Ter a possibilidade de testar cenários e aprimorar workflows e skills de forma autônoma.
10. **Orquestração Multimáquina:** Ser capaz de rodar o desenvolvimento de um mesmo repositório em mais de uma máquina ao mesmo tempo, orquestrada por uma única interface.

---

## 2. Paradigma de Interface (UX/UI)

A interface abandona modais sobrepostos em favor de um sistema de colunas baseado em **FlexLayout**.

- **Layout Base (Duas Colunas):** O ambiente padrão exibe o módulo ativo atual e, ancorado ao lado, o módulo de Chat (que funciona como a central universal de comando e edição).
- **Navegação em Profundidade:** Módulos primários abrem módulos secundários em novas colunas adjacentes à direita. Isso cria um rastro visual do fluxo de trabalho (ex: Árvore de Tasks -> Detalhe da Task -> Seleção de Skill), mantendo o contexto anterior visível e acessível.

### Reuso com o SuperApp

O Estaleiro consome **`@plataforma/design-system` como fonte canônica dos primitivos de UI** e
**`@plataforma/ui-engines`/`@plataforma/shell` para comportamento funcional compartilhado**.
Tokens, componentes sem regra de negócio, engines agnósticas e seus metadados pertencem a pacotes
duráveis. O layout default, stores, transportes e views de domínio permanecem no app descartável.
Como o SuperApp já é segundo consumidor previsto de shell, kanban, workflow, browser de conhecimento
e telemetria, implementações locais do Estaleiro são seeds de extração — não versões paralelas.

O gate mínimo para iniciar a UI reutilizável é **tokens compilados + componentes-piloto**, não a
“finalização” de todo o design system. Identidade visual por módulo, catálogo completo e componentes
ricos podem evoluir depois sem reescrever as telas, desde que elas consumam apenas tokens semânticos
e componentes do catálogo.

---

## 3. Modelo de Persistência (Grafo em SQL)

O armazenamento de dados unifica a gestão de Tasks, Workflows e conhecimento (RAG) sob um modelo de **Grafo construído sobre um banco de dados relacional** (como SQLite, garantindo portabilidade e performance local).

- **Nós e Arestas:** Entidades (Tasks, Nós de Workflow, Documentos) são salvas como "Nós", enquanto os relacionamentos de dependência, hierarquia ou similaridade são salvos como "Arestas" relacionais.
- **Evolução Híbrida:** Essa estrutura relacional padrão já é desenhada prevendo a futura injeção de colunas para armazenamento de vetores (Embeddings) e índices de trigramas, unificando a busca semântica e a navegação estrutural na mesma base.

### 3.1. Grafo de Conhecimento de Código

O grafo operacional de Tasks/Workflows e o grafo de conhecimento de código podem compartilhar o
mesmo SQLite físico, mas têm schemas e contratos separados. O pacote durável
**`@plataforma/plugin-knowledge-graph`** mantém nós de arquivo/símbolo e arestas estruturais como
`imports`, `calls` e `inherits`, extraídas da AST e atualizadas incrementalmente por hash do arquivo.

Cada aresta registra origem e proveniência:

- **`extracted`**: fato reproduzível obtido do parser/AST;
- **`inferred`**: hipótese extraída por LLM de documentação ou regra de negócio, sempre com fonte e
  confiança explícitas.

Consultas arquiteturais usam somente `extracted` por padrão. Arestas `inferred` só entram quando o
chamador solicita explicitamente e nunca satisfazem sozinhas um gate, uma prova de dependência ou um
parecer de impacto. O candidato inicial de parser é o binding WASM **`web-tree-sitter`**, sujeito a
spike que prove gramáticas, atualização incremental, desempenho e funcionamento no Windows ARM64;
até essa prova, ele é uma escolha proposta, não um fato arquitetural aceito.

---

## 4. FlowGrid: Motor Compartilhado de Fluxo em Grade

O sistema substitui o canvas livre (X/Y) por uma matriz inteligente guiada por dependências,
implementada uma única vez em **`@plataforma/ui-engines`** e reutilizada por Estaleiro e SuperApp.
O contrato canônico é o `FlowGraphViewModel` da ADR 0016; JDM e `SPEC:WORKFLOW` entram por adapters.
`@gorules/jdm-editor` não é mais direção de produto. O Zen Engine continua sendo o avaliador de
regras — a substituição é somente da camada visual.

- **Estrutura da Matriz:**
  - **Colunas (Tempo/Dependência):** Representam a progressão. O "Início" fica na Coluna 1; dependentes diretos vão para a Coluna 2, avançando da esquerda para a direita.
  - **Linhas (Paralelismo):** Cards na mesma coluna, mas em linhas diferentes, executam simultaneamente.
  - **Auto-organização:** A inserção de um novo nó recalcula e empurra a grade automaticamente, eliminando a necessidade de alinhamento manual.
  - **Sem Coordenadas Persistidas:** A fonte salva nós, arestas e ordem estável; coluna/linha são
    projeções determinísticas. O v1 rejeita ciclos e expressa repetição por `invoke_workflow` com
    orçamento explícito.
- **Anatomia do Card (O Nó):** Ultra-compacto para caber nas colunas do FlexLayout. Exibe ID/Ícone, Conectores (ports laterais de entrada/saída) e um Indicador de Status (Cinza: Bloqueado, Azul: Pronto, Amarelo: Executando, Verde: Concluído, Vermelho: Falha). O clique injeta os dados na coluna adjacente em vez de abrir um modal.
- **Roteamento Preditivo:**
  - **Bifurcação (1 para N):** O payload de saída de um nó concluído aciona gatilhos que desbloqueiam múltiplos nós nas colunas seguintes.
  - **União (N para 1):** Um nó agregador aplica um operador lógico AND estrito. Ele monitora a grade e só é desbloqueado quando 100% dos nós *upstream* conectados à sua entrada estiverem verdes (Concluídos).
- **Vantagens do Modelo:** Mantém a clareza visual mesmo com dezenas de nós, unifica o entendimento de estado (é fácil ver gargalos em Uniões ou paradas em Falhas) e o componente UI é 100% reaproveitado em diferentes módulos.
- **Modos:** `edit` altera o grafo por comandos do adapter; `execution` é read-only e sobrepõe
  `blocked | ready | running | done | failed`, destacando o nó atual.

---

## 5. Arquitetura de Módulos

### 1. Chat
O núcleo interativo. Operando quase como um sistema operacional conversacional.
- **Visão Principal:** Campo de prompt, histórico em tempo real, seletores rápidos (modelo, esforço, anexos) e pílulas visuais mostrando skills/contextos ativos.
- **Secundários:** Gestão de histórico (para retomar ou ramificar conversas passadas) e o "Montador de Contexto" (interface rica para pinçar skills, repositórios e specs).

### 2. Árvore de Tasks
O painel gerencial tático, evoluindo o formato "Jira-like".
- **Visão Principal:** A Matriz em Grade exibindo a malha de dependências e os cards das tasks com status atualizado em tempo real.
- **Secundários:** 
  - *Detalhe da Fila:* Visão em lote para regras de despacho e priorização de filas inteiras.
  - *Detalhe da Task:* Configuração microscópica contendo a descrição rica, vinculação a um Workflow específico, ou designação de Ação/Skill direta (despacho individual).

### 3. Workflows (A Fábrica de Processos e Contextos)
A espinha dorsal da plataforma, gerenciando desde tarefas complexas até a formação fina de prompts. **A orquestração não possui "tipos" arbitrários de nós.** Um nó apenas contém lógica ZenEngine (condicionais, forks) ou invoca uma Ferramenta (Tool). 
- **Montagem de Contexto Agnóstica:** Em vez de *hardcoded*, a construção de *System Prompts* é desenhada aqui. Exemplo: um workflow possui um nó (Tool) que coleta o RAG, outro nó (Tool) que traduz para inglês, outro (Tool) de LLMLingua2 para compressão, e outro (Tool) que invoca o agente.
- **Reaproveitamento Infinito:** Não há "nós de sub-workflow". Qualquer workflow desenhado fica listado no sistema e pode ser invocado por outro workflow utilizando a ferramenta `invoke_workflow`.
- **Visão Principal:** A Matriz em Grade, dedicada ao desenho lógico.
- **Secundários:**
  - *Biblioteca:* Carregamento, listagem e versionamento de fluxos infinitos.
  - *Gestão do Workflow:* Controles globais e testes de fluxo seco (dry-run).
  - *Inspetor de Nó:* Define a lógica determinística (ZenEngine) ou qual Ferramenta (Tool) será executada no nó.

### 4. Skills & Contextos
O diretório de "cérebros" e capacidades.
- **Visão Principal:** Prateleira de cards com resumos de Agentes, Ferramentas e fragmentos de contexto. O RAG e regras base agora são insumos gerenciados e consumidos livremente pelos Workflows.
- **Secundários:** Editor completo para alterar o prompt do sistema de uma skill, ajustar parâmetros do Agente ou editar o conteúdo cru de um contexto.

### 5. Configuração
Infraestrutura básica e conectividade.
- **Visão Principal:** Credenciais seguras, gestão de chaves de API, definição de endpoints (OpenAI, Anthropic, ou locais via Ollama/LMStudio), e limites de rate-limit.

### 6. Dashboard
Telemetria e observabilidade.
- **Visão Principal:** Gráficos de queima de tokens, status da frota de Agentes rodando em background, tempo médio de execução e taxa de sucesso/falha de Workflows.

### 7. Specs (Base de Conhecimento RAG)
O cérebro passivo do sistema.
- **Visão Principal:** Repositório de documentos arquiteturais, guias de estilo, regras de negócio e documentação de código. Estes são os dados que os nós de workflow (Tools de Retrieval) consumirão para injetar contexto cirúrgico sob demanda antes de compactá-los.
- **Contexto Estrutural:** Workflows podem combinar a recuperação documental do `plugin-knowledge`
  com vizinhança, caminho e impacto determinísticos do `plugin-knowledge-graph`, sem confundir
  similaridade textual com dependência real de código.

### 8. Laboratório de Genética
Área isolada para P&D e evolução contínua.
- **Visão Principal:** Histórico de A/B testing de prompts. Execuções onde o sistema tentou aprimorar o próprio código ou skill, registrando as falhas sintáticas para aprender a "não tentar" certos caminhos no futuro.

### 9. Plugins & Tools
O ecossistema de extensibilidade tática. É aqui que residem os motores das ações.
- **Visão Principal:** Gestão de bibliotecas externas e scripts que os Nós de Workflow ou Agentes podem invocar (ex: plugin de tradução, compressor LLMLingua2, sistema de arquivos local, explorador web, conectores GitHub). Tudo é consumido via interface de Ferramentas.

---

## 6. Catálogo de Plugins (Ecossistema Monorepo)

O monorepo do Estaleiro abstrai sua lógica em pacotes `@plataforma/plugin-*`. Abaixo está a relação de plugins **já existentes** que formam o núcleo do motor, e os **novos plugins atômicos** que serão construídos para internalizar proxies (OmniRoute/Headroom) e ferramentas Python/Rust.

### 6.1. Plugins Já Existentes (Core)
Estes pacotes já estão inicializados em `superapp/packages/` e operam a base da orquestração:
- **`plugin-agent-harness`**: Runner do Vercel AI SDK que gerencia o loop de execução de um agente.
- **`plugin-context`**: Auxilia na formatação de contextos (será refatorado para usar as novas tools atômicas).
- **`plugin-dispatcher`**: Enfileirador e despachante de tarefas.
- **`plugin-fs-tools`**: Fornece acesso estruturado ao File System para as IAs (edição, listagem).
- **`plugin-knowledge`**: Conector com a base documental de RAG (Markdown/PDF, FTS e futura busca
  vetorial). Não é responsável por provar relações estruturais entre símbolos de código.
- **`plugin-local-inference`**: Wrapper minimalista sobre o `onnxruntime-node` para inferência local em CPU/GPU (dml).
- **`plugin-providers`**: Interface universal que executa as chamadas HTTP para os provedores LLM.
- **`plugin-skills`**: Carregador de habilidades (diretórios de scripts e diretrizes em markdown).
- **`plugin-tasks`**: Motor de transição de estados e ledger de tarefas (integra com o SQLite).
- **`plugin-workflows`**: Motor declarativo com `Envelope`, que orquestra os nós agnósticos.
- **`plugin-zen-engine`**: Motor determinístico que avalia regras de ramificação e condição dos workflows.

### 6.2. Novos Plugins Atômicos (Substituição de Externos)
Em respeito ao princípio Unix (atomicidade), estes pacotes serão criados como ferramentas ultra-específicas para os Workflows consumirem:
- **`plugin-omniroute-discovery`**: Substitui o *OmniRoute*. Seu único trabalho é atualizar dinamicamente a lista de 231+ provedores gratuitos. Alimenta o `plugin-providers`.
- **`plugin-compressor-rtk`**: Substitui parte do *Headroom*. Aplica a matemática de *Reverse Token Keep* (código-fonte).
- **`plugin-compressor-caveman`**: Substitui parte do *Headroom*. Aplica remoção de stopwords/espaços (texto natural).
- **`plugin-ccr-memory`**: Cache manager que vincula texto original e comprimido para reversão a pedido do LLM.
- **`plugin-lexical-search`**: Substitui o binário *sift*. Usa `lunr.js`/`minisearch` nativo para indexação trigrama.
- **`plugin-zod-validator`**: Substitui o *Instructor (Python)*. Aplica schemas rígidos nas saídas JSON do LLM e gerencia o loop de correção de erros.
- **`plugin-agent-learning`**: Minera sessões falhas no SQLite e extrai insights heurísticos.
- **`plugin-knowledge-graph`**: Inspirado no Graphify, indexa ASTs de código e expõe consultas
  determinísticas de vizinhança, caminho mínimo e impacto. A ingestão semântica de documentos é
  opcional e recebe conteúdo já normalizado do `plugin-knowledge`; o plugin não duplica parsing de
  PDF/RAG. O núcleo determinístico deve funcionar sem LLM.
- *Nota sobre Outlines/C++*: A decodificação forçada (GBNF) e tradução local (`transformers.js`) não ganharão pacotes novos; serão injetadas dentro do **`plugin-local-inference`** já existente.

### 6.3. Sequenciamento do `plugin-knowledge-graph`

1. **Prioridade 2:** após o gate real de Conexões Híbridas, executar um spike do parser e entregar o
   índice determinístico mínimo para workflows de reunião de contexto.
2. **Prioridade 4:** publicar a superfície genérica para agentes
   (`knowledge_graph_neighbors`, `knowledge_graph_shortest_path` e `knowledge_graph_impact`) pelo
   contrato de Tools.
3. **Depois do núcleo determinístico:** habilitar arestas `inferred` como enriquecimento opt-in.

Nenhuma task de implementação deste plugin deve furar a Fase 0/Prioridade 1; ela é criada
just-in-time quando o gate remoto+local de P1 estiver verde.

**Referências de inspiração, não dependências de runtime:**
[Graphify](https://github.com/Graphify-Labs/graphify) e o
[binding Web oficial do Tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web).

### 6.4. Pacotes duráveis de UI (não são plugins)

- **`@plataforma/design-system`**: tokens, atoms e molecules.
- **`@plataforma/ui-engines`**: `FlowGrid`, timelines, kanban, browsers, dashboards e outras
  composições funcionais agnósticas.
- **`@plataforma/shell`**: FlexLayout, solver de espaço, lifecycle e workspaces.

Plugins fornecem capacidades e dados; UI engines os apresentam por ports/adapters. Nenhuma UI engine
importa store ou serviço concreto de um plugin. A migração do código local segue strangler: toda tela
nova usa os pacotes; uma tela antiga só é extraída quando for tocada ou ganhar segundo consumidor.
