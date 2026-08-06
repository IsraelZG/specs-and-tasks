---
id: contexto-avelino
tipo: contexto
status: ativo
data: 2026-08-02
---

# Avelino

O núcleo: identidade e permissões, grafo append-only, feed autoritativo,
sincronização e transporte. Implementa as portas de Contratos. Não conhece
Marilda.

## Language

**Autoridade lógica**:
A função de governo de uma rede, sob responsabilidade de uma entidade jurídica
identificada. Única por rede, podendo executar em várias instâncias físicas.
_Evitar_: servidor, peer do sistema, nó central.

**Feed autoritativo**:
Sequência ordenada de lotes confirmados, cada um coberto por manifesto assinado
e encadeado. É a única prova de completude e posição.
_Evitar_: log, stream, changelog.

**Proposta**:
Escrita submetida por um portador, ainda não confirmada. Vira registro oficial
somente após validação pela autoridade.
_Evitar_: comando, transação, rascunho.

**Registro**:
Fato confirmado e imutável no grafo. Nunca é alterado; correção se faz por
evento compensatório.
_Evitar_: linha, entrada, documento.

**Capacidade**:
Autorização delegável e revogável que habilita uma operação. Autoriza a
requisição; não transporta chave.
_Evitar_: permissão, papel, token — cada um significa outra coisa.

**Projeção**:
Tabela derivada do grafo, reconstruível a partir dele e nunca fonte de verdade.
_Evitar_: cache, view, índice.

**P2P oportunístico**:
Entrega direta de bytes entre portadores autorizados. Melhora latência e custo e
não altera o modelo de confiança.
_Evitar_: rede P2P, mesh, gossip.
