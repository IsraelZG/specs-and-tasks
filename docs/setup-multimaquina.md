# Setup multi-máquina

O projeto roda em máquinas heterogêneas (hoje: Windows 11 ARM64, Windows 11 x64; planejado:
Linux ARM64) contra os **mesmos remotes**. Este guia é o checklist para colocar uma máquina nova
no ar e as regras que mantêm as máquinas compatíveis entre si.

## Princípios (o que torna isso possível)

1. **Só código + lockfile atravessam máquinas (via git).** `node_modules/`, `.turbo/`, `dist/`,
   worktrees (`.superapp-worktrees/`) e `.npmrc` são **locais por máquina** — nunca copie entre
   máquinas nem entre SOs/arquiteturas (PITFALLS P-001, P-007).
2. **Nenhum path absoluto no tooling.** Os scripts do controle localizam o superapp por
   `SUPERAPP_DIR` (env var) ou, por default, pela **pasta irmã** `../superapp`. Basta clonar os
   dois repos lado a lado em qualquer diretório (`E:\Dev2026`, `C:\Dev2026`, `~/dev2026`...).
3. **Line endings normalizados.** O `.gitattributes` dos dois repos força LF no repo e no
   checkout (`* text=auto eol=lf`); `.cmd`/`.bat` ficam CRLF. Não configure `core.autocrlf`
   (deixe `false`/ausente — o `.gitattributes` manda).
4. **Scripts multiplataforma.** O tooling (`saude`, `orquestrar`, `worktree`, `nexus-start/stop`,
   `gate`, `verify.mjs`, hooks) ramifica por `process.platform` onde precisa — nada assume mais
   `cmd.exe`, `taskkill` ou `.cmd` fora do Windows.

## Checklist: máquina nova

Layout esperado (os nomes das pastas importam para o default `../superapp`):

```
<pasta-mãe>/
├── docs/        ← repo de controle (specs-and-tasks)
├── superapp/    ← repo de código
└── .superapp-worktrees/   ← criado pelo `pnpm wt`, local, nunca versionado
```

1. **Node.js ≥ 20** e **pnpm 11** (`corepack enable` usa o `packageManager` pinado no
   package.json — versão idêntica em todas as máquinas).
2. **Clonar os dois repos lado a lado** com os nomes `docs` e `superapp`. Se o layout for outro,
   exporte `SUPERAPP_DIR=<caminho do superapp>` no ambiente.
3. **Criar o `.npmrc` local** (gitignored) em cada repo antes do primeiro `pnpm install`, com o
   `supportedArchitectures` do host (ver P-001):

   ```ini
   # Windows ARM64
   supportedArchitectures[os][]=win32
   supportedArchitectures[cpu][]=arm64
   ```
   ```ini
   # Windows x64
   supportedArchitectures[os][]=win32
   supportedArchitectures[cpu][]=x64
   ```
   ```ini
   # Linux ARM64
   supportedArchitectures[os][]=linux
   supportedArchitectures[cpu][]=arm64
   ```
4. **`pnpm install`** em cada repo (nunca reaproveite `node_modules` de outra máquina — os
   binários nativos melhor exemplificados por `better-sqlite3`, `onnxruntime-node`, `esbuild` e
   `turbo` são por SO/arch).
5. **Windows apenas:** Developer Mode ligado (symlinks do pnpm — P-005); rodar installs pesados
   em terminal standalone (P-002).
6. **Smoke test:** `pnpm -r build && pnpm -r test` no superapp; `node tools/scripts/saude.mjs`
   no docs.

## Regras de convivência entre máquinas

- `git pull` nos **dois** repos no início de cada sessão e ao alternar de máquina (P-008).
- Task só termina com os **dois pushes** (código + controle) — sem isso a outra máquina trabalha
  no escuro (P-008).
- Worktrees e slots quentes (`.superapp-worktrees/`) são locais; recrie-os em cada máquina
  (`pnpm wt`), nunca sincronize.
- Scripts novos no tooling: use `process.platform` para ramificar SO, `SUPERAPP_DIR`/pasta irmã
  para localizar o código, e `path.join`/`path.resolve` (nunca separador literal). Binários:
  `foo.cmd` só no Windows (`process.platform === 'win32'`).

## Notas por plataforma

- **Windows ARM64:** alguns pacotes nativos sem prebuild ARM64 compilam do fonte — exige
  Visual Studio Build Tools. `onnxruntime-node` tem prebuild win32-arm64 desde a 1.21.
- **Linux ARM64:** prebuilds linux-arm64 existem para `better-sqlite3`, `esbuild`, `turbo` e
  `onnxruntime-node`. O `nexus-start/stop` usa `which`/`kill`/`lsof` (instale `lsof` se a distro
  não trouxer). Headroom via `python -m pip install "headroom-ai[all]"` (fica em `~/.local/bin`).
- **Case-sensitivity:** o filesystem do Linux diferencia maiúsculas — um import com capitalização
  errada que "funciona" no Windows quebra no Linux. Na dúvida, confira o nome real do arquivo.
