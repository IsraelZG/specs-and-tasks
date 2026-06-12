---
title: Resolução de Forks
slug: fork-resolucao
aliases:
  - fork-resolucao
  - fork e resolução
  - resolução de forks
  - resolução de fork
  - fork-resolution
tags:
  - protocol
  - automerge
  - sync
  - hub
  - onda-6
modo: hub
fonte-canonica: docs/caderno-2-protocol/04-automerge-integration-spec.md §4.2
aparicoes-consolidadas:
  - docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.10.2
  - docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.6
dependencias:
  - [[no]]
  - [[aresta]]
  - [[mutates]]
  - [[hlc]]
  - [[linhagem-de-versoes]]
  - [[head]]
  - [[key-vault]]
  - [[profile-system]]
  - [[rbsr]]
  - [[documento-casca]]
  - [[automerge-repo]]
  - [[changes]]
  - [[merge-aditivo]]
  - [[sync-worker]]
  - [[tradeoff-liveness-validadores]]
  - [[consenso-emergencia]]
  - [[morte-da-rede]]
  - [[congelamento-escopado]]
  - [[validador-declarado]]
  - [[agente-de-sistema]]
---

# Resolução de Forks

## Definição
A **Resolução de Forks** é o mecanismo descentralizado da Plataforma Projeto SuperApp V0.41 para detectar e conciliar divergências estruturais na linhagem de versões do grafo. Ocorre um fork quando múltiplas arestas `MUTATES` concorrentes apontam para o mesmo nó predecessor comum (pai), sem relação de ancestralidade entre si. A resolução é realizada de forma append-only por um mergeador eleito deterministicamente, o qual cria um novo nó-versão de merge que aponta para as pontas divergentes por meio de duas arestas `MUTATES`, convergindo o estado na cabeça da linhagem por meio do HLC mais elevado.

## Por quê
A resolução de forks é essencial para manter a consistência e a integridade de dados colaborativos em um ecossistema com filosofia [[local-first]] e suporte a operação offline e partições de rede oportunísticas. Em vez de sobrescrever dados concorrentes usando algoritmos simplistas de Last-Write-Wins (LWW) no grafo — o que causaria perda irreversível de informações e quebraria a fidelidade da auditoria —, o sistema registra todas as ramificações concorrentes de forma imutável. A convergência estrutural garante que a aplicação continue funcional mesmo sob partições de rede temporárias, e o merge automático unifica as ramificações assim que a partição é curada, promovendo uma sincronização fluida e preservando o histórico de auditoria completo.

## Contrato
As especificações formais de protocolo e o comportamento matemático da detecção e resolução de forks estão definidos em:
* [caderno-2-protocol/04-automerge-integration-spec.md §4.2](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/04-automerge-integration-spec.md#L78-L86)
* [caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.10.2](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L203-L213)

**Mecânica de Resolução de Fork**:
1. **Detecção (estrutural)**: Há fork quando existem duas (ou mais) arestas [[mutates]] ativas com o mesmo `source_id`, nenhuma ancestral da outra. O HLC ordena, mas não detecta concorrência — por isso a detecção é estrutural.
2. **Eleição do mergeador**: O merge herda a mesma eleição determinística de Committer (preferência por [[profile-system]]/agente de sistema; na ausência, o peer determinístico com menor `entity_id` ativo no ciclo). Isso impede que dois peers criem merges concorrentes (um "fork do merge").
3. **Merge**: O mergeador resolve conflitos — via [[automerge-repo]]/[[changes]] para `CONTENT:DOCUMENT`; via regra da [[specification]] para os demais tipos — e cria um novo nó-versão com duas arestas [[mutates]] (uma apontando para cada ponta do fork), com [[hlc]] estritamente superior a ambos os ramos. Assina (Ed25519) e propaga.
4. **Convergência**: Como o nó de merge tem HLC maior que os dois ramos, ele assume a cabeça naturalmente na projeção `entity_heads` (representando a ponta da [[linhagem-de-versoes]] como o [[head]] ativo). Enquanto o merge não chega, o head exibido localmente é o ramo de maior HLC (desempate determinístico e idêntico em todos os peers).
5. **Reconciliação sob Partição**: Quando a partição de rede que originou o fork é reconciliada, o lado que não presenciou o merge simplesmente recebe o nó de merge via [[rbsr]], sem necessidade de reconciliação adicional. O critério determinístico garante que, mesmo sob partição, ambos os lados concordam sobre quem deveria executar o merge (embora apenas um lado tenha o peer eleito disponível naquele momento). Quando a partição é curada, o merge já existe em um lado e é sincronizado para o outro.

## Implementação
As diretrizes de orquestração do runtime e ciclo de vida na camada do cliente e do transporte estão descritas em:
* [caderno-5-transport/01-p2p-transport-and-reconciliation.md §3.2 e §3.3](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L349-L385)

* **Workers e Processamento**: O cálculo da B-Tree e a detecção estrutural de forks ocorrem no [[sync-worker]]. Ao isolar as pontas divergentes através do [[rbsr]], o Sync Worker local verifica se é o mergeador eleito (aplicando o desempate determinístico do menor `entity_id` ou delegando ao [[profile-system]] responsável).
* **Criptografia e Assinatura**: O merge de documentos colaborativos utiliza as chaves criptográficas gerenciadas temporariamente em memória pelo [[key-vault]] para assinar os novos nós de merge resultantes.
* **Projeção local**: A exibição do head temporário durante a divergência é resolvida por consultas à tabela local de projeções no SQLite, que desempata ordenando pelo maior HLC.

## Evolução
A governança e a evolução do mecanismo transacional sob o cenário de transição para a versão V4 estão descritas em:
* [caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.6](file:///c:/Dev2026/Docs/docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md#L560-L574)
* [caderno-2-protocol/04-automerge-integration-spec.md §4](file:///c:/Dev2026/Docs/docs/caderno-2-protocol/04-automerge-integration-spec.md#L61-L66)

**Atualização V4 — Colapso dos Modos e Liveness dos Validadores**:
* **Eleição Determinística entre Agentes**: Como todo dispositivo roda ativamente um agente de sistema ([[agente-de-sistema]]), a eleição de committer/mergeador é sempre determinística entre agentes, nunca negociada.
* **Merge Aditivo para Saldos**: Para saldos, a regra de merge na `SPECIFICATION` é aditiva ([[merge-aditivo]]), somando os deltas concorrentes (`base + Δ₁ + Δ₂`), evitando perdas associadas ao Last-Write-Wins.
* **Tradeoff de Liveness de Validadores**: O modelo de fork é compatível com o cenário de validadores ausentes. Mesmo na ausência total de validadores (modo read-only), a detecção estrutural de forks continua operacional via [[rbsr]]. No entanto, a criação de nós de merge para dados não-comutativos exige a presença de ao menos um validador declarado ([[validador-declarado]]) daquela linhagem. Sem validadores, os forks ficam registrados no grafo, mas o merge e as operações não-comutativas correspondentes permanecem congelados (read-only escopado por linhagem, conforme [[congelamento-escopado]]), sem comprometer a integridade histórica da rede ou corromper dados, até que um validador retorne. Operações comutativas (como leitura, gossip e o próprio RBSR) progridem de forma independente.

## Aparições a consolidar
As definições e referências duplicadas do termo foram unificadas sob este verbete:
1. **`docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md §2.10.2`**: detalha as etapas de detecção estrutural, eleição do mergeador e convergência em rede append-only.
2. **`docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md §4.6`**: descreve o comportamento de detecção de forks em cenários de partições e o tradeoff de liveness sob validadores ausentes.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[no]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[mutates]] | 1 | criado |
| [[hlc]] | 1 | criado |
| [[linhagem-de-versoes]] | 1 | criado |
| [[head]] | 1 | criado |
| [[key-vault]] | 2 | criado |
| [[profile-system]] | 3 | criado |
| [[rbsr]] | 4 | criado |
| [[documento-casca]] | 6 | criado |
| [[automerge-repo]] | 6 | criado |
| [[changes]] | 6 | criado |
| [[merge-aditivo]] | 6 | placeholder |
| [[sync-worker]] | 7 | placeholder |
| [[tradeoff-liveness-validadores]] | 8 | placeholder |
| [[consenso-emergencia]] | 8 | placeholder |
| [[morte-da-rede]] | 8 | placeholder |
| [[congelamento-escopado]] | 8 | placeholder |
| [[validador-declarado]] | 9 | placeholder |
| [[agente-de-sistema]] | 10 | placeholder |


