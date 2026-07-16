---
id: T-PL-08
title: "cliente LSP como plugin com capacidades concedidas"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-1038", "T-PL-01", "T-PL-03"]
blocks: []
capacity_target: sonnet
---

# T-PL-08 · Cliente LSP como plugin com capacidades concedidas

## 1. Objetivo
Implementar um archetype de **cliente** LSP que consulte linguagem/símbolos por workspace e
capacidade declarados, sem conceder ao processo do agente acesso irrestrito ao filesystem ou ao
executável do language server.

## 2. Contexto RAG
- `tasks/T-1038.md` — archetype LSP e fronteira plugin/ferramenta MGTIA.
- `tasks/T-PL-01.md` e `tasks/T-PL-03.md` — manifesto e sandbox Node.
- `docs/playbook/06-ferramentas-lsp-mcp.md` — LSP como ferramenta de desenvolvimento, distinta do
  cliente de plataforma.
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6 — capacidades e privacidade.

## 3. Escopo previsto
- Criar o adapter LSP no local que as dependências definirem.
- Declarar linguagem, raiz de workspace, comandos/protocolo e métodos permitidos no manifesto.
- Cobrir `initialize`, documento/símbolo permitido, erro de servidor, raiz fora do escopo e pedido
  de método não declarado.
- **Fora de escopo:** editor UI, instalação automática de language servers, execução livre de shell,
  indexação/RAG e alterações no protocolo LSP.

### Snapshot upstream de referência
- `microsoft/vscode-languageserver-node` commit
  [`a760573`](https://github.com/microsoft/vscode-languageserver-node/tree/a7605732a9d0e5f2598ed2e4051119209589bb22).
- [`jsonrpc/src/node/main.ts`](https://github.com/microsoft/vscode-languageserver-node/blob/a7605732a9d0e5f2598ed2e4051119209589bb22/jsonrpc/src/node/main.ts)
  exporta `StreamMessageReader`, `StreamMessageWriter` e `createMessageConnection` para transporte Node.
- [`protocol/src/common/protocol.ts`](https://github.com/microsoft/vscode-languageserver-node/blob/a7605732a9d0e5f2598ed2e4051119209589bb22/protocol/src/common/protocol.ts)
  contém os request/notification types do protocolo.
- Preferir `vscode-jsonrpc` + `vscode-languageserver-protocol`; `vscode-languageclient` é acoplado à
  extensão VS Code e não deve entrar no runtime do SuperApp.

## 4. Gate de endurecimento JIT
T-1038/T-PL-01/T-PL-03 devem estar `done` antes de fixar tipos, paths ou processo. A API LSP e a
versão do cliente escolhida exigem fonte oficial da versão pinada; não usar assinaturas lembradas.
O teste anti-fake deve subir um fixture LSP real por streams, completar `initialize/initialized` e
enviar ao menos um request tipado; mock de função direta não prova framing/cancelamento/teardown.

## 5. Definition of Done futura
- Cliente só enxerga raízes e métodos declarados.
- Falha do servidor não vaza path/conteúdo restrito.
- Fixture LSP local prova inicialização, consulta autorizada e negação de escopo.

## 6. Feedback de Especificação
Task triada deliberadamente: o contrato executável será derivado das dependências, não criado pelo
executor.

## 9. Log de Execução
> Registre transições somente via `manage-task.mjs`.
- **[2026-07-14T00:48]** - *gpt-5* - `[Triado]`: triado: cliente LSP aguarda archetype, manifesto e sandbox
