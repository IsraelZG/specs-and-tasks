# Visão Arquitetural de Alto Nível — Plataforma Projeto SuperApp V0.41

> **Status:** descrição canônica de alto nível da arquitetura. Substitui qualquer descrição anterior que tratasse o Automerge Repo como núcleo central ou afirmasse que "somente TinyBase lê ou grava no SQL" — ambas imprecisas. Detalhes normativos vivem nos cadernos e verbetes linkados; este documento é o mapa.

---

## 1. As Cinco Camadas do Núcleo

O núcleo do sistema tem cinco camadas. O core lógico está em `@plataforma/protocol` + `@plataforma/core` — **não** no Automerge Repo.

1. **Protocolo** (`@plataforma/protocol`): tipos, validações, [[rbsr|RBSR]].
2. **Cripto** (`@plataforma/crypto`): assinaturas Ed25519, cifra AES-256-GCM.
3. **Core** (`@plataforma/core`): SQLite, [[linhagem-de-versoes|linhagem]], [[ucan|UCAN]], [[key-vault|Key Vault]].
4. **Transporte** (`@plataforma/transport`): NetworkAdapters (in-memory/WS/WebRTC), handshake [[noise-xx|Noise_XX]], [[swarm-registry|SwarmRegistry]], relay.
5. **Workers** (`@plataforma/workers`): [[sync-worker|sync]], [[crypto-worker|crypto]], [[index-worker|index]].

## 2. O Papel Restrito do Automerge Repo

[[automerge-repo|Automerge Repo]] é a **trilha transiente/colaborativa**, usada exclusivamente para:

- Micro-updates colaborativos em RAM (digitação ao vivo);
- [[ephemeral-messages|Mensagens efêmeras]] entre peers (presença, recibos ao vivo, sinais WebRTC);
- [[documento-casca|Documentos casca]] (rendezvous).

**Nunca como storage do grafo.** Dados persistentes usam [[rbsr|RBSR]] (ver `docs/adr/adr-001-automerge-para-transientes.md`).

## 3. TinyBase e o Acesso ao SQLite

[[tinybase|TinyBase]] é a camada de estado reativo da UI. **A regra correta é: a UI nunca acessa SQL direto — apenas via TinyBase.** O core ([[sync-worker|Sync Worker]], [[index-worker|Index Worker]], Committer, [[key-vault|Key Vault]], [[zen-engine|Zen Engine]], TestKit) acessa o SQLite diretamente via `StoragePort` — eles próprios são produtores e validadores dos dados que o TinyBase consome.

## 4. As Três Categorias de Tabela do SQLite

1. **Grafo append-only replicado** (`nodes`, `edges`) — imutável, assinado, com lineage;
2. **Projeções locais** (`entity_heads`, views, `chat_conversations`) — derivadas do grafo;
3. **Estado local não replicado** (`device_state.db`, `pending_changes`) — rascunhos, cache.

## 5. Imutabilidade Dupla

Todo nó do grafo é assinado por seu autor (**Layer 1**). Toda versão (aresta [[mutates|MUTATES]]) referencia o hash da versão anterior (**Layer 2**). Isto garante integridade e auditabilidade sem servidor central. Ver [[imutabilidade-dupla]].

## 6. Os Quatro Tipos de Nó

- **[[profile|PROFILE]]**: quem age (pessoas, organizações, agentes de sistema);
- **[[asset|ASSET]]**: valor ou poder transacionável (permissões, convites, saldos);
- **[[specification|SPECIFICATION]]**: regras formais (schemas, políticas, contratos);
- **[[content|CONTENT]]**: conteúdo puro (mensagens, arquivos, asserts).

## 7. Autorização Capability-Based Invertida

- [[ucan|UCAN]] é **permissão de requisição**, não transporte de chave;
- [[chave-de-epoca|Chaves de época]] (AES-256-GCM) são efêmeras (TTL 4 h), entregues sob demanda pelo [[key-vault|Key Vault]] mediante UCAN válido;
- Dispositivos falam por personas via delegação ([[delegacao-de-dispositivo|DELEGATED_TO]]), nunca por posse da chave mestra.

## 8. Sincronização

A sincronização usa [[rbsr|RBSR]] (Range-Based Set Reconciliation): compara [[fingerprint|fingerprints]] de sub-ranges em vez de transferir dados brutos. Três ondas: [[anti-entropy|anti-entropy O(1)]] → tela ativa → histórico em background. [[sync-dirigido-por-ucan|Dirigida por UCAN]]: peer sem permissão não recebe nem fingerprints do subgrafo.

## 9. Comunicação entre Peers — Duas Camadas

1. **[[agente-de-sistema|Agentes de sistema]]** (`PROFILE:SYSTEM`) orquestram e monitoram;
2. **NetworkAdapters** transportam os dados diretamente (peer-to-peer), sem proxy.

**O agente é maestro, não roteador.** Um agente de sistema equilibra servir seu usuário e servir à resiliência da rede ([[global-network-throttle|GlobalThrottle]], [[relay-trust-model|RelayTrustModel]], [[custodia-cega-archive|Archive Cargo]]).

## 10. Segurança Testada Adversarialmente

A segurança é testada obrigatoriamente em **12 cenários adversariais**, incluindo assinatura inválida, `STALE_EPOCH`, double-spend sob partição, UCAN expirado e peer sem token de fundação. Estes testes rodam **desde a fundação do monorepo (M0)** — ver `docs/plano-de-implementacao.md §2.5`.
