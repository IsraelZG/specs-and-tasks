---
id: T-DS-03
title: "portar componentes-piloto para core/design-system consumindo tokens semanticos"
status: draft:triaged
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-DS-01"] # Tokens semânticos compilados são pré-requisito — componentes consomem só camada semântica
blocks: []
---

# T-DS-03 · portar componentes-piloto para core/design-system consumindo tokens semanticos

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Portar o conjunto piloto de 6 componentes — `Button`, `Input`, `Card`, `Message`, `NavItem`, `Toast` — para dentro de `packages/design-system/src/components/`, refatorando cada um para consumir **exclusivamente tokens semânticos** compilados pela T-DS-01 (invariante I1). Os componentes são shadcn-based, mas o vínculo com Tailwind é mediado: as classes Tailwind referenciam CSS custom properties geradas pelo Style Dictionary — nunca valores literais (invariante I3). A hierarquia de composição `módulo → engine → componente → tokens semânticos` (§2 do RAG) deve ser respeitada.

**Entregáveis:**
- `packages/design-system/src/components/Button.tsx` — portado, consumindo `var(--semantic-button-primary-bg)`
- `packages/design-system/src/components/Input.tsx`
- `packages/design-system/src/components/Card.tsx`
- `packages/design-system/src/components/Message.tsx`
- `packages/design-system/src/components/NavItem.tsx`
- `packages/design-system/src/components/Toast.tsx`
- `packages/design-system/src/components/index.ts` — barrel export do catálogo

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/10-design-system.md](../docs/caderno-3-sdk/10-design-system.md) — §2 define o catálogo de componentes, o conjunto piloto (`Button`, `Input`, `Card`, `Message`, `NavItem`, `Toast`), a hierarquia de composição `módulo → engine → componente → tokens semânticos`, e as invariantes I1 (componente consome só camada semântica) e I3 (nenhum literal). §1 define que o vínculo com Tailwind é mediado — `tailwind.config.js` referencia CSS custom properties do Style Dictionary, nunca valores literais.
- [[catalogo-de-componentes]] — verbete canônico: conjunto piloto autorado, hierarquia de composição, contrato componente ↔ engine ↔ módulo.
- [[design-token]] — verbete canônico: três camadas, invariantes I1 e I3, proibição de consumo direto de primitivos.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/design-system/build/web/css/variables-{light,dark}.css` — tokens CSS gerados pela T-DS-01
- **[READ]** `packages/design-system/build/js/tokens.ts` — tokens TS para tipagem
- **[READ]** `docs/caderno-3-sdk/10-design-system.md` — §2 catálogo e invariantes
- **[READ]** fonte externa: `c:\Dev2026\Design System\design-system\src\components\**` — implementações originais como referência
- **[CREATE]** `packages/design-system/src/components/Button.tsx`
- **[CREATE]** `packages/design-system/src/components/Input.tsx`
- **[CREATE]** `packages/design-system/src/components/Card.tsx`
- **[CREATE]** `packages/design-system/src/components/Message.tsx`
- **[CREATE]** `packages/design-system/src/components/NavItem.tsx`
- **[CREATE]** `packages/design-system/src/components/Toast.tsx`
- **[CREATE]** `packages/design-system/src/components/index.ts` — barrel export
- **[UPDATE]** `packages/design-system/tailwind.config.js` — referenciar CSS custom properties do Style Dictionary, nunca valores literais

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** Vitest + React Testing Library (JSDOM) para renderização; Playwright (smoke visual) opcional para regressão
- [ ] **Métricas/Cobertura:** 5 casos de teste
- [ ] **Ambiente do Teste:** JSDOM (renderização React)
- [ ] **Fora de Escopo:** acessibilidade (T-015), responsividade TV, tema multi-nível (T-016)

### Casos de Teste (numerados)
1. **Cada componente renderiza sem crash:** para cada um dos 6 componentes, `render(<Component />)` em JSDOM não lança exceção.
2. **Invariante I1 — sem consumo de primitivos:** inspecionar o CSS computado de `<Button variant="primary" />` em JSDOM — propriedades de cor (color, background-color) são resolvidas via `var(--semantic-*)`, nunca via `var(--global-*)` nem valor literal (ex: `#fff`, `hsl(...)`).
3. **Invariante I3 — zero literais:** `grep -rPn "(#[0-9a-fA-F]{3,8}|rgb\(|hsl\(|font-size:\s*\d+)" packages/design-system/src/components/` não retorna matches (excluindo comentários).
4. **Tailwind config referencia custom properties:** `tailwind.config.js` contém extensões de `colors`, `spacing`, `fontSize` etc. que usam `var(--semantic-*)` — nunca valores literais.
5. **Barrel export completo:** `src/components/index.ts` exporta nomeadamente os 6 componentes; `tsc --noEmit` resolve todos.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> -
> -

### Pegadinhas conhecidas
- **Tailwind com valor literal embutido:** classes como `bg-[#ff0000]`, `text-[hsl(...)]` ou `p-[16px]` violam I3. Todo valor deve vir de token — usar `bg-[var(--semantic-button-primary-bg)]` ou configurar o `tailwind.config.js` com extensões que referenciam `var()`.
- **Componente referenciando primitivo diretamente:** se o CSS do componente usar `var(--global-color-neutral-100)` em vez de `var(--semantic-card-bg)`, viola I1. A camada semântica é a única interface dos componentes com o sistema de tokens.
- **Esquecer de mediar o vínculo Tailwind:** se o `tailwind.config.js` declarar `colors: { primary: '#...' }` com literais, o build gerará classes com valores hardcoded. Toda cor/dimensão no config deve ser `var(--semantic-*)` ou `var(--theme-*)`.

1. **[TDD]** Configurar `tailwind.config.js` referenciando apenas custom properties do Style Dictionary
2. Portar `Button` — primeiro componente, validar contra testes 1–3
3. Portar `Input`, `Card` — validar a cada componente
4. Portar `Message`, `NavItem`, `Toast`
5. Criar barrel export `index.ts`
6. Rodar teste 5 (tsc) e teste 3 (grep anti-literal)

## 6. Feedback de Especificação (Spec Feedback Loop)
> **ESPECIFICAÇÃO COMPLETA.** Seções 1–4 e 7 preenchidas pelo Task Architect com base no RAG `10-design-system.md` §2 e nos verbetes `[[catalogo-de-componentes]]` e `[[design-token]]`. Contratos extraídos diretamente da fonte — nenhum inventado.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/design-system build   # build completo (tokens + bundle Vite)
pnpm --filter @plataforma/design-system test    # vitest + RTL (JSDOM) — 5 casos de teste
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
