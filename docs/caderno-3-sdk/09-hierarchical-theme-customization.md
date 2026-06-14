# 09-hierarchical-theme-customization.md — Customização de Tema em Múltiplos Níveis

Este documento especifica a arquitetura e o funcionamento da personalização de design em múltiplos níveis (App, Módulo, Página, Componente). O objetivo é garantir um modelo escalável que permita ajustes amplos (ex: marca white-label global) e sobreposições cirúrgicas (ex: cor específica de um botão), reaproveitando a arquitetura de tokens gerida por Style Dictionary.

---

## 1. Níveis de Escopo e Invariante de Aninhamento DOM

A hierarquia de customização permite que valores de tokens variem com base no contexto em que são exibidos, não existindo uma resolução imperativa (JS) para essa herança; a plataforma utiliza os recursos nativos do CSS, especificamente variáveis customizadas (`--ds-*`) e herança em cascata.

Cada nível substitui ou define variáveis `--ds-*` através de um atributo de dados associado a um elemento de envoltório (wrapper) no HTML:

- **App:** Definido globalmente (`<html data-theme="custom">`).
- **Módulo:** `<div data-ds-module="<id>">`
- **Página:** `<main data-ds-page="<id>">`
- **Componente/Instância:** `<button data-ds-component="<id>" style="...override inline...">`

### Invariante de Resolução (Regra de Ouro)

A hierarquia de sobreposição **não se baseia em especificidade de seletores CSS** (uma vez que `[data-ds-module]` e `[data-ds-page]` possuem especificidade idêntica), mas sim na **proximidade no DOM**. Uma *custom property* herda o valor do ancestral mais próximo que a redefiniu.

**Invariante:** Cada nível DEVE consistir em um elemento descendente estrito do nível superior. É proibido aplicar atributos de dois níveis no mesmo elemento.

```html
<html data-theme="custom">                         <!-- Nível 1: App (tema base) -->
  <div data-ds-module="chat">                       <!-- Nível 2: Módulo (herda do App, sobrepõe se necessário) -->
    <main data-ds-page="settings">                  <!-- Nível 3: Página (herda do Módulo, sobrepõe) -->
      <button data-ds-component="cta" style="…">    <!-- Nível 4: Instância (override cirúrgico inline) -->
```

Sob esse modelo, a cascata garante a precedência de forma automática: Componente > Página > Módulo > App.

---

## 2. Propagação de Referências na Compilação (`outputReferences: true`)

Para que a redefinição de uma cor de tema num escopo mais alto propague automaticamente para todos os seus componentes, as variáveis de componente **devem manter suas cadeias de referência em CSS**, em vez de serem resolvidas ou achatadas durante o build.

A compilação do design system utiliza a flag `outputReferences: true`. Isso garante a emissão de código com cadeias ininterruptas, por exemplo:

```css
/* Correto: A cadeia de referência é preservada */
--ds-component-button-primary-bg: var(--ds-theme-intent-primary-fill);
--ds-theme-intent-primary-fill: var(--ds-color-ocean-500);
```

**Impacto:** Redefinir `--ds-theme-intent-primary-fill` em um nó superior altera implicitamente todo elemento dentro do sub-DOM correspondente que referencie a variável `intent.primary.fill`. Essa característica viabiliza *overrides ergonomicamente concisos*, prevenindo que um desenvolvedor necessite editar cada variável subjacente no escopo.

---

## 3. Direcionamento do Escopo de Override (Tema vs. Componente)

Quando um override de escopo é configurado, ele deve focar em uma de duas camadas de tokens disponíveis:

| Alvo de Override | Recomendação de Uso | Comportamento Propagado |
| :--- | :--- | :--- |
| **Camada de Tema** (`theme.*`, ex: `theme.intent.primary.fill`) | Mudanças abrangentes de **marca/identidade** (Ex: módulo/página inteira). | Graças a `outputReferences`, repinta coordenadamente todos os componentes do sub-DOM que dependerem deste intent. |
| **Camada de Componente** (`component.*`, ex: `card.radius`, `button.primary.bg`) | Mudanças **cirúrgicas** em um tipo de componente específico, para fins de distinção (ex: botões num módulo específico podem ter aparência de pílula em vez de quadrados). | Fica restrito apenas aos usos desse tipo exato de token. Isola totalmente os demais componentes do layout de impactos laterais. |

**Boa Prática de Autoria:** Como convenção de governança da UI, encoraja-se overrides na camada de Tema (`theme.*`) para customizações nos níveis de Página e Módulo. Utilizações de redefinição na camada do componente devem ser pontuais e documentadas formalmente como exceções lógicas.

---

## 4. O Mecanismo de Aplicação e Renderização de Estilos

Dado que a plataforma tem variados limiares de frequência e dinamismo para cada override, a injeção mecânica diverge para preservar a estabilidade da UI:

| Nível de Escopo | Cardinalidade/Mudança | Modelo de Injeção no DOM | Justificativa |
| :--- | :--- | :--- | :--- |
| **App** | Único, estável | `<style>` injetada para `:root[data-theme="…"]` | Equivalente à injeção convencional da aplicação base. |
| **Módulo** | Poucos, de estado durável | Bloco global `<style>` com regras geradas para `[data-ds-module="x"] { … }` | Mantém os overrides isolados à instância; excelente para caching sem quebrar blocos CSS estruturais. |
| **Página** | Poucas instâncias por vez | Bloco global `<style>` com regras geradas para `[data-ds-page="x"] { … }` | Idem a Módulos, evita sobrecarga de inlines. |
| **Componente/Instância** | Variados, altamente efêmeros | Atributo `style={{ '--ds-...': valor }}` diretamente na tag React (inline). | Não sobrecarrega com re-renderações ou tags dinâmicas o DOM global (zero churn do stylesheet document). Resolvida localmente garantindo especificidade total sobre ancestrais. |

---

## 5. Formato de Declaração do Override (Chave Achatada)

Um nó que declare `ui_hints.theme_overrides` utiliza chaves achatadas (no estilo JSON do VS Code settings). A estrutura padroniza que qualquer custom property seja descrita sem aninhamentos complexos e com suporte explícito a referências baseadas em blocos nominais.

```jsonc
{
  // Exemplo na camada de Tema:
  "theme.intent.primary.fill":      "#7c3aed",
  "theme.intent.primary.fillHover": "#6d28d9",

  // Exemplo na camada de Componente:
  "card.radius":                    "8px",
  "button.primary.bg":              "{theme.intent.primary.fill}"  // Referência resolvida dinamicamente
}
```

### Regras de Resolução:
O mapeamento em runtime segue heurísticas da própria plataforma (via utilitários como `toKebabCase` e `pathToVariable` extraídos do `themeEngine`):
- O token prefixado com `theme.` gera a variável correspondente: `--ds-theme-...` (ex: `--ds-theme-intent-primary-fill`).
- Qualquer chave que omita o prefixo é implicitamente reconhecida como pertencente à camada semântica e gera: `--ds-component-...` (ex: `card.radius` converte-se para `--ds-component-card-radius`).
- Referências encadeadas `{theme...}` são traduzidas para `var(--ds-...)`. Literais permanecem literais.
- Referências e chaves são atestadas pelo dicionário canônico e autogerado da plataforma (`themeOverrideKeys.ts`). A inserção de uma variável não documentada gera erro no processamento.

---

## 6. Lints de Contraste e Acessibilidade (Resolução Offline vs. Runtime)

Na plataforma, qualquer ajuste em cores impacta os padrões globais de legibilidade estabelecidos pelo WCAG 2.1 nível AA.

Dadas as propriedades flexíveis da cascata (uma página poderia mudar o background, mas o módulo acima já mudou o texto), seria impossível e custoso fazer o portão bloqueante em runtime. Por isso:

- **Autoria e Integração Contínua (CI):** Scripts de lint calculam de forma prospectiva, resolvendo via ferramentas de DOM-headless (ex: jsdom) os pares de bg/text do escopo, bloqueando caso os padrões não sejam atendidos (mínimo de `4.5:1` para texto base e `3:1` para maiores). As regras aplicadas encontram-se descritas sob as conformidades de [caderno-3-sdk/04 §1.2](./04-theme-and-i18n-data-structures.md).
- **Runtime Local:** A aplicação nunca falha na interface final pela presença de cores de baixo contraste. No ambiente de desenvolvimento, avisa-se pontualmente no console da interface (`console.warn`) caso detectada falha. É prerrogativa última do usuário forçar configurações de superação de contraste ou esquemas locais no browser (ignorando o que a governança definir).
