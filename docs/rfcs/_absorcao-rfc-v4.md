# Manifesto de Absorção — rfc-v4.md (RFC-001 v4)

**Data:** 2026-06-11
**RFC:** `docs/rfc-v4.md`
**Status no _status.md:** Aceita — conceitos já criados (Onda 10); absorver resíduo

---

## Resumo

**7 subtasks · 4 haiku · 2 revisar-humano · 25 descartadas**

### Lista de Supersessões

Nenhuma supersessão de conteúdo canônico existente. As subtasks ativas são
puramente aditivas (seções inexistentes em cadernos ou inconsistência de nome
de aresta a corrigir).

---

## Raciocínio de triagem: o que já está absorvido

A auditoria secção a secção confirma que a esmagadora maioria da RFC já
foi absorvida nas Ondas 9 e 10 (conceitos) e nas edições incrementais dos
cadernos. Resumo por bloco:

| Bloco RFC | Destino existente | Decisão |
| :--- | :--- | :--- |
| §0 Precedência — tabela de mudanças | Contexto histórico; refletido nos verbetes e cadernos | DESCARTE |
| §1.1–1.4 Visão (agente, princípios, modalidades) | `agente-de-sistema`, `comutativo-vs-nao-comutativo`, `modalidade-de-rede`, `defesa-sybil` | DESCARTE |
| §2.1 Comutativo vs. Não-Comutativo | `comutativo-vs-nao-comutativo.md` (canonical) | DESCARTE |
| §2.2 Eleição de Committer | `caderno-2/04 §4` + `agente-de-sistema.md` | DESCARTE |
| §2.3 Serialização por Linhagem / Invariante | `serialization-por-linhagem`, `invariante-de-core`, `validador-declarado`, `congelamento-escopado`, `caderno-4/03 §3.4–3.5` | DESCARTE |
| §2.4 Fluxo de Aprovação | `content-intent`, `spends`, `credits`, `approves`, `transfers-aresta`, `aplicador-deterministico`, `caderno-2/01 §2.2` | DESCARTE |
| §2.5 Persistência em não-validação | `fato-negativo-verificavel.md` | DESCARTE |
| §2.6 Estado `pending` local vs. `finalized` | Mencionado em `comutativo-vs-nao-comutativo` mas **sem verbete canônico** nem seção de caderno dedicada | RESIDUO → a1 |
| §2.7 Desafios Canary | `desafio-canary.md` + `caderno-2/02 §1.6` | DESCARTE |
| §2.8 Bloqueio e Tiers | `bloqueio-social`, `predicado-de-bloqueio`, `caderno-2/02 §2.2.1` | DESCARTE |
| §3.1 Schema Físico v4 | `caderno-3/01` (já atualizado para v4) | DESCARTE |
| §3.2 Tipos de Aresta | `caderno-2/01 §2.2–2.3`; todos os verbetes de aresta existem — mas `caderno-2/01 §2.2` ainda usa `TRANSFERRED_TO` e `APPROVED_BY` onde v4 normaliza `TRANSFERS` e `APPROVES` | RESIDUO → a2 |
| §3.3 Quatro Regimes de Contribuição | `contribuicao-verificavel.md` (canonical) | DESCARTE |
| §3.4 Reputação Local | `reputacao-local.md` (canonical) | DESCARTE |
| §4.1 Economia como Módulo | `economia-como-modulo.md` existe (canonical); mas `caderno-4/03` não tem seção explícita de economia-como-módulo | RESIDUO → a3 |
| §4.2 Defesa Sybil | `defesa-sybil`, `bond-caucao`, `asset-invite` — verbetes completos; `caderno-4` não tem seção de defesa Sybil | RESIDUO → a4 |
| §4.3 Remuneração e Telemetria | `economia-como-modulo` cobre parcialmente; fronteira honesta medir/liquidar — `caderno-4` não tem seção de remuneração | RESIDUO → a5 |
| §4.4 Variantes por Modalidade | `modalidade-de-rede` cobre as três modalidades mas sem a tabela v4 cruzada de §4.4 (serialização/economia/integridade/retenção) | RESIDUO → a6 |
| §5.1–5.3 Threat Model | Nenhum verbete nem seção de caderno cobre a tabela de ameaças / riscos aceitos / território de pesquisa | RESIDUO → a7 |
| Apêndice A — caderno-3/01 | Já atualizado (BLOB, payload_iv fundido, retention_state INTEGER) | DESCARTE |
| Apêndice A — caderno-2/02 | Predicado de bloqueio já em §2.2.1 | DESCARTE |
| Apêndice A — caderno-2/04 | Colapso de modos §4 + merge aditivo §4.3 já em place | DESCARTE |
| Apêndice A — caderno-4 (serialização) | §3.4–3.5 já em place | DESCARTE |
| Apêndice A — caderno-2/03 | Sem mudança estrutural; fingerprint sobre signature própria — confirmar via nota; nenhum texto novo | DESCARTE |
| Apêndice B Glossário | Todos os termos têm verbetes canônicos criados | DESCARTE |

---

## Tabela de Subtasks

| id | fonte | tipo | destino | acao | executor | status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| a1 | rfc-v4 §2.6 | NOVA-SECAO-CADERNO | `docs/caderno-2-protocol/04-automerge-integration-spec.md` §5 (novo) | Adicionar seção "Estado pending local vs. finalized durável": o `pending` vive em projeção local não-replicada do proponente; ao finalizar entra em `nodes`/`edges`; máquina de estados colapsa em dois estados (`pending` local \| `finalized` durável imutável); não há mais estado mutável em aresta — elimina contradição com append-only. Copiar texto normativo literalmente de §2.6. | haiku | [ ] |
| a2 | rfc-v4 §3.2 + caderno-2/01 §2.2 | EDITA-CADERNO | `docs/caderno-2-protocol/01-graph-ontology.md` §2.2 | Corrigir inconsistência de nomes de aresta: substituir `TRANSFERRED_TO` (origem→destino) por `TRANSFERS` (nó de saldo novo → intent) conforme normalização v4; substituir `APPROVED_BY` por `APPROVES` onde descrevem o ato de validador na operação não-comutativa (preservar `APPROVED_BY` onde aparece como referência histórica §1). Adicionar wikilinks `[[transfers-aresta]]` e `[[approves]]`. | haiku | [ ] |
| a3 | rfc-v4 §4.1 | NOVA-SECAO-CADERNO | `docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md` §4 (novo) | Adicionar seção "§4 Economia como Módulo ASSET (Medição vs. Liquidação)": core entrega medição verificável (quatro regimes); liquidação é decisão de SPEC por rede via Zen Engine; regra contribuição→crédito é procedimento na SPEC, não no core; resolve regresso de mint; viabiliza múltiplas economias. Copiar texto normativo de §4.1 literalmente. Wikilinks: `[[economia-como-modulo]]`, `[[contribuicao-verificavel]]`, `[[zen-engine]]`. | haiku | [ ] |
| a4 | rfc-v4 §4.2 | NOVA-SECAO-CADERNO | `docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md` §5 (novo) | Adicionar seção "§5 Defesa Sybil (P2P puro — módulos opt-in)": defesa primária = custo de criação de identidade separado da economia; stack de cinco mecanismos (convite-como-ASSET:INVITE, staking social, irrelevância por diversidade, bond/caução, detecção topológica); teto honesto. Copiar texto normativo de §4.2 literalmente. Wikilinks: `[[defesa-sybil]]`, `[[asset-invite]]`, `[[standing]]`, `[[bond-caucao]]`, `[[fato-negativo-verificavel]]`. | haiku | [ ] |
| a5 | rfc-v4 §4.3 | NOVA-SECAO-CADERNO | `docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md` §6 (novo) | Adicionar seção "§6 Remuneração e Telemetria": remuneração = liquidação da medição de §3.3 governada por SPEC; fronteira honesta medir/liquidar; banda/storage quase-trustless; compute determinístico probabilístico; compute não-determinístico = mercado de reputação. Copiar texto normativo de §4.3 literalmente. Wikilinks: `[[economia-como-modulo]]`, `[[contribuicao-verificavel]]`, `[[reputacao-local]]`. | haiku | [ ] |
| a6 | rfc-v4 §4.4 | EDITA-CONCEITO | `docs/conceitos/modalidade-de-rede.md` | Acrescentar ao verbete a tabela cruzada v4 de §4.4 (Dimensão × P2P Puro × Pública × Corporativa), cobrindo: Identidade/Sybil, Serialização default, Comportamento sob partição, Economia de contribuição, Integridade do agente, Retenção forense. Esta tabela não está presente no verbete nem em nenhum outro destino. Texto normativo: rfc-v4 §4.4. | haiku | [ ] |
| a7 | rfc-v4 §5.1–5.3 | NOVA-SECAO-CADERNO | `docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md` §7 (novo) | Adicionar seção "§7 Threat Model": tabela §5.1 (ameaças cobertas: agente adultera payload, double-spend, validador mente etc. com eficácia); tabela §5.2 (riscos aceitos: agente substituído, insider, conjunto comprometido, compute não-determinístico); §5.3 território de pesquisa (trustless compute IA, transferência atômica cross-tipo, bloqueio cripto de conteúdo público declarado impossível). Copiar tabelas normativas literalmente de §5.1–5.3. Esta é decisão estrutural (nova seção) com conteúdo de segurança sensível — não trivialmente aditivo. | revisar-humano | [ ] |

---

## Notas

**a7 marcado revisar-humano:** O threat model contém afirmações de segurança (riscos aceitos e declarações de impossibilidade). Embora seja conteúdo aditivo sem conflito com o existente, trata-se de nova seção de governança com impacto na percepção de segurança da plataforma — decisão estrutural que justifica revisão humana antes de publicar.

**a2 marcado haiku:** A renomeação é mecânica e circunscrita a duas ocorrências em §2.2 do caderno-2/01. O TODO inline em `transfers-aresta.md` já documenta o problema; a correção não altera semântica, apenas alinha o nome ao padrão v4.

**Ordem de absorção recomendada:** a3 → a4 → a5 (seções sequenciais no mesmo arquivo) → a1 → a6 → a2 → a7 (revisão humana por último).

**Arquivo-alvo principal de a3/a4/a5/a7:** `docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md` receberá quatro novas seções (§4 a §7). Recomenda-se um único commit por seção para manter granularidade.
