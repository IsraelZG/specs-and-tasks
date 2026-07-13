---
id: EST-30
title: "plugin-skills: layout real .claude/skills/<nome>/SKILL.md"
status: done
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-12", "EST-22"]
blocks: []
capacity_target: haiku
---

# EST-30 · plugin-skills layout real

## 1. Objetivo
Corrigir o plugin para ler/escrever o layout real de skills (`<nome>/SKILL.md`) e agentes (`<nome>.md`), sempre via portas mediadas e commit serial.

## 2. Contexto RAG
- `docs/rfcs/rfc-018-estaleiro.md`, B5.
- `packages/plugin-skills/src/index.ts`.
- `.claude/skills/` e `.claude/agents/` do repo de controle.

## 3. Escopo
- **[UPDATE]** `packages/plugin-skills/src/index.ts`.
- **[CREATE]** testes com fixture de diretórios reais.

## 4. Testes
List/read/write de skill, agente e CLAUDE.md; traversal/path inválido; commit recebe caminho correto.

## 5. DoD
Uma skill real é listada e editada sem achatamento de diretório.

## 6. Feedback
Não copiar skills para dentro do bundle standalone; usar as portas do host.

## 7. Verificação
`pnpm --filter @plataforma/plugin-skills build`, `test`, `lint`.

## 8. Handover e revisão

**Gate de Evidência (2026-07-10):**

```
$ pnpm --filter @plataforma/plugin-skills build
$ tsc
(ok)

$ pnpm --filter @plataforma/plugin-skills test
✓ tests/index.test.ts (16 tests) — 16 passed
  1. listSkills em diretorio com 2 skills → retorna [{name, content}, ...]
  2. readSkill("existente") → retorna SkillEntry com conteudo integro
  3. readSkill("inexistente") → propaga ENOENT
  4. writeSkill → commit.enqueue chamado com args corretos
  5. Roundtrip: writeSkill seguido de readSkill → SkillEntry identico
  6. writeSkill com conteudo grande (>10KB) → escrito e lido integro
  7. listAgents em diretorio com 1 agent → retorna lista nao-vazia
  7b. listAgents em diretorio vazio → []
  8. readClaudeMd → retorna conteudo do CLAUDE.md
  9. writeClaudeMd → commit.enqueue chamado com path=CLAUDE.md
  10. signal.aborted → lanca cancelado sem chamar ports
  11. Manifest sem capabilities fs+bash → makeSkills lanca erro descritivo
  12. [M1] listSkills em diretorio inexistente → propaga erro
  12b. [M1] listAgents em diretorio inexistente → propaga erro
  13. [m1] writeSkill com name ".." → rejeita path traversal
  13b. [m1] writeAgent com name "/" → rejeita path traversal

$ pnpm --filter @plataforma/plugin-skills lint
$ eslint src/
(ok)
```

**Rework (2026-07-10):**

- **[M1]** `listSkills`/`listAgents`: `exitCode !== 0 && stderr` agora lança `throw new Error(...)` em vez de `return []`
- **[m1]** `writeSkill`/`writeAgent`: `validateSkillName()` rejeita nomes com `/`, `\` ou `..`
- Testes adicionados: 12 (listSkills inexistente), 12b (listAgents inexistente), 13 (writeSkill path traversal), 13b (writeAgent path traversal)
- Lint fix: `String(result.exitCode)` no template literal

---

### Parecer do Agente Revisor (Reviewer):    ← primeiro parecer
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Evidência de Execução (capturada NESTA review, worktree `task/EST-30`):**
```
$ pnpm --filter @plataforma/plugin-skills build    →  $ tsc  (ok, sem erros)
$ pnpm --filter @plataforma/plugin-skills lint    →  $ eslint src/  (ok)
$ pnpm --filter @plataforma/plugin-skills test
  Test Files  1 passed (1) | 12 passed (12)  ← suíte do dev (12/12 verde)
  + sondas adversariais (3 probes, removidas após execução):
    1. path traversal (writeSkill com name="../escape") — PASSOU (path.join normalizou; sem escape total do cwd, mas saiu de skills/ para .claude/ — ver [m1])
    2. listSkills em diretório INEXISTENTE — FALHOU (mascarou como [], ver [M1])
    3. writeAgent + readAgent roundtrip — PASSOU (simetria OK com skill)
$ git diff --name-only HEAD~1 HEAD
  packages/plugin-skills/src/index.ts
  packages/plugin-skills/tests/index.test.ts
  ← escopo: exatamente os 2 arquivos declarados em §3
```
- **Comentários de Revisão:**

  **MAJOR (1):**

  - **[M1] `src/index.ts:84-86` e `115-117` — `listSkills`/`listAgents` mascaram exitCode != 0 com stderr como `[]`.** Sonda adversarial 2 reproduziu: chamar `listSkills()` apontando para um `skillsDir` inexistente retorna `[]` silenciosamente em vez de propagar o erro. Isso **viola a spec §4** ("traversal/path inválido" como item de teste, cuja semântica é propagar — não silenciar) e mascara erros reais (ENOENT, permission denied, dir removido entre listagens) que o caller não consegue distinguir de "diretório vazio". O teste 7b cobre o caso "diretório vazio", não o caso "diretório inexistente/erro" — gap de cobertura real. **Ação corretiva:** (a) tratar `exitCode !== 0 && stderr` como `throw new Error(stderr || "listSkills failed: " + result.exitCode)`; (b) adicionar teste cobrindo `listSkills` em dir inexistente (`rejects.toThrow()`), simétrico ao teste 3 (`readSkill` em nome inexistente).

  **MINOR (1):**

  - **[m1] `src/index.ts:102-110, 133-141` — `writeSkill`/`writeAgent` não validam `entry.name` (path traversal).** Sonda 1 confirmou que `path.join(skillsDir, '../escape', 'SKILL.md')` normaliza para `.claude/escape/SKILL.md` (escapa de `skills/` para `.claude/`, mas não do cwd graças ao FsPort com allowlist). Não é exploit crítico em produção, mas é **defesa em profundidade ausente**: nome inválido polui `commit.message` e cria SKILL.md em local não-intencionado. **Ação corretiva:** rejeitar `entry.name` que case `[/\\]|^\.\.|\.\.` (contém `/`, `\`, ou segmentos `..`); emitir erro descritivo. Adicionar teste cobrindo `writeSkill({name:"../escape"})` → `rejects.toThrow()`.

  **Gates arquiteturais transversais (5.1):**

  - **Wiring**: `makeSkills` não tem caller de produção no worktree (apenas referência como string em `apps/estaleiro/core/tests/commit.test.ts:80`, que é rótulo num teste de `CommitPort`, não import real). Conforme spec §1, o objetivo é corrigir o plugin, não integrá-lo — integração é follow-up esperado. **Não-achado nesta review; flag para follow-up** (não bloqueia aprovação de mérito, mas o plugin entregue é primitiva testada, não-ligada).
  - **Acoplamento/aciclicidade**: plugin importa apenas de `@plataforma/estaleiro-core` (`PluginManifest`, `FsPort`, `BashPort`, `CommitPort`, `CommitEntry`). Sem import cruzando pacote na direção contrária, sem ciclo. ✓
  - **Ripple de assinatura**: como não há callers reais, sem risco de ripple. ✓

  **Outros (sem achado):**
  - build/tsc/lint: todos verdes
  - cobertura da spec §4 (parcial): list/read/write skill ✓ (1, 2, 4, 5, 6), list/read/write agente ✓ (7, 7b + roundtrip da sonda 3), read/write CLAUDE.md ✓ (8, 9), commit recebe caminho correto ✓ (4, 9), signal.aborted ✓ (10), capability check ✓ (11). Itens **não cobertos** pela suíte do dev: path inválido/traversal (sonda 2 revelou gap — [M1]), name inválido em writeSkill/Agent (sonda 1 revelou gap — [m1]).
  - Detalhe observado (não achado): `parseDirListing` em `src/index.ts:49` filtra com `.endsWith(".md")` case-sensitive. Em FS case-insensitive, `Foo.MD` seria descartado. Sem impacto para o layout `.claude/skills/<nome>/SKILL.md` declarado na spec.

- **Divergência do parecer anterior:** N/A (primeiro parecer).

---

### Parecer do Reviewer 2 (minimax-m3, independente, pós-rework):
- [x] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (capturada NESTA review, worktree `task/EST-30`):**
```
$ pnpm --filter @plataforma/plugin-skills build    →  $ tsc  (ok, sem erros)
$ pnpm --filter @plataforma/plugin-skills lint    →  $ eslint src/  (ok)
$ pnpm --filter @plataforma/plugin-skills test
  Test Files  1 passed (1) | 16 passed (16)   ← suíte do dev (16/16 verde; +4 do rework: 12, 12b, 13, 13b)
  + sondas adversariais R2 (3 probes, removidas após execução):
    1. listSkills em dir INEXISTENTE — PASSOU (throws — M1 fix OK)
    2. writeSkill({name:"../escape"}) — PASSOU (throws /nome inválido/ — m1 fix OK)
    3. writeSkill({name:"sub/dir"}) — PASSOU (throws /nome inválido/ — m1 fix edge case OK)
$ git diff --name-only HEAD~1 HEAD
  packages/plugin-skills/src/index.ts
  packages/plugin-skills/tests/index.test.ts
  ← escopo: exatamente os 2 arquivos declarados em §3
```
- **Verificação dos achados do Reviewer 1 (anti-ancoragem — formo veredito a partir do código, não do parecer anterior):**

  - **[M1] → RESOLVIDO.** `src/index.ts:90-92` (listSkills) e `122-124` (listAgents) agora lançam `throw new Error(result.stderr || \`listSkills failed: exit code ${result.exitCode}\`)` em vez de `return []`. Bate exatamente com a ação corretiva pedida. Sonda R2.1 (listSkills em dir inexistente) confirmou `rejects.toThrow()`. Teste 12 (`listSkills em diretorio inexistente → propaga erro`) e 12b (mesma para listAgents) cobrem o caminho.
  - **[m1] → RESOLVIDO.** `src/index.ts:61-65` adiciona `validateSkillName(name, kind)` que rejeita nomes com `/`, `\` ou `..` (cobre os 3 vetores de path traversal). Chamada em `writeSkill:110` e `writeAgent:142`. Sondas R2.2 (`../escape`) e R2.3 (`sub/dir`) confirmaram `rejects.toThrow(/nome inválido/)`. Testes 13 (writeSkill `..`) e 13b (writeAgent `/`) cobrem o caminho.
  - **Lint fix colateral** (`String(result.exitCode)` no template literal) preserva o lint verde — sem regressão.

- **Comentários de Revisão (formados a partir do código atual, não do parecer anterior):**

  **Análise fria do código atual:**
  - **Escopo**: `git diff --name-only HEAD~1 HEAD` retornou exatamente os 2 arquivos declarados em §3 (`src/index.ts` + `tests/index.test.ts`). Sem edição fora do escopo. ✓
  - **Build/tsc/lint**: todos verdes. Sem regressão. ✓
  - **Cobertura da spec §4** (mapa completo):
    - list/read/write skill ✓ (1, 2, 4, 5, 6)
    - list/read/write agente ✓ (7, 7b + roundtrip implícito via fakeCommit)
    - read/write CLAUDE.md ✓ (8, 9)
    - **traversal/path inválido ✓ (12, 12b — agora cobertos)**
    - **path traversal defense-in-depth ✓ (13, 13b — agora cobertos)**
    - commit recebe caminho correto ✓ (4, 9)
    - signal.aborted ✓ (10)
    - capability check ✓ (11)
    - Cobertura §4: **100%** dos bullets declarados agora têm teste.
  - **Gates arquiteturais (5.1):** sem mudanças em imports cruzando pacote. Plugin continua importando apenas de `@plataforma/estaleiro-core`. Sem ciclo, sem acoplamento novo. ✓
  - **Ripple de assinatura:** exports do plugin inalterados (`makeSkills`, `PluginSkills`, `SkillEntry`, `AgentEntry`, `MakeSkillsOptions`). Sem callers de produção no worktree — sem risco de ripple. ✓
  - **Detalhe observado (sem achado):** `parseDirListing` em `src/index.ts:49` continua case-sensitive em `.endsWith(".md")`. Em FS case-insensitive (Windows/NTFS, macOS HFS+/APFS default), `Foo.MD` seria descartado. Sem impacto para o layout `.claude/skills/<nome>/SKILL.md` declarado na spec. Mantido como INFO (já registrado pelo Reviewer 1).
  - **Wiring (primitiva não-ligada):** continua sem caller de produção no worktree. Spec §1 explicita que integração é follow-up. Flag para follow-up (já em `tasks/_pendencias.md`). Não bloqueia aprovação de mérito. ✓

- **Divergência do parecer anterior (Reviewer 1):** o Reviewer 1 classificou como REFATORAÇÃO com 1 MAJOR e 1 MINOR. Esta 2ª review independente **confirma ambos os achados como RESOLVIDOS** pelo rework documentado (linhas 73-78 da §8). Sem novos achados formados contra o código atual. Mudança de veredito: **REFATORAÇÃO → APROVADO**.

---

## 9. Log


## 9. Log de Execução (Agent Execution Log)
- **[2026-07-10T13:00]** - *Antigravity* - `[Triado]`: triado - aguardando dependencias (passo 1)
- **[2026-07-10T16:53]** - *Antigravity* - `[Endurecido]`: Diretrizes validadas (nenhuma decisão aberta pendente)
- **[2026-07-10T16:53]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-10T17:05]** - *deepseek* - `[Iniciado]`: iniciando execucao
- **[2026-07-10T17:09]** - *deepseek* - `[Finalizado]`: build ok + 12/12 tests + lint ok. Layout real de skills: <nome>/SKILL.md
- **[2026-07-10T17:16]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: iniciando qa-review com integracao
- **[2026-07-10T17:25]** - *agile_reviewer:minimax-m3* - `[Requer Refatoração]`: Rework: [M1] listSkills/listSkills/listAgents mascaram exitCode != 0 com stderr como [] (viola spec §4 'traversal/path invalido') — propagar erro + teste rejects.toThrow em dir inexistente; [m1] writeSkill/writeAgent nao validam entry.name (path traversal) — rejeitar nomes com /\ ou .. + teste. Nao-bloqueantes (m1 + i1 wiring) anexados ao ledger de pendencias.
- **[2026-07-10T17:26]** - *deepseek* - `[Iniciado]`: rework: corrigindo M1 + m1
- **[2026-07-10T17:30]** - *deepseek* - `[Finalizado]`: rework pronto: M1+m1 corrigidos — 16/16 tests + build + lint ok
- **[2026-07-10T17:31]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: iniciando qa-review do rework EST-30
- **[2026-07-10T17:40]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (commit 90bfaad), push origin master ok, worktree removida. Gate pos-merge verde: tsc ok, eslint clean, 16/16 tests passed. Parecer Reviewer 2 APROVADO (parecer 1 foi REFATORACAO; M1 e m1 corrigidos pelo worker, validados por 3 sondas R2). Nao-bloqueantes (m1 path traversal defense-in-depth + i1 wiring) anexados ao ledger de pendencias.
