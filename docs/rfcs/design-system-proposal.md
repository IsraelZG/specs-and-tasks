# Proposta — Customização de Tema em Múltiplos Níveis (App → Módulo → Página → Componente)

> **Status:** Proposta
> **Precedência:** estende o protótipo do design system (`design-system-stub.txt`) e o caderno-3-sdk (§04, §03). Onde não tocada, a doc vigente prevalece.

Esta proposta especifica como tornar o design system **customizável em quatro níveis de escopo** — aplicação, módulo, página e componente/instância — no espírito do VS Code (tema base + overrides em camadas), reaproveitando a arquitetura de tokens já existente no protótipo.

Substitui a versão anterior desta proposta, que tinha quatro falhas técnicas bloqueantes (referências achatadas no build, hierarquia baseada em especificidade, contraste como gate de runtime, e código no repositório errado). Cada uma é resolvida abaixo.

---

## 1. O que o protótipo já entrega (não reimplementar)

| Capacidade | Onde | Status |
| :--- | :--- | :--- |
| 4 camadas de token (global → tema → semântico → componente) com direção de referência estrita | `tokens/`, `style-dictionary.config.js` | ✅ |
| Compilação para variáveis `--ds-*` e exports multi-plataforma (CSS/JS/RN/iOS/Android) | `style-dictionary.config.js` | ✅ |
| Tematização por atributo (`:root[data-theme="light|dark|custom"]`) — troca nativa pela cascata | `globals.css`, `App.tsx` | ✅ |
| **Override escopado ortogonal já existente** (`data-density`, `data-radius`) — o precedente exato do que queremos generalizar | `docs/density.css` | ✅ |
| Engine de runtime `compileThemeToCSS(themeJson, selector)` que injeta um `<style>` escopado | `src/lib/themeEngine.ts` | ✅ |
| Tema custom injetado em runtime em `:root[data-theme="custom"]` | `showcase/src/App.tsx`, `ThemeEditor.tsx` | ✅ |

**Conclusão da avaliação:** a tematização em **um** nível (global) já funciona e é idiomática. O que falta é **escopar overrides a sub-árvores do DOM** (módulo/página/componente). Isso é uma *generalização* do mecanismo de `data-density`, não uma arquitetura nova.

---

## 2. Decisões de arquitetura

### D1 — Propagação por atributo de dados + herança (mantida, com invariante explícito)

Cada nível redefine variáveis `--ds-*` no escopo de um elemento, via atributo:

```
data-ds-module="<id>"   data-ds-page="<id>"   data-ds-component="<id>"
```

**Invariante de resolução (o ponto que a versão anterior errou):** a hierarquia **não** vem de especificidade de seletor — `[data-ds-module]` e `[data-ds-page]` têm especificidade idêntica `(0,1,0)`. Ela vem da **proximidade no DOM**: uma custom property herda do ancestral *mais próximo* que a define. Portanto:

> **Cada nível DEVE ser um elemento envoltório aninhado dentro do nível acima.** O wrapper de página é descendente do wrapper de módulo, que é descendente do `:root`. Nunca aplique dois níveis no mesmo elemento.

```html
<html data-theme="custom">                         <!-- App: tema base -->
  <div data-ds-module="chat">                       <!-- Módulo herda app, sobrepõe -->
    <main data-ds-page="settings">                  <!-- Página herda módulo, sobrepõe -->
      <button data-ds-component="cta" style="…">    <!-- Instância: override inline -->
```

Com aninhamento garantido, a cascata resolve a precedência **sozinha**, sem JS de runtime e sem cálculo de especificidade. Componente > Página > Módulo > App, por construção.

### D2 — `outputReferences: true` (correção crítica)

Hoje o build (`outputReferences: false`) e o `compileThemeToCSS` **achatam** as referências: o CSS final diz `--ds-component-button-primary-bg: #007acc`, perdendo a ligação com `--ds-theme-intent-primary-fill`. Consequência: **um override na camada de tema não chega aos componentes** — a marca mudaria só se reescrevêssemos cada token de componente um a um.

**Mudança:** preservar as cadeias `var()` para referências entre camadas:

```css
/* antes (achatado — override de tema NÃO propaga) */
--ds-component-button-primary-bg: #007acc;

/* depois (cadeia preservada — override de tema propaga por toda a árvore) */
--ds-component-button-primary-bg: var(--ds-theme-intent-primary-fill);
--ds-theme-intent-primary-fill: var(--ds-color-ocean-500);
```

Assim, redefinir `--ds-theme-intent-primary-fill` num escopo de módulo flui automaticamente para botão, tab, switch, checkbox, nav, message — tudo que referencia `intent.primary.fill`. É isto que torna overrides de nível **ergonômicos** (poucas linhas) em vez de exaustivos (centenas de tokens por escopo).

- No `style-dictionary.config.js`: `options.outputReferences: true` nos builds de tema e semântico.
- No `themeEngine.ts`: o `resolveTokenValue` passa a emitir `var(--ds-…)` para referências `{...}` entre camadas, em vez de resolver ao literal. Primitivos globais continuam literais (são as folhas).

### D3 — Sobrescrever na camada certa: tema (marca) vs componente (cirúrgico)

Um override de escopo pode mirar **duas camadas**:

| Mira | Quando usar | Efeito |
| :--- | :--- | :--- |
| **Tema** (`theme.*`, ex: `intent.primary.fill`) | Mudança de **marca** que deve repintar todo o escopo de forma coerente | Propaga para todos os componentes via D2 |
| **Componente** (`component.*`, ex: `button.primary.bg`, `card.radius`) | Ajuste **cirúrgico** de um componente sem afetar os demais | Afeta só aquele token |

**Regra de autoria:** prefira a camada de tema para módulo/página (mantém coerência e contraste); use a camada de componente só para exceções pontuais. Isto vira lint (ver D7).

### D4 — Mecanismo de aplicação por nível

| Nível | Estabilidade / cardinalidade | Aplicação | Razão |
| :--- | :--- | :--- | :--- |
| App | 1, estável | `<style>` em `:root[data-theme="…"]` (já existe) | igual ao tema custom atual |
| Módulo | poucos, estáveis | regra `<style>` gerada `[data-ds-module="x"] { … }` | escopo estável, cacheável |
| Página | poucos por módulo | regra `<style>` gerada `[data-ds-page="x"] { … }` | idem |
| Componente/instância | muitos, dinâmicos | **`style` inline** `style={{ '--ds-…': v }}` na própria instância | maior proximidade vence; zero churn de stylesheet global; escopo automático |

`<style>` para app/módulo/página (raros e estáveis); **inline** para instâncias de componente (muitas e dinâmicas). Misturar os dois é o que mantém performance e correção.

### D5 — Formato de chave achatada (VS Code-like) e mapeamento

Overrides são declarados como chave→valor achatado, no estilo `settings.json` do VS Code:

```jsonc
{
  // camada de tema (preferido p/ módulo/página)
  "theme.intent.primary.fill":      "#7c3aed",
  "theme.intent.primary.fillHover": "#6d28d9",
  // camada de componente (cirúrgico)
  "card.radius":                    "8px",
  "button.primary.bg":              "{theme.intent.primary.fill}"  // referência permitida
}
```

Regra de mapeamento chave → variável CSS (reaproveita `toKebabCase`/`pathToVariable` do engine):

- chave começando com `theme.` → prefixo `--ds-theme-…`
- qualquer outra chave → assume camada de componente → prefixo `--ds-component-…`
- `card.radius` → `--ds-component-card-radius`; `button.primary.bg` → `--ds-component-button-primary-bg`
- valores podem ser literais **ou** referências `{theme.…}`/`{color.…}` (emitidas como `var()`).

O conjunto de chaves válidas é **gerado** a partir de `tokens/semantic/components.json` + `tokens/themes/*/theme.json` (a mesma travessia do `compileThemeToCSS`), garantindo que um override não invente um token inexistente. Vira um `themeOverrideKeys.ts` autogerado — análogo ao `components.index.json`.

### D6 — Algoritmo de resolução e fallback

Não há "algoritmo" imperativo de resolução — **a cascata CSS é o algoritmo** (essa é a vantagem do design). Em runtime:

1. App injeta o tema base em `:root[data-theme]` (todas as `--ds-*`).
2. Cada wrapper de nível define apenas as `--ds-*` que sobrescreve.
3. Qualquer `--ds-*` não sobrescrita num nível **herda** transparentemente do nível acima (fallback nativo).
4. A instância lê `var(--ds-component-…)`, que resolve pelo ancestral mais próximo.

Fallback de segurança: cada `var()` de componente carrega um default — `var(--ds-component-card-radius, 16px)` — para o caso de a variável não existir (degrada graciosamente em vez de quebrar o layout).

### D7 — Contraste WCAG: lint de autoria, não gate de runtime

A versão anterior propunha validar contraste **em runtime, bloqueando**. Inviável entre níveis: `bg` pode vir do módulo e `text` da página; só dá para checar resolvendo a cascata computada. Em vez disso:

- **Autoria/CI:** lint que, para cada override de cor, resolve o par bg/text *naquele escopo* via `getComputedStyle` num DOM de teste (jsdom/Playwright) e falha se `< 4.5:1` (texto normal) ou `< 3:1` (texto grande/UI). Reaproveita a regra já especificada no upload de temas ([caderno-3-sdk/04 §1.2](../caderno-3-sdk/04-theme-and-i18n-data-structures.md)).
- **Runtime:** apenas um aviso `console.warn` em dev (`import.meta.env.DEV`), nunca bloqueio. O usuário sempre retém o direito de forçar contraste/acessibilidade localmente (já garantido em [04 §3](../caderno-3-sdk/04-theme-and-i18n-data-structures.md)).

### D8 — Onde o código vive (correção de lugar)

- **Engine + contrato `ThemeOverride` + parser de chaves achatadas → repositório do design system** (`design-system/src/lib/themeEngine.ts`, estendido). É runtime do produto, plataforma-agnóstico, e já tem os helpers.
- **Repositório Docs (esta wiki) NÃO recebe código de runtime.** Os `scripts/*.mjs` daqui são ferramentas da wiki (audit-links etc.). A wiki guarda apenas a **especificação** (caderno-3-sdk). Isto resolve a dúvida em aberto da versão anterior: o `themeEngine` **não** vai para `scripts/` do Docs.
- **Binding ao grafo** (`ui_hints.theme_overrides` em nós `SPECIFICATION`) é um *consumidor* do contrato, especificado em caderno-3-sdk, mantendo o engine desacoplado da governança do grafo.

---

## 3. Reconciliação com o spec de tema vigente (caderno-3-sdk/04)

O [§04 atual](../caderno-3-sdk/04-theme-and-i18n-data-structures.md) descreve tokens shadcn em HSL (`background`, `foreground`, `primary`, `radius`) injetados em `:root`. O protótipo usa o vocabulário `--ds-*` de 4 camadas. **São dois vocabulários incompatíveis.** A proposta adota o `--ds-*` (mais expressivo e já implementado) como canônico e trata o vocabulário shadcn do §04 como **legado a migrar**. O §04 deve ser atualizado para: (a) referenciar o vocabulário `--ds-*`; (b) manter o conceito de `CONTENT:THEME` no grafo, agora carregando overrides no formato de chave achatada (D5) em vez do mapa HSL plano.

---

## 4. Mudanças propostas

### 4.1 Documentação (repositório Docs)

| Arquivo | Ação |
| :--- | :--- |
| [NEW] `docs/caderno-3-sdk/09-hierarchical-theme-customization.md` | Especificar: os 4 níveis e o invariante de aninhamento DOM (D1); `outputReferences` e propagação por cadeia `var()` (D2); camadas de override tema vs componente (D3); mecanismo por nível, `<style>` vs inline (D4); formato de chave achatada e mapeamento (D5); resolução por cascata e fallback (D6); contraste como lint (D7). |
| [MODIFY] `docs/caderno-3-sdk/04-theme-and-i18n-data-structures.md` | Migrar vocabulário shadcn/HSL → `--ds-*`; vincular `CONTENT:THEME` (global) aos overrides locais de escopo; trocar mapa HSL plano por chave achatada. |
| [MODIFY] `docs/caderno-3-sdk/03-engines-and-spec-driven-ui.md` | Documentar como `ui_hints.theme_overrides` é declarado num nó `SPECIFICATION` e mapeado, em runtime, para o wrapper `data-ds-{module,page,component}` correspondente. |

### 4.2 Código (repositório do design system — **não** este repo)

| Arquivo | Ação |
| :--- | :--- |
| [MODIFY] `style-dictionary.config.js` | `outputReferences: true` nos builds de tema e semântico (D2). |
| [MODIFY] `src/lib/themeEngine.ts` | (a) emitir `var()` para referências entre camadas em vez de literais; (b) `compileScopedOverrides(overrides: ThemeOverride, selector): string` — bloco `<style>` mínimo só com as chaves sobrescritas; (c) `overridesToStyleObject(overrides): Record<string,string>` — para `style` inline de instância; (d) `flatKeyToVar(key): string`. |
| [NEW] `src/lib/themeOverrideKeys.ts` (autogerado) | Conjunto de chaves achatadas válidas, derivado dos tokens — valida overrides. |
| [NEW] `src/lib/ThemeScope.tsx` (opcional) | Helper React que recebe `level` + `overrides` e renderiza o wrapper com o `data-ds-*` correto e o `<style>`/inline conforme D4. |

---

## 5. Plano de verificação

### Testes automatizados

1. **Propagação por cadeia (`outputReferences`).** Compilar e afirmar que `--ds-component-button-primary-bg` resolve para `var(--ds-theme-intent-primary-fill)`, não para um literal.
2. **Cascata de níveis (o invariante de D1).** Montar `:root` > `[data-ds-module]` > `[data-ds-page]` > instância em jsdom; sobrescrever a mesma chave em níveis diferentes; via `getComputedStyle` afirmar que **o nível mais próximo vence** — incluindo o caso adversário em que módulo e página mirariam a mesma chave (deve vencer a página por aninhamento, não por ordem de origem).
3. **Override de tema propaga; override de componente isola.** Sobrescrever `theme.intent.primary.fill` num módulo → afirmar que botão *e* tab mudam. Sobrescrever `card.radius` → afirmar que só o card muda.
4. **Parser de chave achatada.** `card.radius` → `--ds-component-card-radius`; `theme.intent.primary.fill` → `--ds-theme-intent-primary-fill`; chave inexistente → erro de validação.
5. **Lint de contraste (D7).** Override que reduz contraste abaixo de 4.5:1 → o lint falha; em runtime apenas `console.warn` em dev.
6. **Auditoria de links da wiki:** `node scripts/audit-links.mjs` (specs novas/editadas sem links quebrados).

### Verificação manual

- No showcase, estender o `ThemeEditor` com um seletor de escopo (App/Módulo/Página) e inspecionar visualmente que um override de módulo repinta só aquele módulo, com a página herdando e podendo sobrepor.

---

## 6. Questões em aberto

1. **Migração do §04:** migrar o vocabulário shadcn/HSL para `--ds-*` de uma vez, ou manter um shim de compatibilidade durante a transição?
2. **Persistência no grafo:** overrides de instância de componente (potencialmente muitos) cabem em `ui_hints` de `SPECIFICATION`, ou instâncias devem carregar overrides em dados de `CONTENT` em vez de spec? (afeta validação de governança e replicação).
3. **Limite de `outputReferences: true`:** confirmar que nenhum consumidor depende dos valores literais achatados (ex: leitura de token por script de design); se depender, gerar um segundo build achatado só para esse consumo.
