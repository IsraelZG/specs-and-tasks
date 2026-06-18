# 07-chat-reference-spec.md — Especificação de Referência: Chat (Modelagem de Conversa e Recibos)

> **Origem normativa:** RFC-005 §A.8 (recibos de entrega e leitura) e §A.9 (modelagem de conversa).
> **Princípio:** **zero tipo de nó novo** — chat é uma *lente* sobre a ontologia existente ([[caderno-2-protocol/01-graph-ontology]]). Conversa é o caso exemplar do antipadrão dual-nó **evitado**.

---

## 1. Mensagem

* `CONTENT:MESSAGE` com arestas `AUTHORED`, `DIRECTED_TO` (persona na DM; organização no grupo), `REPLIES_TO`; anexos apontam para `CONTENT:FILE`. Schema governado por `SPECIFICATION:CHAT_MESSAGE`. Ver [[content-message]].
* **Editar** = `MUTATES`; **apagar** = lápide ([[tombstone-lapide]]); **"apagar para todos"** = revogação por cortesia ([[revogacao-por-cortesia]]), com os limites honestos de [[caderno-2-protocol/02-cryptographic-lineage-and-auth#52-expurgo-revogação-por-cortesia-revogação-criptográfica]] explicitados na UX.

## 2. DM — Sem Nó Contêiner

* A DM **não tem nó contêiner**; existe puramente quando há permissão mútua escopada ativa.
* `conversation_id = blake2s256("chat-dm-v1" ‖ min(idA,idB) ‖ max(idA,idB))` — derivável de forma idêntica pelos dois lados; usado por recibos, push e projeções.

## 3. Grupo/Canal — `PROFILE:ORGANIZATION`

* Grupo é `PROFILE:ORGANIZATION` com chaves próprias (cofre do grupo; [[caderno-2-protocol/02-cryptographic-lineage-and-auth#33-rotação-de-épocas-e-forward-secrecy]] e §3.3.1).
* **Pertencimento** por **`PARTICIPATES_IN:GROUP:MEMBER`** (a ontologia §2 aboliu `MEMBER_OF`); **moderação** por `ASSET:ROLE`.
* Mensagens de grupo carregam **`BELONGS_TO`** → `entity_id` da organização; **moderar** = lápide no `BELONGS_TO` (autoria intacta).
* `conversation_id = blake2s256("chat-group-v1" ‖ entity_id_da_organizacao)`.

## 4. Projeção Obrigatória — `chat_conversations`

A lista de conversas da home é a projeção local **`chat_conversations`** (mantida por trigger/Index Worker no `device_state.db`), **não** uma interseção de arestas em tempo de render. A Onda 1 do sync prioriza o escopo dessa projeção. Ver [[caderno-3-sdk/01-sqlite-and-projections-schema]].

## 5. Efêmeros de Conversa

Indicadores "digitando", presença e recibos-ao-vivo trafegam como [[ephemeral-messages]] — **nunca** entram no grafo.

## 6. Recibos de Entrega e Leitura (Efêmero + Consolidação por Linhagem)

Resolve ✓✓ sem inflação do grafo (RFC-005 §A.8):

* **Ao vivo (`REPLICABLE_VOLATILE`):** entregue/lido trafegam como ephemeral messages no rendezvous da conversa, atualizando o TinyBase; morrem com a sessão.
* **Buffer offline:** acúmulo em tabela não-replicada do `device_state.db`.
* **Consolidação (`REPLICABLE_AUDITABLE`):** periodicamente ou ao encerrar a sessão, **um registro por (leitor, conversa)** — nó `CONTENT` governado por `SPECIFICATION:CHAT_READ_RECEIPT`, payload `{ conversation_id, last_read_hlc, unread_before? }`, atualizado por `MUTATES`; versões antigas podáveis por TTL (G4).
* **Nunca** aresta ou nó por mensagem.
* **Trade-off declarado:** ✓✓ por mensagem só com destinatário online; offline, persiste o marco "lido até `last_read_hlc`".

## 7. Descoberta de Contatos

A descoberta de usuários do mensageiro é responsabilidade do módulo, conforme [[caderno-3-sdk/08-discovery-patterns]] (na modalidade gerida, Pattern 3 — Authoritative Directory).
