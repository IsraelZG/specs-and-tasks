---
title: Merge Aditivo
slug: merge-aditivo
aliases:
  - "merge-aditivo"
  - "merge aditivo"
  - "merge aditivo de saldo"
  - "credits"
  - "credits-v4"
  - "credits (v4)"
tags:
  - protocol
  - automerge
  - sync
  - hub
  - onda-6
modo: hub
fonte-canonica: docs/caderno-2-protocol/04-automerge-integration-spec.md §4.3
aparicoes-consolidadas:
  - docs/rfc-v4.md §2.4
dependencias:
  - [[specification]]
  - [[aresta]]
  - [[mutates]]
  - [[linhagem-de-versoes]]
  - [[fork-resolucao]]
  - [[automerge-repo]]
  - [[changes]]
  - [[validador-declarado]]
  - [[aplicador-deterministico]]
  - [[spends]]
  - [[credits]]
  - [[transfers-aresta]]
  - [[agente-de-sistema]]
---

# Merge Aditivo

## Definição
O **Merge Aditivo** (ou **Merge Aditivo de Saldo**) é a regra de resolução de conflitos e reconciliação da Plataforma V3.1/V4 para operações comutativas de crédito sobre a linhagem de um ativo (`ASSET:BALANCE_STATE`). Quando transações de crédito concorrentes bifurcam a linhagem do ativo de destino, o sistema mescla as ramificações somando deterministicamente os deltas das operações (`base + Δ₁ + Δ₂`), evitando o uso de estratégias do tipo Last-Write-Wins (LWW), que causariam a perda de valores financeiros e de histórico.

## Por quê
Em sistemas descentralizados e local-first, partições de rede e operações offline inevitavelmente geram concorrência e ramificações (forks) na linhagem de versões dos dados. Para documentos textuais ou estruturados, o [[automerge-repo]] resolve conflitos no nível do CRDT. No entanto, para saldos de ativos (como moedas, pontos de fidelidade ou quotas de recursos), utilizar estratégias comuns de resolução de concorrência — como Last-Write-Wins (LWW) ou descarte sistemático de um dos ramos — resultaria na perda catastrófica de dinheiro ou créditos válidos. O Merge Aditivo garante a integridade matemática das transações de crédito permitindo que múltiplos depósitos ou repasses ocorram de forma concorrente e assíncrona, convergindo de forma justa e correta sem necessidade de coordenação centralizada síncrona ou travamento da rede.

## Contrato
O contrato técnico, as regras de protocolo e as fórmulas normativas que regem o Merge Aditivo estão descritos nos seguintes documentos:
* [caderno-2-protocol/04-automerge-integration-spec.md §4.3](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/04-automerge-integration-spec.md#L87-L90)
* [rfc-v4.md §2.4](file:///c:/Dev2026/Docs/docs/rfc-v4.md#L151-L160)

**Regras de Protocolo e Raciocínio Normativo**:
1. **Regra de Soma de Deltas**: Para saldos (`ASSET:BALANCE_STATE`), a regra da [[specification]] do ativo é aditiva. Sob créditos concorrentes, o saldo final de uma ramificação bifurcada é calculado como:
   $$\text{Saldo final} = \text{base} + \Delta_1 + \Delta_2$$
   onde $\Delta_1$ e $\Delta_2$ são os deltas correspondentes a cada ramificação concorrente de arestas `CREDITS`.
2. **Divisão de Comutabilidade**:
   - **Débito (`SPENDS`)**: É uma operação *não-comutativa*, sujeita a double-spend. Por isso, exige serialização determinística por um validador declarado.
   - **Crédito (`CREDITS`)**: É uma operação *comutativa* e monotônica (não pode dar double-spend de recebimento) e dispensa aprovação ou coordenação própria. Os créditos concorrentes ao ativo de destino bifurcam a linhagem e passam pelo **Merge Aditivo** na SPEC de `ASSET:BALANCE_STATE`.
3. **Âncora de Origem vs. Destino**: Na modelagem de intents:
   - A aresta `SPENDS` aponta para o [[head]] exato de origem (versão consumida - não-comutativo).
   - A aresta `CREDITS` aponta para o `entity-id` do ativo destino (linhagem estável - comutativo), eliminando a necessidade de serializar síncronamente a cabeça do destinatário.

## Implementação
As especificações de armazenamento físico e orquestração do SDK do Merge Aditivo estão descritas em:
* [rfc-v4.md §2.4 e §3.2](file:///c:/Dev2026/Docs/docs/rfc-v4.md#L134-L164)

* **Projeção de Saldos**: Na tabela de projeções físicas do SQLite local (`asset_balances`), a consolidação do saldo final após um fork de crédito não é computada via simples somatório recursivo de toda a DAG de transações na inicialização. Em vez disso, o aplicador determinístico do cliente avalia os deltas de créditos de cada ramo ativo na linhagem de versões (`MUTATES` + `previous_hash`) a partir do pai comum e reconcilia de forma aditiva.
* **Arestas Envolvidas**:
  - `SPENDS` (aresta de `CONTENT:INTENT` para o head do `ASSET` de origem): serve de âncora de serialização.
  - `CREDITS` (aresta de `CONTENT:INTENT` para o `entity_id` do `ASSET` de destino): serve para indicar o repasse comutativo.
  - `TRANSFERS` (aresta do novo nó de saldo para a intent correspondente): registra a execução navegável da transferência.

## Evolução
O comportamento de governança do Merge Aditivo e sua relação com a evolução da Plataforma V4 estão detalhados em:
* [rfc-v4.md §2.1, §2.3 e §2.4](file:///c:/Dev2026/Docs/docs/rfc-v4.md#L78-L133)

* **Convergência Determinística**: No modelo da V4, a resolução de concorrência comutativa ocorre de forma otimista. Qualquer [[agente-de-sistema]] pode aplicar localmente a regra de merge aditivo para reidratar e atualizar o saldo. Caso ocorra um conflito de ordenação em um merge concorrente, o desempate é feito deterministicamente (pelo menor `entity_id` do agente que realiza o merge).
* **Segurança da Invariante de Core**: A segurança contra cunhagem indevida ou gastos duplos baseia-se no isolamento: enquanto os créditos são livres para se propagarem e se fundirem aditivamente, os débitos associados são rigidamente serializados contra o head de origem pelo [[validador-declarado]] de sua linhagem, sob pena de corte de caução e responsabilização forense em caso de fraude.

## Aparições a consolidar
As definições e referências duplicadas do termo foram unificadas sob este verbete:
1. **`caderno-2-protocol/04-automerge-integration-spec.md §4.3`**: Define canonicamente a natureza aditiva dos créditos concorrentes e o tratamento monotônico em oposição à serialização de débitos.
2. **`docs/rfc-v4.md §2.4`**: Formaliza a mecânica no contexto do fluxo de intents da V4, a comutabilidade dos créditos contra o `entity_id` estável do destinatário e o funcionamento sob validadores.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[specification]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[mutates]] | 1 | criado |
| [[linhagem-de-versoes]] | 1 | criado |
| [[head]] | 1 | criado |
| [[entity-id]] | 1 | criado |
| [[automerge-repo]] | 6 | criado |
| [[changes]] | 6 | criado |
| [[fork-resolucao]] | 6 | criado |
| [[validador-declarado]] | 9 | placeholder |
| [[aplicador-deterministico]] | 9 | placeholder |
| [[spends]] | 10 | placeholder |
| [[credits]] | 10 | placeholder |
| [[transfers-aresta]] | 10 | placeholder |
| [[agente-de-sistema]] | 10 | placeholder |
