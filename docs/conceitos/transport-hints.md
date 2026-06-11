---
title: transport_hints
slug: transport-hints
aliases:
  - transport_hints
  - TransportHints
tags:
  - sdk
  - canonical
  - onda-7
modo: canonical
fonte-canonica: docs/caderno-3-sdk/01-sqlite-and-projections-schema.md §4.2
aparicoes-consolidadas:
  - docs/glossary.md §transport_hints
  - docs/rfc-transporte-p2p-v3.1.md §2.11.1
dependencias:
  - [[specification]]
  - [[matriz-de-classificacao-transporte]]
  - [[sync-worker]]
---

# transport_hints

## Definição

**`transport_hints`** é a declaração embutida no payload de uma [[specification]] que responde às três perguntas de classificação de transporte. A infraestrutura usa essas flags para rotear dados automaticamente ao destino físico correto — sem que a UI precise saber sobre transporte.

O princípio é de **inversão de controle**: quem decide o destino é o criador do módulo de negócio (ao escrever a `SPECIFICATION`), não o desenvolvedor de UI no momento da submissão.

## As três flags

```yaml
specification:
  type: "SPECIFICATION:DOCUMENT_DRAFT"
  transport_hints:
    observable_by_peers: false   # Outro peer precisa observar este estado?
    is_auditable: false          # A integridade histórica precisa ser auditada?
    survives_disconnection: true # O estado precisa sobreviver ao encerramento da sessão?
```

As flags mapeiam diretamente para as quatro categorias da [[matriz-de-classificacao-transporte]]:

| `observable_by_peers` | `is_auditable` / `survives_disconnection` | Categoria | Destino |
|:---|:---|:---|:---|
| `true` | `is_auditable: true` | `REPLICABLE_AUDITABLE` | `nodes`/`edges` via RBSR |
| `true` | `is_auditable: false` | `REPLICABLE_VOLATILE` | `pending_changes` via Ephemeral WebRTC |
| `false` | `survives_disconnection: true` | `LOCAL_PERSISTENT` | `device_state.db` via Private Swarm |
| `false` | `survives_disconnection: false` | `LOCAL_TRANSIENT` | RAM / TinyBase |

## Contrato de tipos (TypeScript)

O contrato normativo completo está em [`caderno-3-sdk/01-sqlite-and-projections-schema.md §4.2–4.3`](../caderno-3-sdk/01-sqlite-and-projections-schema.md):

```typescript
type TransportBehavior =
  | { category: 'REPLICABLE_AUDITABLE';  destination: 'sqlite_nodes_edges';    protocol: 'RBSR';             requiresLineage: true  }
  | { category: 'REPLICABLE_VOLATILE';   destination: 'sqlite_pending_changes'; protocol: 'EPHEMERAL_WEBRTC'; requiresLineage: false }
  | { category: 'LOCAL_PERSISTENT';      destination: 'sqlite_user_local';     protocol: 'PRIVATE_SWARM';    requiresLineage: false }
  | { category: 'LOCAL_TRANSIENT';       destination: 'ram_tinybase';          protocol: 'NONE';             requiresLineage: false };

function evaluateTransportHints(
  isObservableByOtherPeers: boolean,
  isAuditable: boolean,
  mustSurviveDisconnection: boolean
): TransportBehavior { /* ... */ }
```

O tipo algébrico (`Discriminated Union`) blinda o destino físico contra protocolos incompatíveis em tempo de compilação.

## Fluxo de roteamento

Quando uma ação ocorre na UI, o [[sync-worker]] executa um fluxo estrito de cinco etapas (descrito em `rfc-transporte-p2p-v3.1.md §2.11.1`):

1. **Intenção (UI):** o componente visual dispara uma mutação genérica no cache em RAM ([[tinybase]]).
2. **Interceptação (Ponte Reativa):** o *Persister* intercepta a intenção e verifica o `type` do nó.
3. **Consulta à Lei:** o sistema busca a [[specification]] associada e extrai os `transport_hints`.
4. **Classificação Estrita:** as flags são passadas para o classificador interno do [[sync-worker]], que retorna o `TransportBehavior` correspondente.
5. **Execução:** o [[sync-worker]] despacha os bytes para a fila de SQLite ou WebRTC correspondente.

## Transições de estado

Dados podem ser promovidos entre categorias conforme o ciclo de vida do conteúdo:

```
┌──────────────────┐       ┌──────────────────────┐       ┌─────────────────────┐
│ Local +          │  ──►  │ Replicável +          │  ──►  │ Replicável +        │
│ Persistente      │       │ Não-Auditável         │       │ Auditável           │
│ (Rascunho)       │       │ (digitação ao vivo)   │       │ (documento salvo)   │
│ Private Swarm    │       │ Ephemeral WebRTC      │       │ RBSR Onda 1/2       │
└──────────────────┘       └──────────────────────┘       └─────────────────────┘
```

## Aparições consolidadas

- `docs/glossary.md §transport_hints` — definição em uma linha; consolidada neste verbete.
- `docs/rfc-transporte-p2p-v3.1.md §2.11.1` — repete exemplo YAML, fluxo de 5 etapas e contrato TypeScript; consolidado neste verbete com referência ao canônico.

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[specification]] | 1 | criado |
| [[matriz-de-classificacao-transporte]] | 5 | criado |
| [[sync-worker]] | 7 | criado |
| [[tinybase]] | 7 | criado |


