---
id: adr-017-piso-nao-customizavel
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling de Marilda 2026-08-03
  - docs-v2/pt-BR/adr/ADR-016-customizacao-em-camadas.md
  - docs-v2/pt-BR/adr/ADR-007-superficie-de-comandos-ai-first.md
---

# ADR-017 — Piso de afordâncias que nenhuma customização alcança

> **Emenda de 2026-08-03 (ADR-021).** Este piso deixou de ser mecanismo de
> segurança. O portão de operações de valor mudou-se para Avelino, que exige
> verificação explícita de toda proposta envolvendo `ASSET` — capacidade
> permanente ou confirmação interativa. O piso permanece como mecanismo de
> **honestidade**: exibir errado passa a confundir o usuário, não a fraudá-lo.
> A lista abaixo continua válida; o que mudou é o que ela garante.

## O que este piso protege

Não protege a integridade do sistema — disso já cuida a verificação de
capacidade no comando (ADR-007). Uma customização maliciosa não faz o sistema
executar o que não foi autorizado.

Protege a **intenção do humano**. Uma interface desfigurada pode levar alguém a
autorizar o que não pretendia: botão destrutivo sem contraste, aviso de
permissão negada escondido, confirmação de comando `duravel` disfarçada de ação
trivial. O comando é checado, o usuário consente, e sai um registro assinado com
a intenção errada dentro.

## Decisão

Contratos declara um **piso universal**, válido em todo produto:

1. confirmação de comando `duravel`;
2. indicação de autoria e assinatura;
3. aviso de permissão negada;
4. identidade do ator corrente.

O piso é **monotônico**: um módulo pode acrescentar afordâncias ao piso, e nunca
remover. Um produto tampouco pode remover. Cada camada de customização só pode
tornar o piso maior.

Uma customização que alcance o piso é **recusada na validação**. Ela não é
aplicada parcialmente nem ignorada em silêncio.

## Por que universal, e não por módulo

Piso que depende de cada autor lembrar é piso que vaza. A lista é curta porque
não trata de domínio nenhum: ela trata da confiança na plataforma. Um módulo de
fintech e um de chat divergem no que é crítico no domínio deles — e é por isso
que podem acrescentar. Não divergem em "o usuário precisa saber que está
assinando".

## Consequência de implementação

O piso incide sobre estilo, porque a mecânica já é fechada por declaração
(ADR-016). Para que a validação saiba o que proteger, um nó da árvore de página
precisa carregar **papel** além de identidade: um marcador que diga que aquele
nó é uma confirmação de ação durável, ou a indicação do ator.

O schema de página hoje tem `id` e `component`. Não tem papel. É requisito novo.

Sem papel, o piso seria inaplicável: não haveria como distinguir o botão de
confirmação de qualquer outro botão.

## Consequências

- A suíte de conformidade de Marilda precisa de vetores adversariais de
  customização: tentar apagar contraste de confirmação, ocultar autoria,
  suprimir aviso de permissão. Cada um deve ser recusado.
- Faixa de estilo (ADR-016) e piso são mecanismos distintos e ambos necessários.
  A faixa impede o exagero; o piso impede o alvo.
- Customização compartilhada continua sendo conteúdo não confiável. O piso reduz
  o dano possível; não substitui autoria assinada e revogação.
