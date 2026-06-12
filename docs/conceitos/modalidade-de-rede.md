---
name: modalidade-de-rede
title: "Modalidade de Rede"
aliases: ["modalidade de rede", "modalidades de rede", "modalidades", "rede pública", "rede corporativa whitelabel", "rede P2P pura", "redes são silos"]
tags: [vision, governanca, produto]
modo: canonical
---

# Modalidade de Rede

## Definição

Uma **modalidade de rede** define o modelo de governança, identidade e infraestrutura da rede de dados distribuída na Plataforma Projeto SuperApp V0.41. Enquanto o formato de distribuição de software (Cloud, Web, Desktop ou Mobile) estabelece onde o código físico é executado, a modalidade de rede rege o modo como novos peers participam, como as identidades são validadas e como os dados são replicados e custodiados. O sistema suporta nativamente três modalidades de uso através de diferentes configurações de [[specification]]s: rede pública, rede corporativa whitelabel e rede P2P pura.

---

## Por quê ([[vision]])

A plataforma unifica sob um mesmo núcleo arquitetural as três modalidades de rede para garantir eficiência, interoperabilidade interna e adequação topológica. Essa flexibilidade é fundamentada no **[[pragmatismo-topologico]]** <!-- Foam placeholder — Onda 12 -->: o sistema adota P2P opportunisticamente para obter resiliência local, mas permite mecanismos centralizados onde estes oferecem garantias superiores (como facilidade de login, backups ou oráculos regulados).

O detalhamento da visão de produto e das modalidades está em **[[caderno-1-vision/01-vision-and-positioning#4-modalidades-de-rede]]**.

As três modalidades suportadas são:

### 1. Rede Pública
Rede de livre adesão, com livre criação de contas.
* **Infraestrutura**: O fundador inicial mantém infraestrutura Cloud para sinalização, snapshots e disponibilidade.
* **Identidade**: Usuários criam livremente seu [[profile-authentication]]. A verificação combina auto-atestação, reputação ([[asset-reputation]]), KYC opcional e curadoria.

### 2. Rede Corporativa Whitelabel
Rede fechada operada por uma empresa (intranet + ERP + CRM).
* **Infraestrutura**: A empresa opera infraestrutura própria (servidores locais ou nuvem privada) com armazenamento redundante de alta disponibilidade.
* **Identidade**: Provisionada centralmente (SSO/AD/Okta). Personas profissionais ([[profile-persona]]) são delegadas pela empresa aos funcionários. As [[specification]]s de rede governam regras complexas e fluxos BPMN corporativos. Ver mais em [[rede-corporativa-whitelabel]] <!-- Foam placeholder — Onda 12 -->.

### 3. Rede P2P Pura
Rede sem qualquer infraestrutura central, de soberania absoluta do usuário.
* **Infraestrutura**: Sem fundador permanente. Descoberta via QR code / convite físico ou trackers comunitários.
* **Limitações**: Funções não-comutativas (fintech regulada, quórum corporativo sequencial) não estão disponíveis ou são fortemente degradadas.

---

## Contrato ([[protocol]])

As modalidades de rede operam sob as seguintes invariantes criptográficas e estruturais:

### Redes São Silos
As redes são isoladas arquiteturalmente e não se comunicam entre si. Cada rede possui:
- Seu próprio `PROFILE:AUTHENTICATION` separado;
- Seu próprio banco de dados SQLite local isolado;
- Seus próprios peers e canais de sincronização;
- Seus próprios direitos de acesso (permissions e roles).

Não há identidade única global nem sincronização de dados inter-redes.

A governança do comportamento operacional de uma modalidade é ditada por nós do tipo [[specification]]. O modelo de protocolo e a ontologia do grafo estão descritos em **[[caderno-2-protocol/01-graph-ontology]]** e o gerenciamento de identidades em **[[caderno-2-protocol/02-cryptographic-lineage-and-auth]]**.

### Variantes por Modalidade

As três modalidades diferem em dimensões críticas de protocolo e operação:

| Dimensão | P2P Puro | Pública | Corporativa |
| :--- | :--- | :--- | :--- |
| **Identidade / Sybil** | Autogerada; [[asset-invite|convite-como-ASSET:INVITE]] + diversidade + [[bond-caucao]] | Validada por autoridade (resolvido na porta) | SSO (resolvido na porta) |
| **Serialização (default)** | `quorum` bizantino sobre anel de custódia | `quorum` entre validadores licenciados | `leader` = super peer |
| **Sob partição** | [[congelamento-escopado]] à linhagem | Idem; autoridade tende a estar presente | Raro; failover por lease |
| **Economia de contribuição** | Encorajada (essencial p/ regular abuso) | Encorajada (autoridade pode subsidiar leves) | Opcional (desligada por padrão) |
| **Integridade do agente** | Auditoria + [[desafio-canary]] determinísticos | + suíte de honeypots da autoridade | + honeypots; alta confiança base |
| **Retenção forense** | Faltas de validador perpétuas | Idem, em super peers | Idem, em super peers |

---

## Implementação ([[sdk]])

A nível de SDK, o comportamento da plataforma se adapta conforme a modalidade configurada e as limitações do dispositivo ativo:
- A descoberta física de peers adapta-se às restrições de cada ambiente. Em redes públicas ou corporativas, são utilizados sinalizadores Cloud (WebRTC); em redes P2P puras, o roteamento inicial depende de convites diretos ou trackers.
- O roteamento e replicação utilizam consistent hashing e fatores de replicação parametrizados nas especificações de cada rede.
- O SDK implementa o princípio da adequação transparente, permitindo degradações de tier caso os recursos locais (em dispositivos móveis ou browsers) estejam limitados.

Os detalhes técnicos de armazenamento e sincronização encontram-se em **[[caderno-3-sdk/01-sqlite-and-projections-schema]]** e **[[caderno-3-sdk/02-sync-worker-and-memory-lifecycle]]**.

---

## Evolução ([[governance]])

Cada rede nasce a partir de um ato de bootstrap conduzido por um fundador (um peer único ou um conselho/board), o qual opera o [[peer-do-sistema]] <!-- Foam placeholder — Onda 12 --> inicial responsável pelo onboarding de novos participantes. Conforme detalhado em **[[caderno-4-governance/03-specification-lifecycle-and-rfcs]]**, os privilégios regulatórios e chaves de fundação podem ser dissolvidos irreversivelmente em favor de um modelo descentralizado de quórum ou transição definitiva para uma topologia P2P pura.

---

## Dependências

| conceito | onda | status |
|:---|:--|:---|
| [[specification]] | 1 | criado |
| [[profile-authentication]] | 3 | criado |
| [[profile-persona]] | 3 | criado |
| [[asset-reputation]] | 10 | Foam placeholder (Onda 10) |
| [[rede-corporativa-whitelabel]] | 12 | Foam placeholder (Onda 12) |
| [[pragmatismo-topologico]] | 12 | Foam placeholder (Onda 12) |
| [[honestidade-radical]] | 12 | Foam placeholder (Onda 12) |
| [[fundador]] | 12 | Foam placeholder (Onda 12) |
| [[peer-do-sistema]] | 12 | Foam placeholder (Onda 12) |

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `caderno-1-vision/01-vision-and-positioning.md` | `§4` | Substituir seções explicativas por links para [[modalidade-de-rede]] |
| `glossary.md` | `§Modalidade de Rede` | Substituir definição por link explicativo para [[modalidade-de-rede]] |


