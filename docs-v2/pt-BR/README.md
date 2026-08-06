---
id: docs-v2-readme
tipo: indice
status: ativo
data-base: 2026-08-01
fontes:
  - docs/briefing-reescrita-tecnica-securitizadora-sem-p2p-puro.md
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md
---

# Especificação técnica v2 — índice

Este diretório contém a reescrita técnica da especificação da plataforma.
Ele ativa o perfil regulado de securitizadora e remove o modo P2P puro.
O parecer jurídico e os textos de produto originais permanecem em `docs/`.

## Convenções

- Um conceito tem um único nome e uma única definição canônica.
- Todo arquivo declara `id`, `tipo`, `status` e `fontes` no frontmatter.
- Arquivos com `status: substituido` são histórico. Não os use como contrato.
- O campo `substitui` aponta o documento antigo que o arquivo torna obsoleto.
- Todo protocolo define tipos exatos, estados, erros, idempotência e testes.
- Nenhum documento deixa decisão de design para o implementador.
- A expressão controlada para o enquadramento da emissão é:
  "colocação privada, fora do âmbito das ofertas públicas, conforme
  classificação jurídica documentada".

## Mapa dos documentos

### Governança

- [ADR-001 — Autoridade lógica e fim do P2P puro](adr/ADR-001-autoridade-logica.md)

### Arquitetura

- [Topologia de rede e autoridade lógica](arquitetura/topologia-e-autoridade.md)

### Protocolo

- [Graph Sync Protocol — change feed autoritativo](protocolo/graph-sync-protocol.md)
- [Wire Protocol — frames e canais lógicos](protocolo/wire-protocol.md)
- [Linhagem criptográfica, identidade legal e assinatura](protocolo/cryptographic-lineage-and-auth.md)
- [Integração Automerge](protocolo/automerge-integration.md)

### SDK

- [Schema SQLite e projeções](sdk/sqlite-schema.md)
- [Sync Worker e ciclo de vida](sdk/sync-worker.md)
- [Plano de transporte de mídia](sdk/media-transport-plane.md)
- [Conectores externos](sdk/connectors.md)

### Perfil de securitização

- [Perfil `corporate-regulated/securitization`](perfil-securitizacao/perfil.md)
- [Ficha de enquadramento](perfil-securitizacao/ficha-de-enquadramento.md)
- [Dossiê da emissão e livros formais](perfil-securitizacao/dossie-e-livros.md)
- [Titularidade e movimentação](perfil-securitizacao/titularidade-e-movimentacao.md)
- [Gravames, bloqueios e eventos financeiros](perfil-securitizacao/gravames-e-eventos.md)
- [Patrimônio separado](perfil-securitizacao/patrimonio-separado.md)
- [Registro externo](perfil-securitizacao/registro-externo.md)
- [Retenção e privacidade](perfil-securitizacao/retencao-e-privacidade.md)

### Conceitos

- [Índice de conceitos](conceitos/_indice.md)

### Execução

- [Plano de implementação](plano-de-implementacao.md)
- [Tasks que exigem novo endurecimento](tasks-reendurecimento.md)
