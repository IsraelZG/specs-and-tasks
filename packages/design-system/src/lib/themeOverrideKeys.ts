import defaultLightTheme from '../../tokens/themes/light/theme.json';
import semanticComponents from '../../tokens/semantic/components.json';

/**
 * Recursively collects flat key paths from a token tree.
 * "theme.surface.default" for { theme: { surface: { default: { value, type } } } }
 */
function collectKeys(
  node: unknown,
  prefix: string,
  keys: Set<string>,
): void {
  if (node === null || node === undefined) return;
  if (typeof node !== 'object') return;

  const obj = node as Record<string, unknown>;

  // Leaf token detection: has 'value' and 'type' (skip _comment strings)
  if (typeof obj['value'] === 'string' && typeof obj['type'] === 'string') {
    keys.add(prefix);
    return;
  }

  for (const key of Object.keys(obj)) {
    // Skip metadata/comments
    if (key.startsWith('_')) continue;
    const childPrefix = prefix ? `${prefix}.${key}` : key;
    collectKeys(obj[key], childPrefix, keys);
  }
}

function buildValidKeys(): ReadonlySet<string> {
  const keys = new Set<string>();

  // Theme-level keys (from light theme)
  const theme = (defaultLightTheme as Record<string, unknown>)['theme'];
  if (theme && typeof theme === 'object') {
    collectKeys(theme, 'theme', keys);
  }

  // Component-level keys (from semantic components)
  const comp = (semanticComponents as Record<string, unknown>)['component'];
  if (comp && typeof comp === 'object') {
    collectKeys(comp, '', keys);
  }

  return keys;
}

/** Conjunto canônico de chaves de override válidas.
 *  Derivado de caderno-3-sdk/09 §5 "dicionário canônico". */
export const VALID_OVERRIDE_KEYS: ReadonlySet<string> = buildValidKeys();

/** Valida se uma chave pertence ao dicionário canônico.
 *  Derivado de caderno-3-sdk/09 §5 "chave não documentada gera erro". */
export function isValidOverrideKey(key: string): boolean {
  return VALID_OVERRIDE_KEYS.has(key);
}