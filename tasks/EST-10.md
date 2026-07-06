---
id: EST-10
title: "plugin-providers: registry direto + fallback/circuit-breaker + scoring 9-fatores + telemetria interna (absorve EST-11)"
status: draft:placeholder
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: []
capacity_target: # a fixar no endurecimento — candidata a decompor (complexidade 5)
---

# EST-10 · plugin-providers (registry + fallback/scoring, extração OmniRoute)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-providers/`. **Candidata a decompor** (complexidade 5):
  fatiar em (a) registry+move do que já existe (ORQ-09b), (b) fallback em tiers/circuit-breaker,
  (c) scoring multi-fator. **NÃO roda o OmniRoute como serviço** — só extrai o mecanismo, medido
  na bancada primeiro (RFC-018 C3).

## 1. Objetivo
Mover o registry de provider direto (`resolveModel`, `createOpenAICompatible` — ORQ-09b) e
acrescentar **fallback em tiers + circuit-breaker/cooldown por modelo + scoring multi-fator
(9 sinais: saúde, cota, custo, latência, freshness etc.)** — mecanismo extraído do OmniRoute
(MIT), **sem subir o serviço standing dele** (RFC-018 D3/C1). Protocolo continua HTTP OpenAI-
compatible — cobre cloud (deepseek, openrouter) E modelo local via servidor tipo Ollama/LM Studio,
sem mecanismo novo (é troca de `baseURL`). Crush/opencode migram para consumir este plugin (C4).

> **ABSORVEU EST-11 (2026-07-05, RFC-018 §6.4):** telemetria de custo/uso/latência NÃO é plugin
> próprio — só existia para alimentar o scoring daqui, e o scoring só existe por causa dela: é UMA
> capacidade. Vira **módulo interno** `src/telemetry.*` deste plugin (sem fronteira de host no
> meio). A UI de custo (EST-14) consome a API de consulta exposta por ESTE plugin.

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (C1, C2, C3, C4) e **§6.4 (merge do telemetry)** + §6.5
      (providers = plugin categoria `connector` classe E, vai pela porta de rede MEDIADA do host —
      nunca fetch direto).
- [ ] `tools/orchestrator/src/agentAdapter.mjs` (ORQ-09b) — `resolveModel`/`PROVIDERS` a mover como base.
- [ ] `tasks/orquestrador.config.json` — roster atual por nível, ponto de fusão com os tiers novos.
- [ ] **`docs/_vendor/OmniRoute/`** (clone raso local, MIT) — fonte REAL do mecanismo de
      fallback/scoring a extrair; no endurecimento, citar os arquivos exatos dentro do vendor
      (não URL de GitHub). Não instalar/rodar o serviço deles.
- [ ] `tools/scripts/ledger.mjs` — precedente de agregação custo/ator no MGTIA (referência de forma p/ o módulo telemetry).
- [ ] `[[project_headroom_integration]]` — confirma que nenhuma superfície fica órfã (proxy Headroom morre de vez, C4).

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-providers/src/registry.*` — movido/adaptado do ORQ-09b.
- **[CREATE]** `packages/plugin-providers/src/fallback.*` — tiers + circuit-breaker/cooldown.
- **[CREATE]** `packages/plugin-providers/src/telemetry.*` — módulo interno (ex-EST-11): coleta por chamada, agregação por provider/janela, API de consulta (scoring interno + view de custo da UI).
- **[CREATE]** `packages/plugin-providers/src/scoring.*` — os 9 fatores, consumindo `telemetry.*` interno.

## 4. Estratégia de Testes
- [ ] Registry: resolve provider corretamente (herdado do ORQ-09b). Fallback: provider que falha N vezes entra em cooldown, próximo do mesmo nível assume. Scoring: com dados fake de telemetria, escolhe o provider correto.

## 5. Instruções de Execução
1. Mover registry como está.
2. Fallback em tiers primeiro (mais simples, valor direto).
3. Scoring depois (depende de EST-11 para dados reais; pode usar fake até lá).
4. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 C1-C4. **Antes de portar qualquer claim numérico do OmniRoute
  (ex.: eficácia do scoring), medir na bancada própria** (C3) — não copiar número de marketing.

## 7. Definition of Done (DoD)
- [ ] Registry movido e funcional?
- [ ] Fallback em tiers com circuit-breaker testado?
- [ ] Scoring multi-fator funcional (com dados reais ou fake)?
- [ ] Crush/opencode apontam para este plugin, não para proxy standing?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-providers test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
