---
id: adr-014-tres-camadas-de-regra
tipo: adr
status: aceito
data: 2026-08-03
emenda:
  - docs-v2/pt-BR/adr/ADR-006-avelino-isomorfico-e-motor-unico.md
  - docs-v2/pt-BR/adr/ADR-005-interface-reativa-entre-produtos.md
fontes:
  - sessão de grilling de Marilda 2026-08-03
  - docs-v2/pt-BR/arquitetura/topologia-e-autoridade.md (§2, item 6)
---

# ADR-014 — Três camadas de regra; a regra é escrita uma vez e roda duas

## O que estava errado

O ADR-006 afirmou que Marilda não avalia regra alguma, nem de apresentação.
Isso é insustentável e a refutação é curta: uma engine de planilha **é** uma
engine de aritmética. O ADR-006 proibia aritmética em Marilda, logo proibia a
planilha. O mesmo vale para gráfico, grade de tempo e subtotal de tabela.

Componentes e engines computam. O que eles não fazem é **decidir**.

## Decisão

Toda regra pertence a uma de três camadas.

| Camada | Exemplos | Quem executa | Vira registro |
| :--- | :--- | :--- | :--- |
| **Vista** | formatar, agrupar, subtotal de tela, escala de eixo, colisão de agenda, fórmula de planilha | Marilda, livremente | nunca |
| **Proposta** | total do pedido, rateio, parcela, saldo projetado | Marilda calcula para mostrar; a autoridade recalcula para confirmar | sim, após validação |
| **Autoridade** | unicidade global, saldo de terceiros, sequência, gravame, limite regulatório | somente a autoridade | sim |

### Camada de proposta: um texto, dois executores

A regra é declarada **uma única vez**, na faceta de domínio do módulo em Ilda.
Ela não é reescrita do lado da interface.

- Marilda a invoca pela **porta de regra** enquanto o usuário digita, para
  mostrar o resultado.
- A autoridade invoca **a mesma regra** ao validar a proposta, e só o resultado
  dela vira registro.

O resultado calculado por Marilda nunca é autoritativo. Ele é conveniência.

### Camada de autoridade: Marilda não tenta

Marilda não exibe prévia de regra cuja entrada ela não possui. Prever unicidade
global ou saldo de terceiros a partir de um store parcial produziria uma prévia
que mente. A interface mostra que a confirmação depende da autoridade.

## Porta de regra

Contratos declara a porta de regra. Avelino a implementa com o Zen Engine, que ele
já precisa ter para validar acesso e permissão.

A porta é **síncrona e in-process**. Isso é viável por um fato do próprio
ADR-006: pela tabela de modos, Marilda nunca existe sem um Avelino local. Web,
desktop e mobile levam os dois; cloud leva Avelino sozinho. Renderização não
espera `await`, e não precisa.

Marilda, portanto, **não tem motor próprio**. Ela chama o único motor, que vive
em Avelino. O princípio do ADR-006 — um motor só — permanece intacto. O que cai
é a proibição de Marilda usar lógica.

## Por que a autoridade recalcula

Permissão não basta. A validação de operações de domínio é função exclusiva da
autoridade, conforme `arquitetura/topologia-e-autoridade.md` §2, item 6, sob a
frase "nenhum cliente as executa".

Sem o recálculo, um cliente com permissão legítima de escrita gravaria um
registro com total errado, e a autoridade o assinaria. O grafo append-only
passaria a conter aritmética errada, assinada. Para o perfil de securitização,
com livros formais e registro nominativo, isso é fatal.

## Consequências

- O evaluator de 247 linhas em `packages/pages` é substituído por uma chamada de
  porta. A questão Q-01 fica resolvida.
- A decisão **008-02** continua aberta: se a sessão-doc é um namespace `$doc` ou
  uma `source` ordinária. Ela não é resolvida por este ADR.
- A porta de leitura do ADR-005 entrega dado dentro do limite da permissão, com
  o pós-processamento que a consulta permitir. Ela não entrega "condições já
  resolvidas" — essa redação do ADR-006 fica sem efeito.
- A classificação de uma regra em vista, proposta ou autoridade é decisão de
  quem escreve o módulo, e precisa ser declarada. Uma regra sem camada declarada
  é um defeito de especificação.
