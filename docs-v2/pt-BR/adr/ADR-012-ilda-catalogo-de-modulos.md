---
id: adr-012-ilda-catalogo-de-modulos
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
  - docs-v2/pt-BR/adr/ADR-011-catalogo-de-modulos-e-produto-como-composicao.md
  - docs-v2/pt-BR/adr/ADR-010-plataforma-e-produtos.md
---

# ADR-012 — Ilda é o catálogo de módulos, e fica acima da plataforma

## Decisão

O catálogo previsto no ADR-011 passa a se chamar **Ilda**. Ele reúne os módulos
reutilizáveis com que se constroem produtos, e os conectores canônicos que
valem para mais de um produto.

Ilda **não é um pilar da plataforma**. A plataforma SuperApp continua sendo
Avelino, Marilda e Contratos.

```
CoopCentral · Securitizadora     produtos (composição declarada)
        ▲
      Ilda                       módulos e conectores canônicos
        ▲
Avelino · Marilda · Contratos      SuperApp — a plataforma
```

## Por que fora da plataforma

A plataforma é agnóstica ao tipo de produto que se constrói sobre ela. Fintech,
social e ERP são opiniões de domínio. Uma plataforma que os embarca deixa de ser
agnóstica, e o ADR-010 seria contrariado no dia seguinte.

## Por que fora de Contratos

Contratos declara contratos e provas, e não contém domínio nem motor de avaliação
— ADR-003 e ADR-006. Um módulo de fintech tem regra de negócio e código. A
distância entre as duas coisas não é de grau.

## Dependências

Ilda depende dos três pilares, porque um módulo tem facetas em cada um:

| Faceta | Depende de |
| :--- | :--- |
| declaração e comandos | Contratos |
| domínio e validação | Avelino |
| páginas e wrappers | Marilda |

A proibição do ADR-002 continua valendo apenas entre Avelino e Marilda. Nada
depende de Ilda, exceto produtos.

## Versionamento

Ilda é um catálogo com versionamento **por módulo**, não um pacote único. Um
pacote monolítico obrigaria todo consumidor a subir de versão a cada módulo
novo, e a granularidade do ADR-002 se perderia no primeiro release.

## Plugins e conectores

Plugins e conectores não ganham pacote próprio. Ficam soltos, publicados por
quem os escreve. Os que já estão especificados e servem a mais de um produto —
Junta Comercial, provedor de assinatura, validador ICP-Brasil, bancos e contas
vinculadas, eSocial — são os candidatos naturais a entrar em Ilda.

## Consequências

- O ADR-011 não é emendado. Ele já dizia que módulos não pertencem à plataforma
  nem a um produto; Ilda é o nome e o dono do lugar que ele reservou.
- A política de publicação, versionamento e revogação do catálogo continua sem
  especificação. Ganhou nome, não ganhou regra.
- Nenhum módulo existe hoje. Ilda nasce vazia.
