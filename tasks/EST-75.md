---
id: EST-75
title: "plugin-doc-ocr: Parsing estruturado de documentos (PDFs, Office) e OCR multimodal de imagens"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-08", "EST-63", "EST-64"]
blocks: []
capacity_target: sonnet
test_profile: backend
---

# EST-75 · plugin-doc-ocr: Parsing de documentos e OCR multimodal local

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-75`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Vitest.
- **Capacidade-alvo:** sonnet (parsing de PDFs/Office para Markdown e OCR multimodal local).

## 1. Objetivo
Criar o pacote durável `@plataforma/plugin-doc-ocr` responsável por fornecer aos agentes ferramentas dedicadas de parsing estruturado de documentos e OCR com suporte a motores locais especializados:
1. **Parsing de Documentos para Markdown:** Converte PDFs nativos digitais, DOCX e planilhas/tabelas em Markdown limpo e estruturado (via `markitdown-ts` / `pdf-parse`).
2. **Motor de OCR Local Híbrido (Leve & IA Especializada):**
   - *Tier Leve:* `tesseract.js` (engine WASM/TypeScript puro para OCR rápido sem binários de SO).
   - *Tier IA Especializada Local:* Suporte a modelos neurais de OCR locais e de visão avançada via `@plataforma/plugin-local-inference` (ONNX / ONNXRuntime com **GOT-OCR 2.0** / **PaddleOCR v4**) ou via sidecar VLM local (ex: **Qwen2.5-VL 2B** / **GOT-OCR2.0** rodando em Ollama / local inference).
3. **Tools para o Agente:** Registra as AI SDK Tools `parse_document_to_markdown` e `ocr_extract_text` consumíveis tanto pelo Chat quanto por workflows DMM.

## 2. Contexto RAG
- [RFC-019 §3.7 e §3.8](../docs/rfcs/rfc-019-chat-agentico.md) — Capacidades multimodais e anexos.
- EST-08 — `plugin-local-inference` (substrato ONNX Runtime in-process).
- EST-63 / EST-64 — Ingestão de anexos e content-parts de imagem.
- Tecnologias recomendadas: `markitdown-ts` / `pdf-parse`, `tesseract.js` (WASM), GOT-OCR 2.0 / PaddleOCR (via ONNX runtime in-process) e Qwen2.5-VL / GOT-OCR2 via local VLM inference.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-doc-ocr/package.json`.
- **[CREATE]** `packages/plugin-doc-ocr/tsconfig.json`.
- **[CREATE]** `packages/plugin-doc-ocr/src/documentParser.ts` — conversão de PDFs digitais e documentos Office para Markdown.
- **[CREATE]** `packages/plugin-doc-ocr/src/ocrEngine.ts` — motor de OCR híbrido (Tesseract.js WASM + adaptador ONNX/VLM local para GOT-OCR 2.0 / PaddleOCR).
- **[CREATE]** `packages/plugin-doc-ocr/src/tools/ocrTools.ts` — exportação das AI SDK Tools `parse_document_to_markdown` e `ocr_extract_text`.
- **[CREATE]** `packages/plugin-doc-ocr/src/index.ts`.
- **[CREATE]** `packages/plugin-doc-ocr/tests/docOcr.test.ts` — suíte de testes de extração de texto em PDF digital e OCR em imagem de teste.

## 4. Estratégia de Testes Estrita
1. **Parsing de PDF Digital:** Um arquivo PDF com formato texto e tabelas é convertido em Markdown estruturado preservando títulos e cabeçalhos.
2. **OCR em Imagem (Tier Leve):** Uma imagem PNG contendo texto renderizado é processada pelo `ocrEngine` (Tesseract.js) e o texto extraído é retornado com nível de confiança.
3. **OCR via IA Local (Tier Especializado):** Invocação do `ocrEngine` com provedor local ONNX/VLM (ex.: GOT-OCR 2.0 / PaddleOCR) para interpretar tabelas/fórmulas de imagem.

## 5. Não fazer
- NÃO travar a thread principal em processamentos pesados (executar OCR em worker/async).

## 6. Feedback de Especificação
- Spec triada para implementar as ferramentas de OCR e parsing de documentos com suporte a IA local especializada.

## 7. Gate por Comando
```bash
pnpm gate @plataforma/plugin-doc-ocr --profile backend
```

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-


### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-23T14:43]** - *gemini-3.6-flash* - `[Triado]`: Spec criada para parsing de documentos e OCR via Tesseract.js WASM.
