---
id: adr-010-plataforma-e-produtos
tipo: adr
status: aceito
data: 2026-08-02
fontes:
  - sessão de grilling arquitetural 2026-08-02
  - docs-v2/pt-BR/adr/ADR-002-tres-produtos-independentes.md
  - docs-v2/pt-BR/adr/ADR-009-perfil-regulatorio-como-overlay.md
---

# ADR-010 — A plataforma não conhece nenhum produto

## Decisão

Avelino, Marilda e Contratos são os três **pilares** de uma **plataforma**, cujo
nome provisório é **SuperApp**. A plataforma não é vendida ao usuário final.

Sobre ela se constroem **produtos**. **CoopCentral** é o primeiro. A
securitizadora é um produto distinto, e ainda não está decidido se ela roda numa
instância própria da plataforma ou consome serviços de CoopCentral. CoopCentral
precisa, de todo modo, ser capaz de prestar esse tipo de serviço.

## Consequência principal

Como a relação entre os dois produtos é indefinida por decisão, **a plataforma
não pode assumir nenhuma das hipóteses**. Disso decorrem três restrições:

1. Nenhum pilar contém regra de CoopCentral ou da securitizadora. Um produto
   nunca é premissa de compilação da plataforma.
2. A composição de um produto — que módulos ativa, que perfis regulatórios
   aplica, que identidade visual usa — é declarada, não codificada.
3. Um produto precisa poder prestar serviço a outra organização sem que isso
   exija um caminho especial no núcleo. A topologia e o perfil regulatório são
   decisões de implantação, não de código.

## Emenda ao ADR-002

O ADR-002 chamou Avelino, Marilda e Contratos de "produtos". O termo agora designa
a oferta construída sobre a plataforma. Os três são **pilares**. As decisões do
ADR-002 — versionamento independente, adoção separada por terceiros, proibição
de dependência entre Avelino e Marilda — permanecem inalteradas.

## Estado da especificação

CoopCentral não tem nenhuma especificação. A palavra não aparecia no
repositório antes desta sessão. A securitizadora tem 16 arquivos, o bloco mais
completo do corpus, hoje classificados como a primeira instância da gramática de
perfil regulatório do ADR-009.
