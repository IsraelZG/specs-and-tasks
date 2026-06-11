# Fase 2 — Plano de Ondas (atualizado em 2026-06-03)

Revisado contra o inventário ampliado (agora cobre `rfc-v4.md`, `rfc-transacoes-multidominio.md`, `caderno-3-sdk/05-media-transport-plane.md` e `06-connectors.md`).

**Convenções**
- ★ / ★★ / ★★★ = gravidade de consolidação (do inventário).
- **Modo**: `canonical` = o verbete contém a definição · `hub` = o verbete resume e linka; o conteúdo normativo pesado fica no caderno de protocolo.
- ⊕ = conceito **novo** que não existia no plano anterior.
- Foco da Fase 2 = conceitos com ★ ou mais. Os sem ★ (engines de UI, projeções `entity-heads`/`active-edges`/`asset-balances`/`local-permissions`, `ciclo-de-commit`, `eleicao-de-committer`, etc.) **não** viram verbete agora — ficam no lugar e recebem só wikilink na Fase 3.

---

## O que mudou em relação ao plano anterior

1. **Onda 1.5 criada** — três fundações ontológicas que o spine (Onda 1) já referencia mas que não foram criadas.
2. **`content-intent` subiu para ★★** e ganhou uma 4ª fonte (`rfc-v4.md §2.4`, modelo hub). Continua na Onda 3, ainda com o bug de definição dupla no glossário.
3. **`asset-lock` e `asset-invite` agora são ★★** (eram menores/ausentes) — promovidos para a Onda 3 como prioridade.
4. **Três domínios novos** entram como Ondas 9–11 (transações, economia/agente, mídia). Dependem do núcleo, então vêm depois.
5. Vários ★ novos pulverizados nas ondas existentes: `noise-xx`, `matriz-de-classificacao-transporte`, `specification-network-birth`, `first-peer-protocol`, `genesis-state`, `merge-aditivo`, `tombstone-lapide`, `transport-hints`, `notification-connector`, `congelamento-escopado`.

---

## Onda 1 — Espinha *(concluída)*

`hlc` (piloto) · `ulid` · `id` · `entity-id` · `chave-mestra-ed25519` · `chave-de-epoca` · `aresta` · `no` · `mutates` · `linhagem-de-versoes` · `head` · `profile` · `content` · `asset` · `specification`

---

## Onda 1.5 — Fundações ontológicas omitidas ⊕

Faltaram no spine, e a Onda 1 já as referencia como Foam placeholders. Faça antes da Onda 2 para fechar esses links.

| slug | ★ | modo | fonte canônica | por que estava faltando |
|:---|:--|:---|:---|:---|
| `substantivo-verbo-principio` | ★ | canonical | `caderno-2/01 §1` | princípio de nomenclatura do qual derivam `aresta` e todos os verbos; é mais fundamental que `aresta` |
| `verbos-raiz-canonicos` | ★ | canonical | `caderno-2/01 §2.1` | catálogo de verbos; é o análogo de `no` para arestas — `aresta` linka para ele e os verbos específicos são seus "subtipos" |
| `imutabilidade-dupla` | — | canonical | `caderno-2/02 §3.2` | princípio (imutabilidade semântica + criptográfica) que sustenta `mutates`, `linhagem-de-versoes` e `head`, todos da Onda 1 |

---

## Onda 2 — Acesso, chaves e identidade de peer

Núcleo ★★ mais denso. Tudo assenta na Onda 1/1.5 (asset, chave-de-época, aresta, verbos).

| slug | ★ | modo |
|:---|:--|:---|
| `asset-permission` | ★★ | hub (semântica em `caderno-2/02 §2.1`) |
| `asset-role` | ★★ | hub |
| `asset-consent` | ★ | canonical (lente LGPD linka p/ `caderno-1/03 §2.1`) |
| `aggregates` | ★ | canonical |
| `requires` | ★ | canonical |
| `key-vault` | ★★ | hub (`caderno-2/02 §2.2`; lente SDK p/ `caderno-3/02 §1.2`) |
| `ucan` | ★★ | hub (`caderno-2/02 §2.2`; deletar repetição da rfc §2.7) |
| `peer-id` | ★★ | hub (fórmula em `caderno-2/02 §1.4`) |
| `noise-xx` ⊕ | ★ | hub (handshake; `rfc §2.2.1` + `caderno-2/02 §1.4.1`) |

---

## Onda 3 — Subtipos de nó + verbos de relação

Completa a ontologia de tipos. **Grande** — faça em duas sentadas; priorize os ★★ primeiro (`content-intent`, `asset-lock`, `asset-invite`).

| slug | ★ | modo | nota |
|:---|:--|:---|:---|
| `content-intent` | ★★ | canonical | **bug**: definido 2× no glossário (linhas 41 e 125) + `rfc-v4 §2.4`; unificar |
| `asset-lock` ⊕ | ★★ | hub | semântica de reserva/saga; prereq das transações (Onda 9) |
| `asset-invite` ⊕ | ★★ | canonical | `rfc §2.4.4` + `rfc-v4 §4.2` |
| `profile-authentication` | ★ | canonical | `caderno-2/02 §1.1` |
| `profile-persona` | ★ | canonical | `caderno-2/02 §1.3` |
| `profile-system` | ★ | canonical | prereq do `agente-de-sistema` (Onda 10) |
| `content-message` | ★ | canonical | |
| `content-theme` | ★ | hub | identidade em `caderno-2/01`; estrutura completa em `caderno-3/04 §1` |
| `content-translation` | ★ | hub | idem, `caderno-3/04 §2` |
| `participates-in` | ★ | canonical | |
| `consumes-aresta` | ★ | canonical | |
| `contributes-aresta` | ★ | canonical | |
| `blocks-aresta` | ★ | canonical | |
| `predicado-de-bloqueio` ⊕ | ★ | canonical | `caderno-2/02 §2.2.1` |
| `bloqueio-social` ⊕ | ★ | hub | `rfc-v4 §2.8` |

---

## Onda 4 — Sincronização e reconciliação

Zona de duplicação mais grosseira (caderno-2/03 ↔ rfc §2.6–2.8 quase verbatim). Quase tudo **hub** apontando para `caderno-2/03`.

| slug | ★ | modo |
|:---|:--|:---|
| `onda` | ★★★ | hub |
| `rbsr` | ★★ | hub |
| `range-footer` | ★★ | hub |
| `anti-entropy` | ★★ | hub |
| `fingerprint` | ★ | hub |
| `nonce-challenge` | ★ | hub |
| `sync-dirigido-por-ucan` | ★ | hub |
| `replication-factor` | ★ | hub |
| `consistent-hashing` | ★ | hub |
| `poda-segura` | ★ | hub (`rfc §4.3`) |

---

## Onda 5 — Topologia, bootstrap e nascimento de rede

Maioria canônica na RFC de transporte, gravidade ★.

| slug | ★ | modo |
|:---|:--|:---|
| `connection-promotion-engine` | ★ | canonical |
| `relay-trust-model` | ★ | canonical |
| `swarm-registry` | ★ | canonical |
| `graph-based-routing` | ★ | hub |
| `global-network-throttle` ⊕ | ★ | canonical |
| `private-swarm` | ★ | canonical |
| `matriz-de-classificacao-transporte` ⊕ | ★ | hub (`caderno-3/01 §4` ↔ `rfc §2.11`) |
| `specification-network-birth` ⊕ | ★ | canonical |
| `first-peer-protocol` ⊕ | ★ | canonical |
| `genesis-state` ⊕ | ★ | canonical |

---

## Onda 6 — Automerge e edição colaborativa

| slug | ★ | modo |
|:---|:--|:---|
| `documento-casca` | ★★★ | hub (4 fontes; `caderno-2/04 §2`) |
| `automerge-repo` | ★★ | hub |
| `changes` | ★ | canonical |
| `ephemeral-messages` | ★ | canonical |
| `fork-resolucao` | ★ | hub |
| `merge-aditivo` ⊕ | ★ | hub (`caderno-2/04 §4.3` + `rfc-v4 §2.4`) |
| `mfa-s` | ★ | canonical (resolver nome: glossário vs roadmap) |

---

## Onda 7 — Workers, runtime e projeções

| slug | ★ | modo | nota |
|:---|:--|:---|:---|
| `sync-worker` | ★★ | hub | |
| `crypto-worker` | ★★ | hub | |
| `zen-engine` | ★★ | canonical | **alias**: "Validador de Domínio" (nome no glossário) |
| `index-worker` | ★ | canonical | |
| `tinybase` | ★ | canonical | |
| `g4-garbage-collection` | ★ | hub | |
| `vfk` | ★ | canonical | |
| `tombstone-lapide` ⊕ | ★ | canonical | |
| `transport-hints` ⊕ | ★ | canonical | |
| `notification-connector` ⊕ | ★ | canonical | `caderno-3/06` |

---

## Onda 8 — Especificação, governança e liveness

A tríade de liveness é duplicada quase literal entre `caderno-4/03 §3` e `rfc §4.6`.

| slug | ★ | modo |
|:---|:--|:---|
| `specification-network-governance` | ★ | hub |
| `tradeoff-liveness-validadores` | ★ | hub (`caderno-4/03 §3.4`) |
| `consenso-emergencia` | ★ | hub |
| `morte-da-rede` | ★ | hub |
| `congelamento-escopado` ⊕ | ★ | hub (`caderno-4/03 §3.4` + `rfc-v4 §2.3`) |

---

## Onda 9 — Transações multidomínio (v4) ⊕ DOMÍNIO NOVO

Depende de `asset-lock` (Onda 3), `ucan` (Onda 2), `linhagem-de-versoes` (Onda 1). Canônico em `rfc-transacoes-multidominio.md` e `rfc-v4.md`.

| slug | ★ | modo |
|:---|:--|:---|
| `serialization-por-linhagem` | ★★ | hub (`rfc-v4 §2.3`) |
| `invariante-de-core` | ★★ | hub (`rfc-v4 §2.3`) |
| `saga` | ★ | hub (`rfc-transacoes §2`) |
| `2pc-com-lock-ttl` | ★ | hub (`rfc-transacoes §3`) |
| `politica-de-ttl` | ★ | canonical |
| `linhagem-de-coordenacao` | ★ | canonical |
| `revogacao-por-cortesia` | ★ | hub |
| `oraculo-baas` | ★ | canonical |
| `validador-declarado` | ★ | hub |
| `aplicador-deterministico` | ★ | hub |
| `comutativo-vs-nao-comutativo` | — | canonical |

---

## Onda 10 — Economia, agente de sistema e contribuição (v4) ⊕ DOMÍNIO NOVO

Depende de `profile-system` (Onda 3) e dos verbos econômicos.

| slug | ★ | modo |
|:---|:--|:---|
| `agente-de-sistema` | ★★ | hub (`rfc-v4 §1` + `caderno-2/02 §1.6`) |
| `economia-como-modulo` | ★ | canonical |
| `contribuicao-verificavel` | ★ | canonical |
| `standing` | ★ | canonical |
| `reputacao-local` | ★ | hub (`rfc-v4 §3.4` + `caderno-3/01 §3.6`) |
| `fato-negativo-verificavel` | ★ | canonical |
| `desafio-canary` | ★ | hub |
| `spends` | ★ | canonical |
| `credits` | ★ | canonical |
| `asset-reputation` ⊕ | — | canonical |
| `transfers-aresta` / `approves` | — | canonical (curtos) |
| `defesa-sybil` / `bond-caucao` | — | canonical |

---

## Onda 11 — Plano de mídia: BLOBs e stream (v4) ⊕ DOMÍNIO NOVO

Canônico em `caderno-3-sdk/05-media-transport-plane.md`.

| slug | ★ | modo |
|:---|:--|:---|
| `convergent-encryption` | ★ | canonical |
| `rendition` | ★ | canonical |
| `webseed-bep19` | ★ | canonical |
| `edge-translation` | ★ | canonical |
| `consolidacao-de-live` | ★ | canonical |
| `serves-aresta` ⊕ | ★ | canonical |
| `content-file` ⊕ | — | canonical |
| `livekit` | — | canonical |

---

## Onda 12 — Visão e produto

Por último: referenciam quase tudo, então os alvos já existem.

| slug | ★ | modo |
|:---|:--|:---|
| `rede-corporativa-whitelabel` | ★ | hub (3 fontes) |
| `modalidade-de-rede` | ★ | canonical |
| `pragmatismo-topologico` | ★ | hub (`caderno-1/01 §2.1` + `rfc §1.2`) |
| `honestidade-radical` | ★ | hub |
| `fundador` | ★ | canonical |
| `peer-do-sistema` | ★ | canonical |
| `marketplace-customizacoes` | — | canonical |
| `tier-aware-degradation` | — | canonical |

---

## Não são alvos de verbete na Fase 2

Ficam no lugar; recebem só wikilink na Fase 3: todas as engines de UI (Onda 8 do inventário), as projeções SQL sem ★ (`entity-heads`, `active-edges`, `asset-balances`, `local-permissions`, `validator-serialization-log`, `peer-reputation-table`), `ciclo-de-commit`, `eleicao-de-committer`, `pending-changes`, `sqlite-wasm`, `opfs`, `fts5`, `rtree`, `crdt`, `bootstrap-frio-absoluto`, `bootstrap-morno`, `dht-descartada`, `link-multiaddr`, `tokens-css-hsl`, e os subtipos sem ★ (`profile-organization`, `content-document`, `content-personal-data`, `asset-balance-state`, `asset-inventory`).

