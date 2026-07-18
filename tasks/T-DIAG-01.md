---
id: T-DIAG-01
title: "SPIKE: adoção controlada de Archify para artefatos arquiteturais"
status: draft:hardened
complexity: 5
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: []
blocks: []
capacity_target: opus-spike
---
# T-DIAG-01 · SPIKE: adoção controlada de Archify para artefatos arquiteturais

## 0. Ambiente de Execução Obrigatório
- **Natureza:** tooling do repositório Docs; não cria worktree nem altera código do SuperApp.
- **Capacidade-alvo:** `opus-spike`; entregável = piloto reprodutível, artefatos derivados e decisão de adoção. Não torna Archify obrigatório.
- **Isolamento:** checkout/instalação temporária em `C:\tmp\t-diag-01-archify`; nunca instalar globalmente nem modificar configuração do usuário.
- **Versão:** Archify v2.11.0 (Git repo: `https://github.com/tt-a1i/archify`, release tag `v2.11.0`).

## 1. Objetivo
Avaliar Archify como ferramenta opcional para agentes arquitetos produzirem diagramas técnicos derivados de documentos canônicos. O piloto deve usar uma fonte real, validar `JSON IR → HTML/SVG`, testar atualização por mudança restrita no JSON e decidir como versionar, revisar e publicar esses artefatos sem criar uma fonte de verdade paralela.

## 2. Contexto RAG (Spec-Driven Development)
- [ADR 0016 — UI Engines compartilhadas e FlowGrid determinístico](file:///c:/Dev2026/Docs/docs/adr/0016-ui-engines-e-flow-grid.md) — fonte canônica do piloto: fronteiras entre Design System, `ui-engines`, páginas e plugins.
- [caderno-3-sdk/10-design-system.md](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/10-design-system.md) — tokens do design system.
- [caderno-3-sdk/12-plugins-e-computacao.md](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/12-plugins-e-computacao.md) — sandbox e capability manifest.
- [Archify v2.11.0 Repository](https://github.com/tt-a1i/archify/tree/v2.11.0) — README, JSON IR tipado, validadores, renderização HTML/SVG e CLI.
- [Archify schemas](https://github.com/tt-a1i/archify/tree/v2.11.0/archify/schemas) — schemas de validação.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/adr/0016-ui-engines-e-flow-grid.md` — Fonte de verdade para os elementos do diagrama.
- **[CREATE]** `docs/diagramas/adr-0016-ui-boundaries.json` — Fonte editável do diagrama (JSON IR no formato `architecture` do Archify).
- **[CREATE]** `docs/diagramas/adr-0016-ui-boundaries.html` — HTML interativo gerado.
- **[CREATE]** `docs/diagramas/adr-0016-ui-boundaries.svg` — SVG estático gerado (ou exportado).
- **[CREATE]** `C:\tmp\t-diag-01-archify\package.json` — Arquivo de controle para a instalação local e isolada.

### Contrato de Dados - TypeScript interfaces para Archify JSON IR (v2.11.0):
```typescript
export interface ArchifyMeta {
  title: string;
  subtitle?: string;
  output?: string;
  animation?: "trace" | "none";
  viewBox?: [number, number];
}

export interface ArchifyLayout {
  mode: "grid";
  origin?: [number, number];
  cols?: number;
  gapX?: number;
  gapY?: number;
  cellW?: number;
  cellH?: number;
}

export type ArchifyComponentType = "external" | "frontend" | "backend" | "database" | "messagebus" | "cache" | "broker";

export interface ArchifyComponent {
  id: string;
  type: ArchifyComponentType;
  label: string;
  sublabel?: string;
  row?: number;
  col?: number;
  pos?: [number, number];
  size?: [number, number];
}

export interface ArchifyConnection {
  from: string;
  to: string;
  label?: string;
  dir?: "forward" | "back" | "both" | "none";
}

export interface ArchifyArchitectureIR {
  schema_version: 1;
  diagram_type: "architecture";
  meta: ArchifyMeta;
  layout?: ArchifyLayout;
  components: ArchifyComponent[];
  connections?: ArchifyConnection[];
}
```

## 4. Estratégia de Testes Estrita (Test-Driven Development)
1. **Cenário 1: Validação de Schema (JSON IR)**:
   - **Procedimento:** Executar o validador do CLI da versão pinada contra `docs/diagramas/adr-0016-ui-boundaries.json`.
   - **Resultado esperado:** Retorno limpo de validação (Exit Code 0).
2. **Cenário 2: Cobertura Semântica da ADR-0016**:
   - **Procedimento:** Verificar se o diagrama contém exatamente as 7 entidades básicas da ADR-0016: `@plataforma/design-system`, `@plataforma/ui-engines`, `@plataforma/shell`, `@plataforma/pages`, plugin UI opaco, capability manifest, e a sandbox.
   - **Resultado esperado:** As entidades devem estar mapeadas em `components` no JSON IR.
3. **Cenário 3: Estabilidade de Renderização (Diff)**:
   - **Procedimento:** Alterar uma propriedade (ex: `sublabel` ou `type` de um componente no JSON IR), re-renderizar o HTML/SVG e realizar `git diff`.
   - **Resultado esperado:** Apenas as linhas correspondentes ao componente alterado devem mudar, sem alterar coordenadas globais ou reordenar chaves.
4. **Cenário 4: Checagem Visual de Layout (Inspect / Check)**:
   - **Procedimento:** Executar a checagem de artefato `archify check` no HTML final gerado.
   - **Resultado esperado:** Zero erros de intersecções inválidas ou transbordamentos de viewBox (Exit Code 0).
5. **Cenário 5: Acessibilidade de Tema (Preferências)**:
   - **Procedimento:** Validar no HTML gerado a existência de classes CSS de suporte a light/dark theme e `@media (prefers-reduced-motion: reduce)`.
   - **Resultado esperado:** Suporte a toggle de tema funcional e sem animações forçadas.

## 5. Instruções de Execução (Step-by-Step)
1. Clone o repositório do Archify temporariamente:
   `git clone -b v2.11.0 https://github.com/tt-a1i/archify.git C:\tmp\t-diag-01-archify`
2. Instale as dependências locais de forma isolada em `C:\tmp\t-diag-01-archify`:
   `cd C:\tmp\t-diag-01-archify && pnpm install`
3. Crie a pasta de destino dos diagramas caso não exista: `mkdir -p docs/diagramas`
4. Crie o arquivo `docs/diagramas/adr-0016-ui-boundaries.json` com os 12 elementos e fluxos mapeados a partir da ADR-0016.
5. Valide o arquivo JSON IR:
   `node C:\tmp\t-diag-01-archify\bin\archify.mjs validate architecture docs/diagramas/adr-0016-ui-boundaries.json`
6. Renderize o arquivo HTML/SVG:
   `node C:\tmp\t-diag-01-archify\bin\archify.mjs render architecture docs/diagramas/adr-0016-ui-boundaries.json docs/diagramas/adr-0016-ui-boundaries.html`
7. Inspecione visualmente o HTML gerado e execute a checagem:
   `node C:\tmp\t-diag-01-archify\bin\archify.mjs check docs/diagramas/adr-0016-ui-boundaries.html`
8. Faça uma mudança restrita no JSON, re-renderize e registre o diff para avaliar estabilidade.
9. Remova a instalação temporária ao finalizar (exceto os artefatos sob `docs/diagramas/`).

### ⚠️ REGRAS DO QUE NÃO FAZER:
- **NÃO** instalar com `npx skills add ... -g`, copiar a skill para configurações globais ou adicionar dependência ao monorepo.
- **NÃO** alterar a semântica da ADR para caber no layout nem usar o diagrama como evidência arquitetural independente.
- **NÃO** editar HTML/SVG derivado manualmente; corrigir somente JSON e renderizar de novo.

## 6. Feedback de Especificação
> **Decisões arquiteturais ou bloqueios identificados no endurecimento:**
> - Nenhuma decisão em aberto identificada. O escopo está 100% mapeado a partir da ADR-0016 e da especificação do Archify v2.11.0.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Verificação automática (Gate de Evidência)
O Worker deve colar a saída literal destes comandos na Seção 8 (Handover):
```bash
# Validar JSON IR contra o schema oficial
node C:\tmp\t-diag-01-archify\bin\archify.mjs validate architecture docs/diagramas/adr-0016-ui-boundaries.json

# Renderizar HTML do diagrama
node C:\tmp\t-diag-01-archify\bin\archify.mjs render architecture docs/diagramas/adr-0016-ui-boundaries.json docs/diagramas/adr-0016-ui-boundaries.html

# Checagem de integridade visual do HTML
node C:\tmp\t-diag-01-archify\bin\archify.mjs check docs/diagramas/adr-0016-ui-boundaries.html
```
Todos devem retornar Exit Code 0.

### Checklist do Reviewer
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O JSON IR está sob `docs/diagramas/adr-0016-ui-boundaries.json`?
- [ ] O HTML e SVG gerados estão sob `docs/diagramas/` e declaram no topo a versão do Archify e a fonte canônica?
- [ ] O diagrama contém no máximo 12 elementos e cobre as entidades descritas na ADR-0016?
- [ ] Foi anexada a evidência do gate de validação/checagem?
- [ ] A proposta de convenção de adoção está documentada no handover?

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
> Preenchido somente via `manage-task.mjs`.
- **[2026-07-16T18:20]** - *gpt-5* - `[Triado]`: Spike Archify triada: piloto derivado da ADR-0016, com JSON IR versionado e decisão de adoção opcional.
- **[2026-07-18T11:02]** - *gemini* - `[Endurecido]`: endureceu spec
