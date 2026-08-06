---
id: adr-007-superficie-de-comandos-ai-first
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
---

# ADR-007 — Toda ação é um comando invocável; a interface é só mais um chamador

## Decisão

O sistema é AI-first. Tudo que a interface faz é a invocação de um **comando**
nomeado, declarado num dicionário e invocável fora da interface — por linha de
comando, por script ou por agente.

Na especificação de uma página, um botão **declara qual comando dispara**. O
botão não contém comportamento; ele referencia. Um agente lê o dicionário e
invoca o mesmo comando, com os mesmos argumentos e as mesmas verificações de
capacidade que a interface teria.

## Invariante

**Não existe caminho exclusivo da interface.** Se uma ação só pode ser executada
clicando, ela é um defeito. Nenhuma capacidade do produto pode depender de
point-and-click, de foco, de ordem de renderização ou de qualquer outro estado
que só exista na tela.

## Motivo

Um agente que precisa dirigir pixels para operar o sistema é um agente frágil e
caro. Fazendo do comando a única superfície de ação, a interface e o agente
tornam-se dois chamadores iguais do mesmo contrato — e a automação deixa de ser
uma camada de imitação sobre a interface para ser o modo normal de uso.

## Consequências

- O dicionário de comandos é documentação executável e superfície de teste: uma
  ação sem comando não é alcançável por agente e não é testável sem navegador.
- A verificação de capacidade acontece no comando, nunca no botão. Ocultar um
  botão é conforto visual; a recusa acontece na invocação.
- Marilda não precisa de nenhuma lógica para disparar ação: ela referencia um
  nome e passa argumentos.
