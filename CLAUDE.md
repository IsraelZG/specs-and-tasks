# Wiki da Plataforma V3.1 — convenções

## Estrutura
- docs/conceitos/<slug>.md  → verbete canônico (definição única)
- docs/caderno-{1..4}/...    → lentes que LINKAM, não redefinem

## Regra de fonte única (inviolável)
Cada conceito é definido UMA vez, em docs/conceitos/. Em qualquer outro
lugar, referencie via [[slug]] — nunca redefina. Se algo já está definido,
linke; não copie.

## As quatro lentes
vision = por quê/para quem · protocol = contrato (fio/matemática, agnóstico
de linguagem) · sdk = implementação TS · governance = política/evolução.
Cada caderno ADICIONA um ângulo sobre o conceito, não uma cópia dele.

## Realoque, não reescreva
Conteúdo normativo (crypto, invariantes, fórmulas, assinaturas de interface):
MOVA o texto original literalmente. Não parafraseie de memória — você degrada
a precisão. Resumo só com link explícito para o canônico.

## Histórico
Não é mais append-only. Você PODE mover, mesclar e DELETAR livremente —
o git guarda o histórico. Não deixe duplicatas "por segurança".

## Workflow
Um conceito ou um caderno por vez. Commit por unidade, mensagem descritiva.
Nunca um PR monolítico. Ao terminar uma unidade, rode /verificar antes de seguir.

## Links
Wikilinks [[slug]] para conceitos. Slugs kebab-case, estáveis.

## Migração wiki — Fase 2

Estado da migração e ferramentas:
- Inventário de conceitos: docs/conceitos/_inventario.md
- Plano de ondas: docs/conceitos/_plano-de-ondas.md
- Executar uma onda: /rodar-onda <n>
- Verificar o wiki: Use o subagent auditor-wiki

Ondas 1 a 10 concluídas. Próxima: Onda 11.