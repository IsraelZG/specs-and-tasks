---
id: T-PL-09
title: "adapter agent-browser como plugin de automacao web"
status: draft:triaged
complexity: 4
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-1038", "T-PL-01", "T-PL-03"]
blocks: []
capacity_target: sonnet
---

# T-PL-09 · Adapter `agent-browser` como plugin de automação web

## 1. Objetivo
Integrar o CLI `agent-browser` como plugin Node de automação web com sessão efêmera, allowlist de
domínios e política de ações. O agente recebe snapshots acessíveis e refs determinísticos; não ganha
navegação, credenciais, clipboard, download ou JavaScript arbitrários por default.

## 2. Contexto RAG
- `tasks/T-1038.md`, `tasks/T-PL-01.md` e `tasks/T-PL-03.md` — archetype, manifesto e sandbox.
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §6 — capacidade concedida e privacidade.
- [agent-browser README fixado](https://github.com/vercel-labs/agent-browser/blob/ce68e2c23012c90d5265d49899656c12b971c378/README.md) — instalação local pinada,
  `snapshot --json`, refs, `--allowed-domains`, `--action-policy` e servidor MCP opcional.

### Snapshot upstream auditado
- Commit [`ce68e2c`](https://github.com/vercel-labs/agent-browser/tree/ce68e2c23012c90d5265d49899656c12b971c378),
  package v0.31.2. O [`package.json`](https://github.com/vercel-labs/agent-browser/blob/ce68e2c23012c90d5265d49899656c12b971c378/package.json)
  exige Node `>=24` e pnpm `>=11`, incompatíveis com o baseline Node 20 do SuperApp.
- [`cli/src/commands.rs`](https://github.com/vercel-labs/agent-browser/blob/ce68e2c23012c90d5265d49899656c12b971c378/cli/src/commands.rs)
  é a referência de comandos; [`cli/src/native/snapshot.rs`](https://github.com/vercel-labs/agent-browser/blob/ce68e2c23012c90d5265d49899656c12b971c378/cli/src/native/snapshot.rs)
  implementa snapshots/refs; [`cli/src/doctor/security.rs`](https://github.com/vercel-labs/agent-browser/blob/ce68e2c23012c90d5265d49899656c12b971c378/cli/src/doctor/security.rs)
  é referência para checks de segurança.

## 3. Escopo previsto
- Adicionar `agent-browser` como dependência **local pinada** do pacote de plugin; nunca usar
  instalação global ou config do usuário.
- Criar adapter que inicia sessão/perfil temporário por execução e converte a capacidade concedida
  em `--allowed-domains`, política de ações e limite de output.
- Expor só `open`, `snapshot --json`, leitura e interações por ref inicialmente; `eval`, clipboard,
  download/upload, headers/credenciais, plugins e persistência de auth ficam negados por default.
- Usar o CLI/MCP interno apenas como subprocesso do sandbox; não expor o daemon à rede nem criar UI.
- **Fora de escopo:** substituição de Playwright, login real, captura de dados privados e instalação
  automática do Chrome fora do fluxo explícito de desenvolvimento/CI.

## 4. Estratégia de Testes prevista
- Fixture HTTP local com domínio permitido e domínio bloqueado.
- Adapter gera allowlist/política e rejeita ação sem capacidade antes de invocar o CLI.
- `snapshot --json` retorna refs utilizáveis; navegação para domínio não permitido falha.
- Smoke controlado com Chrome instalado explicitamente prova `open → snapshot → click por ref`.
- Logs, erros e artefatos não contêm cookies, headers, credenciais ou perfil persistente.

## 5. Gate de endurecimento JIT
Após T-1038/T-PL-01/T-PL-03, fixe o path do pacote, a forma do manifesto e as assinaturas da porta.
Confirme versão, binário suportado e flags pela documentação oficial da versão pinada; não assuma
que o CLI ou Chrome exista na máquina. Se Windows ARM64 não passar no smoke, pause com a evidência.
Antes de endurecer, resolver explicitamente uma das duas rotas: (a) sidecar/subprocesso isolado com
runtime Node 24 compatível; ou (b) release anterior compatível com Node 20 cuja allowlist não possua
as correções de segurança regressadas. Não baixar silenciosamente o requisito de runtime nem pinçar
uma versão antiga sem auditar as correções posteriores de allowlist/WebRTC.

## 6. Feedback de Especificação
Task triada: as dependências definem os contratos internos. A política de ações precisa ser um
artefato versionado do plugin, nunca configuração global do usuário.

## 9. Log de Execução
> Registre transições somente via `manage-task.mjs`.
- **[2026-07-14T00:49]** - *gpt-5* - `[Triado]`: triado: adapter agent-browser aguarda archetype, manifesto e sandbox
