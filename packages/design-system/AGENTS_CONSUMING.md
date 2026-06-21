# Consuming the Design System (AI Agent Guide)

This guide provides instructions for AI agents and developers integrating `@your-app/design-system` into external applications (e.g. `Projeto Superapp` or other products). Use this file as context when generating UI components, styles, or white-label theme engines.

---

## 1. Installation & Imports

### Installing the Package
Add the package to the target project's `dependencies`. In local dev environment, refer directly to the sibling folder:
```json
"dependencies": {
  "@your-app/design-system": "file:../design-system/design-system"
}
```

### Staging Styles & CSS Assets
To load layout resets, tailwind directives, typography, and standard tokens, import the stylesheet at the top of your React app entrypoint (e.g. `main.tsx` or `index.css`):
```typescript
import '@your-app/design-system/build/react/index.css';
```
*(Optional)* If you need base themes as static fallbacks without compilation:
```typescript
import '@your-app/design-system/theme-light.css';
import '@your-app/design-system/theme-dark.css';
```

---

## 2. Using React Components

Exported components (such as `Button`, `Card`, `Input`, `Message`, `Avatar`, `Badge`, `Modal`, `Alert`, `Checkbox`) are typed and ready.

```typescript
import { Button, Card, Input, FormField } from '@your-app/design-system';

export default function LoginForm() {
  return (
    <Card className="max-w-md mx-auto p-6">
      <FormField label="Email Address">
        <Input type="email" placeholder="you@domain.com" />
      </FormField>
      <Button variant="primary" size="md" className="w-full mt-4">
        Log In
      </Button>
    </Card>
  );
}
```

---

## 3. Dynamic Theming Engine (White-Label)

The package exports a runtime compiler and default themes to support real-time dynamic styling overrides (e.g., client branding, dark mode toggle, or VSCode-style live customize editors).

### Key Exports
- `compileThemeToCSS(themeJson: any, targetSelector?: string): string` — Compiles a theme JSON to CSS custom properties.
- `defaultLightTheme` — The raw base JSON structure for the Light theme.
- `defaultDarkTheme` — The raw base JSON structure for the Dark theme.

### Implementation Pattern for AI Agents

To implement white-label custom themes dynamically on the client, follow this exact boilerplate:

```typescript
import { compileThemeToCSS, defaultLightTheme, type ThemeJSON } from '@your-app/design-system';

/**
 * Deep merges a custom partial theme with the base theme parameters.
 * Crucial to avoid missing semantic tokens and rendering warnings.
 */
function mergeDeep(target: any, source: any): any {
  const output = { ...target };
  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object') {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

/**
 * Compiles and injects custom theme overrides into the page.
 * @param customOverrides A partial theme object matching theme.json primitives
 * @param isDark If the base theme should be dark or light
 */
export function applyWhiteLabelTheme(customOverrides: Record<string, any>, isDark = false) {
  // 1. Pick default base theme
  const baseTheme = isDark ? defaultDarkTheme : defaultLightTheme;

  // 2. Perform deep merge to safeguard all token keys
  const mergedThemeData = mergeDeep(JSON.parse(JSON.stringify(baseTheme.theme)), customOverrides);
  
  const fullThemeJson: ThemeJSON = {
    theme: {
      ...mergedThemeData,
      name: { value: 'WhiteLabelTheme', type: 'other' },
      scheme: { value: isDark ? 'dark' : 'light', type: 'other' }
    }
  };

  // 3. Compile merged theme JSON to CSS variables targeting a specific data-theme
  const cssVariables = compileThemeToCSS(fullThemeJson, ':root[data-theme="custom"]');

  // 4. Inject or update the <style> node in document head
  let styleEl = document.getElementById('ds-custom-theme-sheet');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'ds-custom-theme-sheet';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = cssVariables;

  // 5. Activate the theme
  document.documentElement.setAttribute('data-theme', 'custom');
}
```

### JSON Schema for Theme Customizations
When supplying the `customOverrides` object, construct it following the Style Dictionary primitives layout:

```json
{
  "surface": {
    "canvas": { "value": "#ebf5ff", "type": "color" }
  },
  "intent": {
    "primary": {
      "fill": { "value": "#1e3a8a", "type": "color" },
      "fillHover": { "value": "#172554", "type": "color" }
    }
  }
}
```

---

## 4. Key Rules for Code Generators

- **Never Hardcode Primitives**: When generating styles in consumer projects, reference CSS variables (e.g. `var(--ds-component-button-primary-bg)`) rather than raw hex/RGB values. This preserves theme switching capability.
- **Safeguard References**: When editing values directly in theme JSONs, a value can be a raw color (`#1e3a8a`) or a path reference (`{color.neutral.50.value}`). The compilation engine handles both correctly, but deep merging is mandatory to avoid breaking references to unsupplied intent states.
- **Target data-theme Attribute**: Component variables depend on CSS variables mapped to HTML element scopes. Ensure your routing/context hooks toggle `document.documentElement.setAttribute('data-theme', 'custom' | 'light' | 'dark')` correctly.
