---
id: DMM-06
title: "Templates de workflow por Tipagem Dinâmica (grafos JDM editáveis)"
status: done
complexity: 3
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-02","DMM-03","DMM-04","DMM-05"]
blocks: ["DMM-09"]
capacity_target: sonnet
---

# DMM-06 · Templates de workflow por Tipagem Dinâmica (JDM)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Montar os **grafos JDM** associados a **Tipos Dinâmicos de Task**. Em vez de um fluxo monolítico, o sistema suporta múltiplos templates que encadeiam estágios (ex: Ingress → Architect → Explorer → Editor) de formas variadas dependendo do tipo da task (ex: *Refatoração Larga, Fix Rápido*). O modelo (Architect ou nó de triagem inicial) classifica a task e roteia para o workflow correto. Os templates são editáveis na UI (DMM-10).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `docs/adr/0013-delegacao-multimodelo-declarativa.md` §Decisões Fechadas.
- [ ] DMM-02…05 — os 4 nós que este grafo encadeia.
- [ ] `packages/plugin-workflows/src/**` — formato de grafo/template persistido.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugin-zen-engine/src/types.ts` (contrato do `WorkflowDefinition`) e `packages/plugin-workflows/src/orchestrator.ts` (para os stubs).
- **[CREATE]** `packages/plugin-workflows/src/templates/dmm-default.json`: Grafo JDM cru (formato do `@gorules/zen-engine`) definindo os caminhos entre Ingress, Architect, Explorer e Editor.
- **[CREATE]** `packages/plugin-workflows/src/templates/index.ts`: Empacota e exporta o JSON como um objeto `WorkflowDefinition`.
- **[UPDATE]** `packages/plugin-workflows/src/index.ts`: Re-exporta os templates.
- **[CREATE]** `packages/plugin-workflows/test/dmm-template.test.ts`: Arquivo de teste de fluxo.

## 4. Estratégia de Testes Estrita
- Vitest: `describe("DMM Template JDM")`.
- **Casos Enumerados:**
  1. **Inicialização:** Motor carrega `dmm-default.json` com Envelope inicial vazio; a decisão devolve `next: 'plugin-ingress'`.
  2. **Fluxo Padrão (Full):** Envelope simulando saída do Ingress → decisão devolve `next: 'plugin-architect'`. Saída do Architect → `plugin-explorer`. Saída do Explorer → `plugin-editor`.
  3. **Desvio (Fast Fix):** Envelope simulando saída do Ingress indicando *tipo=fast-fix*; a decisão pula Architect/Explorer e devolve `next: 'plugin-editor'`.
- **Fora de Escopo:** execução com modelos reais (tudo é stub do `HandlerMap` retornando Deltas fakes).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** duplicar lógica dos nós — o template só **referencia/encadeia** DMM-02…05.
> - **NÃO** tornar o grafo imutável — é editável (é um default, não um hardcode).

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação

### Decisões Arquiteturais Fechadas (Endurecimento JIT, 2026-07-09)
1. **Formato e Localização:** O template JDM será criado em `packages/plugin-workflows/src/templates/dmm-default.json`. Este arquivo conterá o JSON puro no formato esperado pelo motor JDM (`@gorules/zen-engine`, cuja interface está em `packages/plugin-zen-engine/src/types.ts`). A tipagem será exportada como `WorkflowDefinition`.
2. **Encadeamento via HandlerMap:** O template não detém lógica TypeScript nem dependências diretas de pacotes, ele apenas aponta para strings puras (`plugin-ingress`, `plugin-architect`, etc.) que o Orchestrator (DMM-01) despachará via DI.

### Classificação (pass-2)
- **Status:** `draft:hardened`
- **Motivo:** Dependências (DMM-02 a 05) já estão `done`. Casos de teste end-to-end e caminhos de arquivo foram estritamente definidos na Seção 3 e 4. Nenhuma abstração pendente. Pronta para `ready`.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Template default encadeia os 4 estágios e roda end-to-end (stub) verde.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-workflows test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- [2026-07-09T18:14] deepseek: Template JDM dmm-default (decisionTable 7 regras, Ingress→Architect→Explorer→Editor + fast-fix skip). Templates empacotados em WorkflowDefinition. 3 testes cobrem init, full-flow, fast-fix. pnpm --filter @plataforma/plugin-workflows test verde (26/26).

### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**
- [ ] **Requer Refatoração**

- **Evidência de Execução (obrigatória):**
  ```
  $ pnpm --filter @plataforma/plugin-workflows test   → Test Files 6 passed · Tests 26 passed (3 novos dmm-template)
  $ pnpm --filter @plataforma/plugin-workflows exec tsc --noEmit  → exit 0, 0 erros
  $ pnpm --filter @plataforma/plugin-workflows lint              → exit 0, 0 erros
  ```
  Logs brutos em `.dmm06-evidence/{tsc,lint,test}.log`.

- **Validação do Escopo §3:**
  - [CREATE] `packages/plugin-workflows/src/templates/dmm-default.json` ✓ (81 linhas, decisionTableNode com 7 regras + input/output nodes + 2 edges)
  - [CREATE] `packages/plugin-workflows/src/templates/index.ts` ✓ (readFileSync + factory `createDmmDefaultTemplate` + export `DMM_DEFAULT_TEMPLATE`)
  - [UPDATE] `packages/plugin-workflows/src/index.ts:34` ✓ (re-exporta `createDmmDefaultTemplate, DMM_DEFAULT_TEMPLATE`)
  - [CREATE] `packages/plugin-workflows/test/dmm-template.test.ts` ✓ (3 cenários + HandlerMap stubs)
  - [READ] `packages/plugin-zen-engine/src/types.ts` ✓ (importa `WorkflowDefinition`)
  - [READ] `packages/plugin-workflows/src/orchestrator.ts` ✓ (usa `runWorkflow` + `createInMemoryQueue`)

- **Validação dos 3 Casos §4 (rastreio do JDM contra o teste):**
  - **Caso 1 (Init) — `dmm-default.json:23-27` r1** dispara em envelope vazio (`hasIngress==false`) e devolve `"plugin-ingress"`. Teste 1 (l. 57-63) cobre exatamente isso. ✓
  - **Caso 2 (Full Flow) — r4/r5/r6** disparam em sequência após r1. Teste 2 (l. 65-75) executa o `runWorkflow` end-to-end e verifica que o envelope final tem `hasIngress, hasArchitect, hasExplorer, hasEditor = true` (todos os 4 estágios completaram). r7 (`1==1`) é o terminal catch-all. ✓
  - **Caso 3 (Fast Fix) — r2** dispara quando `taskType=="fast-fix"` e `hasEditor==false` (após Ingress), pulando Architect e Explorer. r3 fecha o fast-fix (terminal). Teste 3 (l. 77-91) prova que `hasArchitect` e `hasExplorer` ficam `undefined` (handlers não foram chamados) e `hasEditor=true` (handler `plugin-editor` rodou direto). ✓

- **Gate de acoplamento (regra 5.1):** `plugin-workflows → plugin-zen-engine` (l. 4 de `templates/index.ts`) é a direção canônica: o `plugin-zen-engine` é o **dono do tipo `WorkflowDefinition`**, `plugin-workflows` apenas o **consome** para empacotar o template. Verifiquei que `plugin-zen-engine` **não** importa nada de `plugin-workflows` (Grep: 0 matches), então não há ciclo. Direta e limpa.

- **Sondas adversariais:**
  - **Caso misto (fast-fix + sem ingress):** envelope `{}` + `taskType=undefined`. r1 dispara → ingress. Após ingress, r2: `null == "fast-fix"` → false (skip). r4 → architect. r5 → explorer. r6 → editor. r7 → terminal. Comportamento: full flow (não fast-fix), que é o correto (a flag fast-fix só vale após o Ingress classificar). ✓
  - **Caso já tem tudo:** envelope `{hasIngress: true, hasArchitect: true, hasExplorer: true, hasEditor: true}`. r1-r6 todas false. r7 → terminal. Comportamento: termina imediatamente. ✓
  - **hitPolicy `first` + r7 catch-all** garante terminação em todos os caminhos (defesa contra decisor em loop). ✓

- **Comentários de Revisão:**
  - **i1 (info positivo).** `dmm-default.json:23,29,35,...` cada regra tem `_id` e `_description` (formato JDM/GoRules para auto-documentação). Bom para edição via UI futura (DMM-10). ✓
  - **i2 (ponytail).** `templates/index.ts:14` hardcoda `createdAt: '2026-07-09T00:00:00.000Z'` — deterministic, bom para tests, mas perde o timestamp real. Como é um "default template" versionado, o timestamp não importa na prática. Não-bloqueante. Track: usar `new Date().toISOString()` no build, ou manter hardcoded como "data de release". Decisão de arquiteto.
  - **i3 (housekeeping).** Teste em `packages/plugin-workflows/test/` enquanto o resto do pacote usa `poc/`. O spec §3 diz `test/dmm-template.test.ts` (segue spec) mas o resto do repo convencionou `poc/`. Não-bloqueante (vitest pega os dois). Track: alinhar convenção no reendurecimento futuro, ou consolidar `poc/ → test/` se for pra valer.
  - **i4 (info positivo).** O template é carregado via `readFileSync(join(__dirname, 'dmm-default.json'))` (l. 7) — não embedded como string. Isso é o desenho certo para "editável": o arquivo pode ser substituído em runtime sem recompilar TS, e a UI do DMM-10 pode ler/escrever o mesmo arquivo. Aderente ao §5 "NÃO tornar o grafo imutável".
  - **i5 (info positivo).** O HandlerMap do teste usa os **nomes exatos** das strings do JDM (`plugin-ingress`, `plugin-architect`, `plugin-explorer`, `plugin-editor`) — provam o contrato de wiring com o Orchestrator (DMM-01). Aderente.
  - **i6 (info positivo).** `templates/index.ts:18` exporta `DMM_DEFAULT_TEMPLATE` como singleton (avaliação lazy do `readFileSync` no module init) e a factory `createDmmDefaultTemplate()` permite re-criar em runtime (ex.: reload após edição). Dois exports cobrem os 2 modos de uso.

- **Veredito:** **APROVADO.** Escopo §3 cumprido integralmente (1 update + 3 creates); os 3 casos do §4 cobertos por testes end-to-end; Gate de Evidência completo (tsc + lint + test verde, 26/26); Gate de acoplamento 5.1 limpo (sem ciclo, direção canônica plugin-workflows → plugin-zen-engine); DoD §7 ("template default encadeia os 4 estágios e roda end-to-end (stub) verde") satisfeito. Pode seguir para `approve` e merge na master.

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T18:38]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-02..05 (acabei de triar) ainda draft; reendurecer JIT após DMM-01→done E DMM-02..05→done
- **[2026-07-09T18:06]** - *Antigravity* - `[Endurecido]`: endureceu spec
- **[2026-07-09T18:06]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-09T18:10]** - *deepseek* - `[Iniciado]`: iniciando implementação
- **[2026-07-09T18:14]** - *deepseek* - `[Finalizado]`: Template JDM dmm-default:
- dmm-default.json: decisionTable com 7 regras: Ingress→Architect→Explorer→Editor + desvio fast-fix
- templates/index.ts: WorkflowDefinition exportável
- test: 3 cenários (init→ingress, full-flow 4 estágios, fast-fix pula arch+explorer→editor)
- @plataforma/plugin-workflows: 26/26 passed (3 novos dmm-template)
- **[2026-07-09T18:26]** - *agile_reviewer:minimax* - `[Em revisão]`: revisando --integrar
- **[2026-07-09T18:30]** - *agile_reviewer:minimax* - `[Parecer emitido]`: APROVADO — escopo §3 integral (1 update + 3 creates), 3 casos §4 cobertos end-to-end, Gate tsc/lint/test verde (26/26), gate de acoplamento 5.1 limpo (sem ciclo, direção canonica plugin-workflows → plugin-zen-engine). Pode seguir para approve+merge.
- **[2026-07-09T18:33]** - *agile_reviewer:minimax* - `[Aprovado]`: Integrado: merge na master (4 files: dmm-default.json + templates/index.ts + dmm-template.test.ts + index.ts update), worktree removida, Gate verde (tsc 0 erros, lint 0 erros, test 26/26). Pendencias i1/i2 (info) anexadas ao ledger; i3/i4/i5 (info positivo) marcadas como resolvidas.
