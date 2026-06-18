# 10-design-system.md — Design System Canônico

> Fonte: RFC-006 §A.1–§A.5 (absorvida e deletada). Documento canônico que estabelece o contrato de tokens, catálogo de componentes, fluxo de autoria e fronteira spec/tema/token.

---

## §1 — Arquitetura de tokens em três camadas

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

---

## §2 — Catálogo de componentes e contrato componente ↔ engine ↔ módulo

Hierarquia de composição (estrita, sem atalhos):

```
módulo (wrapper nomeado)
  └─ engine genérica (core/engines)
       └─ componentes do design system (core/design-system)
            └─ tokens semânticos
```

- **Componentes** são shadcn-based, sem regra de negócio, identificados por nome estável no catálogo. Conjunto piloto já autorado: `Button`, `Input`, `Card`, `Message`, `NavItem`, `Toast`; o catálogo cresce pelo fluxo de autoria do §3.
- **Espectro de Componentes e Confiança:** componentes referenciáveis por páginas vivem num espectro:
  1. **First-party (catálogo, RFC-006):** compilado com o app, auditado, confiável. Inclui componentes ricos centrais (planilha, charts, player, e o componente `GameEngine`).
  2. **`ui` plugin de terceiro (RFC-024 / [[caderno-3-sdk/26-plugins-frontend]]):** código opaco de terceiro, distribuído por marketplace, isolado em iframe sandbox (ou Worker+OffscreenCanvas) com rate-limit, bridge tipada, rate-limit anti-flood e sem canal lateral.
  Ambos são referenciados pela mesma sintaxe (nome no catálogo) no documento de página, ocultando o isolamento do autor da página.
- **Componente Rico `GameEngine`:** motor de jogos 2D/3D data-driven (baseado em engines opensource como Phaser/PixiJS/three.js/Babylon). Cenas, entidades, regras e níveis são especificados via dados + ZEN; o loop pesado roda nativamente no componente. Ele expõe pontos de customização ZEN e emite intents (pontuação, compras in-game) pelo canal normal.
- **Engines** compõem componentes e expõem slots/renderers; **módulos** compõem engines via wrappers e jamais importam primitivos visuais por fora do design system.
- Os `ui_hints` de uma `SPECIFICATION` referenciam **slots semânticos de engines** (ex.: slots do `SuperCard`) e, quando precisarem nomear um bloco visual, usam o **nome de catálogo do componente** — nunca classes CSS ou estilos.

---

## §3 — Camada de metadados AI-ready e fluxo de autoria

Cada componente publica um arquivo de metadados conforme o schema TypeScript canônico (`ComponentIdentity`, `Usage`, `AntiPatterns`, `Variants`, `Composition`, `Behavior`, `Props`, `TokenUsage`, `Accessibility`, `AIHints`). Um índice leve auto-gerado (`components.index.json`) serve à descoberta; metadados completos carregam sob demanda. Cada `ComponentIdentity` carrega marcação de ciclo de vida (`status: stable | deprecated`, `replacedBy?`, `deprecatedSince?`). Componentes `deprecated` permanecem por retrocompatibilidade mas são excluídos das `AIHints` de descoberta para geração — agentes não os propõem para telas novas. Princípio de autoria: **"token layer leads, metadata follows"** — primeiro os tokens semânticos do componente, depois implementação, depois metadados. O fluxo de autoria de 12 passos (`docs/AUTHORING.md` do pacote) e a validação de CI (drift de schema, tokens mal classificados, anti-patterns malformados) são obrigatórios para entrada no catálogo.

---

## §4 — Fronteira spec / tema / token (regra de ouro)

> **SPECIFICATION declara estrutura** (quais campos, em quais slots, quais ações). **Tema declara estilo** (valores da camada de tema). **Tokens são o vocabulário** que torna as duas declarações independentes. Nenhuma das três camadas invade a outra; qualquer necessidade que pareça exigir invasão é, por definição, um componente ou slot faltante no catálogo — e segue o fluxo A.3.
