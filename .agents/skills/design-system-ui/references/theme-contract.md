# Theme contract

A named visual style changes only the theme layer and documented scoped overrides. It must not:

- redefine primitive token scales;
- fork a component API or add business logic to the Design System;
- bypass semantic tokens with literals;
- defeat user contrast, font-size or reduced-motion preferences.

Every profile declares its intended scope, semantic token overrides, density/motion choices,
accessibility checks and explicit non-goals.
