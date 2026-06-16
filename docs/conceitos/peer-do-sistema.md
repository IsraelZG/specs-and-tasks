---
title: Peer do Sistema
slug: peer-do-sistema
aliases: ["peer do sistema", "peer especial", "peer-do-sistema"]
tags: [vision, protocol, sdk]
modo: canonical
fonte-canonica: docs/glossary.md §Peer do Sistema
aparicoes-consolidadas:
  - glossary.md §Peer do Sistema
  - caderno-1-vision/01-vision-and-positioning.md §5
  - caderno-2-protocol/02-cryptographic-lineage-and-auth.md §4.1.1
  - caderno-2-protocol/03-set-reconciliation-protocol.md §3.1 e §5
  - caderno-3-sdk/06-connectors.md §2
  - caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.4.2, §3.2.4 e §3.2.4.1
dependencias:
  - [[fundador]]
  - [[profile-system]]
  - [[notification-connector]]
  - [[asset-invite]]
  - [[first-peer-protocol]]
  - [[swarm-registry]]
  - [[connection-promotion-engine]]
  - [[relay-trust-model]]
---

# Peer do Sistema

## Definição

O **Peer do Sistema** é um peer especial operado pelo [[fundador]] da rede, encarregado de funções de bootstrap, sinalização (signaling), fornecimento de snapshots de bootstrap e garantia de redundância/disponibilidade definitiva do grafo de dados. Trata-se de uma entidade de infraestrutura always-on que auxilia no onboarding de novos peers e suporta capacidades que exigem conectividade de canal lateral (out-of-band), atuando sob o papel de um [[profile-system]] sem contudo violar a soberania e a criptografia local-first do ecossistema.

## Por quê

Para viabilizar o ciclo de vida e a acessibilidade inicial das redes nas modalidades públicas e corporativas (ver [[vision]]). Como a plataforma adota o paradigma local-first sem impor dependências permanentes de servidores centralizados, a entrada de novos dispositivos em estados de "frio absoluto" (sem grafo e sem histórico de peers) ou a recuperação de acesso a contas (Central Custody) demandam uma âncora de infraestrutura estável. O peer do sistema oferece um ponto de encontro always-on para sinalização de rede e despacho de segredos de uso único (como links de convite e tokens de reset), permitindo que redes operem com facilidade comercial e operacional de forma compatível com redes puramente descentralizadas.

## Contrato

O comportamento e a semântica criptográfica do Peer do Sistema estão estabelecidos em [[caderno-2-protocol/02-cryptographic-lineage-and-auth#411-autenticação-corporativa-sem-sso-usuáriosenha-email-2fa]], [[caderno-2-protocol/03-set-reconciliation-protocol]] e [[caderno-5-transport/01-p2p-transport-and-reconciliation#242-canais-outofband-primeira-conexão-cold-start]]:

- **Bootstrap Frio Absoluto**: Quando uma identidade realiza o primeiro login no dispositivo (frio absoluto), a URL do peer do sistema, formatada com fragment (`https://suarede.com/sync#multiaddr=...`), é um dos canais válidos para o primeiro contato. O uso do fragment (`#`) impede que o endereço multiaddr do peer seja registrado nos logs do servidor web intermediário.
- **Relay e Sinalização**: Em modalidades gerenciadas, o peer do sistema é o relay always-on responsável pelo primeiro contato em WAN direto, facilitando o estabelecimento de túneis WebRTC entre os demais peers.
- **Redundância e snapshots**: O peer do sistema garante a persistência redundante mantendo o grafo integral como fallback definitivo de bootstrap. Ele gera o **Snapshot de Bootstrap**, um arquivo estático compactado que consolida as tabelas `nodes` e `edges` de um grupo/contexto em estado **Podado** (apenas metadados e assinaturas, sem payloads pesados ou sensíveis).
- **Recuperação por E-mail (Central Custody)**: No modelo de custódia centralizada, a chave mestra do usuário fica cifrada sob a chave da empresa no peer do sistema, sendo que o reset administrativo e o despacho do token dependem do peer do sistema.
- **Validação de Convites**: O peer do sistema participa da cerimônia de consumo de convites (`ASSET:INVITE`) verificando a assinatura do emissor e invalidando o convite ao registrá-lo como lápide no grafo.

## Implementação

A integração com SDK e os conectores externos estão detalhados em [[caderno-3-sdk/06-connectors#1-contrato-comum-rfc-007-a2]] e [[caderno-5-transport/01-p2p-transport-and-reconciliation#3241-os-dois-modelos-de-gênese]]:

- **Especificações Guiadas por Inversão de Controle (IoC)**: O peer do sistema resolve de forma spec-driven os conectores de notificação. A especificação (`SPECIFICATION`) declara o conector e o template desejado, e o peer do sistema despacha a mensagem via interface `NotificationConnector` (e-mail via SMTP, SMS via Twilio ou WhatsApp API).
- **Isolamento de Credenciais**: As chaves de API e credenciais de servidor (ex: SMTP keys) são configuradas localmente na infraestrutura privada do operador do peer do sistema, permanecendo estritamente fora do grafo distribuído.
- **Gênese e Infraestrutura Física**: Na gênese pública ou corporativa, o fundador inicializa o peer do sistema a partir de um workspace local. Ele não exige necessariamente uma infraestrutura Cloud; o requisito primário é a alcançabilidade pública e o uptime elevado, podendo ser hospedado em um ambiente de nuvem gerenciada ou em uma máquina física Desktop com portas expostas/forward em redes corporativas locais (LAN-bound).

## Evolução

As responsabilidades regulatórias e os serviços do peer do sistema adaptam-se conforme a evolução da rede (ver [[governance]]):

- **Dissolução para P2P Puro**: Ao longo do tempo, o fundador pode evoluir a rede alterando a especificação de governança (`SPECIFICATION:NETWORK_GOVERNANCE`) para extinguir irreversivelmente seus poderes centrais. Se a rede transitar para um modelo P2P puro, a dependência do peer do sistema é eliminada.
- **Degradação de Capacidades**: Em ambientes puramente P2P (sem um peer do sistema ativo), capacidades corporativas e de infraestrutura assistida são degradadas. Funcionalidades como "recuperação por e-mail" são desativadas de forma modality-gated por falta de um conector de saída out-of-band confiável, e a descoberta e o bootstrap de rede passam a depender exclusivamente de mDNS, links multiaddr compartilhados manualmente, ou redes de confiança de vizinhos (Web-of-Trust).

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `docs/glossary.md` | `§Peer do Sistema` | Substituir a definição textual pelo link `[[peer-do-sistema]]`. |
| `docs/caderno-1-vision/01-vision-and-positioning.md` | `§5` | Referenciar o conceito usando `[[peer-do-sistema]]`. |
| `docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md` | `§4.1.1` | Referenciar o papel usando `[[peer-do-sistema]]`. |
| `docs/caderno-2-protocol/03-set-reconciliation-protocol.md` | `§3.1` e `§5` | Referenciar o backup e snapshot do `[[peer-do-sistema]]`. |
| `docs/caderno-3-sdk/06-connectors.md` | `§2` | Referenciar o papel e capacidades do `[[peer-do-sistema]]`. |
| `docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md` | `§2.4.2`, `§3.2.4` e `§3.2.4.1` | Referenciar o `[[peer-do-sistema]]` nos fluxos de bootstrap e gênese. |


