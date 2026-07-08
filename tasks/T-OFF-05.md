---
id: T-OFF-05
title: "editores de midia (imagem/video/audio) como componente/ui plugin + IA via compute"
status: draft:triaged
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-OFF-01", "T-IA-02"] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: sonnet
---

# T-OFF-05 · editores de midia (imagem/video/audio) como componente/ui plugin + IA via compute

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar editores de mídia (imagem/canvas, vídeo/timeline, áudio) como componentes/ui plugins reutilizáveis,
com integração de IA via compute (remover fundo, upscale, transcode, transcrição). Fonte: `caderno-3-sdk/27-suite-office.md §5`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/office/src/media-editors.ts

export interface MediaEditorProps {
  /** URL ou entity_id do asset de mídia. */
  source: string;
  /** Se true, habilita ferramentas de IA (compute). */
  aiEnabled?: boolean;
  /** Callback ao exportar/salvar resultado. */
  onSave?: (result: Uint8Array, mimeType: string) => Promise<void>;
}

export interface ImageEditorRef {
  /** Aplica filtro/transformação. */
  applyFilter(filter: ImageFilter): void;
  /** Remove fundo (via compute IA). */
  removeBackground(): Promise<void>;
  /** Upscale (via compute IA). */
  upscale(factor: 2 | 4): Promise<void>;
  /** Adiciona texto sobre imagem. */
  addTextOverlay(text: string, position: { x: number; y: number }): void;
  /** Exporta resultado. */
  export(mimeType: "image/png" | "image/jpeg" | "image/webp"): Promise<Uint8Array>;
}

export type ImageFilter = "grayscale" | "sepia" | "blur" | "sharpen" | "brightness" | "contrast";

export interface VideoEditorRef {
  /** Corta vídeo entre start e end (segundos). */
  trim(startSec: number, endSec: number): void;
  /** Adiciona legenda (via transcrição IA). */
  addCaptions(): Promise<void>;
  /** Adiciona texto/overlay em frame específico. */
  addOverlay(text: string, atSec: number): void;
  /** Transcode (via compute). */
  transcode(format: "mp4" | "webm", quality?: "low" | "medium" | "high"): Promise<void>;
}

export interface AudioEditorRef {
  /** Denoise (via compute IA). */
  denoise(): Promise<void>;
  /** Transcreve áudio para texto. */
  transcribe(): Promise<string>;
  /** Corta áudio entre start e end. */
  trim(startSec: number, endSec: number): void;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §B12](../docs/mecanica-de-telas.md) — editor de mídia em overlay fullscreen (padrão validado no mockup B12); operações de IA via compute mostram etapa real de progresso e resultado como **proposta com aceitar/editar** (atribuição de agente — diretrizes-ux §3, mesma mecânica do §A5).
- [caderno-3-sdk/27-suite-office.md](../docs/caderno-3-sdk/27-suite-office.md) §5 — Editores de mídia (imagem, vídeo, áudio)
- [caderno-3-sdk/27-suite-office.md](../docs/caderno-3-sdk/27-suite-office.md) §7 — Session-locks para camadas/objetos arrastáveis
- [[perfil-de-capacidade]] — Editores de mídia são componentes/ui plugins registrados no motor de páginas

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/27-suite-office.md` §5, §7, §8
- **[READ]** `packages/page-engine/src/capacity-profile.ts` — (T-OFF-01)
- **[CREATE]** `packages/office/src/media-editors.tsx` — componentes React (ImageEditor, VideoEditor, AudioEditor)
- **[CREATE]** `packages/office/src/image-editor.tsx` — editor de imagem com canvas
- **[CREATE]** `packages/office/src/video-editor.tsx` — editor de vídeo com timeline
- **[CREATE]** `packages/office/src/audio-editor.tsx` — editor de áudio com waveform
- **[CREATE]** `packages/office/src/media-compute.ts` — stubs de compute (delega a T-IA-02)
- **[CREATE]** `packages/office/tests/media-editors.test.tsx` — RTL + canvas mock
- **[CREATE]** `packages/office/e2e/media-editors.spec.ts` — Playwright
- **[UPDATE]** `packages/office/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** RTL (JSDOM) com canvas mock; Playwright para E2E.
- [x] **Ambiente do Teste:** JSDOM para componentes; headless Chromium para E2E.
- [x] **Fora de Escopo:** Implementação real de IA (T-IA-02) — stubs bastam. Processamento real de vídeo 4K (§8.1: depende de hardware). Session-locks efêmeros (T-MOD-03).

Casos de teste (numerados):
1. ImageEditor renderiza canvas com imagem carregada.
2. `applyFilter("grayscale")` modifica pixels do canvas (verificar mudança).
3. `addTextOverlay("Hello", { x: 10, y: 10 })` renderiza texto no canvas.
4. `removeBackground()` chama stub de compute e retorna Promise.
5. VideoEditor exibe timeline; `trim(5, 30)` ajusta range.
6. AudioEditor exibe waveform; `transcribe()` retorna texto stub.
7. Playwright: carregar imagem, aplicar filtro, adicionar texto, exportar PNG.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente IA do zero — use stubs que delegam a T-IA-02 (compute). A interface é a mesma; o stub retorna dados mock.
> - **NÃO** bloqueie a main thread com processamento de mídia — operações pesadas (transcode, upscale) vão para worker ou fila compute.
> - **NÃO** crie mecânica nova de IA — todos os editores usam o mesmo paradigma compute (local/peer/external/fila) de T-IA-02 (§5.4).

### Pegadinhas conhecidas
- **Canvas em JSDOM:** JSDOM não tem Canvas API completa. Use `jest-canvas-mock` ou similar para testes unitários. Playwright cobre o comportamento real.
- **Compute é assíncrono e pode falhar:** operações de IA (removeBackground, upscale, transcode) são async e podem retornar erro se o backend compute não estiver disponível. Exiba estado de loading e erro, nunca trave a UI.
- **Mídia pesada degrada (§8.1):** edição de vídeo 4K ou 3D depende do hardware. Se detectar dispositivo fraco (mobile antigo), desabilite ferramentas pesadas e mostre aviso.

1. **[TDD]** Crie `packages/office/tests/media-editors.test.tsx` com casos 1–6 (RTL + canvas mock).
2. Implemente `packages/office/src/media-editors.tsx` com as interfaces.
3. Implemente `packages/office/src/image-editor.tsx` com canvas, filtros, texto, export.
4. Implemente `packages/office/src/video-editor.tsx` com timeline, trim, overlay.
5. Implemente `packages/office/src/audio-editor.tsx` com waveform, trim, denoise/transcribe stubs.
6. Implemente `packages/office/src/media-compute.ts` com stubs que delegam a T-IA-02.
7. Adicione Playwright E2E (caso 7) em `packages/office/e2e/media-editors.spec.ts`.
8. Re-exporte em `packages/office/src/index.ts`.
9. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência. Compute delegado a T-IA-02; stubs bastam para esta task.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] ImageEditor, VideoEditor, AudioEditor implementados como componentes React reutilizáveis?
- [ ] Operações de IA (removeBackground, upscale, transcode, denoise, transcribe) delegam a compute stub?
- [ ] Canvas filtros e overlays funcionam?
- [ ] Video timeline com trim?
- [ ] Audio waveform com denoise/transcribe stubs?
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
