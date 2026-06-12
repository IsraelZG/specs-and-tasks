# Mapa de Conceitos (MOC)

Índice canônico. Cada linha leva à definição autoritativa.
Gerado na Fase 3 a partir do glossário consolidado.

## Ontologia do Grafo e Primitivas

- [[aresta]] — Relação ou ação entre dois nós no grafo. Sempre representa um verbo.
- [[serves-aresta]] — Aresta `PROFILE → CONTENT` que declara que uma fonte (peer/cloud/IPFS) hospeda um ciphertext; durável no grafo (fontes estáveis) ou no cache efêmero (seeders‑peer). Ver caderno‑3/05 §4.2.
- [[content]] — Tipo de nó passivo que carrega informação estruturada. Inclui o subtipo `CONTENT:INTENT`.
- [[mfa-s]] — Mecanismo de auditoria em nível de propriedade que, **apenas em documentos de edição colaborativa**, reconstrói antes/depois de deltas e gera diff semântico legível sob demanda. O cálculo é **lazy** e não-redundante com a Linhagem de Versões do grafo global.
- [[no]] — Entidade no grafo de dados. Sempre representa um substantivo. Quatro tipos: PROFILE, CONTENT, ASSET, SPECIFICATION. Não existe tipo EVENT.
- [[substantivo-verbo-principio]] — Nós são substantivos (entidades), arestas são verbos (relações/ações).
- [[participates-in]] — Substitui permanentemente `MEMBER_OF`. Aresta de pertencimento contínuo, no padrão `PARTICIPATES_IN:DOMÍNIO:SPECIFIER`. Expressão de fato social/estrutural; **não implica** `ASSET:PERMISSION` sobre o conteúdo do contexto. Ver Princípio 2.6.
- [[verbos-raiz-canonicos]] — Conjunto de verbos base para nomenclatura de arestas no padrão `VERBO:DOMÍNIO:SPECIFIER`: `RELATES` (relações sociais/estruturais), `OWNS` (posse de ativos), `GOVERNS` (governança e especificação), `INTERACTS` (interações com conteúdo), `PARTICIPATES_IN` (pertencimento contínuo a grupos/contextos). Ver Princípio 2.5.
- [[aggregates]] — Aresta estrutural permanente que liga um `ASSET:ROLE` a uma `ASSET:PERMISSION`, indicando composição de papel.
- [[blocks-aresta]] — Aresta `PROFILE → PROFILE`; bloqueio social (filtro de leitura), não garantia criptográfica.
- [[contributes-aresta]] — Aresta de `PROFILE:SYSTEM` à prova de contribuição (`kind: serve | store | compute`).
- [[consumes-aresta]] — Aresta de `PROFILE` a `CONTENT` consumido.
- [[requires]] — Aresta estrutural permanente que liga uma `ASSET:PERMISSION` a outra, indicando dependência ou pré-requisito de acesso.
- [[spends]] — Aresta de `CONTENT:INTENT` ao head específico do `ASSET` de origem; âncora de serialização (única referência intencional a versão específica).
- [[credits]] — Aresta de `CONTENT:INTENT` ao `entity_id` do `ASSET` de destino; comutativa (merge aditivo); par simétrico de `SPENDS`.
- [[transfers-aresta]] — Aresta de nó de saldo novo → `CONTENT:INTENT`; registra a execução da transferência e torna o grafo bidireccionalmente navegável (evidência de finalização + rastreabilidade causal).
- [[content-message]] — Subtipo de CONTENT usado para toda comunicação interna de infraestrutura (como `SYSTEM_QUERY` ou `SYSTEM_RESPONSE`) e notificações entre agentes do sistema, operando de modo offline-first.
- [[tombstone-lapide]] — Mecanismo de deleção no modelo append-only: aresta marcada com `active = 0`. Um trigger local remove a relação de `active_edges`, tornando-a invisível; o registro original permanece para auditoria. O GC pode expungir lápides após N ciclos conforme política de retenção da `SPECIFICATION`. Ver caderno-3/01 §2.2.
- [[matriz-de-classificacao-transporte]] — Declaração na `SPECIFICATION` de um nó respondendo às 3 perguntas de classificação de transporte: `observable_by_peers`, `is_auditable`, `survives_disconnection`. A infraestrutura usa essas flags para rotear dados automaticamente ao destino físico correto (SQLite, WebRTC ephemeral, Private Swarm ou RAM). Ver caderno-3/01 §4.

## Identidade e Acesso

- [[asset-permission]] — Subtipo de nó ASSET que representa um direito atômico de acesso (leitura via queries de traversal) ou mutação (criação/alteração de arestas). Substitui o antigo `ASSET:CAPABILITY` que foi aposentado na V3.1.
- [[asset-role]] — Subtipo de nó ASSET que representa uma função ou cargo organizacional, agregando múltiplas permissions concretas por meio de arestas `AGGREGATES`.
- [[profile-authentication]] — Subtipo de PROFILE que carrega credenciais; raiz da identidade humana em uma rede.
- [[asset-invite]] — Asset consumível que concede o direito de criar cadastro sob web‑of‑trust; embute multiaddr para primeiro contato. Distinto do link multiaddr. Ver RFC §2.4.4 e v4 §4.2.
- [[profile]] — Tipo de nó que representa atores ativos com identidade criptográfica (subtipo: peer representa uma instância individual da plataforma, independente do formato: Cloud, Web, Desktop, Mobile).
- [[profile-persona]] — Subtipo de PROFILE que serve como máscara pública operacional do humano.
- [[ucan]] — User Controlled Authorization Network. Token de autorização delegável usado para provar direitos e solicitar chaves de época do cofre de chaves. Não carrega material de chaves em seu payload.
- [[profile-system]] — Subtipo de PROFILE dotado de chaves Ed25519 que executa funções de infraestrutura, validação (Validadores de Domínio), auditoria ou comunicação interna do sistema via nós `CONTENT:MESSAGE` roteados por arestas `DIRECTED_TO`.
- [[peer-id]] — Identificador de rede derivado deterministicamente da chave pública de uma `PROFILE:PERSONA`: `blake2s256(PROFILE:PERSONA_PUB_KEY)`. Auto-certificável (impede *spoofing* via desafio-resposta no handshake), mas não confere resistência a Sybil por si só — essa é responsabilidade do modelo de acesso por convite. Ver caderno-2/02 §1.4.
- [[noise-xx]] — Protocolo de handshake de autenticação mútua executado após o estabelecimento do WebRTC Data Channel. Em 3 round-trips troca `DevicePeerId`, `identity_epoch_index` e nonce assinado (RFC-005 §A.1/§A.5). Divergência de época → desvio para Catch-up de Identidades (Onda 0). Falha criptográfica → shadowban de 24 h no `RelayTrustModel`. Ver caderno-2/02 §1.4.1.

## Identificadores e Ordenação Causal

- [[entity-id]] — Identificador ULID estável de uma entidade ao longo de todas as suas versões (sua linhagem).
- [[id]] — Identificador ULID único de uma versão específica de um nó.
- [[hlc]] — Carimbo `(pt, c)` (componente físico em ms + contador lógico) que respeita a relação happens-before e permanece colado ao tempo real. Empacotado como `(pt << 16) | c` e coberto pela assinatura Ed25519. É a chave canônica de ordenação causal entre versões e entre linhagens, substituindo `created_at` na seleção de head. Ver caderno-2/02 §3.5.
- [[linhagem-de-versoes]] — Conjunto de todas as versões de uma entidade (mesmo `entity_id`), encadeadas por arestas `MUTATES`. É a auditoria universal do sistema, estruturada em duas camadas de imutabilidade: a do registro (via assinaturas Ed25519) e a da ordem de transição (via `previous_hash` gravado na aresta `MUTATES` apontando para a assinatura do elo anterior).
- [[ulid]] — Universally Unique Lexicographically Sortable Identifier. Identificador de 128 bits usado em todo o sistema.
- [[linhagem-de-versoes]] (subtipo: resulted-from) — Aresta estrutural que liga um nó consequente (ex.: nó de saldo) à sua causa, permitindo rastreabilidade causal em $O(1)$. Na transação serializada v4, aponta do saldo resultante para o `CONTENT:INTENT` (o hub), de onde se alcançam `APPROVED_BY`, `SPENDS` e `CREDITS`.
- [[linhagem-de-versoes]] (subtipo: resolves) — Aresta de transição que fecha o ciclo de uma intenção materializada. Emitida pelo validador em direção ao `CONTENT:INTENT` correspondente, indicando que a intenção foi consumada como fato histórico.
- [[vfk]] — Constraint de integridade referencial condicionada aplicada em $O(1)$ na camada de aplicação, usando o **11º caractere (index 10)** do ULID (`N` = nodes, `E` = edges) para determinar a tabela-alvo da aresta.
- [[serialization-por-linhagem]] — Ordenação de operações não-comutativas pelo validador declarado **daquela linhagem** do ativo. Invariante de não-conflito no core; política (K, leader/quorum, conjunto) na SPEC. Ver caderno-4/03 §3.5.
- [[rotacao-de-epocas]] (subtipo: stale-epoch) — Sinal de erro que interrompe o RBSR quando o `identity_epoch_index` (Época de Identidade — RFC-005 §A.1) de um peer difere do remoto durante a transferência. Força o catch-up de identidades antes de retomar o sync de dados de domínio; divergência de época de conteúdo é negativa do Key Vault na aplicação, nunca erro de transporte. Ver RFC de Transporte §2.9.

## Sincronização e Reconciliação

- [[rfc-transporte-p2p-v3.1#241-os-três-estados|Bootstrap Frio Absoluto]] — Primeiro login da identidade num device numa rede: sem grafo, sem histórico de peers. Só entra por canal out‑of‑band (mDNS, link multiaddr, convite, URL do peer do sistema). Ver RFC §2.4.1.
- [[rfc-transporte-p2p-v3.1#241-os-três-estados|Bootstrap Morno (Resume)]] — Reabrir o app após desconexão: há grafo + histórico de peers; refresca coordenadas e cai na Onda 0. A meta de latência < 500 ms é alcançável neste estado. Ver RFC §2.4.1.
- [[rfc-transporte-p2p-v3.1#242-canais-outofband-primeira-conexão-cold-start|Link Multiaddr]] — Artefato de conectividade pura (endereçamento libp2p), compartilhável e reutilizável; não concede identidade nem acesso. Distinto do convite. Ver RFC §2.4.4.
- [[automerge-repo]] (subtipo: crdt) — Conflict-free Replicated Data Type. Estrutura de dados que converge em múltiplos peers sem necessidade de coordenação central.
- [[graph-based-routing]] — Roteamento **quente**: o grafo identifica o detentor do dado e um diretório de presença efêmera (cache local + relays ancorados) resolve a coordenada atual. Substitui a DHT no estado quente, **não** no frio absoluto (que é out‑of‑band). Ver RFC §2.4.2.
- [[range-footer]] — Rodapé `{count, checksum}` anexado ao fechamento de cada range no protocolo de Set Reconciliation, tornando colisão/omissão adversarial de fingerprint detectável de forma determinística. Ver caderno-2/03 §1.2.
- [[automerge-repo]] (subtipo: automerge) — Implementação de CRDT usada como motor de edição colaborativa. Cada documento é uma estrutura de dados com histórico imutável de Changes. `Automerge.save(doc)` produz snapshot binário integral e autossuficiente; `Automerge.getHistory(doc)` expõe a DAG completa de mudanças para auditoria e diff semântico.
- [[automerge-repo]] — Camada de orquestração sobre Automerge. Gerencia ciclo de vida de documentos, persistência local via OPFS, sincronização incremental de Changes entre peers, e Ephemeral Messages via WebRTC para coordenação de committers.
- [[changes]] — Operações elementares registradas pelo Automerge ao editar um documento. São as unidades atômicas de mudança capturadas pelo Sync Worker na RAM pré-commit e persistidas na tabela local `pending_changes`. Após o commit, as Changes são consolidadas no snapshot do nó-versão e removidas de `pending_changes`.
- [[ephemeral-messages]] — Canal de mensagens voláteis provido pelo Automerge Repo via WebRTC. Não são persistidas no grafo. Usadas para coordenação de curto prazo: eleição de committer, coleta de assinaturas em commit colaborativo, negociação de epoch key.
- [[anti-entropy]] — Fase inicial de cada sessão de sincronização (Onda 0) na qual os dois peers trocam apenas o root fingerprint do seu range autorizado. Se os fingerprints coincidem, a sessão encerra sem transferência de dados. Custo de $O(1)$ assumindo malha quente; *cold start* (DHT + NAT + handshake) tem custo de segundos. Ver caderno-2/03 §4.
- [[connection-promotion-engine]] — Componente do Sync Worker que, em background, tenta converter conexões relay em conexões P2P diretas via hole punching STUN. A promoção ocorre apenas quando o NAT permite (cone restrito ou completo); em NAT simétrico, o relay permanece e isso é comportamento esperado, não falha. Ver RFC de Transporte §2.5.1.
- [[consistent-hashing]] — Algoritmo de mapeamento determinístico de `chunkId` em um anel de peers, usado para eleger os custodiantes responsáveis por cada fragmento de dado. Base do `replication factor` em P2P Puro e do sharding na modalidade Pública. Ver caderno-2/03 §3.3.
- [[documento-casca]] — Sala de encontro efêmera em RAM, sem histórico CRDT, usada pelo Automerge Repo para orquestrar a formação do swarm WebRTC entre co-editores. O `RendezvousId` é derivado de um segredo de capability (`SHA-256(rendezvous_secret ‖ ASSET:PERMISSION_ID)`), impedindo enumeração. Ver caderno-2/04 §2.
- [[rfc-transporte-p2p-v3.1#24-descoberta-de-peers-coldwarm-e-substituição-da-dht|DHT (Distributed Hash Table)]] — **Descartada do core.** Mainline/Kademlia DHT não é usada para descoberta de peers: a versão browser do WebTorrent não fala UDP, excluindo web/mobile; uma DHT privada exigiria bootstrap nodes próprios sem benefício de graça. A função residual (achador de seeders de um `InfoHash` conhecido) é coberta por **trackers WSS privados** (interop browser) ou **PEX (BEP 11) + anel de custódia** em P2P puro. Ver RFC §2.4.
- [[onda]] — Fase do pipeline de sincronização. A sequência canônica tem quatro ondas: 0 (anti-entropy, root fingerprint apenas), 1 (cabeçalhos críticos e tela ativa), 2 (B-Tree completa em estado podado), 3 (reidratação lazy de BLOBs via WebTorrent). Ver caderno-2/03 §4.
- [[rbsr]] — Protocolo de sincronização de conjuntos por XOR recursivo de ranges ordenados da B-Tree. Compara apenas fingerprints até isolar elementos divergentes, evitando transferência de bancos inteiros. Fundamento matemático em caderno-2/03 §1.
- [[relay-trust-model]] — Sistema de score local e não-transitivo de relays WebRTC mantido pelo `SwarmRegistry`. Peers com desempenho suspeito (alta latência, pacotes descartados) recebem shadowban silencioso por histerese de janela deslizante. O score **não** é propagado como fato para outros peers, evitando badmouthing. Ver RFC de Transporte §2.5.2.
- [[swarm-registry]] — Mapa em RAM mantido pelo Sync Worker com peers ativos e seus metadados: latência, tier de capacidade, score de relay e estado de promoção de conexão. Fonte para decisões de roteamento, shadowban e eleição oportunística de líder de sync. Ver RFC de Transporte §3.2.2.
- [[sync-worker]] — Web worker principal da camada de transporte. Orquestra o Automerge Repo, mantém o loop de RBSR, gerencia o `SwarmRegistry`, executa transações no SQLite WASM (OPFS) e coordena os demais workers (Crypto, Index). Opera fora da Main Thread via Comlink. Ver RFC de Transporte §3.1.
- [[first-peer-protocol]] — Máquina de estados do [[swarm-registry]] executada quando um peer tenta entrar em um swarm sem encontrar nenhum outro participante ativo. Transita pelos estados JOINING → WAITING_FOR_SWARM (8 s) → CONNECTED | GENESIS | OFFLINE_RETRY. Ver [[first-peer-protocol]].
- [[genesis-state]] — Estado transitório do [[first-peer-protocol]] atingido quando o timer de 8 s expira sem peers e o peer detém o bootstrap token (chave de fundação). Nesse estado, o peer funda a rede criando os registros de bootstrap e o nó [[specification-network-birth]]. Ver [[first-peer-protocol]].
- [[global-network-throttle]] — Componente do Sync Worker que governa a disputa por banda e sockets entre múltiplos swarms simultâneos (workspaces em abas diferentes). Cota: 70% para aba ativa, 20% para aba visível, 10% para background. Em mobile com bateria < 30%, swarms em background são pausados. Ver caderno-3/02 §7.
- [[specification-network-birth]] — Nó do tipo `SPECIFICATION:NETWORK_BIRTH` criado no estado GENESIS, registrando o timestamp imutável de fundação da rede. Permanece no grafo mesmo após o peer fundador se tornar um peer normal. Ver caderno-3/02 §6.
- [[private-swarm]] — Canal de sincronização cross-device exclusivo do mesmo usuário, separado do swarm principal. Sincroniza o banco `device_state.db` (rascunhos, cache de prefetch, preferências de UI) usando a `Device_Sync_Key = HKDF-Expand(master_key, "device-sync-v1", 32 bytes)` como segredo de rendezvous. Não passa pelo RBSR do swarm principal. Ver caderno-3/02 §9.

## Transações, Saldos e Sagas

- [[asset]] — Tipo de nó que representa posse, saldo, permissão ou direito.
- [[content-intent]] — Subtipo de CONTENT que materializa a intenção de uma ação que exige validação não-trivial. Não é um quinto tipo de nó; é um CONTENT.
- [[merge-aditivo]] (subtipo: CREDITS) — Aresta de `CONTENT:INTENT` ao `entity_id` do `ASSET` de destino; comutativa (merge aditivo).
- [[saga]] — Composição de operações single-domain serializáveis, coladas por reservas `ASSET:LOCK` com TTL. Consistência eventual, sem isolamento de snapshot. Default para transações multidomínio. Ver rfc-transacoes-multidominio.md §2.
- [[2pc-com-lock-ttl]] — Protocolo commit em duas fases (prepare/commit) sobre os mesmos locks; TTL resolve o bloqueio clássico de 2PC. Coordenador = validador declarado da linhagem de coordenação. Oferece isolamento de snapshot. Ver rfc-transacoes-multidominio.md §3.
- [[asset-lock]] (subtipo: asset-lock como reserva) — Reserva temporária com TTL que ancora no head de um recurso via aresta `SPENDS` (detecção estrutural de conflito). Expira via lápide/GC (compensação automática). Participante de sagas multidomínio. Ver ontologia §3.3 e rfc-transacoes-multidominio.md §2.
- [[politica-de-ttl]] — Estratégia de seleção de prazo de expiração para locks em sagas: `fixed` (constante), `per_leg` (por perna da saga), `renewable_lease` (renovável por heartbeat com teto rígido), ou `risk_scaled` (escalado por valor/contenção). Ver rfc-transacoes-multidominio.md §5.
- [[linhagem-de-coordenacao]] — Estado da saga transdomínio (quais pernas reservadas/confirmadas). **Efêmero e local**, mantido somente no agente orquestrador. Nunca replicado ou mutável no grafo. Ver rfc-transacoes-multidominio.md §8.
- [[revogacao-por-cortesia]] — Mecanismo best-effort de privacidade: sinal de expiração (`retention_state = expunged`) honrado por peers cooperativos; desnecessário contra peer adversário que já decifrou. Ver caderno-2/02 §5.2 e rfc-transacoes-multidominio.md §6.

## Mídia e Transporte de Arquivos

- [[convergent-encryption]] — Cifra cuja chave deriva do próprio conteúdo para viabilizar deduplicação física de arquivos. Ver [[convergent-encryption]].
- [[consolidacao-de-live]] — Padrão de gravação de transmissão ao vivo no qual segmentos de mídia voláteis são distribuídos temporariamente e, ao encerrar, unificados em um único arquivo de mídia durável. Ver [[consolidacao-de-live]].
- [[edge-translation]] — Edge Worker stateless e content‑blind que traduz HTTP Range ↔ peça WebTorrent, injetando token de acesso ao bucket, sem ver a chave AES. Ver [[edge-translation]].
- [[rendition]] — Variante de um asset de mídia (qualidade/língua/bitrate/tamanho), modelada como nó `CONTENT` irmão. Ver [[rendition]].
- [[webseed-bep19]] — Nuvem (S3/GCS/Drive) atuando como seeder HTTP do swarm WebTorrent via HTTP Range, sem rodar cliente torrent. Ver [[webseed-bep19]].

## Governança, Regras e Infraestrutura

- [[notification-connector]] — Interface única de egress out‑of‑band (SMTP base + Gmail/WhatsApp/SMS); capacidade do papel de peer do sistema. Ver caderno‑3/06.
- [[fundador]] — Pessoa ou board que dá bootstrap a uma rede. Pode dissolver superpoderes ao longo do tempo.
- [[caderno-1-vision/01-vision-and-positioning|Local-First]] — Paradigma onde dados nascem e vivem no dispositivo do usuário; sincronização é secundária e oportunística.
- [[modalidade-de-rede]] — Modelo de governança e infraestrutura: pública, corporativa whitelabel, P2P pura.
- [[peer-do-sistema]] — Peer especial operado pelo fundador da rede, com função de bootstrap, signaling e snapshot.
- [[specification]] — Tipo de nó imutável que carrega regras, schemas e procedimentos que governam o sistema. Possui natureza dual: schema declarativo e procedimento executável determinístico (interpretado por Zen Engine).
- [[tier-aware-degradation]] — Capacidade do sistema de adaptar comportamento conforme capacidade do dispositivo, com transparência ao usuário.
- [[tinybase]] — Biblioteca usada como camada reativa entre o sistema e a UI. Observa projeções do SQLite e documentos Automerge via Automerge Repo; conduz escrita local; nunca é a fonte de verdade.
- [[zen-engine]] — Termo geral para autoridade com jurisdição sobre um domínio de negócio específico, implementado como uma SPECIFICATION procedural interpretada pelo motor de regras genérico (Zen Engine).
- [[rede-corporativa-whitelabel]] (subtipo: whitelabel) — Modalidade onde uma empresa opera sua própria instância da plataforma sob marca própria.
- [[agente-de-sistema]] — `PROFILE:SYSTEM` que roda no device do humano, codificado para servir a rede (não o dono). Confiável para **orquestrar**, nunca para **afirmar** o não-verificável. Integridade por detecção pós-hoc (auditoria + desafios canary), não por TEE.
- [[invariante-de-core]] — "Duas escritas conflitantes na mesma linhagem não-comutativa não podem ambas finalizar." Enforçada pelo core, não-configurável por SPEC.
- [[aplicador-deterministico]] — Aprovador de menor `entity_id` que materializa a finalização, evitando duplicação.
- [[desafio-canary]] — Tarefa de gabarito conhecido, indistinguível do trabalho real, para amostrar a integridade do agente. Forte no determinístico/storage/banda; fraco em compute não-determinístico.
- [[contribuicao-verificavel]] — Trabalho à rede medido por um de quatro regimes: banda (recibo de contraparte), storage (desafio-resposta), compute determinístico (amostragem), compute não-determinístico (aceitação + reputação).
- [[standing]] — Saldo de contribuição acumulado (`ASSET:BALANCE_STATE` de contribuição), medido por device e somado por peer.
- [[asset-reputation]] — Subtipo de ASSET que representa o sinal de reputação pública acumulado de um perfil. Em redes públicas, compõe o mecanismo de verificação de identidade junto com auto-atestação, KYC opcional e curadoria.
- [[reputacao-local]] — Avaliação de primeira mão, não-transitiva, não-replicada, que cada peer faz dos peers com que teve contato. Scores ficam locais; só fatos negativos verificáveis vão ao grafo.
- [[fato-negativo-verificavel]] — Mau ato re-checável por qualquer um (assinatura inválida, duplo-sinal de validador), persistido como `CONTENT` autocomprovável; acusação falsa é autopunitiva via `APPEAL` re-verificado.
- [[economia-como-modulo]] — A economia de contribuição é um `ASSET` governado por SPEC; o core **mede**, a SPEC **liquida**. Um entre vários modelos econômicos possíveis.
- [[oraculo-baas]] — Validador que afirma fato externo ao grafo (ex: resultado de transação no BaaS). Única classe de afirmação aceita sem verificação criptográfica. Mitigado por bonding/redundância, não por cripto. Ver rfc-transacoes-multidominio.md §2, §7.
- [[caderno-3-sdk/01-sqlite-and-projections-schema#5-índices-de-texto-fts5-e-busca-espacial-rtree|Qualidade Dependente de Vantagem]] — Ranking, descoberta e qualidade de dados melhoram com a **vantagem de observação** do agente (super peer > local). Tradeoff: soberania OU vantagem, não ambos. Ver caderno-3/01 §5.
- [[crypto-worker]] — Web worker dedicado à validação de assinaturas Ed25519 em lote (Ondas 1/2) e à decifração de payloads AES-256-GCM. Hospeda o Key Vault com TTL de 4 h em RAM. Opera fora da Main Thread para não bloquear a UI.
- [[index-worker]] — Web worker dedicado à reconstrução de projeções locais (FTS5, R*Tree) a partir de payloads decifrados pelo Crypto Worker. Opera fora da Main Thread para não bloquear a UI.
- [[poda-segura]] — Protocolo de três camadas para transição `integral → pruned` sem risco de perda de dados: (1) jitter aleatório de 30–300 s com reverificação de custodiantes, (2) handshake `RELEASE/ACK` com o próximo peer no anel de consistent hashing, (3) health-check dos $N-1$ peers antes de efetivar a poda. Ver RFC de Transporte §4.3.



