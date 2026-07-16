---
id: T-PL-07
title: "cliente MCP como plugin com capacidades concedidas"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-1038", "T-PL-01", "T-PL-03"]
blocks: []
capacity_target: sonnet
---

# T-PL-07 · Cliente MCP como plugin com capacidades concedidas

## 1. Objetivo
Implementar um archetype de **cliente** MCP para que um agente possa consumir ferramentas externas
através do manifesto, sandbox e portas concedidas pela plataforma. Não implementa servidor MCP da
plataforma nem transforma o processo do agente em autoridade de ambiente.

## 2. Contexto RAG
- `tasks/T-1038.md` — archetype MCP, identidade, privacidade e portas.
- `tasks/T-PL-01.md` — manifesto/listagem/assinatura de plugin.
- `tasks/T-PL-03.md` — sandbox Node e capacidades concedidas.
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6 — I/O por contrato, sem autoridade ambiente.

## 3. Escopo previsto
- Criar o pacote/adaptador MCP no local que T-1038 e T-PL-01 tornarem canônico.
- Declarar endpoint/transporte, ferramentas expostas e limites no manifesto; executar somente via
  portas concedidas pelo sandbox Node.
- Cobrir discovery de ferramentas, chamada válida, erro de transporte, schema inválido, endpoint
  fora da allowlist e tentativa de acesso não concedido.
- **Fora de escopo:** servidor MCP, execução de binário arbitrário, credenciais persistentes e UI.

### Snapshot upstream de referência
- SDK TypeScript oficial no commit
  [`e81758c`](https://github.com/modelcontextprotocol/typescript-sdk/tree/e81758caed29f6568ce8873f7f9a3bd65b017d9c).
- Superfície cliente: [`packages/client/src/client/client.ts`](https://github.com/modelcontextprotocol/typescript-sdk/blob/e81758caed29f6568ce8873f7f9a3bd65b017d9c/packages/client/src/client/client.ts)
  (`Client`, discovery e `callTool`).
- Transportes: [`streamableHttp.ts`](https://github.com/modelcontextprotocol/typescript-sdk/blob/e81758caed29f6568ce8873f7f9a3bd65b017d9c/packages/client/src/client/streamableHttp.ts) e
  [`stdio.ts`](https://github.com/modelcontextprotocol/typescript-sdk/blob/e81758caed29f6568ce8873f7f9a3bd65b017d9c/packages/client/src/client/stdio.ts).
- Esse snapshot está no desenvolvimento 2.x alpha; serve para localizar conceitos/paths, **não** é o
  pin de produção. No JIT, escolher release estável oficial compatível e citar seus arquivos equivalentes.

## 4. Gate de endurecimento JIT
Não endurecer antes de T-1038/T-PL-01/T-PL-03 estarem `done`: eles definem paths, manifesto,
`ASSET:ROLE`, classes de privacidade e assinatura da porta. Fixar a versão/API de qualquer SDK MCP
somente pela documentação oficial e versão pinada então instalada.
O teste anti-fake deve importar o `Client`/transporte da dependência resolvida e exercer handshake,
`tools/list` e `tools/call` contra fixture local; mock JSON-RPC isolado não prova integração MCP.

## 5. Definition of Done futura
- Cliente só chama ferramentas declaradas e autorizadas.
- Sandbox bloqueia endpoint/execução fora da capacidade.
- Testes de integração usam servidor MCP fixture local e comprovam redaction de erro/segredo.

## 6. Feedback de Especificação
Task criada em triagem: o contrato concreto pertence às dependências. CITE OU ESCALE no
endurecimento; não inventar um `McpClientPort` antecipado.

## 9. Log de Execução
> Registre transições somente via `manage-task.mjs`.
- **[2026-07-14T00:48]** - *gpt-5* - `[Triado]`: triado: cliente MCP aguarda archetype, manifesto e sandbox
