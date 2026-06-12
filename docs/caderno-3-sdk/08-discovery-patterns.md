# 08-discovery-patterns.md — Padrões de Descoberta de Peers (Responsabilidade de Módulo)

> **Origem normativa:** RFC-005 §A.13 (substitui o diretório no core; reflexo de B.3).
> **Princípio:** o **core não implementa diretório**. Descoberta de usuários é responsabilidade de cada módulo de aplicação. A plataforma fornece os blocos (transporte, sync, auth, [[asset-invite]]); cada módulo escolhe seu padrão conforme seu modelo de governança. Este documento é **documentação de padrões**, não código de core.

---

## 1. Os Três Padrões

| Padrão | Ideal para | Mecanismo |
| :--- | :--- | :--- |
| **1 — Peer Propagation** | Redes privadas, comunidades fechadas, P2P puro | `device_state.db` + `ASSET:INVITE` via peer intermediário (A conhece B; B apresenta C). Sem diretório, sem operador. Privacidade máxima; alcance limitado à rede de confiança. |
| **2 — Presence Announcement** | Redes semi-abertas com descoberta por tag/interesse | Nós `CONTENT` governados por `SPECIFICATION:ANNOUNCEMENT` no grafo público, indexados por peer de diretório opcional. Privacidade = visibilidade do grafo (grafo público ⇒ anúncios públicos). |
| **3 — Authoritative Directory** | Redes geridas (corporativo, SaaS, público) | Peer do sistema como índice pesquisável por `display_name`. Operador vê tudo; privacidade definida pelo contrato/TOS da rede. |

## 2. Spec de Referência: Diretório Pseudônimo (opcional)

A spec técnica do antigo "diretório pseudônimo" (nó `CONTENT`, busca por hash exato, opt-in) **permanece como referência para módulos que adotem o Pattern 2** — não é normativa no core (RFC-005 §A.7, rebaixamento).

## 3. Nota Técnica — OPRF (backlog, sem tarefa)

Se um módulo Pattern 2 exigir privacidade dos identificadores **contra o próprio operador** do diretório, a técnica recomendada é **OPRF** (2HashDH sobre ristretto255, RFC 9497): o índice guarda `OPRF_k(identificador)` com `k` secreto do peer de diretório; o cliente avalia cegamente e aprende `OPRF_k(x)` sem revelar `x`, e o operador não consegue força bruta offline sem rodar o protocolo por candidato (convertendo ataque offline em online, onde o rate-limit morde). **Não planejado para este ciclo.**

## 4. Limites Honestos Declarados

* **Pattern 3:** privacidade zero contra o operador, por contrato.
* **Pattern 2 sobre grafo público:** anúncios são públicos por construção.
* **Proteção contra o operador** exige OPRF (futuro, por módulo).
* **Privacidade do grafo de buscas** (quem procurou quem) exigiria PIR — fora de escopo; **declarar, não prometer**.

## 5. Relações

* [[caderno-3-sdk/07-chat-reference-spec]] — descoberta do mensageiro via Pattern 3 na modalidade gerida.
* `caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.4` — descoberta de peers (cold/warm) na camada de transporte (problema distinto: endereçamento de peers já conhecidos, não descoberta de usuários).
