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

export interface ThemeJSON {
  theme: {
    name: { value: string; type: string };
    scheme: { value: string; type: string };
    [key: string]: any;
  };
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
function resolveTokenValue(valStr: string, dict: Record<string, any>): string {
  let resolved = String(valStr);
  const regex = /\{([^}]+)\}/g;
  
  let iterations = 0;
  // Prevent infinite loops in case of circular references
  while (regex.test(resolved) && iterations < 10) {
    // Reset regex index because test() modifies it
    regex.lastIndex = 0;
    resolved = resolved.replace(regex, (placeholder, path) => {
      const parts = path.split('.');
      let current = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          console.warn(`Could not resolve token reference: ${placeholder} at ${path}`);
          return placeholder;
        }
      }
      return typeof current === 'string' || typeof current === 'number'
        ? String(current)
        : placeholder;
    });
    iterations++;
  }
  return resolved;
}

/**
 * Mimics Style Dictionary's size/px transform, adding 'px' to unitless numbers for specific token types.
 */
function transformValue(value: string, type: string): string {
  const v = String(value);
  const sizeTypes = ['spacing', 'sizing', 'borderRadius', 'borderWidth', 'fontSizes'];
  
  if (sizeTypes.includes(type)) {
    if (v.endsWith('px') || v.endsWith('rem') || v.endsWith('em') || v === '0' || v.endsWith('%')) {
      return v;
    }
    if (!isNaN(parseFloat(v))) {
      return `${parseFloat(v)}px`;
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
export function compileThemeToCSS(themeJson: any, targetSelector = ':root'): string {
  const tJson = themeJson.theme ? themeJson : { theme: themeJson };
  
  // 1. Build the merged dictionary for reference resolution
  const mergedDict = {
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
    theme: tJson.theme,
    component: semanticComponents.component,
    focusRing: semanticComponents.focusRing,
  };

  const variables: Record<string, string> = {};

  // 2. Traversal helper to locate and resolve all leaf tokens
  function traverse(obj: any, path: string[]) {
    if (!obj || typeof obj !== 'object') return;
    
    // If it's a leaf token (has a value property that is a string/number)
    if ('value' in obj && obj.value !== undefined && typeof obj.value !== 'object') {
      const topParent = path[0];
      // Only compile theme-dependent, component, and focus ring custom properties
      if (['theme', 'component', 'focusRing'].includes(topParent)) {
        // Exclude typography style objects
        if (obj.type !== 'typography') {
          const rawValue = obj.value;
          const resolvedValue = resolveTokenValue(rawValue, mergedDict);
          const transformedValue = transformValue(resolvedValue, obj.type);
          const varName = pathToVariable(path);
          variables[varName] = transformedValue;
        }
      }
      return;
    }

    for (const key of Object.keys(obj)) {
      traverse(obj[key], [...path, key]);
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
