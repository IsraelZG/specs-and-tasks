# PITFALLS — Problemas conhecidos e soluções

> Leia este arquivo no início de cada sessão de trabalho no Nexus.
> Qualquer agente que descobrir um novo problema deve adicionar uma entrada aqui.
> Formato: data, sintoma, causa raiz, solução aplicada, como prevenir recorrência.

---

## P-001 · pnpm EACCES/EPERM no node_modules/.pnpm (binários de plataforma errada)

**Data:** 2026-06-16
**Sintoma:** `pnpm install` falha com `EACCES` ou `EPERM` ao tentar ler `package.json` dentro de `node_modules/.pnpm` — tipicamente em pacotes com nome contendo `linux`, `darwin`, `arm64`, `x64` ou `musl`.
**Causa raiz:** O `.pnpm` virtual store acumulou binários de plataformas diferentes da máquina atual (comum ao compartilhar `node_modules` entre máquinas ou ao rodar agentes que alteram o lockfile). Durante o bin-linking o pnpm tenta ler esses binários errados e falha com erro de permissão.

**Protocolo de diagnóstico (rodar na máquina com problema):**

Passo 1 — identificar OS e arquitetura reais do Node:
```bash
node -e "console.log(process.platform, process.arch)"
# ex: win32 arm64 | linux x64 | darwin arm64
```

Passo 2 — verificar se o `.npmrc` está alinhado com o resultado acima:
```
# .npmrc esperado para win32 arm64:
supportedArchitectures[os][]=win32
supportedArchitectures[cpu][]=arm64

# para linux x64:
supportedArchitectures[os][]=linux
supportedArchitectures[cpu][]=x64
```
Se estiver errado ou ausente, corrigir o `.npmrc` primeiro.

Passo 3 — verificar binários contaminados no store:
```powershell
# PowerShell (Windows)
Get-ChildItem node_modules/.pnpm -Recurse -Directory |
  Where-Object { $_.Name -match "linux|darwin|musl|arm64|x64" } |
  Select-Object FullName
```
```bash
# Bash (Linux/Mac)
find node_modules/.pnpm -type d | grep -E "linux|darwin|musl|arm64|x64"
```
Filtrar o que é da plataforma correta (manter) e o que é de outras plataformas (deletar).

Passo 4 — após corrigir `.npmrc` e limpar dirs errados, rodar `pnpm install`.

**Nota:** O `.npmrc` deste repo já tem `supportedArchitectures` configurado para a última máquina usada. Se trocar de máquina, revisar essas linhas antes de rodar `pnpm install`.

---

## P-002 · Comandos longos via Claude Code tool travam o VS Code

**Data:** 2026-06-16
**Sintoma:** Quando o Claude roda `pnpm install` ou `Remove-Item -Recurse` em diretórios grandes internamente (via Bash/PowerShell tool), o terminal integrado do VS Code trava e pode congelar a máquina.
**Causa raiz:** O subprocesso sandboxed da extension bloqueia o terminal integrado em operações longas/bloqueantes.
**Solução:** Para operações potencialmente longas, o Claude deve guiar o usuário a rodar o comando manualmente no próprio PowerShell e aguardar o resultado colado. O Claude só usa a tool internamente para operações rápidas (leituras, greps, edições, git status).
**Operações que exigem execução manual pelo usuário:**
- `pnpm install` (especialmente com reconciliação de lockfile)
- `Remove-Item -Recurse -Force` em `node_modules/`
- `tsc` na primeira compilação fria de projetos grandes

---

## P-003 · Store do pnpm incompleto sem EACCES (módulos "Cannot find" no tsc)

**Data:** 2026-06-16
**Sintoma:** `tsc` falha com `TS2307 Cannot find module` (ex.: `vitest`, `@modelcontextprotocol/sdk/*`) e `TS2339` em cascata (ex.: `Response`/`Request` do Express sem `.status`/`.json`/`.body` — sintoma de `@types/express` ausente). `pnpm install` e até `pnpm install --force` retornam "Already up to date" em <1s sem corrigir nada.
**Causa raiz:** `node_modules/.pnpm` ficou incompleto (faltavam pacotes inteiros, não só binários de plataforma errada) e `node_modules/.modules.yaml` (bookkeeping do pnpm) estava ausente — o pnpm não detecta a divergência e pula a reconciliação.
**Diagnóstico:** checar se os pacotes acusados existem em `node_modules/.pnpm/<pkg>@*` (Glob). Se não existirem mesmo após `pnpm install --force`, é este caso.
**Solução aplicada:** apagar `node_modules` de todos os workspaces (raiz + `apps/*` + `packages/*`) e rodar `pnpm install` limpo (sem `--force`).
**Como prevenir:** se `pnpm install` normal e `--force` ambos reportam "Already up to date" mas o build segue falhando com módulos ausentes, ir direto para o wipe completo — não insistir em variações de `install`.

---

## P-004 · Build trava com EACCES durante review (Turbo daemon / file lock no Windows) — NÃO é licença para bypass

**Data:** 2026-06-16
**Sintoma:** Durante `/qa-review` ou `manage-task.mjs approve`, o `pnpm build`/`lint` falha com
`EACCES: permission denied, lstat 'node_modules/turbo/...'` (ou trava sem terminar). O agente
revisor, sem conseguir obter evidência real, decide aprovar "pelo mérito" e edita `status:`/
`INDEX.md`/Seção 9 manualmente, alegando que o código está correto e o problema é "só ambiente".
Já aconteceu em **M-013** e **T-1014**.
**Causa raiz:** No Windows, um processo em segundo plano (daemon do Turborepo, TS server do
editor, indexador do explorador de arquivos) mantém um handle aberto em `node_modules/turbo` (ou
similar) enquanto o `pnpm build` tenta deletar/reescrever esses arquivos — o OS bloqueia a
operação com `EACCES`/file lock, não é um problema de permissão de usuário.
**Por que o bypass é sempre errado:** mesmo quando o código auditado está de fato correto, editar
o Markdown/INDEX na mão quebra a garantia de que `status: done` significa "passou pelo
`TaskService`". Isso é o que permite (e já permitiu) inconsistências entre o frontmatter da task
e o `INDEX.md`, e mascara o próximo agente sobre o que de fato foi verificado.
**Solução correta:** tratar a falha de build como **BLOCKER de ambiente** — não como veredito de
mérito. O revisor registra isso no Parecer (Seção 8) e PARA; pede ao usuário para:
1. Fechar processos que possam estar com handle em `node_modules` (editor, daemon do Turbo:
   `npx turbo daemon stop` ou matar o processo `node` correspondente).
2. Rodar `pnpm --filter <pkg> build`/`test` manualmente (fora da tool do agente — ver P-002) e
   colar a saída real.
3. Só então o `approve`/`request_changes` é chamado, com evidência real.
**Como prevenir recorrência:** ver `CLAUDE.md` (Regra 6, MGTIA) e `.claude/agents/agile-reviewer.md`
("Bypass de ambiente é proibido"). A correção estrutural para o caso de worker se autoaprovar
(diferente deste caso, mas relacionado) está em `tasks/T-1025.md` — gate de papel no
`TaskService.transition()`.

---

## P-005 · `Cannot find module 'section-matter'` (ou outro pacote transitivo) com symlink presente — Developer Mode desligado no Windows

**Data:** 2026-06-16
**Sintoma:** `node tools/scripts/manage-task.mjs <ação> ...` falha com `Backend não compilado`
mesmo com `apps/nexus-backend/dist/services/task.service.js` existindo. Importar o módulo
diretamente (`node -e "import('...task.service.js')"`) revela o erro real (a mensagem genérica
do `manage-task.mjs` mascara qualquer erro de import, não só "dist ausente"):
`Error: Cannot find module 'section-matter'` (dependência transitiva do `gray-matter`).
**Diagnóstico:** `ls -la node_modules/.pnpm/gray-matter@.../node_modules/` mostra o symlink
(`lrwxrwxrwx`) e o pacote alvo existe em `node_modules/.pnpm/section-matter@.../`. Mas
`Get-Item <link> -Force | Format-List Attributes,LinkType` no PowerShell mostra
`Attributes: Archive, ReparsePoint` com **`LinkType` em branco** (não reconhecido como
`SymbolicLink` nem `Junction`) — é um reparse point que o Git Bash/MSYS finge entender (mostra
como link Unix) mas que o Node.js nativo do Windows não consegue atravessar.
**Causa raiz:** o **Windows Developer Mode estava desligado** quando o `pnpm install` criou o
`.pnpm` store. Sem Developer Mode (ou sem rodar elevado), o processo não tem
`SeCreateSymbolicLinkPrivilege`, então os symlinks que o pnpm tenta criar saem quebrados/
inúteis para ferramentas nativas do Windows — mesmo que pareçam normais no Git Bash.
**Confirmação:** `Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock
-Name AllowDevelopmentWithoutDevLicense` falha (chave de registro nem existe) → Developer Mode
nunca foi ativado nesta máquina.
**Solução:**
1. Ativar o Developer Mode: Configurações → Privacidade e segurança → Para desenvolvedores →
   "Modo de desenvolvedor" → Ligado. (Ou via PowerShell elevado:
   `Get-WindowsOptionalFeature -Online -FeatureName "Microsoft-Windows-Subsystem-Linux"` não é
   o caminho — usar a tela de Configurações mesmo, ou
   `reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /t REG_DWORD /f /v AllowDevelopmentWithoutDevLicense /d 1`
   num PowerShell **elevado**.)
2. Apagar `node_modules` de todos os workspaces (raiz + `apps/*` + `packages/*`) — os symlinks
   quebrados já existentes não se autocorrigem com Developer Mode ligado depois; precisa recriar.
3. `pnpm install` limpo.
4. `pnpm --filter nexus-backend build` e confirmar que `node -e "import('...task.service.js')"`
   não lança mais.
**Como prevenir recorrência:** essas etapas (1–4) são todas operações longas/que exigem
privilégio elevado — **rodar manualmente pelo usuário**, nunca via tool do agente (ver P-002).
Se o erro mudar de pacote (não for mais `section-matter`, for outro), o diagnóstico é o mesmo:
qualquer "Cannot find module X" com X existindo fisicamente no `.pnpm` store é candidato a este
problema, não a um `pnpm install` incompleto (P-003) — checar `LinkType` antes de assumir P-003.

---

## P-006 · `ERR_PNPM_IGNORED_BUILDS` no pnpm 11 — `allowBuilds`, não `onlyBuiltDependencies`

**Data:** 2026-06-20 (descoberto no Gate da T-001; custou várias rodadas)
**Sintoma:** `pnpm install` (e por tabela `pnpm -r build/test/lint`, que fazem `runDepsStatusCheck`)
sai com **exit 1** e `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@x.y.z` +
`Run "pnpm approve-builds" …`. O Gate trava no install mesmo com o scaffolding correto.
**Causa raiz:** o pnpm 10+ bloqueia postinstall de dependências por segurança. No **pnpm 11** o campo
de aprovação é **`allowBuilds` (mapa `pacote: true|false`) no `pnpm-workspace.yaml`** — NÃO
`onlyBuiltDependencies` (campo do pnpm 10, **silenciosamente ignorado** no 11) nem o `pnpm` field do
`package.json`. O pnpm 11 inclusive **autoescreve** um stub `allowBuilds:\n  esbuild: set this to true
or false` pedindo pra preencher — NÃO apague esse stub (é o pnpm te dizendo o campo certo).
**Solução:**
```yaml
# pnpm-workspace.yaml
allowBuilds:
  esbuild: true
```
**Pegadinha dentro da pegadinha (lockfile velho mascara a correção):** se o `pnpm-lock.yaml` já existe,
o pnpm imprime `Lockfile is up to date, resolution step is skipped` e **NÃO reaplica** a config de build
— então mudar o `allowBuilds` não tem efeito. Precisa **apagar `node_modules` (e o `pnpm-lock.yaml`)**
e reinstalar para a aprovação valer. (Esses deletes/instalações são longos → rodar manual, ver P-002.)
**Fallback garantido:** `pnpm approve-builds` (interativo: seleciona o pacote com espaço, Enter), que
escreve a config correta seja qual for o nome do campo na versão instalada.

---

## P-007 · Worktree criada no WSL quebra no Windows (e vice-versa) — padronizar UM ambiente

**Data:** 2026-06-20
**Sintoma:** `git -C <worktree> status` falha com `fatal: not a git repository: /mnt/c/...`; o
`git worktree list` mostra a worktree como `prunable` com caminho `/mnt/c/Dev2026/...`; e/ou
`pnpm -r build` falha por binário nativo de plataforma errada (esbuild/rollup linux num checkout Windows).
**Causa raiz:** a worktree foi criada por um agente rodando no **WSL** (ex.: opencode). O ponteiro
`.git` da worktree e o `gitdir` do lado do repo apontam para caminhos **`/mnt/c/...`** (válidos no WSL,
inválidos no git nativo do Windows), e o `node_modules` instalado no WSL tem binários **linux** que não
rodam no Windows. Misturar os dois ambientes no mesmo repo de código é a raiz.
**Solução (padronizamos Windows-native em 2026-06-20):**
1. Conserto pontual dos ponteiros: reescrever `<worktree>/.git` para `gitdir: C:/.../superapp/.git/worktrees/<ID>`
   e `superapp/.git/worktrees/<ID>/gitdir` para `C:/.../.superapp-worktrees/<ID>/.git`.
2. Limpo: apagar a worktree (`Remove-Item` de fora dela — não de dentro, senão o diretório fica em uso),
   `git worktree prune`, `git branch -D task/<ID>`, e recriar do Windows
   (`git -C superapp worktree add <path> -b task/<ID> master`).
3. O `node_modules` do WSL é inútil no Windows: apagar e reinstalar (`pnpm install` Windows).
**Decisão de fluxo:** rodar `pnpm wt` + agente + Gate **sempre no mesmo ambiente** (escolhido: Windows).
WSL/opencode foi abandonado para execução de tasks.

---

## P-008 · Multi-máquina: repo local pode estar desatualizado — pull não é mais opcional

**Data:** 2026-06-22
**Contexto:** Antes, todo o trabalho rodava numa única máquina (ARM64), então o checkout local
era sempre a versão mais recente por definição. A partir de 2026-06-22 passamos a trabalhar
também numa segunda máquina (x64, opencode nativo Windows) contra o **mesmo remote** dos repos
`Docs` e `superapp`.
**Risco:** criar uma worktree (`pnpm wt new`) ou fazer merge (`pnpm wt merge`) a partir de um
`master`/`Docs` desatualizado — a outra máquina pode ter pushado tasks, mergeado código, ou
avançado o ledger (`tasks/*.md`, `INDEX.md`) enquanto você trabalhava localmente.
**Solução aplicada:**
1. `tools/scripts/worktree.mjs` agora faz `git fetch` + `pull --ff-only` automático no `Docs` e
   no `superapp` antes de `new`/`merge`, e **aborta** (não segue silenciosamente) se houver
   mudanças não commitadas ou divergência (não-fast-forward) — nesse caso resolva manualmente.
2. Mesmo assim, **dê `git pull` manual em ambos os repos no início de cada sessão** e sempre que
   alternar de máquina — o pull automático do script só cobre o instante de `new`/`merge`, não o
   tempo todo em que você está com a worktree aberta.
3. **Toda task só está de fato encerrada depois dos dois pushes:** código (`git push -u origin
   task/<ID>`, e depois do merge `git push origin master` no `superapp`) e controle (`git push`
   no `Docs` com o `tasks/<ID>.md` atualizado). Um `finish` sem push deixa a outra máquina "no
   escuro".
**Como prevenir recorrência:** ver `docs/fluxo-worktrees.md` (seção "Multi-máquina") e
`CLAUDE.md` (Regra 2b) de ambos os repos.

---

<!-- Adicione novas entradas acima desta linha, no formato P-NNN -->

## P-012 · Gate `pnpm --filter <pkg> build/test` numa worktree nova falha por `dist/` das deps ausente (e `-- --args` quebra o vitest)

**Data:** 2026-07-15 (Gate do FUGU-01 elo 3 / T-1039)
**Sintoma:** Numa worktree recém-criada, rodar o gate exato da spec
(`pnpm --filter @plataforma/core build`) falha com dezenas de
`TS2307: Cannot find module '@plataforma/crypto'` / `'@plataforma/protocol'`; e rodar o teste com
argumentos extras (`pnpm --filter @plataforma/core test -- --runInBand <arquivo>`) falha com
`Failed to resolve entry for package "@plataforma/protocol"` no `vite:import-analysis`.
**Causa raiz:** dois problemas distintos:
1. O script `build` de cada pacote é só `tsc` — **não** reconstrói as dependências internas. Numa
   worktree nova, o `dist/` de `crypto`/`protocol` ainda não existe, então o `tsc` de `core` não
   acha os tipos/entradas das deps. (O `pnpm turbo run build` da raiz resolve porque orquestra a
   ordem do grafo; o `pnpm --filter <pkg> build` isolado, não.)
2. `pnpm --filter <pkg> test -- <args>` repassa os `<args>` ao vitest de um jeito que confunde a
   resolução de workspace do Vite — o erro aparece como "entry for package" de uma dep, mascarando
   que o problema é o argumento, não o código.
**Solução:**
1. Antes do gate isolado, construa as deps na ordem do grafo:
   `pnpm --filter @plataforma/crypto build && pnpm --filter @plataforma/protocol build && pnpm --filter @plataforma/core build`
   (ordem `crypto → protocol → core → transport`). Depois os 3 comandos do gate rodam limpos.
2. Rode o teste **sem** `-- --args`: `pnpm --filter <pkg> test` (vitest run já roda tudo). Para um
   arquivo só, prefira `pnpm --filter <pkg> exec vitest run <arquivo>` em vez de repassar via `--`.
**Como prevenir recorrência:** ao pegar uma task numa worktree nova, rode `pnpm turbo run build`
(ou a cadeia de deps acima) **uma vez** antes do gate isolado da spec — o gate por-pacote pressupõe
`dist/` das deps presente. E nunca dependa de `-- --args` no `pnpm test`; é fonte de erro
disfarçado de "pacote não resolvido".
**Limites:** vale para o gate isolado por pacote. `pnpm turbo run build` na raiz não precisa disso
(já ordena o grafo). Se o erro de módulo persistir mesmo após construir as deps, aí sim suspeitar
de store incompleto (P-003) ou symlink quebrado (P-005).

## P-008 · Skill com frontmatter YAML inválido é silenciosamente ignorada pelo Crush

**Data:** 2026-06-26
**Sintoma:** Skill existe em `.claude/skills/<nome>/SKILL.md` mas não aparece no `crush_info`
(como `unloaded`/`loaded`), nem na lista `<available_skills>` injetada no system prompt do agente,
nem na commands palette (`/<skill>` não funciona). Agentes relatam "não consigo localizar a skill
X" mesmo com a pasta e o `SKILL.md` presentes. Descoberto quando 6 skills
(`endurecer-task`, `qa-review`, `absorver-rfc`, `consolidar-arquivo`, `rodar-onda`, `revisar-rfc`)
sumiram da lista apesar de existirem fisicamente — `crush_info` mostrava 14 skills, a pasta tinha 17.
**Causa raiz:** O campo `description` do frontmatter YAML usa plain scalar inválido. Dois padrões
quebram:
1. Multi-linha com indentação insuficiente para continuação (linha de continuação em col 2, valor
   começa em col ~14 — o parser acha que é uma nova chave top-level).
2. Sequência `: ` (colon-space) dentro de uma string plain — é o separador de mapeamento reservado
   do YAML, e plain scalars não podem conter isso.

Em ambos os casos, `yaml.safe_load` lança `ScannerError: mapping values are not allowed here`. O
loader do Crush trata o erro como "skill não existe" e pula o arquivo **sem warning visível** — nem
log, nem entrada em vermelho na UI explicando o motivo (a skill só "some").
**Diagnóstico (rodar na raiz do repo):**
```bash
python -c "
import yaml, re, sys
for p in __import__('pathlib').Path('.claude/skills').glob('*/SKILL.md'):
    raw = p.read_text(encoding='utf-8')
    parts = re.split(r'^---\s*\$', raw, maxsplit=2, flags=re.M)
    if len(parts) < 3: continue
    try: yaml.safe_load(parts[1]); print('OK ', p)
    except Exception as e: print('BAD', p, '->', type(e).__name__, str(e)[:80])
"
```
`BAD <path>` = este pitfall. `OK <path>` = frontmatter válido, problema é outro.
**Solução aplicada:** Envolver a `description` em **folded scalar** (`description: >`), padrão já
usado pelas skills que funcionam (`handoff`, `ponytail`):
```yaml
---
name: minha-skill
description: >
  Texto da descrição, pode ter ": " e múltiplas linhas sem problema.
  Quebras de linha viram espaço no valor final.
model: haiku  # campo extra opcional, preservado
---
```
Aplicado em 6 skills em commits separados na branch `fix/crush-skill-frontmatter` (1 commit por
skill, padrão MGTIA "uma unidade por commit").
**Como prevenir recorrência:**
1. **Template:** ao criar skill nova, copiar a estrutura de `handoff/SKILL.md` (folded scalar é o
   padrão, não plain).
2. **Diagnóstico automatizado:** rodar o snippet Python acima como pre-commit hook ou em CI
   (`tools/scripts/verify-skills.mjs` candidato). Por enquanto, checar manualmente após criar skill.
3. **Sinalização na UI:** se a UI do Crush mostrasse "1 skill ignorada (YAML inválido)" em vez de
   só omitir, o problema seria óbvio — mas isso é upstream (pedir no repo do Crush). Por ora, a
   contagem `crush_info` × `ls .claude/skills` é a melhor heurística.
4. **Skill healthcheck:** após criar/editar skills, comparar
   `crush_info` (campo `skills` — total e lista) com `ls .claude/skills/*/SKILL.md`. Diferença > 0
   = rodar o diagnóstico acima.

---

<!-- Adicione novas entradas acima desta linha, no formato P-NNN -->

## P-009 · Deploy standalone muta o working tree via hardlinks do pnpm store (writeFileSync sem unlink)

**Data:** 2026-07-12 (descoberto no gate de integração da EST-33, causa real do "13 package.json
sujos" já registrado como débito não-bloqueante na EST-25)
**Sintoma:** Rodar `pnpm --filter <pkg> test:e2e` (ou qualquer script que faça `pnpm deploy` e depois
edite `package.json`s no destino) deixa **`package.json` de pacotes não relacionados** (`crypto`,
`protocol`, `plugin-*`, etc. — nada do escopo da task) marcados como modificados no `git status` da
**árvore fonte**, mesmo quando o script só deveria tocar a pasta de deploy (`estaleiro-run/vX.Y.Z/`,
fora do repo).
**Causa raiz:** os arquivos dentro de `<deploy>/backend/node_modules/.pnpm/**` são **hardlinks**
para a mesma store global do pnpm (`~/.pnpm-store` ou equivalente) referenciada pelos
`node_modules/.pnpm` da árvore fonte. Um `writeFileSync(caminho, novoConteudo)` sem `unlink` prévio
**escreve no inode compartilhado** — a mutação vaza para todo mundo que aponta pro mesmo objeto da
store, inclusive o checkout que você pensava estar intocado.
**Diagnóstico:** depois de rodar o script suspeito, `git status --porcelain --untracked-files=all`
no repo fonte (não na pasta de deploy) — se aparecer `package.json` de pacotes **fora do escopo
declarado da task**, é este caso. Confirmar checando se o script faz `writeFileSync` num caminho
dentro de `node_modules/.pnpm` sem `rmSync`/`unlinkSync` antes.
**Solução aplicada:** em `scripts/estaleiro-standalone.mjs`, antes de cada `writeFileSync` que
patcheia um arquivo dentro do `deployPnpm` (`.pnpm` do destino deployado), adicionar
`rmSync(caminho, { force: true })` imediatamente antes. Isso quebra o hardlink (remove a entrada de
diretório), então o `writeFileSync` seguinte cria um arquivo **novo**, isolado — não mais escreve no
inode compartilhado.
```js
// ANTES (muta a store compartilhada):
writeFileSync(deployedPkgPath, JSON.stringify(deployed, null, 2) + "\n");
// DEPOIS (isola a escrita ao deploy):
rmSync(deployedPkgPath, { force: true });
writeFileSync(deployedPkgPath, JSON.stringify(deployed, null, 2) + "\n");
```
**Como prevenir recorrência:** qualquer script que faça `pnpm deploy`/patch de `exports`/manifests
dentro de um destino que reusa a store do pnpm (comum em deploys "leves" que não copiam
`node_modules` inteiro) precisa desse `rmSync`-antes-do-`writeFileSync` em **todo** ponto de escrita
dentro de `.pnpm`. Verificar com `git status --porcelain --untracked-files=all` na árvore fonte
**logo após** rodar o script — deve ficar vazio. Se não ficar, é este pitfall, não um bug do
código da task. (Melhoria futura considerada e **não aplicada** por já resolver o problema
registrado: clonar o deploy inteiro para `os.tmpdir()` antes de mutar qualquer manifest, eliminando
o compartilhamento de store por completo — maior escopo, avaliar só se o `rmSync` pontual voltar a
falhar em outro ponto do script.)

---

## P-010 · E2E não-hermético: `webServer` do Playwright com ponteiro de versão fixo mascarado por builds antigos

**Data:** 2026-07-12 (EST-33, 2ª rodada de gate de integração)
**Sintoma:** `pnpm --filter <pkg> test:e2e` passa 2/2 numa worktree, mas **falha** com
`Cannot find module '.../estaleiro-run/vX.Y.Z/backend/server.mjs'` quando o mesmo comando roda
depois do merge, num checkout limpo (master) — mesmo código, mesmo comando, resultado diferente.
**Causa raiz:** `apps/estaleiro/playwright.config.ts` tinha o **número de versão do standalone
hardcoded** em `webServer.command` (ex. `v0.0.37`), mas o hook `pretest:e2e` reconstrói o standalone
usando a versão **atual** de `package.json` (que sobe a cada build, ex. `v0.0.38`). Numa worktree
que já acumulou builds de rodadas anteriores (`estaleiro-run/v0.0.35`, `36`, `37`, `38`...), o
`webServer` acha por acaso uma pasta **velha** com o número hardcoded e testa **contra ela** — o
teste passa, mas contra um build que não é o que acabou de ser gerado. Num checkout limpo, essa
pasta velha não existe e o erro aparece.
**Diagnóstico:** se um E2E com `webServer.command` referenciando um artefato de build (standalone,
bundle, dist versionado) só falha **fora** da worktree onde foi desenvolvido, suspeitar de ponteiro
de versão fixo + pasta de builds antigos mascarando o defeito — não assumir que é problema do
ambiente novo.
**Solução aplicada:**
```ts
// ANTES (fixo, mascarável por builds velhos):
command: 'cross-env ESTALEIRO_DB=./e2e-test.db node ../../../estaleiro-run/v0.0.37/backend/server.mjs',
// DEPOIS (lê a versão real em runtime):
const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
// ...
command: `cross-env ESTALEIRO_DB=./e2e-test.db node ../../../estaleiro-run/v${pkg.version}/backend/server.mjs`,
```
**Como prevenir recorrência:** qualquer `webServer`/fixture de E2E que aponte para um artefato
buildado **num diretório versionado** deve ler a versão dinamicamente (do `package.json`, de uma
env var, ou de um symlink `latest`) — nunca um número fixo. Ao revisar esse tipo de task, rodar o
gate de integração **na master recém-mergeada**, não só na worktree — worktrees acumulam artefatos
de rodadas anteriores que mascaram exatamente esse tipo de regressão (ver também "Gate pós-merge" na
skill `integrar-task`).

---

## P-011 · Editar `.npmrc`/`.gitignore`/config via `echo`/redirect de shell corrompe encoding (UTF-16 byte-a-byte)

**Data:** 2026-07-12 (EST-33, achado no rework do B1: linha `confirmModulesPurge=false` duplicada
com um caractere por byte)
**Sintoma:** Um arquivo de config texto (visto em `.npmrc`, risco igual em `.gitignore` ou qualquer
arquivo pequeno editado via shell) ganha uma linha com aparência de
`c o n f i r m - m o d u l e s - p u r g e = f a l s e` — cada caractere ASCII separado por espaço.
O parser que consumir o arquivo (Node, pnpm, git) ou lê a linha errado ou simplesmente ignora a
"palavra" corrompida.
**Causa raiz:** um comando de shell (`echo "..." >> arquivo` no PowerShell, ou equivalente) escreveu
no arquivo usando um encoding diferente do resto do arquivo (tipicamente UTF-16LE do PowerShell
contra um arquivo UTF-8/ASCII existente). Cada byte ASCII do texto novo vem seguido do byte nulo
(`0x00`) do UTF-16LE; ferramentas que decodificam como UTF-8/Latin-1 mostram esse `0x00` como um
espaço, produzindo o padrão "um char por byte".
**Diagnóstico:** `git show <rev>:<arquivo> | xxd | head` — se a linha nova tiver `XX 00` alternado
onde `XX` é o byte ASCII esperado, é este caso.
**Solução aplicada:** reescrever a linha inteira usando a ferramenta de edição de arquivo (Edit/Write
do agente, ou um `writeFileSync(path, content, 'utf-8')` explícito em Node) — nunca `echo`/redirect
de shell para tocar um arquivo de código-fonte ou config já existente.
**Como prevenir recorrência:** proibir `echo`/redirect de shell (`>>`, `Out-File`, `Add-Content` sem
`-Encoding utf8` explícito) para editar qualquer arquivo versionado. Regra registrada em `AGENTS.md`.
**Limites:** isto é disciplina de ferramenta, não um guard automático — nenhum linter roda hoje para
pegar esse padrão antes do commit. Se reaparecer com frequência, considerar um pre-commit check que
grepa por bytes nulos intercalados em arquivos texto rastreados.

---

## P-013 · E2E `webServer` na mesma porta reaproveita processo zumbi de sessão anterior (`reuseExistingServer`)

**Data:** 2026-07-18 (desbloqueio de EST-56, integração de EST-53/54/55/56)
**Sintoma:** Depois de corrigir todo o código relevante e reconstruir o standalone do zero, o
`test:e2e` continua exibindo sintomas de código **antigo** (ex.: board do Playwright cheio de
tasks reais de produção, mesmo com o fix de `ESTALEIRO_TASKS_DIR` aplicado e confirmado no
arquivo deployado) — parece regressão, mas o código-fonte está correto.
**Causa raiz:** `playwright.config.ts` usa `webServer.reuseExistingServer: !process.env.CI`. Uma
`node backend/server.mjs` de uma sessão/gate **anterior**, iniciada manualmente para debug (ou
deixada viva por um comando cortado), continua ouvindo a porta fixa (`8899`) muito depois do
comando que a subiu ter "terminado" no terminal do agente. Como nenhuma env var `CI` está setada
numa investigação manual, o Playwright detecta a porta já respondendo e **reaproveita esse
processo velho** em vez de subir o `backend/server.mjs` recém-buildado — os testes rodam contra
um binário sem nenhum dos fixes da sessão atual.
**Diagnóstico:** antes de investigar "regressão" num E2E cujo código parece correto, confirme
**quem** está ouvindo a porta e **desde quando**:
```powershell
Get-NetTCPConnection -LocalPort 8899 -ErrorAction SilentlyContinue
Get-Process -Id <OwningProcess> | Select Id, Path, StartTime
```
Se o `StartTime` for anterior ao início da sessão atual (ou ao último rebuild), é este caso.
**Solução aplicada:** `Stop-Process -Id <pid> -Force` no processo zumbi antes de re-rodar
`test:e2e`/`pnpm gate` — o Playwright então sobe o `webServer` de verdade contra o build atual.
**Como prevenir recorrência:** ao investigar qualquer diagnóstico manual de E2E fora do
`pnpm gate` (rodar `node backend/server.mjs` direto, `curl` contra `localhost:8899`, etc.), mate o
processo na porta ao terminar cada investigação — não deixe servidores de debug vivos entre
sessões. Se o sintoma "parece regressão mas o código está certo" aparecer, checar processo zumbi
**antes** de suspeitar do código.
**Limites:** só se aplica a `webServer` com `reuseExistingServer` ligado (comportamento default
fora de CI) numa porta fixa. Setar `CI=true` no ambiente de diagnóstico manual evita o reaproveitamento
(força `reuseExistingServer: false`), mas então cada rodada paga o custo de subir um servidor novo
— aceitável para depuração pontual, não para o loop rápido de dev. Complementa P-010 (que cobre
mascaramento por **pasta de build velha**, não por **processo já vivo**) e P-012 (deps não
buildadas em worktree nova).

## P-014 · `estaleiro-standalone.mjs` deployava UI sem rodar `vite build` — mascarava mudança de `.tsx`

**Data:** 2026-07-20 (redesign do Chat pós-onda B)
**Sintoma:** Depois de editar `apps/estaleiro/ui/src/**` (ex.: `ChatView.tsx`), rebuildar o
standalone e recarregar `localhost:8899`, a UI renderiza o **código antigo** — strings/layout de
uma sessão anterior — mesmo com os testes de UI verdes contra a fonte nova. Parece cache do browser,
mas persiste após hard-reload.
**Causa raiz:** o passo `[4/4]` do `estaleiro-standalone.mjs` fazia só `cpSync(apps/estaleiro/ui/dist → DEST/ui)`
— **nunca** rodava `pnpm --filter @plataforma/estaleiro-ui build` (vite). O passo `[1/4]` builda os
pacotes TS via `tsc`, mas a UI é `vite build` e não estava em lugar nenhum do script. Resultado: o
deploy empacota o `dist/` que **por acaso** estava na árvore — quase sempre de uma sessão anterior.
O gate `pnpm gate` roda `vitest` contra a **fonte**, então passa; só o standalone servido diverge.
**Diagnóstico:** se a UI servida não bate com a fonte, confirme o bundle deployado em vez de culpar o
browser:
```bash
grep -o "<string nova>" estaleiro-run/vX/ui/assets/*.js   # 0 ocorrências = dist velho
```
**Solução aplicada:** adicionado `execSync("pnpm --filter @plataforma/estaleiro-ui build")` **antes**
do `cpSync` no passo `[4/4]`. (Regra M6: virou código no script, não prosa.)
**Como prevenir recorrência:** qualquer passo de deploy que **copia** um artefato de build (dist,
bundle) deve **produzi-lo** no mesmo passo — copiar sem buildar é a mesma classe de P-010 (pasta
velha) e do bug do `plugin-mcp` no TS_PACKAGES (dist pré-buildado na worktree mascarava a falta do
pacote no build). Se a fonte muda e o servido não, checar o artefato antes do browser.
**Limites:** só afeta o fluxo do standalone (`node backend/server.mjs` servindo `../ui` estático);
o `pnpm dev` (vite dev server) lê a fonte direto e nunca sofre disso.

## P-015 · Estado persistido do cliente (localStorage) esconde UI nova — layout FlexLayout fossilizado

**Data:** 2026-07-20 (usuário não via o Chat/Modo agente da onda B)
**Sintoma:** Deploy novo, backend certo, bundle certo — mas o usuário continua vendo a UI
**antiga** (abas Board-first, sem Chat/Config). Hard-reload não resolve. No browser limpo (MCP)
tudo aparece — "funciona pra mim", não pro usuário.
**Causa raiz:** o layout do FlexLayout é persistido em
`localStorage("estaleiro-workspace-default-v2")` a cada mudança e lido ANTES do default do
código. Um layout salvo antes de uma aba existir a esconde para sempre — o default novo nunca é
consultado. Cada onda que adiciona view (Chat, Terminal, LSP…) reproduziria o bug.
**Solução aplicada:** auto-cura em `apps/estaleiro/ui/src/shell/default-layout.ts::healLayout()`
(commit f33bce1): no load, as abas que existem no default e faltam no persistido são injetadas
(miolo → primeiro tabset; borders → border da mesma location), e o resultado curado é
re-persistido. Teste em `src/shell/default-layout.test.ts`.
**Como prevenir recorrência:** TODO estado de UI persistido no cliente (layout, preferências,
cache de dados) precisa de estratégia de reconciliação com o default do código — self-heal
(preferido), versionamento de chave com migração, ou TTL. "Persistir e ler cru" é bug latente
que só aparece no browser do usuário, nunca no do agente (que abre limpo). Ao QA de UI: teste
também COM estado persistido de versão anterior, não só em browser limpo.
**Limites:** o self-heal cobre abas novas; não cobre remoção/renomeação de abas (aba deletada do
default sobrevive no persistido — inofensivo por ora; tratar se virar problema).
