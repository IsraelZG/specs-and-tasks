# 01-graph-ontology.md — Graph Ontology Specification

Este documento descreve a ontologia unificada do grafo de dados da Plataforma V3.1. A decisão fundamental do sistema reside no minimalismo ontológico: toda entidade física ou abstrata do mundo é representada por um de quatro tipos de [[no|nós]], e os relacionamentos ou ações são representados por [[aresta|arestas]].

---

<a id="substantivo-verbo-principio"></a>
## 1. O Princípio do Substantivo e do Verbo

> Conceito canônico: [[substantivo-verbo-principio]]

Toda a modelagem semântica no sistema deve conformar-se à seguinte regra linguística vinculativa: **nós são substantivos e arestas são verbos**.

* O ato de delegar não é um nó — é uma aresta (`DELEGATED_TO`). O nó é a permissão ou papel delegado ([[asset-permission|`ASSET:PERMISSION`]] ou [[asset-role|`ASSET:ROLE`]]).
* O ato de consentir não é um nó — é uma aresta (`GRANTED_TO`). O nó é a declaração de consentimento ([[asset-consent|`ASSET:CONSENT`]]).
* O ato de aprovar não é um nó — é uma aresta (`APPROVED_BY`).
* O ato de mutar/alterar não é um nó — é uma aresta ([[mutates|`MUTATES`]]).
* **Não existe o tipo de nó `EVENT`**. Eventos consolidados são representados por novos nós-versão (na tabela `nodes`) e arestas relacionais. A intenção de uma ação é representada pelo nó [[content-intent|`CONTENT:INTENT`]] (um subtipo de `CONTENT`, não uma primitiva separada).

---

<a id="aresta"></a>
## 2. Convenção de Nomenclatura de Arestas

> Conceito canônico: [[aresta]]

As arestas de alto grau semântico — especialmente relações contínuas entre entidades — seguem o padrão formal:

```
VERBO:DOMÍNIO:SPECIFIER
```

Onde `VERBO` é a raiz verbal no presente contínuo, `DOMÍNIO` é a categoria ontológica da relação e `SPECIFIER` é o refinamento opcional dentro do domínio. Exemplos canônicos:

| Aresta | Significado Semântico |
| :--- | :--- |
| `INTERACTS:CONTENT:LIKES` | Peer curte um nó de conteúdo. |
| `INTERACTS:CONTENT:SHARES` | Peer compartilha um nó de conteúdo. |
| `RELATES:FAMILY:PARENT_OF` | Relação familiar de maternidade/paternidade. |
| `RELATES:SOCIAL:FOLLOWS` | Relação social de seguimento. |
| `PARTICIPATES_IN:GROUP:MEMBER` | Pertencimento a grupo como membro simples. |
| `PARTICIPATES_IN:PROJECT:CONTRIBUTOR` | Pertencimento a projeto como contribuidor de código. |

*Nota: A aresta [[participates-in|`PARTICIPATES_IN`]] substitui permanentemente a antiga aresta `MEMBER_OF` em toda a ontologia da plataforma.*

<a id="verbos-raiz-canonicos"></a>
### 2.1 Verbos Raiz Canônicos e Relacionais

> Conceitos canônicos: [[verbos-raiz-canonicos]] · [[aggregates]] · [[requires]]

Os verbos raiz canônicos aceitos na plataforma são:
* `RELATES` — Relações sociais, familiares e interpessoais.
* `OWNS` — Posse estável de ativos, recursos e documentos.
* `GOVERNS` — Governança, regulação e especificações.
* `INTERACTS` — Interações temporárias ou casuais com conteúdos.
* `PARTICIPATES_IN` — Pertencimento contínuo a grupos, projetos e contextos.

Para expressar a estrutura e composição interna do modelo de permissões, a plataforma define duas arestas estruturais permanentes que apontam para o [[entity-id|`entity_id`]] dos nós:
* **`AGGREGATES`** — Liga uma `ASSET:ROLE` a uma `ASSET:PERMISSION`, indicando que o papel engloba aquela permissão.
* **`REQUIRES`** — Liga uma `ASSET:PERMISSION` a outra, indicando uma dependência ou pré-requisito de acesso.

### 2.2 Arestas de Transação Serializada (v4)

Operações não-comutativas sobre `ASSET` materializam-se a partir de um `CONTENT:INTENT` (o hub), com duas arestas de ancoragem novas:

* [[spends]] — âncora de débito; aponta para o [[head]] específico (`nodes.id`) do `ASSET` de origem, serializando a operação.
* [[credits]] — âncora de crédito; aponta para o `entity_id` (linhagem estável) do `ASSET` de destino, pois creditar é comutativo.

O ciclo de aprovação reusa as arestas existentes [[approves]] (validador → intent) e `RESOLVES` (validador → intent, fechando o ciclo); o movimento executado reusa [[transfers-aresta]] (nó de saldo novo → intent); os nós de saldo resultantes reusam `RESULTED_FROM` apontando para o `CONTENT:INTENT`. A regra de serialização (invariante de core vs. política de SPEC) está em caderno-4/03 §3.5.

**Nota (v4 multidomínio):** Em [[saga|sagas transdomínio]], [[asset-lock|`ASSET:LOCK`]] (item temporal com TTL) pode ser o **output de uma operação de reserva** em vez de transferência final. O lock ancora no head da linhagem via `SPENDS` (herdando detecção estrutural de conflito); expira automaticamente via lápide/GC (caderno-3/01 §2.2) quando TTL vence.

### 2.3 Arestas de Contribuição e Social (v4)

> Conceitos canônicos: [[consumes-aresta]] · [[contributes-aresta]] · [[blocks-aresta]]

* **`CONSUMES`** — Liga um `PROFILE` a um `CONTENT` consumido (ex.: chunks de um [[content-file|`CONTENT:FILE`]]). Verbo distinto (ato do consumidor; histórico próprio).
* **`CONTRIBUTES`** — Liga um `PROFILE:SYSTEM` à prova de contribuição à rede. Unifica banda, storage e processamento por atributo `kind: serve | store | compute` — mesmo tipo diferenciado por payload, pois validação/cripto/sync são idênticas (critério 1 do §4). O *standing* acumulado é um `ASSET:BALANCE_STATE` de contribuição (ver [[standing]]).
* **`BLOCKS`** — Liga um `PROFILE` a outro `PROFILE`. Conjunto **limitado** (dezenas), avaliado como filtro de leitura na montagem do feed público. Não é garantia criptográfica (ver [[bloqueio-social]]).

---

<a id="no"></a>
## 3. Os Quatro Tipos de Nós

> Conceito canônico: [[no]]

<a id="profile"></a>
### 3.1 PROFILE (O Ator)

> Conceito canônico: [[profile]]

Representa entidades ativas e dotadas de identidade criptográfica (par de chaves pública/privada Ed25519) que atuam como sujeitos de ações.
* **Subtipos Canônicos**:
  * [[profile-authentication|`PROFILE:AUTHENTICATION`]] — A identidade-âncora do humano dentro de uma rede. Única por rede, carrega as credenciais primárias.
  * [[profile-persona|`PROFILE:PERSONA`]] — Máscaras de exibição e interação pública do usuário. Múltiplas personas por humano são permitidas.
  * `PROFILE:ORGANIZATION` — Representação de empresa, departamento, consórcio ou grupos com fins de moderação (ver §3.5).
  * [[profile-system|`PROFILE:SYSTEM`]] — Entidades robotizadas que executam funções de infraestrutura (Sync Workers, validadores, etc.).
* **Comportamento**: Emitem ações (arestas `AUTHORED`, `APPROVED_BY`, `SIGNED_BY`) e recebem pertences (arestas `PARTICIPATES_IN`, `OWNS`).

<a id="content"></a>
### 3.2 CONTENT (A Informação)

> Conceito canônico: [[content]]

Dados estruturados passivos e versionados. São a matéria-prima informativa que circula no grafo.
* **Subtipos Canônicos**:
  * `CONTENT:DOCUMENT` — Workspace de texto, planilhas e commits Automerge.
  * [[content-message|`CONTENT:MESSAGE`]] — Mensagens de chat ou instruções internas de microsserviços.
  * [[content-intent|`CONTENT:INTENT`]] — Registro assinado de uma intenção de modificação não-trivial.
  * [[content-theme|`CONTENT:THEME`]] — Variáveis de tematização visual.
  * [[content-translation|`CONTENT:TRANSLATION`]] — Dicionário de strings i18n.
* **Comportamento**: Alvos de criação (`AUTHORED`), mutação (`MUTATES`), governança (`GOVERNED_BY`) ou referência (`REPLIES_TO`, `ATTACHES`).

<a id="asset"></a>
### 3.3 ASSET (O Valor e a Permissão)

> Conceito canônico: [[asset]]

Qualquer recurso finito, direito, saldo ou autorização no sistema.
* **Subtipos Canônicos**:
  * `ASSET:BALANCE_STATE` — Saldo consolidado (débito/crédito) em moeda interna ou fiduciária.
  * `ASSET:INVENTORY` — Estoque físico ou quantidade de SKUs.
  * [[asset-permission|`ASSET:PERMISSION`]] — Direito atômico de acesso e mutação, definido por query de traversal e restrições (substitui `ASSET:CAPABILITY`). **Permanecem declarativos** (não executáveis — a execução é responsabilidade de `SPECIFICATION` procedural / [[zen-engine|Zen Engine]]). Ver caderno-2/02 §2.1.
  * [[asset-role|`ASSET:ROLE`]] — Cargo ou papel de negócio que agrega permissões via arestas `AGGREGATES`.
  * [[asset-consent|`ASSET:CONSENT`]] — Consentimentos para processamento sob a LGPD/GDPR.
  * [[asset-lock|`ASSET:LOCK`]] — Reserva temporária de recurso com TTL (participante de [[saga|sagas multidomínio]]).
* **Comportamento**: Transacionados via arestas `TRANSFERRED_TO`, delegados via `DELEGATED_TO` ou concedidos via `GRANTED_TO`.

<a id="specification"></a>
### 3.4 SPECIFICATION (A Lei)

> Conceito canônico: [[specification]]

Contratos formais imutáveis que definem regras de validação de schemas, comportamento de UI, permissões e governança.
* **Subtipos Canônicos**:
  * `SPECIFICATION:SCHEMA` — JSONSchema ou JSONLogic definindo campos obrigatórios e lógicas.
  * `SPECIFICATION:WORKFLOW` — Máquina de estados ou diagrama BPMN para processos.
  * [[specification-network-governance|`SPECIFICATION:NETWORK_GOVERNANCE`]] — Regras de bootstrap, sucessão e dissolução da rede.
* **Natureza Dual das Especificações**: Cada `SPECIFICATION` pode expressar duas naturezas (sendo ao menos uma obrigatória):
  1. **Schema Declarativo**: Define a estrutura válida (propriedades) para os nós/arestas associados.
  2. **Procedimento Executável**: Define uma transformação determinística de inputs em novos nós/arestas (Zen Engine).
* **Comportamento**: Governam nós (`GOVERNED_BY`), estendem canônicas (`EXTENDS`) e são sucedidas via `SUPERSEDED_BY`.

### 3.5 Moderação via Grupos-como-PROFILE
Para viabilizar a moderação em ambientes colaborativos sem violar a autoria individual, grupos moderados são instanciados como um **`PROFILE:ORGANIZATION`** (e não como `CONTENT`), possuindo seu próprio par de chaves criptográficas (custodiadas pelo cofre de chaves do grupo).
* **Estrutura de Postagem**: Os posts pertencem à pessoa criadora (aresta `AUTHORED`), mas indicam pertença ao grupo através de uma aresta `BELONGS_TO` apontando para o `PROFILE:ORGANIZATION` do grupo.
* **Mecânica de Moderação**: Moderadores autorizados comandam a emissão de uma [[tombstone-lapide|lápide]] (tombstone com `weight = 0`) sobre a aresta `BELONGS_TO`. O post é desvinculado visualmente do feed do grupo sem que a assinatura original do autor no nó-conteúdo seja corrompida.

---

## 4. Diretrizes de Minimalismo Ontológico

A proliferação descontrolada de subtipos ou arestas fragmenta a interoperabilidade da rede. Para adicionar qualquer novo tipo ou aresta no catálogo de `SPECIFICATION`s da plataforma, todos os seguintes critérios de minimalismo devem ser satisfeitos:

1. **Diferenciação de Comportamento Sistêmico**: O novo tipo não deve servir apenas como "marcação semântica para humanos". Se dois tipos possuem regras idênticas de validação, criptografia e sincronização, eles devem ser o mesmo tipo, diferenciados apenas por payload.
2. **Impossibilidade de Resolução por Payload + SPECIFICATION**: A distinção deve ser o último recurso estrutural, não o primeiro.
3. **Existência de Arestas Exclusivas**: O tipo deve participar de pelo menos uma relação ou validação que não faça sentido para nenhum outro tipo.
4. **Reusabilidade Multidomínio**: O tipo deve ser útil em múltiplos módulos ou ser de importância crucial para um domínio central (ex: Financeiro).

### 4.1 Descoberta por Grafo (Discovery-by-Graph)
Os componentes de software devem programar comportamentos com base nas conexões e contratos do grafo, e não por comparações de strings brutas de tipos.

*❌ Código Antipatrono:*
```typescript
if (node.type === 'CONTENT:POST_BLOG' || node.type === 'CONTENT:POST_NEWS') {
  showInFeed(node);
}
```

*✅ Código Correto:*
```typescript
const isPublishable = await checkGraphRelation(node, 'GOVERNED_BY', 'SPECIFICATION:FEED_PUBLISHABLE');
if (isPublishable) {
  showInFeed(node);
}
```

### 4.2 Antipadrão Dual-Nó: "Post", "Story", "Anúncio" NÃO são Subtipos

Uma tentação comum é criar subtipos de `CONTENT` para cada idioma de negócio: `CONTENT:POST`, `CONTENT:POST_BLOG`, `CONTENT:STORY`, `CONTENT:ADVERTISEMENT`, etc. **Essa proliferação viola o minimalismo.**

**Regra:** "Post", "story", "anúncio", "produto" — **todos são `CONTENT` genérico**, diferenciados por uma aresta `GOVERNED_BY` apontando para uma `SPECIFICATION` que define seu schema e seu comportamento de UI/feed.

- `CONTENT` com `GOVERNED_BY SPECIFICATION:FEED_PUBLIC_POST` = é um post publicável.
- `CONTENT` com `GOVERNED_BY SPECIFICATION:STORY_24H` = é uma story; UI aplica expiração via `retention_state = expunged` em 24h.
- `CONTENT` com `GOVERNED_BY SPECIFICATION:ADVERTISEMENT` = é um anúncio; UI aplica tier de audiência conforme schema.

**Metadados observáveis:** Necessidade de propriedades leves observáveis (ex: contagem de interações, timestamp de criação) é resolvida por campos `searchable: true` projetados no schema da `SPECIFICATION` (caderno-3/01 §5 / FTS5). Não cria nó `POST_META` dual — é projeção local, não grafo.

- **Conversa (Chat):** Evita-se criar um nó contêiner "Chat" ou "DM" no grafo. A DM existe puramente quando há permissão mútua escopada ativa, sendo o `conversation_id` calculado deterministicamente a partir dos IDs dos participantes. Grupos de chat utilizam a entidade `PROFILE:ORGANIZATION` existente, com pertencimento por aresta `PARTICIPATES_IN:GROUP:MEMBER`. As mensagens (`CONTENT:MESSAGE`) de grupo apontam para a organização via `BELONGS_TO`. A listagem de conversas na home da aplicação reside em uma projeção local não-replicada (`chat_conversations` no `device_state.db`), evitando tráfego e nós contêineres redundantes no grafo (ver `docs/caderno-3-sdk/07-chat-reference-spec.md`).

**Justificativa:** Critério §4 (minimalismo):
- Os tipos `POST` e `STORY` têm regras idênticas de validação, criptografia e sync (critério 1 = FAIL).
- A distinção é resolúvel por payload + `SPECIFICATION` (critério 2 = FAIL).
- Ambos participam das mesmas arestas (`AUTHORED`, `INTERACTS`, etc.); nenhuma aresta é exclusiva (critério 3 = FAIL).


