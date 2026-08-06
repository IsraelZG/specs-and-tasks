---
id: adr-011-catalogo-de-modulos-e-produto-como-composicao
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
  - docs-v2/pt-BR/adr/ADR-004-declaracao-unica-de-extensao.md
  - docs-v2/pt-BR/adr/ADR-010-plataforma-e-produtos.md
---

# ADR-011 — Módulos vivem num catálogo; um produto é uma composição declarada

## Decisão

Módulos não pertencem à plataforma nem a um produto. Eles são extensões
publicáveis num **catálogo**, cada uma com sua declaração `kind: modulo`.

Um **produto** é uma **declaração de composição**. Ele não é código. Declara:

- que módulos do catálogo ativa;
- que perfis regulatórios aplica;
- que identidade visual usa;
- que topologia e que autoridade lógica opera a rede.

CoopCentral é uma declaração de composição. A securitizadora é outra. As duas
podem ativar subconjuntos diferentes do mesmo catálogo.

## Por que não é um quarto `kind`

Uma extensão se acopla a um sistema em execução. Uma composição **define** qual
sistema existe. São schemas distintos: a declaração de extensão descreve o que
uma peça oferece; a declaração de produto escolhe as peças. Fundi-las faria um
produto parecer instalável e revogável, o que ele não é.

## Motivo

A relação entre CoopCentral e a securitizadora é indefinida por decisão
(ADR-010). Se os módulos pertencessem a um produto, `fintech` seria escrito duas
vezes e a hipótese de um produto servir o outro perderia sentido. Se
pertencessem à plataforma, os pilares carregariam regra de domínio, o que o
ADR-010 proíbe. O catálogo é o único lugar que satisfaz as duas restrições.

## Consequências

- Um módulo é escrito uma vez e ativado por vários produtos. Ele não pode
  conter suposição sobre qual produto o hospeda.
- "CoopCentral presta serviço de securitização" deixa de ser caso especial: é
  uma composição que ativa o módulo correspondente e o perfil regulatório
  correspondente.
- O catálogo precisa de política de publicação, versionamento e revogação. Nada
  disso está especificado.
- A declaração de produto não existe hoje em nenhum documento. É artefato novo.
