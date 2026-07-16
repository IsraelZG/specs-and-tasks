# 06 — Ferramentas LSP e MCP (Crush)

Este documento cataloga os LSPs e MCPs disponíveis no ambiente Crush. Agentes devem usar essas
ferramentas ativamente para acelerar diagnóstico, navegação e decisões. Nenhuma ferramenta dispensa
o Gate de Evidência — o `build`/`test`/`lint` seguem obrigatórios.

---

## 1. MCPs (Model Context Protocol)

Servidores MCP são processos externos que expõem ferramentas adicionais ao agente. Todos estão
conectados e prontos para uso imediato.

### 1.1 `git` (28 ferramentas)

Gerencia o repositório Git local (`C:/Dev2026`). Permite **commits, branches, diffs, logs, stash,
worktrees, tags, blame, cherry-pick** e mais — sem usar o shell diretamente.

**Quando usar:**
- Criar branches de task (`create`, `checkout`)
- Commitar mudanças (use o helper `mcp__git_git_commit`)
- Verificar estado do repo (`status`, `diff`, `log`)
- Worktrees para isolamento (`worktree add/remove/list`)
- Análise de autoria (`blame`)

**Não use** `bash` para `git` quando o MCP cobre a operação — o MCP é determinístico,
validado e não depende de escaping de shell.

### 1.2 `github` (26 ferramentas)

Interage com a API do GitHub (token configurado). Permite **criar PRs, issues, buscar código,
listar/atualizar arquivos, gerenciar reviews**.

**Quando usar:**
- Criar/atualizar Pull Requests
- Verificar arquivos no GitHub (`get_file_contents`)
- Buscar código em repositórios (`search_code`)
- Criar issues para bugs/features
- Verificar status de CI (`get_pull_request_status`)

### 1.3 `context7` (2 ferramentas)

Busca documentação atualizada de bibliotecas diretamente do Context7. Duas etapas:
1. `resolve_library_id` — traduz nome da lib (ex: `react`, `vitest`) para ID canônico
2. `get_library_docs` — retorna docs focados no tópico desejado

**Quando usar:**
- Antes de usar uma API de lib pela primeira vez na task
- Quando precisar confirmar assinatura exata de uma função
- Para verificar breaking changes em versões recentes

**Antipadrão:** NUNCA adivinhe assinaturas de API — use `context7` para confirmar. É mais rápido
que ler código fonte e evita erros de tipagem.

### 1.4 `sequential-thinking` (1 ferramenta)

Raciocínio estruturado multi-passo. Permite decompor problemas complexos em pensamentos
encadeados, com revisão, branching e verificação de hipóteses.

**Quando usar:**
- Planejamento de arquitetura antes de codar
- Debugging de bugs complexos com múltiplas causas possíveis
- Decisões de design com trade-offs não óbvios
- Análise de impacto de mudanças cross-cutting

**Não abuse:** para tarefas triviais não use — uma análise direta é suficiente. Reserve para
problemas que exigem 5+ passos de raciocínio.

---

## 2. LSPs (Language Server Protocol)

LSPs vivem no **`crush.json` global** — `%LOCALAPPDATA%\crush\crush.json` (Windows) ou
`~/.local/share/crush/crush.json` (Unix). **Projetos não declaram LSPs.** Adicione/edite a
seção `lsp` globalmente para todos os repositórios. Cada entrada usa `npx` (sem precisar
instalar o binário por projeto) e o campo `filetypes` restringe o servidor aos arquivos
relevantes — sem ele, YAML/JSON cuspem erros espúrios em `.md`.

### 2.1 Servidores configurados

| Key          | Servidor                          | Filetypes                        | Uso principal |
|--------------|-----------------------------------|----------------------------------|---------------|
| `typescript` | `typescript-language-server`      | ts, tsx, js, jsx, mjs, cjs       | Diagnóstico de tipos, autocomplete, referências |
| `json`       | `vscode-json-languageserver`      | json, jsonc                      | Validação de schema, erros de sintaxe |
| `yaml`       | `yaml-language-server`            | yaml, yml                        | Validação de schema, erros de indentação |
| `markdown`   | `vscode-markdown-languageserver`  | md, mdx                          | Links, estrutura de headings, code fences |
| `html`       | `vscode-html-languageserver`      | html, htm                        | (frontend nexus) |
| `css`        | `vscode-css-languageserver`       | css, scss, less                  | (frontend nexus) |

> **Limitação conhecida:** `vscode-markdown-languageserver` valida sintaxe e links
> padrão, mas **não conhece a sintaxe `[[wikilink]]`** do wiki do projeto. Para validar
> `[[slug]]`, use `/verificar` (subagent `auditor-wiki`). Upgrade path: trocar por
> `marksman` (binário Go, não distribuído via npm — exige `go install` ou baixar do
> GitHub releases) e adicionar `"command": "marksman", "args": ["server"]` à seção `lsp`.

### 2.2 Ferramentas expostas pelo Crush com LSP ativo

| Ferramenta         | Função |
|--------------------|--------|
| `lsp_diagnostics`  | Erros/warnings/hints do projeto inteiro ou de um arquivo |
| `lsp_references`   | Encontra todos os usos de um símbolo (mais preciso que grep) |
| `lsp_restart`      | Reinicia servidores LSP — usar após editar a seção `lsp` do global |

**Quando usar:**
- `lsp_diagnostics` após cada edição para validar que não introduziu erros
- `lsp_references` antes de renomear ou alterar assinatura de função exportada
- `lsp_restart` após editar a seção `lsp` do global, ou se diagnósticos parecerem stale

---

## 3. LSP e MCP como capacidade de plataforma vs. ferramenta MGTIA

> **Distinção normativa:** LSP e MCP no playbook são **ferramentas que os agentes de desenvolvimento
> (MGTIA) usam** para trabalhar no código (diagnósticos, referências, git, GitHub). No wiki de
> produto, `lsp-plugin` e `mcp-plugin` são **archetypes de plugin da plataforma**
> (`caderno-3-sdk/12-plugins-e-computacao.md §3`) — capacidades padronizadas que qualquer agente
> pode invocar para inteligência de linguagem e tool-calling, respectivamente. A ferramenta que o
> agente usa para construir ≠ o contrato que o agente expõe como serviço. O playbook cataloga a
> primeira; o caderno-3/12 define o segundo.

---

## 4. Boas práticas

1. **MCP sobre shell:** prefira `mcp__git_*` a `bash git ...`. Evita escaping, encoding e timeouts.
2. **Context7 antes de codar:** confirme assinaturas de API com `context7` em vez de chutar.
3. **LSP após editar:** rode `lsp_diagnostics` no arquivo editado para detectar erros cedo.
4. **Sequential-thinking com moderação:** só para problemas genuinamente complexos (5+ passos).
5. **Nenhuma ferramenta substitui o Gate:** `pnpm build && pnpm test && pnpm lint` continuam
   obrigatórios. LSP e MCP são auxiliares, não evidência.
