---
id: EST-38
title: "Fase 0: contrato WebSocket vivo para task:updated"
status: draft:triaged
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-37", "EST-33"]
blocks: ["EST-40", "EST-42"]
capacity_target: sonnet
ui: true
---

# EST-38 · Fase 0: contrato WebSocket vivo para task:updated

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-38`.
- **Runtime:** Node.js 22+ · React 19 · Vitest/JSDOM · Playwright/Chromium.
- **Fase:** reparo de fundação; não acrescentar features de providers.

## 1. Objetivo
Fazer o contrato `task:updated` coincidir entre servidor, tipos TS e cliente; permitir múltiplos
consumidores do WebSocket; provar em browser que uma alteração externa atualiza o Board sem reload.

## 2. Contexto RAG
- `docs/especificacao-estaleiro.md` §2 e §4 (shell e estado visível).
- `docs/playbook/08-recon-arquitetural-adversarial.md` §5, §7 e §10.
- `tasks/EST-22.md`, `tasks/EST-23.md` e `tasks/EST-33.md`.
- **Código real:** `apps/estaleiro/core/src/bootstrap.ts` (`broadcastTaskUpdated`),
  `apps/estaleiro/ui/src/ws/{client,events}.ts`, `ui/src/App.tsx` e
  `ui/src/views/board/hooks.ts`.

## 3. Escopo de Arquivos
- **[UPDATE]** `apps/estaleiro/ui/src/ws/client.ts` — API pública de subscribe/unsubscribe com
  fan-out; preservar connect/disconnect/reconnect.
- **[UPDATE]** `apps/estaleiro/ui/src/ws/events.ts` — `TaskUpdatedEvent` igual ao payload real.
- **[UPDATE]** `apps/estaleiro/ui/src/App.tsx` e/ou `views/board/hooks.ts` — remover cast que grava
  propriedade inexistente; uma única rota clara para atualizar `boardStore`.
- **[UPDATE]** testes unitários do WS/Board.
- **[UPDATE]** `apps/estaleiro/e2e/estaleiro.spec.ts` — cenário de atualização externa real.
- **[NO CHANGE]** formato MGTIA, guards, providers e agent harness.

## 4. Estratégia de Testes
1. Dois subscribers recebem o mesmo evento; unsubscribe remove somente um.
2. Mensagem malformada não derruba conexão nem subscribers seguintes.
3. O tipo e runtime aceitam exatamente `{ type: "task:updated", task }`.
4. Em Playwright, uma chamada HTTP externa transiciona a task e o card muda de coluna sem reload.
5. Reconexão não duplica handlers nem aplica evento duas vezes.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO mutar `(ws as Record<string, unknown>)["onEvent"]`.
> - NÃO criar um segundo WebSocket por view.
> - NÃO alterar o servidor para se adaptar ao tipo TS incorreto.
> - NÃO considerar o update otimista do próprio drag como prova do broadcast.

1. Fixe o contrato do evento a partir de `broadcastTaskUpdated` real.
2. Implemente fan-out público no cliente.
3. Remova o cast/no-op do Board.
4. Prove o caminho servidor → WS → store → DOM com uma transição externa.

## 6. Feedback de Especificação
- Decisão técnica: o servidor já publica a task inteira; manter esse shape evita novo fetch e é o
  contrato canônico desta task.

## 7. Definition of Done
- [ ] Nenhum cast cria API fantasma no WsClient.
- [ ] Atualização externa aparece no Board em Chromium sem reload.
- [ ] Reconnect e unsubscribe estão cobertos.

```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro test:e2e
```

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência:**
```
```

## 9. Log de Execução

- **[2026-07-13T17:21]** - *gpt-5* - `[Triado]`: Fase 0: contrato WS e E2E externo
