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

<!-- Adicione novas entradas acima desta linha, no formato P-NNN -->
