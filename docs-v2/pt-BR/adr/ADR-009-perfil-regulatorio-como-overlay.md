---
id: adr-009-perfil-regulatorio-como-overlay
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
  - docs-v2/pt-BR/arquitetura/topologia-e-autoridade.md (§1.3)
---

# ADR-009 — Perfil regulatório é overlay declarado, não produto nem camada

## Decisão

Um **perfil regulatório** é um conjunto de restrições declaradas que endurece
uma rede sem alterar o núcleo genérico. Ele não é um dos três produtos e não é
uma camada da arquitetura.

- **Contratos** define a gramática de perfil: o que um perfil pode restringir,
  como se declara e a suíte de conformidade que uma implementação precisa passar
  para provar que respeita um perfil.
- O perfil `corporate-regulated/securitization` é uma **instância** dessa
  gramática — dado versionado por rede, não código de produto.
- **Avelino** impõe o perfil ao validar propostas. Um administrador comum não
  desativa controle obrigatório de perfil.

## Motivo

Topologia e perfil já eram decisões independentes. Tratar o perfil como overlay
declarado preserva essa independência e permite um segundo domínio regulado
(saúde, educação, energia) sem tocar em nenhum dos três produtos.

Perfil não pode ser um módulo: módulo é instalável e revogável, e controle
regulatório obrigatório não pode ser desinstalável.

## Consequências

- Os 16 arquivos de `perfil-securitizacao/` deixam de ser especificação de
  produto e passam a ser a primeira instância da gramática de perfil. A
  gramática, porém, ainda não existe — foi escrita a instância antes do
  contrato.
- Escrever a gramática exige generalizar a partir de uma única instância. É o
  risco conhecido de generalizar com n=1; a mitigação é derivar a gramática dos
  controles que a instância de fato usa, e não de controles imaginados.
- "Perfil" só aparece como termo composto — **perfil regulatório**. O termo nu
  fica reservado ao tipo de nó `PROFILE` (quem age).
