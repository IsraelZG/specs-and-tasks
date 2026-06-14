# ADR 003: Exceção de Bundler — Adoção do Vite no Design System

**Data:** 12/06/2026
**Status:** Aceito

## Contexto

A arquitetura estabelecida no `plano-de-implementacao.md` (§1.1) determina o uso estrito do `tsup` (esbuild) para todas as bibliotecas no diretório `packages/` e `Vite` (Rollup) apenas para os aplicativos finais (`apps/`).
No entanto, o pacote `@plataforma/design-system` não é uma biblioteca de lógica pura. Trata-se de uma suíte de UI consumidora de assets de compilação visual contínua, incluindo:
- Estilos orquestrados via Tailwind v4;
- Configurações do Style Dictionary que exportam tokens CSS complexos;
- Integrações próximas aos pacotes React (`react` e `react-dom`).

## Decisão

Adotamos formalmente o **Vite** no modo `Library Mode` como o bundler exclusivo para os builds de `packages/design-system` e seus eventuais clones de apresentação.

## Consequências

**Prós:**
- O processamento de CSS do Tailwind v4 é integrado nativamente ao fluxo do Vite sem complexidade adicional de post-processing no esbuild.
- Assets do React e hot-reloads para desenvolvimento (cruciais no app de showcase) funcionam de forma harmônica e com zero configuração pesada.
- Não é necessário reimplementar pipelines de loaders no esbuild (usado pelo tsup) para lidar com resoluções peculiares do mundo frontend.

**Contras (Tradeoffs):**
- Ocorre uma ligeira perda de uniformidade com as outras bibliotecas pesadas do monorepo (como `@plataforma/core` e `@plataforma/protocol`).
- O tempo de *cold build* do Vite+Rollup é marginalmente maior do que seria se compilado puramente em Go (esbuild), contudo este tempo adicional é mitigado pelas camadas de cache remoto e local providas pelo `Turborepo`.
