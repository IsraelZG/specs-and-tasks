---
title: Global Network Throttle
slug: global-network-throttle
aliases: ["GlobalThrottle", "global-network-throttle", "Global Network Throttle", "Alocação de Banda entre Swarms"]
tags: [sdk, transporte, network]
modo: canonical
---

# Global Network Throttle

**Modo canonical** — fonte normativa: `rfc-transporte-p2p-v3.1.md §3.2.5`. Glossário (`glossary.md §GlobalThrottle`) consolidado aqui.

> Aparições consolidadas:
> - `glossary.md §GlobalThrottle` — definição curta (canonical aqui).
> - `rfc-transporte-p2p-v3.1.md §3.2.5` — alocação por visibilidade, topologia dinâmica e degradação em mobile (fonte normativa principal).
> - `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §7` — quotas, topologia reversa e mobile.

---

## Definição

O **Global Network Throttle** (geralmente referido como `GlobalThrottle`) é o componente do [[sync-worker]] encarregado de regular e arbitrar a alocação de banda e recursos de rede (incluindo soquetes do sistema operacional) entre múltiplos swarms de sincronização ativos em paralelo no mesmo dispositivo (por exemplo, diferentes workspaces abertos simultaneamente em abas do navegador). Ele gerencia prioridades com base na visibilidade da interface do usuário (aba ativa vs. aba visível vs. abas em background) e aplica políticas de degradação agressivas em dispositivos móveis sob limitações de bateria ou uso de dados celulares.

---

## Por quê ([[vision]])

A plataforma adota o paradigma [[local-first]] e opera em redes distribuídas oportunísticas. O Global Network Throttle permite aos peers gerirem eficientemente seus recursos locais ao participar de múltiplos swarms simultaneamente. Sem esse mecanismo, a competição concorrente por largura de banda saturaria a conexão de rede local, exauriria as conexões simultâneas permitidas pelo navegador (tipicamente limitadas a ~30 sockets no WebRTC) e causaria desgaste severo na bateria e consumo excessivo de dados móveis em dispositivos leves. A alocação proporcional aos estados visuais da interface do usuário garante a fluidez no espaço de trabalho ativo do usuário, mantendo a replicação em segundo plano em níveis controlados.

Para detalhes de produto e a visão de transporte como recurso comum gerido pela rede, consulte o [caderno-1-vision/01-vision-and-positioning.md](file:///c:/Dev2026/Docs/docs/caderno-1-vision/01-vision-and-positioning.md#L11-L28).

---

## Contrato ([[protocol]])

O comportamento e as regras de controle do `GlobalThrottle` obedecebem aos contratos descritos em [rfc-transporte-p2p-v3.1.md §3.2.5](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L448-L471). A alocação e o remanejamento seguem as seguintes especificações formais:

### Cotas de Banda por Visibilidade

A largura de banda e os recursos de soquetes locais são distribuídos com base no estado de foco do workspace:

| Prioridade | Estado da Aba/Swarm | Quota de Banda | Sockets |
| :--- | :--- | :--- | :--- |
| 1 | Aba ativa (foco do usuário) | 70% da banda | Conexão direta (STUN/WebRTC) |
| 2 | Aba visível (não ativa) | 20% da banda | Relay ancorado (Super Peer) |
| 3 | Abas em background | 10% (dividido) | Relay ancorado |

### Topologia Dinâmica e Modo Reverso

Swarms transferidos para background disparam o comportamento inverso na [[connection-promotion-engine]]:
1. O peer local fecha voluntariamente as conexões P2P diretas (STUN).
2. O tráfego do swarm em background migra inteiramente para conexões relays ancoradas em Super Peers.
Isso previne que o limite de conexões simultâneas do navegador ou do SO seja estourado por abas inativas.

### Degradação em Mobile

Em dispositivos móveis, o throttle implementa restrições adicionais sob condições físicas adversas:
- **Bateria < 30%:** Swarms em background são pausados (0% de banda, fechamento completo de sockets), suspendendo a reconciliação e o gossip passivos.
- **Dados Móveis (4G/5G):** Aplica-se a mesma política, permitindo apenas a sincronização do swarm da aba ativa.
- **Reavaliação:** O throttle reavalia o status a cada ciclo de sync ou a cada 30 segundos (o que ocorrer primeiro).

---

## Implementação ([[sdk]])

A execução do Global Network Throttle é processada em segundo plano dentro do [[sync-worker]] para preservar a thread principal da UI. 

- **Token Bucket por Swarm:** A banda é controlada por meio de um algoritmo de *Token Bucket* recarregado proporcionalmente à quota designada. Swarms estáveis sem divergências detectadas pelo anti-entropy consome 0 tokens do bucket, permitindo que a banda ociosa seja redistribuída.
- **Coordenação com SwarmRegistry:** O throttle interage com o [[swarm-registry]] para rastrear os peers ativos e gerenciar a abertura e fechamento de sockets físicos.
- **Sensores de Hardware:** O worker monitora o estado de energia via Battery Status API (`navigator.getBattery`) e a rede móvel via Network Information API para modular as restrições em tempo de execução.

Para a arquitetura detalhada dos workers e o ciclo de vida em memória no cliente, consulte o [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §7](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#L163-L187).

---

## Evolução ([[governance]])

As cotas de banda por prioridade, os limites de bateria e os temporizadores de reavaliação do Global Network Throttle são parametrizados nas especificações de governança de rede (`SPECIFICATION:NETWORK_GOVERNANCE`). Ao aderir à rede, o peer concorda em ceder seus recursos de rede de acordo com esses parâmetros em troca de conectividade e redundância dos seus próprios dados.

Para a governança geral e o ciclo de vida de especificações, consulte o [caderno-4-governance/03-specification-lifecycle-and-rfcs.md](file:///c:/Dev2026/Docs/docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md).

---

## Dependências por onda

A tabela abaixo lista os conceitos associados ao Global Network Throttle. Dependências de ondas futuras são marcadas e mantidas como Foam placeholders.

| slug | onda | status |
|:-----|:-----|:-------|
| [[peer-id]] | 2 | criado |
| [[noise-xx]] | 2 | criado |
| [[rbsr]] | 4 | criado |
| [[connection-promotion-engine]] | 5 | criado |
| [[relay-trust-model]] | 5 | criado |
| [[swarm-registry]] | 5 | criado |
| [[graph-based-routing]] | 5 | criado |
| [[private-swarm]] | 5 | Foam placeholder (Onda 5) |
| [[automerge-repo]] | 6 | Foam placeholder (Onda 6) |
| [[sync-worker]] | 7 | Foam placeholder (Onda 7) |


