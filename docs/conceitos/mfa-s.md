---
title: MFA-S (Multi-Factor Audit Semantic)
slug: mfa-s
aliases: ["MFA-S", "Semantic Mapper", "Multi-Factor Audit Semantic", "linha do tempo MFA-S", "AuditTrail"]
tags: [protocol, automerge, audit, sqlite]
modo: canonical
fonte-canonica: docs/glossary.md §MFA-S
aparicoes-consolidadas:
  - glossary.md §MFA-S
  - docs/caderno-4-governance/01-development-roadmap.md §Fase 2
dependencias:
  - [[automerge]]
  - [[automerge-repo]]
  - [[changes]]
  - [[linhagem-de-versoes]]
---

# MFA-S (Multi-Factor Audit Semantic)

## Definição

O **MFA-S (Multi-Factor Audit Semantic)** (também denominado **Semantic Mapper** no ecossistema operacional) é o mecanismo de auditoria em nível de propriedade que opera sobre documentos de edição colaborativa para reconstruir antes/depois de deltas e gerar diffs semânticos legíveis sob demanda. Ele funciona em duas frentes complementares: realiza a coalescência em RAM das micro-mudanças brutas ([[changes]] do Automerge) acumuladas temporariamente na tabela local `pending_changes` do SQLite e as consolida em marcos de commit formais e assinados na [[linhagem-de-versoes]] do grafo global, enquanto provê uma trilha de auditoria histórica *lazy* (computada sob demanda) e não-redundante com a Linhagem de Versões do grafo global para visualização de histórico de alterações, viagem no tempo (*time travel*) e reversão cirúrgica de propriedades (*undo semântico*).

## Por quê

O uso do MFA-S resolve o tradeoff crítico entre reatividade em tempo real e inchaço do grafo de dados em sistemas **Local-First**. Se toda micro-edição granular (pulsação de digitação, clique ou alteração de caractere) gerasse um nó físico auditável no grafo persistente (`nodes`), a rede e o banco de dados local sofreriam uma degradação de desempenho catastrófica. 

Ao separar as micro-changes temporárias da publicação formal de versões, o MFA-S limpa o ruído operacional e assegura que apenas commits semanticamente válidos entrem no histórico permanente de auditoria global. Além disso, ao prover diffs semânticos granulares sob demanda baseados no histórico do Automerge, o MFA-S possibilita o **Undo Semântico** (a habilidade de reverter cirurgicamente uma propriedade sem desfazer edições concorrentes legítimas feitas por outros colaboradores), sustentando o princípio de [[honestidade-radical]] com máxima usabilidade.

## Contrato

As especificações do protocolo que regem o MFA-S assentam-se nas seguintes definições de contrato:

- **Imutabilidade e Snapshots**: Conforme [[caderno-2-protocol/04-automerge-integration-spec#1-o-acoplamento-automerge-e-grafo-de-versões]], o payload de um nó-versão de tipo `CONTENT:DOCUMENT` no grafo contém o snapshot binário integral e consolidado gerado via `Automerge.save(doc)`. A reidratação do documento é autossuficiente e requer apenas `Automerge.load(payload)`.
- **Rastreabilidade de Alterações**: De acordo com [[caderno-2-protocol/04-automerge-integration-spec#33-consolidação-e-emissão-de-nó-versão]], a aresta estrutural `AUTHORED` conecta o autor (`PROFILE`) ao novo nó-versão do grafo e carrega em seu payload o resumo descritivo das edições e o array com os hashes de todas as [[changes]] coalescidas.
- **Armazenamento Efêmero**: A coalescência de mudanças brutas utiliza a tabela local temporária não-replicada `pending_changes` no SQLite, classificada na [[matriz-de-classificacao-transporte]] como `REPLICABLE_VOLATILE` (observável por peers, não-auditável historicamente e sem sobrevivência além da sessão).

## Implementação

No SDK, o MFA-S é operacionalizado por meio de componentes de processamento e de exibição:

- **Coalescência no Sync Worker**: O [[sync-worker]] monitora o acúmulo de Changes do Automerge Repo na tabela SQLite `sqlite_pending_changes` e dispara o gatilho de commit sob duas heurísticas da `SPECIFICATION` do documento (ex: inatividade de 3 segundos ou acúmulo de 100 operações), consolidando-as e limpando `pending_changes` (conforme [[caderno-2-protocol/04-automerge-integration-spec#3-o-ciclo-de-commit-colaborativo]]).
- **Trilha Visual (Audit Trail)**: A engine [[audittrail-engine]] (especificada em [[caderno-3-sdk/03-engines-and-spec-driven-ui#22-interação-e-processos]]) atua como visualizador especializado da linhagem de versões do MFA-S para um documento Automerge. Reconstrói os diffs semânticos e permite a viagem no tempo carregando e reidratando snapshots históricos recuperados de forma assíncrona por meio de [[graph-based-routing]].

## Evolução

- **Simplificação Determinística (v4)**: Na versão 4 da plataforma (detalhada em [[caderno-2-protocol/04-automerge-integration-spec#4-modos-de-eleição-de-committer]]), a coordenação de commits do MFA-S é simplificada. Conforme o uso sistemático de agentes de sistema no dispositivo do usuário ([[profile-system]]), a eleição do Committer é sempre determinística (peer ativo de menor `entity_id`), eliminando o overhead de tráfego de negociação por mensagens efêmeras.
- **Undo Semântico e Interface**: O suporte a viagem no tempo e reversão cirúrgica baseada em logs históricos do MFA-S está listado como meta de implementação da Fase 2 de desenvolvimento (ver [[caderno-4-governance/01-development-roadmap#fase-2-motor-operacional-e-consistência-mfa-s-e-validação]]).

## Aparições a consolidar

| arquivo | seção | ação na Fase 3 |
|:---|:---|:---|
| `docs/glossary.md` | `§MFA-S` | Remover a definição redundante e apontar um wikilink para este verbete. |
| `docs/caderno-4-governance/01-development-roadmap.md` | `§Fase 2` | Ajustar a menção redundante à coalescência de mudanças e referenciar este verbete. |


