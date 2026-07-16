---
id: T-DS-06
title: "Porta query/inspect do catálogo AI-ready"
status: ready
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-DS-03"]
blocks: ["T-IA-04", "T-PG-07"]
capacity_target: sonnet
---

# T-DS-06 · Porta query/inspect do catálogo AI-ready

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp`, worktree `task/T-DS-06`.
- **Runtime:** Node.js v20+ e TypeScript; `pnpm`; Vitest.
- **Pacote:** `@plataforma/design-system`; tooling/metadados, sem mudança visual.
- **Capacidade-alvo:** `sonnet`.

## 1. Objetivo
Entregar a porta canônica e determinística `query → inspect` sobre o catálogo AI-ready existente.
Agentes e o futuro editor visual consultam o índice compacto, escolhem um componente e só então
carregam seu `ComponentMetadata`. A porta não gera `SPEC:PAGE`, não renderiza UI e nunca aceita
HTML, CSS, `className`, path arbitrário ou componente não catalogado.

O fluxo é uma adaptação **clean-room** do Dashi PPT: o upstream é referência de interação e de
falha segura, não dependência nem fonte para cópia. O snapshot auditado é o commit
[`16cbc33`](https://github.com/chuspeeism/dashi-ppt-skill/tree/16cbc33d6c3f7fca3da6db349bbc244fe1d3d568),
licenciado em AGPL-3.0 (com exceção proprietária no exportador).

## 2. Contexto RAG
- `docs/caderno-3-sdk/10-design-system.md` §§2–4 — catálogo, metadados AI-ready e tokens semânticos.
- `docs/caderno-3-sdk/11-linguagem-de-paginas.md` §§2, 7 e 8 — árvore restrita, geração por IA e perfis.
- `docs/caderno-3-sdk/03-engines-and-spec-driven-ui.md` §§1–3 — fronteiras DS/spec/engine.
- `docs/adr/0016-ui-engines-e-flow-grid.md` — FlowGraph é contrato de DAG; não é catálogo de página.
- `tasks/T-DS-03.md` — catálogo conformado já entregue.
- `tasks/T-DS-02.md` — intenção histórica parcialmente materializada pelo schema, índice e gerador atuais;
  não é dependência porque a execução deve partir dos artefatos reais listados abaixo.
- `tasks/T-IA-04.md` e `tasks/T-PG-07.md` — consumidores desta porta.

### Referência externa fixada (leitura clean-room)
- Dashi [`layout-query.mjs`](https://github.com/chuspeeism/dashi-ppt-skill/blob/16cbc33d6c3f7fca3da6db349bbc244fe1d3d568/skills/dashi-ppt/project/scripts/workflow/layout-query.mjs): consulta compacta antes da inspeção completa.
- Dashi [`inspect-layout.mjs`](https://github.com/chuspeeism/dashi-ppt-skill/blob/16cbc33d6c3f7fca3da6db349bbc244fe1d3d568/skills/dashi-ppt/project/scripts/inspect-layout.mjs): stdout JSON e falha não-zero em identificador desconhecido.
- Dashi [`write-safe-props.mjs`](https://github.com/chuspeeism/dashi-ppt-skill/blob/16cbc33d6c3f7fca3da6db349bbc244fe1d3d568/skills/dashi-ppt/project/scripts/write-safe-props.mjs): props são validadas contra catálogo, não passadas livremente.
- Dashi [`validate-goal-spec.mjs`](https://github.com/chuspeeism/dashi-ppt-skill/blob/16cbc33d6c3f7fca3da6db349bbc244fe1d3d568/skills/dashi-ppt/project/scripts/validate-goal-spec.mjs): rejeição de HTML/layout/props desconhecidos.

## 3. Contratos e Escopo de Arquivos
- **[READ]** `packages/design-system/src/metadata/schema.ts` (`ComponentMetadata`, `ComponentType`).
- **[READ]** `packages/design-system/src/metadata/components.index.json` — shape real do índice.
- **[READ]** `packages/design-system/src/components/**/*.metadata.ts` — metadados reais usados nos testes.
- **[UPDATE]** `packages/design-system/scripts/build-component-index.mjs` — emitir `metadataPath`
  relativo ao pacote, com `/` POSIX; nunca drive letter, worktree ou caminho absoluto.
- **[CREATE]** `packages/design-system/src/metadata/catalog.ts`:

```ts
import type { ComponentMetadata, ComponentType } from './schema';

export type CatalogPriority = 'high' | 'medium' | 'low';

export interface ComponentIndexEntry {
  name: string;
  category: ComponentMetadata['component']['category'];
  type: ComponentType;
  description: string;
  path: string;
  metadataPath: string;
  priority: CatalogPriority;
  keywords: string[];
  useCases: string[];
  variants: string[];
  requiredProps: string[];
  parentConstraints: string[];
  forbiddenParents: string[];
  lastUpdated: string;
  metadataVersion: string;
}

export interface CatalogQuery {
  text: string;
  types?: ComponentType[];
  useCases?: string[];
  limit?: number;
}

export interface CatalogMatch {
  component: ComponentIndexEntry;
  reasons: Array<'name' | 'keyword' | 'use-case' | 'description'>;
}

export interface ComponentInspection {
  component: ComponentMetadata['component'];
  usage: Pick<ComponentMetadata['usage'], 'useCases' | 'requiredProps' | 'antiPatterns'>;
  variants?: ComponentMetadata['variants'];
  composition?: ComponentMetadata['composition'];
  behavior: ComponentMetadata['behavior'];
  props: ComponentMetadata['props'];
  accessibility: ComponentMetadata['accessibility'];
  aiHints: ComponentMetadata['aiHints'];
}

export function queryCatalog(
  index: readonly ComponentIndexEntry[],
  query: CatalogQuery,
): CatalogMatch[];

export function inspectComponent(metadata: ComponentMetadata): ComponentInspection;
```

- **[CREATE]** `packages/design-system/scripts/query-component-catalog.mjs` — flags
  `--text`, `--type` repetível, `--use-case` repetível e `--limit`; stdout contém somente JSON.
- **[CREATE]** `packages/design-system/scripts/inspect-component.mjs` — recebe um nome canônico,
  resolve somente o `metadataPath` do índice e devolve `ComponentInspection` como JSON.
- **[UPDATE]** `packages/design-system/package.json` — scripts `catalog:query` e `catalog:inspect`.
- **[UPDATE]** `packages/design-system/src/index.ts` — exportar tipos e funções puras de `metadata/catalog`;
  loaders de filesystem e CLIs não entram no bundle browser.
- **[UPDATE]** `packages/design-system/src/metadata/README.md` — exemplo `query → inspect` e contrato de paths relativos.
- **[CREATE]** `packages/design-system/tests/catalog.test.ts`.
- **[NO CHANGE]** componentes, tokens, temas, `@plataforma/pages`, engines, shell e apps.

### Ranking obrigatório
Tokenizar `text` em minúsculas por whitespace/pontuação. Aplicar filtros primeiro. Ordenar sem score
opaco: (1) nome exato; (2) maior número de tokens presentes em `keywords`/`useCases`; (3) maior número
em nome/descrição; (4) prioridade `high > medium > low`; (5) nome ascendente. `reasons` contém somente
as categorias que realmente casaram. `limit` padrão 10, intervalo 1–50; query vazia é erro.

## 4. Estratégia de Testes Estrita
- **Framework:** Vitest em Node puro, usando o índice e pelo menos dois metadados reais.
- [ ] Gerador produz todos os `metadataPath` relativos/POSIX; nenhum contém `C:`, `:\\` ou começa por `/`.
- [ ] Query repetida produz bytes JSON idênticos; empates terminam por prioridade e nome.
- [ ] Filtros `type`, `useCases` e `limit` são interseções e validam valores/limites.
- [ ] `inspect` carrega o metadata real pelo índice; nome/path desconhecido falha sem permitir traversal.
- [ ] stdout de sucesso é JSON puro; erro vai para stderr e usa exit code não-zero.
- [ ] Anti-fake: candidato/inspeção não contém `examples`, `commonPatterns`, `tokens`, JSX, CSS,
  `className`, source code ou prop ausente do metadata.
- **Fora de escopo:** qualidade semântica de cada metadata, geração de páginas, MCP e busca vetorial.

## 5. Instruções de Execução
1. Escreva primeiro os testes do ranking, paths relativos e fronteira dos CLIs.
2. Corrija o gerador e regenere `components.index.json`; não edite o JSON à mão.
3. Implemente as funções puras e depois adaptadores CLI mínimos.
4. Documente o exemplo consumível por T-IA-04/T-PG-07.

### Não fazer / pegadinhas
- NÃO importar código, temas ou layouts do Dashi; a licença não é compatível com cópia casual.
- NÃO inventar um segundo schema: `ComponentIndexEntry` deve refletir exatamente o JSON regenerado.
- NÃO aceitar `metadataPath` fornecido pelo usuário; a única raiz de confiança é o índice gerado.
- NÃO devolver `ComponentMetadata` bruto: `examples.code` e `commonPatterns.composition` contêm JSX
  válido para documentação humana, mas são deliberadamente excluídos de `ComponentInspection`.
- NÃO introduzir peso numérico arbitrário, embeddings, LLM, MCP ou nova dependência.
- O `components.index.json` atual contém paths absolutos de worktree; teste de caminho relativo é blocker,
  não limpeza opcional.

## 6. Feedback de Especificação
- O artefato de T-DS-02 já existe no código (`schema.ts`, índice e gerador), apesar de a task histórica
  continuar `draft:triaged`. Esta task não reimplementa esse escopo; somente normaliza o path e cria
  a porta de consulta/inspeção sobre o artefato real.
- Nenhuma decisão de produto ou API externa ficou aberta.

## 7. Definition of Done
- [ ] API pura e dois CLIs usam o catálogo real e devolvem resultados determinísticos.
- [ ] Índice regenerado é portátil entre clone/worktree/SO.
- [ ] Inspeção só resolve entradas catalogadas; traversal/unknown falham fechados.
- [ ] README mostra `query → inspect`; nenhuma alteração visual ou dependência nova.
- [ ] Build/test/lint verdes com evidência literal.

### Gate de Evidência
```bash
pnpm --filter @plataforma/design-system build
pnpm --filter @plataforma/design-system test
pnpm --filter @plataforma/design-system lint
pnpm --filter @plataforma/design-system catalog:query -- --text "destructive action" --limit 3
pnpm --filter @plataforma/design-system catalog:inspect -- Button
```

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração
- **Evidência:**
```
(colar build + test + lint + as duas consultas)
```

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.

- **[2026-07-15T18:56]** - *gpt-5* - `[Triado]`: Catálogo query-inspect para autoria de SPEC:PAGE triado; reendurecer após T-DS-02 e T-DS-03.
- **[2026-07-15T20:18]** - *gpt-5* - `[Endurecido]`: Reescrita sobre artefatos reais; ranking, paths portáveis, CLIs, anti-fake e Dashi 16cbc33 fixados.
- **[2026-07-15T20:18]** - *system* - `[Auto-promovida]`: deps todas done
