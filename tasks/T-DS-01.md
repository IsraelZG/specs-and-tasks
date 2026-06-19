---
id: T-DS-01
title: "importar pacote de tokens + build multi-plataforma (Style Dictionary)"
status: draft
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-011"] # T-011 incorpora a lib @plataforma/design-system no monorepo
blocks: ["T-DS-02", "T-DS-03", "T-DS-04"] # Metadados, componentes e lint dependem dos tokens compilados
---

# T-DS-01 · importar pacote de tokens + build multi-plataforma (Style Dictionary)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Importar o build de tokens via **Style Dictionary** para o pacote `packages/design-system` já copiado pela T-011, gerando artefatos para todas as plataformas-alvo: CSS custom properties (modo `light`/`dark`/`compact`/`cozy`/`tv`), módulo JS/TS (consumo interno dos componentes) e React Native. O build deve respeitar a arquitetura de três camadas definida em [[design-token]] e no RAG §1: os outputs de tokens semânticos referenciam **exclusivamente** a camada de tema via `outputReferences` do Style Dictionary — nunca primitivos diretamente. Invariantes I1 e I4 são o contrato deste build.

**Entregáveis:**
- `packages/design-system/tokens/` — ficheiros-fonte JSON do Style Dictionary (globals, themes, semantics)
- `packages/design-system/style-dictionary.config.js` — config multi-platform
- `packages/design-system/build/web/css/variables-{light,dark}.css` — CSS gerado
- `packages/design-system/build/web/css/density-{compact,cozy,tv}.css` — densidade
- `packages/design-system/build/js/tokens.ts` — módulo TS com objetos tipados
- `packages/design-system/build/native/tokens.ts` — módulo React Native

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/10-design-system.md](../docs/caderno-3-sdk/10-design-system.md) — §1 define a arquitetura de três camadas (global/tema/semântica), invariantes I1–I4 e a obrigação de Style Dictionary como fonte única de variáveis exportadas. Governa a geração de tokens porque fixa o contrato que o build deve cumprir (camadas, outputReferences, densidade ortogonal, nunca valores literais).
- [[design-token]] — verbete canônico: três camadas, Style Dictionary, invariantes I1 e I3, relação com CONTENT:THEME. Reforça que componentes nunca consomem primitivos diretamente.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/design-system/package.json` — scripts e dependências copiados pela T-011
- **[READ]** `packages/design-system/tokens/` — ficheiros JSON fonte (globals, themes, semantics) se já existirem; criar se ausentes
- **[READ]** `docs/caderno-3-sdk/10-design-system.md` — §1 contrato de tokens
- **[READ]** `docs/conceitos/design-token.md` — verbete canônico
- **[CREATE/UPDATE]** `packages/design-system/tokens/globals.json` — primitivos (cores HSL, escala base-4px, tipografia, motion)
- **[CREATE/UPDATE]** `packages/design-system/tokens/themes/{light,dark}.json` — mapeamento tema → primitivos
- **[CREATE/UPDATE]** `packages/design-system/tokens/semantics/components.json` — tokens semânticos (button.primary.background, card.padding, …)
- **[CREATE/UPDATE]** `packages/design-system/tokens/semantics/density/{compact,cozy,tv}.json` — sobrescrição dimensional
- **[CREATE]** `packages/design-system/style-dictionary.config.js` — config multi-platform com `outputReferences: true` na camada semântica
- **[OUTPUT]** `packages/design-system/build/web/css/variables-{light,dark}.css` — CSS gerado (verificação de existência após build)
- **[OUTPUT]** `packages/design-system/build/web/css/density-{compact,cozy,tv}.css`
- **[OUTPUT]** `packages/design-system/build/js/tokens.ts` — módulo TS tipado
- **[OUTPUT]** `packages/design-system/build/native/tokens.ts` — módulo React Native

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** Vitest (Node puro)
- [ ] **Métricas/Cobertura:** 5 casos de teste + smoke de build
- [ ] **Ambiente do Teste:** Node puro, sem browser
- [ ] **Fora de Escopo:** testes visuais/Playwright (T-015), consumo dos tokens pelos componentes (T-DS-03)

### Casos de Teste (numerados)
1. **Build Style Dictionary produz saída sem erro:** `node style-dictionary.config.js` (ou equivalente via script `build:tokens`) retorna exit 0 e gera CSS/JS/TS nos diretórios esperados.
2. **CSS multi-tema gerado corretamente:** `variables-light.css` existe e contém `--color-bg-primary` (ou token equivalente) com valor HSL; `variables-dark.css` existe com valores diferentes.
3. **Densidade ortogonal:** ficheiros `density-{compact,cozy,tv}.css` gerados sem variáveis órfãs — todas as variáveis dimensionais (@size, @spacing, @radius) são sobrescritas, não criadas em paralelo.
4. **Invariante I1 — semântica referencia só tema:** inspecionar `build/web/css/variables-light.css` e verificar que tokens da camada semântica usam `var()` referenciando tokens da camada de tema (ex: `var(--theme-color-bg-primary)`), nunca primitivos (ex: NUNCA `var(--global-color-neutral-100)`).
5. **Invariante I4 — fallback determinístico:** o CSS gerado para o tema `dark` cobre todos os tokens — nenhum token semântico fica sem valor CSS. (Teste: diff da lista de custom properties entre light e dark; não pode haver token presente em light e ausente em dark.)
6. **Módulo TS gerado é válido:** `build/js/tokens.ts` compila sem erro com `tsc --noEmit`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> -
> -

### Pegadinhas conhecidas
- **outputReferences ausente na camada semântica:** se o Style Dictionary não tiver `outputReferences: true` para a camada semântica, os tokens serão resolvidos para valores literais (violando I1). Verificar a config com `grep outputReferences`.
- **Densidade gerando variáveis órfãs:** se a densidade criar novas variáveis em vez de sobrescrever as existentes, os componentes que consomem a variável original não verão efeito. Usar o mesmo nome de token, apenas com seletor de especificidade superior (`:root[data-theme][data-density]`).
- **Tokens referenciando primitivos diretamente:** verificar que nenhum `value` de token semântico referencia `{global.*}` — só pode referenciar `{theme.*}`.

1. **[TDD]** Escrever teste 1 (smoke de build) — `packages/design-system/src/__tests__/tokens-build.test.ts`
2. Escrever os ficheiros-fonte JSON (globals, themes, semantics)
3. Criar `style-dictionary.config.js` com platforms `web/css`, `js`, `native`
4. Executar build e validar contra testes 2–6
5. Ajustar `package.json` scripts (`build:tokens`) se necessário

## 6. Feedback de Especificação (Spec Feedback Loop)
> **ESPECIFICAÇÃO COMPLETA.** Seções 1–4 e 7 preenchidas pelo Task Architect com base no RAG `10-design-system.md` §1 e no verbete `[[design-token]]`. Contratos extraídos diretamente da fonte — nenhum inventado.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/design-system build:tokens   # Style Dictionary → CSS/JS/native
pnpm --filter @plataforma/design-system build           # build completo (tokens + Vite)
pnpm --filter @plataforma/design-system test            # vitest — 6 casos de teste
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
