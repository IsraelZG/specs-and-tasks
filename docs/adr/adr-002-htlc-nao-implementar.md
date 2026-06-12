# ADR-002: HTLC (Hashlock + Timelock) — Decisão de Não Implementar

* **Status:** Aceita (pela RFC-002 "Transações Multidomínio: Sagas TTL, 2PC e Liquidação Social").
* **Data:** 11/06/2026.

## Contexto

Ao modelar operações cross-domínio ([sagas](../conceitos/saga.md) e [2PC](../conceitos/2pc-com-lock-ttl.md)), uma questão arquitetural fundamental emerge: é viável implementar swaps trustless de alto valor entre partes sem histórico compartilhado, sem coordenador e sem garantias criptográficas?

HTLC (Hashlock + Timelock) é um padrão de liquidação cripto que responde "sim": duas partes revelam um preimage para desbloquear fundos bloqueados por um hash, com timeout para aborto unilateral. Elimina necessidade de intermediário.

## Decisão

**Não implementar HTLC** como primitiva de core na plataforma.

O regime de swap trustless de **alto valor, tiro único, entre partes sem histórico** é **explicitamente fora de escopo**, com risco aceito e declarado.

## Motivação

### 1. Griefing Inerente

HTLC resolve swaps atomicamente, mas deixa aberta uma janela onde uma contraparte **tranca valor sem completar, revelando intencionalidade adversarial**:

- Comprante revela hash, vendedor bloqueia ativo esperando por preimage.
- Vendedor não revela preimage → preimage fica privado. Comprante não consegue desbloquear; vendedor não consegue puxar valor bloqueado.
- Resultado: ambos os lados sofrem perda de liquidez por tempo limitado (até timelock expirar).

Em uma transação isolada entre estranhos, essa perda é prejudicial e não é punível ex-post — o dano já foi feito.

### 2. Escopo Estreito

HTLC só modela **swaps valor-por-valor** (ativo A ↔ ativo B, ambos ao mesmo tempo). Não generaliza para:

- Sagas multileg genéricas (exemplo: ride-matching com múltiplas pernas, compensações, prioridades).
- Operações com consentimento estruturado ([[validador-declarado]]).
- Reputação como instrumento durável.

Seria um primitivo narrow-purpose, não uma extensão arquitetural clara.

### 3. Reputação Não Mitiga em Regime One-Shot

Em regimes repetidos (jogo finito mas com múltiplas interações), reputação é dissuasão ex-post efetiva: o não-cumprimento deixa um "fato negativo verificável" no grafo, reduzindo confiança futura.

**Em regime one-shot + alto-valor + estranho**, reputação pós-facto é fraca:

- Se as partes nunca mais se interagem, o dano reputacional não importa.
- A probabilidade de o vendedor aceitar risco de griefing é baixa (espera garantia ex-ante, não ex-post).
- Valor alto amplifica o risco — o custo de perda de liquidez é insuportável.

## Mitigações para Operações Fora do Tier 1/2

Para operações multidomínio que caem fora dos tiers implementados ([[saga]] Tier 1, [[2pc-com-lock-ttl]] Tier 2):

### Mínimo de Confiança ("Se Não Confia, Não Inicia")

Cada operação exige **decisão humana explícita sobre risco**. UI marca operações como:

- `consistency: eventual` / `isolation: none` (Tier 1, padrão).
- `consistency: snapshot` / `isolation: 2pc` (Tier 2, com coordenador confiável).
- Fora de tiers: "Exige escrow ou intermediário acordado. Risco: não-cumprimento pós-iniciação. Prosseguir?"

### Reputação Como Dissuasão Ex-Post

Reputação só morde quando:

1. **A obrigação é estruturada no grafo com deadline** (não promessa off-graph).
2. Registra-se como `CONTENT:INTENT` ou compromisso com prazo via [[hlc|HLC]].
3. Não-cumprimento até deadline = **fato negativo verificável**, durável, com prova.
4. **Com bond/caução:** sistema corta o bond (execução automática, "cortesia" estrutural).
5. **Sem bond:** fato negativo + rate-limit (marcado no grafo, menos prioridade futura).

**Equivalência:** O fato negativo é Sybil-resistant; punição só tem dente com **custo estrutural** (bond) ou **custo de oportunidade** (rate-limit).

**Limite:** Funciona em:
- Jogo repetido (contrapartes reconhecidas, não one-shot).
- Valor limitado (perda é suportável).
- Não funciona em: one-shot / alto-valor / estranho (o domínio rejeitado).

### Escrow por Terceiro Acordado

Quando justificado (operação crítica, partes dispostas a pagar taxa), introduz **intermediário confiável** (não trustless, mas transparente e leve). Mais aceitável que HTLC porque:

- Terceiro é **nomeado no contrato** (não emerge de primitivo).
- Responsabilidade é clara (não é "cripto garantida").
- Custo é visível (taxa de escrow).
- Funciona em regimes repetidos: reputação do escrow é ativo valioso.

## Princípio Honesto

**Onde não há confiança nenhuma e o valor é alto, alguma âncora de confiança (autoridade, bond ou escrow) tem que entrar.** Não há almoço trustless grátis aqui — e é aceitável, porque:

- **P2P puro é boost de resiliência, não foco absoluto.**
- **Honestidade sobre garantia > tentativa de garantir o improvável.**

## Consequências

1. Swap trustless de alto valor entre estranhos é **fora de escopo**.
2. Operações multidomínio usam [[saga]] (Tier 1, eventual) ou [[2pc-com-lock-ttl]] (Tier 2, snapshot).
3. UI é explícita sobre limites de isolamento: "não-garantida / baseada em confiança" (Tier 1).
4. Reputação estrutura punição ex-post em regimes repetidos (jogo finito com bond/caução).
5. Nenhuma nova tarefa introduzirá dependência HTLC.

## Referências

- **RFC-002:** Seção §4 (decisão original, motivos, mitigações).
- **Conceitos relacionados:** [[saga]], [[2pc-com-lock-ttl]], [[validador-declarado]], [[reputacao-local]].
- **Impacto em especificação:** Território de Pesquisa em `caderno-4-governance/03-specification-lifecycle-and-rfcs.md` §7.3.


