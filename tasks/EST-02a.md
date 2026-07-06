---
id: EST-02a
title: "Plugin Manifest Contract (schema Zod, nomes do caderno-12)"
status: done
complexity: 2
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-01"]
blocks: []
parent: "EST-02" # habilita parentAutoClose (T-1029) para EST-02 quando o service for corrigido
capacity_target: haiku
---

# EST-02a · Plugin Manifest Contract

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `apps/estaleiro/core/`.
- **Fonte:** RFC-018 §2 A1 (manifest mínimo com nomes do caderno 12).

## 1. Objetivo
Criar o schema Zod do **manifest mínimo de plugin do Estaleiro**: subconjunto dos campos definidos
em `docs/caderno-3-sdk/12-plugins-e-computacao.md`, sem inventar nomes paralelos (RFC-018 A1).
O schema é a base que EST-02b e EST-02c consomem — o host usa o manifest para registrar plugins
e rotear chamadas para as portas corretas.

### Contratos
```ts
// --- apps/estaleiro/core/src/manifest.ts
export const PluginManifestSchema = z.object({
  name: z.string(),           // e.g. "@plataforma/plugin-fs-tools"
  version: z.string(),        // semver
  capabilities: z.array(z.enum(["fs", "bash", "network", "store", "events", "compute", "ui"])),
  entrypoint: z.string(),     // path relativo ao package do plugin, ex: "./src/index.ts"
});
export type PluginManifest = z.infer<typeof PluginManifestSchema>;
```

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (A1 — manifest mínimo, nomes do caderno 12).
- [x] `docs/caderno-3-sdk/12-plugins-e-computacao.md` — definição canônica dos nomes de campo (~20, reduzir ao subconjunto das 4 portas + ui + compute).

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/core/src/manifest.ts` — schema Zod + tipo inferido

## 4. Estratégia de Testes
- [x] **Framework:** vitest.
- [x] **Casos:**
  1. Schema aceita manifest válido (nome, versão, 1+ capacidades, entrypoint).
  2. Schema rejeita nome vazio.
  3. Schema rejeita capacidade desconhecida (não listada no enum).
  4. Schema aceita 6 capacidades simultâneas.
  5. Tipo inferido (`PluginManifest`) compila com TypeScript strict.

## 5. Instruções de Execução
1. Implementar `PluginManifestSchema` com Zod.
2. Testar os 5 casos.
3. Gate → §8.

## 6. Feedback de Especificação
- **Nenhuma decisão em aberto.** Todo contrato deriva de RFC-018 §2 A1 + caderno 12.
- `capacity_target: haiku` — schema mecânico, sem novidade algorítmica.

## 7. Definition of Done (DoD)

### Gate de Evidência
```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
```

### Checklist
- [ ] Schema aceita/rejeita conforme 5 casos de teste?
- [ ] `pnpm build` + `test` verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- `PluginManifestSchema` implementado com Zod em `apps/estaleiro/core/src/manifest.ts`
- 5 testes (vitest): válido, nome vazio, capacidade desconhecida, 6 caps simultâneas, tipo compila
- zod adicionado como dependency de `@plataforma/estaleiro-core`

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
> pnpm --filter @plataforma/estaleiro-core build
$ tsc
(compila sem saída — OK)

> pnpm --filter @plataforma/estaleiro-core test
$ vitest run
✓ tests/manifest.test.ts (5 tests) 16ms
Test Files  1 passed (1)
     Tests  5 passed (5)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-06T12:25]** - *deepseek* - `[Triado]`: triado — manifest Zod schema, capacity=haiku, derivado RFC-018 A1 + caderno 12
- **[2026-07-06T12:25]** - *deepseek* - `[Endurecido]`: endureceu spec — manifest Zod schema, derivado RFC-018 A1 + caderno 12, capacity=haiku
- **[2026-07-06T12:25]** - *deepseek* - `[Promovida p/ ready]`: draft:hardened com deps done — safety-net flip
- **[2026-07-06T12:45]** - *deepseek* - `[Iniciado]`: iniciando manifest Zod schema
- **[2026-07-06T12:47]** - *deepseek* - `[Finalizado]`: PluginManifestSchema Zod + 5/5 testes verdes (vitest), tsc OK
- **[2026-07-06T12:49]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando manifest Zod
- **[2026-07-06T09:51]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: R1 (independente): build ✓ (tsc) + test 5/5 (vitest, 14ms) + lint 0 erros + install resolve + zod 4.4.3 sync. Schema estende spec §1 com `.min(1)` em name/capabilities/entrypoint (consistente com testes §4). 3 INFO ao ledger: i1 index.ts não re-exporta (defer EST-02b), i2 spec §1 sem .min(1) (housekeeping), i3 enum mistura portas+categories (divergência caderno-12). DoD §7 2/2 ✓.
- **[2026-07-06T09:51]** - *agile_reviewer:minimax-m3* - `[Iniciando integração]`: rodar /integrar-task EST-02a — merge na master
- **[2026-07-06T12:54]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge na master (1b6202d), worktree removida, Gate verde (build tsc, test 5/5 vitest, lint 0). Sem conflitos. zod 4.4.3 sync ao lockfile. i1+i2+i3 ao ledger.
