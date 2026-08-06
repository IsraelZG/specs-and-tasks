---
id: tasks-reendurecimento
tipo: registro
status: ativo
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md (seções 3 e 18)
  - docs-v2/adr/ADR-001-autoridade-logica.md
---

# Tasks que exigem novo endurecimento

Este registro lista as frentes de trabalho impactadas pela reescrita. A
atualização das tasks do MGTIA ocorre somente após a conclusão das fontes
canônicas. Este arquivo é a ponte entre a especificação e o backlog.

## 1. Frentes impactadas pela nova topologia

| Frente | Motivo | Nova fonte |
| :--- | :--- | :--- |
| Sync e reconciliação | RBSR saiu do caminho normal | `protocolo/graph-sync-protocol.md` |
| Wire protocol | canais lógicos e novos frames | `protocolo/wire-protocol.md` |
| Gênese e bootstrap | criação pela autoridade | `arquitetura/topologia-e-autoridade.md` |
| Custódia e poda | custódia designada, poda de réplica | `sdk/sqlite-schema.md` |
| Sync Worker | outbox e aplicação de lotes | `sdk/sync-worker.md` |
| Transporte de blobs | manifesto da autoridade, sem DHT | `sdk/media-transport-plane.md` |
| Identidade e assinatura | vínculo legal e níveis | `protocolo/cryptographic-lineage-and-auth.md` |

## 2. Frentes novas do perfil de securitização

| Frente | Fonte |
| :--- | :--- |
| Ficha de enquadramento | `perfil-securitizacao/ficha-de-enquadramento.md` |
| Dossiê, fechamentos e livros | `perfil-securitizacao/dossie-e-livros.md` |
| Titularidade, ordens e movimentos | `perfil-securitizacao/titularidade-e-movimentacao.md` |
| Gravames e eventos financeiros | `perfil-securitizacao/gravames-e-eventos.md` |
| Patrimônio separado | `perfil-securitizacao/patrimonio-separado.md` |
| Registro externo | `perfil-securitizacao/registro-externo.md` |
| Retenção, legal hold e LGPD | `perfil-securitizacao/retencao-e-privacidade.md` |
| Conectores regulatórios e matriz fiscal | `sdk/connectors.md` |

## 3. Procedimento

1. Marcar as tasks afetadas para novo endurecimento.
2. Reendurecer cada task contra a fonte nova correspondente.
3. Não reendurecer contra os documentos antigos de `docs/`. Eles são
   histórico para os temas cobertos por este corpus.
