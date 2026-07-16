# Template for `design-tema-<slug>`

Use this as the body of a separate skill after the user approves a named style.

```markdown
---
name: design-tema-<slug>
description: Apply the approved <style name> visual profile to platform UI. Use when designing or reviewing <scope>; always pair with $design-system-ui.
---

# <Style name>

## Direction
- Intended scope: App | Module | Page.
- Character: <three to five concrete adjectives>.
- References approved by the user: <paths/links>.

## Theme-only decisions
- Semantic `theme.*` overrides: <list>.
- Density: compact | cozy | tv.
- Motion: <semantic duration/easing choices>.
- Component overrides: <none, or explicitly justified exception>.

## Required states
- Loading: <direction>.
- Empty: <direction>.
- Error: <direction>.
- Focus/keyboard/reduced-motion/contrast: <checks>.

## Prohibitions
- Do not add primitive literals, a parallel component API, or business logic.
- Do not override user accessibility preferences.
- Do not apply this style outside its intended scope.
```
