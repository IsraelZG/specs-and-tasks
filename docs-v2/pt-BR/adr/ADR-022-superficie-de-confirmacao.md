---
id: adr-022-superficie-de-confirmacao
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling de Marilda 2026-08-03
  - docs-v2/pt-BR/adr/ADR-021-portao-de-asset-em-avelino.md
  - docs-v2/pt-BR/adr/ADR-006-avelino-isomorfico-e-motor-unico.md
---

# ADR-022 — Avelino emite o conteúdo da confirmação; o shell a desenha

## Decisão

Avelino declara **qual operação, qual asset, qual consequência**. Ele nunca
declara aparência. O shell desenha a confirmação, num nível que nenhuma
especificação de página alcança.

**Avelino não conhece CSS.** Ele roda headless em modo cloud, sem interface
alguma; um núcleo que conhece folha de estilo deixa de ser isomórfico. Absorver
CSS de tema também importaria a superfície de ataque inteira da linguagem —
`display:none`, `opacity:0`, sobreposição absoluta, injeção de texto por
pseudo-elemento — e nem um operador de boa-fé conseguiria garantir que não
quebrou a própria tela por acidente.

## Que camada alcança a confirmação

| Camada | Alcança? |
| :--- | :--- |
| módulo (Ilda) | não |
| **produto / operador da rede** | **sim, dentro dos limites abaixo** |
| usuário | não |
| marketplace, customização compartilhada | não |

O operador de uma rede privada põe sua marca porque é ele quem define a
composição do produto — a mesma camada que já escolhe módulos e perfis
regulatórios (ADR-011). Tema de marketplace não alcança, porque vive na camada
do usuário.

## O que o produto pode

- logo e nome do operador;
- família tipográfica, dentro da faixa de legibilidade;
- **paleta de cores completa da tela**;
- **texto explicativo adicional**, do tipo "em caso de dúvida, procure o
  Departamento Financeiro".

## O que o produto não pode

- suprimir ou alterar o texto padrão da mensagem — o adicional só **acrescenta**;
- alterar layout, posição ou tamanho relativo;
- alterar ícone ou forma de severidade;
- remover a inércia da superfície do produto.

## Por que a paleta livre é segura

Cor carrega significado de severidade, e uma paleta mal escolhida poderia apagar
a diferença entre confirmar e cancelar. O guard que impede isso já é obrigatório
por outro motivo: **acessibilidade proíbe codificar significado apenas em cor**.

Severidade vive em ícone, forma e texto — que estão fora do alcance do produto.
A paleta, portanto, não consegue apagá-la. Além disso, o validador calcula o
**contraste** do conteúdo crítico contra o fundo escolhido e recusa paletas
abaixo do limiar. A liberdade é de matiz, não de legibilidade.

## Texto adicional é atribuído

O texto acrescentado pelo operador é renderizado em região distinta e
**atribuído a ele**, não ao sistema. Sem atribuição, um operador poderia
acrescentar tranquilização enganosa que o usuário leria como voz da plataforma.
A atribuição também protege o operador: a mensagem dele não é confundida com
mensagem de sistema.

## A inércia é o sinal anti-imitação

A confirmação real **torna a superfície do produto inerte**. Uma falsificação
desenhada dentro do produto não consegue desativar o shell que a contém.

Isto dá ao usuário um sinal que não depende de reparar em detalhe visual: o
resto da tela para de responder. É o único sinal que sobrevive à liberdade de
paleta, e por isso não é negociável.

## Consequências

- O shell precisa de um nível de composição acima de qualquer spec de página,
  exclusivo para superfícies do sistema. Isso não existe hoje.
- O validador de customização precisa calcular contraste, não apenas comparar
  valores contra faixa. É um cálculo, não uma tabela.
- A suíte adversarial de Marilda ganha vetores: paleta que zera contraste, texto
  adicional que imita mensagem de sistema, tentativa de desenhar confirmação
  falsa no nível do produto.
