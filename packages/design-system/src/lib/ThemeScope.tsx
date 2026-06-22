import React from 'react';
import { SCOPE_SELECTORS, type ScopedLevel } from './themeEngine';

/**
 * Wrapper React que aplica atributo data-ds-module ou data-ds-page.
 * Derivado de caderno-3-sdk/09 §1.
 */
export function ThemeScope({
  level,
  scopeId,
  children,
}: {
  level: ScopedLevel;
  scopeId: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const attr = SCOPE_SELECTORS[level];
  return React.createElement('div', { [attr]: scopeId }, children);
}