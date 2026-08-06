---
id: adr-015-catalogo-e-cena
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling de Marilda 2026-08-03
  - docs-v2/pt-BR/adr/ADR-007-superficie-de-comandos-ai-first.md
  - docs-v2/pt-BR/adr/ADR-008-classes-de-comando-e-dicionario.md
---

# ADR-015 — O agente enxerga duas superfícies: catálogo e cena

## Decisão

Um agente opera o sistema por duas superfícies distintas, nunca por pixels.

| | **Catálogo** | **Cena** |
| :--- | :--- | :--- |
| Natureza | estático | vivo |
| Depende da tela | não | sim |
| Conteúdo | todo comando que o produto sabe executar | árvore montada agora, estado de vista, instâncias com id |
| Uso pelo agente | **planejar** | **referenciar** |

O agente planeja no catálogo e resolve referências na cena. "Aprovar o pedido"
vem do catálogo. "Este pedido", "a linha selecionada", "a coluna que está
ordenada" vêm da cena.

> **Emenda de 2026-08-03 (ADR-018).** O plano feito no catálogo é
> **provisório**. Como uma página pode suprimir comandos, o catálogo expressa a
> superfície máxima e a cena expressa a efetiva. A supressão é declarada e
> aparece na cena com motivo, para que o agente não precise interpretar
> silêncio.

## Por que as duas

Só cena reproduz a fragilidade da automação de navegador, sem os pixels: a
capacidade do agente passaria a depender de onde ele está navegado, e mudar o
layout o quebraria.

Só catálogo torna impossível dizer "ordene esta coluna" sem que alguém tenha
declarado `ordenar_pedidos_por_data`, e a declaração explode
combinatoriamente.

## A cena é derivada, nunca mantida

A cena é produzida a partir da especificação de página e da árvore montada. Ela
não é uma estrutura paralela que alguém atualiza junto com a interface. Toda API
paralela mantida à mão sai de sincronia com o que ela descreve, e uma cena
dessincronizada faz o agente agir sobre uma tela que não existe mais.

O schema de página já tem o que a cena precisa: cada nó da árvore declara `id`
estável.

## Composição do catálogo

O catálogo é a união, montada em tempo de execução:

- comandos de domínio, declarados pelas extensões de Ilda — classe `duravel`;
- comandos de componente e engine, declarados por Marilda — classe `local`;
- comandos do produto, declarados na composição.

As classes do ADR-008 já separam os dois níveis. Nenhum mecanismo novo é
necessário para distingui-los.

## Invariantes

1. **Comportamento não declarado é invisível ao agente.** Um componente que faz
   algo sem expor o comando correspondente é um defeito, pela mesma regra do
   ADR-007 que proíbe caminho exclusivo da interface.
2. **O agente não tem privilégio.** A verificação de capacidade acontece no
   comando. Um agente não executa nada que o portador que o opera não pudesse
   executar pela interface.
3. **A cena não é superfície de escrita.** Referenciar um nó da cena não
   autoriza nada; a autorização continua acontecendo na invocação do comando.

## Consequências

- A interface e o agente permanecem dois chamadores iguais do mesmo catálogo,
  como o ADR-007 estabeleceu. A cena não é uma segunda API: é o vocabulário de
  referência sobre o qual os argumentos do comando são construídos.
- Testar um produto sem interface passa a ser possível pelo catálogo. Testar
  resolução de referência exige a cena, e portanto uma árvore montada.
- Falta especificar o formato da cena e o mecanismo de identidade estável de
  instância quando a mesma página é aberta duas vezes.
