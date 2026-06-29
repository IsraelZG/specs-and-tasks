# ADR-003 — Design System Build: Vite em vez de tsup

- **Data:** 2026-06-21
- **Status:** Accepted
- **Autor:** Antigravity (Worker T-013)
- **Decisores:** equipe plataforma

---

## Contexto

O monorepo SuperApp adota `tsup` como builder padrão para todos os pacotes TypeScript, conforme documentado em [plano-de-implementacao.md §1.1](../../docs/plano-de-implementacao.md). O `tsup` é suficiente para bibliotecas que exportam apenas módulos JS/TS, sendo rápido e simples de configurar.

O pacote `@plataforma/design-system` possui requisitos que vão além do escopo do `tsup`:

1. **Tailwind CSS v4** — o novo motor de Tailwind integra-se ao bundler via plugin Vite (`@tailwindcss/vite`). Não existe suporte oficial de plugin para `tsup`/`esbuild` no modelo v4.
2. **Bundle de assets CSS** — o design system exporta folhas de tema (`theme-light.css`, `theme-dark.css`) e um bundle CSS do componente React com injeção de estilos. O Vite resolve importações de CSS, assets e módulos ESM de forma integrada.
3. **Pipeline de tokens** — o Style Dictionary gera arquivos CSS em `build/web/`. Este passo (`build:tokens`) é separado do bundle React e precisa rodar antes dele.

Tentar forçar o `tsup` aqui exigiria ejets manuais de pipeline e/ou wrappers customizados de esbuild para CSS, introduzindo complexidade desnecessária e quebrando a integração nativa do Tailwind v4.

---

## Decisão

`packages/design-system` e `apps/design-system-showcase` utilizam **Vite** como bundler, configurado via `vite.config.ts` com `@vitejs/plugin-react` e `@tailwindcss/vite`.

O pipeline de build é dividido em duas etapas orquestradas pelo Turborepo:

| Step | Script npm | Turbo task | Output |
|------|-----------|-----------|--------|
| 1 — Tokens | `build:tokens` | `build:tokens` | `build/web/**`, `build/react-native/**`, `build/ios/**`, `build/android/**`, `build/tv/**`, `src/metadata/components.index.json` (Tokens e metadados compilados) |
| 2 — Bundle | `build:react` | `build` | `build/react/**` (ESM + types + CSS bundle) |

O `turbo.json` reflete essa ordem de dependências e os outputs completos:

```json
{
  "build:tokens": {
    "outputs": [
      "build/web/**",
      "build/react-native/**",
      "build/ios/**",
      "build/android/**",
      "build/tv/**",
      "src/metadata/components.index.json"
    ]
  },
  "build": {
    "dependsOn": ["^build", "build:tokens"],
    "outputs": ["dist/**", "build/**"]
  }
}
```

Isso garante que:
- Tokens compilam **antes** de qualquer bundle que os consuma.
- Ambos os outputs entram no cache do Turbo (`>>> FULL TURBO` em segundo build sem mudanças).

---

## Consequências

### Positivas
- Tailwind v4 funciona nativamente, sem workarounds.
- CSS themes exportados de forma estável e cacheável.
- Build incremental: `build:tokens` só reexecuta quando `tokens/**` mudam.

### Negativas / Trade-offs
- Exceção ao padrão `tsup` requer documentação explícita (este ADR).
- Tempo de build do Vite é maior que `tsup` para builds a frio, mas o cache do Turbo atenua essa diferença em desenvolvimento.

### Pacotes afetados pela exceção
- `packages/design-system` — usa Vite + Style Dictionary
- `apps/design-system-showcase` — usa Vite (app React)

Todos os demais pacotes do monorepo continuam usando `tsup`.

---

## Alternativas Rejeitadas

| Alternativa | Razão da Rejeição |
|-------------|-------------------|
| Forçar `tsup` + plugin CSS customizado | Sem suporte oficial do Tailwind v4; alta manutenção |
| Separar design-system em repositório próprio | Quebra o monorepo; dificulta atualizações coordenadas |
| Usar Tailwind v3 (compatível com tsup) | Tailwind v4 é estratégia de longo prazo da plataforma |
