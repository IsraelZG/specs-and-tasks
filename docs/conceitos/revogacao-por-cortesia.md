---
title: "Revogação por Cortesia"
slug: revogacao-por-cortesia
aliases: ["expurgo", "Expunge", "revogação best-effort", "revogação por cortesia (expunge)"]
tags: [protocol, privacidade, expurgo, lgpd, best-effort, limites-honestos, v3]
modo: hub
fonte-canonica: docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md §5.2
aparicoes-consolidadas:
  - glossary.md §Revogação por Cortesia (Expunge)
  - rfc-transacoes-multidominio.md §6 (menção ao bond/cortesia executável)
dependencias:
  - [[tombstone-lapide]]
  - [[retention-state]]
  - [[rotacao-de-epocas]]
  - [[bloqueio-social]]
  - [[linhagem-de-versoes]]
---

# Revogação por Cortesia

## Definição

**Revogação por Cortesia** (também chamada *expurgo*) é o mecanismo best-effort pelo qual um sinal de revogação — `retention_state = expunged`, materializado como [[tombstone-lapide]] — é propagado aos peers cooperativos da rede. Peers honestos que recebem o sinal descartam o plaintext localmente (quando o consentimento de privacidade foi revogado) ou o registro inteiro (quando o conteúdo foi deletado pelo autor).

O nome "por cortesia" expressa com precisão o seu limite: a conformidade é voluntária dos peers honestos; não há mecanismo criptográfico que force a destruição de dados já decifrados.

## Conteúdo normativo

O texto normativo completo — mecanismo, limites honestos, risco aceito e contexto de aplicação — está definido canonicamente em:

> `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §5.2` — "Expurgo (Revogação por Cortesia) ≠ Revogação Criptográfica"

Para a distinção entre trava de visualização e enforcement criptográfico (§5.1, que antecede e contextualiza §5.2) ver o mesmo arquivo.

## Resumo

### Mecanismo

Um sinal de revogação é gravado no grafo (`retention_state = expunged`, [[tombstone-lapide]]). Peers que sincronizam o sinal e são cooperativos:

- Descartam o plaintext localmente se houve revogação de consentimento de privacidade.
- Descartam o registro inteiro se o conteúdo foi deletado pelo autor.

O mecanismo propaga-se via sincronização normal ([[linhagem-de-versoes]], anti-entropy); não requer canal especial.

### Limite honesto (da fonte canônica)

- **Um único detentor não-cooperativo** que já decifrou o plaintext retém para sempre ("não há desver"). O problema é mais grave para conteúdo publicado sob chave universal (tier público).
- **Vazamento de metadado:** o próprio sinal de expurgo revela informação ("X virou privado / Y foi bloqueado"). Mais contido em contexto com autoridade (super peer pode simplesmente parar de servir); mais exposto em P2P puro.

### Risco aceito

Revogação de privacidade é best-effort, não garantida. O mecanismo é **apropriado para regimes de contrato** (consentimento revogável em LGPD/GDPR) e **inadequado para dados já públicos** onde não há expectativa razoável de retirada.

### Relação com [[rotacao-de-epocas]]

[[rotacao-de-epocas]] é a revogação *criptográfica* real: quando uma chave de época é rotacionada, o membro excluído perde acesso a novas épocas. A revogação por cortesia é ortogonal — cobre o dado já decifrado e em posse do peer; a rotação cobre acesso futuro. As duas operam em camadas distintas.

### Relação com [[bloqueio-social]]

[[bloqueio-social]] é a proteção para conteúdo público (chave universal): filtro de leitura na UI sobre arestas `BLOCKS`, sem enforcement criptográfico. Revogação por cortesia e bloqueio social compartilham a mesma natureza — são instrumentos de honestidade, não de garantia material.

### Distinção de "cortesia executável" ([[bond-caucao]])

A ex-RFC de transações (§6.3, absorvida em [[bond-caucao]]) citava "cortesia executável" no contexto de bond/caução: *"Com bond/caução: sistema corta o bond do não-cumpridor (cortesia executável)"*. A coincidência é apenas terminológica: "cortesia executável" é liquidação social de default (corte de caução, compulsório); a revogação por cortesia é expurgo de privacidade (voluntário). A distinção está formalizada no verbete [[bond-caucao]].

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§Revogação por Cortesia (Expunge)` | Substituir por wikilink `[[revogacao-por-cortesia]]` |

## Dependências

| slug | onda | status |
|:---|:---|:---|
| [[linhagem-de-versoes]] | 1 | criado |
| [[rotacao-de-epocas]] | 1 | criado |
| [[tombstone-lapide]] | 7 | criado |
| [[bloqueio-social]] | 3 | criado |
| [[retention-state]] | — | Foam placeholder (não é alvo de verbete na Fase 2) |


