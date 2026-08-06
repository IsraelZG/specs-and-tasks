---
id: questoes-abertas
tipo: nota
status: ativo
data: 2026-08-03
nota: questões levantadas e ainda não decididas; não é contrato
---

# Questões abertas

## Q-01 — Avaliação de expressão em Marilda

**Status: RESOLVIDA em 2026-08-03 pelo ADR-014.** Nenhuma das três opções
abaixo foi escolhida — apareceu uma quarta ao reenquadrar o problema.

**Resolução:** Marilda não tem motor próprio e também não fica sem lógica. Ela
**invoca** o motor único de Avelino por uma porta de regra síncrona e
in-process, viável porque Marilda nunca existe sem um Avelino local. Computa
livremente na camada de vista, invoca a regra do módulo na camada de proposta, e
não tenta prever a camada de autoridade. O evaluator de 247 linhas vira uma
chamada de porta.

O namespace `$doc` **não** foi resolvido: a decisão 008-02 continua aberta.

O registro abaixo fica como histórico do que foi levantado.

### O conflito

O ADR-006 diz que Marilda não avalia regra alguma, nem de negócio nem de
apresentação, e que as condições chegam resolvidas pela porta de leitura.

O código contradiz. `superapp/packages/pages/src/evaluator.ts` tem 247 linhas
avaliando expressões no cliente, com três namespaces.

O ADR-006 também tem um furo. Condições sobre estado de vista — `$state.tab ==
'edit'` — dependem de estado que só existe em Marilda. Avelino não sabe qual aba
está aberta e nunca saberá. Para essa classe, resolver em Avelino é impossível,
não apenas indesejável.

### O que o evaluator é, de fato

Uma linguagem de **predicado booleano**, não de computação.

| Tem | Não tem |
| :--- | :--- |
| `==` `!=` `>` `>=` `<` `<=` | aritmética, nem `+` |
| `&&` `\|\|` `!` `( )` | chamada de função |
| literais string, número, bool | laço, map, filter, agregação |
| caminhos `$state.x`, `$doc.y` | I/O, rede, storage |

Ela não deriva nada. Só compara valores que já estão no contexto. Uso no schema:
`visible?: ZenExpression` num nó da árvore, e `props` aceitando `{$bind}` ou
`{$zen}`.

### O eixo real

O parser é inofensivo por construção. O risco está no que entra no contexto:

| Namespace | O que é | Quem já decidiu |
| :--- | :--- | :--- |
| `$state` | aba, seleção, filtro; declarado por página com tipo e default | só existe em Marilda |
| `sources` | resultado de query pela porta de leitura | Avelino já filtrou por capacidade |
| `$doc` | sessão Automerge lida direto | ninguém; é acesso lateral à persistência |

### Opções levantadas

**A.** Emendar o ADR-006. Contexto igual a `$state` mais resultados de
`sources`. Remover `$doc`. Fixar que a linguagem é não-computacional, sem
aritmética e sem função. A garantia vira estrutural e testável pela gramática.

**B.** Manter o ADR-006 literal. Remover as 247 linhas e trocar `visible` por
árvore declarativa de condições. Risco de reconstruir a mesma expressividade com
ergonomia pior.

**C.** Deixar como está. Aceita um segundo caminho de leitura ao lado da porta do
ADR-005, e fecha por omissão a decisão 008-02.

### Dependência — resolvida

A decisão **008-02** do backlog (*"terceiro namespace de fonte vs. modelar
sessão-doc como source ordinária"*) foi **resolvida em 2026-08-03 pelo
ADR-020**: `$doc` não é namespace de primeira classe. O documento colaborativo é
obtido pela porta de documento colaborativo e entra como fonte de contexto
ordinária.

---

## Q-06 — Piso não-customizável

**Status: RESOLVIDA em 2026-08-03 pelo ADR-017.** Piso universal em Contratos,
monotônico: módulo e produto acrescentam, nunca removem. Gerou um requisito
novo no schema de página — cada nó precisa carregar **papel**, não só `id`, para
que a validação saiba o que proteger.

O registro abaixo fica como histórico do que foi levantado.

Customização compartilhada é conteúdo não confiável que altera a interface de
quem a aplica. Ela não executa código nem lê dado alheio, mas pode enganar:
esconder aviso, apagar contraste de botão destrutivo, disfarçar confirmação de
ação durável.

Falta decidir quais afordâncias nenhuma camada de customização alcança, em
nenhum produto — e onde esse piso é declarado. Candidatos a intocável:
confirmação de comando `duravel`, indicação de autoria e assinatura, aviso de
permissão negada, identidade do ator corrente.

Opções não exploradas ainda: piso universal em Contratos; piso declarado por
módulo; sem piso, com a política do produto assumindo a responsabilidade.

## Q-07 — `ASSET` não está definido em `docs-v2`

**Status: RESOLVIDA em 2026-08-03 pelo ADR-023.** Quatro tipos-base normativos e
fechados, mais convenção de arestas e portão de minimalismo. Subtipos viram
registro extensível sob o portão. O ADR-021 gateia no tipo-base, que não muda.

Fica pendente o **trabalho**: escrever o documento de ontologia em `docs-v2` no
registro exigido. O ADR-023 decidiu o estatuto, não o conteúdo.

O registro abaixo fica como histórico.

O portão de verificação do ADR-021 key­a em `ASSET`. O corpus v2 **usa** o tipo
(`ASSET:INVITE` em topologia §4, `ASSET:PERMISSION_ID` em automerge-integration)
mas nunca o define. A definição dos quatro tipos de nó — `PROFILE`, `ASSET`,
`SPECIFICATION`, `CONTENT` — vive em `caderno-2-protocol/01-graph-ontology.md`,
do corpus antigo, que não viaja para o repositório novo.

Sem a ontologia de grafo no v2, a regra mais importante de segurança do produto
se apoia num tipo que o repositório não declara.

## Q-08 — Fadiga de confirmação

**Status: RESOLVIDA em 2026-08-03 pelo ADR-024.** Concessão inline e estreita
por padrão, com escopo e prazo obrigatórios, sustentada por cinco camadas —
reversibilidade (que é espectro, e não alcança divulgação), alcance progressivo,
detecção de anomalia na autoridade, ML que muda fricção mas não dá veredito, e
revisão periódica cujo agente só propõe revogação.

Seguem abertos dois pontos menores, listados no próprio ADR-024: o que dirige a
escala do alcance progressivo, e o caminho de contestação quando regra
determinística bloqueia operação legítima.

O registro abaixo fica como histórico.

Se toda operação de `ASSET` pedir confirmação, as pessoas clicam sem ler. É a
falha documentada de todo sistema de diálogo de permissão. A graduação por
capacidade permanente ajuda, mas falta desenhar: que operações viram capacidade
permanente, com que escopo, com que TTL, e como o usuário revê e revoga o que
concedeu.

## Q-02 — Nomes provisórios

**Substituída pela Q-09.**

## Q-03 — Política do catálogo Ilda

**Status: RESOLVIDA em 2026-08-03 pelo ADR-026.** O catálogo não é
infraestrutura: é um conjunto de módulos assinados pelos autores, distribuídos
por qualquer canal. Cada rede **admite** o que quiser, e admitir é conceder
capacidade — mesmo ato que admitir um membro, já gateado pelo ADR-021. Autor
retira versão mas não força remoção; autoridade revoga com efeito imediato na
rede dela.

## Q-04 — Gramática de perfil regulatório

**Status: RESOLVIDA em 2026-08-03 pelo ADR-025.** Quatro operadores derivados por
leitura da instância — `elevar`, `introduzir`, `travar`, `condicionar` — mais a
invariante de que perfil só endurece. Composição, versionamento e aplicação a
rede viva ficam declarados como não decididos, porque uma instância não os
exercita.

## Q-05 — Namespace de pacotes

**Status: RESOLVIDA em 2026-08-03 pelo ADR-027.** Um namespace por pilar, mais
`@ilda/*`. `@plataforma/*` não é adotado. A fronteira do ADR-002 passa a ser
verificável por leitura, não só por build.

## Q-09 — Nome da plataforma

**Status:** parcialmente resolvida. O terceiro pilar virou **Contratos** pelo
ADR-028 — substantivo comum deliberado, porque ele não tem agência. Segue aberto
apenas o nome da plataforma, provisoriamente **SuperApp**.

Registro do que era a questão original:

Avelino, Marilda e Ilda são nomes próprios, homenagem a três dos quatro avós. O
terceiro pilar segue com o substantivo comum **Contratos**, e a plataforma com o
provisório **SuperApp**. O esquema de nomes tem um slot vazio evidente.

O namespace do terceiro pilar (ADR-027) fica pendente desta decisão.
