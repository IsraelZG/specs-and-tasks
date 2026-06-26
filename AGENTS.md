# Regras de Agentes — repo de controle (Docs / MGTIA)

> As regras de processo do MGTIA (gestão de tasks, transições, Gate de Evidência, papéis) estão em
> [`CLAUDE.md`](./CLAUDE.md) — leia-o primeiro. Este arquivo existe para ferramentas que leem
> `AGENTS.md` como context-file (Crush, OpenCode, Antigravity) e hoje carrega a camada ponytail
> e o catálogo de ferramentas.
>
> **Ferramentas LSP/MCP:** veja [`docs/playbook/06-ferramentas-lsp-mcp.md`](./docs/playbook/06-ferramentas-lsp-mcp.md)
> para o catálogo completo. Prefira MCP sobre shell para git/github; use `context7` para confirmar
> APIs; use LSP diagnostics/references para navegação e validação de código.

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
