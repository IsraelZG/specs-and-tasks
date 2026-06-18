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

<!-- Adicione novas entradas acima desta linha, no formato P-NNN -->
