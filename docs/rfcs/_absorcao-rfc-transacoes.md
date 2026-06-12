# Absorção rfc-transacoes-multidominio.md (RFC-002)

> **Resumo:** 2 subtasks · 1 haiku · 1 revisar-humano · 0 descartadas
> **Gerado em:** 2026-06-12
> **Contexto:** RFC-002 já foi amplamente absorvida na Onda 9. Este manifesto cobre apenas o resíduo normativo ausente nos verbetes e cadernos existentes.

---

## LISTA DE SUPERSESSÕES

Nenhuma supersessão. A RFC-002 é **aditiva** — estende `rfc-v4.md §5.3` ("território de pesquisa: transferência atômica") sem revogar ou redefinir nada existente. Não contradiz nenhum canônico.

---

## Análise de cobertura por seção (base para descarte)

| Seção RFC | Conteúdo | Cobertura existente | Decisão |
| :--- | :--- | :--- | :--- |
| §1 Limites estruturais | Atomicidade cross-domínio não é invariante de core; safety por perna; causalidade local | `saga.md` §Premissa; `caderno-4/03 §3.5` (Extensão multidomínio) | DESCARTE — coberto |
| §2 Saga Tier 1 | Anatomia (reservar/confirmar/expirar/reverter), limite honesto, exemplos ride-matching e checkout | `saga.md` (conteúdo normativo integral) | DESCARTE — coberto |
| §3 2PC Tier 2 | Fases prepare/commit/abort, resolução bloqueio clássico via TTL, coordenador legítimo | `2pc-com-lock-ttl.md` (conteúdo normativo integral) | DESCARTE — coberto |
| §4 HTLC — decisão NÃO implementar | Decisão arquitetural: griefing inerente, escopo estreito, reputação não mitiga; domínio swap trustless alto-valor explicitamente fora de escopo; mitigações (escrow, confiança mínima) | **Ausente** — nenhum ADR ou verbete documenta esta decisão | GERAR SUBTASK → ADR |
| §5 Políticas de TTL + bloco YAML | fixed / per_leg / renewable_lease / risk_scaled; bloco de configuração SPEC | `politica-de-ttl.md` (conteúdo normativo integral + YAML) | DESCARTE — coberto |
| §5.1 Invariantes transversais de TTL | Adjudicação pelo validador-dono; corrida confirm-vs-expira; corolário P2P vs. corporativo | `politica-de-ttl.md` §Invariantes; `2pc-com-lock-ttl.md` §Invariantes de TTL | DESCARTE — coberto |
| §6.1 Marcação explícita de risco | Tag "não-garantida / baseada em confiança" na UI para Tier 1 | `saga.md` §Limite honesto do Tier 1 ("UI deve sinalizar…") | DESCARTE — coberto |
| §6.2 Reputação como instrumento | Obrigação estruturada no grafo com deadline; não-cumprimento = fato negativo verificável; limites (jogo repetido, valor limitado) | `fato-negativo-verificavel.md` §Contexto transacional; `reputacao-local.md` | DESCARTE — coberto |
| §6.3 Bond e Rate-Limit | Com bond: corte (cortesia executável); sem bond: fato negativo + rate-limit; equivalência Sybil-resistant | `bond-caucao.md` §Bond como liquidação de default transacional (texto normativo literal incluído) | DESCARTE — coberto |
| §7 Degeneração corporativa + oráculo | Multidomínio → single-domain em autoridade forte; exceção BaaS = oráculo; mitigação por bonding/redundância | `oraculo-baas.md`; `saga.md` §Degradação em single-domain | DESCARTE — coberto |
| §8 Estado da saga | Estado efêmero local; regra inviolável: estado mutável replicado proibido; consolidação opcional | `linhagem-de-coordenacao.md` (conteúdo normativo integral) | DESCARTE — coberto |
| §9 Registro de validação | Casos fintech/ride-matching/checkout validados como modeláveis | Narrativo, não normativo; coberto pelos exemplos em `saga.md` e `oraculo-baas.md` | DESCARTE — não normativo |
| Apêndice item 1 | caderno-2/01 §2.2 §3.3: ASSET:LOCK como output de reserva, ancora via SPENDS | `caderno-2/01 §2.2` Nota v4 multidomínio; `caderno-2/01 §3.3` lista ASSET:LOCK com participante de sagas | DESCARTE — coberto |
| Apêndice item 2 | caderno-2/02 §2.1: ASSET:PERMISSION permanece declarativo | `caderno-2/01 §3.3`: "Permanecem declarativos (não executáveis)" | DESCARTE — coberto |
| Apêndice item 3 | caderno-2/02 threat model: trava de visualização ≠ enforcement; expurgo ≠ revogação criptográfica | `caderno-2/02 §5.1` e `§5.2` têm exatamente esse conteúdo | DESCARTE — coberto |
| Apêndice item 4 | caderno-3/01 §3.3: ASSET:LOCK participante de sagas | `caderno-3/01 §3.3` Nota multidomínio | DESCARTE — coberto |
| Apêndice item 5 | caderno-3/01 §5: ranking/busca consome searchable:true de SPEC, não nó novo | `caderno-3/01 §5` Nota ranking/feed | DESCARTE — coberto |
| Apêndice item 6 | caderno-4/03: extensão multidomínio, invariante per-perna, consistência = padrão de composição | `caderno-4/03 §3.5` parágrafo "Extensão multidomínio (v4)" | DESCARTE — coberto |
| Apêndice item 7 | backlog-geral: saga/2PC como pré-requisito para módulos financeiros | Target `backlog-geral.md` é legado | [DESCARTADA: legado] |

---

## Tabela de Subtasks

| id | fonte | tipo | destino | acao | executor | status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| t1_4_1 | rfc-transacoes-multidominio.md §4 | ADR | `docs/adr/adr-002-htlc-nao-implementar.md` | Criar ADR-002 registrando decisão de não implementar HTLC: motivos (griefing inerente, escopo estreito de swap, reputação fraca em one-shot/alto-valor), domínio fora de escopo declarado, mitigações aceitas (escrow por terceiro, "se não confia não inicia", reputação como dissuasão ex-post com bond) | haiku | [x] |
| t1_4_2 | rfc-transacoes-multidominio.md §4.1–4.2 | EDITA-CADERNO | `docs/caderno-4-governance/03-specification-lifecycle-and-rfcs.md` §7.3 | Adicionar HTLC na tabela §7.3 "Território de Pesquisa": linha "Swap trustless de alto valor entre estranhos (HTLC)" → "Descartado — ver ADR-002; griefing inerente + escopo estreito. Fora de escopo declarado." | revisar-humano | [x] |
