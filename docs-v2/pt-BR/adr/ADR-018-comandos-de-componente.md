---
id: adr-018-comandos-de-componente
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling de Marilda 2026-08-03
  - docs-v2/pt-BR/adr/ADR-015-catalogo-e-cena.md
  - superapp/packages/design-system/src/metadata/schema.ts (schema existente)
---

# ADR-018 — O componente declara seus comandos; a página pode restringir

## Decisão

Um componente ou engine declara seus **comandos intrínsecos** na própria
metadata, ao lado dos blocos `Behavior` e `InteractionState` que já existem. Uma
`Table` é ordenável em qualquer página que a monte, sem fiação por página.

Uma página ou um produto podem **suprimir** comandos em contextos específicos —
uma vista somente-leitura, um painel de auditoria. Nunca podem **acrescentar**
comando que o componente não tenha.

| Superfície | O que expressa |
| :--- | :--- |
| **Catálogo** | superfície **máxima** — tudo que o componente sabe fazer |
| **Cena** | superfície **efetiva** — o que sobrou nesta tela, após restrição |

## Efeito sobre o ADR-015

O ADR-015 dizia que o agente planeja no catálogo e referencia na cena. Isso
continua valendo, com uma correção: **o plano é provisório**. A cena confirma.
Um agente que planejou ordenar uma tabela precisa verificar, na cena, se aquele
comando sobreviveu à restrição daquela página.

Para que isso não vire adivinhação, **a restrição é declarada e aparece na
cena**, com motivo. O agente enxerga "este comando existe no componente e foi
suprimido aqui", e não um silêncio que ele teria de interpretar.

## Invariante: restrição não é controle de acesso

Suprimir um comando numa página é **escopo de contexto**, não autorização. Um
comando suprimido continua sujeito à mesma verificação de capacidade de sempre,
e um comando que precisa ser negado é negado **pela capacidade**, nunca pela
supressão.

Sem este invariante, alguém usaria restrição de página como permissão — e ela
seria contornável abrindo outra página que monte o mesmo componente. Seria uma
barreira de interface, exatamente o que o ADR-007 proíbe.

## Duas monotonicidades simétricas

- O **piso** do ADR-017 só cresce: módulo e produto acrescentam afordâncias
  intocáveis, nunca removem.
- A **restrição** deste ADR só encolhe: página e produto suprimem comandos,
  nunca criam.

Ambas são unidirecionais, e é isso que as torna previsíveis quando várias
camadas se compõem.

## Consequências

- O schema de metadata ganha um bloco de comandos. Os 46 componentes existentes
  precisam declará-lo — é trabalho real, e sem ele não há catálogo de execução.
- Comando de componente é classe `local` por padrão (ADR-008). Um componente que
  precise emitir comando `duravel` está, na verdade, encaminhando um comando de
  domínio, e isso pertence ao módulo.
- A metadata de design system passa a servir a dois consumidores com propósitos
  distintos: escolher componente ao construir, e invocar comando no que já roda.
  Os dois blocos convivem no mesmo arquivo e não devem ser confundidos.
