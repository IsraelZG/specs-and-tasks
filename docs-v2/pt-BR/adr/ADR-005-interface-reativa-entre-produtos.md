---
id: adr-005-interface-reativa-entre-produtos
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
  - docs-v2/pt-BR/adr/ADR-003-portas-e-conformidade.md
---

# ADR-005 — Marilda fala com Avelino por store reativo, nunca por persistência

## Decisão

A fronteira entre Marilda e Avelino são duas portas declaradas em Contratos,
assimétricas por natureza:

- **Leitura** — porta de store reativo (tabelas, linhas, consultas, listeners).
  Avelino popula o store apenas com o que as capacidades do portador autorizam.
  A filtragem por permissão acontece antes do dado entrar no store, não na tela.
- **Escrita e ação** — porta de comandos. Ver ADR-007: a ação é sempre a
  invocação de um comando nomeado do dicionário. Um comando de escrita produz
  uma proposta, validada pela autoridade antes de entrar no feed, de onde
  retorna pela porta de leitura.

> Emenda de 2026-08-02: a redação original desta seção chamava a superfície de
> escrita de "porta de mutação". Ela é a porta de comandos do ADR-007; não são
> duas coisas.

A forma da porta de leitura é modelada na API do TinyBase, e Avelino a
implementa com TinyBase. A porta é o contrato; TinyBase é a implementação de
referência dela. Marilda programa contra a porta e nunca importa Avelino.

Marilda não conhece o esquema do grafo, o motor de armazenamento nem o formato
de replicação. Qualquer serviço que satisfaça as duas portas e passe a suíte de
conformidade substitui Avelino sem que Marilda mude.

## Motivo

O critério declarado foi: "outro serviço que ofereça a mesma interface
funcionaria". Isso é a definição de uma porta. Adotar a biblioteca diretamente
como contrato entregaria a mesma ergonomia hoje e prenderia o versionamento dos
três produtos ao de uma dependência de terceiro.

## Consequências

- A leitura não atravessa a autoridade a cada consulta: a autorização já está
  refletida no conteúdo do store. A escrita sempre volta à autoridade.
- TinyBase passa a ser decisão registrada deste repositório. Ela era herança do
  corpus antigo e não havia sido reafirmada em nenhum documento do v2.
- A suíte de conformidade da porta de leitura precisa cobrir o comportamento
  reativo (o que dispara listener, em que ordem, com qual granularidade) — não
  só o formato dos dados.
