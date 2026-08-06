---
id: adr-019-lista-fechada-de-engines-v1
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling de Marilda 2026-08-03
  - docs-v2/pt-BR/adr/ADR-013-fronteira-engine-e-modulo.md
  - docs/caderno-3-sdk/03-engines-and-spec-driven-ui.md (catálogo herdado)
---

# ADR-019 — Lista fechada de engines de Marilda v1

## Decisão

Dez engines nascem em Marilda v1 sem passar pelo portão da regra de dois:

| Engine | Situação |
| :--- | :--- |
| FlowGrid | construída; dois adapters reais (JDM do Estaleiro e `SPEC:WORKFLOW`) |
| Timeline | três consumidores documentados |
| SuperCard | universal para entidade estruturada |
| Layout | dois consumidores documentados |
| SmartForm | **exige reescrita** |
| Filter | **exige reescrita** |
| StateMachine | **exige reescrita** |
| AuditTrail | **exige reescrita** |
| Composer | limítrofe, admitida |
| AssetCard | limítrofe, admitida |

**A lista é fechada.** Nenhuma engine futura entra por ser considerada óbvia. A
partir daqui vale o portão do ADR-013 ao pé da letra, aplicado aos casos de
reuso menos evidentes que aparecerem ao desenhar os módulos.

## Fora da lista

- **GeoSpatial** e **RelationGraph** — um consumidor cada. Vão ao portão.
- **ContextMenu** e **BottomSheet** — **não são engines**. São componentes, e já
  existem no design system como `Popover`, `Sheet` e `DropdownMenu`. O catálogo
  herdado os duplicava.
- **WorkspaceShell** — **não é engine**. É o shell, em pacote próprio por
  ADR 0016.

O catálogo herdado dizia ter treze engines. Duas entradas não eram engines.

## As quatro reescritas

Cada uma contradiz o v2 como está documentada. Nenhuma pode ser construída antes
de ser reescrita no registro do v2.

**SmartForm** — gera o formulário a partir do dataschema da `SPECIFICATION`.
Não valida: invoca a porta de regra. Não persiste: emite comando. Rascunho vai
para estado de vista, não para Automerge.

**Filter** — monta a consulta no vocabulário da porta de leitura. Não monta SQL.
Marilda não conhece o motor de armazenamento.

**StateMachine** — renderiza o workflow e invoca a porta de regra para saber
quais transições são permitidas. Não avalia Zen localmente e não decide
transição.

**AuditTrail** — lê linhagem pela porta de leitura, como qualquer outro dado.
Não acessa o grafo direto nem faz roteamento próprio sobre ele.

## Consequências

- Dez engines especificadas contra zero módulo construído. O risco de
  generalizar cedo foi aceito conscientemente, em troca de velocidade — e está
  contido pelo fato de a lista ser fechada.
- Cada uma das dez precisa do bloco de comandos do ADR-018 e das faixas de
  estilo do ADR-016, como qualquer peça de Marilda.
- O catálogo herdado deixa de ser referência. Esta lista o substitui.
