---
id: EST-79
title: "Skills e CLAUDE.md no registry de tools do chat (paridade Crush)"
status: ready
complexity: 2
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: parallel # independente da EST-78 e da EST-80
test_profile: backend # backend | ui | full
dependencies: []
blocks: ["EST-81"]
capacity_target: haiku # spec fechada, 2 tools + injeção de system prompt
---

# EST-79 · Skills e CLAUDE.md no registry de tools do chat (paridade Crush)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm`
- **Test Runner:** `vitest`
- **Capacidade-alvo:** `haiku` — duas tools novas espelhando um padrão que já existe 4x no mesmo arquivo.

## 1. Objetivo

Auditoria da paridade chat-Estaleiro × Crush CLI (2026-07-27):

| Capacidade | Estaleiro |
|---|---|
| fs tools + HITL | ✅ `plugin-fs-tools`, wired em `chat-agent-service.ts` |
| terminal PTY | ✅ `plugin-terminal`, wired |
| LSP | ✅ `plugin-lsp`, wired |
| MCP | ✅ `plugin-mcp`, wired |
| **Skills / CLAUDE.md** | ❌ **`@plataforma/plugin-skills` é órfão** |

`grep -rn "plugin-skills"` no superapp retorna **zero consumidores de produção** — só uma menção em
`apps/estaleiro/core/tests/commit.test.ts` e a entrada em `package.json`. O pacote implementa
`listSkills`/`readSkill`/`listAgents`/`readAgent`/`readClaudeMd` e nada os chama.

Esta task fecha o último buraco de paridade: as skills viram **tools do agente** e o `CLAUDE.md` +
o catálogo de skills entram no **system prompt**, exatamente como o Crush faz.

## 2. Contexto RAG (Spec-Driven Development)
- [x] `packages/plugin-skills/src/index.ts` — `MakeSkillsOptions`, `PluginSkills`, `SkillEntry`.
- [x] `apps/estaleiro/core/src/chat-agent-service.ts` — o padrão de composição do registry
      (`makeFsTools` / `makeTerminalTools` / `makeLspTools` espalhados em `registry = {...}`).
- [x] `packages/plugin-agent-harness/src/runner.ts` — onde o system prompt é montado (verificar
      se já existe parâmetro `system`; se não existir, adicionar).
- [x] `.claude/skills/**` (repo Docs) — o corpus real: 30+ skills com frontmatter
      `name`/`description`. `.claude/agents/**` idem.
- [x] `CLAUDE.md` (raiz do Docs) — o que o Crush injeta como contexto de projeto.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-skills/src/index.ts`
- **[READ]** `packages/plugin-fs-tools/src/index.ts` (formato exato de uma tool AI SDK no projeto)
- **[UPDATE]** `packages/plugin-skills/src/index.ts` — adicionar `makeSkillTools(opts): SkillTools`
- **[CREATE]** `packages/plugin-skills/tests/skill-tools.test.ts`
- **[UPDATE]** `apps/estaleiro/core/src/chat-agent-service.ts` — compor as skill-tools no registry
  e montar o system prompt
- **[UPDATE]** `apps/estaleiro/core/tests/chat-agent-service.test.ts` — casos novos
- **[UPDATE]** `apps/estaleiro/core/package.json` — dependência `@plataforma/plugin-skills`
- **[UPDATE]** `packages/plugin-agent-harness/src/runner.ts` + `types.ts` — **só se** `system` ainda
  não for parâmetro do `run()`

**Fora de escopo:** sub-agentes (`Agent`/`Task` tool). Skills de escrita (`writeSkill`/`writeAgent`)
ficam fora do registry — o agente lê skills, não as reescreve no meio de um turno.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest, Node puro. `FsPort`/`BashPort` fakes (o padrão já usado nos testes do pacote).
- [x] **Casos obrigatórios:**
  1. `list_skills` retorna `[{name, description}]` — **description vem do frontmatter YAML**, não do corpo.
  2. `read_skill("qa-review")` devolve o markdown completo.
  3. `read_skill` de nome inexistente → erro com a **lista de nomes válidos** na mensagem (o LLM se
     autocorrige em vez de tentar 5 variações).
  4. Path traversal: `read_skill("../../../etc/passwd")` → rejeitado antes de tocar o FsPort.
  5. O system prompt montado contém o conteúdo do `CLAUDE.md` **e** uma linha por skill (`name — description`).
  6. `CLAUDE.md` ausente → system prompt sem ele, **sem lançar** (workspace arbitrário é caso normal).
  7. As tools de skill **não** entram no registry quando `workspaceRoot` é null (mesmo default seguro
     das fs-tools).
- [x] **Fora de Escopo:** browser; `writeSkill`/`writeAgent`.

## 5. Instruções de Execução (Step-by-Step)

> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** injete o conteúdo de todas as skills no system prompt. São 30+ arquivos longos — estoura
>   o contexto e é exatamente o que o mecanismo de skill existe para evitar. **Só nome + description**;
>   o corpo vem sob demanda via `read_skill`.
> - **NÃO** crie um formato novo de skill. O frontmatter `name`/`description` de `.claude/skills/*/SKILL.md`
>   já é o contrato; leia-o.
> - **NÃO** reimplemente listagem de diretório — `plugin-skills` já tem `parseSkillDirListing`.

### Pegadinhas conhecidas
- `plugin-skills` lista diretórios **via `bash`** (`BashPort` + `parseDirListing`), não via `FsPort.listDir`.
  No Windows o `ls` do Git Bash existe, mas confirme que o `BashPort` do core resolve o shell certo
  antes de assumir. Se falhar, troque para `FsPort.listDir` — é a rota mais simples e o `FsPort` já
  está injetado.
- Skills moram em **dois** lugares: `.claude/skills/<nome>/SKILL.md` (diretório) e
  `.claude/skills/<nome>.md` (arquivo solto). O `parseSkillDirListing` trata o primeiro,
  `parseDirListing` o segundo. Cubra os dois ou a metade do catálogo some.
- O system prompt vale para o modo agente **e** o headless (`createAgentRuntime`). Monte-o num
  helper exportado, não inline no `runTurn`, para os dois caminhos compartilharem.
- Se `runner.run()` ainda não aceita `system`, adicionar o parâmetro é mudança de assinatura pública
  do harness: atualize **todos** os callers (`chat-agent-service.ts`, `bootstrap.ts`, testes) — a
  pegadinha clássica de assinatura do CLAUDE.md.

### Passos
1. **[TDD]** `packages/plugin-skills/tests/skill-tools.test.ts` com os 7 casos.
2. Em `plugin-skills/src/index.ts`, adicione:
   ```ts
   export interface SkillTools { list_skills: unknown; read_skill: unknown }
   export function makeSkillTools(opts: MakeSkillsOptions): SkillTools;
   /** Monta o system prompt: CLAUDE.md + catálogo `name — description`. */
   export function buildSystemPrompt(opts: {
     claudeMd: string | null;
     skills: { name: string; description: string }[];
   }): string;
   ```
3. Parseie a `description` do frontmatter em `listSkills()` (hoje `SkillEntry` só tem `name`/`content`
   — adicione `description?: string`).
4. Em `chat-agent-service.ts`, dentro do bloco `if (opts.workspaceRoot)`, componha
   `...skillTools` no `registry` e passe `system` ao `deps.runner(...)`.
5. Declare a dependência em `apps/estaleiro/core/package.json`.
6. `pnpm gate plugin-skills --profile backend` e `pnpm gate estaleiro-core --profile backend`.

## 6. Feedback de Especificação (Spec Feedback Loop)
- **Fora de escopo declarado:** sub-agentes. O Crush tem; o Estaleiro não. Se depois de rodar as
  duas sessões paralelas (EST-81) faltar, vira task própria — não se antecipe aqui.
- Se `runner.run()` **já** aceitar `system`, o passo 4 é uma linha e a complexidade cai. Registre no §8.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Numa conversa com `workspaceRoot` apontando para o repo Docs, o agente responde
      *"quais skills você tem?"* usando `list_skills` (evidência: log de tool-call colado no §8).
- [ ] `read_skill("qa-review")` devolve o conteúdo real da skill.
- [ ] O system prompt inclui `CLAUDE.md` e o catálogo, e **não** inclui o corpo das skills.
- [ ] `grep -rn "plugin-skills" --include=*.ts apps packages | grep -v node_modules` mostra
      consumidor de **produção** (não só teste) — gate de wiring do §7 do template.
- [ ] Gates verdes; linter limpo.

### Verificação automática
```bash
pnpm gate plugin-skills --profile backend
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test + lint):**
```
(cole aqui a saída real de pnpm build, pnpm test e pnpm lint)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-27T15:55]** - *claude-opus* - `[Triado]`: spec escrita a partir da auditoria do Estaleiro 2026-07-27
- **[2026-07-27T15:56]** - *claude-opus* - `[Endurecido]`: spec executavel: assinaturas, casos de teste, pegadinhas e DoD por comando
- **[2026-07-27T15:56]** - *claude-opus* - `[Promovida p/ ready]`: deps vazias, spec fechada
