---
name: bond-caucao
title: "Bond / Caução"
aliases: ["bond", "caução", "bonding", "cortesia executável", "bond de operador"]
tags: [governance, defesa-sybil, economia, segurança, v4]
modo: canonical
fonte-canonica: docs/rfc-v4.md §4.2
aparicoes-consolidadas:
  - rfc-transacoes-multidominio.md §6.3
dependencias:
  - [[defesa-sybil]]
  - [[standing]]
  - [[fato-negativo-verificavel]]
  - [[oraculo-baas]]
  - [[revogacao-por-cortesia]]
  - [[credits]]
---

# Bond / Caução

> **Modo canonical** — definição única aqui. Fonte normativa principal:
> `rfc-v4.md §4.2`. Fonte secundária: `rfc-transacoes-multidominio.md §6.3`.
> Lente principal: governance.

---

## Definição

**Bond/caução** é o depósito de valor (créditos ou recurso real-escasso) que
um agente em **papel privilegiado** (validador, custódio, oráculo) deve
manter para participar da rede. Mau comportamento verificável — duplo-sinal,
adulteração de resultado, não-cumprimento de obrigação registrada no grafo —
autoriza o sistema a **cortar o bond do infrator**.

É o único ponto da arquitetura em que **a economia tem papel de segurança
legítimo**. Fora desse escopo (participação básica, medição de contribuição)
a economia **não** é defesa Sybil.

> Texto normativo de `rfc-v4.md §4.2`:
>
> "**Bond/caução para papéis privilegiados** (validador/custódio): mau
> comportamento corta a caução. É aqui que a economia ganha papel de
> **segurança** legítimo — bonding, não gating de participação básica."

---

## Contexto: por que bond existe

Em um sistema P2P sem autoridade central, validadores e custódios têm acesso
privilegiado — à chave de ativo, ao resultado de uma saga, ao laudo de um
oráculo externo. A verificação criptográfica cobre o payload, mas não pode
coagir o comportamento futuro do agente antes de ele agir.

Bond resolve esse gap com dissuasão ex-ante: o agente perde algo real se agir
de forma desonesta. Combinado com o [[fato-negativo-verificavel]] (que
registra o mau ato de forma durável e re-verificável), o mecanismo fecha o
ciclo responsabilização → punição.

---

## Mecanismo normativo

### Bond como defesa Sybil (rfc-v4.md §4.2)

No stack de [[defesa-sybil]] para P2P puro (módulos opt-in via SPEC), bond
ocupa a camada de papéis privilegiados:

| Mecanismo | Alvo | Tipo de custo |
| :--- | :--- | :--- |
| Convite gateado por [[standing]] | Criação de identidade | Custo de tempo/contribuição |
| Staking social do convidante | Colusão na web-of-trust | Reputação do patrocinador |
| Irrelevância por diversidade | Sybils servindo uns aos outros | Custo de oportunidade econômica |
| **Bond/caução** | **Validadores e custódios** | **Perda de valor depositado** |
| Detecção topológica (SybilGuard) | Ataques em escala de grafo | Recurso computacional |

Bond é o único mecanismo da lista em que a economia ganha papel de segurança.
Os demais mecanismos são de identidade ou de irrelevância; o bond é punição
material.

### Bond como liquidação de default transacional (rfc-transacoes-multidominio.md §6.3)

Quando uma obrigação é estruturada no grafo com deadline (como `CONTENT:INTENT`
com prazo HLC) e a contraparte não cumpre, o grafo gera um [[fato-negativo-verificavel]].
Com bond, a punição não é apenas reputacional:

> Texto normativo de `rfc-transacoes-multidominio.md §6.3`:
>
> - **Com bond/caução:** sistema corta o bond do não-cumpridor (cortesia
>   executável).
> - **Sem bond:** fato negativo verificável + rate-limit (ser marcado no
>   grafo, receber menos prioridade).
> - **Equivalência:** O fato negativo é Sybil-resistant igual (não é possível
>   "desver" desmentindo); punição do sistema só tem dente se há **custo
>   estrutural de reputação** (bond) ou **custo de oportunidade**
>   (rate-limit de acesso).

"Cortesia executável" — mencionada em `rfc-transacoes-multidominio.md §6.3`
— é o corte de bond: a punição é automática e estrutural, não dependente de
boa vontade do infrator. Difere da [[revogacao-por-cortesia]] (expurgo de
privacidade), que é best-effort e voluntária.

### Bond em oráculos BaaS (rfc-transacoes-multidominio.md §6)

O [[oraculo-baas]] é a única classe de afirmação que o grafo aceita sem
verificação criptográfica interna. A mitigação contra forja de autorização
ou adulteração de resultado é ex-post e se apoia em bond:

> De `rfc-transacoes-multidominio.md §6` e [[oraculo-baas]]:
>
> "Mitigado por bonding/redundância de oráculos (vários bridges, votação) —
> não por cripto; oráculo por definição é trusted input."

O operador do oráculo deposita bond; se forjar ou adulterar, o bond é cortado.
A redundância de oráculos complementa o bond: votação entre múltiplos bridges
dificulta a colusão.

---

## Escopo preciso

Bond **não** é:

- Mecanismo de participação básica (qualquer peer pode participar sem bond).
- Medição de contribuição (isso é [[standing]] / [[contribuicao-verificavel]]).
- Garantia criptográfica (bond é dissuasão, não prova — o agente ainda pode
  agir mal e perder o bond).

Bond **é** exclusivamente para **papéis privilegiados** em que o comportamento
desonesto do agente tem impacto sistêmico e não pode ser prevenido por
verificação inline.

---

## Quatro lentes

### Vision
Bond/caução é o instrumento que torna economicamente viável delegar papéis
críticos a agentes distribuídos sem autoridade central. O agente serve a
rede porque perder o bond custa mais do que ganhar com a trapaça.

### Protocol
O corte de bond é acionado por um [[fato-negativo-verificavel]] autocomprovável
(embutindo os objetos assinados). O mecanismo é determinístico: qualquer peer
pode re-verificar a acusação e confirmar o corte. Não depende de votação
humana ou de árbitro — é enforçado pelo [[aplicador-deterministico]] da
linhagem relevante.

### SDK
A liquidação do bond é procedimento na SPEC, não no core (ver
[[economia-como-modulo]]). O core registra o fato negativo; a SPEC declara
quanto cortar e como redistribuir (queima, redistribuição ao ofendido, fundo
de seguro). `ASSET:BALANCE_STATE` do agente infrator recebe o débito via
aresta [[spends]] ou [[credits]] conforme a regra da SPEC.

### Governance
Bond é **opt-in via SPEC** — módulo de P2P puro que deployments corporativos
e públicos não precisam (nesses casos, Sybil está resolvido na porta e os
validadores são licenciados). A SPEC de cada rede declara: quais papéis
exigem bond, valor mínimo, moeda (créditos internos ou recurso externo) e
política de corte.

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `rfc-transacoes-multidominio.md` | `§6.3` | texto normativo permanece na RFC; mencionar wikilink `[[bond-caucao]]` |
| `rfc-v4.md` | `§4.2` | texto normativo permanece na RFC; fonte canônica deste verbete |

---

## Conceitos relacionados

- [[defesa-sybil]] — bond é o único mecanismo do stack em que a economia tem papel de segurança legítimo
- [[fato-negativo-verificavel]] — o ato que aciona o corte de bond; autocomprovável e re-verificável por qualquer peer
- [[standing]] — medição de contribuição; distinto do bond (bond é segurança, standing é reputação econômica)
- [[oraculo-baas]] — papel privilegiado cujo operador deve manter bond; mitigação ex-post contra forja de fato externo
- [[revogacao-por-cortesia]] — "cortesia" no sentido de voluntariedade; bond transforma cortesia em execução compulsória
- [[credits]] — aresta comutativa de crédito; redistribuição de bond cortado pode usar este mecanismo conforme SPEC
- [[economia-como-modulo]] — a política de corte de bond vive na SPEC, não no core
- [[aplicador-deterministico]] — enforça o corte de bond de forma determinística, sem árbitro humano
- [[contribuicao-verificavel]] — medição de trabalho à rede; não é bond (bond é garantia de papel, não medição)
