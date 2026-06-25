# Ponytail — setup desta integração

Integração do [ponytail](https://github.com/DietrichGebert/ponytail) (v4.7.0) no superapp. Ruleset
puro de contexto (sem runtime, sem rede, agnóstico de provedor). **Nível padrão recomendado: `full`**
(não `ultra`).

## O que já está integrado por arquivo (automático)

| Ferramenta | Como recebe o ponytail | Arquivos |
|---|---|---|
| **Crush** (arm64) | lê `.agents/AGENTS.md` (contexto) + descobre `.claude/skills/` | `.agents/AGENTS.md` (bloco `BEGIN/END ponytail`), `.claude/skills/ponytail{,-review}/SKILL.md` |
| **OpenCode** (x64) | plugin injeta o ruleset no system prompt + registra `skills/` | `opencode.json`, `.opencode/plugins/ponytail.mjs`, `.opencode/command/ponytail{,-review}.md`, `hooks/ponytail-{config,instructions}.js`, `skills/ponytail{,-review}/SKILL.md` |
| **Antigravity IDE** | lê `AGENTS.md`/`.agents/` na raiz | `.agents/AGENTS.md` (mesmo bloco) |
| **Claude Code (app Windows)** | **plugin manual** (ver abaixo) | — (não dá para instalar por arquivo) |

Trocar intensidade nos agentes que suportam comando: `/ponytail lite|full|ultra` (e `/ponytail off`).
`/ponytail-review` roda a revisão focada só em over-engineering.

## Ação manual obrigatória — instalar o plugin no app do Claude Code (Windows)

O app não lê plugin de arquivo do repo; instale pela UI uma única vez:

1. **Customize** (engrenagem/menu) → **+ plugins**.
2. **Create plugin and add marketplace** → **Add from repository**.
3. Cole a URL do repositório: `https://github.com/DietrichGebert/ponytail`
4. Selecione o plugin **ponytail** (marketplace `ponytail`, do owner DietrichGebert) e ative.
5. No chat, confirme com `/ponytail full` (default já é `full`).

> O mesmo vale para o app do Antigravity caso você prefira o plugin à leitura do `AGENTS.md` — mas
> para o Antigravity o `.agents/AGENTS.md` da raiz já cobre, então o plugin é opcional lá.

## Validação pendente (sua) — comportamento em modelo remoto

O ponytail é só contexto; o efeito depende de o modelo **seguir** o ruleset. Os provedores remotos
em uso (DeepInfra, OpenCode Go, DeepSeek) precisam ser validados na prática, em especial:

- **DeepSeek-R1**: modelo de raciocínio; vale medir se ele respeita a "escada" YAGNI e o formato de
  saída enxuto, ou se ignora/raciocina por cima do ruleset. Rode 1–2 tarefas reais de código com
  `/ponytail full` e compare o diff/verbosidade com o baseline sem ponytail. Se ele não aderir, o
  repo tem benchmarks em `benchmarks/` que dá para adaptar como referência de medição.

## Remover / atualizar

- **Remover**: apague tudo entre `<!-- BEGIN ponytail -->` e `<!-- END ponytail -->` em
  `.agents/AGENTS.md`; remova `opencode.json` (ou só a entrada `plugin`), `.opencode/`, `hooks/`,
  `skills/ponytail*`, `.claude/skills/ponytail*`.
- **Atualizar**: rebaixe os arquivos do repo oficial (mesmos caminhos) e re-cole o bloco do
  `AGENTS.md` oficial entre os marcadores.
