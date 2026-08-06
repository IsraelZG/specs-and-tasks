---
id: adr-016-customizacao-em-camadas
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling de Marilda 2026-08-03
  - docs-v2/pt-BR/adr/ADR-011-catalogo-de-modulos-e-produto-como-composicao.md
  - docs-v2/pt-BR/adr/ADR-015-catalogo-e-cena.md
---

# ADR-016 — Customização em camadas, com estética limitada e mecânica declarada

## Decisão

Uma página é o resultado da composição de camadas de customização, nesta ordem
de precedência:

```
módulo (padrão, vindo de Ilda)
  └─ produto (composição — ADR-011)
       └─ usuário (personalização)
```

Cada camada é um **nó spec que estende** o nó da camada anterior. A
personalização do usuário não é um mecanismo novo: é o mesmo `EXTENDS` aplicado
mais abaixo.

### Estética: alcance aberto, faixa limitada

O estilo cascateia e alcança tudo. O módulo não precisa prever ponto de tema
para que uma marca seja aplicada — trocar cor e tipografia é o caso mais comum
de todos e não pode exigir antecipação do autor.

Mas **cada propriedade estilável declara faixa válida**. Tamanho, espaçamento,
contraste e densidade têm limite. Uma customização fora da faixa é recusada na
validação, não renderizada torta.

### Mecânica: só o que o módulo declara

A customização mecânica alcança apenas os pontos que o módulo declara como
paramétricos, com nome e tipo. O resto da árvore é interno e o autor pode
reestruturá-lo.

Override de ponto não declarado é **erro de validação**, não silêncio. Esta é a
razão de não adotar o override por id estável: ele transformaria cada id da
árvore em API pública, e atualizar um módulo quebraria customizações sem aviso.

## Personalização como direito do usuário

Um usuário pode ajustar seu ambiente ao próprio fluxo sem depender de pedido de
funcionalidade ao criador do sistema. A customização resultante é um nó spec
assinado, e portanto:

- versionada e com linhagem, como qualquer nó;
- replicada entre os dispositivos do titular;
- **compartilhável** — diretamente entre peers ou por marketplace, como um tema.

A cena do ADR-015 passa a expor também **estilo computado e estado** de cada
componente, e não apenas estrutura e comandos. Sem isso não há como customizar a
página em exibição, nem por agente nem por interface de ajuste.

## Política do produto

A composição do produto declara sua política de customização. A arquitetura
prevê, no mínimo, estes graus:

| Grau | Efeito |
| :--- | :--- |
| livre | usuário customiza e compartilha |
| restrita | usuário customiza, não compartilha |
| proibida | nenhuma camada de usuário é aplicada |

A política é do produto. A capacidade é da plataforma: nenhum produto precisa
implementar customização, e nenhum precisa recusá-la por falta de mecanismo.

## Risco: redressing por customização compartilhada

Uma customização compartilhada é **conteúdo não confiável que altera a interface
de quem a aplica**. Como a mecânica é declarada e a estética é limitada, ela não
executa código nem lê dado alheio. Ela ainda pode, porém, **enganar**: esconder
um aviso, apagar o contraste de um botão destrutivo, ou disfarçar uma
confirmação de ação durável.

As faixas de estilo, portanto, não existem apenas para não quebrar o layout.
Elas são também o que impede uma customização de tornar a interface enganosa.

**Fica em aberto** o piso não-customizável: quais afordâncias nenhuma camada
alcança, em nenhum produto. Ver `questoes-abertas.md`, Q-06.

## Consequências

- Os tokens do design system precisam declarar faixa válida, não apenas valor.
  Isso não existe no corpus atual.
- Podem ser necessárias camadas intermediárias entre produto e usuário
  (organização, papel, dispositivo). Não foram decididas.
- Compartilhar customização exige as mesmas garantias de qualquer conteúdo
  replicado: autoria assinada, linhagem e revogação.
