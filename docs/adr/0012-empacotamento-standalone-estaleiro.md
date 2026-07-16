# ADR 0012 — Empacotamento standalone do Estaleiro (D4)

- **Status:** Aceito
- **Data:** 2026-07-07
- **Contexto MGTIA:** EST-15 (spike), resolve a decisão **D4** do [RFC-018](../rfcs/rfc-018-estaleiro.md).
- **Decisão registrada por:** Antigravity (2026-07-07) — Opção C + cadência manual. Este ADR
  formaliza a decisão e registra a evidência do PoC.

## Problema — recursão da working tree

O Estaleiro é a casca que **despacha agentes** sobre o próprio monorepo onde ele vive (RFC-018 §3).
Se a instância operacional *for* a working tree do monorepo, um agente que o Estaleiro despacha pode
editar/rebuildar arquivos da instância **em execução** — corrompendo a ferramenta enquanto ela roda
(o problema de recursão). Um dos despachantes é o `plugin-dispatcher` (EST-07), que roda tasks com
acesso ao filesystem.

A instância operacional precisa, portanto, ser uma **cópia/build standalone**, separada da working
tree fonte, atualizada só por **rebuild explícito** — nunca em tempo real a partir do código-fonte.

## Opções avaliadas

Critérios (RFC-018 / EST-15 §4): (1) bundle inicial, (2) complexidade de build, (3) familiaridade
da stack, (4) facilidade de atualização, (5) segurança/sandbox, (6) manutenção/comunidade.

| Critério | A. Electron | B. Tauri | **C. Node standalone + navegador** |
|---|---|---|---|
| 1. Bundle inicial | ~150–250 MB (Chromium embutido) | ~5–15 MB (webview do SO) | **~0 MB** extra (Node já é dep do monorepo; usa o navegador instalado) |
| 2. Complexidade de build | `electron-builder`, empacote por SO | toolchain **Rust** + `cargo` além de `pnpm` | **`pnpm build` + copiar dir**; zero toolchain novo |
| 3. Familiaridade | JS/Node — alta | Rust no backend — **requer aprendizado** | JS/Node — **alta**, mesma stack do superapp |
| 4. Atualização | substituir bundle + auto-update framework | idem, `updater` nativo | **copiar dir novo + restart**; trivial |
| 5. Segurança/sandbox | `contextIsolation`, mas superfície Chromium grande | sandbox do webview + allowlist Rust — mais forte | conteúdo servido em `localhost`, isolado do FS por ser HTTP; sandbox = o do próprio navegador |
| 6. Manutenção | breaking changes frequentes; comunidade enorme | jovem, evolui rápido; comunidade menor | **superfície mínima** (só `node:http`); nada a manter além do superapp |

### Descartes
- **Electron:** resolve a separação, mas paga ~200 MB e um segundo runtime (Chromium) para um
  problema que é de *isolamento de diretório*, não de necessidade de um browser embutido. YAGNI.
- **Tauri:** bundle pequeno e sandbox forte, mas **introduz Rust** numa stack 100% JS/TS — custo de
  aprendizado e de build (cargo) desproporcional ao ganho para um MVP interno.

## Decisão

**Opção C — Node standalone + navegador.** A instância operacional é um **diretório buildado, fora
da working tree**, servido por um processo Node mínimo (`node:http`) em `localhost`; a UI abre no
navegador já instalado. Nenhum runtime de desktop novo, nenhuma toolchain nova.

O isolamento vem do **diretório separado**, não do framework: a instância só enxerga os arquivos que
foram **copiados no build**, então editar a fonte no monorepo não a afeta até um rebuild explícito.

Migração futura para Electron/Tauri fica em aberto caso surja necessidade real de shell nativo
(bandeja, auto-update, deep-links) — mas nada disso é requisito hoje.

## Cadência de atualização

**Manual, por enquanto** (Opção B da decisão): `pnpm build:estaleiro && <copiar dir> && restart`.
Um script `build → copiar → (re)start` encapsula os três passos. Watch+rebuild e CI local ficam
**fora do escopo** deste spike (EST-15 §5 proíbe automatizar a cadência aqui) — são tarefa futura,
a criar quando o atrito do rebuild manual justificar.

## PoC — evidência de separação

PoC descartável em `C:/tmp/estaleiro-poc` (fonte) buildando para `C:/tmp/estaleiro-standalone-v{1,2}`
(**fora do monorepo — nada commitado**). `build.mjs` copia `source/ → dest/`; `server.mjs` serve o
`index.html` do **próprio diretório buildado**. Resultado (casos §4.7–10, saída literal na task §8):

1. **Build separado** — `source → estaleiro-standalone-v1` fora da working tree. ✔
2. **Instância standalone** — `:4599` serve o `index.html` copiado. ✔
3. **Mutação não vaza** — append no `source/index.html` **não** muda o servido em `:4599`. ✔
4. **Rebuild paralelo** — v2 (com a mutação) sobe em `:4600` e **v1 continua no ar e original**. ✔

Separação provada: a instância rodando é imune a edições da fonte até rebuild explícito — exatamente
o que D4 exige para quebrar a recursão.

## Consequências

- Estaleiro empacotado sem dependência de desktop framework; build = `pnpm build` + cópia de diretório.
- Reabrir a decisão se aparecer requisito de shell nativo (auto-update, tray, deep-link) → então
  reavaliar Tauri (bundle pequeno) sobre Electron.
- Automação da cadência (watch/CI) é tarefa futura, fora deste spike.

## Reavaliação de Mecanismo de Montagem (T-1052)

Em 2026-07-12, a task **T-1052** avaliou a troca do mecanismo de montagem (`pnpm deploy` + cópia + patches manuais de imports) por um bundler Node (`esbuild`). O objetivo era verificar se um bundler reduz a fragilidade do artefato (como os hot-patches de extensões, cópia de JSONs, e manipulação manual).

### Resultados da Spike (medidos em 2026-07-15, PoC isolado em `C:\tmp\estaleiro-bundler-t1052\`)
- **Tamanho:** Bundle do servidor Node ficou com **~2.0 MB** (`server.mjs`) e o Worker do browser
  bundlado com **~113.7 KB** (inclui `wa-sqlite`, não externalizado — ver Step 3 do PoC). O script
  de orquestração (`esbuild-bundle.mjs`, 346 linhas / ~14 KB) ficou **maior**, não menor, que o
  script de produção atual (`scripts/estaleiro-standalone.mjs`, 330 linhas / ~13 KB) — o bundler não
  reduz a *quantidade* de orquestração; ele muda a *natureza* dela (de patches textuais em `dist/`
  compilado para configuração de `external`/`loader` do esbuild).
- **Isolamento de dependências nativas:** Dependências nativas/WASI (`better-sqlite3`, `onnxruntime`,
  `zen-engine`) continuam sendo empacotadas como arquivos externos (`external`) no bundle. Uma cópia
  limpa via `npm install --ignore-scripts` e bindings pré-compilados (pnpm store) permitiu que as
  DLLs/nativas continuassem rodando 100% no standalone isolado.
- **Integração do Worker:** Foi possível emitir um `sqliteWasm.worker.js` nativamente como um entry
  separado ao lado do bundle, perfeitamente resolvido pelo construtor de worker com
  `new URL('./sqliteWasm.worker.js', import.meta.url)` sem precisar aplicar `replace()` ou patches.
  Comprovado em runtime real (Chromium via Playwright): round-trip `open → CREATE → INSERT 42 →
  SELECT → close` no Worker servido ao lado do bundle.
- **Estabilidade no Git:** Nenhuma sujeira residual permaneceu na working tree principal (`git status
  --porcelain --untracked-files=all` vazio), garantindo a prova de separação exigida — o PoC inteiro,
  incluindo o script de bundling, vive fora do monorepo em `C:\tmp`.
- **Fallback WASI:** Manteve-se o fallback pontual para `@gorules/zen-engine-wasm32-wasi` via cópia e
  rewrite do índice em Windows ARM64.

### Veredito
**Adotar bundler (`esbuild`)** — mas não pela redução de código de orquestração (o script cresceu
ligeiramente: 346 vs. 330 linhas) nem por um Worker menor (113.7 KB, não ~2.4 KB como uma medição
anterior sem bundling de `wa-sqlite` sugeria). O ganho real é qualitativo: elimina o `pnpm deploy` e
toda a cascata de `.pnpm`/linkagens que ele exige, substitui os patches textuais em `dist/` compilado
(regex sobre imports extensionless) por resolução nativa de módulos do esbuild, e emite o Worker
browser como artefato self-contained sem hot-patch — os três riscos que motivaram a spike (P-009,
P-010, cópia manual de assets). A estrutura original do standalone (Node externo à working tree,
cadência manual) permanece idêntica.
