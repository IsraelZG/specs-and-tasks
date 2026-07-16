---
name: design-system-ui
description: Build, modify, or review platform UI while preserving the canonical Design System, reusable UI engines, shell boundaries, semantic tokens, and accessibility. Use for any Estaleiro or SuperApp screen, component, engine, layout, or visual review; pair with a named design-theme skill when a new visual style is requested.
---

# Design System UI

1. Read `docs/caderno-3-sdk/10-design-system.md` and `09-hierarchical-theme-customization.md`.
   Read ADR 0016 when the work involves FlowGrid or another UI engine.
2. Classify the change before editing:
   - component without business rule → `@plataforma/design-system`;
   - reusable behavior/composition → `@plataforma/ui-engines`;
   - FlexLayout, workspace lifecycle or panel solver → `@plataforma/shell`;
   - domain store, transport or view composition → consuming app only.
3. Use semantic tokens and catalog components. Do not add literal colors, spacing, typography or
   parallel component APIs. Components consume semantic tokens; themes map semantic tokens; only
   primitive tokens contain raw values.
4. Keep visual style separate from structure. If a request introduces an identity or aesthetic,
   require a named `$design-tema-<slug>` skill. Without one, preserve the existing theme and do
   not invent a new visual language.
5. Scope overrides at App → Module → Page → Instance and prefer `theme.*`; document any
   component-token override as a narrow exception. Keep density separate from theme.
6. Exercise keyboard/focus, loading/error/empty states and a browser-real smoke. Check contrast,
   reduced motion and user accessibility preferences.
7. Report the boundary chosen, reused artifacts, token/theme changes, and any candidate extraction
   for the second consumer.

Read `references/canonical-sources.md` for the source map and `references/theme-contract.md` when
reviewing a named theme.
