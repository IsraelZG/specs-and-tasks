---
id: T-DS-04
title: "lint anti-literal (invariante I3)"
status: draft:triaged
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-DS-01", "T-015"] # Tokens compilados (para validar contra) + CI quality gate (onde o lint será integrado)
blocks: []
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
- Dimensões literais: `px`, `rem`, `em` em propriedades CSS/JS (excluindo valores `0` e `var(--*)`)

**Entregáveis:**
- `packages/eslint-plugin-design-system/index.js` — plugin ESLint com a regra `no-literal-tokens`
- `packages/eslint-plugin-design-system/package.json` — entry point
- `eslint.config.js` (raiz) — atualizado para incluir o plugin
- Testes da regra em `packages/eslint-plugin-design-system/__tests__/`

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/10-design-system.md](../docs/caderno-3-sdk/10-design-system.md) — §1 define o invariante I3: "Nenhum módulo declara cor/fonte/dimensão literal. Lint de CI bloqueia." §1 também define que o `tailwind.config.js` referencia CSS custom properties do Style Dictionary e nunca declara valores literais. Governa esta task porque fixa exatamente o que o lint deve bloquear e onde deve atuar.
- [[design-token]] — verbete canônico: invariante I3, proibição de literais, três camadas. Reforça que o lint é o enforcement mechanism do contrato de tokens.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/10-design-system.md` — §1 invariante I3
- **[READ]** `eslint.config.js` (raiz) — config ESLint atual (criada pela T-001)
- **[READ]** `packages/design-system/build/web/css/variables-light.css` — referência de tokens válidos (para gerar allowlist)
- **[CREATE]** `packages/eslint-plugin-design-system/package.json` — nome `@plataforma/eslint-plugin-design-system`, `type: module`
- **[CREATE]** `packages/eslint-plugin-design-system/index.js` — plugin com regra `no-literal-tokens`
- **[CREATE]** `packages/eslint-plugin-design-system/__tests__/no-literal-tokens.test.js` — suíte de teste da regra (vitest)
- **[UPDATE]** `eslint.config.js` — importar e registrar o plugin; aplicar a regra como `error` sobre `**/*.{ts,tsx,js,jsx,css}`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** Vitest (Node puro — regras ESLint são testáveis sem browser)
- [ ] **Métricas/Cobertura:** 5 casos de teste
- [ ] **Ambiente do Teste:** Node puro, usando `RuleTester` do ESLint
- [ ] **Fora de Escopo:** lint de tokens mal classificados (T-DS-02), lint de acessibilidade, lint de performance

### Casos de Teste (numerados)
1. **Literal de cor hex é detetado:** `const color = "#ff0000"` em `.ts` → `error` (ou `const color = "#fff"`).
2. **Literal de cor rgb/hsl é detetado:** `background: rgb(255, 0, 0)` em `.css` → `error`. `color: hsl(0, 100%, 50%)` em `.css` → `error`.
3. **Dimensão literal é detetada:** `font-size: 16px` em `.css` → `error`. `padding: 1rem` → `error`. (Valor `0` sem unidade é permitido: `margin: 0` → `ok`.)
4. **Uso de custom property é permitido:** `color: var(--semantic-button-primary-fg)` → `ok`. `font-size: var(--semantic-font-size-lg)` → `ok`. `padding: var(--semantic-card-padding)` → `ok`.
5. **Falso positivo evitado — strings que contêm cor mas não são declarações:** `const name = "red-team"` → `ok` (não é declaração de estilo). `const url = "/icons/blue-icon.svg"` → `ok`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> -
> -

### Pegadinhas conhecidas
- **Regex muito ampla captura strings inofensivas:** `/#[0-9a-fA-F]+/` vai bater em `"#anchor"` em comentários ou strings. Restringir a contextos de declaração de estilo: templates CSS-in-JS, objetos de estilo, ficheiros `.css`/`.scss`.
- **Permitir `0` mas bloquear `0px`:** dimensão zero sem unidade (`0`) é neutra e permitida; `0px`, `0em`, `0rem` também devem ser permitidos. A regra deve focar em valores dimensionais **não-zero** com unidade.
- **Esquecer de incluir no CI:** a regra só tem efeito se estiver no `eslint.config.js` da raiz como `error` e for executada no pipeline de CI (T-015). Testar que `pnpm lint` falha com uma violação injetada propositalmente.

1. **[TDD]** Criar `packages/eslint-plugin-design-system/__tests__/no-literal-tokens.test.js` com `RuleTester` e 5 casos
2. Implementar regra `no-literal-tokens` em `packages/eslint-plugin-design-system/index.js`
3. Rodar testes e iterar até todos passarem
4. Integrar no `eslint.config.js` raiz
5. Verificar que `pnpm lint` deteta uma violação injetada e falha

## 6. Feedback de Especificação (Spec Feedback Loop)
> **ESPECIFICAÇÃO COMPLETA.** Seções 1–4 e 7 preenchidas pelo Task Architect com base no RAG `10-design-system.md` §1 invariante I3 e no verbete `[[design-token]]`. Contratos extraídos diretamente da fonte — nenhum inventado.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/eslint-plugin-design-system test   # vitest — 5 casos de teste (RuleTester)
pnpm lint                                                      # ESLint raiz — deve passar com o plugin ativo
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
