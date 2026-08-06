---
id: adr-027-namespace-por-pilar
tipo: adr
status: aceito
data: 2026-08-03
fontes:
  - sessão de grilling 2026-08-03
  - docs-v2/pt-BR/adr/ADR-002-tres-produtos-independentes.md
resolve:
  - questoes-abertas.md Q-05
---

# ADR-027 — Um namespace de pacotes por pilar

## Decisão

Cada pilar tem seu próprio namespace. Ilda também.

```
@avelino/*      núcleo: identidade, grafo, feed, sync, transporte
@marilda/*      experiência: design system, engines, páginas, shell
@contratos/*    portas, esquemas, ontologia, piso, suítes de conformidade
@ilda/*         módulos do catálogo
```

> **Emenda de 2026-08-03 (ADR-028).** O terceiro pilar passou a se chamar
> **Contratos**, e seu namespace deixou de estar pendente.

`@plataforma/*` é herança do projeto anterior e não é adotado.

## Motivo

O ADR-002 quis a fronteira verificável por build em vez de por prosa. Um
namespace por pilar a torna verificável **por leitura**, antes de qualquer
build: `import { x } from '@marilda/...'` dentro de código de Avelino está
errado a olho nu.

É um guard passivo, sem ferramenta, sem configuração e sem manutenção. O lint
continua valendo; deixa de ser a única linha de defesa.

Efeito secundário: para quem adota apenas um pilar — a hipótese de terceiros do
ADR-002 — fica evidente o que está trazendo.

## Consequências

- Se o código atual for portado, são 817 ocorrências em 440 arquivos a
  renomear. É mecânico, e só incorre se houver porte.
- São quatro nomes a registrar e defender em vez de um. Nomes de pacote são
  recurso escasso em registro público.
- O namespace de Ilda é `@ilda/*` mesmo Ilda não sendo pilar. Ela é unidade de
  distribuição própria, e a mesma legibilidade se aplica.
