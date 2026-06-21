import { default as defaultLightTheme } from '../../tokens/themes/light/theme.json';
import { default as defaultDarkTheme } from '../../tokens/themes/dark/theme.json';
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
export type TokenNode = string | {
    [key: string]: TokenNode;
};
export interface ThemeJSON {
    theme: {
        [key: string]: TokenNode;
    };
}
/**
 * Compiles a full theme JSON structure into resolved CSS custom properties.
 *
 * @param themeJson The theme JSON containing primitives (e.g. theme.surface.canvas, etc.)
 * @param targetSelector The CSS selector target (default: ':root')
 */
export declare function compileThemeToCSS(themeJson: {
    [key: string]: TokenNode;
}, targetSelector?: string): string;
