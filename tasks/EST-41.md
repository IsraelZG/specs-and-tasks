---
id: EST-41
title: "P1: composition root e API de prova de provider"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-40"]
blocks: ["EST-42", "EST-43"]
capacity_target: sonnet
---

# EST-41 · P1: composition root e API de prova de provider

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-41`.
- **Prioridade:** P1 — provar conexão, sem montar contexto, tools ou agentes.
- **Runtime:** Node.js 22+ · pnpm · Vitest · HTTP.

## 1. Objetivo
Conectar a factory híbrida de EST-40 ao host e oferecer uma prova mínima de invocação de modelo.
O operador deve listar configurações redigidas e enviar um prompt curto a um rosterName explícito,
recebendo texto, provider/modelo e latência. Essa API será o único caminho de prova usado pela UI
e pelo gate real de EST-43.

## 2. Contexto RAG
- `docs/especificacao-estaleiro.md` §1 item 1 e §5.5.
- `tasks/EST-22.md` (rotas 1:1 e composition root) e `tasks/EST-40.md`.
- `apps/estaleiro/server.mjs`, `apps/estaleiro/core/src/bootstrap.ts`.
- `packages/plugin-providers/src/index.ts`.
- API oficial da função de geração da versão instalada de `ai` — Context7 ou source instalado.

## 3. Escopo de Arquivos
- **[CREATE]** serviço mínimo de probe no `apps/estaleiro/core/src/` ou no pacote providers se o
  ownership real assim exigir no endurecimento.
- **[UPDATE]** `apps/estaleiro/core/src/bootstrap.ts` e tipos exportados.
- **[UPDATE]** `apps/estaleiro/server.mjs` — composition root injeta factory/config.
- **[UPDATE]** `apps/estaleiro/package.json`, core/package.json, standalone script e lockfile
  somente para dependências runtime realmente consumidas.
- **[UPDATE]** testes core e integração.
- **[NO CHANGE]** TaskService lifecycle, workflowOptions, fs-tools, agent harness e UI.

## 4. Contrato-alvo a endurecer
```ts
interface ProviderProbeRequest {
  rosterName: string;
  prompt: string;
  timeoutMs?: number;
}

interface ProviderProbeResult {
  provider: string;
  model: string;
  text: string;
  latencyMs: number;
}
```

Rotas propostas:
- `GET /api/providers` → metadata redigida (`provider`, `kind`, `configured`), nunca segredo.
- `POST /api/providers/probe` → `ProviderProbeResult` ou erro estável 4xx/5xx.

## 5. Estratégia e Instruções
1. Testar serviço com factory/modelo injetado, sem rede.
2. Limitar prompt e timeout no trust boundary.
3. Propagar abort/timeout; não deixar request pendurada.
4. Mapear provider desconhecido, chave ausente, local offline e erro upstream sem vazar segredo.
5. Provar que o standalone contém todas as dependências runtime novas.

> **NÃO FAZER:**
> - NÃO usar `createAgentRuntime`, tools, workflows ou dispatcher para um probe simples.
> - NÃO criar segundo registry no servidor.
> - NÃO aceitar provider/baseURL arbitrário vindo do body; use configuração autorizada.
> - NÃO persistir prompt/resposta nesta prioridade.
> - NÃO tratar stub como gate de produto; EST-43 fará a chamada real.

## 6. Feedback de Especificação
- O contrato TS é do nosso módulo e pode ser decidido no endurecimento. A chamada à biblioteca
  externa deve ser citada com versão e assinatura verificadas antes de `harden`.

## 7. Definition of Done
- [ ] Lista pública redigida e probe possuem erros estáveis.
- [ ] Probe usa a factory única de EST-40.
- [ ] Sem acesso a task, skill, RAG, tool ou agent harness.
- [ ] Standalone executa o endpoint com dependency closure completa.

```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
pnpm --filter @plataforma/estaleiro test:integration
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

- **[2026-07-13T17:21]** - *gpt-5* - `[Triado]`: P1: probe no composition root
