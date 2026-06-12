---
title: Zen Engine
slug: zen-engine
aliases:
  - Zen Engine
  - zen-engine
  - Validador de Domínio
  - validador procedural
  - motor de regras
tags:
  - sdk
  - canonical
  - onda-7
modo: canonical
fonte-canonica: docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1
aparicoes-consolidadas:
  - docs/glossary.md §Validador de Domínio
  - docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md §1.1
dependencias:
  - [[sync-worker]]
  - [[specification]]
  - [[linhagem-de-versoes]]
  - [[asset-balance-state]]
  - [[ucan]]
---

# Zen Engine

**Alias canônico:** Validador de Domínio (nome usado no glossário e na RFC de transporte).

## Definição

O **Zen Engine** é o motor leve de execução procedural embutido no [[sync-worker]]. É implementado como um interpretador WASM com AST simplificado e executa de forma preguiçosa (*lazy-loading* em mobile) as regras de negócio declaradas nas [[specification|SPECIFICATIONs]]:

- **Validações locais** — regras de interface aplicadas antes de persistir alterações (ex: comportamento do `SmartForm`).
- **Single-Validators** — lógicas estruturais avaliadas e validadas por um único validador credenciado.
- **Multi-sig** — lógicas complexas que exigem quóruns M-de-N de múltiplos validadores ou agentes `PROFILE:SYSTEM`.
- **Pontos de Rendimento e Escoamento BaaS** — regras que disparam integrações ou requisições para gateways Backend-as-a-Service externos.

> Fonte primária: [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §1.1](../caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md) — texto normativo replicado abaixo sem paráfrase.

### Texto normativo (caderno-3-sdk/02 §1.1)

> **Zen Engine (Validador Procedural)**: Motor leve de execução procedural (WASM com interpretador AST simplificado) embutido no worker. Ele executa de maneira preguiçosa (lazy-loading no mobile) as regras de negócio declaradas nas `SPECIFICATION`s (validações locais, processamento de migrações estruturais de dados e políticas multi-sig), garantindo economia de RAM e CPU.

### Relação com SPECIFICATIONs

As [[specification|SPECIFICATIONs]] possuem natureza dual: schema declarativo + **procedimento executável determinístico interpretado pelo Zen Engine** (WASM/AST). O motor é invocado pelo [[sync-worker]] nos quatro modos acima. Fonte: [caderno-4-governance/03-specification-lifecycle-and-rfcs.md §1.1](../caderno-4-governance/03-specification-lifecycle-and-rfcs.md).

## Invariante de Validação de Saldos (T1)

No modelo *state-based* (saldo `ASSET:BALANCE_STATE` atualizado via [[linhagem-de-versoes]], não por somatórios físicos), a auditabilidade reside na integridade da linhagem e do validador. Texto normativo replicado de [caderno-3-sdk/02 §1.1](../caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md):

> O Zen Engine **obrigatoriamente exige** que toda mutação de saldo carregue, em seu payload criptografado: (a) o delta de alteração (valor transferido), e (b) a referência causal à transação ou aresta correspondente. Em contextos de fintech regulada, o validador do Zen Engine executa obrigatoriamente a validação aritmética no momento do commit: `saldo_anterior + delta == saldo_novo`, rejeitando qualquer nó de saldo cuja matemática declarada divirja, protegendo o sistema contra adulterações de saldo bem-assinadas.

## Alias "Validador de Domínio"

O glossário usa "Validador de Domínio" como termo geral para a autoridade com jurisdição sobre um domínio de negócio específico, descrita como "implementado como uma SPECIFICATION procedural interpretada pelo motor de regras genérico (Zen Engine)". O termo é equivalente: o Zen Engine é o *runtime*; o Validador de Domínio é o papel funcional que a SPECIFICATION exerce quando executada por ele.

A RFC de transporte (`caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.7.3`) também cita "Validador de Domínio" no contexto do Private Swarm: *"Como não há um Validador de Domínio no Private Swarm"* — referência ao fato de que o Private Swarm não executa SPECIFICATIONs procedurais, apenas CRDTs e LWW.

## Migrações procedurais

O Zen Engine também executa lógica de migração causal (`migration_from_vN`) declarada em SPECIFICATIONs major (v2.0.0+), mapeando propriedades, recalculando pesos e readequando arestas automaticamente sem intervenção do usuário. Ver [caderno-4-governance/03-specification-lifecycle-and-rfcs.md §1.2](../caderno-4-governance/03-specification-lifecycle-and-rfcs.md).

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[sync-worker]] | 7 | criado |
| [[specification]] | 1 | criado |
| [[linhagem-de-versoes]] | 1 | criado |
| [[ucan]] | 2 | criado |
| [[asset-balance-state]] | — | sem verbete (fase 3) |


