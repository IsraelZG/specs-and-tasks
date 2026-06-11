# RFC — Camada de Transporte P2P e Malha de Reconciliação (Plataforma V3.1)

> **Status:** Proposta Consolidada (substitui a RFC de Transporte V3)
> **Escopo:** Camada de transporte, descoberta, reconciliação de conjuntos e ciclo de vida do swarm. **Não** cobre ontologia do grafo, modelo de chaves de conteúdo, eleição de committer de documentos colaborativos nem governança de validação — esses residem nos cadernos 2, 3 e 4 e são referenciados onde a fronteira é tocada (ver Apêndice A).
> **Convenção de leitura:** o documento aprofunda progressivamente. **§1 Visão** é para liderança de produto e arquitetura; **§2 Protocolo** é para engenheiros de protocolo; **§3 SDK** é para desenvolvedores de cliente; **§4 Governança** é para fundadores e operadores de rede.
> **Nota v4:** §4.6 atualizada para congelamento escopado por linhagem; demais seções inalteradas. Ver `rfc-001-v4.md`.

---

## §1 — Visão (Liderança de Produto & Arquitetura)

### 1.1 Objetivo

Esta camada viabiliza um ecossistema de dados distribuído com filosofia **Local-First**, capaz de operar em modo **P2P oportunístico** (ou **P2P puro**, na modalidade que assim o exigir): descoberta de pares, sincronização de estado relacional complexo e transporte de arquivos pesados (BLOBs) sem dependência estrita de servidores centrais, preservando bateria e conexões de nós leves.

O transporte é tratado como uma **entidade autogerida separada dos peers**. Ao consentir com os termos da plataforma — mesmo em rede P2P pura — o peer concorda em dedicar parte de seus recursos (armazenamento, banda, uplink) à comunidade. A plataforma faz a autogestão desses recursos com base em telemetria de rede, ranking e score de cada peer, podendo fixar dados em peers específicos automaticamente. O peer é um nó de uma malha gerida, não um voluntário isolado.

### 1.2 [[pragmatismo-topologico|Pragmatismo Topológico]]

O sistema é P2P-*first*, não P2P-purista. Forma malhas descentralizadas sempre que possível, mas usa instâncias de maior capacidade (Desktops, Super Peers, Cloud) de forma transparente para superar restrições físicas de rede (NATs, firewalls) e garantir disponibilidade. Centralizar onde a centralização serve melhor não torna o sistema "menos P2P" — torna-o honesto sobre o que cada topologia oferece. A escolha é decisão de `SPECIFICATION` da rede, não dogma da plataforma.

### 1.3 [[honestidade-radical|Honestidade Radical]] Aplicada ao Transporte

Limitações inerentes ao paradigma são declaradas, não escondidas. Em particular, esta RFC assume explicitamente três verdades desconfortáveis:

1. **Travessia de NAT simétrico falha com frequência.** Hole punching via STUN não resolve NAT simétrico de forma confiável; nesse caso o relay (TURN-like) **permanece** sendo o caminho, e a promoção para conexão direta só se concretiza nos casos não-simétricos. O sistema não promete uma malha 100% direta.
2. **Identidade é barata de criar, mas o acesso não é livre.** Derivar o [[peer-id]] da chave pública impede *spoofing*, mas **não** confere resistência a Sybil por si só. A resistência a Sybil vem do **custo de criação de identidade e do modelo de acesso por convite / web-of-trust** (§1.4), não da função de hash.
3. **A rede transacional tem liveness condicionada.** Operações não-comutativas dependem de validadores ativos. Sem eles, a rede **congela em read-only** — um *freeze* seguro, não um *crash* (§4.6).

### 1.4 Acesso por Convite e Web-of-Trust

Mesmo em P2P puro, a rede **não é, por padrão, de livre acesso**. A plataforma incentiva modelos de acesso por convite que formam uma **web-of-trust**: um novo [[peer-id]] entra na malha apresentando uma cadeia de credenciais ([[ucan|UCAN]]) emitida por quem já pertence. A criação de identidade tem custo deliberado (prova de trabalho leve, convite assinado, ou provisionamento corporativo, conforme a modalidade). Isso transforma um ataque Sybil de "gratuito e ilimitado" em "caro e rastreável", e dá ao mecanismo de eleição de emergência (§4.6) uma base de contagem de peers que não é trivialmente inflável.

### 1.5 As Três Modalidades e o Transporte

| Modalidade | Disponibilidade de dados | Travessia/Relay | Custódia |
| :--- | :--- | :--- | :--- |
| **P2P Puro** | Replication factor por gossip ($N$ peers) | Relays entre peers, sem garantia central | Anel de custódia distribuído (§4.2) |
| **Corporativa** | Super Peer mantém 100% íntegro | Super Peer como relay garantidor | Manifesto de retenção do Super Peer |
| **Pública** | Sharding determinístico ([[consistent-hashing|consistent hashing]]) + peer de sistema como fallback | Mix de relays e peer de sistema | Anel de custódia + fallback de sistema |

> **Capacidade modality-gated (RFC-005 §A.6):** nas modalidades com peer do sistema (Corporativa e Pública), o peer do sistema oferece o **Push Connector content-blind** ([[push-cego]]; caderno-3/06 §5) como capacidade de ingresso — acordar dispositivos suspensos sem violar E2E. Em P2P puro a capacidade não existe (não há operador de push).

---

## §2 — Protocolo (Engenheiros de Protocolo)

### 2.1 Stack de Transporte

A camada de rede orquestra tecnologias especialistas em vez de um protocolo monolítico:

- **Storage local & grafo:** SQLite (fonte da verdade semântica e criptográfica).
- **Malha de roteamento e gossip:** [[automerge-repo|Automerge Repo]], usado **estritamente** por seus *Network Adapters* e pelo canal de [[ephemeral-messages|Ephemeral Messages]] de baixa latência (não como armazenamento de CRDT do grafo).
- **Descoberta de swarms:** Mainline DHT (Kademlia) customizável via UDP, combinada com mDNS para LAN.
- **Sinalização WebRTC e túneis:** WebSockets e STUN integrados.
- **Transporte de BLOBs:** protocolo WebTorrent/BitTorrent isomórfico, isolado do grafo (§3.3).
- **Serialização e framing:** MessagePack + Length-Prefixed Framing, com versionamento e quarentena de versão futura — normativo em [[caderno-2-protocol/05-wire-protocol]] (RFC-005 §A.2).

### 2.2 Identidade Criptográfica Determinística

O identificador de rede ([[peer-id]]) não é aleatório e existe em **duas variantes** (RFC-005 §A.5; ver [[delegacao-de-dispositivo]]):

$$\text{DevicePeerId} = \text{blake2s256}(\texttt{DEVICE\_PUB\_KEY}) \qquad \text{PersonaPeerId} = \text{blake2s256}(\texttt{PROFILE:PERSONA\_PUB\_KEY})$$

* **`DevicePeerId`** — identidade **de transporte**, da chave Ed25519 **estável e exclusiva do dispositivo** (gerada no provisionamento, nunca exportada). É o identificador usado no handshake Noise_XX, no `SwarmRegistry`, no `RelayTrustModel` (scores e shadowbans acumulam por dispositivo), no histórico em `device_state.db` e no Graph-Based Routing morno. Por ser estável, preserva a reputação de longo prazo.
* **`PersonaPeerId`** — identidade **de aplicação** (endereçamento, arestas, UCANs), inalterada.

Um dispositivo fala por uma persona apenas mediante delegação no grafo (`ASSET:PERMISSION` + `DELEGATED_TO`, assinada pela identidade-âncora; caderno-2/02 §1.4). **Canal único por par de dispositivos:** uma conexão Noise_XX por par (sobre os `DevicePeerId`), multiplexada em sub-streams; cada mensagem carrega o `PersonaPeerId` emissor e referencia o UCAN, validados por sub-stream. Trocar de persona não abre conexões novas.

Por ser derivado da chave pública Ed25519, o [[peer-id|PeerId]] é **auto-certificável**: uma conexão entrante pode ser ligada matematicamente à sua chave, e o handshake de socket exige um **desafio-resposta** que prova posse da chave privada antes de qualquer troca de dados. Isso elimina *spoofing* de identidades existentes.

> **Importante — fronteira de segurança.** Auto-certificação resolve *spoofing*, não *Sybil*. A resistência a Sybil é responsabilidade do modelo de acesso (§1.4) e da contagem de peers ponderada por score (§4.1), **não** desta derivação.

#### 2.2.1 — Handshake Concreto: Noise Protocol Framework
> ver [[noise-xx]]

O handshake de autenticação adota o Noise Protocol Framework, padrão **Noise_XX**:

1. O Noise_XX roda **após** o estabelecimento do WebRTC Data Channel (SDP exchange concluído), utilizando o data channel como transporte subjacente.
2. O handshake ocorre em **3 round-trips**, trocando:
   - `DevicePeerId` = `blake2s256(DEVICE_PUB_KEY)` (a chave estática do Noise_XX é a **chave do dispositivo**; §2.2)
   - `identity_epoch_index` (índice da **Época de Identidade** vigente; caderno-2/02 §3.1.1 — Épocas de Conteúdo nunca transitam no handshake)
   - Nonce assinado com a chave privada Ed25519 do dispositivo
3. **Validação precoce de época:** Se o `identity_epoch_index` trocado durante o Noise_XX divergir entre os peers, a conexão **não é descartada** — o data channel é imediatamente desviado para o pipeline de **Catch-up de Identidades (Onda 0)**, forçando a sincronização de chaves, delegações de dispositivo e UCANs atualizados antes de qualquer tráfego de domínio.
4. Concluído o Noise_XX com épocas alinhadas, o peer é registrado como **"conectado"** no SwarmRegistry.
5. Falhas criptográficas (assinatura inválida, chave incorreta) resultam em **shadowban de 24h** no RelayTrustModel do peer local.

> **Nota:** Noise_XX foi escolhido por ser o padrão de autenticação mútua do ecossistema libp2p, com implementações disponíveis em WASM (browser) e nativo (Electron/Node). A implementação de referência é `@noise-crypto/noise` ou `noise-c.wasm`.

### 2.3 [[documento-casca|Documentos Casca]] (Rendezvous) Derivados de Capability

A formação da malha WebRTC é orquestrada pelo Automerge Repo via "Documentos Casca" — salas de encontro em RAM, sem histórico de CRDT. O identificador do rendezvous **não** deve ser derivado de IDs previsíveis/enumeráveis (o que permitiria a qualquer um adivinhar a sala e vazar metadados de interesse). Em vez disso, deriva-se de um segredo de capability:

$$\text{RendezvousId} = \text{SHA-256}(\texttt{rendezvous\_secret} \mathbin{\Vert} \texttt{ASSET:PERMISSION\_ID})$$

onde `rendezvous_secret` é distribuído apenas a quem possui o UCAN correspondente. Conhecer o `PERMISSION_ID` sozinho não basta para entrar na sala. Ao conectar-se ao hash, o Automerge forja túneis WebRTC/WebSocket multiplexados entre os interessados daquele swarm.

### 2.4 Descoberta de Peers (Cold/Warm) e Substituição da DHT

A descoberta não é um mecanismo único; é **três estados** com canais distintos. A [[dht-descartada|DHT]] (Kademlia/Mainline) foi **descartada do core**: a versão browser do WebTorrent não fala a DHT (é UDP), o que excluiria justamente web/mobile; e uma DHT privada exigiria bootstrap nodes próprios, sem ser "de graça". A função residual da DHT (achar seeders de um `InfoHash` já conhecido) é coberta por **trackers WSS privados** (que cobrem inclusive browser) ou, em P2P puro, por **PEX (BEP 11) + anel de custódia**.

#### 2.4.1 Os três estados

- **Frio absoluto:** primeiro login da identidade neste device nesta rede. Sem grafo, sem histórico de peers, sem coordenada. Entra **apenas** por canal out‑of‑band: mDNS (LAN), link multiaddr, convite (`ASSET:INVITE`), ou URL do peer do sistema (modalidades geridas). O grafo é inútil aqui. Ver [[bootstrap-frio-absoluto]].
- **Morno (resume):** reabrir o app após desconexão. Há grafo + `device_state.db` (histórico de peers) + identidade. Refresca coordenadas (§2.4.2) e cai na Onda 0 (anti‑entropy O(1)). **A meta de `< 500 ms`** é viável neste estado. Ver [[bootstrap-morno]].
- **Quente (live):** peers descobertos, malha formada, swarm em tráfego. O roteamento é **Graph‑Based**: o histórico de peers (§4.7) + presença efêmera em cache local (não no grafo durável) guia as tentativas de conexão. Sem DHT, sem discovery centralizado.

#### 2.4.2 Canais out‑of‑band (primeira conexão, cold start)

- **mDNS (LAN, sem setup):** multicast local, resposta tipicamente < 1s. Suportado em Desktop/Mobile/Browser (mDNSResponder, Bonjour, Android).
- **Link multiaddr + relay obrigatório (WAN direto):** `multiaddr=/ip4/peer.example.com/tcp/9090/...` pode ser compartilhado via QR, SMS, ou link universal. O primeiro contato **exige um relay SIP ou rendezvous intermeediário** (o relay é **stateless**, não persiste seção) para os dois lados se encontrarem. Em P2P puro, é um **peer amigo** já na rede; em modalidades geridas, é o **peer do sistema** (sempre on).
- **URL do peer do sistema (managed):** exemplo `https://suarede.com/sync#multiaddr=...` — fornecida no onboarding, embedding o endereço do peer. Usa **fragment (`#`), não query string**, para que o endereço do relay/peer não vá ao log do web server.
- **Convite (`ASSET:INVITE`, v4 §4.2) — identidade/onboarding:** asset **consumível**, saldo finito, emissão gateada por standing. Seu propósito é deixar uma pessoa nova **criar cadastro** (`PROFILE:AUTHENTICATION`) sob web‑of‑trust. **Embute um multiaddr** para o primeiro contato, mas o ponto é a criação de identidade avalizada.
- **Payload:** `{ multiaddr/rendezvous hints, invite_code (aponta ao ASSET:INVITE no grafo), inviter_peer_id, assinatura do inviter, expiry }`.
- **Cerimônia de consumo:** invitee conecta → Noise_XX → apresenta `invite_code` → inviter/peer‑do‑sistema valida que o `ASSET:INVITE` está não‑gasto → invitee cria `PROFILE:AUTHENTICATION` → grava aresta `VOUCHES_FOR` (inviter → invitee, staking social) + convite vira lápide.
- **Bearer, single‑use, expiry curto, assinado.** Limite honesto: convite interceptado = conta avalizada pelo inviter — risco contido pela exposição de reputação do inviter, não eliminável.

### 2.5 Topologia Dinâmica e Travessia de NAT

#### 2.5.1 Promoção de Conexões (`ConnectionPromotionEngine`)

A engine de promoção de conexões ([[connection-promotion-engine]]) gerencia a transição oportunística entre conexões via relay (onde Super Peers atuam como relays de circuito) e rotas diretas P2P (via hole punching/STUN) conforme as restrições físicas de NAT de cada peer.

#### 2.5.2 Modelo de Confiança de Relays (`RelayTrustModel`)

O modelo de confiança de relays ([[relay-trust-model]]) calcula scores locais e não-transitivos para avaliar e aplicar shadowban silencioso a relays de baixo desempenho ou com falhas criptográficas, evitando propagação de reputação (badmouthing).

### 2.6 Reconciliação de Conjuntos (Range-Based Set Reconciliation)

A sincronização relacional baseia-se no protocolo de reconciliação de conjuntos ([[rbsr]]), comparando o estado local para transferir exclusivamente o delta sem movimentar bancos inteiros.

#### 2.6.1 Fingerprints (256 bits, sem truncamento)

A representação criptográfica e as propriedades de cacheabilidade dos resumos de dados são geridas por [[fingerprint|fingerprints]] de 256 bits sem truncamento, cuja especificação matemática e comportamento de cacheabilidade estão descritos em [[fingerprint]] ([caderno-2-protocol/03-set-reconciliation-protocol.md#11-modelo-matematico-e-fingerprints](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/03-set-reconciliation-protocol.md#L11-L21)).

#### 2.6.2 Protocolo de Troca

A dinâmica de divisão de ranges, isolamento de IDs divergentes e reidratação cirúrgica de nós e arestas segue o algoritmo recursivo de reconciliação de dados detalhado em [[rbsr]] ([caderno-2-protocol/03-set-reconciliation-protocol.md#12-protocolo-de-troca-e-reconciliacao](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/03-set-reconciliation-protocol.md#L23-L30)).

#### 2.6.3 Fechamento de Range (`RangeFooter`)

Como defesa-em-profundidade, a transferência de qualquer range é acompanhada por um rodapé estruturado, cujos invariantes e regras de validação determinística de contagem e checksum estão descritos em [[range-footer]] ([caderno-2-protocol/03-set-reconciliation-protocol.md#12-protocolo-de-troca-e-reconciliacao](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/03-set-reconciliation-protocol.md#L30-L37)).

#### 2.6.4 Rodada de Desafio com Nonce (sob suspeita)

Havendo suspeita de colisão ou marcação de risco, a sincronização do range afetado migra temporariamente para um modo que introduz nonces dinâmicos, conforme a fórmula e condições especificadas em [[nonce-challenge]] ([caderno-2-protocol/03-set-reconciliation-protocol.md#13-rodada-de-desafio-com-nonce-sob-suspeita](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/03-set-reconciliation-protocol.md#L39-L45)).

### 2.7 Sync Dirigido por Permissions (UCAN)

A sincronização e formação de B-Trees de reconciliação de dados na camada de transporte são governadas exclusivamente por [[sync-dirigido-por-ucan]], cujas regras de filtragem e restrição de subgrafos autorizados residem em [caderno-2-protocol/03-set-reconciliation-protocol.md#2-sync-dirigido-por-permissions-e-ucan](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/03-set-reconciliation-protocol.md#L49-L55).

> **Enforcement bilateral.** A validação é feita pelo lado que **fornece** o dado: ele valida assinaturas e cadeia de delegação do UCAN anexado à requisição antes de servir qualquer delta. Um peer sem UCAN ativo sobre um subgrafo **nunca** recebe, transmite ou verifica fingerprints daquele subgrafo — blindando metadados na camada de transporte.

### 2.8 Sistema de Ondas (Waves)

A sincronização é segmentada em um pipeline de quatro fases para garantir a fluidez da experiência do usuário, cujos conteúdos e limites de latência estão especificados em [[onda]] ([caderno-2-protocol/03-set-reconciliation-protocol.md#4-sistema-de-ondas-waves](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/03-set-reconciliation-protocol.md#L76-L88)).

- A **Onda 0** executa o mecanismo de [[anti-entropy|anti-entropy O(1)]] mediante troca rápida do root fingerprint. A meta de `< 100 ms` aplica-se exclusivamente em malha quente (*resume*); a conexão inicial em *cold start* (envolvendo discovery, NAT traversal e Noise handshake) demanda segundos.
- As fases subsequentes dividem a sincronização em prioridades interativas de background e reidratação lazy de payloads via [[graph-based-routing|roteamento baseado em grafo]].

### 2.9 Wire Protocol Consciente de Época e Relógio (Epoch + HLC)

> **Normativo (RFC-005 §A.2):** a serialização, o framing físico e a evolução de versão do wire protocol estão fixados em [[caderno-2-protocol/05-wire-protocol]] (MessagePack + Length-Prefixed Framing; `LENGTH/VERSION/FRAME_TYPE/PAYLOAD`).

Todo pacote de domínio carrega dois carimbos de ordenação no envelope **assinado**:

1. **`identity_epoch_index`** — índice da **Época de Identidade** vigente (caderno-2/02 §3.1.1; RFC-005 §A.1). Se houver *drift* (rotação de chave de identidade, emissão/revogação de delegação de dispositivo ou revogação de UCAN raiz durante a transferência), a conexão interrompe o RBSR com `STALE_EPOCH`, forçando o *catch-up* de identidades antes de enviar dados de domínio potencialmente não-legíveis. **`STALE_EPOCH` refere-se exclusivamente à Época de Identidade** — divergência de época de conteúdo manifesta-se como negativa do Key Vault na camada de aplicação, nunca no transporte.
2. [[hlc]] ([caderno-2-protocol/02-cryptographic-lineage-and-auth.md#36-ordenação-causal-hlc-e-seleção-de-head](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md#L134)) — O transporte é responsável por **transmitir** e **validar** o HLC; a lógica de seleção de head e de merge de fork vive no caderno de protocolo do grafo (Apêndice A).

### 2.10 — Modelo de Dados e Concorrência

O grafo da Plataforma V3 segue o modelo event-sourcing (append-only). Nenhum registro em `nodes` ou `edges` é atualizado in-place; toda modificação gera novas linhas conectadas via arestas.

#### 2.10.1 — Imutabilidade e Linhagem

A integridade do histórico é protegida pela imutabilidade física das tabelas `nodes` e `edges`. As atualizações lógicas são encadeadas via arestas `MUTATES` para formar a [[linhagem-de-versoes|linhagem de versões]] de cada entidade, cujas regras de validação estrutural e causalidade pelo HLC estão definidas em [caderno-2-protocol/02-cryptographic-lineage-and-auth.md#32-duas-camadas-de-imutabilidade-linhagem-de-versoes](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md). A detecção de concorrência é estrutural (fork), ocorrendo quando duas ou mais arestas `MUTATES` ativas compartilham o mesmo ancestral sem relação de precedência.

#### 2.10.2 — Resolução de Forks

Quando conflitos concorrentes emergem de partições de rede, a convergência é obtida de forma determinística por meio do protocolo de [[fork-resolucao]], cuja especificação de eleição do mergeador e escrita de nós de merge reside em [caderno-2-protocol/04-automerge-integration-spec.md#42-resolucao-de-forks](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/04-automerge-integration-spec.md#L78-L86).

#### 2.10.3 — Deleções (Tombstones)

No modelo append-only, as deleções lógicas são implementadas desativando-se a aresta correspondente (`active = 0`), gerando uma lápide cuja indexação e ciclo de vida até a coleta física pelo G4 são regulados conforme [[tombstone-lapide]] ([caderno-3-sdk/01-sqlite-and-projections-schema.md#22-tombstones-e-active-edges](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/01-sqlite-and-projections-schema.md)).

### 2.11 — Matriz de Classificação de Transporte (As 3 Perguntas)

A camada de transporte adota um modelo de roteamento declarativo e baseado em regras para definir o destino físico e o protocolo de sincronização aplicável a cada nó. Este mapeamento é determinado a partir de [[matriz-de-classificacao-transporte]] (detalhado em [caderno-3-sdk/01-sqlite-and-projections-schema.md#4-matriz-de-classificação-de-transporte-as-3-perguntas](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/01-sqlite-and-projections-schema.md)).

> **Exemplo de enquadramento (RFC-005 §A.8 — recibos de chat):** o recibo *ao vivo* (entregue/lido em sessão) classifica-se como `REPLICABLE_VOLATILE` (ephemeral message; morre com a sessão); o **marco consolidado** "lido até `last_read_hlc`" — um registro por (leitor, conversa), governado por `SPECIFICATION:CHAT_READ_RECEIPT` — classifica-se como `REPLICABLE_AUDITABLE`. Ver [[caderno-3-sdk/07-chat-reference-spec]].

#### 2.11.1 — Inversão de Controle e Roteamento (Implementação)

A classificação e o roteamento físico dos dados são inferidos a partir dos [[transport-hints|transport_hints]] declarados no payload da [[specification]] do nó, permitindo que a infraestrutura selecione automaticamente o canal apropriado (como [[rbsr]], [[ephemeral-messages]] ou [[private-swarm]]) por meio de um fluxo de roteamento de cinco etapas e regras de tipos em TypeScript especificadas em [caderno-3-sdk/01-sqlite-and-projections-schema.md#42-transport_hints](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/01-sqlite-and-projections-schema.md).

`typescript
// Tipagem garantindo que Destino e Protocolo andem sempre juntos
type TransportBehavior =
  | { 
      category: 'REPLICABLE_AUDITABLE'; 
      destination: 'sqlite_nodes_edges'; 
      protocol: 'RBSR'; 
      requiresLineage: true;
    }
  | { 
      category: 'REPLICABLE_VOLATILE'; 
      destination: 'sqlite_pending_changes'; 
      protocol: 'EPHEMERAL_WEBRTC'; 
      requiresLineage: false;
    }
  | { 
      category: 'LOCAL_PERSISTENT'; 
      destination: 'sqlite_user_local'; 
      protocol: 'PRIVATE_SWARM'; 
      requiresLineage: false;
    }
  | { 
      category: 'LOCAL_TRANSIENT'; 
      destination: 'ram_tinybase'; 
      protocol: 'NONE'; 
      requiresLineage: false;
    };

// A função pura de avaliação executada pela infraestrutura
function evaluateTransportHints(
  isObservableByOtherPeers: boolean, 
  isAuditable: boolean, 
  mustSurviveDisconnection: boolean
): TransportBehavior {
  
  if (isObservableByOtherPeers) {
    return isAuditable 
      ? { category: 'REPLICABLE_AUDITABLE', destination: 'sqlite_nodes_edges', protocol: 'RBSR', requiresLineage: true }
      : { category: 'REPLICABLE_VOLATILE', destination: 'sqlite_pending_changes', protocol: 'EPHEMERAL_WEBRTC', requiresLineage: false };
  } else {
    return mustSurviveDisconnection
      ? { category: 'LOCAL_PERSISTENT', destination: 'sqlite_user_local', protocol: 'PRIVATE_SWARM', requiresLineage: false }
      : { category: 'LOCAL_TRANSIENT', destination: 'ram_tinybase', protocol: 'NONE', requiresLineage: false };
  }
}
`

---

## §3 — SDK (Desenvolvedores de Cliente)

### 3.1 Orquestração de Workers

A lógica de transporte e processamento de dados roda fora da Main Thread para garantir a reatividade da interface. A coordenação baseia-se em web workers comunicando-se via Comlink:

- **[[sync-worker|Sync Worker]]:** Web Worker principal de transporte responsável pela persistência durável no SQLite WASM, sincronização via [[rbsr]], orquestração do [[automerge-repo]] e governança de swarms (ver [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#11-sync-worker](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md)).
- **[[crypto-worker|Crypto Worker]]:** Web Worker secundário responsável pela criptografia e validação de assinaturas em lote, hospedando o [[key-vault|Key Vault]] para custódia de chaves em RAM com TTL estrito de 4 h (ver [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#12-crypto-worker](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md)).
- **[[index-worker|Index Worker]]:** Web Worker secundário que reconstrói índices de busca e projeções locais a partir de payloads decifrados (ver [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#13-index-worker](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md)).

### 3.2 Estruturas em Memória

#### 3.2.1 B-Tree de Reconciliação

Cada Sync Worker mantém uma B-Tree em memória com os `id`s ordenados e seus fingerprints individuais (256 bits). O *root fingerprint* é cacheado para o anti-entropy $O(1)$ e invalidado incrementalmente a cada escrita local durável.

#### 3.2.2 `SwarmRegistry`
> ver [[swarm-registry]]

Mapa em RAM de peers ativos com latência, capacidades (tier), score de relay e estado de promoção de conexão. É a fonte para roteamento, shadowban de relay e eleição oportunística de líder de sync.

> **Normativo (RFC-005 §A.5):** o `SwarmRegistry` indexa por **`DevicePeerId`** (identidade de transporte estável; §2.2) e mantém a estrutura auxiliar **`device_personas`** — as personas ativas/atestadas por dispositivo, com a Época de Identidade em que a validação ocorreu. Scores e shadowbans acumulam por dispositivo, não por persona; trocar de persona não abre conexões novas.

**Heartbeat e Health Check:**

O SwarmRegistry mantém a vivacidade dos peers através de um protocolo de heartbeat implícito com fallback explícito:

- **Heartbeat implícito:** Qualquer tráfego recebido no canal de dados (frames do RBSR, Automerge ephemeral messages, ou WebTorrent) zera o timer de inatividade do peer remetente no SwarmRegistry. Não há necessidade de mensagens de keep-alive adicionais enquanto o canal estiver ativo.
- **Heartbeat explícito (PING/PONG):** Se o canal permanecer ocioso por 15 segundos sem tráfego detectado, um PING de 8 bytes é disparado. O peer destino responde com um PONG de 8 bytes + timestamp local.
- **Evicção:** Três falhas consecutivas (45s sem resposta) marcam o peer como inativo:
  - Removido da lista de candidatos do SyncCoordinator
  - Removido como relay elegível no RelayTrustModel
  - Evitado para novas conexões por 5 minutos (cool-off)
  - Se era o líder eleito do sync, re-eleição imediata (§3.2.3)
- **Degradação em economia de energia:** Em dispositivos mobile com bateria < 15%, o heartbeat explícito é desativado. O sistema confia exclusivamente nos timeouts de aplicação (inatividade do RBSR) para limpeza de conexões fantasma.

#### 3.2.3 Coordenação de Sync (anti-*thundering herd*)

Um peer entrando num swarm grande **não** reconcilia com todos. Ele elege oportunisticamente o peer mais capaz/atualizado (o "líder" local) e faz RBSR apenas com ele, deixando o gossip propagar mudanças menores depois. Em malha sem Super Peer, a eleição é **determinística** (ex.: menor `entity_id` ativo no ciclo), evitando mensagens de coordenação; sob partição, cada partição reconcilia internamente e o estado converge na reunificação via RBSR.

**Failover — Timeout e Re-eleição:**

Se o líder eleito falhar durante uma sessão RBSR ativa:

1. **Monitoramento:** Um timer de inatividade de 5 segundos é iniciado para cada sessão RBSR ativa. Cada mensagem RBSR recebida zera o timer.
2. **Desconfiança e PING:** Se o timer expirar sem mensagens, um PING é enviado ao líder. Sem resposta em 2 segundos, o líder é declarado inativo e recebe shadowban temporário no SwarmRegistry.
3. **Rollback da transação WAL:** O `ConcurrentReconciliationGuard` (§3.3) aborta imediatamente a transação de leitura `DEFERRED` aberta no SQLite e executa `PRAGMA wal_checkpoint(TRUNCATE)` para liberar o arquivo `-wal`, prevenindo crescimento infinito.
4. **Re-eleição:** A função determinística (menor `entity_id` ativo) é reaplicada excluindo o líder falho. O próximo da lista é eleito.
5. **Retomada:** Uma nova transação de leitura `DEFERRED` é aberta e o RBSR retoma do último sub-range não resolvido da B-Tree (checkpoint salvo antes do timeout).

#### 3.2.4 — Gênese da Rede (First Peer Protocol)

A inicialização e o cold start da topologia P2P de um swarm são regulados por [[first-peer-protocol]] (ver [caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md#6-gênese-da-rede-—-first-peer-protocol](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md)), que implementa a máquina de estados (JOINING $\to$ WAITING_FOR_SWARM $\to$ CONNECTED | GENESIS | OFFLINE_RETRY).

No estado [[genesis-state|GENESIS]], o peer fundador gera atomicamente os registros de bootstrap: o perfil do administrador, a especificação do workspace e a marca de nascimento de rede [[specification-network-birth|NETWORK_BIRTH]].

**Transição GENESIS → CONNECTED:** Quando um segundo peer se conecta ao genesis, este perde o status `PROVISIONAL_SYSTEM_PEER` e passa a operar como peer normal. O registro `NETWORK_BIRTH` permanece imutável no grafo como prova de fundação.

#### 3.2.4.1 — Os dois modelos de gênese

**Gênese P2P pura (sem peer cloud):** o fundador funda a rede (estado GENESIS, bootstrap token, `NETWORK_BIRTH`). Para trazer o peer #2, gera **um link multiaddr** (se o #2 já tem identidade nesta rede — ex.: outro device do mesmo dono) ou **um convite** (`ASSET:INVITE`, se o #2 é pessoa nova). O multiaddr embarcado resolve o primeiro contato out‑of‑band (mensagem, e‑mail via conector §06, QR) **sem DHT nem cloud**. Após o primeiro sync, o #2 popula seu `device_state.db` → reconexões usam Graph‑Based Routing.

> **Limite honesto operacional:** gerar um link multiaddr pressupõe que o peer **conhece um endereço próprio alcançável**. Em P2P puro com zero relays e ambas as pontas atrás de NAT simétrico, **nem o link estabelece primeiro contato** (verdade desconfortável #1, §1.3). O primeiro contato P2P puro assume **ao menos uma parte alcançável** (LAN, IP público, ou um relay comunitário). Documentar, não esconder.

**Gênese pública/corporativa (com peer do sistema):** o fundador opera o **peer do sistema** — que **não exige cloud**: o requisito é **alcançabilidade + uptime**, satisfazível por Cloud **ou** por um **Desktop com portas abertas/forward** (deployment natural de intranet corporativa LAN‑bound). O primeiro contato é a própria URL/endereço do peer do sistema (um multiaddr always‑on). Cloud é a opção de *disponibilidade gerida*, não um requisito de tecnologia.
- **Limite honesto:** o Desktop‑servidor dá o **papel**, não a **garantia** — se ele desliga, a garantia always‑on cai. Aceitável em LAN corporativa; para corporativo com remotos, exige endereço público + uptime, e um box único é SPOF.

#### 3.2.5 — Global Network Throttle (Alocação de Banda entre Swarms)
> ver [[global-network-throttle]]

Um mesmo peer pode pertencer a múltiplos swarms simultaneamente (ex.: workspaces abertos em abas diferentes). O GlobalThrottle governa a disputa por recursos de rede entre eles:

> **Normativo (RFC-005 §A.4):** o `GlobalThrottle` executa **no contexto dono do banco** (SharedWorker singleton ou aba Líder eleita por Web Locks; ver [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#14-propriedade-do-banco-multi-aba-sharedworker-com-posse-por-web-locks]]). Abas seguidoras nunca abrem sockets próprios de sync.

**Alocação por Visibilidade:**

| Prioridade | Estado da Aba/Swarm | Quota de Banda | Sockets |
| :--- | :--- | :--- | :--- |
| 1 | Aba ativa (foco do usuário) | 70% da banda | Conexão direta (STUN/WebRTC) |
| 2 | Aba visível (não ativa) | 20% da banda | Relay ancorado (Super Peer) |
| 3 | Abas em background | 10% (dividido) | Relay ancorado |

**Topologia Dinâmica (fechamento de túneis diretos):**

Swarms transferidos para background disparam o `ConnectionPromotionEngine` no modo reverso: o peer local fecha voluntariamente túneis P2P diretos (STUN) e migra o tráfego de background inteiramente para conexões ancoradas em Super Peers (Relays). Isso economiza soquetes do SO — cada túnel WebRTC direto consome um socket, e navegadores têm limite de ~30 conexões simultâneas.

**Degradação Extrema (Mobile):**

- Bateria < 30%: swarms em background são pausados (0% de banda, fechamento de sockets).
- Dados móveis (4G/5G): mesma política — apenas o swarm da aba ativa sincroniza.
- O throttle é reavaliado a cada ciclo de sync (ou a cada 30s, o que ocorrer primeiro).

**Implementação:** Token bucket por swarm, recarregado proporcionalmente à quota. Swarms sem divergência (fingerprint já sincronizado) consomem 0 tokens — a banda só é consumida durante RBSR ativo.

### 3.3 Guarda de Concorrência (`ConcurrentReconciliationGuard`)

Ao calcular a B-Tree para o RBSR, o SQLite abre `BEGIN DEFERRED TRANSACTION` sob **WAL (Write-Ahead Logging)**, obtendo um snapshot consistente e evitando *phantom reads*. Se o usuário modificar algo localmente durante o sync, o Guard detecta a variação do ponteiro de estado e engatilha a emissão de um **"Diff Complementar"** assim que o túnel reporta equivalência.

> **Mitigação de crescimento de WAL.** Transações de leitura longas em WAL impedem o checkpoint/truncamento do arquivo `-wal`. Para evitar crescimento ilimitado em syncs lentos, o Guard impõe um *budget* de tempo: ao excedê-lo, aborta a transação de leitura, executa um checkpoint e reinicia o cálculo do range pendente em uma nova transação.

### 3.4 Transporte de BLOBs (WebTorrent Isolado)

Metadados (grafo) e arquivos multimídia pesados são radicalmente desassociados. O payload relacional armazena **apenas** a chave de decifragem AES e o `Magnet Link`/`InfoHash` correspondente.

- **Transporte físico:** ocorre na camada nativa (Processo Principal do Node no Electron) ou via WebRTC puro no browser, em protocolos derivados do BitTorrent.
- **Reidratação na UI:**
  - **Electron:** download imperceptível no disco e *streaming* nativo local (ex.: `localhost/blobs/<hash>`) direto para `<video>`/`<img>`.
  - **Browser (non-Electron):** Sem `localhost` disponível, o fluxo de reidratação segue:
    1. A tag `<video src="/blobs/{infohash}">` faz uma requisição HTTP interceptada pelo Service Worker via evento `fetch`.
    2. O Service Worker abre um `MessageChannel` com o Sync Worker: `SW → Sync Worker: REQUEST_CHUNK(infohash, range)` → `Sync Worker → WebTorrent` → busca o chunk na rede P2P → `Sync Worker → Crypto Worker` → descriptografa com AES-256-GCM (chave vinda do nó `ASSET:FILE` sincronizado via RBSR).
    3. **Transferable Objects (zero-copy):** Para evitar congelamentos do GC do motor JavaScript, o Crypto Worker devolve os bytes descriptografados usando `postMessage(buffer, [buffer])`, transferindo a propriedade da memória sem cópia.
    4. **Backpressure:** O Service Worker monitora o tamanho do buffer interno. Se o buffer de leitura antecipada exceder 20MB à frente do consumo da tag `<video>`, o SW envia `PAUSE_STREAM` ao Sync Worker, interrompendo temporariamente o download via WebTorrent. Quando o buffer cair para 5MB, envia `RESUME_STREAM`.
    5. Os chunks são entregues ao navegador via `ReadableStream` (resposta do fetch interceptado) e anexados ao `SourceBuffer` do MediaSource, que gerencia a ordenação correta. Chunks fora de ordem (comum no WebTorrent) são bufferizados até que o chunk anterior seja recebido.
    6. **Segurança:** Chunks descriptografados residem **apenas** no `ReadableStream`/`SourceBuffer` — nunca são expostos ao contexto da página (nem ao JavaScript da UI). O Service Worker é o único ponto de manipulação de dados descriptografados.
- **Implicação de dedup:** como o BLOB é cifrado antes de entrar no swarm, o `InfoHash` depende da chave/IV; arquivos idênticos cifrados com chaves diferentes **não** deduplicam entre usuários. A disponibilidade do BLOB é responsabilidade da custódia gerida (§4) e localizada via [[graph-based-routing]], não do seeder original (que, sendo mobile, pode dormir a qualquer momento).

---

## §4 — Governança & Operações (Fundadores e Operadores de Rede)

### 4.1 Transporte como Recurso Comum Gerido

O peer, ao aceitar os termos, dedica recursos à comunidade. A plataforma autogere esse pool com base em **telemetria** (uptime, banda, espaço livre) e no **score/ranking** de cada peer. A partir disso, o sistema **fixa dados em peers específicos automaticamente**: a custódia não é puramente altruísta-voluntária, é alocação gerida.

### 4.1.1 Tiers de Capacidade e Compromisso

O "limite honesto" é operacionalizado como contrato: cada device **declara** capacidade e **assume** compromissos; a rede **verifica** (os quatro regimes da v4 §3.3) e **roteia conforme o tier verificado**.

| Dimensão | Valores | Verificação |
| :--- | :--- | :--- |
| Alcançabilidade | direta‑pública / forwarded / relay‑only / inalcançável (NAT simétrico) | peer‑sonda |
| Uptime | always‑on / alto / intermitente / efêmero | observação |
| Papéis | signaling, relay, seeder/WebSeed, custódio, validador | declarado |
| Compromisso | cota de storage, cota de banda, tempo mínimo de seed | desafio‑resposta / recibo |

**Regra:** a rede só atribui a um peer responsabilidades que seu tier declarado‑e‑verificado suporta, e **degrada garantias de forma transparente** quando nenhum peer do tier necessário está presente (conecta com o freeze escopado por linhagem da §4.6 e com o RELEASE/ACK da §4.3). Web/mobile que declara "efêmero, relay‑only, sem custódia" nunca recebe custódia crítica.

### 4.2 Replicação e Custódia

#### 4.2.1 P2P Puro — Replication Factor por Gossip

A garantia de disponibilidade do grafo em ambientes P2P baseia-se na manutenção de um fator de replicação mínimo [[replication-factor|Replication Factor]] ($N$, default 3), cujos custódios primários são eleitos de forma determinística por [[consistent-hashing|Consistent Hashing]] conforme especificado em [caderno-2-protocol/03-set-reconciliation-protocol.md#31-p2p-puro-replication-factor-por-gossip](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/03-set-reconciliation-protocol.md).

#### 4.2.2 Corporativo

O Super Peer mantém 100% do grafo íntegro e emite um **Manifesto de Retenção** (pesos por relevância, frequência de leitura, prioridade de cargo) que autoriza podas agressivas nos dispositivos menores.

#### 4.2.3 Público

Sharding determinístico por consistent hashing entre peers ativos, com o **peer de sistema** mantendo o grafo íntegro como fallback definitivo de bootstrap.

### 4.3 Protocolo de Poda Segura (sem perda de dados)
> ver [[poda-segura]]

A poda (transição Integral → Podado) **nunca** é imediata. Combina três camadas para eliminar a condição de corrida em que todos os $N$ custódios podam ao mesmo tempo confiando uns nos outros:

1. **Jitter aleatório:** ao atingir o limiar, o peer agenda `delay = random(30, 300) s`. Ao despertar, **reverifica** se $\ge N$ peers ainda têm o dado íntegro. Se outros já podaram, reinicia o timer. (O jitter sozinho já reduz a probabilidade de corrida a $\sim 1/N!$.)
2. **Custódia designada (RELEASE/ACK):** o custódio primário do anel **nunca** poda sem repassar a posse:
   - `A` quer podar → envia `RELEASE(chunkId)` ao próximo do anel `B`;
   - `B` assume custódia primária → responde `ACK(chunkId)`;
   - **só então** `A` poda;
   - se `B` falha, `A` retenta com `C` (próximo no anel).
3. **Health-check pré-poda:** antes de podar, `PING` aos $N-1$ peers. Se `< N-1` respondem confirmando posse → **não poda** (redução de rede detectada).

### 4.4 Saída de Peers

- **Saída Graciosa:** ao fechar, o peer despacha um sinal efêmero `peer-leaving: { cacheAvailableForMs: 30000 }`, dando 30 s para *leeching* em andamento finalizar sem corrupção.
- **Robustez a saída abrupta:** crashes, queda de rede e *kill* de app em background (comum no mobile) fazem o peer sumir **sem** sinal. O sistema é projetado para ser robusto a isso por padrão (custódia §4.2/§4.3, replication factor, health-check) — a saída graciosa é **otimização**, jamais premissa.

### 4.5 Coleta de Lixo (G4) — Pools Segmentados
> ver [[g4-garbage-collection]]

O cache altruísta é vigiado no limite de OPFS/Disco, com cotas em **pools de expulsão distintos**:

- **Grafo:** algoritmo **LRU** (*Least Recently Used*).
- **BLOBs de vídeo/mídia:** **Rarest-First** — protege sementes raras na malha antes de excluí-las (inversão do rarest-first de *download* do BitTorrent). A raridade é **estimada** via contagem de peers no DHT/tracker; por ser estimável e potencialmente manipulável, a decisão final de expulsão de um BLOB raro é cruzada com o ranking de custódia (§4.1) antes de efetivar.

### 4.6 Tradeoff de Liveness dos Validadores

A disponibilidade transacional da rede em cenários de ausência de validadores é regulada de forma determinística pelo [[tradeoff-liveness-validadores]] (definido de forma canônica em [caderno-4-governance/03-specification-lifecycle-and-rfcs.md#34-tradeoff-de-liveness-dos-validadores-—-formalizacao](file:///c:/Dev2026/Docs/docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md)).

- **Operações comutativas** (leitura, gossip, RBSR, navegação, chats, rascunhos) continuam operando normalmente sem validadores.
- **Operações não-comutativas** (débito, alteração de especificações, quórum) sofrem [[congelamento-escopado|congelamento escopado]] por linhagem, degradando com segurança para read-only sem perda de integridade ou auditabilidade.
- Em caso de partição, o [[rbsr]] segue identificando forks estruturais, mas a resolução por nó de merge de concorrência e [[fork-resolucao]] fica suspensa até que um validador seja restabelecido.

### 4.7 — Private Swarm (Sincronização Cross-Device do Mesmo Usuário)

A replicação cross-device de dados pessoais que não devem ser expostos a outros participantes do swarm (como rascunhos locais e preferências de interface) é gerenciada isoladamente via [[private-swarm]].

A especificação de derivação de chaves criptográficas (`Device_Sync_Key` e `RendezvousId`), sincronização do banco isolado `device_state.db` e priorização de tráfego do canal cross-device estão consolidadas em [[private-swarm]] (ver [docs/conceitos/private-swarm.md](file:///c:/Dev2026/Docs/docs/conceitos/private-swarm.md)).

---

## Apêndice A — Fronteiras com Outros Cadernos (alterações de suporte)

Esta RFC é autocontida no transporte, mas depende de mudanças pontuais nos cadernos abaixo (entregues separadamente na "Peça 2 — Lista de Alterações Pontuais"):

1. **`caderno-3-sdk/01-sqlite-and-projections-schema.md`** — adicionar coluna `hlc` (coberta pela `signature`) às tabelas `nodes` e `edges`; substituir a comparação por `created_at` no trigger `entity_heads` por comparação de `hlc`; índice `(entity_id, hlc)`.
2. **`caderno-2-protocol/02-cryptographic-lineage-and-auth.md`** — corrigir a definição de *head* (ponta da linhagem via `MUTATES` sem filho ativo, **não** o maior `created_at`); especificar o algoritmo HLC (eventos local/envio/recepção), a ordem total `(pt, c, author_pubkey)`, a monotonicidade de pai e o limite de drift.
3. **`caderno-2-protocol/03-set-reconciliation-protocol.md`** — substituir `Truncate₆₄(SHA-256(...))` pelo fingerprint de 256 bits; adicionar `RangeFooter` (count + checksum) e a rodada de desafio com nonce.
4. **`caderno-2-protocol/04-automerge-integration-spec.md`** — regra de merge de fork de `MUTATES` herdando a eleição determinística de committer (`PROFILE:SYSTEM` preferencial), criando nó de merge com dois `MUTATES` e `HLC` superior aos dois ramos.
5. **`caderno-4-governance/`** — formalizar a seção de liveness dos validadores (§4.6 desta RFC) como regra de governança.
6. **Modelo de Concorrência e Merge:** A detecção estrutural de forks (duas `MUTATES` do mesmo `source_id` sem ancestralidade) e o merge por nó de merge estão especificados no Caderno 2 §4 (Automerge Integration Spec) e referenciados neste RFC em §2.10. A política de deleção via `active = 0` com trigger local está no Caderno 3 §1 (SQLite & Projections Schema). Este RFC não redefine esses mecanismos; apenas os invoca como contrato da camada de transporte.
7. **`caderno-3-sdk/05-media-transport-plane.md`** — promovido de stub para spec completa: chunking potência‑de‑2, cifra por chunk (GCM, região trailing de tags), modos `convergent`/`unique`, manifesto/renditions/fontes (`SERVES`/`RELATES:MEDIA:RENDITION`), adapters (WebTorrent/IPFS/Cloud‑WebSeed+Edge), ponte com custódia.
8. **`caderno-3-sdk/06-connectors.md`** — nova spec de conectores de notificação out‑of‑band (SMTP base + adapters), capacidade do papel de peer do sistema.
9. **`caderno-2-protocol/02-cryptographic-lineage-and-auth.md`** — §4.1 estendida com auth corporativa sem SSO (usuário/senha + recuperação por e‑mail + 2FA) mapeada no Central Custody.

## Apêndice B — Glossário de Termos de Transporte

- [[anti-entropy|Anti-Entropy O(1)]]: troca apenas do root fingerprint no resume; se coincide, encerra sem sync.
- [[connection-promotion-engine|ConnectionPromotionEngine]]: migra fluxo de relay para P2P direto quando o NAT permite.
- [[documento-casca|Documento Casca / Rendezvous]]: sala WebRTC em RAM, sem histórico, derivada de capability.
- [[hlc|HLC (Hybrid Logical Clock)]]: carimbo `(pt, c)` que respeita happens-before e fica colado ao tempo real.
- [[range-footer|RangeFooter]]: rodapé `{count, checksum}` que torna colisão de fingerprint detectável.
- [[rbsr|RBSR (Range-Based Set Reconciliation)]]: reconciliação por XOR de ranges, recursiva até isolar diferenças.
- [[relay-trust-model|RelayTrustModel]]: score local e não-transitivo de relays, com shadowban por histerese.
- [[swarm-registry|SwarmRegistry]]: mapa em RAM de peers ativos, latências, capacidades e estado de promoção.
- **STALE_EPOCH:** erro que interrompe o RBSR quando a época da chave muda durante a transferência.


