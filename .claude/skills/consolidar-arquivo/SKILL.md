---
name: consolidar-arquivo
description: Orquestra a consolidação de um arquivo da Fase 3 via subagent
  consolidador, com auditoria ao final. Invocar com o caminho do arquivo, ex.:
  /consolidar-arquivo docs/caderno-2-protocol/02-cryptographic-lineage-and-auth.md
---
# Consolidar $ARGUMENTS

## Pré-voo (antes de despachar o consolidador)

1. Execute o script determinístico para obter a lista de KEEPERS e os slugs de conceitos presentes no arquivo:
   ```bash
   node scripts/consolidar-preflight.mjs $ARGUMENTS
   ```
   Anote os "KEEPERS conhecidos" e os "Slugs presentes" retornados.

## Despachar

Despache o subagent `consolidador`:

"Consolide o arquivo `$ARGUMENTS`.
KEEPERS conhecidos (Caso A garantido): <lista obtida no pré-voo>.
Slugs presentes no arquivo: <lista obtida no pré-voo>.
Siga o algoritmo de 4 casos do seu system prompt.
Proibido deixar `> ver [[slug]]` com corpo intacto abaixo."


Aguarde concluir.

## Pós-consolidação

1. Despache o subagent `auditor-wiki` sobre `docs/`.
2. Relate:
   - Retorno linha-por-linha do consolidador (slug: CASO — ação)
   - Achados do auditor filtrados para `$ARGUMENTS` (links quebrados novos,
     definições concorrentes que persistem neste arquivo)
   - TODOs restantes em `$ARGUMENTS`
3. PARE — aguarde confirmação antes do próximo arquivo.

