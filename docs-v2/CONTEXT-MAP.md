---
id: context-map
tipo: mapa-de-contexto
status: ativo
data: 2026-08-02
---

# Mapa de contextos

Este repositório de especificação é a semente de um repositório novo. Ele
descreve a plataforma **SuperApp** (nome provisório), formada por três pilares,
mais o catálogo de módulos que fica acima dela. Cada contexto tem seu próprio
glossário.

```
CoopCentral · Securitizadora     produtos (composição declarada)
        ▲
      Ilda                       módulos e conectores canônicos
        ▲
Avelino · Marilda · Contratos      SuperApp — a plataforma, agnóstica
```

## Contextos

### Pilares da plataforma

- **Avelino** (`contextos/avelino/CONTEXT.md`) — o núcleo: transporte, grafo
  append-only, autenticação e permissões, feed e sincronização.
- **Marilda** (`contextos/marilda/CONTEXT.md`) — a camada de experiência:
  design system, engines transversais e o motor de páginas dirigido por
  especificação.
- **Contratos** (`contextos/contratos/CONTEXT.md`) — o contrato e a prova: as
  portas, os esquemas de declaração e de perfil, a ontologia, o piso e as suítes
  de conformidade. Único sem nome próprio, porque nada nele executa.

### Acima da plataforma

- **Ilda** (`contextos/ilda/CONTEXT.md`) — o catálogo de módulos reutilizáveis e
  dos conectores canônicos. Não é pilar: a plataforma precisa ficar agnóstica ao
  domínio.

## Relações

- **Avelino → Contratos**: Avelino implementa os contratos declarados por Contratos.
- **Marilda → Contratos**: Marilda consome os contratos declarados por Contratos.
- **Contratos → nada**: Contratos não depende de nenhum outro contexto.
- **Avelino ↮ Marilda**: proibido em ambas as direções. A proibição é verificada
  por build, não por prosa.
- **Ilda → os três**: um módulo tem faceta de declaração (Contratos), de domínio e
  autoridade (Avelino) e de cliente (Marilda).
- **Produto → Ilda**: um produto ativa módulos do catálogo. Nada mais depende de
  Ilda.

## Termos do mapa

**Plataforma**:
O conjunto dos três pilares. Nome provisório: **SuperApp**. Não é vendida ao
usuário final; produtos são construídos sobre ela.
_Evitar_: framework, stack, sistema.

**Pilar**:
Avelino, Marilda ou Contratos. Adotável e versionável de forma independente,
inclusive por terceiros.
_Evitar_: produto, componente, camada, pacote — cada um significa outra coisa.

**Produto**:
Oferta construída sobre a plataforma, declarada como uma composição: que
módulos ativa, que perfis regulatórios aplica, que identidade visual usa.
**CoopCentral** é o primeiro. Não é código.
_Evitar_: aplicação, solução, app.

**Catálogo**:
Onde os módulos são publicados. Não pertence à plataforma nem a um produto.
_Evitar_: registro, biblioteca, marketplace.

**Módulo**:
Unidade vertical de domínio (social, fintech, ERP, chat), publicada no catálogo
e ativada por um ou mais produtos. Ver
[Contratos](contextos/contratos/CONTEXT.md).
_Evitar_: aplicação, vertical, app.
