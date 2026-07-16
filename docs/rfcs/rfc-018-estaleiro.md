# RFC-018 — Estaleiro: independência da camada de orquestração (mini-superapp descartável + plugins duráveis)

- **Status:** draft em evolução (desenho-base fechado; emendas incrementais absorvidas antes das tasks de cada prioridade)
- **Data:** 2026-07-05
- **Autor:** claude-fable (a partir do briefing do arquiteto)
- **Decisor:** Israel (arquiteto da plataforma)

---

## 1. Contexto e tese

A camada de orquestração de engenharia (MGTIA, dispatcher, harness de agentes, compressão de
contexto) vive hoje **dentro do repo de controle (Docs)** — `tools/orchestrator/`, `tools/scripts/`,
skills do Claude Code, e o Nexus congelado. A meta é dar **independência** a essa camada, porque o
destino final dela é ser **absorvida nativamente pelo superapp** (que terá funções de dev externas —
filesystem — e internas — telas/componentes sob demanda).

**Tese:** o valor durável são os **plugins e conectores** (fs-tools, harness de agente, compressão
de contexto, provedores de modelo). Eles nascem já no formato/espírito de plugin do superapp e
migram para o monorepo. A casca que os conecta hoje — **Estaleiro** — é um mini-superapp
ultra-enxuto (conector de plugins + adaptadores de rede + frontend TinyBase estilo Lovable),
**inteiramente descartável** quando o superapp real ficar de pé. O Estaleiro também ganha a GUI
de gestão (estilo Jira/Ada) que **aposenta o repo specs-and-tasks**. Diferente do Nexus (que tentou
evoluir o ecossistema existente), as abordagens agora são **totalmente segregadas**.

## 2. Decisões já tomadas (2026-07-05, arquiteto)

| # | Decisão | Escolha |
|---|---|---|
| D1 | **Nome** | **Estaleiro** (a casca descartável). Plugins NÃO levam o nome: vivem em `@plataforma/*` porque já são partes do superapp. |
| D2 | **Fonte de verdade** | **Híbrida por tipo:** docs/RAG/conhecimento = **markdown-first** (OKF: .md+frontmatter, grafo navegável, git = histórico); tasks/estado operacional = **DB-first** (transições são eventos, não edições de arquivo). |
| D3 | **OmniRoute** | **Só extrair mecanismos** — NÃO rodar o serviço standing (coerente com ADR-0008/0009). Portar: fallback em tiers/circuit-breaker do registry de providers; engines de compressão que faltam (session-dedup, relevance). O proxy Headroom morre de vez. **EMENDA (2026-07-06, arquiteto — híbrido):** liberado rodar o OmniRoute como **sidecar de DEV** (instância local standing, porta 20128) para dar à frota acesso aos free tiers/combos via UMA entrada OpenAI-compatible no `plugin-providers` (EST-17); o veto a rodar/copiar continua valendo para o PRODUTO. Extração seletiva de provedores apikey-estáticos (uso sem sidecar) fica gatilhada em EST-18. Racional: copiar a fatia (registry+executors+oauth+DB+dashboard) = fork permanente e provedores OAuth inertes sem a UI de conexão de contas; rodar dá updates via git pull. Claude Code sob assinatura segue não-proxiável (mesma limitação do Headroom). |
| D4 | **Orca** | **Inspiração; UI própria** — frontend TinyBase (padrão Lovable A1/FlexLayout). Copiar os padrões: fan-out de 1 prompt → N worktrees, diff annotation, abrir worktree a partir de task. |
| D5 | **Grafo de conhecimento de código** | **Plugin durável separado:** `@plataforma/plugin-knowledge-graph`. Núcleo AST determinístico em SQLite; arestas inferidas são opt-in e identificadas. `web-tree-sitter` é candidato sujeito a spike, não escolha ratificada por alegação. |

### Decisões do questionário A–G (2026-07-05, resolvidas via sessão de perguntas em lote)

| # | Decisão | Escolha | Nota |
|---|---|---|---|
| A1 | Contrato de plugin | **Manifest mínimo, mesmos nomes do caderno 12** | Subconjunto pequeno (nome, capacidades, entrypoint); migração é extensão, não reescrita |
| A2 | Portas mediadas pelo host | **Host medeia tudo** (fs/rede/store/eventos) | Consistente com A3 — modelo de mediação total desde o v1 |
| A3 | Comunicação entre plugins | **Via host (mediado)** | Ensaia o modelo final do superapp (plugins de terceiros isolados) |
| B1 | Schema task-service v1 | **Completo (replica MGTIA 1:1)** | Sub-status, verbos, todos os campos do template viram dado estruturado |
| B2 | Migração das ~200 tasks | **Migrar tudo** | Serve também de stress-test do parser frontmatter→DB |
| B3 | Regras do CLAUDE.md → código | **Todas viram guarda de código, com escape hatch opcional por task** | Fecha M-013/T-1014/T-1025 sem virar camisa-de-força — exceção precisa ser explícita, não silenciosa |
| B4 | Serialização de commits (plugin-knowledge) | **Mantém writer serial (fila equivalente)** | Mesmo padrão do `fila.mjs`, riscos já conhecidos |
| B5 | Destino das skills do Claude Code | **Os dois convivem** — skills seguem existindo, mas o gerenciamento delas (skills/agentes/CLAUDE.md) passa a ser feito **via um plugin do Estaleiro**; edições internas refletem no repo por fluxo git | **Novo componente: `plugin-skills`** |
| B6 | Paridade mínima p/ congelar MGTIA no Docs | **Board+CRUD+gate+log + fluxo completo de decisão/endurecimento** | Corte único, sem período híbrido confuso |
| C1 | Extração OmniRoute — fallback | **Fallback em tiers + scoring multi-fator (9 sinais)** | Mais ambicioso que só fallback; depende de C2 (telemetria) |
| C2 | Agregação de telemetria | **`plugin-telemetry` dedicado** | Separado do plugin-tasks; alimenta o scoring de C1 |
| C3 | Medir antes de portar (OmniRoute) | **Sim, sempre pela bancada** | Reafirma a disciplina validada em ORQ-12/14/15 |
| C4 | Destino de Crush/opencode | **Migram para o `plugin-providers`** | Unifica toda chamada de modelo (Estaleiro + terceiros) numa camada só |
| D1 | Onde mora o dispatcher | **Próprio plugin (`plugin-dispatcher`)** | Nem core (descartável) nem agent-harness — sobrevive à migração |
| D2 | Fan-out estilo Orca | **Já nasce no v1, mas opcional por task** | Nem toda task precisa de N-worktrees; é uma opção, não o padrão |
| D3 | Multi-máquina | **Desde o v1** | O modelo B do ORQ-07 (WS outbound) é assumido na base, não retrofit |
| D4 | Auto-proteção / recursão | **O Estaleiro RODANDO é uma cópia/build standalone** (Electron?), separada da working tree do monorepo, atualizada periodicamente a partir da fonte | **Resolve a recursão por construção** — a instância em execução nunca é o próprio worktree que ela orquestra. Ver §3 revisado. |
| E1 | Ordem de construção do plugin-context | **ORQ-13 como está → +LLMLingua-2 → +extração OmniRoute** | Cada degrau já tem evidência prévia (ORQ-13 ready; L2 medido no ADR-0011; OmniRoute exige nova bancada, C3) |
| E2 | Busca no plugin-knowledge | **+ FTS local (SQLite/ripgrep-like)** no v1 | Não espera o cofre de código (caderno 31) para ter busca básica |
| E3 | JSON→CSV nos retornos de tool | **Agora — mais um transform do crusher (ORQ-13)** | Junto com o shape-collapse existente, não esperar o lote OmniRoute |
| F1 | Semente do frontend | **Reusa o Lovable A1** (shell FlexLayout+TinyBase+tokens já verificado) | Adaptado para rodar dentro do wrapper standalone (D4) |
| F2 | Views do v1 | **Mantém as 5** (board · decisões · frota · docs/RAG · custo) | Escopo maior, mas cobertura completa desde o início |
| F3 | Sincronização UI↔estado | **WebSocket para tudo, um canal só** | Reusa o stream de eventos já construído (ADR-0008 §D / ORQ-10), sem canal separado pro board |
| G1 | Namespace dos pacotes | **`@plataforma/plugin-*`** | Explícito: distingue plugin de outros pacotes do monorepo |
| G2 | Migração do código pronto (ORQ-09a/b/10/13) | **Task MGTIA normal** (fluxo atual, com Gate de Evidência) | Mesma disciplina de sempre, rastro no ledger |
| G3 | Destino do conteúdo atual do Docs | **Vira só wiki de design, fica onde está** | Cadernos/conceitos/ADRs = desenho do produto, não gestão de engenharia; sem MGTIA rodando lá após o corte |

### Decisões herdadas (ADRs/ORQ — não reabrir)
- Loop de agente **in-process** (Vercel AI SDK), tools Zod, gating de bash, eventos, AbortController — ADR-0008, código pronto em `tools/orchestrator/src/` (ORQ-09a/b/10, done).
- Ladder de compressão: **crusher → LLMLingua-2 (por palavra, ~250ms/janela CPU) → nano instruído → CCR store reversível** — ADR-0009/0011. Kompress descartado; proxies standing NO-GO.
- LLMLingua-2: re-exportar ONNX do modelo oficial da Microsoft na integração (conversão de comunidade só no spike). OmniRoute usa a variante MobileBERT — comparar na bancada.
- Infra de inferência local: ORT único, modelos como dados; DML falha no Adreno (driver); acelerador só p/ embeddings em massa (WebGPU/QNN follow-up) — ADR-0011.
- Isolamento por **git worktrees** (fluxo `pnpm wt` atual; validado também pelo Orca) — sem containerização.

## 3. Arquitetura-alvo (revisada pós-questionário A–G)

```
superapp (monorepo) — FONTE
├── apps/estaleiro/            ← DESCARTÁVEL: core (host mediador) + UI (FlexLayout+TinyBase)
│   ├── core/                  (host medeia TODAS as portas — fs/rede/store/eventos, A2/A3;
│   │                           plugins só se enxergam via host, nunca import direto)
│   └── ui/                    (semente Lovable A1 — F1; consome design-system, ui-engines e shell;
│                                adapters/views de domínio ficam locais; 5 views: board·decisões·
│                                frota·RAG·custo — F2; 1 canal WS — F3)
└── packages/                  ← DURÁVEL: pacotes compartilhados migram 1:1 pro superapp
    ├── design-system/         (tokens + atoms/molecules; sem regra de negócio)
    ├── ui-engines/            (ADR 0016: FlowGrid + componentes funcionais agnósticos)
    ├── shell/                 (FlexLayout + solver/lifecycle/workspaces; seed = EST-29)
    ├── plugin-fs-tools/       (harness readFile/writeFile/bash gated — ORQ-09a)
    ├── plugin-agent-harness/  (VercelAgentAdapter + eventos + kill — ORQ-09b/10)
    ├── plugin-dispatcher/     (D1, NOVO: escolhe modelo, decide o que despachar, trava lock —
    │                           sucessor do orquestrar.mjs; plugin próprio, não core nem harness)
    ├── plugin-context/        (ladder ADR-0009/0011: ORQ-13 → +LLMLingua-2 → +OmniRoute — E1;
    │                           inclui JSON→CSV como transform do crusher — E3; DEPENDE de
    │                           plugin-local-inference p/ o tier L2, não possui o runtime)
    ├── plugin-local-inference/ (NOVO, pós-RFC: substrato ORT in-process — carrega sessão,
    │                           modelo-como-dado (ADR-0011), expõe infer(). Consumido por
    │                           plugin-context (L2) e, depois, T-IA-01/T-IA-05 — sem HTTP, sem
    │                           serviço externo; ortogonal ao plugin-providers abaixo)
    ├── plugin-providers/      (registry direto + fallback tiers/scoring 9-fatores ← extração
    │                           OmniRoute, C1; Crush/opencode migram pra cá, C4; protocolo HTTP
    │                           OpenAI-compatible — a primeira fatia valida DeepSeek remoto; modelo
    │                           local via Ollama/LM Studio fica para uma onda posterior, por troca
    │                           de baseURL sem mecanismo novo)
    │                          [telemetria de custo/uso é MÓDULO INTERNO de plugin-providers —
    │                           §6.4 mesclou o antigo plugin-telemetry: era a mesma capacidade]
    ├── plugin-workflows/      (pós-questionário: fluxos declarativos JDM avaliados via zen-engine
    │                           — mesma engine de T-604; nano-broker, pipelines de prompt,
    │                           políticas de dispatch; projeção visual via FlowGrid da ADR 0016)
    ├── plugin-tasks/          (schema COMPLETO — B1; sucessor do MGTIA, DB-first)
    ├── plugin-knowledge/      (docs/RAG markdown-first + FTS local — E2; writer serial — B4)
    ├── plugin-knowledge-graph/ (NOVO: AST incremental + relações extracted em SQLite; relações
    │                            inferred opcionais e segregadas; consultas de vizinhança/caminho/impacto)
    └── plugin-skills/         (B5, NOVO: gerencia skills/agentes/CLAUDE.md; edições internas
                                refletem no repo via git — a UI de skills é a fonte, git é log)
```

### Modelo de execução (D4 — resolve a recursão)

O Estaleiro **rodando** NÃO é a working tree do monorepo. `apps/estaleiro` no monorepo é só
**código-fonte**. A instância operacional é uma **cópia/build separada e standalone** (candidata:
empacotamento Electron, alinhado à escolha F1/D4) que roda a partir de um diretório distinto
(clonado ou buildado), **atualizada periodicamente** a partir da fonte no monorepo — nunca editada
in-place pelos agentes que ela mesma despacha. Isso elimina por construção o risco de um agente
despachado pelo Estaleiro corromper o próprio Estaleiro em execução: eles não compartilham working
tree. Fica para o endurecimento definir a cadência de rebuild/update (manual vs. CI local).

## 4. Questionário de especificação — RESOLVIDO

As 26 perguntas dos blocos A–G foram respondidas em sessão de perguntas em lote (2026-07-05).
Ver a tabela completa na §2 ("Decisões do questionário A–G"). Três componentes novos nasceram do
processo (não previstos no esboço original): `plugin-skills` (B5), `plugin-telemetry` (C2),
`plugin-dispatcher` (D1) — já refletidos no diagrama da §3. Nenhum bloco ficou em aberto; o RFC
está pronto para decompor em tasks EST-* (ver §5).

## 5. Impacto nas tasks enfileiradas (estado 2026-07-05)

### Emenda de execução incremental (2026-07-13)

A decomposição original EST-01..16 registra a arquitetura, mas não autoriza construir tudo em
paralelo. A execução corrente segue a ordem normativa de `docs/especificacao-estaleiro.md §1` em
rolling wave: Fase 0 → P1 → gate remoto+local → P2. Por isso o `plugin-knowledge-graph` **não ganha
task agora**: seu primeiro entregável será um spike de P2, criado just-in-time depois do gate de P1.
O spike deve decidir por evidência o parser/gramáticas, o schema incremental e o contrato mínimo;
só então uma ADR Accepted registra essas escolhas.

Para UI, o corte mínimo reutilizável é `T-DS-01 → T-DS-03 → T-UIE-01 → T-UIE-03 → EST-42`. O spike de identidade visual
`T-DS-05` pode evoluir valores dos tokens em paralelo e não bloqueia esse corte: componentes
consomem a camada semântica, não a paleta literal. Shell FlexLayout e views específicas continuam em
`apps/estaleiro` apenas como adapters/composição; engines vão para `@plataforma/shell` e
`@plataforma/ui-engines` (ADR 0016).

| Task | Status | Impacto |
|---|---|---|
| ORQ-09a/09b/10 | done | Código = **seed dos plugins** fs-tools/agent-harness. Migram por move (G2). |
| **ORQ-11** (religar orquestrar.mjs no Docs) | draft:triaged | **CONFIRMADA obsoleta (D1)** — o dispatcher renasce como `plugin-dispatcher` no monorepo superapp, não religado dentro do Docs. Fechar com nota apontando para a task EST-* sucessora, não decompor mais. |
| **ORQ-13** (otimizador de contexto) | ready | **Executar como está** em `tools/orchestrator/` — o código É o seed do plugin-context (E1: primeiro degrau do ladder). Migra por move (G2) quando as tasks EST-* de bootstrap existirem. |
| ORQ-12/14/15 | done | ADRs 0009/0010/0011 = fundação do plugin-context e da infra de inferência. Nada a fazer. |
| T-IA-01..06 | ready/triaged | Intocadas (são do produto). A infra de inferência (ADR-0011) as serve. |
| Nexus (apps/nexus-*) | congelado | Morto de vez como direção; `manage-task.mjs` continua operando o MGTIA no Docs até B6 (paridade). |
| Fluxo MGTIA no Docs | vivo | Continua até o cut-over (B6, paridade completa incl. decisão/endurecimento). Sem features novas no ferramental do Docs. |

### Tasks criadas (2026-07-05) — `tasks/EST-01.md` .. `tasks/EST-15.md`

| Task | Componente | Deps | Complexidade |
|---|---|---|---|
| EST-01 | Bootstrap do monorepo | — | 3 |
| EST-02 | Host de plugins (manifest + mediação total) | EST-01 | 5 — decompor |
| EST-03 | plugin-tasks (schema completo + guardas B3) | EST-02 | 7 — decompor |
| EST-04 | Migração das ~200 tasks | EST-03 | 5 — decompor |
| EST-05 | plugin-fs-tools (move ORQ-09a) | EST-02 | 2 |
| EST-06 | plugin-agent-harness (move ORQ-09b/10) | EST-02, EST-05 | 3 |
| EST-07 | plugin-dispatcher (sucessor orquestrar.mjs — **fecha ORQ-11**) | EST-02, EST-03, EST-06 | 4 |
| EST-08 | plugin-local-inference (substrato ORT, NOVO) | EST-02 | 4 |
| EST-09 | plugin-context (move ORQ-13 + tier L2) | EST-02, EST-08 | 4 |
| EST-10 | plugin-providers (fallback/scoring/**telemetria interna** — extração OmniRoute) | EST-02 | 5 — decompor |
| ~~EST-11~~ | ~~plugin-telemetry~~ — **MESCLADA em EST-10** (§6.4: uma capacidade só) | — | — |
| EST-12 | plugin-skills (NOVO) | EST-02 | 4 |
| EST-13 | plugin-knowledge (OKF+FTS+writer serial) | EST-02 | 5 — decompor |
| EST-14 | Frontend (semente Lovable A1, 5 views) | EST-03, EST-06, EST-10, EST-13 | 6 — decompor |
| EST-15 | SPIKE empacotamento standalone (D4) | EST-14 | 4 (opus-spike) |
| EST-16 | plugin-workflows (desenho/gestão de fluxos — JDM/Zen, mesma engine de T-604; adapter para `FlowGraphViewModel`) | EST-02, EST-07 | 4 |

Todas em `draft:placeholder` — seguem o fluxo MGTIA normal no Docs (`/endurecer-task` decompõe as
de complexidade ≥5, `/arquiteto-decisoes` resolve o que ficar em aberto, `/arquiteto-promover`
libera pra `ready`) até o cut-over (B6).

## 6. Fronteiras conceituais — Plugin vs Conector vs Módulo (2026-07-05, addendum)

Dúvida levantada pelo arquiteto: o superapp tem três palavras — **conectores**, **módulos**,
**plugins** — usadas para coisas parecidas, risco de construir a mesma coisa duas vezes (o caso
que acendeu o alerta: `plugin-tasks` do Estaleiro vs. um futuro **módulo** de gestão de tarefas
estilo Jira no superapp). A wiki **já resolve isso** — não é uma decisão nova, é aplicar o que
`docs/conceitos/plugin.md` e `docs/conceitos/lente-de-modulo.md` já fixam:

### 6.1 — Conector NÃO é uma categoria própria. É uma das 4 categorias de Plugin.
`plugin.md`: todo plugin tem exatamente uma categoria — `compute` (função invocável, `ComputePort`),
**`connector`** (ponte ao mundo externo, classes A–E de `conector-externo.md`, via
`NetworkAdapterPort`), `infra` (serviço com canais de rede **próprios**), `ui` (frontend). Ou seja:
"NetworkConnector"/"StorageConnector" **são plugins da categoria `connector`** — não existe um
terceiro conceito "conector" flutuando ao lado de "plugin". A pergunta certa nunca é "isto é um
conector ou um plugin?" — é "que categoria de plugin é este?".

### 6.2 — Módulo NÃO é uma unidade de execução. É uma lente sobre o MESMO subgrafo.
`lente-de-modulo.md`: "módulos (ERP, CRM, Marketplace) não possuem bases de dados duplicadas ou
APIs de sincronização entre si — são wrappers e projeções que leem e escrevem sobre o **mesmo
subgrafo compartilhado**". Um módulo não roda código isolado nem tem storage próprio; é
UI+SPEC+tipos de nó sobre o grafo que já existe. **Isto resolve a dúvida do arquiteto:**
`plugin-tasks` (EST-03) é a ferramenta de engenharia INTERNA do Estaleiro — um serviço descartável
com schema próprio, porque o Estaleiro não é o superapp e não roda sobre o grafo de conteúdo do
produto. Um eventual **módulo de gestão de tarefas do PRODUTO** (Jira-like, para os usuários finais)
seria outra coisa — uma lente sobre `CONTENT`/`INTENT` do grafo, **sem** banco próprio. As duas
coisas não competem porque servem sistemas diferentes (ferramenta de dev vs. feature de produto);
mas fica registrado aqui: **se/quando esse módulo for especificado, ele segue `lente-de-modulo`
à risca — nenhum banco separado, nenhuma tentação de "aproveitar" o schema do plugin-tasks.**

### 6.3 — "Componentes de lógica pura" (a dúvida sobre plugins vs. componentes reusáveis)
A categoria `compute` do plugin JÁ É isso — função invocável via `ComputePort`. A pergunta reduz a:
quando algo vira plugin `compute` formal (assinado, versionado, distribuído pelo blob-plane) vs.
quando é só um pacote interno comum (import direto, sem a cerimônia de plugin)? **No superapp
real:** vira plugin quando precisa ser trocável/atualizável independente do host sem redeploy (ex.:
um provedor de IA de terceiro, instalável pelo usuário). **No Estaleiro (este RFC):** a "cerimônia"
de plugin (assinatura, `SPECIFICATION` kind `PLUGIN`, distribuição por blob-plane) **não se aplica**
— o Estaleiro não roda sobre o grafo, então `packages/plugin-*` aqui são **pacotes de workspace
normais atrás do contrato de mediação do host** (A1-A3), não plugins criptograficamente assinados.
É treino para a forma final, não a coisa em si — vale não confundir as duas cerimônias.

### 6.4 — Rechecagem de sobreposição nas 15 tasks EST — 2 achados
Aplicando a pergunta "isto é a MESMA capacidade em dois lugares?" a cada par de plugins:

- **`plugin-providers` × `plugin-telemetry` — SOBREPOSIÇÃO CONFIRMADA, mesclado.** Telemetry só
  existe para alimentar o scoring de providers; providers só tem scoring por causa da telemetry —
  é uma capacidade só, artificialmente partida em dois plugins com fronteira de host entre eles.
  **Ação: EST-11 mesclada em EST-10** (telemetry vira módulo interno de `plugin-providers`, não um
  plugin próprio mediado pelo host). Ver §5 atualizado e os arquivos das tasks.
- **`plugin-skills` × `plugin-knowledge` — mecanismo raso compartilhado, domínios diferentes (NÃO
  mesclar).** Os dois fazem "CRUD de markdown + commit git serializado" — mas servem domínios
  genuinamente distintos (config de agente vs. conhecimento/RAG do produto), então continuam
  plugins separados. O que muda: **ambos devem consumir a escrita mediada de `plugin-fs-tools`**
  (nunca escrever arquivo direto) e compartilhar o pequeno utilitário de "fila de commit serial"
  em vez de cada um reimplementar a sua. Nota adicionada em EST-12/EST-13 §2.
- **`plugin-context` × `plugin-local-inference` — camadas corretas, não é sobreposição.** Já
  desenhado como dependência (context CONSOME local-inference), não duplicação — confirmado, sem
  mudança.
- **`plugin-dispatcher` × `plugin-tasks` — camadas corretas.** Dispatcher é política de
  escalonamento que atravessa tasks+harness; não duplica o dado de tasks. Confirmado, sem mudança.

### 6.5 — Acesso a rede: mediado por padrão; exceção é categoria `infra`, não brecha
Confirmação direta à pergunta do arquiteto: **sim**, todo plugin `connector` fala com a rede através
do `NetworkAdapterPort` mediado — nunca socket cru. LiveKit (SFU) e WebTorrent (P2P) **não** são uma
exceção "escondida" a essa regra — são plugins da categoria **`infra`**, que por definição em
`plugin.md` tem "canais de rede próprios" porque a natureza do protocolo exige (WebRTC de baixa
latência, DHT/BitTorrent) — a exceção é **categórica e nomeada**, não um buraco na regra. `plugin-
providers` (chamadas HTTP a LLMs) **não** se qualifica para `infra`: é HTTP request/response comum,
encaixa como plugin `connector` — na taxonomia de `conector-externo.md`, mais perto da **Classe E
(Provedor de consulta — grafo→externo→grafo, não afirma fato durável por si)**, então vai pelo
`NetworkAdapterPort` mediado como qualquer outro. **No host do Estaleiro (EST-02):** a porta de
rede mediada serve `plugin-providers` hoje; uma porta de canal-próprio (`infra`) não é necessária
agora (Estaleiro não porta LiveKit/WebTorrent) — mas o host deve **distinguir as duas portas** na
API (mediada vs. canal-próprio) para não normalizar "provider pede acesso cru" como aceitável.

### 6.6 — Reuso de código das referências (headroom/OmniRoute/orca/sift)
Clonados (raso, sem `.git`, ~310MB) em `docs/_vendor/{headroom,omniroute→OmniRoute,orca,sift}/`
(gitignored — não versiona no Docs; refrescar reclonando quando precisar de código atualizado).
Tasks que extraem/portam mecanismo destas fontes (EST-09 LLMLingua-2 já cita o pacote npm real, não
o vendor; EST-10 fallback/scoring do OmniRoute; EST-14 padrões de UI do orca; caderno 31/E2 trigram
do sift) devem citar **caminho de arquivo exato dentro do vendor**, não mais URL do GitHub — mesma
disciplina de "cite ou escale" do endurecimento.

### 6.7 — `plugin-knowledge` × `plugin-knowledge-graph`: complementares, não duplicados

`plugin-knowledge` ingere e recupera documentos por identidade, texto, FTS e futura similaridade
vetorial. `plugin-knowledge-graph` indexa a estrutura do código e responde relações reproduzíveis
entre arquivos e símbolos. PDFs/Markdown são normalizados pelo primeiro; o segundo pode receber
trechos documentais apenas para produzir arestas `inferred`, nunca para duplicar a ingestão.

O núcleo do grafo de código funciona sem LLM. Arestas `extracted` e `inferred` carregam proveniência
distinta, e consultas usam somente `extracted` por padrão. `shortest_path` com hipóteses exige opção
explícita do chamador. A atualização é incremental por hash de arquivo e usa storage mediado pelo
host, em tabelas próprias no SQLite. A superfície mínima candidata é: indexar/atualizar, consultar
vizinhança, caminho mínimo e impacto.

O projeto [Graphify](https://github.com/Graphify-Labs/graphify) é referência funcional; não é
dependência nem fonte a ser portada. O binding WASM
[web-tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web) só será
ratificado após spike provar as gramáticas-alvo, desempenho incremental e Windows ARM64. Antes
disso não há ADR de implementação: ADR registra a decisão fechada pelo spike, não a proposta.

## 7. Referências

- [ADR 0016 — UI engines e FlowGrid](../adr/0016-ui-engines-e-flow-grid.md)
- ADR-0008/0009/0010/0011 · caderno 30 (otimização de contexto/tooling) · caderno 31 (cofre de código) · caderno 12 (plugins) · caderno 14 (IA/RAG)
- OmniRoute (`github.com/diegosouzapw/OmniRoute`, MIT) — extração: fallback tiers, session-dedup, relevance; validação: pipeline deles converge com nosso ladder (LLMLingua-2/CCR/crusher)
- Orca (`github.com/stablyai/orca`, MIT) — padrões de UI: fan-out N worktrees, diff annotation, task→worktree
- sift (`github.com/botirk38/sift`) — trigram p/ code-context (E2) · OKF · JSON→CSV (E3)
- Graphify (`github.com/Graphify-Labs/graphify`) — referência de knowledge graph de código; sem port direto
- Tree-sitter Web (`tree-sitter/tree-sitter/lib/binding_web`) — candidato Node/WASM sujeito a spike
- Lições ORQ: bancada antes de adotar claim (headroom 8,5% real; kompress ilegível; L2 250ms) — **toda adoção passa pela bancada**
