---
title: Matriz de Classificação de Transporte
slug: matriz-de-classificacao-transporte
aliases: ["As 3 Perguntas", "classificação de transporte", "transport_hints"]
tags: [protocol, sdk, transporte, roteamento, specification]
modo: hub
fonte-canonica: docs/caderno-3-sdk/01-sqlite-and-projections-schema.md §4
aparicoes-consolidadas:
  - docs/rfc-transporte-p2p-v3.1.md §2.11
  - docs/glossary.md §transport_hints
dependencias:
  - [[no]]
  - [[aresta]]
  - [[specification]]
  - [[rbsr]]
  - [[private-swarm]]
  - [[ephemeral-messages]]
  - [[transport-hints]]
  - [[tinybase]]
  - [[sync-worker]]
---

# Matriz de Classificação de Transporte

Modelo de roteamento e decisão arquitetural que determina o destino físico, o protocolo de rede e o esquema criptográfico de qualquer dado na plataforma com base nas respostas a três perguntas fundamentais declaradas nos metadados de sua especificação. Ao invés de o desenvolvedor de interface decidir manualmente como um dado trafega, o sistema infere as restrições de persistência, visibilidade e auditabilidade de forma declarativa e transparente.

A definição canônica e o contrato de tipos TypeScript estão descritos em [01-sqlite-and-projections-schema.md §4](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/01-sqlite-and-projections-schema.md#L190-L270) e aprofundados na especificação de protocolo em [rfc-transporte-p2p-v3.1.md §2.11](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L223-L336).

---

## Por quê ([[vision]])

No paradigma [local-first](file:///c:/Dev2026/Docs/docs/caderno-1-vision/01-vision-and-positioning.md), a camada de aplicação não deve gerenciar manualmente os detalhes de sockets, replicação de banco de dados ou criptografia. A Matriz de Classificação de Transporte resolve isso por meio da **Inversão de Controle**: o desenvolvedor declara as leis semânticas do dado (através da [[specification]] do nó), e a infraestrutura deduz a topologia mais adequada (seja ela local, replicada via [[rbsr]], ou efêmera via WebRTC). Isso garante consistência de segurança e privacidade em todas as interfaces.

## Contrato ([[protocol]])

O comportamento na rede e no armazenamento local é ditado pelas respostas declaradas a três perguntas fundamentais:

1. **Outro peer precisa observar este estado?** (Q1: Observável)
2. **A integridade histórica deste estado precisa ser auditada?** (Q2: Auditável)
3. **O estado precisa sobreviver ao encerramento da sessão?** (Q3: Persistente)

A partir dessas respostas, o dado é classificado em uma de quatro categorias com regras específicas de destino e protocolo, conforme definido em [rfc-transporte-p2p-v3.1.md §2.11](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L233-L239):

| Q1 (Observável) | Q2 / Q3 | Classificação Lógica | Destino Físico | Transporte / Sync | Cifra |
| :--- | :--- | :--- | :--- | :--- | :--- |
| SIM | (Q2) SIM | Replicável + Auditável | `nodes`/`edges` (SQLite) | [[rbsr]] (Onda 1/2) | Chave de Época |
| SIM | (Q2) NÃO | Replicável + Não-Auditável | `pending_changes` (RAM $\rightarrow$ RAM) | [[ephemeral-messages]] (WebRTC) | Chave de Época |
| NÃO | (Q3) SIM | Local + Persistente (mesmo usuário) | OPFS isolado (`user_local.db`) | [[private-swarm]] (Túnel dedicado) | Chave do Dispositivo (HKDF) |
| NÃO | (Q3) NÃO | Local + Transiente / Efêmero | [[tinybase]] / RAM | Nenhum (não trafega) | N/A |

### Transições de Estado
Dados podem transitar entre categorias. Por exemplo, uma digitação em tempo real começa como "Replicável + Não-Auditável" (changes efêmeros) ou "Local + Persistente" (rascunho local) e, ao ser salva pelo usuário, é promovida a "Replicável + Auditável" no grafo global (ver [rfc-transporte-p2p-v3.1.md §2.11](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L249-L260)).

## Implementação ([[sdk]])

O [[sync-worker]] lê os [[transport-hints]] declarados na [[specification]] e despacha os dados para a fila correta de forma transparente.

O contrato de tipos e a função de avaliação em TypeScript estão definidos em [01-sqlite-and-projections-schema.md §4.3](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/01-sqlite-and-projections-schema.md#L231-L255):

```typescript
type TransportBehavior =
  | { category: 'REPLICABLE_AUDITABLE';  destination: 'sqlite_nodes_edges';   protocol: 'RBSR';             requiresLineage: true  }
  | { category: 'REPLICABLE_VOLATILE';   destination: 'sqlite_pending_changes'; protocol: 'EPHEMERAL_WEBRTC'; requiresLineage: false }
  | { category: 'LOCAL_PERSISTENT';      destination: 'sqlite_user_local';     protocol: 'PRIVATE_SWARM';    requiresLineage: false }
  | { category: 'LOCAL_TRANSIENT';       destination: 'ram_tinybase';          protocol: 'NONE';             requiresLineage: false };

function evaluateTransportHints(
  isObservableByOtherPeers: boolean,
  isAuditable: boolean,
  mustSurviveDisconnection: boolean
): TransportBehavior {
  if (isObservableByOtherPeers) {
    return isAuditable
      ? { category: 'REPLICABLE_AUDITABLE',  destination: 'sqlite_nodes_edges',    protocol: 'RBSR',             requiresLineage: true  }
      : { category: 'REPLICABLE_VOLATILE',   destination: 'sqlite_pending_changes', protocol: 'EPHEMERAL_WEBRTC', requiresLineage: false };
  } else {
    return mustSurviveDisconnection
      ? { category: 'LOCAL_PERSISTENT', destination: 'sqlite_user_local', protocol: 'PRIVATE_SWARM', requiresLineage: false }
      : { category: 'LOCAL_TRANSIENT',  destination: 'ram_tinybase',      protocol: 'NONE',          requiresLineage: false };
  }
}
```

O fluxo arquitetural segue cinco etapas: **Intenção (UI)** $\rightarrow$ **Interceptação (Ponte Reativa)** $\rightarrow$ **Consulta à Lei (Specification)** $\rightarrow$ **Classificação Estrita (Discriminated Union)** $\rightarrow$ **Execução (Sync Worker)** (ver [rfc-transporte-p2p-v3.1.md §2.11.1](file:///c:/Dev2026/Docs/docs/rfc-transporte-p2p-v3.1.md#L279-L286)).

## Evolução ([[governance]])

As regras de enquadramento da matriz de transporte e os limites de degradação são governados pela [[specification]] da rede. Alterações nos critérios de custódia e persistência dependem de novos consensos e atualizações de SemVer da especificação (conforme detalhado em `caderno-4-governance/03-specification-lifecycle-and-rfcs.md`).

---

## Dependências por onda

| slug | onda | status |
|:-----|:-----|:-------|
| [[no]] | 1 | criado |
| [[aresta]] | 1 | criado |
| [[specification]] | 1 | criado |
| [[rbsr]] | 4 | criado |
| [[private-swarm]] | 5 | criado |
| [[ephemeral-messages]] | 6 | placeholder |
| [[transport-hints]] | 7 | placeholder |
| [[tinybase]] | 7 | placeholder |
| [[sync-worker]] | 7 | placeholder |


