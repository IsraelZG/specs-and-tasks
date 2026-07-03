---
id: T-DS-02
title: "importar schema de metadados AI-ready + indice + CI"
status: draft:triaged
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-DS-01"] # Tokens compilados são pré-requisito — "token layer leads, metadata follows"
blocks: ["T-DS-03"] # Componentes dependem dos metadados para validação de CI
---

# T-DS-02 · importar schema de metadados AI-ready + indice + CI

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Importar e tipificar o **schema de metadados AI-ready** definido no RAG §3 para dentro de `packages/design-system/src/metadata/`, e implementar a geração automática do **índice leve** (`components.index.json`) que serve à descoberta de componentes por agentes de IA. Ao fim, o pacote de design-system publica tipos TypeScript canônicos (`ComponentIdentity`, `Usage`, `AntiPatterns`, `Variants`, `Composition`, `Behavior`, `Props`, `TokenUsage`, `Accessibility`, `AIHints`) e um script `build:index` que varre os metadados e gera o índice. A validação de CI (drift de schema, tokens mal classificados, anti-patterns malformados) é obrigatória para entrada no catálogo.

**Entregáveis:**
- `packages/design-system/src/metadata/types.ts` — tipos TypeScript canônicos
- `packages/design-system/src/metadata/components.index.json` — índice auto-gerado
- `packages/design-system/scripts/build-index.mjs` — script gerador do índice
- `packages/design-system/scripts/validate-metadata.mjs` — validador de CI (drift, tokens, anti-patterns)

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/10-design-system.md](../docs/caderno-3-sdk/10-design-system.md) — §3 define o schema TypeScript canônico de metadados (`ComponentIdentity`, `Usage`, `AntiPatterns`, `Variants`, `Composition`, `Behavior`, `Props`, `TokenUsage`, `Accessibility`, `AIHints`), o índice leve `components.index.json`, a marcação de ciclo de vida (`status: stable | deprecated`, `replacedBy?`, `deprecatedSince?`), a exclusão de componentes deprecated das `AIHints`, e o princípio "token layer leads, metadata follows". Governa esta task porque fixa exatamente quais tipos e estruturas o schema deve conter.
- [[catalogo-de-componentes]] — verbete canônico: schema AI-ready, conjunto piloto (`Button`, `Input`, `Card`, `Message`, `NavItem`, `Toast`), fluxo de autoria de 12 passos, validação de CI obrigatória.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/10-design-system.md` — §3 schema de metadados
- **[READ]** `docs/conceitos/catalogo-de-componentes.md` — verbete canônico
- **[READ]** `packages/design-system/package.json` — scripts existentes
- **[READ]** `packages/design-system/build/js/tokens.ts` — tokens compilados (T-DS-01) para validação cruzada
- **[CREATE]** `packages/design-system/src/metadata/types.ts` — tipos TypeScript: `ComponentIdentity`, `Usage`, `AntiPatterns`, `Variants`, `Composition`, `Behavior`, `Props`, `TokenUsage`, `Accessibility`, `AIHints`
- **[CREATE]** `packages/design-system/scripts/build-index.mjs` — varre `src/metadata/components/*.json` e gera índice
- **[CREATE]** `packages/design-system/scripts/validate-metadata.mjs` — validador CI (schema drift, classificação de tokens, anti-patterns)
- **[UPDATE]** `packages/design-system/package.json` — adicionar scripts `build:index` e `validate`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** Vitest (Node puro)
- [ ] **Métricas/Cobertura:** 4 casos de teste
- [ ] **Ambiente do Teste:** Node puro, sem browser
- [ ] **Fora de Escopo:** metadados individuais dos 6 componentes piloto (T-DS-03), integração com agentes de IA

### Casos de Teste (numerados)
1. **Tipos compilam sem erro:** `tsc --noEmit` sobre `src/metadata/types.ts` passa — todas as interfaces exportadas são válidas e não têm `any` implícito.
2. **Índice gerado é JSON válido e contém os campos obrigatórios:** `node scripts/build-index.mjs` produz `components.index.json` com array de objetos, cada um contendo ao menos `id`, `name`, `status`.
3. **Validador deteta schema drift:** fornecer um ficheiro de metadados com campo obrigatório ausente (ex: `Props` faltando); `node scripts/validate-metadata.mjs` retorna exit code ≠ 0.
4. **Validador deteta token não classificado:** fornecer metadados onde `TokenUsage` referencia token que não existe em `build/js/tokens.ts`; validador reporta erro.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> -
> -

### Pegadinhas conhecidas
- **Schema TypeScript divergente do RAG:** o §3 descreve 10 tipos canônicos — se o `types.ts` criado omitir algum (ex: `AIHints` ou `Behavior`), a validação de CI posterior quebrará. Conferir a lista completa no RAG antes de implementar.
- **Índice gerado manualmente (não auto-gerado):** o RAG §3 exige "índice leve auto-gerado". Não criar um JSON estático — criar o script `build-index.mjs` que varre `src/metadata/components/` e gera o índice.
- **Validador sem teste de drift:** se `validate-metadata.mjs` só validar JSON Schema mas não cruzar com `build/js/tokens.ts`, tokens mal classificados passam batido (quebra o princípio "token layer leads").

1. **[TDD]** Escrever teste 1 (tipos compilam) — `packages/design-system/src/metadata/__tests__/types.test.ts`
2. Criar `src/metadata/types.ts` com os 10 tipos do RAG §3
3. Criar `scripts/build-index.mjs` com leitura de diretório + merge
4. Criar `scripts/validate-metadata.mjs` com validação JSON Schema + cross-check de tokens
5. Escrever testes 2–4 e iterar

## 6. Feedback de Especificação (Spec Feedback Loop)
> **ESPECIFICAÇÃO COMPLETA.** Seções 1–4 e 7 preenchidas pelo Task Architect com base no RAG `10-design-system.md` §3 e no verbete `[[catalogo-de-componentes]]`. Contratos extraídos diretamente da fonte — nenhum inventado.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/design-system validate   # validate-metadata.mjs — schema + cross-check
pnpm --filter @plataforma/design-system build:index # gera components.index.json
pnpm --filter @plataforma/design-system test        # vitest — 4 casos de teste
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
