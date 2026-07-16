---
name: design-theme-profile
description: Define or revise a named reusable visual-theme skill for the platform, such as a product, brand, or module style. Use when a user asks for a distinct UI aesthetic or theme; create one `design-tema-SLUG` skill per approved style while keeping the canonical Design System unchanged.
---

# Design Theme Profile

1. Ask for or infer only the named style, intended product/module scope and reference material. Do
   not invent a style from a vague request.
2. Read the canonical Design System and theme customization cadernos before authoring anything.
3. Create a separate `design-tema-<slug>` skill from `references/style-skill-template.md`. The
   style skill owns visual direction only; it always delegates component, engine and shell choices
   to `$design-system-ui`.
4. Express the style through semantic `theme.*` overrides, density and motion choices. State the
   intended App/Module/Page scope and document any narrow component override.
5. Include accessibility constraints, empty/loading/error states and visual anti-patterns. Do not
   copy screenshots, force a font, or prescribe a library unless the user has approved it.
6. Validate contrast and browser behavior with the consuming app. If a requested look needs a new
   component/slot, create that through the Design System authoring flow rather than styling around it.

Read `references/style-skill-template.md` before creating a named style skill.
