---
title: "Specification Network Birth"
slug: specification-network-birth
aliases: ["NETWORK_BIRTH", "nascimento de rede", "specification-network-birth", "nó de fundação"]
tags: [protocol, topology, bootstrap, rfc, glossary]
modo: canonical
fonte-canonica: docs/rfc-transporte-p2p-v3.1.md §3.2.4
aparicoes-consolidadas:
  - glossary.md §NETWORK_BIRTH
  - caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md §6
dependencias:
  - [[genesis-state]]
  - [[first-peer-protocol]]
  - [[specification]]
  - [[profile]]
  - [[sync-worker]]
  - [[peer-do-sistema]]
---

# Specification Network Birth

## Definição

O **Specification Network Birth** (ou `NETWORK_BIRTH`) é um nó imutável do tipo `SPECIFICATION:NETWORK_BIRTH` criado no grafo de dados durante o estado `GENESIS` da máquina de estados do [[first-peer-protocol]]. Ele registra de forma durável e assinada o timestamp de fundação física e lógica da rede, agindo como a prova criptográfica originária de gênese de um workspace específico.

## Por quê

Em arquiteturas [[local-first|local-first]] e descentralizadas, o início de uma rede de colaboração não pode depender de um coordenador ou servidor centralizado para certificar sua criação. O nó `SPECIFICATION:NETWORK_BIRTH` resolve esse problema ao estabelecer um marco zero imutável e auditável para o grafo. Qualquer participante futuro que sincronizar com a rede poderá verificar criptograficamente a linhagem da rede a partir desse registro raiz, prevenindo ataques de bifurcação (splits) maliciosas e fornecendo uma âncora cronológica comum e inequívoca de fundação.

## Contrato

Conforme definido na especificação da camada de transporte em [[rfc-transporte-p2p-v3.1#324-—-gênese-da-rede-first-peer-protocol]], a criação do nó `SPECIFICATION:NETWORK_BIRTH` é governada pelas seguintes regras normativas:

1. **Geração no Bootstrap**: Ao transitar para o estado `GENESIS` através do [[first-peer-protocol]], o peer fundador gera atomicamente no grafo os seguintes registros de bootstrap:
   - O nó de [[profile|PROFILE]] do administrador original.
   - O nó de [[specification|SPECIFICATION]] que rege o workspace.
   - O nó imutável do tipo `SPECIFICATION:NETWORK_BIRTH` contendo a assinatura do fundador e o timestamp físico e lógico de fundação da rede.
2. **Imutabilidade Histórica**: Uma vez escrito, o registro `NETWORK_BIRTH` permanece imutável e replicado permanentemente no grafo, não admitindo mutações (`MUTATES`) ou deleções.
3. **Persistência Pós-Gênese**: Quando um segundo peer se conecta ao genesis, este perde o status provisório de `PROVISIONAL_SYSTEM_PEER` e passa a operar como peer normal. O nó `SPECIFICATION:NETWORK_BIRTH` permanece gravado e imutável no grafo como prova histórica comum de fundação.

## Implementação

No âmbito do [[sync-worker]] e do [[crypto-worker]] (conforme detalhado em [[caderno-3-sdk/02-sync-worker-and-memory-lifecycle#6-gênese-da-rede-—-first-peer-protocol]]), a implementação segue:
- O Sync Worker detecta a expiração do timer de 8 segundos no estado `WAITING_FOR_SWARM` sem peers ativos conectados no [[swarm-registry]].
- Havendo um token de fundação (bootstrap token) ou intenção explícita do usuário, o Sync Worker aciona o Crypto Worker para validar o privilégio e assinar os registros de bootstrap.
- O Sync Worker executa as transações locais no SQLite WASM persistido em OPFS para gravar o nó `SPECIFICATION:NETWORK_BIRTH` de forma atômica com o perfil do administrador e a especificação do workspace.
- O hash desse nó passa a integrar a B-Tree de reconciliação de dados estruturados para propagação em futuros sincronismos via [[rbsr|RBSR]].

## Evolução

A evolução ou substituição das diretrizes contidas na especificação criada junto ao `specification-network-birth` não afeta o registro de fundação em si, que permanece imutável. Quaisquer alterações subsequentes na governança do workspace (como rotação de chaves de administração ou redefinição de papéis) devem ser registradas como novos nós no grafo associados às linhagens de especificações e perfis por meio de arestas `MUTATES` ou verbos de relacionamento, mantendo a âncora do nascimento da rede intacta.

---

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `glossary.md` | `§NETWORK_BIRTH` | Substituir pelo wikilink `[[specification-network-birth]]` |
| `caderno-3-sdk/02-sync-worker-and-memory-lifecycle.md` | `§6` | Consolidar com wikilink `[[specification-network-birth]]` |

---

## Dependências por onda

| slug | onda | status |
|:---|:---|:---|
| [[genesis-state]] | 5 | criado |
| [[first-peer-protocol]] | 5 | criado |
| [[specification]] | 1 | criado |
| [[profile]] | 1 | criado |
| [[sync-worker]] | 7 | placeholder (onda futura) |
| [[peer-do-sistema]] | 12 | placeholder (onda futura) |
