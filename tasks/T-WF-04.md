---
id: T-WF-04
title: "geracao Mermaid + read view na suite office"
status: draft
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-WF-01"]
blocks: []
ui: true
---

# T-WF-04 · geracao Mermaid + read view na suite office

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro para geração de string) + `playwright` (smoke da renderização Mermaid)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Gerar deterministicamente um diagrama Mermaid (`stateDiagram-v2`) a partir de um `SPEC:WORKFLOW` Nível 1. Estados → nós, transições → arestas, guardas → rótulos. A saída é uma string Mermaid que pode ser renderizada pelo componente Mermaid da suíte office. Ressalva honesta: Mermaid é vista/documentação, não modelo — não captura fielmente guardas Zen complexas, compensação e timers.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/24-workflow-reference-spec.md` §8 (exibição via Mermaid, `stateDiagram-v2` ou `flowchart`, ressalva honesta), §6 (Nível 1 → `stateDiagram` direto)
- Enriquecimento: [[spec-workflow]] — a fonte da verdade é o SPEC:WORKFLOW, não o diagrama

### Contratos TS (derivados do RAG §8)

```ts
// --- packages/workflow/src/mermaid.ts ---
import type { WorkflowDocument } from './schema';

export interface MermaidOptions {
  /** Direção do diagrama: LR (left-right) ou TD (top-down). */
  direction?: 'LR' | 'TD';
  /** Incluir guardas como rótulos nas arestas. */
  showGuards?: boolean;
  /** Incluir ações entry/exit como notas. */
  showActions?: boolean;
}

export interface MermaidResult {
  /** String Mermaid stateDiagram-v2 válida. */
  diagram: string;
  /** Avisos sobre elementos não representados (guardas Zen complexas, timers, compensação). */
  warnings: string[];
}

export interface WorkflowMermaidGenerator {
  generate(doc: WorkflowDocument, options?: MermaidOptions): MermaidResult;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/24-workflow-reference-spec.md](../docs/caderno-3-sdk/24-workflow-reference-spec.md) §8 (Mermaid, `stateDiagram-v2`, ressalva honesta), §6 (Nível 1 → `stateDiagram` direto)
- [docs/conceitos/spec-workflow.md](../docs/conceitos/spec-workflow.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/workflow/src/schema.ts` (T-WF-01)
- **[READ]** `docs/caderno-3-sdk/24-workflow-reference-spec.md` §8
- **[CREATE]** `packages/workflow/src/mermaid.ts` — WorkflowMermaidGenerator
- **[CREATE]** `packages/workflow/tests/mermaid.test.ts`
- **[UPDATE]** `packages/workflow/src/index.ts` — re-export

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro — geração de string)
- [x] **Ambiente do Teste:** Node puro
- [x] **Fora de Escopo:** Renderização visual do Mermaid no browser (Playwright smoke apenas para verificar que o componente Mermaid renderiza sem erro)

Casos de teste (numerados):
1. Workflow mínimo (2 estados, 1 transição) → saída Mermaid contém `stateDiagram-v2` e ambos os estados.
2. Transição com guarda → aresta contém rótulo com expressão da guarda.
3. 3 estados com múltiplas transições → todas as transições aparecem.
4. Estado com `entry` action → nota Mermaid com ação documentada (se `showActions: true`).
5. Estado com `exit` action → nota Mermaid com ação documentada (se `showActions: true`).
6. `showGuards: false` → guardas não aparecem nos rótulos.
7. `direction: 'LR'` → saída contém `direction LR`.
8. Estado composto raso (substates) → Mermaid usa sintaxe de estado composto (`state parent { ... }`).
9. Tarefa humana (`human_task`) → estado recebe nota especial `<<human_task>>` ou estereótipo.
10. Sub-workflow por referência → estado com referência recebe nota.
11. Workflow vazio (sem estados) → erro tratado, sem crash.
12. Ressalva honesta: `warnings` contém aviso de que guardas Zen complexas e timers não são fielmente representados.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO implemente edição visual (arrastar nós) — isso é componente de página futuro, não o Mermaid renderer.
> - NÃO tente representar a semântica completa de guardas Zen no diagrama — elas são texto.
> - NÃO renderize o Mermaid no browser (só smoke no Playwright).

### Pegadinhas conhecidas
- O gerador é determinístico: mesmo `WorkflowDocument` → mesma string Mermaid. Ordem dos estados e transições deve ser consistente (ex.: alfabética por nome de estado).
- `stateDiagram-v2` usa `-->` para transições direcionais com rótulo: `EstadoA --> EstadoB : guarda`.
- `warnings` SEMPRE inclui a ressalva honesta (§8.2): "Mermaid é vista, não modelo — guardas Zen, compensação e timers não são fielmente capturados."
- IDs de estado com espaços ou caracteres especiais precisam ser escapados ou colocados entre aspas no Mermaid.

1. **[TDD]** Crie `packages/workflow/tests/mermaid.test.ts` com os 12 casos (RED).
2. Implemente `packages/workflow/src/mermaid.ts` com `generate()`.
3. Atualize `packages/workflow/src/index.ts`.
4. Rode build + test (Seção 7) e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/24-workflow-reference-spec.md` §8 — OK (stateDiagram-v2, ressalva honesta)
- `docs/conceitos/spec-workflow.md` — OK
- `packages/workflow/src/schema.ts` — T-WF-01 (dep)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 12 casos de teste passam?
- [ ] Saída é `stateDiagram-v2` válida (sintaxe Mermaid)?
- [ ] `warnings` contém a ressalva honesta?
- [ ] Gerador é determinístico (mesma entrada → mesma saída)?
- [ ] Workflow vazio não causa crash?

### Verificação automática
```bash
pnpm --filter @plataforma/workflow build
pnpm --filter @plataforma/workflow test
```

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
