---
title: Fundador
slug: fundador
aliases: ["fundador", "consórcio fundador", "peer fundador", "board fundador"]
tags: [vision, governance]
modo: canonical
fonte-canonica: docs/caderno-1-vision/01-vision-and-positioning.md §5
aparicoes-consolidadas:
  - glossary.md §Fundador
  - caderno-4-governance/03-specification-lifecycle-and-rfcs.md §3
  - caderno-1-vision/01-vision-and-positioning.md §5
dependencias:
  - [[peer-do-sistema]]
  - [[specification-network-birth]]
  - [[genesis-state]]
  - [[sucessao-por-quorum]]
  - [[morte-da-rede]]
  - [[congelamento-escopado]]
  - [[first-peer-protocol]]
---

# Fundador

## Definição

O **Fundador** (ou Consórcio Fundador) é a entidade (seja um peer único, consórcio ou board) responsável por conduzir o bootstrap, gênese e onboarding inicial de uma rede. Ele gerencia o [[peer-do-sistema]] inicial, que atua como signaling server, facilitador de onboarding seguro e provedor de snapshots de bootstrap. Embora detenha superpoderes regulatórios iniciais codificados na especificação de governança (`SPECIFICATION:NETWORK_GOVERNANCE`), o fundador tem a capacidade de dissolver esses poderes de forma irreversível em favor de um modelo descentralizado de quórum ou P2P puro.

## Por quê

Para viabilizar o ciclo de nascimento e a governança das redes na plataforma (ver [[vision]]). Toda rede local-first distribuída precisa de um ponto de origem confiável (uma âncora de confiança inicial) para que os primeiros peers se encontrem de forma segura sem introduzir uma dependência de infraestrutura centralizada vitalícia. O conceito de fundador separa o criador/facilitador inicial da governança definitiva e perpétua da rede, permitindo transições seguras rumo à descentralização de longo prazo.

## Contrato

O texto autoritativo sobre a governança de redes e o bootstrap inicial está em [[caderno-1-vision/01-vision-and-positioning#5-relacoes-de-governanca-e-fundador]] e [[caderno-4-governance/03-specification-lifecycle-and-rfcs#3-governanca-de-redes-e-sucessao]].

Propriedades-chave:
- **Ato de Gênese**: Toda rede nasce de um ato de bootstrap documentado imutavelmente no grafo pelo nó `SPECIFICATION:NETWORK_BIRTH` no estado `GENESIS` (ver [[specification-network-birth]] e [[genesis-state]]).
- **Identidade e Infraestrutura**: Na rede pública, o fundador opera infraestrutura Cloud para sinalização, snapshots e disponibilidade. Na rede corporativa whitelabel, a identidade é provisionada centralmente (SSO/AD/Okta), governada por regras complexas.
- **Sucessão por Quórum**: Linha de sucessão M-de-N declarada na gênese para cobrir a incapacidade técnica do fundador (ver [[sucessao-por-quorum]]).
- **Dissolução de Poderes**: Capacidade de alterar irreversivelmente a `SPECIFICATION:NETWORK_GOVERNANCE` para abrir mão de seus poderes e transferir a validação para um modelo P2P distribuído ou base de votação.

## Implementação

O Sync Worker gerencia regras e o ciclo de vida do fundador através de especificações declarativas. O bootstrap inicial de novos peers através do [[peer-do-sistema]] é detalhado em [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#6-inicializacao-e-first-peer-protocol]] (ver [[first-peer-protocol]]).

## Evolução

As transições de governança de rede e alteração do conjunto de validadores ocorrem por meio de novas versões de especificações imutáveis (`SPECIFICATION:NETWORK_GOVERNANCE`) ou propostas de evolução de rede. A inatividade permanente do fundador e de seus validadores autorizados resulta na paralisia natural de transações não-comutativas (congelamento escopado por linhagem), mantendo a rede funcional e consistente apenas para operações comutativas, sob as leis físicas de design da plataforma (ver [[morte-da-rede]] e [[congelamento-escopado]]).

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `docs/glossary.md` | `§Fundador` | Substituir pelo wikilink `[[fundador]]` |
| `docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md` | `§3` | Referenciar canonicamente o verbete `[[fundador]]` |
| `docs/caderno-1-vision/01-vision-and-positioning.md` | `§5` | Referenciar canonicamente o verbete `[[fundador]]` |
