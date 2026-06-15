# RFC-006 — Design System Canônico
> **Status:** Proposta
> **Precedência:** estende `caderno-3-sdk/03-engines-and-spec-driven-ui.md` e `caderno-3-sdk/04-theme-and-i18n-data-structures.md`; estende `caderno-4-governance/02-module-architecture-and-code-splitting.md` §1 (`core/design-system`). Onde não tocada, a doc vigente prevalece. Recupera e formaliza o trabalho do design system token-based (Style Dictionary + camada de metadados AI-ready) produzido fora do wiki.

## A.1 — Arquitetura de tokens em três camadas

**Resolve:** o monorepo prevê `core/design-system` ("componentes shadcn-based + tokens") e o caderno-3/04 define `CONTENT:THEME`, mas não existe documento canônico declarando o contrato de tokens que componentes consomem e que temas sobrescrevem. Sem esse contrato, "spec declara estrutura, tema declara estilo" não tem vocabulário comum.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/10-design-system.md` | novo | Criar documento canônico com §1 (este texto) |
| `docs/conceitos/design-token.md` | novo verbete | Definição canônica + link para caderno-3/22 |
| `caderno-3-sdk/04-theme-and-i18n-data-structures.md` | §Temas | Editar: `CONTENT:THEME` sobrescreve a **camada de tema**, nunca a semântica diretamente; linkar [[design-token]] |

**Texto normativo:**

A plataforma adota arquitetura de tokens em três camadas, compilada por **Style Dictionary** para todos os formatos de distribuição (CSS custom properties, JS/TS, React Native, iOS Swift, Android XML, variante TV):

1. **Global (primitivos)** — valores brutos sem semântica: escalas de cor (`neutral`, `lavender`, `blush`, `sage`, `amber`, `coral`, `ocean`), escala dimensional base-4px (spacing, sizing, radius, borderWidth), tipografia (famílias General Sans / Inter / JetBrains Mono; escalas de tamanho/peso/leading), tokens de motion (durações, easings). Imutáveis por tema.
2. **Tema** — mapeamento semântico de primitivos por contexto visual: `light`, `dark` e quaisquer temas white-label. É a **única camada que `CONTENT:THEME` pode sobrescrever** (injeção dinâmica de CSS custom properties conforme caderno-3/04). Um tema é, portanto, *dados do grafo redefinindo a camada de tema do contrato de tokens* — nada além disso.
3. **Semântica (componentes)** — tokens consumidos pelos componentes (`button.primary.background`, `card.padding`, …), referenciando exclusivamente a camada de tema. Componentes **nunca** consomem primitivos diretamente nem valores literais.

**Densidade** é dimensão ortogonal ao tema: modos `compact | cozy | tv` sobrescrevem as mesmas variáveis dimensionais que os componentes já consomem (não criam variáveis paralelas), com seletores de especificidade superior aos seletores de tema (`:root[data-theme][data-density]`). Lição registrada do protótipo: densidade que gera variáveis órfãs não tem efeito.

Os componentes são shadcn-based, mas o vínculo com Tailwind é mediado: **Style Dictionary é a fonte única** das variáveis, exportadas como CSS custom properties; o `tailwind.config.js` (quando presente) **referencia** essas custom properties e nunca declara valores literais. Componentes nunca dependem de utilitários Tailwind com valores embutidos.

**Invariantes:**
- I1. Componente consome só camada semântica; camada semântica referencia só camada de tema; camada de tema referencia só primitivos.
- I2. `CONTENT:THEME` sobrescreve só a camada de tema. Acessibilidade do usuário (fonte ampliada, contraste, redução de movimento) prevalece sobre qualquer tema forçado (reafirma caderno-3/03 §4).
- I3. Nenhum módulo declara cor/fonte/dimensão literal. Lint de CI bloqueia.
- I4. Se um `CONTENT:THEME` injetado omitir tokens da camada de tema, a resolução faz fallback silencioso e determinístico para a raiz do tema `light` do core — nenhum token semântico fica não resolvido em runtime. (Acessibilidade do usuário, I2, ainda prevalece sobre o tema resolvido.)

## A.2 — Catálogo de componentes e contrato componente ↔ engine ↔ módulo

**Resolve:** as engines do caderno-3/03 são polimórficas, mas não está declarado de que blocos visuais elas se compõem nem o que um módulo pode importar de onde.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/10-design-system.md` | §2 | Adicionar |
| `caderno-3-sdk/03-engines-and-spec-driven-ui.md` | §1 | Editar: adicionar a camada "componentes do design system" abaixo das engines no Padrão A |

**Texto normativo:**

Hierarquia de composição (estrita, sem atalhos):

```
módulo (wrapper nomeado)
  └─ engine genérica (core/engines)
       └─ componentes do design system (core/design-system)
            └─ tokens semânticos
```

- **Componentes** são shadcn-based, sem regra de negócio, identificados por nome estável no catálogo. Conjunto piloto já autorado: `Button`, `Input`, `Card`, `Message`, `NavItem`, `Toast`; o catálogo cresce pelo fluxo de autoria do A.3.
- **Engines** compõem componentes e expõem slots/renderers; **módulos** compõem engines via wrappers e jamais importam primitivos visuais por fora do design system.
- Os `ui_hints` de uma `SPECIFICATION` referenciam **slots semânticos de engines** (ex.: slots do `SuperCard`) e, quando precisarem nomear um bloco visual, usam o **nome de catálogo do componente** — nunca classes CSS ou estilos.

## A.3 — Camada de metadados AI-ready e fluxo de autoria

**Resolve:** o design system é também insumo de agentes (geração de UI spec-driven, validação de CI). O protótipo já definiu schema de metadados e fluxo de autoria; precisa virar contrato canônico.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/10-design-system.md` | §3 | Adicionar |
| `docs/conceitos/catalogo-de-componentes.md` | novo verbete | Definir catálogo + índice de descoberta |

**Texto normativo:**

Cada componente publica um arquivo de metadados conforme o schema TypeScript canônico (`ComponentIdentity`, `Usage`, `AntiPatterns`, `Variants`, `Composition`, `Behavior`, `Props`, `TokenUsage`, `Accessibility`, `AIHints`). Um índice leve auto-gerado (`components.index.json`) serve à descoberta; metadados completos carregam sob demanda. Cada `ComponentIdentity` carrega marcação de ciclo de vida (`status: stable | deprecated`, `replacedBy?`, `deprecatedSince?`). Componentes `deprecated` permanecem por retrocompatibilidade mas são excluídos das `AIHints` de descoberta para geração — agentes não os propõem para telas novas. Princípio de autoria: **"token layer leads, metadata follows"** — primeiro os tokens semânticos do componente, depois implementação, depois metadados. O fluxo de autoria de 12 passos (`docs/AUTHORING.md` do pacote) e a validação de CI (drift de schema, tokens mal classificados, anti-patterns malformados) são obrigatórios para entrada no catálogo.

## A.4 — Fronteira spec / tema / token (regra de ouro)

**Resolve:** consolidar em um único enunciado a divisão de responsabilidades hoje espalhada entre caderno-3/03 §3 e caderno-3/04.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `caderno-3-sdk/10-design-system.md` | §4 | Adicionar |
| `caderno-3-sdk/03-engines-and-spec-driven-ui.md` | §3 | Editar: linkar caderno-3/22 §4 como enunciado canônico |

**Texto normativo:**

> **SPECIFICATION declara estrutura** (quais campos, em quais slots, quais ações). **Tema declara estilo** (valores da camada de tema). **Tokens são o vocabulário** que torna as duas declarações independentes. Nenhuma das três camadas invade a outra; qualquer necessidade que pareça exigir invasão é, por definição, um componente ou slot faltante no catálogo — e segue o fluxo A.3.

## A.5 — Importação do pacote existente

**Resolve:** os artefatos do protótipo (tokens JSON, `style-dictionary.config.js`, showcase HTML, schema de metadados, 6 componentes-piloto, scripts de CI) existem fora do monorepo e precisam entrar em `core/design-system` como tarefa de implementação, não como documentação.

**Onde integrar:**

| Arquivo | Seção | Ação |
| :--- | :--- | :--- |
| `docs/plano-de-implementacao.md` | marco a definir (preparativos de módulos) | Adicionar tarefas: T-DS-01 importar pacote de tokens + build multi-plataforma; T-DS-02 importar schema de metadados + índice + CI; T-DS-03 portar componentes-piloto para `core/design-system` consumindo tokens semânticos; T-DS-04 lint anti-literal (I3) |

**Texto normativo:** as quatro tarefas acima seguem o DoD "UI da Bancada" (§0.2 do plano) onde aplicável; T-DS-01/02 seguem DoD "Protocolo/core" (build determinístico + tipos exportados).
