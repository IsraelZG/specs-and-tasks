---
id: EST-40
title: "P1: configuração híbrida no plugin-providers"
status: draft:triaged
complexity: 3
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-10", "EST-37", "EST-38", "EST-39"]
blocks: ["EST-41"]
capacity_target: sonnet
---

# EST-40 · P1: configuração híbrida no plugin-providers

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-40`.
- **Prioridade:** P1 — Conexões Híbridas. É a primeira capacidade de produto após Fase 0.
- **Runtime:** Node.js 22+ · pnpm · Vitest.

## 1. Objetivo
Evoluir o `plugin-providers` existente para representar providers OpenAI-compatible remotos e
locais sem exigir API key dos locais, mantendo `resolveModel` compatível e criando uma factory
única que será consumida pelo composition root em EST-41.

O pacote deve suportar, no mínimo, as famílias já existentes (`deepseek`, `openrouter`,
`omniroute`) e configuração explícita para Ollama e LM Studio. Endpoints/defaults de terceiros só
podem entrar após verificação em fonte oficial no endurecimento JIT.

## 2. Contexto RAG
- `docs/especificacao-estaleiro.md` §1 item 1, §5.5 e §6.1.
- `docs/playbook/08-recon-arquitetural-adversarial.md` §0, §3, §4 e §10.
- `tasks/EST-10.md`, `EST-10a.md`, `EST-10b.md`, `EST-10c.md` e `EST-18.md`.
- `packages/plugin-providers/src/{registry,fallback,scoring,telemetry}.ts` e `package.json`.
- Fonte oficial da versão instalada de `ai` e do adapter OpenAI-compatible — resolver via
  Context7; se indisponível, consultar source/package instalado e registrar fallback.

## 3. Escopo de Arquivos
- **[UPDATE]** `packages/plugin-providers/src/registry.ts` — distinguir provider remoto/local e
  chave obrigatória/opcional sem quebrar deepseek/openrouter/omniroute.
- **[CREATE/UPDATE]** módulo de factory/config dentro de `packages/plugin-providers/src/`.
- **[UPDATE]** `packages/plugin-providers/src/index.ts`.
- **[UPDATE]** `packages/plugin-providers/package.json` e lockfile somente se a factory exigir
  runtime dependency verificada.
- **[UPDATE]** testes do pacote.
- **[NO CHANGE]** fallback, scoring e telemetria de EST-10 salvo adaptação estritamente tipada.
- **[NO CHANGE]** servidor, UI, workflow, tools e agentes.

## 4. Estratégia de Testes
1. Provider remoto sem env de chave falha mencionando somente o nome da env.
2. Provider local configurado aceita chave ausente.
3. Factory recebe `modelId`, `baseURL` e chave quando aplicável, sem ler segredo fora da env.
4. Overrides de baseURL permitem runtime local customizado sem mutar registry global.
5. Metadata pública nunca contém o valor da chave.
6. Entradas existentes continuam resolvendo exatamente como antes.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO reimplementar circuit breaker, scoring ou TelemetryStore.
> - NÃO inventar assinatura do adapter externo; verificar a versão instalada primeiro.
> - NÃO hardcodar chave, token ou valor de `.env` em código/teste/log.
> - NÃO chamar rede nesta task; o gate real pertence a EST-43.
> - NÃO antecipar contexto, tools, compressão ou agentes.

1. Prove o contrato atual com testes de regressão.
2. Verifique a API externa e registre fonte/versão na spec durante endurecimento.
3. Modele chave opcional para locais e override de endpoint.
4. Exporte uma única factory consumível pelo host.

## 6. Feedback de Especificação
- **Pendente de endurecimento JIT:** nomes exatos dos env vars e defaults oficiais de Ollama/LM
  Studio. Cite fonte oficial ou exija configuração explícita; não use memória.
- EST-18 continua reservado à extração seletiva de providers remotos apikey; não duplicar seu
  propósito nesta task.

## 7. Definition of Done
- [ ] Remotos e locais compartilham uma factory sem afrouxar validação de segredo remoto.
- [ ] Nenhum segredo aparece em metadata/erro/snapshot.
- [ ] EST-10 permanece verde sem duplicação de mecanismo.

```bash
pnpm --filter @plataforma/plugin-providers build
pnpm --filter @plataforma/plugin-providers test
pnpm --filter @plataforma/plugin-providers lint
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

- **[2026-07-13T17:21]** - *gpt-5* - `[Triado]`: P1: factory híbrida; API externa exige endurecimento JIT
