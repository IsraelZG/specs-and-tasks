# RFC-001 (v4) — Agentes de Sistema, Serialização por Linhagem, Contribuição Verificável e Economia Modular

> **Status:** Proposta consolidada para implementação.
> **Versão:** 4.0.
> **Precedência:** Substitui a *RFC-001 Rev 2 (v4 anterior)* integralmente. **Não** revoga a v3.1 — assume os quatro cadernos como base e altera/estende pontos específicos, listados no §0 e no Apêndice A. Onde a v3.1 não é tocada, ela continua valendo.
> **Convenção de leitura:** o documento aprofunda progressivamente. **§1 Visão** é para liderança de produto e arquitetura; **§2 Protocolo** é para engenheiros de protocolo; **§3 SDK** é para desenvolvedores de cliente; **§4 Governança** é para fundadores e operadores de rede. §5 (Threat Model) e os apêndices fecham as fronteiras.

---

## §0 — Precedência e Relação com a v3.1

### 0.1 O que se mantém da v3.1 (não redefinido aqui)

- Os quatro tipos de nó (`PROFILE`, `CONTENT`, `ASSET`, `SPECIFICATION`) e o princípio substantivo/verbo. **A v4 não introduz nenhum tipo de nó novo.**
- O modelo append-only, a linhagem por `MUTATES` + `previous_hash`, a seleção de head por **maior HLC**, a monotonicidade de pai e o limite de drift.
- O modelo de chaves (mestra / dispositivo / época), o fluxo inverso capability-based (UCAN como prova de tráfego; chave entregue pelo Key Vault após validação), e a detecção estrutural de fork + merge.
- A matriz de transporte das 3 perguntas (`observable / auditable / survives`) e as faixas físicas (`nodes`/`edges`, `pending_changes` efêmero, `device_state.db`, RAM).
- A reconciliação RBSR com fingerprint de 256 bits, o sistema de Ondas, e a custódia/replicação por modalidade (gossip RF / super peer / sharding).
- A resistência a Sybil ancorada no **custo de criação de identidade** (convite / web-of-trust / provisionamento) — §1.4 da v3.1.

### 0.2 O que muda ou cai

| Mecanismo (v3.1 / v4 anterior) | Substituído por | Motivo |
| :--- | :--- | :--- |
| 4 modos de committer (`first_proposer`, `system_agent`, `deterministic`, `manual`) | **Eleição sempre determinística entre agentes de sistema** | Se todo device roda um agente, `system_agent` vira o substrato; eleição negociada/política é desnecessária |
| Quórum global K-de-N de validadores + eleição de emergência a 2/3 | **Serialização por linhagem com validadores declarados por SPEC** | Localiza o consenso ao ativo; elimina o conjunto global e o congelamento de rede inteira |
| Amostragem estatística (f=10%) como segurança financeira | **Serialização determinística + amostragem aplicada à medição de *contribuição*** | Amostra é instrumento errado para finança (precisa serializar 100%), certo para medir trabalho |
| PoA como aresta com `state` mutável (`pending→…→audited/rejected`) | **`pending` local não-replicado \| `finalized` durável imutável** | Estado mutável violava append-only; coletar aprovações é orquestração efêmera, não estado durável |
| K=5 auditores aleatórios para finança | **K=1 (caso comum), validador determinístico por linhagem, que já detém a chave do ativo** | Auditor aleatório não pode ler saldo cifrado; o validador declarado já tem direito de leitura |
| Telemetria autorreportada como crédito | **Quatro regimes de medição verificável (banda/storage/compute-det./compute-não-det.)** | Telemetria autorreportada é inútil para remuneração; precisa de contraparte/desafio/amostra |
| PCR como defesa Sybil | **Defesa Sybil separada da economia; economia só mede contribuição** | PCR coludia (Sybils auditando uns aos outros); Sybil é problema de identidade, não de economia |
| Remoção de `pub_key`; raspagem agressiva de bytes | **`pub_key` mantida (TEXT→BLOB); volume resolvido por *prevenção da enchente*** | Remover `pub_key` quebra o bootstrap de verificação; a economia de bytes real estava na codificação |

---

## §1 — Visão (Liderança de Produto & Arquitetura)

### 1.1 O Princípio Reordenador

A v4 gira em torno do **agente de sistema** (`PROFILE:SYSTEM`, já existente na ontologia): um processo que roda **no device do humano, mas codificado para servir a rede, não o dono do device** (que pode ser malicioso). O agente otimiza descoberta, replicação e validação, e é o ponto natural de orquestração por ser o mesmo código em todo lugar.

A linha que organiza tudo:

> **O agente é confiável para *orquestrar*, nunca para *afirmar* aquilo que não é verificável de forma independente.**

Orquestrar errado é autocorrigível e de custo limitado (um committer mal eleito gera fork que é mesclado; roteamento ruim desperdiça banda). Afirmar errado — "este saldo é válido", "processei 5GB" — tem custo permanente se aceito sem verificação. Por isso a v4 deixa o agente decidir orquestração otimisticamente, mas exige verificação para toda afirmação que muda estado replicado ou que gera remuneração.

### 1.2 Por que o Agente é "Mais Confiável" — e por que **não** é à prova de violação

O agente roda em hardware potencialmente hostil, e a plataforma **descartou TEE/TPM** (§5.2). Então ele não é tamper-proof. É "mais confiável" por três razões operacionais:

1. É o **mesmo código reproduzível** em todo lugar — comportamento honesto é bem-definido e barato de checar.
2. **Não tem incentivo armazenado** alinhado ao humano dono (não há "carteira do peer" dentro dele a inflar).
3. A rede só **paga e confia nele nas dimensões que consegue verificar**.

Um agente adulterado que mente é detectado *pós-hoc* nas dimensões verificáveis (falha o desafio de storage, não tem recibo de contraparte, falha a amostra de recálculo) → sua reputação local cai em todo peer honesto → é despriorizado e não remunerado. Detecção pós-hoc e probabilística, coerente com o threat model que aceita a ausência de atestação de hardware.

### 1.3 Princípios Derivados

| Princípio | Implicação |
| :--- | :--- |
| Orquestração otimista, afirmação verificada | O caminho rápido assume cooperação; o que persiste/remunera é verificado |
| Rigor proporcional à sensibilidade ontológica | Conteúdo (comutativo) = efêmero/otimista; financeiro (não-comutativo) = serializado/persistido |
| Comutativo se resolve sozinho; não-comutativo se serializa | Documentos via Automerge; saldo via validador declarado da linhagem |
| Invariante no core, política na SPEC | A SPEC escolhe a fechadura; o core é dono da lei que diz que a porta tem que trancar |
| Medir é do core; liquidar é do módulo | A rede mede contribuição de forma verificável; converter em crédito/fiat/reputação é decisão de SPEC |
| Sybil é problema de identidade, não de economia | A economia *assume* a camada de identidade; não a substitui |
| Honestidade radical sobre limites | Riscos aceitos e território de pesquisa são declarados, não escondidos |

### 1.4 As Três Modalidades e Onde a v4 Incide

O foco comercial é **redes públicas e corporativas**; o **P2P puro é o padrão-ouro / campo de prova** da tese "P2P aumenta segurança e resiliência reduzindo custo de cloud". Toda complexidade que só serve ao P2P puro (defesa Sybil pesada, convite-como-asset, detecção topológica) é **módulo opt-in via SPEC**, nunca baixada no core de todo deployment.

---

## §2 — Protocolo (Engenheiros de Protocolo)

### 2.1 A Divisão Fundamental: Comutativo vs. Não-Comutativo

| Classe | Exemplos | Resolução |
| :--- | :--- | :--- |
| **Comutativo** | `CONTENT:DOCUMENT`, `CONTENT:MESSAGE`, créditos a saldo | Mescla sem ordem (Automerge para documento; merge aditivo para saldo). Qualquer agente aplica; desempate determinístico. Otimista. |
| **Não-comutativo** | Débito de `ASSET:BALANCE_STATE`, emissão de `ASSET:PERMISSION`, alteração de `SPECIFICATION` | Exige **serialização por linhagem** (§2.3). Validador declarado serializa; UI otimista mostra `pending` local até finalizar. |

### 2.2 Eleição de Committer: Colapso Determinístico

Os quatro modos da v3.1 colapsam. Como todo device roda agente de sistema, a eleição é **sempre determinística entre agentes, nunca negociada**:

- **Comutativo**: o agente local commita; coordenação entre agentes pelo desempate determinístico já existente (menor `entity_id` ativo no ciclo); Automerge resolve o conteúdo. Caem `first_proposer` (racy) e `manual` (político).
- **Não-comutativo**: roteado ao validador declarado da linhagem (§2.3). Não há mais eleição de líder global nem quórum de emergência a 2/3.

### 2.3 Serialização por Linhagem — a Invariante de Core

**A invariante (responsabilidade do core, inviolável):**

> Duas escritas conflitantes na mesma linhagem não-comutativa **não podem** ambas chegar ao estado `finalized`.

O core a enforça independentemente da política: uma finalização não-comutativa só é válida se carrega evidência satisfazendo a regra declarada **e** não existe finalização conflitante na linhagem; colisões são faltas forenses com assinantes responsabilizáveis (§2.5).

**A política (responsabilidade da SPEC do ativo):**

A `SPECIFICATION` que governa o ativo declara o conjunto de validadores e a regra de acordo. Pode ser lista fixa ou regra (ex.: "agentes com `ASSET:ROLE=auditor` emitido pela Loja X"; "os K do anel de custódia"; "o super peer corporativo"). Fallback: para ativos cuja SPEC não declara nada (P2P puro), o conjunto vem do **anel de custódia determinístico** (`hash(entity_id)` sobre os agentes disponíveis), reusando a custódia da v3.1.

```yaml
serialization:
  mode: "leader" | "quorum"
  set: [validator_ids…] | "custody_ring"
  k: N
  fault_model: "crash" | "byzantine"
  lease: { ttl, renew_quorum }   # apenas no modo leader
```

**Por que a invariante não pode ser definida por SPEC:**

1. SPEC é dado **mutável e não-confiável** no grafo; confiar nela para definir "o que torna uma escrita financeira segura" é a mesma circularidade que a v3.1 §2.1 já proíbe ("para validação de acesso o sistema *nunca* consulta o payload de SPECIFICATIONs"). A invariante de serialização é da mesma classe (segurança).
2. O modo de falha de uma escolha errada aqui não é UX degradada — é **cunhagem silenciosa**. Se "deve serializar" fosse botão de SPEC, um módulo malicioso ou desatento declararia `k=0` e teria saldo sem proteção.
3. **Accountability** exige invariante conhecida pelo core: declarar validadores só responsabiliza se o core consegue dizer "esta finalização violou a invariante, eis a prova, corte estas cauções".

**Primário vs. quórum — o eixo real é *quando se paga o custo do quórum*:**

- **`leader` (Raft-like)**: paga quórum uma vez por mandato (lease) para eleger/renovar o líder; o líder serializa muitas ops baratas (1 RTT cada). Líder sem lease é **inseguro sob partição** (split-brain → double-spend); a lease, cedida por quórum, é o que o torna seguro. Bom para alta frequência e liderança estável.
- **`quorum` (Paxos-like, por op)**: cada op precisa de K assinaturas; com `K > N/2` (crash) ou `K ≥ 2f+1, N ≥ 3f+1` (bizantino), duas ops conflitantes não atingem ambas o limiar. **Seguro sob partição por construção** — o lado sem K congela (congelamento escopado à linhagem); o outro finaliza.

Ambos repousam sobre quórum para a segurança; diferem em quando o pagam.

**Defaults por modalidade:**

- **Corporativo** → `leader`, primário = super peer da organização, crash-fault. Concentrar ordenação na autoridade é legítimo (ela é a dona); menor latência.
- **Pública** → `quorum` entre validadores operados/licenciados, crash ou bizantino-leve.
- **P2P puro** → `quorum` bizantino sobre o anel de custódia, aceitando o congelamento escopado quando o quórum é inalcançável.

A escolha leader-vs-quorum mapeia **quanto se confia no conjunto** — e é *por isso* que é política de SPEC (a confiança varia por deployment); a invariante é do core *exatamente porque* a segurança não pode depender da confiança do deployment.

### 2.4 Fluxo de Aprovação de Operação Não-Comutativa (Consolidado)

A intent é o **hub**. Tudo pende dela; tudo é nó-para-nó (`source_id` sempre nó; aqui os `target_id` também são todos nós — a política de preferir arestas a id-refs fica honrada de ponta a ponta).

```
A           ──[AUTHORED]──→  C (CONTENT:INTENT; valor cifrado no payload)
C           ──[SPENDS]────→  H        (head atual de AA — nó; âncora de serialização)
C           ──[CREDITS]───→  AB       (entity_id do ativo que recebe)
V(dono)     ──[APPROVES]──→  C        (K=1 no caso comum; uma aprovação)

— após aprovação, o aplicador determinístico cria:
AA_new      ──[MUTATES]───→  H        (novo saldo de AA = decrypt(H) − valor)
AB_new      ──[MUTATES]───→  AB_head  (novo saldo de AB = decrypt(AB_head) + valor)
AA_new      ──[TRANSFERS]─→  C        (executado; referencia a intent — navegável)
AB_new      ──[TRANSFERS]─→  C
```

Regras do fluxo:

1. **Âncora de origem por head, destino por entity_id.** `SPENDS → H` fixa a *versão* consumida (gastar é não-comutativo; pinar o head exato é o ponto). `CREDITS → AB` aponta a linhagem estável (creditar é comutativo; fixar o head de AB serializaria o recebimento sem necessidade). Casa com o padrão da v3.1 §2.1 (`AGGREGATES`/`REQUIRES` apontam para `entity_id`).
2. **O `serialization_ref` é uma aresta, não campo de payload.** É a própria `SPENDS → H`. Benefício: detecção de conflito **estrutural** — "outras intents com `SPENDS` para o mesmo H que eu aprovei" — sem decifrar valor nenhum.
3. **Só o débito é serializado.** O crédito a AB é monotônico (não pode dar double-spend) e dispensa aprovação própria. Créditos concorrentes a AB bifurcam e fazem **merge aditivo** (soma os deltas, nunca LWW — LWW perderia dinheiro), pela regra da SPEC de `ASSET:BALANCE_STATE`.
4. **K=1 é o caso comum** (cashback, fidelidade, maioria dos não-financeiros). A posse da linhagem é **determinística** (`hash(AA.entity_id)` → um agente do conjunto declarado), **não** pega-quem-agarra-primeiro — senão dois validadores aprovam intents conflitantes gastando o mesmo head. A fila efêmera do grupo de validadores distribui *linhagens diferentes* entre os agentes (load-balancing) e sinaliza liveness; dentro de uma linhagem, sempre o mesmo dono.
5. **Finalização pelo aplicador determinístico, não "o N-ésimo".** Sob aprovação assíncrona com K>1, vários validadores podem achar que cruzaram o limiar e finalizar em duplicado → fork. O aplicador é determinístico (menor `entity_id` entre os aprovadores).
6. **Evidência inline, não agregada.** As assinaturas dos aprovadores ficam individualizadas (em `APPROVES` separadas, ou bundle inline), preservando atribuição para corte de caução. Assinatura agregada (BLS/threshold) economiza bytes mas apaga "quem assinou o quê".
7. **Síncrono vs. assíncrono é representação SPEC-selecionável da mesma invariante.** **Assíncrono** (intent persistida, validadores aprovam independentemente, A pode estar offline) é o **default financeiro** — tolera partição/intermitência. **Síncrono** (coleta efêmera + bundle consolidado) serve alta frequência sensível a volume. O core verifica o predicado de quórum independentemente da forma.

Coordenação dos validadores (pedido/respostas de assinatura, fila, liveness) corre por **canal efêmero**; só a estrutura acima é durável.

*Escopo:* assume AA e AB do **mesmo tipo de ativo** (mesmo conjunto de validadores; uma aprovação cobre o movimento atômico). Transferência entre tipos/emissores diferentes exige validadores de ambos os lados — fora de escopo nesta versão.

### 2.5 O Que Persiste em Não-Validação

| Caso | O que persiste |
| :--- | :--- |
| **Rejeição honesta** (op inválida, validador recusa corretamente) | **Nada no grafo.** A op não finaliza; a UI mostra "falhou", o usuário corrige. Tentativa guardada só localmente (privado, não-replicado). |
| **Proponente malicioso** insistindo em ops inválidas | Apenas **reputação local** caindo em cada validador + rate-limit local. Sem fato de grafo. |
| **Validador se comporta mal** (assina op inválida, ou assina duas ops conflitantes no mesmo head) | **Único caso durável**: um `CONTENT` autocomprovável (a acusação verificável), autorado por quem detectou, embutindo os objetos assinados como prova. Consequência: caução cortada + reputação despenca (qualquer um re-verifica). |
| **Finalizações conflitantes** | **Impossível** sob o quórum recomendado (`K > N/2` / bizantino). Se ocorrer = política insegura ou conjunto comprometido além do limiar (§5.2). Persiste a evidência do conflito + corte das cauções. |

Isto corrige a "retenção perpétua de rejeições" da v4 anterior: rejeição honesta (incluindo erro de digitação de valor) **não** gera marca forense permanente. Só o ato provável de uma parte **caucionada** vai durável.

### 2.6 Estado `pending` Local vs. `finalized` Durável

O `pending` vive numa projeção **local não-replicada** do proponente (e pode ser exibido à contraparte pelo canal efêmero: "A está te enviando, aguardando confirmação"). Só ao finalizar entra em `nodes`/`edges`. Com isso, a máquina de estados que a v4 anterior tentava persistir colapsa em **dois estados**: `pending` (local) | `finalized` (durável, imutável). Não há mais estado mutável numa aresta — eliminando a contradição com o append-only.

### 2.7 Integridade do Agente: Auditoria + Desafios "Canary"

Além de auditar o que o agente fez, a rede **testa proativamente** com desafios de gabarito conhecido, indistinguíveis do trabalho real (amostragem proativa, não só reativa):

| Trabalho | Desafio indistinguível? |
| :--- | :--- |
| Determinístico (assinatura, merge CRDT, regra Zen) | **Forte** — objeto sintético válido com resultado conhecido; qualquer um re-verifica o gabarito |
| Storage | **Forte** — desafio-resposta de retrievability (`hash(nonce ‖ byte-range)`) |
| Banda/serving | **Forte** — peer-sonda pede chunk; o agente não sabe que é sonda |
| Compute não-determinístico (IA) | **Fraco** — não dá para fabricar gabarito indistinguível |

Honestidade: **eleva o custo de trapacear, não o elimina** (risco "defeat device" se o desafio for distinguível por canal lateral). O emissor do desafio precisa de gabarito confiável → forte no determinístico (re-verificável por qualquer um) e em redes com autoridade (suíte contínua de honeypots = **integridade-como-serviço**, vendável nas modalidades comerciais).

### 2.8 Bloqueio e Tiers de Acesso

**Princípio:** *privacidade criptográfica exige audiência limitada; conteúdo público recebe apenas bloqueio social.* Criptografia controla acesso por quem tem a chave; bloqueio é revogar acesso. Esses compõem para audiência limitada e quebram para ilimitada — uma chave em milhões de mãos é trivialmente redistribuída a um bloqueado, e tornar a chave escassa por-espectador forçaria um custódio online por leitura, contradizendo a tese local-first/P2P.

Mecanismo (refina o fluxo inverso da v3.1 §2.2): a chave nunca está no asset; o asset/UCAN é o **direito de pedir**, e o Key Vault valida antes de liberar. A v4 adiciona um **predicado de bloqueio** à liberação ("libera se o solicitante não está na lista de bloqueio do autor"). Ganho: revogação O(1 pedido negado), latência = TTL da chave em RAM, **sem rotação de época**. No caso privado, o emissor da chave pode ser o próprio agente do autor → a lista de bloqueio nunca sai dele.

| Audiência | Modelagem | Força do bloqueio |
| :--- | :--- | :--- |
| **DM** (2 pessoas) | Grupo de 2, chave de época | E2E forte |
| **Seguidores de X** (perfil privado) | `PROFILE:ORGANIZATION` "seguidores de X", chave de época do grupo, `ASSET:PERMISSION` sobre o subgrafo | **Criptográfico** (chave-na-emissão com predicado + TTL) |
| **Feed Público** | `PROFILE:ORGANIZATION` global, **um** `ASSET:PERMISSION` global de leitura; bloqueio = filtro de leitura sobre arestas `BLOCKS` limitadas | **Social** — gateia primeira emissão (eleva a barra), não é garantia criptográfica |

Bloqueio do feed público: **uma** `ASSET:PERMISSION` global (O(1), não O(usuários) arestas), e o bloqueio como **arestas `BLOCKS` de X → Y** (limitadas — dezenas, não milhões), avaliadas na montagem do feed. Acesso (sou membro?) e bloqueio (este autor deve ser filtrado da minha visão?) ficam separados; não se bake o bloqueio na query do asset compartilhado.

---

## §3 — SDK (Desenvolvedores de Cliente)

### 3.1 Otimizações de Schema Físico

A enchente de arestas da v4 anterior é **prevenida** (orquestração efêmera + contribuição agregada, §3.3), então não há raspagem desesperada de bytes. As otimizações que ficam são as corretas:

| Campo | Ação | Ganho |
| :--- | :--- | :--- |
| `pub_key` | **TEXT → BLOB** (mantida, não removida) | 32 bytes crus vs. 44–64 (base64/hex). Verificação continua O(1) e autossuficiente. |
| `previous_hash` | **TEXT → BLOB** | hash de 32 bytes vs. 64 em hex |
| `payload_iv` | Fundir no payload (`[IV 12B][ciphertext]`) | 12 bytes + overhead de coluna; não afeta o fingerprint RBSR (`SHA-256(id ‖ signature)`) |
| `retention_state` | TEXT → INTEGER (0=integral, 1=pruned, 2=expunged, 3=orphan) | ~6–8 bytes |

**O que NÃO mudar:**

- `payload`, `signature` — já são BLOB.
- IDs (`id`, `entity_id`, `source_id`, `target_id`) — **ficam TEXT**. Blobificar economizaria ~10B/ID, mas a VFK inspeciona o 11º *caractere* (`N`/`E`) e a ordenação lexicográfica/depuração dependem da forma texto. Custo de ergonomia pago de propósito, como o `entity_id`.
- `type` — quer **dicionário/enum**, não BLOB; mas isso exige um **registro canônico global** (concern de protocolo, não troca local livre). Ficar como TEXT por ora.
- `created_at` — **mantido**. Com a enchente prevista, não há motivo para extraí-lo de `hlc >> 16` (que ainda herdaria o skew do `max()` com carimbos remotos). Permanece para exibição/janela temporal.

### 3.2 Tipos de Aresta Novos (Mínimos)

Nenhum tipo de **nó** novo. Os tipos de **aresta** são reduzidos ao mínimo que passa pelo crivo de minimalismo (caderno-2/01 §4):

| Aresta | from → to | Papel |
| :--- | :--- | :--- |
| `SPENDS` | `CONTENT:INTENT` → head de `ASSET` (nó) | Âncora de serialização (versão consumida) |
| `CREDITS` | `CONTENT:INTENT` → `ASSET` (entity_id) | Destino comutativo |
| `APPROVES` | `PROFILE:SYSTEM` → `CONTENT:INTENT` | Aprovação de validador (evidência inline) |
| `TRANSFERS` | nó de saldo novo → `CONTENT:INTENT` | Execução, referenciando a intent (navegabilidade) |
| `CONSUMES` | `PROFILE` → `CONTENT` | Consumo (histórico próprio; verbo distinto) |
| `CONTRIBUTES` | `PROFILE:SYSTEM` → prova de contribuição | Banda/storage/compute unificados por `kind` no atributo |
| `BLOCKS` | `PROFILE` → `PROFILE` | Bloqueio social (limitado, filtro de leitura) |

`CONTRIBUTES` unifica os três tipos de contribuição (`kind: serve|store|compute`) porque suas regras de validação/cripto/sync são idênticas e só muda o rótulo — exatamente o critério de "mesmo tipo diferenciado por payload". Falta de validação **não** gera aresta nova: ver §2.5.

### 3.3 Medição de Contribuição — Quatro Regimes

Medida **por device** (agente ligado ao `PROFILE:AUTHENTICATION` do dono por aresta de posse); o peer é a soma dos devices.

| Contribuição | Verificação | Confiança |
| :--- | :--- | :--- |
| **Banda** | Recibo assinado pela **contraparte**, ancorado ao `InfoHash`/hash de chunk do grafo | Bilateral, verificável-pelo-dado |
| **Storage** | **Desafio-resposta** de retrievability | Verificável sob demanda |
| **Compute determinístico** (validação, merge, regra Zen) | **Reexecução de amostra aleatória** | Probabilístico (a amostragem certa) |
| **Compute não-determinístico** (IA, análise) | **Aceitação do solicitante** + reputação | Mercado de reputação (locação de tempo de máquina) |

Agregação para conter volume: `CONSUMES`/`SERVES`/`CONTRIBUTES` em granularidade de **sessão/época**, não por chunk (recibos por chunk são efêmeros e consolidados). O *standing* acumulado é um `ASSET:BALANCE_STATE` governado por SPEC de contribuição — a aresta de contribuição está para esse saldo como `TRANSFERRED_TO` está para o saldo de dinheiro. Zero tipo de nó novo; mesmo code path de qualquer saldo.

O seed da amostragem deriva do `output_digest`/beacon, **nunca** de um contador que o ator incrementa (anti-grinding).

### 3.4 Reputação Local

- **Projeção local não-replicada** (no estilo `RelayTrustModel`): local, de primeira mão, **não-transitiva**.
- **Fatos negativos verificáveis** vão ao grafo como `CONTENT` autocomprovável (§2.5), re-checáveis e falsificáveis (acusação falsa é autopunitiva via `APPEAL` re-verificado). **Scores subjetivos ficam locais.**
- **Due-diligence escala com stake**: antes de op não-comutativa de alto valor, consulta os fatos-negativos-verificáveis da contraparte e re-verifica; para interação de baixo valor, não se incomoda.
- **Peer sem histórico** → cautela estrutural (limites conservadores, custódia restrita), não palpite. Em rede com autoridade, o **onboarding da autoridade é o bootstrap**.
- Atestações de terceiros = **dicas ponderadas** pela confiança de primeira mão no atestador; um novato pondera tudo perto de zero e cai nos fatos verificáveis.

---

## §4 — Governança & Operações (Fundadores e Operadores de Rede)

### 4.1 Economia como Módulo ASSET (Medição vs. Liquidação)

A economia de contribuição é **um** modelo econômico entre vários que o ASSET viabiliza — não primitiva do core:

- **Core entrega medição verificável** (os quatro regimes do §3.3): recibos, provas de storage, amostras de compute → um registro assinado e auditável de trabalho feito.
- **Liquidação** (virar crédito interno, fiat/remuneração real, ou só reputação) é decisão de SPEC por rede/módulo, via Zen Engine. A regra "contribuição → crédito" é procedimento na SPEC, não no core.

Isto resolve o regresso de mint da v4 anterior: o nó de contribuição é assinado pelo agente e ancorado em evidência verificável sob demanda (spot-check de recibo/storage), **não** pré-auditado por K=5 recursivo. E atende ao objetivo de **múltiplas economias**: o mesmo mecanismo roda a economia de pontos de um módulo de fidelidade e a economia de contribuição da rede.

### 4.2 Defesa Sybil

A defesa **primária** é o **custo de criação de identidade** (v3.1 §1.4), **separado da economia**. A economia só mede contribuição; ela coludiria se fosse a defesa (Sybils contribuindo entre si). Stack para P2P puro (módulos opt-in via SPEC):

- **Convite-como-`ASSET:INVITE`**: saldo finito, emissão restrita, **gateada por standing** (mais convites por ser bom cidadão). Converte "100 identidades já" em "fluxo lento gateado por contribuição real". Rate limiter, não muro.
- **Responsabilização do convidante (staking social)**: convidou quem comete mau ato verificável → sua reputação leva o golpe.
- **Irrelevância por diversidade**: contribuição só conta servindo contrapartes **distintas e independentemente reputadas**. 1000 Sybils servindo uns aos outros = ~0 de standing. Mata a fome, não a existência.
- **Bond/caução para papéis privilegiados** (validador/custódio): mau comportamento corta a caução. É aqui que a economia ganha papel de **segurança** legítimo — bonding, não gating de participação básica.
- **Detecção topológica** (SybilGuard/SybilLimit): real mas pesada, exige visão quase-global — natural como add-on da **autoridade** (mais um recurso das modalidades gerenciadas).

**Teto honesto:** nenhum sistema P2P puro resolve Sybil sem âncora confiável ou recurso real-escasso. A alegação correta é "resistente o bastante para ser padrão-ouro e servir deployments tolerantes a confiança", **não** "Sybil-proof". Em redes comerciais, Sybil está resolvido na porta (identidade verificada).

### 4.3 Remuneração e Telemetria

A remuneração (tráfego, armazenamento, **processamento** — validações, análises, modelos de IA locais) é a liquidação da medição do §3.3, governada por SPEC. A fronteira honesta: **medir** pode ser quase-trustless; **liquidar em dinheiro** é decisão de negócio e jurídica por rede, e não deve fingir propriedade criptográfica. As duas primeiras dimensões (banda/storage) são quase-trustless; a terceira (compute determinístico) é probabilística; a quarta (compute não-determinístico) é mercado de reputação.

### 4.4 Variantes por Modalidade

| Dimensão | P2P Puro | Pública | Corporativa |
| :--- | :--- | :--- | :--- |
| Identidade / Sybil | Autogerada; convite-como-asset + diversidade + bond | Validada por autoridade (resolvido na porta) | SSO (resolvido na porta) |
| Serialização (default) | `quorum` bizantino sobre anel de custódia | `quorum` entre validadores licenciados | `leader` = super peer |
| Sob partição | Congelamento escopado à linhagem | Idem; autoridade tende a estar presente | Raro; failover por lease |
| Economia de contribuição | Encorajada (essencial p/ regular abuso) | Encorajada (autoridade pode subsidiar leves) | Opcional (desligada por padrão) |
| Integridade do agente | Auditoria + desafios determinísticos | + suíte de honeypots da autoridade | + honeypots; alta confiança base |
| Retenção forense | Faltas de validador perpétuas | Idem, em super peers | Idem, em super peers |

---

## §5 — Threat Model

### 5.1 Coberto pelo Design

| Ameaça | Proteção | Eficácia |
| :--- | :--- | :--- |
| Agente adultera payload | Assinatura original do usuário quebra → rejeitado | ✅ Total |
| Agente adultera resultado verificável (merge, validação) | Auditoria + desafio canary detectam | ✅ Forte |
| Double-spend (mesma rede) | Serialização por linhagem; conflitos ao mesmo validador | ✅ Total em operação normal |
| Double-spend sob partição | Congelamento escopado à linhagem (sem failover não-cercado) | ✅ Total (custo: liveness daquele ativo) |
| Auditor não pode ler saldo cifrado | Validador declarado já é custódio com a chave | ✅ Resolvido |
| Validador finaliza em duplicado | Aplicador determinístico (não "o N-ésimo") | ✅ Total |
| Validador mente/duplo-assina | Falta autocomprovável → caução cortada | ✅ Total (responsabilização) |
| Telemetria autorreportada falsa | Recibo de contraparte / desafio / amostra | ✅ Nas dimensões verificáveis |
| Peer parasitário | Irrelevância por diversidade; PCR opcional | 🟡 Econômica |

### 5.2 Aceito como Risco

| Ameaça | Por que aceito |
| :--- | :--- |
| Agente substituído por versão maliciosa | TEE/TPM impediria; design optou por detecção pós-hoc (auditoria + canary) |
| Insider que relaya conteúdo a um bloqueado | Bloqueio é criptográfico contra o bloqueado **sozinho**; nunca contra um insider colaborador |
| Conjunto bizantino comprometido além do limiar | "A rede já está comprometida"; o quórum recomendado torna o caso normal impossível |
| Trapaça em compute não-determinístico bem desenhada | Desafio canary é fraco aqui; vira mercado de reputação com disputa |

### 5.3 Território de Pesquisa (não tratado como assentado)

- **Verificação trustless de compute não-determinístico** (IA local) — fica como mercado de reputação, não ledger provado.
- **Transferência atômica entre tipos/emissores de ativo distintos** — exige validadores de ambos os lados; modelagem futura.
- Qualquer pretensão de **bloqueio criptográfico de conteúdo público** — declarado impossível, não a implementar.

---

## Apêndice A — Fronteiras com os Cadernos (alterações de suporte)

1. **`caderno-3-sdk/01-sqlite-and-projections-schema.md`** — `pub_key` e `previous_hash` para BLOB; fundir `payload_iv` no payload; `retention_state` para INTEGER; manter `created_at` e IDs como TEXT.
2. **`caderno-2-protocol/01-graph-ontology.md`** — registrar os tipos de aresta do §3.2 sob o crivo de minimalismo; `SPENDS` referencia head (nó), `CREDITS` referencia `entity_id`.
3. **`caderno-2-protocol/02-cryptographic-lineage-and-auth.md`** — adicionar predicado de bloqueio na liberação de chave pelo Key Vault (§2.8); manter o fluxo inverso.
4. **`caderno-2-protocol/04-automerge-integration-spec.md`** — colapsar os modos de committer em eleição determinística entre agentes; regra de **merge aditivo** para `ASSET:BALANCE_STATE` sob créditos concorrentes.
5. **`caderno-4-governance/`** — formalizar serialização por linhagem (invariante de core vs. política de SPEC, §2.3), economia-como-módulo (§4.1), defesa Sybil opt-in (§4.2) e remuneração (§4.3).
6. **`caderno-2-protocol/03-set-reconciliation-protocol.md`** — sem mudança estrutural; confirmar que o fingerprint usa a `signature` própria da aresta (não afetado pelos bundles de quórum em atributos).

## Apêndice B — Glossário v4

| Termo | Definição |
| :--- | :--- |
| **Agente de Sistema** | `PROFILE:SYSTEM` no device do usuário, codificado para servir a rede. Confiável para orquestrar, não para afirmar o não-verificável. |
| **Serialização por Linhagem** | Ordenação de ops não-comutativas pelo validador declarado da linhagem do ativo. |
| **Invariante de Core** | "Duas escritas conflitantes na mesma linhagem não-comutativa não podem ambas finalizar." Enforçada pelo core, independente da política de SPEC. |
| **Validador Declarado** | Conjunto/regra de validadores que a SPEC do ativo declara; fallback ao anel de custódia determinístico. |
| **Aplicador Determinístico** | O aprovador de menor `entity_id` que materializa a finalização, evitando duplicação. |
| **Desafio Canary** | Tarefa de gabarito conhecido, indistinguível do trabalho real, para amostrar a integridade do agente proativamente. |
| **Contribuição Verificável** | Trabalho à rede medido por um dos quatro regimes (banda/storage/compute-det./compute-não-det.). |
| **Standing** | Saldo de contribuição acumulado (`ASSET:BALANCE_STATE` de contribuição), por device → por peer. |
| **Reputação Local** | Avaliação de primeira mão, não-transitiva, não-replicada, que cada peer faz dos peers com que teve contato. |
| **Fato Negativo Verificável** | Mau ato re-checável por qualquer um (assinatura inválida, duplo-sinal), persistido como `CONTENT` autocomprovável. |
| **Economia-como-Módulo** | A economia de contribuição é um `ASSET` governado por SPEC; o core mede, a SPEC liquida. |
| **Bloqueio Social** | Filtro de leitura sobre arestas `BLOCKS` para conteúdo público; não é garantia criptográfica. |

---

*Esta RFC consolida as decisões de design da v4: o agente de sistema como espinha de orquestração (confiável para orquestrar, não para afirmar); a serialização por linhagem com invariante no core e política na SPEC; o fluxo de aprovação intent-hub com K=1 como caso comum; a medição de contribuição em quatro regimes verificáveis alimentando uma economia modular sobre ASSET; a reputação local com fatos negativos verificáveis; e a defesa Sybil ancorada no custo de identidade, separada da economia. As otimizações de schema preservam o que é criptograficamente load-bearing, prevenindo a enchente de arestas em vez de raspar bytes.*

