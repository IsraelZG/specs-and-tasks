import { default as defaultLightTheme } from '../../tokens/themes/light/theme.json';
import { default as defaultDarkTheme } from '../../tokens/themes/dark/theme.json';
export { defaultLightTheme, defaultDarkTheme };
export interface ThemeTokenValue {
    value: string;
    type: string;
}
export interface ThemeJSON {
    theme: {
        name: {
            value: string;
            type: string;
        };
        scheme: {
            value: string;
            type: string;
        };
        [key: string]: any;
    };
}
/**
 * Compiles a full theme JSON structure into resolved CSS custom properties.
 *
 * @param themeJson The theme JSON containing primitives (e.g. theme.surface.canvas, etc.)
 * @param targetSelector The CSS selector target (default: ':root')
 */
export declare function compileThemeToCSS(themeJson: any, targetSelector?: string): string;
