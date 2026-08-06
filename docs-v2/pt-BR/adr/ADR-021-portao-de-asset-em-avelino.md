---
id: adr-021-portao-de-asset-em-avelino
tipo: adr
status: aceito
data: 2026-08-03
emenda:
  - docs-v2/pt-BR/adr/ADR-017-piso-nao-customizavel.md
fontes:
  - sessão de grilling de Marilda 2026-08-03
  - docs-v2/pt-BR/adr/ADR-016-customizacao-em-camadas.md
---

# ADR-021 — Toda operação de ASSET passa por verificação explícita em Avelino

## Decisão

Qualquer proposta que chegue a Avelino e envolva um nó `ASSET` exige
verificação explícita. O portão é de Avelino, não da interface.

A verificação é satisfeita por **um** de dois caminhos:

| Caminho | Quem usa | Como satisfaz |
| :--- | :--- | :--- |
| capacidade permanente | agente, automação | capacidade já delegada, com escopo e TTL |
| confirmação interativa | humano na tela | tela padrão emitida por Avelino, no ato |

A confirmação interativa é o caminho para **obter** uma capacidade. Quem já
porta uma passa direto.

## Por que em Avelino, e não em Marilda

Não se defende uma superfície que o adversário controla. Customização é
compartilhável (ADR-016), e uma customização hostil opera exatamente dentro de
Marilda. Proteger afordâncias lá é proteger o terreno do atacante.

A propriedade que faz o portão funcionar: **a confirmação descreve a operação
nas palavras de Avelino, não nas do produto.** Uma customização pode rotular
"transferir 500 unidades" como "Atualizar". Não pode alterar o que Avelino diz
ao validar. O engano morre no portão.

## Por que ASSET é o critério certo

`ASSET` é o nó de valor e poder transacionável. Seus subtipos cobrem o espaço de
dano quase inteiro: `asset-permission` e `asset-role` (aumento de escopo),
`asset-invite` (admissão), `asset-lock` (bloqueio), `asset-consent`
(consentimento), `asset-reputation`.

`CONTENT` só ganha alcance por `ASSET` — publicar com grande alcance é conceder
permissão de leitura a muitos, o que é operação de `ASSET`. Um critério só cobre
os dois casos.

## O agente

Um agente **nunca vê tela de confirmação**. Não há humano olhando, e uma
afordância de confirmação sem destinatário não protege ninguém. O agente porta
capacidade que um humano delegou, com escopo, ou a operação falha.

Isto fecha a lacuna do modelo AI-first: a proteção não some no modo de uso que o
produto quer tornar normal — ela muda de forma, do ato para a delegação.

## Efeito sobre o ADR-017

O piso deixa de ser mecanismo de segurança e passa a ser mecanismo de
**honestidade**. Exibir errado o `pending`/`finalized` ou omitir autoria passa a
confundir o usuário, não a fraudá-lo, porque nenhuma operação de valor escapa do
portão.

A segurança sai de Marilda, que é onde ela nunca deveria ter estado.

## Em aberto

- **Fadiga de confirmação.** Se toda operação de `ASSET` pedir confirmação, as
  pessoas clicam sem ler e a proteção evapora — é a falha documentada de todo
  sistema de diálogo de permissão. A graduação por capacidade permanente ajuda,
  mas falta desenhar que operações viram capacidade permanente, com que escopo e
  que TTL.
- **`ASSET` não está definido em `docs-v2`.** O corpus v2 usa `ASSET:INVITE` e
  `ASSET:PERMISSION_ID`, mas a definição dos quatro tipos de nó vive em
  `caderno-2-protocol/01-graph-ontology.md`, do corpus antigo. Esta regra se
  apoia num tipo que o repositório novo não define. Ver `questoes-abertas.md`,
  Q-07.
