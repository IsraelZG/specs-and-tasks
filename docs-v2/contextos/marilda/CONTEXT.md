---
id: contexto-marilda
tipo: contexto
status: ativo
data: 2026-08-02
---

# Marilda

A camada de experiência: vocabulário visual, engines transversais e o motor que
monta telas a partir de especificação. Consome as portas de Contratos. Nunca
importa Avelino.

> Nenhum documento de `docs-v2` cobre este contexto hoje. Os termos abaixo estão
> herdados do corpus antigo e aguardam reescrita no registro do v2.

**Estado construído** (`superapp/packages`, medido em 2026-08-03):

| Pacote | Construído | Documentado |
| :--- | :--- | :--- |
| `design-system` | 46 componentes shadcn, inclui `Calendar` e `Table` | piloto de 6 |
| `ui-engines` | 1 — `FlowGrid` e adapters | catálogo de 13 |
| `pages` | 606 linhas — `schema`, `validator`, `evaluator` | linguagem de páginas |
| `shell` | `workspace-shell`, `layout-manager`, `layout-solver`, `responsive` | ADR 0016 |

**Escopo de v1** (ADR-019): design system, motor de páginas, shell, mais dez
engines em lista fechada — FlowGrid, Timeline, SuperCard, Layout, SmartForm,
Filter, StateMachine, AuditTrail, Composer, AssetCard. Quatro delas exigem
reescrita antes de serem construídas. Depois desta lista vale o portão da regra
de dois.

**Requisitos que ainda não existem em lugar nenhum:**

| Requisito | Onde | Origem |
| :--- | :--- | :--- |
| porta de regra síncrona | Contratos declara, Avelino implementa | ADR-014 |
| faixa válida nos tokens, não só valor | design system | ADR-016 |
| papel no nó de página, além de `id` | schema de páginas | ADR-017 |
| bloco de comandos na metadata dos 46 componentes | design system | ADR-018 |
| formato da cena e identidade estável de instância | Contratos | ADR-015 |
| supressão de comando declarada, com motivo | schema de páginas | ADR-018 |

## Language

**Token**:
Valor semântico do vocabulário visual (cor, espaçamento, tipografia), nomeado
por intenção e nunca por aparência.
_Evitar_: variável de tema, constante de estilo.

**Componente**:
Peça visual sem regra de negócio, identificada por nome estável de catálogo.
_Evitar_: primitivo, átomo, widget.

**Engine**:
Peça funcional transversal e agnóstica de domínio, que compõe componentes e
expõe slots e eventos. Calendário, planilha, timeline e tabela são engines.
_Evitar_: componente complexo, módulo de UI.

**Wrapper**:
Composição nomeada de uma engine para um domínio específico. Vive no módulo, não
em Marilda, e jamais alcança componentes ou tokens por fora da engine.
_Evitar_: componente de aplicação, container.

**Motor de páginas**:
Interpretador que valida uma especificação de página e monta a árvore de
engines correspondente, resolvendo dados pela porta de leitura.
_Evitar_: renderizador, page runtime.

**Estado de vista**:
Estado que só existe para a interface — filtro aplicado, coluna ordenada, painel
aberto, seleção corrente. Vive em tabela local, sobrevive à sessão, nunca
replica e nunca deriva do grafo.
_Evitar_: estado local, cache, rascunho — cada um é outra coisa.

**Porta de leitura reativa**:
Ver [Contratos](../contratos/CONTEXT.md). Marilda só enxerga dados do grafo por ela.

**Porta de documento colaborativo**:
A segunda porta de leitura, com forma de handle CRDT. Cobre documentos,
planilhas e quadros colaborativos, rascunhos entre dispositivos e presença. As
duas portas aplicam a mesma decisão de autorização. Ver ADR-020.

**Dicionário de comandos**:
Nos modos com interface, Marilda o intermedeia: trata os comandos `local` e
`efemero` e encaminha os `duravel` a Avelino. Ver ADR-008.
