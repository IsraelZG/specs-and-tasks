# SuperApp V0.41 — Convenções e MGTIA

> **Ambiente:** leia `PITFALLS.md` antes de rodar qualquer comando de build/install.

---

## Wiki

**Estrutura:** `docs/conceitos/<slug>.md` = definição única e canônica. Cadernos (`docs/caderno-{1..4}/`) adicionam ângulos via `[[slug]]` — nunca redefinem.

**Quatro lentes:** vision (por quê/para quem) · protocol (contrato agnóstico de linguagem) · sdk (impl. TS) · governance (política/evolução).

**Regras:**
- Uma definição por conceito. Em qualquer outro lugar: linke com `[[slug]]`, não copie.
- Conteúdo normativo (crypto, invariantes, fórmulas): MOVA o texto original — não parafraseie.
- Git guarda o histórico. Mova, mescle e DELETE livremente. Sem duplicatas "por segurança".
- Um conceito ou caderno por commit. Rode `/verificar` ao terminar cada unidade.

**RFCs:** proposta → absorver com `/absorver-rfc` → deletar `rfc-*.md`. Status em `docs/rfcs/_status.md`. Template em `docs/rfcs/_TEMPLATE.md`.

**Fase 2 concluída** (ondas 1–12). Inventário: `docs/conceitos/_inventario.md` · Plano: `docs/conceitos/_plano-de-ondas.md`.

## Lei de Aprendizado

Após cada problema não trivial resolvido, execute a habilidade `extract-approach` antes de
prosseguir. Uma solução sem sua nota de aprendizados — ou sem a confirmação explícita de que o
aprendizado já vive no artefato canônico — é trabalho inacabado.

**Melhoria contínua (2026-07-20):** entender *o que houve* não basta — todo problema enfrentado
gera também uma **proposta de mudança de processo** que o teria evitado (roteada pelo
extract-approach: armadilha→`PITFALLS.md`, conduta→skill, invariante→guard executável por M6).
Sintoma repetido 2x sem mudança de processo é falha do processo, não do executor.

---

## MGTIA — Gestão de Tarefas

> **NEXUS CONGELADO (2026-06-17):** `apps/nexus-backend` e `apps/nexus-frontend` são a *ferramenta* MGTIA, não o produto, e estão congelados — fora do `build`/`dev`/`lint` da raiz (ver `package.json`). Workers e reviewers NÃO rodam build/test/lint do nexus; rodam só o `pnpm --filter <pacote da task>` da própria task. Continua buildável sob demanda (`pnpm --filter nexus-backend build`); o `manage-task.mjs` usa o `dist/` já compilado, então o MGTIA segue funcionando.
>
> **⛔ NÃO citar arquivos do nexus como "fonte canônica" para specs de outras tasks (2026-07-06).**
> `apps/nexus-backend` pode nem existir na worktree corrente (congelado ≠ garantido presente) e é o
> sistema que o Estaleiro/`plugin-tasks` (RFC-018 B1) está **substituindo**, não espelhando ao pé da
> letra. Comportamento de MGTIA (sub-status, verbos, transições) tem como fonte viva **este
> CLAUDE.md + o comportamento real do `manage-task.mjs`** — não um arquivo `.ts` do nexus que pode
> estar ausente/desatualizado na sua worktree. Se uma spec depende de "bater com o comportamento
> canônico do MGTIA" e a fonte não resolve no estado atual, é decisão de arquiteto (Seção 6 da
> task), não suposição do endurecedor. (Achado real: EST-03b R1 citou `task.types.ts` do nexus como
> canônico — arquivo inexistente na worktree do superapp.)

Tasks em `/tasks/` (implementação) e `/meta-tasks/` (gestão). Dashboard: `tasks/INDEX.md` — use-o, não inspecione arquivos individuais.

A fonte canônica de gestão de tarefas é o Nexus (tool MCP nexus_transition_task ou
POST /api/tasks/:id/transition). A CLI node tools/scripts/manage-task.mjs <action>   <taskId> <SeuNome> [mensagem] é um atalho legado que delega ao mesmo serviço — use-a
quando o backend não estiver no ar. NUNCA edite status, INDEX.md ou Log manualmente no Markdown,
**mesmo se o comando falhar ou o ambiente estiver quebrado** (build travado, EACCES, file lock).
Falha de ambiente durante uma transição é ela mesma um BLOCKER — registre como tal (`pause` ou
`request_changes`), nunca contorne escrevendo o arquivo na mão.
Ações: triage, harden, decide, block_decision, decompose, promote, start, pause, finish, claim, approve, request_changes, block, unblock.
Ciclo: draft:placeholder → draft:triaged → draft:hardened → ready → in_progress → review → in_review → rework → done (+ blocked).

> **Identidade do agente (`<SeuNome>`/`<EU>`) — INVIOLÁVEL.** O Log §9 e o `ledger.mjs` só têm valor
> se `<SeuNome>` for o **modelo real** que está rodando — não o harness, não o papel. Regras:
> - **SIM:** o identificador do modelo subjacente — `deepseek`, `gemini`, `claude-opus`, `minimax`, `claude-sonnet` etc.
> - **NÃO o harness/ferramenta** que hospeda o modelo — `Crush`, `Antigravity`, `opencode` não são
>   identidade de modelo, são o TUI/orquestrador. Se você roda via Crush (que roteia por Headroom),
>   passe o modelo que o Headroom de fato serviu, não "Crush".
> - **NÃO o papel/perfil** da task — `agile_reviewer`, `devops_agent`, `logic_agent`, `spec_hardener`,
>   `arquiteto` são `target_agent`/`reviewer_agent` (rótulos de função no frontmatter), não identidade.
> - **Exceção (gate do serviço):** `approve`/`request_changes` exigem que o ator comece com o **papel**
>   exigido por `reviewer_agent` (default `agile_reviewer`) — é o que impede auto-aprovação. Para
>   registrar o modelo revisor mesmo assim, use o formato **`agile_reviewer:<modelo>`** (ex.:
>   `agile_reviewer:gemini`) — o serviço autoriza pelo prefixo antes de `:`, o ledger exibe só o modelo.
Cada task iniciada ganha uma branch task/<ID> (isolamento) **no repo superapp (código).** No repo Docs (controle), tarefas são editadas diretamente na `master` — o histórico de gestão (status, pareceres, logs) precisa ser visível a todos sem depender de merge.

> **Paralelismo no controle (INVIOLÁVEL).** O Docs é um working tree único na `master` com vários agentes ao mesmo tempo. **Agentes NÃO rodam git no Docs** — nem `commit`, nem `push`, nem `add`. Isso tirava tempo (sobretudo do QA) com `index.lock`, disputa de push e "filtrar o que é meu". Em vez disso:
> - **Edite só o markdown da sua task** (`tasks/T-XXX.md`, `tasks/_pendencias.md`, etc.) e **ENFILEIRE** a intenção de commit: `node tools/scripts/fila.mjs add <ID> "<msg>" [paths extra]`. Pronto — você não toca git. O default de path é `tasks/<ID>.md`; passe paths extra se editou outros arquivos.
> - **Um único consumidor serial** (`/drenar-fila` → `fila.mjs flush`) faz TODOS os commits pendentes (atômicos por path) + um push, periodicamente. Um só committer ⇒ zero corrida de index/push.
> - **NUNCA** `git commit`/`git push`/`git add` no Docs a partir de uma skill de worker/reviewer/arquiteto. Se precisar persistir, **enfileire**.
> - **`tasks/INDEX.md`** (e `meta-tasks/INDEX.md`) e **`tasks/.commit-queue/`** são **gitignored** — o `TaskService` regenera o INDEX a cada transição; a fila é transiente. Nunca commite.
> - **No superapp (código) o git continua igual:** cada task tem branch `task/<ID>` isolada (worktree), o worker commita+pusha lá normalmente. A fila é **só do controle**.
> - **Validações pesadas são outra fila, global à máquina:** `pnpm gate` e os scripts de teste do
>   Estaleiro usam o lease em `git-common-dir/mgtia-validation-queue`. Worktrees e master entram na
>   mesma FIFO. A integração mantém esse lease de sync até push; não rode runners internos por fora.

### As 6 Regras

**1. SDD — Spec é a fonte absoluta.** Leia o bloco "Contexto RAG" da task antes de codar. Se a spec estiver ambígua ou impossível → `pause` com o bloqueio descrito.

**2. Estado e Handoff.** `start` ao iniciar. `pause` com resumo claro se travar ou estourar tokens — o próximo agente depende disso para assumir. **Se a task tem worktree/branch no superapp** (todas exceto tooling-do-controle, ver `integrar-task` Caminho A-tooling), **`finish` exige a worktree commitada e limpa** (`git status --short` vazio na branch `task/<ID>`) — o `TaskService.transition()` só enxerga o texto da Seção 8, nunca o estado git do repo de código, então "gate passou" sem commit real passa despercebido até o `integrar-task` tentar mergear e achar nada para integrar. Já aconteceu 2x em sequência (EST-34 rodada 1, EST-33 rodada 1) — ver `PITFALLS.md` e a task de guard correspondente.

**2b. Multi-máquina — pull é obrigatório (desde 2026-06-22).** Este repo (e o `superapp`) são trabalhados em mais de uma máquina contra o mesmo remote. `git pull` em ambos os repos no início de cada sessão e antes de `pnpm wt new`/`merge` (o script já faz fetch+pull --ff-only automático e aborta se divergente, mas isso não substitui o pull manual ao retomar trabalho). Termine toda task com push dos dois repos (código + controle) — sem isso a outra máquina vê um estado velho e pode duplicar/sobrepor trabalho.

**3. Gate de Evidência (INVIOLÁVEL).** `finish` só com `pnpm gate <pkg> --profile <test_profile>`
verde e seu artefato `.gate/<tree>.json` commitado. Perfis: `backend` (sem browser), `ui` (UI +
Playwright) e `full` (default conservador). `manage-task.mjs` recusa perfil diferente do declarado.
O gate local é serializado automaticamente na máquina.

> **3b. E2E é seletivo, não opcional (M3/M-017).** Task `ui: true` ou fluxo observável usa
> `test_profile: ui|full`; backend interno usa `backend`. O reviewer valida o artefato pela árvore
> e não repete a suíte inteira: faz 1–3 sondas focais. Browser ausente numa task UI invalida o gate.
>
> **3c. Gate de ONDA = demo executável (M1, 2026-07-19).** Gate verde por task NÃO prova que o produto funciona — 86 tasks verdes conviveram com uma **tela em branco** por 10 dias porque nada exercitava a *composição*. Toda onda/fatia fecha com um smoke de produto: subir o standalone e provar UMA ação de usuário ponta-a-ponta ("boot → clicar → efeito observável"), com a saída colada. Gate unitário mede a peça; o smoke de onda mede o carro.

**4. Rework (auto-contido).** Task em `rework`? Leia o "Parecer do Revisor" (seção 8) e corrija EXATAMENTE os achados `[Bn/Mn/mn]`. Re-rode o gate com o `test_profile` declarado, chame `finish`. O ciclo worker→review→rework roda sem intervenção humana.

**5. Automação.** Tarefas repetitivas viram scripts, subagents (`.claude/agents/`) ou skills (`.claude/skills/`). Idempotência obrigatória.

> **5b. Regra nova só se virar código (M6, 2026-07-19).** Toda INVIOLÁVEL nova entra como **guard executável** (pré-check no `manage-task.mjs`, guard no TaskService, ou check em script) — não como mais um parágrafo neste arquivo. Prosa já provou que não segura modelo pequeno: os logs contêm claims factualmente falsos registrados COM as regras escritas ("0.0.90 = master" quando era 0.0.98; commit "revert version bump" cujo diff bumpa). Cada incidente virando regra-de-prosa é cicatriz sobre cicatriz que o próximo modelo pequeno também não carrega. Este documento deve **encolher** conforme regras viram guards, não crescer. (Padrão de referência: o gate-on-finish e os guards M4 são pré-checks no wrapper `manage-task.mjs`, fora do nexus congelado.)

**6. Separação de papéis nas transições (INVIOLÁVEL).** `approve`/`request_changes` são exclusivos
do Reviewer (`frontmatter.reviewer_agent` da própria task). Worker NUNCA chama essas duas ações —
nem para "destravar" uma task que ficou presa em `review` por uma rodada anterior incompleta. Se
`finish` falhar porque a task já está em `review`/`done`, o Worker PARA e usa `pause` para
registrar o que encontrou; não tenta o próximo verbo só porque o serviço aceitaria. (Ver
`tasks/T-1025.md` — esta regra está sendo reforçada no `TaskService`, não só em prosa.)

### Papéis

- **Architect:** cria tasks via `node tools/scripts/generate-task.mjs`.
- **Worker:** executa tasks ≤ Sonnet seguindo SDD + Gate de Evidência. Nunca chama `approve`/`request_changes`.
- **Reviewer:** audita tasks em `review` via `/qa-review <ID>`. **Primeiro passo é `claim`** (`review → in_review`, trava a task contra revisão duplicada). Se a task já está `in_review` → PARE (outro reviewer a pegou). Só escreve no Markdown a Seção 8
  (Parecer); o status/log/INDEX só mudam via `approve`/`request_changes` do serviço.

### Dimensionamento (INVIOLÁVEL)

O default é decompor: tasks ≤ Sonnet (preferencialmente Haiku), spec com zero decisões abertas, assinaturas e tipos explícitos, APIs fixadas, verificação por comando. O que exige Opus só para *decidir* → **spike** (entregável = ADR/PoC). Inclua `Capacidade-alvo: haiku | sonnet | opus | opus-spike` no corpo da task.

> **Dimensionar é bidirecional (M5, retrospectiva 2026-07-19).** Decompor 1→N não é sempre certo. Quando o **custo de esteira** (endurecer + worktree + gate + review + integrar + **reconciliar N specs que se cruzam**) supera o ganho de granularidade, **componha N→1** para uma Opus. Sinais de que deveria compor em vez de decompor: as tasks tocam os mesmos arquivos; o contrato de uma só fecha sabendo o da outra; o valor só aparece quando as N estão juntas (fatia vertical: UI + rota + fluxo). Trabalho **integrativo** (uma tela que precisa de backend+estado+layout juntos) é o caso típico — 3 Sonnet + 3 endurecimentos + 3 reviews + reconciliações custam mais que 1 Opus coerente. Métrica de decisão: *transições de status por linha útil entregue*, não número de tasks.
>
> **Como compor:** `node tools/scripts/compose-task.mjs <novoId> "<título>" <src1> <src2> [...]` — funde fontes **não-iniciadas** (draft:*/ready) numa Opus com proveniência, obsoletando as fontes. Depois `/endurecer-task <novoId>` unifica a spec. É o inverso simétrico do `decompose`. Opus é capacidade legítima para execução integrativa — não só para spike.

**Eixo de qualidade da spec.** O antigo campo `spec_status` foi colapsado nos sub-status de `draft:<sub>` — `draft:placeholder | draft:triaged | draft:pending_decision | draft:hardened | draft:decomposed`. Cada sub-status é transicionado pelos **verbos de endurecimento** (`triage`/`harden`/`block_decision`/`decompose`/`decide` via `manage-task.mjs`), não mais editando frontmatter à mão. **Endureça em dois passes:** triagem cedo (pega spikes/decisões), endurecimento profundo just-in-time (quando as deps já são `done`, troca placeholder por assinatura real — *reendurecimento*).

**Automatismos (T-1029):** `harden`/`decide` com deps todas `done` → auto-promove para `ready`; `approve → done` → auto-promove dependentes elegíveis e encerra pais decompostos quando a última filha fecha. Painel: `node tools/scripts/hardening.mjs [prefixo]` (estado dos draft:<sub> · fila de decisões · promovíveis safety-net · candidatas a reendurecer).

> **Guard M4 (2026-07-19):** `promote` (manual) agora **recusa** se qualquer dependência não estiver `done` — `in_progress`/`review` NÃO conta (`done` = mergeado na master; só então a dep existe para o worker herdar). O `finish` também avisa (não bloqueia) se `master` não é ancestral da branch — sinal de que a task precede deps já mergeadas e deveria mesclar master antes do review. Isso mata a classe de bug "branch fóssil" (ex.: EST-49b, cortada antes da dep EST-49a entrar → conflito estrutural garantido).

**Ledger de ciclo de vida.** `node tools/scripts/ledger.mjs [prefixo]` regenera `tasks/LEDGER.md` (gitignored): tabela agrupada por status com **quem fez cada papel** — worker, reviewer, cada rework (`N× (ator → ator)`), endurecedor. **Não é fonte nova nem passo a mais pro agente:** é uma *projeção* dos Logs §9 que o `manage-task.mjs` já escreve a cada transição (o ator é o `<SeuNome>` passado). Reworks variáveis não viram colunas fixas — viram uma célula. `/drenar-fila` o refresca no heartbeat periódico.

---

## Skills e Agentes

**Skills:** `/verificar` · `/qa-review` · `/integrar-task` · `/agrupar-cleanup` · `/endurecer-task` · `/endurecer-fila` · `/wargame-task` · `/arquiteto-decisoes` · `/arquiteto-promover` · `/drenar-fila` · `/vincular-rag` · `/executar-task` · `/executar-task-ui` · `/frontend-design` · `/rework-task` · `/absorver-rfc` · `/rodar-onda` · `/consolidar-arquivo` · `/consolidar-glossario` · `/handoff` · `/migrar-caderno` · `/novo-verbete` · `/revisar-rfc` · `/revisar-rfcs` · `/sync-provider`

> **Pipeline de uma task:** `/endurecer-task` (→ `draft:triaged`/`draft:hardened`/`draft:pending_decision`) · `/arquiteto-decisoes` (resolve decisões, chama `decide`) · `/arquiteto-promover` (safety-net: promove `draft:hardened` não pego pelo auto-promote) · `/wargame-task` (OPCIONAL, exige modelo forte: grava o Plano de Batalha §5b na task — rota movimento-a-movimento com observações esperadas, falhas+contra-movimentos, forks com gatilho, aborts — p/ worker menor executar cego; pós-ready, pré-execução) · `/executar-task` (worker, na worktree, commits frequentes; **se a task tem §5b, siga o plano à risca** — os forks/contra-movimentos já foram lutados por um modelo maior; **task de UI** (`ui: true`/frontend_agent) usa **`/executar-task-ui`** — loop visual HMR obrigatório + critério da `/frontend-design`; nunca estilizar às cegas) · `/qa-review` (Parecer, review-only, começa com `claim`) · `/integrar-task` (merge+`approve`, ou `request_changes`→`rework`; auto-side-effects T-1029 disparam no approve) · `/rework-task` (corrige os achados do Parecer, volta a `review`) · `/agrupar-cleanup` (drena o ledger de pendências). Painel transversal: `node tools/scripts/hardening.mjs`. **Persistência no controle:** cada skill **enfileira** o commit (`fila.mjs add`); `/drenar-fila` commita+pusha em lote (nenhum agente roda git no Docs).

> **Dimensionar antes de executar (M5):** `decompose` quebra 1→N (spec grande demais); `node tools/scripts/compose-task.mjs` funde N→1 numa Opus (esteira cara demais para o ganho de granularidade — trabalho integrativo). Decida a direção olhando *transições por linha útil*, não contagem de tasks. Ver "Dimensionamento (INVIOLÁVEL)".
>
> **M7 (orquestrador — operacional):** o `orquestrar.mjs` roda com `max_concurrent` configurável. Com `max_concurrent=0` **todo o custo do pipeline de despacho automático existe sem benefício** (todo despacho vira manual). Ou sobe para 1–2 e o sistema faz dogfooding (executa a própria construção, achando os gaps do plugin-dispatcher), ou se assume operação manual — mas então não pague o overhead de fila/slot fingindo automação.

**Agentes** (`.claude/agents/`): `agile-reviewer` · `auditor-consistencia-rfc` · `consolidador` · `criador-verbete` · `emendador-rfc` · `incorporador` · `rfc-roteador` · `triador-review`

---

## Ferramentas LSP/MCP (Crush)

> Crush disponibiliza LSPs e MCPs que os agentes devem usar ativamente. Catálogo completo e
> boas práticas em [`docs/playbook/06-ferramentas-lsp-mcp.md`](./docs/playbook/06-ferramentas-lsp-mcp.md).
