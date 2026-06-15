---
title: Connection Promotion Engine
slug: connection-promotion-engine
aliases: ["ConnectionPromotionEngine", "connection-promotion-engine", "Promoção de Conexões"]
tags: [protocol, p2p, transporte, network]
modo: canonical
---

# Connection Promotion Engine

**Modo canonical** — fonte normativa: `caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.5.1`. Glossário (`glossary.md §ConnectionPromotionEngine`) consolidado aqui.

> Aparições consolidadas:
> - `glossary.md §ConnectionPromotionEngine` — definição curta (canonical aqui).
> - `caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.5.1` — nós leves, super peers como relays de circuito e promoção oportunística (fonte normativa principal).
> - `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §7.2` — operação no modo reverso (fechamento de túneis diretos em background para economizar soquetes).

---

## Definição

O **Connection Promotion Engine** (geralmente referido como `ConnectionPromotionEngine`) é o componente da camada de transporte responsável por gerenciar ativamente a topologia dinâmica de conexões físicas de um peer. Executado em segundo plano pelo [[sync-worker]], ele monitora as conexões ativas estabelecidas via relays e tenta, oportunisticamente, convertê-las em conexões peer-to-peer (P2P) diretas utilizando técnicas de hole punching e STUN. A promoção para conexão direta ocorre de forma transparente e imperceptível para o fluxo de dados quando as topologias de NAT de ambos os lados permitem (cone restrito ou completo); em cenários onde há NAT simétrico de um ou de ambos os lados, a promoção tipicamente falha e a conexão permanece de forma estável através de relays, sendo este um comportamento esperado e aceito pelo protocolo.

---

## Por quê ([[vision]])

O design da plataforma adota o princípio de [[pragmatismo-topologico]], reconhecendo a verdade desconfortável de que a travessia de NAT simétrico falha com frequência na infraestrutura da internet comercial. Em vez de impor uma malha puramente descentralizada a qualquer custo — o que excluiria dispositivos sob redes restritivas —, o sistema utiliza relays (normalmente Super Peers) para assegurar conectividade imediata de nós leves (Web e Mobile), economizando bateria e recursos de rede limitados. 

O `ConnectionPromotionEngine` resolve o trade-off entre conveniência topológica e eficiência de recursos. Ele permite que a rede inicialize conexões de forma instantânea via relays e, em segundo plano, busque caminhos diretos mais curtos (P2P). Isso reduz a latência do tráfego, diminui os custos de banda dos relays e preserva soquetes no sistema operacional, promovendo a adequação do paradigma [[local-first]] à topologia de rede física vigente.

Consulte o [caderno-1-vision/01-vision-and-positioning.md](../caderno-1-vision/01-vision-and-positioning.md#L21-L24) para detalhes sobre o Princípio do Pragmatismo Topológico e a [caderno-5-transport/01-p2p-transport-and-reconciliation.md §1.3](../caderno-5-transport/01-p2p-transport-and-reconciliation.md#L23-L28) sobre as limitações honestas de NAT.

---

## Contrato ([[protocol]])

O comportamento normativo e as regras operacionais do `ConnectionPromotionEngine` são definidos a seguir:

### Tipos de Nós e Relação Topológica (RFC §2.5.1)
1. **Nós Leves (Mobile/Web):** Não atuam como roteadores públicos. Conectam-se preferencialmente ancorados a relays para poupar bateria e conexões restritas.
2. **Super Peers (Desktop/Electron e Cloud):** Atuam como **Relays de Circuito**. Se um Webapp (browser) não consegue falar diretamente com um nó Mobile devido a restrições de NAT, ambos trafegam por um Super Peer conectado a ambos.

### Promoção Oportunística e Fallback
* Em background, a engine tenta perfurar o NAT (STUN/hole punching).
* **Sucesso na Perfuração:** Quando as topologias de NAT permitem (cone restrito ou completo), a rota direta é confirmada, os canais de dados são espelhados e o fluxo migra de forma imperceptível do relay para a conexão P2P direta.
* **Falha na Perfuração:** Em redes com NAT simétrico, a promoção não ocorre e a rota via relay de circuito permanece ativa. Isso é classificado como comportamento regular de rede e não gera alertas de erro.

### Operação no Modo Reverso (Background / Throttle)
Quando um swarm ou aba é movido para background, a engine atua na contramão da promoção:
* Desfaz voluntariamente conexões P2P diretas (STUN) ativas para aquele swarm.
* Migra o tráfego restante inteiramente de volta para relays ancorados.
* Esse comportamento visa economizar soquetes do sistema operacional, mitigando o limite de conexões simultâneas do navegador (limite físico típico de $\sim 30$ soquetes).

---

## Implementação ([[sdk]])

Na arquitetura do SDK, a execução da engine é gerenciada de forma assíncrona:

* **Local de Execução:** Ocorre inteiramente dentro do [[sync-worker]] fora da thread principal de interface (UI), preservando a responsabilidade de tela ativa.
* **Mapeamento de Peers:** O motor consome e atualiza o estado de conexão e capacidades de tier diretamente no [[swarm-registry]] em RAM (como latências, tier declarado e estado de promoção).
* **Sinalização e Túneis:** A engine se apoia nas capacidades de sinalização do Automerge Repo e em servidores STUN para conduzir o hole punching de WebRTC Data Channels.
* **Mitigação de Recursos:** A engine é integrada com a alocação de banda do [[global-network-throttle]], suspendendo tentativas de promoção e fechando soquetes caso o dispositivo entre em modo de economia de energia (Mobile com bateria $< 30\%$).

Consulte a especificação de Web Workers no [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md](../caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#L28-L36) e a integração com o ciclo de vida dinâmico na [caderno-5-transport/01-p2p-transport-and-reconciliation.md §3.2.5](../caderno-5-transport/01-p2p-transport-and-reconciliation.md#L448-L471).

---

## Evolução ([[governance]])

As políticas de agressividade de tentativas de hole punching, a lista de servidores STUN de bootstrap e as janelas de reavaliação de conexões diretas são governadas pelas especificações declarativas ([[specification]]) aplicadas a cada rede:

* **Especificações Restritivas:** Redes corporativas ou governamentais sob firewalls corporativos estritos podem desabilitar completamente as tentativas de promoção via `SPECIFICATION` de transporte, instruindo a engine a operar de forma estática apenas via relays autorizados para auditoria e controle de tráfego.
* **Mitigação de Custos em Redes Públicas:** Em modelos de governança descentralizada baseados em economia de token ou stakers, as taxas de utilização de relays de circuito podem ser parametrizadas para otimizar a preferência da engine por rotas diretas P2P, balanceando custos operacionais.

---

## Dependências por onda

A tabela abaixo rastreia os conceitos associados à engine de promoção de conexões. Conceitos de ondas futuras permanecem como Foam placeholders.

| slug | onda | status |
|:-----|:-----|:-------|
| [[peer-id]] | 2 | criado |
| [[relay-trust-model]] | 5 | criado |
| [[swarm-registry]] | 5 | criado |
| [[global-network-throttle]] | 5 | Foam placeholder (Onda 5) |
| [[sync-worker]] | 7 | Foam placeholder (Onda 7) |
| [[specification]] | 8 | criado |
| [[local-first]] | 12 | Foam placeholder (Onda 12) |
| [[pragmatismo-topologico]] | 12 | Foam placeholder (Onda 12) |

---

## Aparições a consolidar

Rastreamento de arquivos e locais a consolidar nas etapas subsequentes.

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `docs/glossary.md` | `§ConnectionPromotionEngine` | Substituir por resumo curto e link `[[connection-promotion-engine]]` |
| `docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md` | `§2.5.1` | Preservar conteúdo normativo; inserir referência wikilink `[[connection-promotion-engine]]` |
| `docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md` | `§7.2` | Substituir menção textual por referência wikilink `[[connection-promotion-engine]]` |


