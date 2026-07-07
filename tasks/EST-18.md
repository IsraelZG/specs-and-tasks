---
id: EST-18
title: "Extração seletiva de provedores apikey-estáticos do OmniRoute para o plugin-providers (uso sem sidecar)"
status: draft:triaged
complexity: 2
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-10a", "EST-17"]
blocks: []
capacity_target: haiku
---

# EST-18 · Extração seletiva de provedores (gatilhada)

## 0. Ambiente de Execução Obrigatório
- **Task-gatilho (deliberadamente adiada — NÃO endurecer antes do gatilho disparar).** Parte
  "extrair depois" da decisão híbrida da emenda D3 (RFC-018 §2, 2026-07-06).

## 1. Objetivo
Quando a frota precisar de um provedor específico SEM depender do sidecar OmniRoute (EST-17),
extrair a entrada dele — **um a um, sob demanda** — do catálogo do vendor para o nosso
`PROVIDERS`, na mesma forma `{baseURL, apiKeyEnv}`.

## 2. Contexto RAG
- [ ] `docs/_vendor/OmniRoute/open-sse/config/providers/` — o catálogo real; extrair SÓ entradas
      `authType: "apikey"` com endpoint estático (as OAuth/session exigem broker de credenciais —
      fora de escopo, é o motivo de o sidecar existir).
- [ ] `docs/_vendor/OmniRoute/docs/reference/PROVIDER_PLUGIN_MANIFEST.md` — o próprio upstream
      define o contrato "sidecar-eligible = apikey + endpoint estático + executor default"; nossa
      régua de elegibilidade é a mesma.
- [ ] `packages/plugin-providers/src/registry.ts` — destino.

## 5. Gatilhos de ativação (qualquer um dispara o endurecimento)
1. O produto (superapp) precisa de um provedor em runtime onde o sidecar não existe.
2. O sidecar mostrou-se instável/oneroso para um provedor de uso diário da frota.
3. O operador quer aposentar o sidecar mantendo ≥1 provedor grátis específico.

**Regra de extração:** cada provedor extraído cita o arquivo exato do vendor de onde a URL veio
(padrão CITE-OU-ESCALE — nunca URL de memória; lição EST-10a, providers inventados na spec).

## 6. Feedback de Especificação
- Placeholder proposital. Endurecer JIT só quando um gatilho da §5 disparar, nomeando o(s)
  provedor(es) concreto(s).

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
- **[2026-07-07T00:09]** - *claude-fable* - `[Triado]`: triada: task-gatilho de extracao seletiva apikey-estaticos; endurecer SO quando gatilho da §5 disparar
