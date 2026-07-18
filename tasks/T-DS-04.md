---
id: T-DS-04
title: "lint anti-literal (invariante I3)"
status: ready
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-DS-01", "T-015"] # Tokens compilados (para validar contra) + CI quality gate (onde o lint será integrado)
blocks: []
capacity_target: haiku
---

# T-DS-04 · lint anti-literal (invariante I3)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Implementar uma regra de lint (ESLint) que bloqueia a declaração de **valores literais de cor, fonte e dimensão** em qualquer módulo do monorepo — implementação direta do invariante I3 do RAG §1: *"Nenhum módulo declara cor/fonte/dimensão literal. Lint de CI bloqueia."* A regra deve ser integrada ao pipeline de CI (T-015) como gate bloqueante. O lint atua sobre `src/` de todos os pacotes (`packages/*`, `apps/*`) e cobre:
- Cores literais: hex (`#fff`, `#ff0000`), `rgb(`, `rgba(`, `hsl(`, `hsla(`
- Fontes literais: `font-family:` com nomes hardcoded (excluindo `var(--font-*)`)
- Dimensões literais: `px`, `rem`, `em` em propriedades CSS/JS (excluindo valores `0`, `0px`, `0rem`, `0em` e `var(--*)`)

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/10-design-system.md](../docs/caderno-3-sdk/10-design-system.md) — §1 define o invariante I3: "Nenhum módulo declara cor/fonte/dimensão literal. Lint de CI bloqueia." Governa esta task porque fixa exatamente o que o lint deve bloquear e onde deve atuar.
- [[design-token]](../docs/conceitos/design-token.md) — verbete canônico: invariante I3, proibição de literais, três camadas. Reforça que o lint é o enforcement mechanism do contrato de tokens.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/10-design-system.md` — §1 invariante I3.
- **[READ]** `docs/conceitos/design-token.md` — verbete canônico.
- **[READ]** `packages/design-system/build/web/css/variables-light.css` — referência de tokens válidos.
- **[READ]** `packages/design-system/build/web/css/variables-dark.css` — referência de tokens válidos.
- **[READ]** `eslint.config.js` (raiz) — config ESLint atual do monorepo.
- **[READ]** `package.json` (raiz) — package.json atual do monorepo.
- **[CREATE]** `packages/eslint-plugin-design-system/package.json` — nome `@plataforma/eslint-plugin-design-system`, `type: module`, dependente de vitest/eslint.
- **[CREATE]** `packages/eslint-plugin-design-system/index.js` — exporta a regra `no-literal-tokens` e o processador `css`.
- **[CREATE]** `packages/eslint-plugin-design-system/tests/no-literal-tokens.test.js` — suíte de teste da regra e do processador usando `RuleTester` + `vitest`.
- **[UPDATE]** `package.json` (raiz) — Adicionar `"@plataforma/eslint-plugin-design-system": "workspace:*"` às devDependencies.
- **[UPDATE]** `eslint.config.js` (raiz) — Registrar o plugin `@plataforma/eslint-plugin-design-system` e aplicar o linter/processor a arquivos `.css` e regras de bloqueio a arquivos `.js, .jsx, .ts, .tsx, .css`.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- **Framework:** `vitest` (executando no escopo do novo pacote).
- **Métricas/Cobertura:** Mínimo de 6 casos de teste distintos exercitando a regra e o processador.
- **Ambiente do Teste:** Node.js puro usando a classe `RuleTester` do ESLint.
- **Fora de Escopo:** lint de tokens mal classificados (T-DS-02), lint de acessibilidade geral, lint de performance.

### Casos de Teste (numerados)
1. **Detecta literal de cor hexadecimal:**
   - Entrada JS: `const style = { color: "#ff0000" };` ou `const shorthand = { color: "#fff" };` -> Erro `literalColor`.
   - Entrada CSS: `.btn { color: #ff0000; }` -> Erro `literalColor`.
2. **Detecta literal de cor funcional:**
   - Entrada JS: `const style = { backgroundColor: "rgb(255, 0, 0)" };` -> Erro `literalColor`.
   - Entrada CSS: `.btn { background-color: hsl(0, 100%, 50%); }` -> Erro `literalColor`.
3. **Detecta dimensão literal não-zero:**
   - Entrada JS: `const style = { fontSize: "16px", padding: "1rem" };` -> Erros `literalDimension`.
   - Entrada CSS: `.btn { margin-top: 10px; }` -> Erro `literalDimension`.
4. **Permite dimensões nulas (zero):**
   - Entrada JS: `const style = { margin: 0, padding: "0px" };` -> OK (sem erro).
   - Entrada CSS: `.btn { margin: 0; padding: 0rem; width: 0px; }` -> OK (sem erro).
5. **Permite variáveis CSS válidas:**
   - Entrada JS: `const style = { color: "var(--ds-theme-surface-canvas)", padding: "var(--ds-spacing-4)" };` -> OK (sem erro).
   - Entrada CSS: `.btn { color: var(--ds-component-button-primary-bg); }` -> OK (sem erro).
6. **Detecta font-family literal e permite generic keywords:**
   - Entrada JS: `const style = { fontFamily: "Arial, sans-serif" };` -> Erro `literalFont`.
   - Entrada CSS: `.btn { font-family: "Inter", sans-serif; }` -> Erro `literalFont`.
   - Entrada CSS válida: `.btn { font-family: inherit; }` ou `.btn { font-family: var(--ds-font-sans); }` -> OK (sem erro).
7. **Evita falsos positivos em strings comuns:**
   - Entrada JS: `const url = "/icons/close-16px.png";` ou `const colorName = "red-team";` -> OK (sem erro).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** instale bibliotecas adicionais além de `eslint` e `vitest` em devDependencies.
> - **NÃO** use regex excessivamente ampla para cores que case com caminhos de arquivos ou strings normais de projeto fora de contextos de estilização.

### 📄 TEMPLATES OBRIGATÓRIOS (Use EXATAMENTE como descrito):

#### `packages/eslint-plugin-design-system/package.json`
```json
{
  "name": "@plataforma/eslint-plugin-design-system",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.js"
  },
  "scripts": {
    "test": "vitest run",
    "lint": "eslint index.js tests/"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "vitest": "^3.0.0"
  }
}
```

#### Arquitetura de `no-literal-tokens` e `css` processor em `packages/eslint-plugin-design-system/index.js`
A regra deve atuar da seguinte forma:
1. **Processador CSS:** Extrair cada par `propriedade: valor` do arquivo `.css` e gerar um código JavaScript virtual correspondente contendo metadados (como comentário) indicando a linha original e o nome da propriedade, ex:
   ```javascript
   // css-line:12
   const _css_color = "#ff0000";
   ```
   Dessa forma, o parser padrão do ESLint interpreta a saída e a regra de lint atua de forma unificada.
2. **Visitor JS/TS:**
   - Interceptar nós `Literal` e `TemplateElement`.
   - Identificar se o literal está em um contexto de estilização:
     - Se o literal pertence a uma variável gerada pelo processador CSS (prefixada por `_css_`).
     - Se o literal está contido em um objeto JavaScript cujas chaves coincidem com propriedades CSS conhecidas (ex: `color`, `backgroundColor`, `padding`, `margin`, `fontFamily`, etc.).
     - Se o literal está contido em propriedades de estilo de atributos JSX (ex: `style={{ color: "#fff" }}`).
     - Se o literal está contido em tagged template literals marcadas com `css` ou `styled`.
3. **Validação das restrições:**
   - **Cor:** Bloquear se o valor casar com o padrão hexadecimal `/#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/` ou funções `rgb(`, `rgba(`, `hsl(`, `hsla(`.
   - **Dimensão:** Bloquear se casar com `/\b\d+(\.\d+)?(px|rem|em)\b/i` e o valor numérico parsed for estritamente diferente de 0.
   - **Font-family:** Se o nome da propriedade/chave for `font-family` ou `fontFamily`, bloquear qualquer valor que não use `var(--` ou palavras-chave globais do CSS (`inherit`, `initial`, `unset`, `revert`, `revert-layer`).

### Passos para implementação:
1. **[CREATE]** Criar o diretório `packages/eslint-plugin-design-system` e inicializar `package.json` com o template fornecido.
2. **[TDD]** Criar a suíte de testes `packages/eslint-plugin-design-system/tests/no-literal-tokens.test.js` cobrindo os 7 casos listados.
3. **[CREATE]** Implementar o processador e a regra no arquivo `packages/eslint-plugin-design-system/index.js`.
4. Rodar os testes do pacote (`pnpm --filter @plataforma/eslint-plugin-design-system test`) até obter sucesso total.
5. **[UPDATE]** Adicionar o pacote local em devDependencies do `package.json` raiz do monorepo e executar `pnpm install` para estabelecer o link simbólico.
6. **[UPDATE]** Atualizar a configuração global `eslint.config.js` na raiz para registrar o plugin, aplicar o processador aos arquivos `.css` e ativar a regra `@plataforma/design-system/no-literal-tokens` com o nível `"error"`.
7. Verificar a correta execução rodando `pnpm lint` na raiz.

## 6. Feedback de Especificação (Spec Feedback Loop)
- **Definição de contexto de estilo:** A fim de evitar falsos positivos em variáveis de sistema ou caminhos de arquivos, o lint limita o rastreamento a chaves de objetos que correspondam a propriedades CSS válidas, atributos de style JSX e templates CSS/Styled.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados na Seção 3.
- [ ] O `pnpm test` no pacote do plugin roda sem erros e passa nos 7 casos de teste.
- [ ] O linter (`pnpm lint`) na raiz do monorepo executa sem erros e inclui a nova validação.
- [ ] Injetar manualmente uma violação (ex: adicionar `color: #fff` hardcoded em algum arquivo) faz o `pnpm lint` global falhar adequadamente com o código de erro correto.

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/eslint-plugin-design-system test
pnpm --filter @plataforma/eslint-plugin-design-system lint
pnpm lint
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a saída literal desses comandos colada na seção 8.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
(cole aqui a saída real)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
- **[2026-07-18T11:02]** - *gemini* - `[Endurecido]`: endureceu spec
- **[2026-07-18T11:02]** - *system* - `[Auto-promovida]`: deps todas done
