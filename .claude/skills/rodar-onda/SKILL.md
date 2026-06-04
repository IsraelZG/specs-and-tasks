---
name: rodar-onda
description: Orquestra a criação de todos os verbetes  de uma onda do plano de Fase 2, despachando um subagent criador-verbete por conceito (contexto isolado), com commit por conceito e auditoria ao final. Invocar explicitamente com o número da onda, ex.: /rodar-onda 2.
model: haiku
---
# Orquestrar a onda $ARGUMENTS

Você é o ORQUESTRADOR. Não cria verbetes você mesmo e NÃO lê as seções de origem
dos cadernos — isso é trabalho dos subagents, para manter seu contexto enxuto.
Você só lê o plano, despacha subagents e agrega os retornos.

## Passo 1 — montar a fila
- Leia docs/conceitos/_plano-de-ondas.md e extraia, NA ORDEM LISTADA, os conceitos
  da onda $ARGUMENTS (slug + modo). A ordem importa: ela respeita dependências.
- Liste docs/conceitos/*.md. Remova da fila qualquer conceito cujo arquivo já exista
  (idempotência — permite retomar após /clear sem refazer nada).
- Se a fila ficar vazia, relate "onda $ARGUMENTS já concluída" e PARE.

## Passo 2 — criar, um por vez (SEQUENCIAL, nunca em paralelo)
Para cada slug da fila, na ordem, ESPERANDO um terminar antes de despachar o próximo
(assim as dependências criadas antes já existem quando as seguintes as referenciam,
e o histórico de git fica linear):

- Despache o subagent `criador-verbete` com a tarefa:
  "Crie o verbete do conceito <slug> (onda $ARGUMENTS). Derive título, aliases, tags,
   modo, fonte canônica, aparições a consolidar e dependências do inventário e do plano.
   Dependências que pertençam a ondas futuras ficam como Foam placeholder — NÃO as crie.
   Siga o CLAUDE.md: em conteúdo normativo, realoque/linke, nunca parafraseie de memória;
   em dúvida, deixe <!-- TODO(revisar) -->. Faça o commit ao final. Retorne só uma linha."
- Guarde a linha de retorno (criado/pulado + TODOs).

Não acumule no seu contexto o conteúdo dos verbetes — só os retornos de uma linha.

## Passo 3 — auditar
Despache o subagent `auditor-wiki` sobre docs/.

## Passo 4 — relatar e PARAR
Escreva um relatório curto:
- criados / pulados (com slugs)
- todos os <!-- TODO(revisar) --> reportados pelos subagents
- achados do auditor (links quebrados, definições concorrentes, órfãos)
Então PARE. NÃO inicie a próxima onda — aguarde confirmação do usuário.