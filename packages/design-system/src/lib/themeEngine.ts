import globalColor from '../../tokens/global/color.json';
import globalDimension from '../../tokens/global/dimension.json';
import globalMotion from '../../tokens/global/motion.json';
import globalTypography from '../../tokens/global/typography.json';
import semanticComponents from '../../tokens/semantic/components.json';

import defaultLightTheme from '../../tokens/themes/light/theme.json';
import defaultDarkTheme from '../../tokens/themes/dark/theme.json';

export { defaultLightTheme, defaultDarkTheme };

export interface ThemeTokenValue {
  value: string;
  type: string;
}

/**
 * A node in a Style Dictionary-shaped token tree: either a leaf (`{value, type}`),
 * a plain string (e.g. `_comment` fields sprinkled through the token JSON files),
 * or a nested group of further nodes.
 */
export type TokenNode = string | { [key: string]: TokenNode };

export interface ThemeJSON {
  theme: { [key: string]: TokenNode };
}

function isTokenLeaf(node: TokenNode): node is { value: string; type: string } {
  // `TokenNode`'s object branch has no `null` member, so no separate null check is needed here.
  return typeof node === 'object' && typeof node['value'] === 'string';
}

/**
 * Converts a camelCase or snake_case string to kebab-case.
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Formats a token path array into a standard CSS variable name with prefix 'ds'.
 */
function pathToVariable(path: string[]): string {
  const kebabParts = path.map(toKebabCase);
  return `--ds-${kebabParts.join('-')}`;
}

/**
 * Resolves token value references (e.g. `{color.neutral.50.value}`) recursively against a dictionary.
 */
function resolveTokenValue(valStr: string, dict: { [key: string]: TokenNode }): string {
  let resolved = valStr;
  const regex = /\{([^}]+)\}/g;

  let iterations = 0;
  // Prevent infinite loops in case of circular references
  while (regex.test(resolved) && iterations < 10) {
    // Reset regex index because test() modifies it
    regex.lastIndex = 0;
    resolved = resolved.replace(regex, (placeholder: string, path: string) => {
      const parts = path.split('.');
      let current: TokenNode = dict;
      for (const part of parts) {
        if (typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          console.warn(`Could not resolve token reference: ${placeholder} at ${path}`);
          return placeholder;
        }
      }
      return typeof current === 'string' ? current : placeholder;
    });
    iterations++;
  }
  return resolved;
}

/**
 * Mimics Style Dictionary's size/px transform, adding 'px' to unitless numbers for specific token types.
 */
function transformValue(value: string, type: string): string {
  const v = value;
  const sizeTypes = ['spacing', 'sizing', 'borderRadius', 'borderWidth', 'fontSizes'];
  
  if (sizeTypes.includes(type)) {
    if (v.endsWith('px') || v.endsWith('rem') || v.endsWith('em') || v === '0' || v.endsWith('%')) {
      return v;
    }
    if (!isNaN(parseFloat(v))) {
      return `${String(parseFloat(v))}px`;
    }
  }
  return v;
}

/**
 * Compiles a full theme JSON structure into resolved CSS custom properties.
 * 
 * @param themeJson The theme JSON containing primitives (e.g. theme.surface.canvas, etc.)
 * @param targetSelector The CSS selector target (default: ':root')
 */
export function compileThemeToCSS(themeJson: { [key: string]: TokenNode }, targetSelector = ':root'): string {
  const tJson = themeJson['theme'] ? themeJson : { theme: themeJson };

  // 1. Build the merged dictionary for reference resolution
  const mergedDict: { [key: string]: TokenNode } = {
    color: globalColor.color,
    spacing: globalDimension.spacing,
    radius: globalDimension.radius,
    border: globalDimension.border,
    size: globalDimension.size,
    breakpoint: globalDimension.breakpoint,
    zIndex: globalDimension.zIndex,
    motion: globalMotion.motion,
    font: globalTypography.font,
    textStyle: globalTypography.textStyle,
    theme: tJson['theme'],
    component: semanticComponents.component,
    focusRing: semanticComponents.focusRing,
  };

  const variables: Record<string, string> = {};

  // 2. Traversal helper to locate and resolve all leaf tokens
  function traverse(node: TokenNode, path: string[]): void {
    if (typeof node !== 'object') return;

    // If it's a leaf token (has a `value` property that is a string)
    if (isTokenLeaf(node)) {
      const topParent = path[0];
      // Only compile theme-dependent, component, and focus ring custom properties.
      // `noUncheckedIndexedAccess` is off in this package's tsconfig, so TS sees
      // `topParent` as always-defined; it is genuinely undefined when called with `path = []`.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (topParent !== undefined && ['theme', 'component', 'focusRing'].includes(topParent)) {
        // Exclude typography style objects
        if (node.type !== 'typography') {
          const resolvedValue = resolveTokenValue(node.value, mergedDict);
          const transformedValue = transformValue(resolvedValue, node.type);
          const varName = pathToVariable(path);
          variables[varName] = transformedValue;
        }
      }
      return;
    }

    for (const key of Object.keys(node)) {
      traverse(node[key], [...path, key]);
    }
  }

  // Run traversal
  traverse(mergedDict, []);

  // 3. Output as formatted CSS rules
  const cssRules = Object.entries(variables)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, val]) => `  ${name}: ${val};`)
    .join('\n');

  return `${targetSelector} {\n${cssRules}\n}`;
}
