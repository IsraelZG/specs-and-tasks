---
id: DMM-12
title: "Otimização e Auto-Cura (Human-in-the-Loop): Sugestões RAG/OKF via PRs Internos"
status: draft:triaged
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-10", "DMM-11"]
blocks: ["DMM-13"]
capacity_target: sonnet
---

# DMM-12 · Otimização e Auto-Cura (Human-in-the-Loop)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node v20+ · **PM:** `pnpm` · **Monorepo:** Turborepo

## 1. Objetivo
Completar o ciclo de RL implementando a fase **Optimize** de maneira estritamente supervisionada (*Human-in-the-Loop*). O Nó "Juiz" (criado no DMM-11) proporá melhorias nos arquivos `.context/` (RAG/OKF) baseando-se nas falhas rastreadas. Essas propostas serão convertidas em "Pull Requests Internos", exigindo que o operador humano analise e clique em "Aprovar" na interface (DMM-10) antes que o `plugin-knowledge` aplique as mudanças aos arquivos físicos.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] DMM-11 (Nó Juiz).
- [ ] DMM-10 (View de aprovação na UI).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `plugin-knowledge` para suportar staging de modificações (PRs internos) antes da persistência no FS.
- **[UPDATE]** O fluxo do "Juiz" (`plugin-workflows`) para gerar propostas de texto e submeter ao sistema de staging.

## 4. Estratégia de Testes Estrita
- **Vitest:** Garantir que uma sugestão aprovada pelo nó Juiz **NÃO** sobrescreva o arquivo real até que a flag de aprovação (`approve()`) seja invocada programaticamente no teste.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:**
> - **NÃO** permitir mutações diretas em arquivos markdown do RAG sem o intermédio do staging de aprovação. O isolamento de segurança é inegociável.

### Pegadinhas conhecidas *(preencher no endurecimento)*

## 6. Feedback de Especificação

### Classificação (pass-1 endurecer-fila, 2026-07-08, minimax)
- **Status proposto:** `draft:triaged` via `triage` (pass-1)
- **Motivo:** deps em `DMM-10` (ainda `draft:triaged` — depende de DMM-01→done) E `DMM-11`
  (acabei de triar — depende de DMM-06→done). §3 marca `[UPDATE] plugin-knowledge para
  suportar staging de modificações (PRs internos) antes da persistência no FS` e
  `[UPDATE] O fluxo do Juiz para gerar propostas de texto e submeter ao sistema de staging` —
  o **sistema de staging** é uma nova abstração sobre `plugin-knowledge` (EST-13); o **mecanismo
  de aprovação** é uma extensão da UI (DMM-10, que está triaged). Tudo converge em contratos
  ainda não fechados.
- **Por que NÃO `harden`:** staging de PRs internos não existe; modelar a fila+aprovação sem o
  DMM-10 (botão "Aprovar") nem o DMM-11 (Juiz propondo) seria inventar.
- **Pré-endurecimento já válido (pass-1):** `capacity_target: sonnet` (extensão do
  plugin-knowledge + fluxo do Juiz), `dependencies: [DMM-10, DMM-11]` consistente com
  `blocks: [DMM-13]`, complexidade 5 coerente.
- **Pegadinhas a abrir em pass-2:**
  - "PRs internos" (§1) — termo do Git, mas o fluxo proposto NÃO usa git: as mudanças vão
    para uma área de staging no FS (`plugin-knowledge`) e só são aplicadas após
    `approve()`. Decidir: nomenclatura (chamar "PR interno" é marketing) e se a área de
    staging é uma fila TipiBase ou arquivos em `.context/_staging/`.
  - "A interface (DMM-10) antes que o plugin-knowledge aplique as mudanças" — DMM-10 é
    o **editor visual JDM**, NÃO uma view de aprovação. A spec pode estar confundindo
    DMM-10 com a futura view "Decisões" (DMM-09) ou a Board (EST-14b). **Esclarecer no
    endurecimento** se a aprovação é numa view dedicada ou reaproveita a Board.
- **Pendente p/ pass-2 (JIT após DMM-10, DMM-11 → done):** assinatura TS da fila de staging,
  contrato `approve()`, integração com `plugin-knowledge` writer (EST-13c, serial), casos
  enumerados (aprovação → write real; rejeição → descarte; timeout → expira).

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Sugestões do RL vão para a fila de PRs e só são aplicadas no `fs` após autorização.
### Verificação automática
```bash
pnpm --filter @plataforma/plugin-knowledge test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-08T19:10]** - *arquiteto:minimax* - `[Triado]`: pass-1: deps DMM-10, DMM-11 ainda draft; reendurecer JIT — possível confusão DMM-10 vs view de aprovação
