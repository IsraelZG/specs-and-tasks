---
title: Recorrência e Exceções
slug: recorrencia
aliases:
  - recorrencia
  - Recorrências
  - instâncias virtuais
  - override de ocorrência
  - rrule
tags:
  - sdk
  - calendar
  - timeline
  - canonical
  - onda-11
modo: canonical
fonte-canonica: docs/caderno-3-sdk/22-calendario-reference-spec.md §2
aparicoes-consolidadas:
  - docs/glossary.md §Recorrência
  - docs/caderno-3-sdk/22-calendario-reference-spec.md §2
dependencias:
  - [[content]]
  - [[specification]]
  - [[timeline]]
---

# Recorrência e Exceções

## Definição

No contexto do sistema de calendário e linha do tempo da plataforma, a **Recorrência** define eventos repetitivos sem inflar o grafo de metadados:
1. **Regra de Recorrência (RRULE):** É um conjunto de regras declaradas no payload de um evento mestre (`CONTENT:EVENT`), seguindo padrões normativos como RRULE (frequência, intervalo, expiração).
2. **Instâncias Virtuais:** As ocorrências repetidas do evento não são gravadas como nós individuais no grafo. Em vez disso, são geradas dinamicamente sob demanda pela engine `Timeline` como projeções virtuais.
3. **Exceção (Override):** Qualquer alteração em uma ocorrência específica (como mover de horário ou cancelar uma instância de terça-feira) é registrada como um nó de override append-only referenciando o evento mestre e a data original da ocorrência.

## Por quê → [[caderno-1-vision]]

A plataforma baseia-se no minimalismo e na eficiência de dados (ver [[caderno-1-vision/01-vision-and-positioning.md]]). Materializar cada ocorrência de uma reunião semanal recorrente geraria dezenas de nós redundantes por ano:
- **Redução do Grafo:** Apenas 1 nó mestre é persistido no grafo. As projeções virtuais evitam poluição de banco de dados e tráfego desnecessário no sync.
- **Independência Temporal:** Mudar uma ocorrência específica não altera o evento mestre nem interfere nas demais ocorrências futuras, mantendo o histórico de linhagem seguro.
- **Rendimento P2P:** As instâncias virtuais são computadas em memória no client, reduzindo drasticamente o tempo de inicialização da view de agenda.

## Contrato → [[caderno-2-protocol]]

A conciliação de agendas e sincronizações com externos seguem estas regras:
- O nó de exceção (override) é do tipo `CONTENT` de override e aponta para o mestre por meio de uma aresta.
- A projeção da linha do tempo no client faz a união do mestre com os nós de exceção baseados na chave composta (ID do mestre × data original).
- Sincronizadores bidirecionais (conector Classe D) exportam exceções como atualizações pontuais para provedores externos (Google/Microsoft), mantendo a supressão de eco para evitar duplicações.

## Implementação → [[caderno-3-sdk]]

Para detalhes do mecanismo de projeção e limites honestos, consulte [`caderno-3-sdk/22-calendario-reference-spec.md`](../caderno-3-sdk/22-calendario-reference-spec.md).
```
