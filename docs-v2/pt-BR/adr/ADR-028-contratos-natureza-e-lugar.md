---
id: adr-028-contratos-natureza-e-lugar
tipo: adr
status: aceito
data: 2026-08-03
emenda:
  - docs-v2/pt-BR/adr/ADR-002-tres-produtos-independentes.md
  - docs-v2/pt-BR/adr/ADR-027-namespace-por-pilar.md
fontes:
  - sessão de grilling 2026-08-03
---

# ADR-028 — Contratos: natureza dos artefatos, tempo de vida e lugar

## Nome

O terceiro pilar chama-se **Contratos**. Não recebe nome próprio: diferente dos
outros três, ele não tem agência — nada nele executa. Nome próprio nomeia quem
age.

O nome anterior, **Padrões**, fica para trás por descrever mal o conteúdo. Quem
lê "padrões" pensa em guia de estilo; o que está ali é o contrato e a prova — a
superfície que define o que Avelino tem de satisfazer e o que Marilda pode
assumir. Namespace: `@contratos/*`.

O termo foi trocado retroativamente em todo o corpus, e não apenas daqui para a
frente. O histórico fica no git, conforme a convenção do repositório.

## Três tipos de artefato, três tempos de vida

| Artefato | Forma | Existe quando |
| :--- | :--- | :--- |
| tipos e interfaces | tipos TypeScript | só na compilação; apagados no bundle |
| esquemas e listas | dados | **carregados em produção** |
| suítes de conformidade | código de teste | CI de quem implementa; nunca em produção |

São dados em produção: schema da declaração de extensão, gramática de perfil,
lista do piso, ontologia de grafo, enum de classes de comando, formato da cena.

## Nenhuma lógica em produção

Contratos é compilado e está presente em produção — **como dado, nunca como
comportamento**.

Em execução: Avelino lê o schema de declaração para validar um módulo na
admissão, lê a gramática de perfil para impor o perfil regulatório ao validar
propostas, e lê a lista do piso para recusar customização que a alcance. Em
nenhum caso Contratos executa; Avelino executa lendo dados de Contratos.

Isso vale para todos os 27 ADRs anteriores. Mesmo a composição do dicionário de
comandos, que é lógica, foi atribuída a Marilda e Avelino pelo ADR-008.

## Por que é dependência de runtime, e não convenção de codificação

Se os schemas fossem apenas convenção seguida ao codar, cada pilar embutiria sua
cópia. Uma divergência entre o schema que Avelino valida e o que Ilda usou para
declarar viraria erro silencioso: o módulo entra com um contrato que ninguém
checou.

Como pacote versionado, a incompatibilidade é explícita e verificável — mesma
razão do ADR-003: o que a suíte não cobre não é contrato.

## Lugar no repositório

O critério é: **se o artefato muda quando o contrato muda, ele versiona com o
contrato.**

```
raiz/
  adr/              decisões sobre os quatro contextos
  arquitetura/      mapa, CONTEXT-MAP, terminologia
  contextos/        glossários

contratos/          o pilar
  spec/             ontologia, portas, declaração, perfil, piso — prosa normativa
  schema/           os mesmos, em forma de dado
  conformidade/     suítes executáveis

perfis/             instâncias da gramática (securitização)
```

ADRs ficam na raiz porque falam dos quatro contextos: uma decisão sobre a lista
de engines de Marilda não versiona com o contrato de Contratos.

## Fecha quatro lacunas

Estes artefatos pertenciam logicamente a Contratos e nenhum ADR os havia
atribuído:

1. **Ontologia de grafo** (ADR-023) — tipos-base, convenção de arestas e portão
   de minimalismo. É o mais crítico: o portão do ADR-021 se apoia em `ASSET`.
2. **Classes de comando e formato do dicionário** (ADR-008) — o enum e o schema
   são de Contratos; a composição em tempo de execução continua de Marilda e
   Avelino.
3. **Formato da cena e identidade estável de instância** (ADR-015).
4. **Schema da declaração de comando de componente** (ADR-018) — o conteúdo é de
   Marilda; a forma da declaração é contrato.

## Consequências

- Contratos não importa TinyBase nem Automerge. As portas são **modeladas nas**
  APIs deles; forma é referência, não dependência.
- A suíte de conformidade viaja no pacote, como ponto de entrada de teste, para
  que um terceiro que implemente uma porta possa executá-la. Ela não entra no
  bundle de produção.
- O nome da plataforma segue provisório em Q-09. Este ADR resolve apenas o nome
  do pilar.
