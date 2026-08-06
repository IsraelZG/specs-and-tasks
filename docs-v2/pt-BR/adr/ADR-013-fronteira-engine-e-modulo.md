---
id: adr-013-fronteira-engine-e-modulo
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling de Marilda 2026-08-03
  - docs-v2/pt-BR/adr/ADR-012-ilda-catalogo-de-modulos.md
  - docs/caderno-3-sdk/03-engines-and-spec-driven-ui.md (catálogo herdado)
---

# ADR-013 — Substrato é engine, uso é módulo; promoção pela regra de dois

## Decisão

**Critério:** uma engine não conhece domínio nenhum. O substrato agnóstico é
engine e vive em Marilda. O uso, que carrega vocabulário e regra de um domínio,
é módulo e vive em Ilda.

**Portão:** uma peça só é promovida a engine quando um **segundo** módulo
precisar dela. Com um consumidor só, ela fica dentro do módulo.

O critério é agnosticismo. A regra de dois não afrouxa o critério — ela impede
que se generalize com um caso só, o mesmo cuidado registrado no ADR-009 sobre a
gramática de perfil.

## Três níveis, não dois

O código já mostra um nível abaixo da engine. `Calendar` e `Table` existem hoje
como **componentes** do design system.

| Nível | Exemplo | Onde |
| :--- | :--- | :--- |
| Componente | `Calendar` (seletor de data), `Table` | Marilda — design system |
| Engine | grade de tempo, grade com fórmulas | Marilda — engines |
| Módulo | calendário (RRULE, convite, RSVP), suíte office | Ilda |

Um seletor de data não é uma grade de tempo, e uma grade de tempo não é um
calendário. Confundir os três é o erro que o critério existe para evitar.

## Consequências

- O catálogo de 13 engines herdado do corpus antigo **não é um plano de
  trabalho**. A maioria tem zero ou um consumidor. São candidatas, e cada uma
  precisa passar pelo portão antes de existir.
- Uma peça que nasce dentro de um módulo e depois é promovida muda de dono. A
  promoção é um evento previsto, não um acidente — vale versão nova em Marilda e
  remoção no módulo de origem.
- Nada impede um módulo de ter componentes próprios. Impede-se apenas chamá-los
  de engine antes do segundo consumidor.
