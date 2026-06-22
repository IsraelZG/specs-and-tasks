import { describe, it, expect } from 'vitest';
import {
  compileScopedOverrides,
  overridesToStyleObject,
  type ThemeOverrideMap,
} from '../src/lib/themeEngine';
import { isValidOverrideKey } from '../src/lib/themeOverrideKeys';

describe('compileScopedOverrides', () => {
  // Case 1: Scoped CSS module
  it('1. gera CSS com seletor [data-ds-module] e variavel theme', () => {
    const css = compileScopedOverrides(
      { 'theme.intent.primary.fill': '#333' },
      'module',
      'chat',
    );
    expect(css).toContain('[data-ds-module="chat"]');
    expect(css).toContain('--ds-theme-intent-primary-fill');
    expect(css).toContain('#333');
  });

  // Case 2: Scoped CSS page
  it('2. gera CSS com seletor [data-ds-page] e variavel component', () => {
    const css = compileScopedOverrides(
      { 'card.radius': '8px' },
      'page',
      'settings',
    );
    expect(css).toContain('[data-ds-page="settings"]');
    expect(css).toContain('--ds-component-card-radius');
    expect(css).toContain('8px');
  });

  // Case 3: Reference resolution
  it('3. referencia {theme.xxx} e {component.xxx} viram var(--ds-theme-xxx) e var(--ds-component-xxx)', () => {
    const css = compileScopedOverrides(
      {
        'button.primary.bg': '{theme.intent.primary.fill}',
        'button.primary.radius': '{component.card.radius}',
      },
      'module',
      'x',
    );
    expect(css).toContain('--ds-component-button-primary-bg');
    expect(css).toContain('var(--ds-theme-intent-primary-fill)');
    expect(css).toContain('--ds-component-button-primary-radius');
    expect(css).toContain('var(--ds-component-card-radius)');
    expect(css).not.toContain('{theme.intent.primary.fill}');
    expect(css).not.toContain('{component.card.radius}');
    expect(css).not.toContain('--ds-component-component-card-radius');
  });

  // Case 8: Empty overrides
  it('8. overrides vazio gera bloco CSS valido (vazio)', () => {
    const css = compileScopedOverrides({}, 'module', 'x');
    expect(typeof css).toBe('string');
    expect(css).toContain('[data-ds-module="x"]');
  });

  // Case 9: Multiple overrides
  it('9. múltiplos overrides — todos no bloco CSS', () => {
    const css = compileScopedOverrides(
      {
        'theme.surface.default': '#fff',
        'theme.content.default': '#000',
        'card.radius': '12px',
      },
      'page',
      'home',
    );
    expect(css).toContain('--ds-theme-surface-default');
    expect(css).toContain('--ds-theme-content-default');
    expect(css).toContain('--ds-component-card-radius');
  });

  // Case 10: No XSS
  it('10. valor com script tag não escapa para o CSS de forma perigosa', () => {
    const css = compileScopedOverrides(
      { 'theme.surface.default': '</style><script>alert("xss")</script>' },
      'module',
      'x',
    );
    // The CSS variable value should not contain unescaped HTML tags
    // Vitest/JSDOM would parse the CSS; the key assertion is that the output is
    // still structurally valid CSS (no unescaped </style> breaking out).
    expect(css).toContain('[data-ds-module="x"]');
    expect(css).toContain('--ds-theme-surface-default');
    // The raw value may appear (CSS vars can hold arbitrary strings), but it
    // must not close the style block prematurely.
    expect(css.indexOf('</style>')).toBe(-1);
  });
});

describe('overridesToStyleObject', () => {
  // Case 4: Inline style object
  it('4. mapeia flat key → --ds-component', () => {
    const obj = overridesToStyleObject({ 'button.primary.bg': '#333' });
    expect(obj).toEqual({ '--ds-component-button-primary-bg': '#333' });
    // Should NOT contain the original flat key
    expect(obj['button.primary.bg']).toBeUndefined();
  });

  // Case 5: Kebab conversion
  it('5. camelCase é convertido para kebab-case na variavel CSS', () => {
    const obj = overridesToStyleObject({
      'theme.intent.primary.fillHover': 'red',
    });
    expect(obj).toHaveProperty('--ds-theme-intent-primary-fill-hover');
    expect(obj['--ds-theme-intent-primary-fill-hover']).toBe('red');
  });
});

describe('isValidOverrideKey', () => {
  // Case 6: Valid key
  it('6. chave theme.intent.primary.fill é valida', () => {
    // The canonical key set is derived from tokens — this key should exist.
    expect(isValidOverrideKey('theme.intent.primary.fill')).toBe(true);
  });

  // Case 7: Invalid key
  it('7. chave garbage.x é invalida', () => {
    expect(isValidOverrideKey('garbage.x')).toBe(false);
  });
});