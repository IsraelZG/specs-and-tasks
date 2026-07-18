---
id: T-DS-02
title: "importar schema de metadados AI-ready + indice + CI"
status: ready
complexity: 3
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-DS-01"] # Tokens compilados são pré-requisito — "token layer leads, metadata follows"
blocks: [] # Metadados AI-ready não bloqueiam a conformação dos seis componentes-piloto de T-DS-03
capacity_target: haiku
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
- **[READ]** `docs/caderno-3-sdk/10-design-system.md` — §3 contrato de metadados e ciclo de vida.
- **[READ]** `docs/conceitos/catalogo-de-componentes.md` — verbete canônico de componentes e catálogo.
- **[READ]** `packages/design-system/package.json` — scripts de execução existentes e dependências.
- **[READ]** `packages/design-system/tokens/semantics/components.json` — tokens semânticos de componentes (T-DS-01) para validação cruzada.
- **[READ]** `packages/design-system/tokens/themes/{light,dark}.json` — tokens de tema (T-DS-01) para validação cruzada.
- **[UPDATE]** `packages/design-system/src/metadata/schema.ts` — adicionar propriedades de ciclo de vida (`status: 'stable' | 'deprecated'`, `replacedBy?`, `deprecatedSince?`) no `ComponentIdentity`. (Citação: `docs/caderno-3-sdk/10-design-system.md §3`).
- **[CREATE]** `packages/design-system/src/metadata/types.ts` — tipos TypeScript canônicos e alias `AntiPatterns`. (Citação: `docs/caderno-3-sdk/10-design-system.md §3`).
- **[CREATE]** `packages/design-system/scripts/build-index.mjs` — script dinâmico gerador de `components.index.json`. (Citação: `docs/caderno-3-sdk/10-design-system.md §3`).
- **[CREATE]** `packages/design-system/scripts/validate-metadata.mjs` — validador CI (schema drift, classificação de tokens com suporte a brace expansion, anti-patterns). (Citação: `docs/caderno-3-sdk/10-design-system.md §3`).
- **[UPDATE]** `packages/design-system/package.json` — atualizar scripts `"build:index"` para usar `scripts/build-index.mjs` e `"validate"` para usar `scripts/validate-metadata.mjs`.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** `vitest` (Node.js/TypeScript)
- [ ] **Métricas/Cobertura:** Mínimo de 7 casos de teste bem cobertos nos 2 arquivos de teste
- [ ] **Ambiente do Teste:** Node.js puro (sem browser)
- [ ] **Arquivos de Teste a serem criados:**
  - **[CREATE]** `packages/design-system/tests/metadata-types.test.ts` (testes de compilação de tipos)
  - **[CREATE]** `packages/design-system/tests/metadata-scripts.test.ts` (testes de comportamento do validador e build-index)
- [ ] **Fora de Escopo:** Metadados reais dos componentes a serem conformados na T-DS-03; integração ou chamada a agentes de IA em runtime.

### Casos de Teste (numerados)
1. **Compilação e Exportação de Tipos:** O arquivo `types.ts` deve compilar sem erros via `tsc --noEmit`. Todas as 10 interfaces (`ComponentIdentity`, `Usage`, `AntiPatterns`, `Variants`, `Composition`, `Behavior`, `Props`, `TokenUsage`, `Accessibility`, `AIHints`) e o helper `defineMetadata` devem ser exportados corretamente e não conter tipos `any`/`unknown` implícitos.
2. **Geração Correta do Índice (Conteúdo e Estrutura):** Rodar `node scripts/build-index.mjs` deve varrer com sucesso todos os arquivos `src/components/*/*.metadata.ts` e gerar o arquivo `src/metadata/components.index.json` contendo a contagem de componentes, data de geração e a lista de metadados leves (com campos header: `name`, `category`, `type`, `description`, `path`, `metadataPath`, `priority`, `keywords`, `useCases`, `variants`, `requiredProps`, `parentConstraints`, `forbiddenParents`, `lastUpdated`, `metadataVersion`).
3. **Ordenação do Índice por Prioridade e Nome:** O array de componentes no índice gerado deve ser ordenado de forma determinística: primeiro por prioridade (`high` -> `medium` -> `low`) e depois alfabeticamente pelo nome do componente.
4. **Filtro de Deprecated de AI Hints:** Se um componente tiver `status: 'deprecated'` em seu metadado, a geração do índice deve excluir ou suprimir suas propriedades de descoberta das `aiHints` no arquivo `components.index.json` (ou omitir os campos de descoberta), garantindo que agentes não os propõem para telas novas. (Citação: `docs/caderno-3-sdk/10-design-system.md §3`).
5. **Validação de Drift de Schema (Campos Obrigatórios):** O script `validate-metadata.mjs` deve detectar e falhar (exit code = 1) se um arquivo de metadados omitir campos obrigatórios definidos no schema (ex.: se `component.path` ou `usage.antiPatterns` estiver ausente).
6. **Validação Completa de Anti-patterns:** O validador deve falhar (exit code = 1) se encontrar qualquer anti-pattern que não contenha exatamente os três campos obrigatórios: `scenario`, `reason`, e `alternative`.
7. **Validação Cruzada de Tokens (Semantic e Theme):** O validador deve detectar se `tokens.semantic` or `tokens.theme` de um componente referenciarem tokens inexistentes em `tokens/semantics/components.json` or `tokens/themes/*.json` (incluindo o suporte correto para expansão de chaves/braces como `component.button.height.{sm,md,lg}`) e falhar com exit code = 1.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use nomes de scripts ou caminhos de metadados diferentes dos definidos na Seção 3.
> - **NÃO** crie o índice leve `components.index.json` como um arquivo estático modificado manualmente. Ele deve ser 100% autogerado pelo script `build-index.mjs`.
> - **NÃO** permitir que o validador passe com sucesso se houver referência a tokens que não existem nos arquivos JSON de tokens compilados (invariante do princípio "token layer leads").
> - **NÃO** use importações relativas de fora do pacote de design-system nas validações ou tipagens.
> - **NÃO** remova ou desative os testes de tokens e componentes já existentes no pacote; garanta que a execução rode toda a suíte de testes.

### Pegadinhas conhecidas
- **Propriedades de Ciclo de Vida ausentes no Schema:** O RAG §3 exige que `ComponentIdentity` inclua `status: 'stable' | 'deprecated'`, `replacedBy?` e `deprecatedSince?`. Se esses campos não forem adicionados em `schema.ts`, a compilação ou validação dos metadados falhará.
- **Tokens duplicados ou não classificados:** Se a validação não resolver corretamente expansões como `component.button.height.{sm,md,lg}`, ela acusará falsos positivos em tokens válidos ou deixará passar tokens inválidos.
- **Mapeamento incorreto de scripts em package.json:** O build de tokens raiz em turborepo depende de `build:index`. Mapear incorretamente impede o pipeline global de passar.

### 📄 TEMPLATES OBRIGATÓRIOS (Contratos de Tipagem de Metadados)
`packages/design-system/src/metadata/types.ts`:
```typescript
import {
  ComponentIdentity,
  Usage,
  AntiPattern,
  Variants,
  Composition,
  Behavior,
  Props,
  TokenUsage,
  Accessibility,
  AIHints,
  ComponentCategory,
  ComponentType,
  UsagePattern,
  VariantAxis,
  Slot,
  InteractionState,
  PropSpec,
  Example,
  ComponentMetadata
} from './schema.ts';

export type {
  ComponentIdentity,
  Usage,
  AntiPattern,
  Variants,
  Composition,
  Behavior,
  Props,
  TokenUsage,
  Accessibility,
  AIHints,
  ComponentCategory,
  ComponentType,
  UsagePattern,
  VariantAxis,
  Slot,
  InteractionState,
  PropSpec,
  Example,
  ComponentMetadata
};

export type AntiPatterns = AntiPattern[];
```

#### Passos para Implementação
1. **[TDD]** Crie os arquivos de testes unitários `packages/design-system/tests/metadata-types.test.ts` e `packages/design-system/tests/metadata-scripts.test.ts` implementando as validações descritas na Seção 4.
2. Atualize o arquivo `packages/design-system/src/metadata/schema.ts` para incluir os campos de ciclo de vida (`status: 'stable' | 'deprecated'`, `replacedBy?`, `deprecatedSince?`) na interface `ComponentIdentity`. (Citação: `docs/caderno-3-sdk/10-design-system.md §3`).
3. Crie `packages/design-system/src/metadata/types.ts` com o conteúdo definido no template obrigatório.
4. Crie/atualize o script `packages/design-system/scripts/build-index.mjs` de modo que ele varra `src/components/*/*.metadata.ts` dinamicamente, gere o índice ordenado e realize a filtragem de `aiHints` para componentes com `status: 'deprecated'`.
5. Crie/atualize `packages/design-system/scripts/validate-metadata.mjs` para validar o schema, drift, anti-patterns de 3 campos obrigatórios e cross-check de tokens com suporte para expansão de chaves.
6. Atualize as dependências e scripts no `packages/design-system/package.json` para que as tarefas `"build:index"` e `"validate"` apontem para os scripts corretos e utilizem a flag `--experimental-strip-types`.
7. Execute o pipeline de verificação completo:
   `pnpm install && pnpm --filter @plataforma/design-system build:index && pnpm --filter @plataforma/design-system validate && pnpm --filter @plataforma/design-system test && pnpm --filter @plataforma/design-system lint`
   Resolva qualquer inconformidade até obter Exit Code 0 em todos os comandos.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **ESPECIFICAÇÃO ENDURECIDA E ALINHADA.**
> - **Divergências resolvidas:** A interface `ComponentIdentity` foi estendida para suportar as propriedades de ciclo de vida (`status: 'stable' | 'deprecated'`, `replacedBy?`, `deprecatedSince?`) conforme o RAG `10-design-system.md §3`, alinhando a especificação ao design-system canônico do Nexus.
> - **Exclusão de AI Hints em componentes deprecated:** Adicionado caso de teste e passo explícito de filtragem no gerador de índice para mitigar riscos de descoberta errônea por agentes de IA.
> - **Garantias de Evidência:** O pipeline de CI agora cobra explicitamente a validação de tipos, schema drift, consistência de anti-patterns de 3 campos e cross-check rigoroso de tokens semânticos e de temas (com suporte de expansão bash-like).

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node puro) e os novos testes de metadados passam?
- [ ] Linter (`pnpm lint`) não acusa problemas em nenhum dos arquivos criados/modificados?
- [ ] A compilação TypeScript (`pnpm run typecheck`) passa sem erros?
- [ ] A implementação respeita a Regra do Que Não Fazer?
- [ ] O index `components.index.json` é auto-gerado e ordenado com os campos corretos e com filtragem de deprecated?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/design-system build:index # gera components.index.json
pnpm --filter @plataforma/design-system validate    # validate-metadata.mjs — schema + cross-check
pnpm --filter @plataforma/design-system typecheck   # verifica compilação dos tipos
pnpm --filter @plataforma/design-system test        # roda toda a suíte de testes do vitest
pnpm --filter @plataforma/design-system lint        # garante limpeza do código
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
- **[2026-07-18T11:09]** - *gemini* - `[Endurecido]`: endureceu spec
- **[2026-07-18T11:09]** - *system* - `[Auto-promovida]`: deps todas done
