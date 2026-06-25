<<<<<<< HEAD
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

---

## MGTIA — Gestão de Tarefas

> **NEXUS CONGELADO (2026-06-17):** `apps/nexus-backend` e `apps/nexus-frontend` são a *ferramenta* MGTIA, não o produto, e estão congelados — fora do `build`/`dev`/`lint` da raiz (ver `package.json`). Workers e reviewers NÃO rodam build/test/lint do nexus; rodam só o `pnpm --filter <pacote da task>` da própria task. Continua buildável sob demanda (`pnpm --filter nexus-backend build`); o `manage-task.mjs` usa o `dist/` já compilado, então o MGTIA segue funcionando.

Tasks em `/tasks/` (implementação) e `/meta-tasks/` (gestão). Dashboard: `tasks/INDEX.md` — use-o, não inspecione arquivos individuais.

A fonte canônica de gestão de tarefas é o Nexus (tool MCP nexus_transition_task ou
POST /api/tasks/:id/transition). A CLI node tools/scripts/manage-task.mjs <action>   <taskId> <SeuNome> [mensagem] é um atalho legado que delega ao mesmo serviço — use-a
quando o backend não estiver no ar. NUNCA edite status, INDEX.md ou Log manualmente no Markdown,
**mesmo se o comando falhar ou o ambiente estiver quebrado** (build travado, EACCES, file lock).
Falha de ambiente durante uma transição é ela mesma um BLOCKER — registre como tal (`pause` ou
`request_changes`), nunca contorne escrevendo o arquivo na mão.
Ações: start, pause, finish, approve, request_changes, block, unblock.
Ciclo: draft → ready → in_progress → review → rework → done (+ blocked).
Cada task iniciada ganha uma branch task/<ID> (isolamento).

### As 6 Regras

**1. SDD — Spec é a fonte absoluta.** Leia o bloco "Contexto RAG" da task antes de codar. Se a spec estiver ambígua ou impossível → `pause` com o bloqueio descrito.

**2. Estado e Handoff.** `start` ao iniciar. `pause` com resumo claro se travar ou estourar tokens — o próximo agente depende disso para assumir.

**3. Gate de Evidência (INVIOLÁVEL).** `finish` só com a saída literal de `pnpm --filter <pkg> build` + `test` colada na mensagem. Sem evidência = não terminou. Se falhar, conserte antes — nunca finalize no escuro.

**4. Rework (auto-contido).** Task em `rework`? Leia o "Parecer do Revisor" (seção 8) e corrija EXATAMENTE os achados `[Bn/Mn/mn]`. Re-rode build+test, aplique o Gate, chame `finish`. O ciclo worker→review→rework roda sem intervenção humana.

**5. Automação.** Tarefas repetitivas viram scripts, subagents (`.claude/agents/`) ou skills (`.claude/skills/`). Idempotência obrigatória.

**6. Separação de papéis nas transições (INVIOLÁVEL).** `approve`/`request_changes` são exclusivos
do Reviewer (`frontmatter.reviewer_agent` da própria task). Worker NUNCA chama essas duas ações —
nem para "destravar" uma task que ficou presa em `review` por uma rodada anterior incompleta. Se
`finish` falhar porque a task já está em `review`/`done`, o Worker PARA e usa `pause` para
registrar o que encontrou; não tenta o próximo verbo só porque o serviço aceitaria. (Ver
`tasks/T-1025.md` — esta regra está sendo reforçada no `TaskService`, não só em prosa.)

### Papéis

- **Architect:** cria tasks via `node tools/scripts/generate-task.mjs`.
- **Worker:** executa tasks ≤ Sonnet seguindo SDD + Gate de Evidência. Nunca chama `approve`/`request_changes`.
- **Reviewer:** audita tasks em `review` via `/qa-review <ID>`. Só escreve no Markdown a Seção 8
  (Parecer) da própria task; o status/log/INDEX só mudam via `approve`/`request_changes` do
  serviço — mesmo quando build/lint falha por problema de ambiente.

### Dimensionamento (INVIOLÁVEL)

Tasks ≤ Sonnet (preferencialmente Haiku). A spec precisa ter: zero decisões abertas, assinaturas e tipos explícitos, APIs fixadas, verificação por comando. O que exige Opus → **spike** (entregável = ADR/PoC com critério claro) ou **épico** subdividido. Inclua `Capacidade-alvo: haiku | sonnet | opus-spike` no corpo da task.

---

## Skills e Agentes

**Skills:** `/verificar` · `/qa-review` · `/vincular-rag` · `/endurecer-task` · `/endurecer-fila` · `/executar-task` · `/absorver-rfc` · `/rodar-onda` · `/consolidar-arquivo` · `/consolidar-glossario` · `/handoff` · `/migrar-caderno` · `/novo-verbete` · `/revisar-rfc` · `/revisar-rfcs`

**Agentes** (`.claude/agents/`): `agile-reviewer` · `auditor-consistencia-rfc` · `consolidador` · `criador-verbete` · `emendador-rfc` · `incorporador` · `rfc-roteador` · `triador-review`
=======
# SuperApp — Código do Produto

> **Repo de CÓDIGO (greenfield).** As specs, tasks, RFCs, wiki e a ferramenta MGTIA vivem no
> **repo irmão `specs-and-tasks`** (pasta `C:\Dev2026\Docs`). Este repo só contém **produto**.
> A spec de cada task está em `<Docs>/tasks/<ID>.md` — ela é a fonte da verdade. Aqui não há
> conceitos/cadernos/RFCs; se precisar de contexto de arquitetura, leia a spec e os `[[links]]`
> que ela aponta no repo de controle.

## Ambiente (INVIOLÁVEL)

- **Runtime:** Node.js v20+.
- **Package Manager:** `pnpm` — **nunca** npm ou yarn (o lockfile é `pnpm-lock.yaml`).
- **Monorepo:** Turborepo (`turbo.json` + `pnpm-workspace.yaml` mapeando `packages/*` e `apps/*`).
- **TS:** estrito (`tsconfig.base.json` com `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`).
- **Testes:** `vitest` (packages) e `playwright` (E2E/web).
- **Lint:** `eslint` + `typescript-eslint`.
- **Leia `PITFALLS.md` do repo de controle** antes de rodar build/install pesado — esta é máquina
  Windows 11 ARM64; o `.npmrc` precisa de `supportedArchitectures` win32+arm64.
- **Build é Windows-native** (WSL/opencode abandonado — worktree e `node_modules` do WSL quebram no
  Windows; ver PITFALLS P-007). Rode o agente/Gate num **terminal standalone** (não o integrado do
  VS Code, que trava em `pnpm install` — P-002).
- **pnpm 11 bloqueia build scripts:** aprovação é `allowBuilds:` (mapa `pkg: true`) no
  `pnpm-workspace.yaml` — não `onlyBuiltDependencies` (ver PITFALLS P-006).

## Worktrees por task

O desenvolvimento roda **isolado numa git worktree por task** (branch `task/<ID>`), criada pelo
helper `pnpm wt new <ID>` que mora **no repo de controle (Docs)** e opera **sobre este repo**.
As worktrees ficam em `C:\Dev2026\.superapp-worktrees\<ID>` (fora do repo, não versionadas).
Cada worktree tem seu próprio `pnpm install` (~8s, store quente) — **não** compartilhe `node_modules`
via junction (o `pnpm run` aborta com `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`).

## Disciplina do Worker

Se você é um agente executando uma task, siga **`/executar-task <ID>`** (skill em
`.claude/skills/executar-task/`). Em resumo:

1. **A Seção 3 da spec é o escopo absoluto.** Não toque arquivos fora dela. Não instale libs de
   feature fora do que a spec lista.
2. **Gate de Evidência (INVIOLÁVEL):** só finalize com a saída **literal** de
   `pnpm install && pnpm -r build && pnpm -r test && pnpm -r lint` (Exit Code 0) colada na Seção 8
   da spec. Sem evidência = não terminou. Falhou? Conserte antes — nunca finalize no escuro.
3. **Status só pelo serviço:** transições de task (`start`/`finish`/`pause`/`block`) vão por
   `node "<Docs>/tools/scripts/manage-task.mjs" <ação> <ID> <SeuNome> "<msg>"`. **NUNCA** edite
   `status`/`INDEX.md`/Log na mão, mesmo com o ambiente quebrado — falha de ambiente é um BLOCKER
   (`pause`/`block`), não desculpa pra contornar.
4. **Separação de papéis:** o Worker **NUNCA** chama `approve`/`request_changes` — isso é exclusivo
   do Reviewer. Se `finish` falhar porque a task já está em `review`, **PARE** e use `pause`.
5. **Dois commits:** código aqui (`git push -u origin task/<ID>`); status + evidência no controle
   (`git -C "<Docs>" add tasks/<ID>.md && commit`). O `.nexus/` é gitignored.

> A revisão de QA é feita **no repo de controle** (`/qa-review <ID>`), por um agente revisor de
> **modelo diferente** do que codou (evita pontos cegos correlacionados). Você não revisa o que
> você mesmo escreveu.
>>>>>>> t109/task/T-109
