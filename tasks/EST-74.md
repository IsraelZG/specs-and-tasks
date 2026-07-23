---
id: EST-74
title: "plugin-file-sanitizer: Ingestão, sanitização de código/scripts e chunking de arquivos grandes"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-64"]
blocks: []
capacity_target: sonnet
test_profile: backend
---

# EST-74 · plugin-file-sanitizer: Ingestão, sanitização e chunking de arquivos de código

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-74`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Vitest.
- **Capacidade-alvo:** sonnet (validação de magic bytes, sanitização de script/HTML/SVG, stream chunking e proteção de segurança).

## 1. Objetivo
Criar o pacote durável `@plataforma/plugin-file-sanitizer` responsável por permitir que os agentes no Chat e em workflows recebam arquivos de código, scripts e documentos grandes com segurança total contra execução maliciosa, stored XSS, falsificação de extensões e estouro de contexto:
1. **Validação por Magic Bytes:** Utiliza `file-type` para verificar a assinatura de bytes real e impedir falsificação de extensão (ex: `.php.jpg`, executáveis mascarados).
2. **Sanitização de Script / HTML / SVG:** Utiliza `isomorphic-dompurify` / `jsdom` para remover tags `<script>`, atributos de evento (`onload`, `onerror`) e esquemas `javascript:` em arquivos recebidos.
3. **Chunking de Arquivos Grandes:** Leitura em streaming com divisão por janelas (*chunks* de 50KB-100KB) e offsets numéricos para o agente inspecionar código grande sem estourar o contexto do modelo.
4. **Proteção de Path Traversal & Zip Bombs:** Limpeza estrita de filenames e limites de tamanho em streams.

## 2. Contexto RAG
- [RFC-019 §3.8](../docs/rfcs/rfc-019-chat-agentico.md) — Anexos e armazenamento seguro.
- EST-64 — Upload de anexos no Chat e `attachment-store.ts`.
- Práticas de Segurança Node.js — Validação por Magic Bytes (`file-type`) e Sanitização XSS (`isomorphic-dompurify`).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** `packages/plugin-file-sanitizer/package.json`.
- **[CREATE]** `packages/plugin-file-sanitizer/tsconfig.json`.
- **[CREATE]** `packages/plugin-file-sanitizer/src/magicBytesValidator.ts` — validação de tipo de arquivo por assinatura de bytes real (`file-type`).
- **[CREATE]** `packages/plugin-file-sanitizer/src/codeSanitizer.ts` — sanitização de scripts, tags perigosas em HTML/SVG e validação de nomes de arquivos.
- **[CREATE]** `packages/plugin-file-sanitizer/src/largeFileChunker.ts` — leitura e indexação por chunks/offset para arquivos grandes.
- **[CREATE]** `packages/plugin-file-sanitizer/src/tools/sanitizerTools.ts` — exportação das AI SDK Tools `sanitize_code_file` e `read_file_chunk`.
- **[CREATE]** `packages/plugin-file-sanitizer/src/index.ts`.
- **[CREATE]** `packages/plugin-file-sanitizer/tests/fileSanitizer.test.ts` — suíte de testes de validação por magic bytes, sanitização XSS e chunking.

## 4. Estratégia de Testes Estrita
1. **Verificação de Magic Bytes:** Um arquivo executável `.exe` ou script `.php` renomeado para `.txt` ou `.jpg` é detectado pela assinatura de bytes e recusado com erro de validação.
2. **Sanitização de XSS/Script:** Um arquivo SVG ou HTML contendo `<script>alert(1)</script>` ou `onerror="..."` é limpo, preservando a estrutura de código válida e removendo os seletores maliciosos.
3. **Chunking de Arquivos Grandes:** Um arquivo de código de 5MB é dividido em chunks ordenados por offset, permitindo ao leitor consumir o trecho `[0..50000]` e buscar o próximo offset.
4. **Proteção contra Path Traversal:** Nomes contendo `../../etc/passwd` são limpos para basenames seguros.

## 5. Não fazer
- NÃO salvar ou aceitar arquivos executáveis ou binários não declarados.
- NÃO carregar arquivos grandes inteiros em memória síncrona sem streaming.

## 6. Feedback de Especificação
- Spec triada para atender ao requisito de ingestão segura de códigos/arquivos pelo agente.

## 7. Gate por Comando
```bash
pnpm gate @plataforma/plugin-file-sanitizer --profile backend
```

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-23T14:43]** - *gemini-3.6-flash* - `[Triado]`: Spec criada para sanitização por magic bytes e chunking de arquivos grandes.
