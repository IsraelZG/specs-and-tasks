---
id: ORQ-09
title: "VercelAgentAdapter + harness de tools (implements AgentAdapter, multi-provider, loop in-process)"
status: done
complexity: 7
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-08"] # o ADR do spike fixa tool set, sandbox, provider registry, protocolo de evento
subtasks: ["ORQ-09a", "ORQ-09b"]
blocks: ["ORQ-09a", "ORQ-09b", "ORQ-10", "ORQ-11"]
capacity_target: N/A
---

# ORQ-09 · VercelAgentAdapter + harness de tools

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. **Tarefa de TOOLING do CONTROLE (Docs)** — implemente direto no Docs,
  persista via `fila.mjs`. Identidade = modelo real.
- **⚠️ Depende de ORQ-08 (spike).** NÃO endurecer nem executar antes do ADR `0008` estar `done`:
  as assinaturas de tools, o sandbox de bash e o registry de provider vêm de lá. Endurecer agora
  seria inventar o que o spike ainda vai decidir (por isso `spec_status: draft`).

## 1. Objetivo
Implementar a versão de **produção** do que o PoC da ORQ-08 provou: `VercelAgentAdapter` que
**implements `AgentAdapter`** (a interface de T-1022 — `run(opts): Promise<AgentRunResult>`), rodando
o loop de agente **in-process** com Vercel AI SDK, com o **harness completo de tools** e o **registry
multi-provider direto** (sem Headroom). É o motor que substitui o `CommandAdapter`/Crush. Não religa
o `orquestrar.mjs` (isso é ORQ-11) nem entrega o painel/kill (ORQ-10) — entrega o adapter + tools
consumíveis e testados isoladamente.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] **`docs/adr/0008-agent-adapter-in-process.md` (ORQ-08)** — FONTE CANÔNICA: tool set + assinaturas
      (Decisão A), sandbox/gating do bash (Decisão B), provider registry (Decisão C), critério de
      término/timeout (Decisão E). Este endurecimento COPIA as assinaturas de lá, não reinventa.
- [ ] `apps/nexus-backend/src/runner/agent-adapter.ts` (T-1022) — a interface `AgentAdapter`/
      `AgentRunOptions`/`AgentRunResult` que este adapter implementa (o contrato NÃO muda aqui; o
      `onEvent` extra é ORQ-10).
- [ ] [ORQ-04](./ORQ-04.md) — `assemblePrompt(action,id,model)` a reusar para montar o prompt do agente.
- [ ] `tasks/orquestrador.config.json` + `.env` — nomes de provider/model e chaves.

## 3. Escopo de Arquivos (Inputs e Outputs)
> **A endurecer JIT (pós-ORQ-08)** — paths/assinaturas exatos saem do ADR. Esboço:
- **[CREATE]** `tools/orchestrator/src/vercelAgentAdapter.*` — `class VercelAgentAdapter implements AgentAdapter`.
- **[CREATE]** `tools/orchestrator/src/tools/*` — o harness (readFile, writeFile, editFile, glob, grep, bash, …) por schema Zod (Decisão A).
- **[CREATE]** `tools/orchestrator/src/providers.*` — registry `provider/model` → AI SDK provider direto (Decisão C).
- **[CREATE]** testes do adapter + de cada tool (bash gating, cwd travado, timeout).
- **[CREATE]** `tools/orchestrator/package.json` — deps `ai`, `@ai-sdk/*`, `zod` (se ORQ-08 não criou).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] Cada tool testada isolada: readFile/writeFile roundtrip; bash respeita allowlist/timeout/cwd
      (Decisão B); grep/glob retornam o esperado.
- [ ] `VercelAgentAdapter.run()` com provider FAKE (sem gastar $): loop chama tools na ordem, respeita
      timeout, retorna `AgentRunResult` compatível com T-1022. Um teste com provider real barato
      (marcado, opt-in) roda 1 task trivial.
- [ ] **Fora de escopo:** stream pro painel/kill (ORQ-10); religar o dispatcher (ORQ-11).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:** NÃO reinvente as assinaturas — copie do ADR 0008. NÃO roteie por Headroom. NÃO
> religue o `orquestrar.mjs`. NÃO deixe o bash sem o gating decidido na Decisão B. NÃO rode git no Docs.
1. Endurecer JIT (pós-ORQ-08): trocar os esboços da §3 pelas assinaturas reais do ADR.
2. **[TDD]** tools primeiro (com o gating de bash), depois o adapter com provider fake.
3. Provider registry direto. Gate → §8 → enfileira.

## 6. Feedback de Especificação (Spec Feedback Loop)
- Decisões estruturais estão no ADR 0008 (ORQ-08). Se algo lá ficou ambíguo ao endurecer, PARE e
  volte pro spike — não improvise assinatura de produção.

> **DECOMPOSTA (endurecimento, 2026-07-03).** `complexity: 7` excedia o limiar que exige quebra
> (CLAUDE.md, regra de Dimensionamento — "5 exige quebra"). Fatiada nos seams naturais dos próprios
> arquivos do PoC provado em ORQ-08:
> - **[ORQ-09a](./ORQ-09a.md)** — harness de tools (readFile/writeFile/bash, gating) — porta
>   `tools.poc.mjs`. `hardened`, sonnet, complexity 3.
> - **[ORQ-09b](./ORQ-09b.md)** — `VercelAgentAdapter` (`run()` + registry de provider real) —
>   porta `agent-adapter.poc.mjs`, consome ORQ-09a. `hardened`, sonnet, complexity 4.
>
> **Achado registrado em ORQ-09b §1:** o texto original desta task ("implements `AgentAdapter`" de
> T-1022) estava impreciso — a interface de T-1022 pertence ao Nexus **congelado**
> (`apps/nexus-backend`) e seu `AgentRunOptions` não carrega `model`/`prompt`, que é o que o
> `orquestrar.mjs` **vivo** realmente passa. ORQ-09b reusa o `AgentRunResult` de T-1022 (mesmo
> shape) mas define `VercelAgentRunOptions` próprio — ver correção completa em ORQ-09b §1.
>
> **Gap registrado (não bloqueante, escalado ao arquiteto em ORQ-09b §6):** cobertura de provider
> só para os prefixos `deepseek`/`opencode-go-ent`/`opencode-zen-ent` (níveis `haiku`+`sonnet` do
> roster). Nível `opus` (`anthropic/claude-opus-4-8`) e `vision` (`aihubmix`/`gemini`) sem
> baseURL/chave direta confirmada no repo — decisão do arquiteto se/quando destravar.
>
> Esta task-casca não é executada — ORQ-10/ORQ-11 continuam referenciando `ORQ-09` em
> `dependencies:` (padrão do repo, ver T-505/T-505a/T-505b). Isso resolve de verdade: o
> `TaskService.transition()` tem o side-effect `parentAutoClose` (T-1029, `done`) — quando **todas**
> as filhas de `subtasks:` chegam a `done` via `approve`, o pai é fechado (`→ done`)
> automaticamente. Quando ORQ-09a e ORQ-09b terminarem, `ORQ-09` fecha sozinha e `ledger.mjs`/
> `orquestrar.mjs` veem `deps_ok:true` pra ORQ-10/ORQ-11 sem intervenção manual.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `VercelAgentAdapter implements AgentAdapter` (contrato de T-1022 intacto)?
- [ ] Harness de tools completo, cada tool com o gating/sandbox da Decisão B do ADR?
- [ ] Provider multi-modelo direto (sem Headroom), casando os nomes do roster?
- [ ] Testes: tools isoladas + adapter com provider fake verdes; 1 task real (opt-in) rodou?
- [ ] **[gate de acoplamento]** deps npm novas isoladas no pacote do orchestrator (não vazam pro Docs dep-free)?

### Verificação automática *(a fixar no endurecimento — comandos exatos do pacote orchestrator)*
```bash
# ex.: pnpm --filter @plataforma/orchestrator test   (path real vem do ADR 0008)
```
> **GATE DE EVIDÊNCIA:** saída literal de build+test colada na §8.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
(cole aqui a saída real de build e test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:28:59]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:decomposed → status:draft:decomposed
- **[2026-07-03T19:04]** - *system* - `[Reconciliado]`: status restaurado de draft:placeholder para done (drift corrigido)
