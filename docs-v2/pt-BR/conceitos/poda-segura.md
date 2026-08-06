---
id: poda-segura
tipo: conceito
status: ativo
fontes:
  - docs-v2/sdk/sqlite-schema.md
  - docs/caderno-1-vision/04-conformidade-securitizadora-debentures-privadas.md (seção 8)
substitui:
  - docs/conceitos/poda-segura.md
---

# poda-segura

A poda é uma política da réplica. Ela remove o payload local quando a
política de retenção permite. Ela nunca destrói a fonte autoritativa.

Regras:

1. A autoridade mantém a cópia integral exigida pela classe documental.
2. A réplica podada preserva id, hash, assinatura e prova de continuidade.
3. Um legal hold bloqueia a poda do registro afetado.
4. Reidratação, restauração e reconstrução por data-base são testáveis.

A verificação pré-poda por gossip entre clientes deixou de existir. A
garantia de disponibilidade vem da autoridade, não de quórum entre peers.

Contrato completo: `docs-v2/sdk/sqlite-schema.md` seções 2 e 3.
