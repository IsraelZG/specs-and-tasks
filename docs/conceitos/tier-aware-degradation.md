---
title: "Tier-aware Degradation"
aliases: ["tier-aware-degradation", "Tier-aware Pause", "degradação de tier", "adequação transparente"]
tags: ["vision", "sdk", "transporte", "mobile"]
modo: canonical
---

# Tier-aware Degradation

## Definição

**Tier-aware Degradation** é a capacidade do sistema de adaptar seu comportamento e consumo de recursos (CPU, bateria, banda e armazenamento) com base na capacidade de hardware e estado operacional do dispositivo hospedado, garantindo total transparência ao usuário e salvaguardando a integridade e durabilidade dos dados distribuídos na rede.

## Por quê ([[vision]])

No paradigma [[local-first]], a plataforma precisa ser executada de forma flexível em múltiplos formatos de distribuição de software (de servidores Cloud estáveis e potentes a dispositivos Mobile com restrições severas de consumo). A degradação de tier baseia-se no **Princípio da Adequação Transparente** (ver [[caderno-1-vision/01-vision-and-positioning#22-princípio-da-adequação-transparente]]), que estabelece:
* **Transparência e Controle:** O sistema deve se adaptar automaticamente, mas sempre comunicando essas adaptações de forma clara ao usuário, oferecendo controle direto para escolher entre performance ou funcionalidade com base em seu próprio julgamento.
* **Proposta Ativa de Ações:** O sistema evita reduzir a qualidade silenciosamente ou forçar configurações degradadas sem consentimento. Quando necessário, propõe ativamente as ações corretivas (ex: *"Manter histórico extenso no dispositivo está prejudicando o desempenho. Liberar espaço com backup?"*).
* **Restrições Específicas do Dispositivo:** Em formatos Mobile (ver [[caderno-1-vision/01-vision-and-positioning#34-mobile]]), restrições de bateria e políticas restritivas do sistema operacional (como suspensão de processos em segundo plano e limites de sockets de rede) impõem a aplicação ativa de degradação de tier para viabilizar a operação.

## Contrato ([[protocol]])

No nível do protocolo de transporte e persistência, a degradação de tier manifesta-se por meio de regras de mitigação que garantem a segurança criptográfica e evitam a perda de consistência (ver [[caderno-5-transport/01-p2p-transport-and-reconciliation]]):
* **Desativação de Heartbeats:** Em dispositivos móveis sob economia de energia (bateria < 15%), o heartbeat explícito (mensagens periódicas PING/PONG a cada 15 s) é desativado para poupar recursos. O sistema confia apenas nos timeouts naturais do protocolo [[rbsr]] para a remoção de conexões fantasma.
* **Limitação de Conexões:** Dispositivos sob economia de energia limitam conexões ativas a no máximo 2 peers WebRTC (limite imposto pelo SO). Como consequência, o dispositivo fica impossibilitado de executar o protocolo de gossip com quórum suficiente para atingir o Replication Factor ($N=3$) exigido para as operações de replicação e custódia.
* **Bloqueio de Poda:** Sob essa restrição de conexão, o dispositivo móvel suspende a validação de replicação externa, o que impede a exclusão segura de dados locais para evitar que fragmentos de informações fiquem sem custódia na rede.

## Implementação ([[sdk]])

A degradação de tier é controlada e orquestrada de forma assíncrona pelo [[sync-worker]] na camada do SDK (ver [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle]]):

* **Tier-aware Pause do Garbage Collection (G4):** A execução do Garbage Collector híbrido (G4) e a compactação com conversão de registros de integral para podado (`retention_state = 'pruned'`) são **pausadas automaticamente** se a degradação de tier por bateria baixa estiver ativa (ver [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#4-garbage-collection-híbrido-g4-e-quotas]]):
  > **Restrição de Bateria (Tier-aware Pause)**: A execução do G4 e a poda de payloads são **pausadas automaticamente** se a degradação de tier por bateria baixa estiver ativa. Como o mobile em economia de energia limita conexões a no máximo 2 peers WebRTC, ele não consegue rodar o protocolo de gossip com quórum suficiente para garantir o Replication Factor ($N=3$) exigido antes de podar, evitando perda permanente de dados na rede.
* **Alocação Dinâmica de Banda (Global Network Throttle):** O `GlobalThrottle` (ver [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#7-global-network-throttle-alocação-de-banda-entre-swarms]]) ajusta as quotas de socket e processamento para economizar energia física e limites de rede tarifada:
  * Quando a bateria do dispositivo móvel cai para menos de 30% ou sob uso de dados móveis (4G/5G), todos os swarms associados a abas/workspaces em background são imediatamente pausados (0% de banda alocada e fechamento voluntário de sockets/túneis WebRTC, migrando-os para relays simples).
  * Apenas o swarm pertencente à aba ativa (foco do usuário) continua realizando a sincronização de dados.

## Evolução ([[governance]])

As regras de ativação da degradação (gatilhos de 15% e 30% de bateria, restrições tarifárias de 4G/5G) e a prioridade de alocação de banda não estão codificadas de maneira rígida no núcleo da plataforma. Elas são declaradas como parâmetros governados pelas `SPECIFICATION`s de rede (ver [[caderno-4-governance/03-specification-lifecycle-and-rfcs]]), permitindo que cada rede adeque as estratégias de degradação e consumo de hardware ao seu perfil de conformidade e governança.

## Dependências

Abaixo estão os conceitos dos quais o `tier-aware-degradation` depende diretamente:

| conceito | onda | status |
|:---|:---|:---|
| [[local-first]] | 11 | placeholder |
| [[first-peer-protocol]] | 5 | criado |
| [[rbsr]] | 4 | criado |
| [[sync-worker]] | 7 | criado |
| [[g4-garbage-collection]] | 7 | criado |
| [[global-network-throttle]] | 5 | criado |
| [[modalidade-de-rede]] | 12 | criado |

*Nota: Dependências que pertençam a ondas futuras ou que não constituam verbetes independentes na Fase 2 permanecem como placeholders no grafo do Foam.*

## Aparições a consolidar

Este conceito é redefinido ou detalhado nos seguintes arquivos, cujas passagens devem ser consolidadas em favor deste verbete:

* [[tier-aware-degradation]] — Definição preliminar no glossário.
* [01-vision-and-positioning.md](../caderno-1-vision/01-vision-and-positioning.md#L26-L32) — Seção §2.2 (Princípio da Adequação Transparente) e §3.4 (Mobile).
* [02-sync-worker-and-memory-lifecycle.md](../caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#L86) — Seção §4 (Restrição de Bateria / Tier-aware Pause do G4) e §7.3 (Degradação em Mobile do Global Network Throttle).


