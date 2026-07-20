---
id: EST-61
title: "Onda D: plugin-terminal (node-pty) - comandos fg/bg, logs continuos, matriz de risco HITL"
status: draft:hardened
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [EST-60]
blocks: [EST-62]
capacity_target: sonnet
ui: true
---

# EST-61 · Onda D: Terminal PTY no Chat

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-61`.
- **Máquina alvo:** Windows 11 ARM64 (ver spike §5).

## 1. Objetivo
Implementar a RFC-019 §3.4: `@plataforma/plugin-terminal` (durável) com PTY real (`node-pty`) —
`run_command(command, run_in_background)` (fg retorna `{exit, stdout_tail}`; bg retorna `{pid}`),
`read_terminal_logs(pid, offset?)` (ring buffer 1000 linhas) e `kill_process(pid)`. Herda o gating
do BashPort (cwd-lock no workspace da conversa, anti-git-no-Docs); comando fora da allowlist deixa
de ser bloqueio duro e vira **HITL** (matriz de risco completa da RFC-019 §3.6).

## 2. Contexto RAG
- [RFC-019 §3.4 e §3.6](../docs/rfcs/rfc-019-chat-agentico.md) — tools, ring buffer, matriz de risco.
- `apps/estaleiro/core/src/ports/bash.ts` — gating existente (allowlist, timeout, cwd-lock, windowsHide, anti-git-no-Docs) a HERDAR — a política mora na porta, o PTY é só o executor.
- `apps/estaleiro/ui/src/views/fleet/hooks.ts` (fleetStore `stream`, ring buffer) — padrão a reusar para os logs de PTY na view Terminal.
- `apps/estaleiro/ui/src/views/terminal/AgentTerminal.tsx` — view que passa a renderizar também streams de PTY do chat.

### ✅ SPIKE RESOLVIDO no endurecimento (2026-07-19, máquina alvo real)
**`node-pty` FUNCIONA em Windows 11 ARM64 nativo** — validado por execução real:
`npm install node-pty` instalou prebuild sem compilação (2s, 0 vulnerabilities);
spawn+write+read confirmados com o snippet abaixo (saída: `arch: arm64 | platform: win32` /
`spawn+write+read: FUNCIONA` / 531 bytes recebidos). O fallback child_process NÃO é necessário.

```js
// snippet validado (usar como base do executor):
import pty from "node-pty";
const p = pty.spawn("powershell.exe", [], { name: "xterm-color", cols: 80, rows: 24, cwd, env });
p.onData((chunk) => buffer.push(chunk));   // stream contínuo — alimenta o ring buffer
p.write("comando\r");                       // interatividade real (y/n funciona)
p.onExit(({ exitCode }) => ...);
p.kill();
```
API relevante (node-pty ^1.x): `spawn(shell, args, {name, cols, rows, cwd, env})` → `IPty` com
`onData`/`onExit`/`write`/`resize`/`kill`/`pid`.

## 3. Escopo de Arquivos (outline)
- **[CREATE]** `packages/plugin-terminal/` — pacote durável: executor PTY (ou fallback), registry de processos bg (pid→buffer), tools AI-SDK.
- **[UPDATE]** `chat-agent-service.ts` — injeta terminal-tools com HITL wrapper (matriz de risco: `rm|del|rmdir`, `git reset|push --force|checkout --`, `sudo`, install global).
- **[UPDATE]** `ChatView.tsx` — bloco de output estilo terminal na transcrição, badge de processo bg.
- **[UPDATE]** view Terminal — streams de PTY do chat via mesmo fleetStore.

## 4. Estratégia de Testes
- Unit: registry de processos, ring buffer, parser da matriz de risco (cada padrão da matriz → risky=true; `pnpm test` → risky=false).
- Integração: run_command fg com comando real inofensivo (`node -e "console.log(1)"`), bg + read_terminal_logs + kill.
- **E2E (obrigatório):** "rode <comando allowlisted> e resuma" → output na transcrição; comando da matriz de risco → card de aprovação; rejeitar → LLM recebe denied.
- **Reuso headless (INVIOLÁVEL):** terminal-tools injetáveis no `createAgentRuntime` sem UI (teste de integração).

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO contornar a allowlist/matriz do BashPort — a política é da porta; o plugin executa.
> - NÃO deixar processo bg órfão no shutdown (kill all no dispose do serviço).
> - NÃO bufferizar stdout ilimitado (ring 1000 linhas, igual fleetStore).

## 7. Definition of Done
- [ ] **Demo executável (gate da onda D):** "rode pnpm test e resuma o resultado" (fg) E "suba o dev server e me avise quando estiver pronto" (bg + leitura de log) E comando arriscado → aprovação. Evidência na §8.
- [ ] Resultado do spike node-pty ARM64 registrado na §8 (funcionou ou fallback ativado).
- [ ] Gate completo allGreen.

### Verificação automática
```bash
pnpm gate @plataforma/estaleiro
pnpm --filter @plataforma/plugin-terminal build && pnpm --filter @plataforma/plugin-terminal test && pnpm --filter @plataforma/plugin-terminal lint
```

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-20T00:19]** - *claude-fable-5* - `[Triado]`: triagem RFC-019: onda com escopo/deps/capacidade definidos; endurecimento profundo just-in-time
- **[2026-07-20T00:39]** - *claude-fable-5* - `[Endurecido]`: endurecida: APIs verificadas na fonte (vendor cline/mcp-sdk/playwright-mcp/ts-language-server + node_modules ai v7), spike node-pty ARM64 resolvido por execucao real, decisoes fechadas (SDK 1.x estavel, HITL nativo needsApproval, upload PUT binario)
