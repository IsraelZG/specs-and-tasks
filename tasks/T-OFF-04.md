---
id: T-OFF-04
title: "apresentacao perfil slide + export PDF/PPTX"
status: draft:triaged
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-OFF-01", "T-PG-01"] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
---

# T-OFF-04 · apresentacao perfil slide + export PDF/PPTX

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar editor de apresentações (perfil `slide`) sobre o mesmo motor de páginas, com export para PDF/PPTX
via conversores. Fonte: `caderno-3-sdk/27-suite-office.md §4`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/office/src/presentation.ts

export interface SlideData {
  id: string;
  /** Componentes do slide (mesmo formato SPEC:PAGE). */
  components: Array<{ type: string; [key: string]: unknown }>;
  /** Notas do apresentador (não visíveis na projeção). */
  speakerNotes?: string;
  /** Transição (opcional). */
  transition?: "none" | "fade" | "slide_left" | "slide_right" | "zoom";
}

export interface PresentationData {
  title: string;
  slides: SlideData[];
  /** Proporção (16:9 default). */
  aspectRatio: "16:9" | "4:3" | "16:10";
}

export interface PresentationEditor {
  getData(): PresentationData;
  addSlide(index?: number): void;
  removeSlide(slideId: string): void;
  moveSlide(fromIndex: number, toIndex: number): void;
  updateSlide(slideId: string, components: SlideData["components"]): void;
  /** Modo apresentação (tela cheia, navegação por setas). */
  enterPresentationMode(): void;
  exitPresentationMode(): void;
}

export interface ExportConverter {
  /** Exporta apresentação para PDF (buffer). */
  toPdf(data: PresentationData): Promise<Uint8Array>;
  /** Exporta apresentação para PPTX (buffer). */
  toPptx(data: PresentationData): Promise<Uint8Array>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/27-suite-office.md](../docs/caderno-3-sdk/27-suite-office.md) §4 — Apresentações (SPEC:PAGE perfil slide, mesmo motor)
- [caderno-3-sdk/27-suite-office.md](../docs/caderno-3-sdk/27-suite-office.md) §7 — Export é conversor, não formato proprietário
- [[perfil-de-capacidade]] — Perfil `slide` define whitelist de componentes para apresentação

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/27-suite-office.md` §4, §7, §8
- **[READ]** `packages/page-engine/src/capacity-profile.ts` — perfil `slide` (T-OFF-01)
- **[CREATE]** `packages/office/src/presentation.tsx` — PresentationEditor React
- **[CREATE]** `packages/office/src/slide-canvas.tsx` — renderizador de slide individual
- **[CREATE]** `packages/office/src/export-converter.ts` — ExportConverter (PDF/PPTX)
- **[CREATE]** `packages/office/tests/presentation.test.tsx` — testes RTL
- **[CREATE]** `packages/office/e2e/presentation.spec.ts` — Playwright
- **[UPDATE]** `packages/office/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** RTL (JSDOM) para editor; Playwright para E2E; Vitest para conversor.
- [x] **Ambiente do Teste:** JSDOM para componentes; Chromium para E2E; Node para export.
- [x] **Fora de Escopo:** Fidelidade total de export PPTX para recursos proprietários Office (§8.2: best-effort). Templates (T-OFF-06 se existir).

Casos de teste (numerados):
1. `addSlide()` incrementa número de slides; `removeSlide(id)` remove.
2. `moveSlide(0, 2)` reordena slides corretamente.
3. `updateSlide(id, newComponents)` atualiza componentes; `getData()` reflete mudança.
4. `enterPresentationMode()` renderiza slide atual em tela cheia; setas navegam entre slides.
5. `ExportConverter.toPdf(data)` retorna `Uint8Array` não-vazio.
6. `ExportConverter.toPptx(data)` retorna `Uint8Array` não-vazio.
7. Perfil `slide` rejeita componente não-listado na whitelist.
8. Playwright: criar 3 slides, navegar no modo apresentação, exportar PDF.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie engine de slides separada — apresentação é SPEC:PAGE com perfil `slide` (§4: "mesmo motor; export para PDF/PPTX por conversor no final").
> - **NÃO** salve em formato proprietário — o formato nativo é SPEC:PAGE (JSON no grafo). PDF/PPTX são export, não save.
> - **NÃO** prometa fidelidade total na exportação PPTX (§8.2: conversão best-effort).

### Pegadinhas conhecidas
- **Slide é página com restrições:** cada slide é renderizado pelo mesmo PageEngine de T-PG-01, mas o validador de perfil `slide` restringe os componentes. Não crie um renderizador de slide separado.
- **Export é assíncrono e pesado:** `toPdf` e `toPptx` podem demorar para apresentações grandes. Rode em worker ou mostre progresso. Para PDF, use biblioteca como `pdf-lib` ou `jsPDF`; para PPTX, use `pptxgenjs`.
- **Modo apresentação ≠ editor:** `enterPresentationMode` é tela cheia com navegação por teclado; `exitPresentationMode` volta ao editor com timeline de slides. São dois estados do mesmo componente.

1. **[TDD]** Crie `packages/office/tests/presentation.test.tsx` com casos 1–4, 7 (RTL).
2. Implemente `packages/office/src/presentation.tsx` e `packages/office/src/slide-canvas.tsx`.
3. Implemente `packages/office/src/export-converter.ts` com toPdf/toPptx (use bibliotecas existentes: pdf-lib, pptxgenjs).
4. Adicione Playwright E2E (caso 8) em `packages/office/e2e/presentation.spec.ts`.
5. Re-exporte em `packages/office/src/index.ts`.
6. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] PresentationEditor usa perfil `slide` do motor de páginas (não engine separada)?
- [ ] add/remove/move/update slide funcionam?
- [ ] Modo apresentação (tela cheia + navegação por setas)?
- [ ] Export PDF e PPTX produzem buffers não-vazios?
- [ ] `pnpm test` verde? Playwright E2E passa?

### Verificação automática
```bash
pnpm --filter @plataforma/office build
pnpm --filter @plataforma/office test
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

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
