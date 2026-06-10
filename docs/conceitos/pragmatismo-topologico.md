---
title: "Pragmatismo Topológico"
slug: pragmatismo-topologico
aliases: ["Pragmatismo Topológico", "Princípio do Pragmatismo Topológico", "P2P oportunístico"]
tags: [vision, transporte, protocol, hub]
modo: hub
fonte-canonica: docs/caderno-1-vision/01-vision-and-positioning.md §2.1
aparicoes-consolidadas:
  - docs/rfc-transporte-p2p-v3.1.md §1.2
dependencias:
  - [[modalidade-de-rede]]
  - [[rede-corporativa-whitelabel]]
  - [[specification]]
  - [[honestidade-radical]]
  - [[peer-do-sistema]]
  - [[fundador]]
  - [[peer]]
  - [[matriz-de-classificacao-transporte]]
---

# Pragmatismo Topológico

## Definição

O **Pragmatismo Topológico** é o princípio arquitetural que orienta o design de rede da Plataforma V3.1. Embora o sistema seja estruturado como *P2P-first* para garantir soberania sobre dados e operação local-first, ele rejeita o purismo descentralizado. O P2P é adotado *oportunisticamente*, utilizando infraestruturas centralizadas (como servidores na nuvem, Super Peers ou BaaS) de forma transparente sempre que estas oferecem melhor desempenho, menores custos operacionais ou garantias de qualidade superiores (tais como recuperação de credenciais, snapshots de bootstrap e processamento transacional regulado), delegando à `SPECIFICATION` de cada rede a escolha do compromisso topológico ideal.

## Por quê ([[vision]])

O princípio responde à necessidade de viabilizar comercialmente e tecnicamente três modalidades sob a mesma fundação de código: redes públicas, corporativas whitelabel e P2P puras. Ao invés de impor um dogma técnico restritivo descentralizado a cenários onde a centralização atende melhor ao usuário (como segurança, conveniência e conformidade regulatória), o sistema adota a topologia mais adequada oportunisticamente.

- Canônico: [01-vision-and-positioning.md §2.1](file:///c:/Dev2026/Docs/docs/caderno-1-vision/01-vision-and-positioning.md#L21-L24)
- Detalhes e Relações de Visão:
  - [[modalidade-de-rede]]: O pragmatismo topológico permite suportar nativamente as três modalidades (Pública, Corporativa Whitelabel, P2P Pura).
  - [[honestidade-radical]]: Reconhece abertamente as limitações de cada topologia e o custo de operação de um sistema totalmente descentralizado.

## Contrato ([[protocol]])

Na camada de protocolo de rede, o pragmatismo topológico molda como a malha se organiza, as identidades são validadas e os dados são roteados. O transporte opera de forma oportunística utilizando peers de maior capacidade de maneira transparente.

- Canônico: [rfc-transporte-p2p-v3.1.md §1.2](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L18-L20)
- Mecanismos de Protocolo:
  - [[peer]] / Super Peers: Promoção de canais de relays temporários em nós de maior capacidade para contornar problemas de travessia de NAT simétrico sem prometer uma malha 100% direta.
  - [[specification]]: O comportamento de rede é governado por definições contratuais de nível de rede, não por restrições embutidas no core da plataforma.
  - UCAN / Web-of-Trust: O controle de acesso e de replicação é delegado ao subgrafo autorizado pelas UCANs no [[sync-dirigido-por-ucan]].

## Implementação ([[sdk]])

No SDK, o pragmatismo topológico é materializado pela infraestrutura de sincronização que executa a inversão de controle das leis de roteamento físicas e lógicas baseada nos metadados declarados nas specifications.

- Canônico: [rfc-transporte-p2p-v3.1.md §2.11](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L223-L336)
- Componentes e Fluxo:
  - O [[sync-worker]] e o classificador interno interceptam as mutações em RAM, consultando os `transport_hints` na `SPECIFICATION` associada.
  - A [[matriz-de-classificacao-transporte]] mapeia o destino físico (tabelas SQLite locais, RAM ou barramento de rede) baseado na resposta a três perguntas fundamentais: o estado é observável por outros peers? Sua integridade precisa ser auditável? Ele deve sobreviver à sessão?

## Evolução ([[governance]])

A governança da topologia é evolutiva, permitindo a transição de soberania ou delegação de liveness de forma irreversível.

- Canônico: [01-vision-and-positioning.md §5](file:///c:/Dev2026/Docs/docs/caderno-1-vision/01-vision-and-positioning.md#L92-L95)
- Políticas de Governança:
  - O [[fundador]] inicia a rede operando o [[peer-do-sistema]] inicial e pode dissolver seus privilégios progressivamente a favor de um modelo descentralizado de quórum ou P2P puro.
  - A rede transacional pode congelar com segurança em read-only caso validadores autoritativos estejam offline.

## Aparições a consolidar

As definições foram extraídas e integradas a este verbete unificado, devendo ser substituídas por wikilinks nas fases seguintes de consolidação:
- `docs/caderno-1-vision/01-vision-and-positioning.md §2.1` ("Princípio do Pragmatismo Topológico" - redefinição de visão)
- `docs/rfc-transporte-p2p-v3.1.md §1.2` ("Pragmatismo Topológico" - redefinição de protocolo/transporte)

## Dependências por onda

A tabela detalha as dependências deste conceito, marcando com *placeholder* (Wikilink do Foam) aquelas que pertencem a ondas futuras e não foram criadas.

| slug | onda | status |
|:---|:---|:---|
| [[specification]] | 1 | criado |
| [[peer]] | 1.5/glossary | placeholder |
| [[matriz-de-classificacao-transporte]] | 5 | criado |
| [[modalidade-de-rede]] | 12 | criado |
| [[rede-corporativa-whitelabel]] | 12 | criado |
| [[honestidade-radical]] | 12 | placeholder |
| [[fundador]] | 12 | placeholder |
| [[peer-do-sistema]] | 12 | placeholder |
