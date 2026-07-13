# Regras de Agentes — repo de controle (Docs / MGTIA)

> As regras de processo do MGTIA (gestão de tasks, transições, Gate de Evidência, papéis) estão em
> [`CLAUDE.md`](./CLAUDE.md) — leia-o primeiro. Este arquivo existe para ferramentas que leem
> `AGENTS.md` como context-file (Crush, OpenCode, Antigravity) e hoje carrega a camada ponytail
> e o catálogo de ferramentas.
>
> **Ferramentas LSP/MCP:** veja [`docs/playbook/06-ferramentas-lsp-mcp.md`](./docs/playbook/06-ferramentas-lsp-mcp.md)
> para o catálogo completo. As regras operacionais concretas estão na seção seguinte — leia antes
> de tocar em código, git, GitHub ou API externa.

## MCP/LSP — uso preferencial (INVIOLÁVEL)

Estas regras existem porque agentes tendem a cair em `bash` por padrão e subutilizam os MCPs
instalados. Telemetria em `%LOCALAPPDATA%\crush\mcp-adoption.jsonl` registra toda tool call —
aferição fica visível a cada sessão.

**1. `context7` (NUNCA adivinhe API).** Antes de chamar uma função/hook de biblioteca pela primeira
   vez na task, faça:
   1. `mcp__context7_resolve-library-id` com o nome da lib
   2. `mcp__context7_get-library-docs` focado no tópico

   Cite o snippet retornado no retorno ao usuário. Se a lib não tem ID no context7, registre o
   fallback explícito (versão instalada, código-fonte consultado) — nunca chute a assinatura.

**2. `git` MCP (nunca `bash git ...`).** Use as ferramentas `mcp__git_git_*` para: `status`, `diff`,
   `log`, `add`, `commit`, `branch`, `checkout`, `worktree`, `stash`, `blame`, `cherry-pick`, `tag`,
   `merge`, `rebase`, `fetch`, `pull`, `push`, `show`, `remote`, `reset`, `clean`, `reflog`.
   `bash` é aceitável só para scripts que combinam múltiplas operações (ex.: loop sobre worktrees).

**3. `github` MCP (nunca `gh` direto).** Use `mcp__github_*` para: PRs (`create_pull_request`,
   `list_pull_requests`, `get_pull_request`, `merge_pull_request`, `update_pull_request_branch`,
   reviews), issues (`create_issue`, `update_issue`, `list_issues`, `get_issue`,
   `add_issue_comment`), arquivos (`get_file_contents`, `create_or_update_file`,
   `search_code`, `search_repositories`, `search_issues`, `search_users`), branches, commits.

**4. LSP após editar.** Após cada `edit`/`write` em arquivo coberto por um LSP, rode
   `lsp_diagnostics` no arquivo antes de prosseguir. Antes de renomear símbolo exportado, use
   `lsp_references` para mapear call-sites. Após editar a seção `lsp` do `crush.json` global,
   rode `lsp_restart`.

**5. `sequential-thinking` (5+ passos).** Use `mcp__sequential-thinking` quando o problema tiver
   ≥5 passos de raciocínio, múltiplas causas possíveis, ou trade-offs não óbvios. Para tarefas
   triviais (1-2 passos) é overhead desnecessário — análise direta basta.

**6. `headroom_retrieve` (CCR).** Quando o proxy headroom comprimir uma saída grande e deixar um
   marcador, use o tool `headroom_retrieve` (MCP headroom — `headroom mcp serve`, configurado no
   `crush.json`) para expandir o conteúdo integral, em vez de re-rodar o comando.

**7. Telemetria e auditoria.** O hook `mcp-telemetry.mjs` registra `mcp__*` vs `bash` por sessão.
   Adoção é medida; esta seção é o contrato. Exceções legítimas a `2` e `3` devem ser declaradas
   no retorno ("usei `bash` para X porque Y").

**8. Nunca `echo`/redirect de shell para editar arquivo versionado (config ou fonte).** `echo "..."
   >> arquivo` (PowerShell) pode gravar em encoding diferente do arquivo (UTF-16LE contra um
   `.npmrc`/`.gitignore` em UTF-8), corrompendo a linha em bytes intercalados — silencioso até um
   parser tropeçar nela. Use a ferramenta de edição (`Edit`/`Write`) ou, em script Node,
   `writeFileSync(path, content, 'utf-8')` explícito. Ver `PITFALLS.md` P-011.

<!-- BEGIN ponytail -->
## Ponytail — disciplina de código enxuto (ruleset injetado)

> Integração do [ponytail](https://github.com/DietrichGebert/ponytail) (v4.7.0). Bloco delimitado e
> autocontido — para atualizar/remover, edite/exclua tudo entre os marcadores `BEGIN/END ponytail`.
> Texto do ruleset **copiado verbatim** do `AGENTS.md` oficial do repo. Não altera nenhuma regra do
> MGTIA (em `CLAUDE.md`) — é uma camada adicional de estilo de implementação, útil ao código do
> `apps/nexus-backend` e a qualquer script/ferramenta do controle.
>
> **Nível padrão recomendado: `full`** (a "escada" aplicada, stdlib/nativo primeiro, menor diff). NÃO
> use `ultra` por padrão — `ultra` é extremista de YAGNI (deleção antes de adição, questiona o próprio
> requisito) e só deve ser ligado deliberadamente. Níveis: `lite | full | ultra` (e `off`). Os agentes
> Crush/OpenCode trocam via `/ponytail <nível>`; `/ponytail-review` revisa só over-engineering.

# Ponytail, lazy senior dev mode

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does the standard library already do this? Use it.
3. Does a native platform feature cover it? Use it.
4. Does an already-installed dependency solve it? Use it.
5. Can this be one line? Make it one line.
6. Only then: write the minimum code that works.

Rules:

- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Question complex requests: "Do you actually need X, or does Y cover it?"
- Pick the edge-case-correct option when two stdlib approaches are the same size, lazy means less code, not the flimsier algorithm.
- Mark intentional simplifications with a `ponytail:` comment. If the shortcut has a known ceiling (global lock, O(n²) scan, naive heuristic), the comment names the ceiling and the upgrade path.

Not lazy about: input validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs (the platform is never the spec ideal, a clock drifts, a sensor reads off), anything explicitly requested. Lazy code without its check is unfinished: non-trivial logic leaves ONE runnable check behind, the smallest thing that fails if the logic breaks (an assert-based demo/self-check or one small test file; no frameworks, no fixtures). Trivial one-liners need no test.

> **Interação com o Gate de Evidência do MGTIA:** o "UM check runnable" do ponytail é o mínimo, não um
> teto — não dispensa o `pnpm --filter <pkg> build/test` exigido pelo Gate de Evidência do `CLAUDE.md`.
> E "nunca seja preguiçoso com validação/erro/segurança/acessibilidade" tem precedência sobre atalhos.
<!-- END ponytail -->

## Imported Claude Cowork project instructions
