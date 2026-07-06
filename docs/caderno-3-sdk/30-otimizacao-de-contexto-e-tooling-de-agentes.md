# 30-otimizacao-de-contexto-e-tooling-de-agentes.md — Otimização de Contexto e Tooling de Agentes

> **Ângulo deste capítulo:** os padrões pelos quais um agente de IA recebe contexto e ferramentas
> da forma mais barata possível — descobertos e medidos no nosso próprio desenvolvimento (o
> orquestrador MGTIA é o **laboratório**) e destinados a virar **plugins do superapp**, que terá
> funções de desenvolvimento tanto externas (escrever em filesystem, como fazemos hoje) quanto
> internas (criar telas e componentes sob demanda). Complementa
> [14-ia-rag-e-agentes](./14-ia-rag-e-agentes.md) (inferência, RAG, personas) e
> [12-plugins-e-computacao](./12-plugins-e-computacao.md) (onde esses padrões rodam).

## §1 — Princípio: inspiração de fonte aberta, não adoção de ferramenta

O ecossistema de tooling para agentes (Serena, Sift, Headroom, Pi, dotcontext, fastcontext…) é
open-source. A política da plataforma é **ler o código-fonte e extrair o mecanismo**, não acoplar
a ferramenta: cada uma dessas ferramentas é um processo externo com seu próprio runtime (Python,
Rust, proxy standing), enquanto o superapp precisa do mecanismo como **plugin** rodando no
substrato de computação da plataforma ([[plugin]], caderno 12). Consequências:

- Uma ferramenta externa pode ser usada **na fase de laboratório** (dev) para validar o mecanismo
  antes de reimplementá-lo — é mais barato medir com a ferramenta pronta do que construir às cegas.
- O plugin final pode **fundir mecanismos de mais de uma ferramenta** quando eles atacam o mesmo
  problema por ângulos complementares (ver §7 — busca léxica + navegação simbólica + compressão
  reversível num único provedor de contexto).
- O critério de adoção de um mecanismo é sempre **medição no nosso workload**, não benchmark da
  ferramenta (spike com ADR + números — ex.: `tasks/ORQ-12.md`).

## §2 — Padrão: loop de agente in-process com tools tipadas

**Mecanismo.** O loop LLM→tool-call→resultado roda dentro do processo hospedeiro; cada tool é uma
função tipada por schema (Zod), com gating explícito (allowlist, timeout, cwd travado, regras
invioláveis codificadas — não prometidas em prosa). Sem subprocesso, sem janela, com stream de
eventos por passo e cancelamento por `AbortController`.

**Provado no laboratório.** ADR-0008 + PoC (`tools/orchestrator/`): 1 task real end-to-end,
in-process, 12 eventos de stream, gate de bash com guarda anti-git-no-Docs codificada.

**No superapp.** É a forma do plugin de agente sobre o utilitário de computação
(caderno 14 §1, caderno 12): o "criar tela/componente sob demanda" é este mesmo loop, com as tools
de escrita apontando para o grafo (criar [[node]] de SPEC, não arquivo) em vez do filesystem. O
gating do laboratório (allowlist/cwd/regra inviolável) vira o teto de capacidade do plugin —
mesmo desenho, fronteira diferente.

## §3 — Padrão: compressão reversível na fronteira de tool (CCR)

**Mecanismo** (fonte conceitual: Headroom). O que enche a janela de um agente de código não é a
conversa — são os **outputs de tool**: arquivos lidos, saídas de build, resultados de busca. O padrão
CCR (*Compress-Cache-Retrieve*) intercepta esses outputs antes de entrarem no contexto: guarda o
original num store local por hash, coloca no contexto só um resumo/marcador, e registra uma tool
`retrieve(hash)` para o modelo **re-hidratar sob demanda** só o trecho que for usar. Lazy-loading de
contexto — sem perda do ponto de vista do agente, porque o original está a um tool-call de distância.

**Achado do spike ORQ-12 (ADR-0009):** o SDK `headroom-ai` **não é in-process** — é um cliente HTTP
de um **proxy standing** (`localhost:8787`); toda a compressão roda server-side. Adotá-lo reintroduz o
serviço standing que o ADR-0008 evitou. Então o CCR que a plataforma constrói é **próprio e
in-process**: um store local de ~12 linhas (`stash`/`retrieve`, reversibilidade provada byte-a-byte na
bancada), pareado com o resumo do §4. É a materialização do princípio §1 — extrair o mecanismo
(CCR + retrieve tool) da fonte aberta, sem arrastar o proxy.

**Anti-padrão que este substitui:** proxy de compressão standing (por provedor no desenho antigo, ~10%
de ganho — ver [[project_headroom_integration]]; ou o proxy Headroom :8787). O CCR próprio é in-process
e provider-agnóstico.

**No superapp.** Todo plugin de agente comprime outputs de tool e chunks de RAG na entrada do
contexto. O store CCR é uma **projeção local** (cache derivado, reconstituível) — compatível com o
modelo local-first: não é dado canônico, não replica, pode ser descartado.

## §4 — Padrão: nano-preprocess multi-modelo

**Mecanismo** (fonte: fastcontext). Antes de um output grande chegar ao modelo caro, um modelo
barato ("nano" — no nosso roster, `deepseek-v4-flash`) o filtra/resume com uma instrução
específica ("liste só os símbolos exportados", "só as linhas de erro"). O modelo caro recebe o
destilado. **Medido (ORQ-12/ADR-0009):** 81% em prosa e 99% em listagem, a **~US$0.0004** por
lote — custo desprezível vs. tokens poupados. Gatilho: só acima de ~2.000 tokens de output (abaixo,
a latência 2–5s não paga). É **lossy** → sempre pareado com o CCR do §3 (original recuperável).

**Combina com o §3:** o nano pode ser o classificador do CCR — decide o que comprimir, o que
resumir e o que passar cru.

**No superapp.** É a recuperação híbrida do caderno 14 §3 estendida à *saída* das tools: o mesmo
utilitário de inferência (caderno 14 §1) serve o nano como um job barato de pré-processamento,
sem mecânica nova.

## §5 — Padrão: grafo de conhecimento como contexto (OKF)

**Mecanismo** (fonte: OKF/Claude-Mega-Brain; já encarnado na wiki). Conhecimento em markdown +
frontmatter + wikilinks forma um grafo navegável sem vector DB: o agente recebe um nó de entrada
(a Seção RAG de uma task, um verbete) e **navega por traversal** (`[[slug]]`), puxando só os nós
de que precisa — nunca dump de diretório. É a mesma disciplina da regra "uma definição por
conceito, linke não copie" do repo de controle.

**No superapp.** O grafo de [[node]]s + [[edge]]s + SPECs **é** o OKF nativo: o plugin de agente
recebe um node-âncora e uma profundidade de traversal como contexto inicial, e usa tools de
navegação (getEdges/getNode) para expandir — GraphRAG (caderno 14 §3) é este padrão com ranking.

## §6 — Padrão: acesso semântico ao código — Serena e Sift

Dois mecanismos abertos, complementares, para o problema "dar ao agente o pedaço certo de código
sem entregar arquivos inteiros":

**Serena** (oraios/serena, Python, MCP). Toolkit que sobe **language servers (LSP)** — os mesmos
do VS Code — e expõe ao agente operações no nível de **símbolo**, não de texto:
`get_symbols_overview` (esqueleto de um arquivo: classes/funções, sem corpos),
`find_symbol` (corpo de UM símbolo pelo nome), `find_referencing_symbols` (quem usa),
`rename_symbol`/`replace_symbol_body`/`insert_after_symbol` (edição por símbolo),
diagnósticos do compilador, e memórias de projeto. O ganho é duplo: **leitura** — o agente pede o
esqueleto e depois só o corpo do símbolo relevante (fração dos tokens de um `readFile`); e
**escrita** — editar "o corpo da função X" é mais robusto que casar strings num arquivo que o
agente não leu inteiro. É semanticamente exato (resolve importações, tipos, referências) porque é
o compilador respondendo, não regex. Custo: um language server por linguagem, processo standing,
indexação inicial.

**Sift** (Botirk38/sift, Rust, CLI). Indexador de busca por **trigramas** (a técnica do Google
Code Search): indexa o repo uma vez, responde buscas quase-regex em milissegundos e retorna **só
os blocos que casam**, com limites de tamanho pensados para janelas de LLM. É léxico, não
semântico — não sabe o que é um símbolo, mas encontra qualquer string em qualquer arquivo sem
varrer o disco a cada consulta (diferente de `grep`/ripgrep, que re-varrem sempre). Custo: quase
nenhum — binário único, índice incremental.

**Quando cada um.** Sift responde "*onde* aparece X?" (descoberta, barata, qualquer texto);
Serena responde "*o que é* X e quem depende dele?" (estrutura, exata, só código indexável por
LSP). Um agente eficiente usa os dois em sequência: busca léxica para achar o ponto de entrada,
navegação simbólica para extrair o mínimo contexto correto.

**No laboratório (hoje).** O Serena já está instalado (MCP no `~/.claude.json` global, projeto
Docs com LSP TypeScript em `.serena/project.yml`) e subutilizado — no repo de **código**
(superapp), as tools de símbolo devem ser preferidas a `readFile` de arquivo inteiro. No repo de
**controle** (Docs, markdown), o ganho é menor: a wiki já é o mecanismo de acesso seletivo (§5).

**No superapp.** Nenhuma das duas roda como está (Python standing / binário Rust externo). O que
se extrai: do Sift, o índice de trigramas como projeção SQLite (irmão do FTS do caderno 14 §2);
do Serena, a fatia simbólica via **tree-sitter/WASM** (parse leve, sem language server standing) —
suficiente para overview/símbolo/referências na maioria dos casos de "editar componente sob
demanda". Ver fusão no §7.

## §7 — Da ferramenta ao plugin: mapa de extração

| Fonte aberta | Mecanismo extraído | Onde já existe no lab | Plugin no superapp |
|---|---|---|---|
| Vercel AI SDK (loop) | loop in-process + tools Zod + gating | ADR-0008 / `tools/orchestrator/` | plugin de agente (caderno 12) |
| Headroom | CCR: store + retrieve tool (o mecanismo — **não** o proxy :8787, ADR-0009) | store local ~12 ln (ORQ-12) | interceptor de contexto de todo plugin de agente |
| fastcontext | nano-preprocess multi-modelo (medido 81–99%, ADR-0009) | roster haiku (`deepseek-v4-flash`) | job barato no utilitário de inferência |
| OKF / Mega-Brain | grafo md+links como contexto navegável | a própria wiki + Seção RAG das tasks | traversal do grafo (GraphRAG, caderno 14 §3) |
| dotcontext (PREVC) | contrato de task + gate de evidência | MGTIA (CLAUDE.md, 6 Regras) | `SPEC:WORKFLOW` com guards Zen |
| Sift | índice trigram → blocos que casam | (Grep/ripgrep cobre no dev) | projeção de busca léxica (SQLite, irmã do FTS) |
| Serena | acesso/edição por símbolo (LSP) | MCP já instalado (subutilizado) | fatia simbólica via tree-sitter/WASM |
| Pi toolkit | isolamento por container | descartado (loop próprio + gating) | teto de capacidade do plugin (sandbox) |

**Fusão candidata — "provedor de contexto de código" (um plugin, três mecanismos):** recebe uma
pergunta do agente ("onde está e o que é `SqliteWasmStorage`?"), resolve com índice trigram
(Sift) → fatia simbólica (Serena/tree-sitter) → comprime o que exceder o orçamento com CCR
(Headroom), devolvendo blocos mínimos + handles de retrieve. Cada mecanismo cobre a fraqueza do
outro: o trigram acha, o símbolo delimita, o CCR garante que nada precise ser truncado com perda.
É a materialização, para código, do mesmo princípio que a wiki aplica a conceitos: **nunca
entregue o todo quando um link para o resto basta.**

## §8 — Limites honestos

- Os números de ganho de CCR/nano foram **medidos** no spike `ORQ-12` (ADR-0009): nano 81–99% a
  sub-centavo; crusher nativo fraco sozinho (1–11%); Headroom-proxy alto (32–95%) mas exige serviço
  standing. O que segue como hipótese é o ganho *integrado no adapter de produção* (ORQ-09b).
- Tree-sitter dá estrutura sintática, não resolução de tipos — a fatia simbólica do superapp será
  mais fraca que o Serena/LSP em codebases com inferência pesada. Aceitável para "editar
  componente sob demanda"; insuficiente para refactors globais (esses continuam no dev externo).
- CCR adiciona um hop (retrieve) por trecho re-hidratado — latência trocada por tokens. O
  threshold de quando comprimir é decisão de medição, não de fé.

## §9 — Padrão: modelo pequeno como intermediário de execução (além da compressão)

O nano do §4 é *filtro de saída*. A generalização: um modelo barato **entre o modelo grande e as
tools**, absorvendo o trabalho mecânico de execução para que o modelo caro nunca entre em loop de
gerenciamento de ferramenta. Três formas, em ordem de ambição (não são excludentes — são degraus):

**A — Tool-broker (nano gerencia a chamada).** O modelo grande emite a *intenção* da tool
("leia o config X"); o nano é dono do loop de execução: retenta com args corrigidos, pagina, tenta
tool alternativa (glob quando o path chutado falhou), e devolve ao grande **ou o resultado limpo ou
uma falha estruturada com o que foi tentado** — nunca o lixo intermediário. Encaixe natural: é uma
camada acima do `optimizeToolOutput` (ADR-0009) no mesmo ponto do adapter. Risco a mitigar: o broker
mascarar erro real — mitigação é o protocolo de eventos do ADR-0008 §D (toda tentativa auditável no
stream; o broker resume, o painel vê tudo).

**B — Codegen determinístico (CodeAct).** Para tarefas multi-passo mecânicas, o nano **escreve um
script determinístico** (JS no sandbox do harness, mesmo gating de bash do ADR-0008 §B) que faz a
tarefa inteira — N round-trips de tool viram 1 execução. O artefato é re-rodável e testável, o que
casa com a cultura do Gate de Evidência: o script *é* a evidência. É o degrau mais promissor para as
mecânicas repetitivas do próprio MGTIA (transições, coleta de gate, endurecimento sintático) e, no
superapp, para o dev interno (gerar o transform que cria/edita a SPEC, em vez de tool-call a tool-call).

**C — Triagem de rota (first responder).** O nano decide, por passo, a rota: responde direto /
chama tool / escala ao modelo grande. É o "classificação barata primeiro" do caderno 14 §7.5
generalizado do palette para o loop de agente. Único cuidado: latência — triagem só paga quando a
taxa de escalada é baixa; medir antes de adotar.

**No superapp:** os três degraus rodam no utilitário de inferência (caderno 14 §1) como capacidades
`compute` baratas; o teto de abuso não muda — o nano-broker atua **dentro** do mesmo `ASSET:ROLE`
delegado ao agente (caderno 14 §5.5, a interseção governa; o intermediário não escala privilégio).
**No laboratório:** A entra como evolução do adapter (registrada em ORQ-13 §6); B merece spike
próprio quando o adapter estiver religado (ORQ-11) — o candidato de teste é a mecânica de
rework/endurecimento do MGTIA.
