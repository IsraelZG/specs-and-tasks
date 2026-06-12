---
name: hlc
title: "Hybrid Logical Clock (HLC)"
aliases: ["Relógio Lógico Híbrido", "HLC", "hybrid-logical-clock"]
tags: [protocol, temporal-ordering, sync, linhagem]
---

# Hybrid Logical Clock (HLC)

## Definição

O HLC é o carimbo de ordenação causal da plataforma: um par `(pt, c)` em que `pt` é o componente físico em milissegundos (colado ao tempo real, útil para display e janelas temporais) e `c` é um contador lógico de 16 bits que desempata eventos ocorridos no mesmo `pt`. Empacotado como `(pt << 16) | c` e armazenado como inteiro, o HLC é coberto pela assinatura Ed25519 de cada nó ou aresta. Substitui `created_at` como critério de ordenação na seleção de [[head]] e na auditoria de [[linhagem-de-versoes]], pois o relógio de parede isolado está sujeito a skew e à manipulação do autor.

## Por quê

O sistema é local-first e P2P: eventos são criados em múltiplos peers sem coordenação central. Precisamos de uma ordem total que (a) respeite a relação *happens-before* entre eventos causalmente relacionados, (b) permaneça "colada" ao tempo real para que janelas temporais e displays de data façam sentido, e (c) seja determinística e idêntica em todos os peers sem troca de mensagens adicionais. O HLC satisfaz os três requisitos com custo zero de coordenação.

## Contrato

O algoritmo completo e autoritativo está em [[caderno-2-protocol/02-cryptographic-lineage-and-auth#36-ordenação-causal-hlc-e-seleção-de-head]].

Propriedades-chave:

- **Monotonicidade causal:** se `e1 → e2` (causal), então `HLC(e1) < HLC(e2)`. A recíproca não vale — o HLC ordena, mas **não detecta concorrência** (detecção de fork é estrutural, via duas arestas [[mutates]] ativas com o mesmo `source_id`).
- **Tie-breaking determinístico:** ordem total `(pt, c, author_pubkey)` — idêntica em todos os peers, sem coordenação.
- **Invariante de pai:** um nó que faz [[mutates]] de um pai `P` é **rejeitado como malformado** se `HLC(filho) ≤ HLC(P)`. Garante que o nó de maior HLC numa linhagem seja sempre a ponta (tip), tornando a definição topológica de [[head]] equivalente à definição por HLC máximo.
- **Limite de drift:** se `pt_remoto > wall_clock_local + MAX_DRIFT` (ex.: 5 min), o valor não é adotado no `max` do relógio local e o nó entra em quarentena. Limita o ataque de "HLC futuro-distante" sem poluir o relógio da malha.

O transporte (RFC §2.9) é responsável por **transmitir e validar** o HLC; a lógica de seleção de head e merge de fork vive neste caderno de protocolo.

## Implementação

O trigger `trg_nodes_insert_entity_head` em [[caderno-3-sdk/01-sqlite-and-projections-schema#31-tabela-entity_heads]] usa o `hlc` de cada nó inserido para manter a tabela `entity_heads` com o head vigente de cada linhagem. A lógica é: ao inserir um novo nó, se `NEW.hlc > head_hlc` atual da entidade, o head é atualizado. Por ser `ON CONFLICT … DO UPDATE` com comparação de HLC, o resultado independe da ordem de chegada dos nós no sync P2P.

A coluna `hlc` nas tabelas `nodes` e `edges` está coberta pela `signature` Ed25519 — falsificar o carimbo invalida a assinatura.

## Evolução

Não há planos de substituição; o formato `(pt << 16) | c` como inteiro é estável e backward-compatible. Uma futura extensão do contador para 32 bits seria uma mudança de schema que exigiria RFC própria.

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§HLC` | Substituir o corpo inteiro pelo wikilink `[[hlc]]` |
| `caderno-5-transport/01-p2p-transport-and-reconciliation.md` | `§2.9` | DELETAR a repetição do algoritmo; substituir por `[[hlc]]` com link explícito para `[[caderno-2-protocol/02-cryptographic-lineage-and-auth#36-ordenação-causal-hlc-e-seleção-de-head]]` |


