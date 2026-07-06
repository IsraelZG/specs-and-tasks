---
id: EST-09
title: "plugin-context: migrar o otimizador do ORQ-13 (crusher+CCR+nano) e acrescentar tier LLMLingua-2 via plugin-local-inference"
status: draft:triaged
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02", "EST-08"]
blocks: []
capacity_target: sonnet # migra ORQ-13 + tier LLMLingua-2 via ORT
---

# EST-09 · plugin-context (move do ORQ-13 + tier LLMLingua-2)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-context/`. Move de código pronto (ORQ-13, quando
  `done` no Docs) + integração nova do tier L2 (RFC-018 E1, ordem confirmada: ORQ-13 como está →
  +LLMLingua-2 → +extração OmniRoute — esta task cobre os dois primeiros degraus).

## 1. Objetivo
Mover o otimizador de contexto (crusher estrutural + CCR store + nano-preprocess — ORQ-13) para
`packages/plugin-context/`, e acrescentar o tier **LLMLingua-2** (ADR-0011: ~250ms/janela, offline,
custo 0, muito melhor que nano em latência) — chamando o `plugin-local-inference` (EST-08) para a
inferência, **não** possuindo a lógica de sessão ORT (RFC-018, nota do diagrama §3: plugin-context
DEPENDE de plugin-local-inference). Inclui também o transform JSON→CSV (E3) como parte do crusher.

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (E1, E3) e §3 (dependência explícita plugin-context → plugin-local-inference).
- [ ] `tasks/ORQ-13.md` — o otimizador a mover (checar status: pode já estar `done` quando esta task rodar).
- [ ] `docs/adr/0009-otimizacao-de-contexto-agent-adapter.md` — ladder original (crusher/nano/CCR).
- [ ] `docs/adr/0011-infra-de-inferencia-local.md` — ladder final revisado (crusher → L2 → nano → CCR) e os números de L2 a preservar.
- [ ] `packages/plugin-local-inference/src/infer.*` (EST-08) — a API de inferência a consumir para o tier L2.
- [ ] **`docs/_vendor/headroom/headroom/transforms/smart_crusher.py`** e
      **`docs/_vendor/OmniRoute/`** (engines RTK/Caveman/relevance) — fonte aberta local p/
      inspiração do crusher e do futuro 3º degrau (RFC-018 §6.6: citar arquivo exato do vendor,
      não URL). O 3º degrau (extração OmniRoute) segue FORA de escopo desta task.

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-context/src/{ccrStore,crusher,optimize}.*` — movido/adaptado do ORQ-13.
- **[UPDATE]** `packages/plugin-context/src/optimize.*` — acrescenta chamada ao tier L2 via plugin-local-inference, na ordem crusher→L2→nano→CCR.
- **[UPDATE]** `crusher.*` — transform JSON→CSV para payloads array-de-dicts (E3).

## 4. Estratégia de Testes
- [ ] Reusar suite do ORQ-13 (stash/retrieve, crusher preserva código, gating por tamanho). Novo: teste do tier L2 chamando plugin-local-inference (fake ou real opt-in), preservando os números do ADR-0011 (não regressão de latência/ratio).

## 5. Instruções de Execução
1. Mover ORQ-13 como está; confirmar testes verdes no novo local.
2. Acrescentar tier L2 (consome EST-08), na ordem do ladder.
3. Acrescentar transform JSON→CSV.
4. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 E1/E3. A extração de session-dedup/relevance do OmniRoute (3º degrau
  do E1) é FORA de escopo desta task — fica para task futura após bancada própria (C3, RFC-018).

## 7. Definition of Done (DoD)
- [ ] ORQ-13 movido, suite original verde?
- [ ] Tier L2 integrado via plugin-local-inference (não runtime próprio)?
- [ ] JSON→CSV como transform do crusher?
- [ ] Ladder na ordem crusher→L2→nano→CCR?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-context test
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
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — plugin-context move ORQ-13 + L2, capacity=sonnet, depende de EST-02/08 (draft)
