import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "**/build/**"] },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // `*.metadata.ts` files are intentionally excluded from this package's
          // tsconfig.json (see its `exclude`), so they have no full type info.
          // Lint them under the default (untyped) project instead of erroring.
          // There are genuinely ~50 of them (one per component) — not a sign of
          // a too-wide glob — hence raising the match-count ceiling below.
          allowDefaultProject: ["src/components/*/*.metadata.ts"],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 60,
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
