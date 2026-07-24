---
id: T-COLL-01
title: "Primitivas determinísticas para orquestração coletiva de agentes"
status: ready
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["DMM-16", "EST-10", "DMM-11"]
blocks: []
capacity_target: sonnet
test_profile: backend
---

# T-COLL-01 · Primitivas determinísticas para orquestração coletiva de agentes

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/T-COLL-01`.
- **Runtime:** Node.js v20+, TypeScript strict, `pnpm`, Vitest.
- **Capacidade-alvo:** sonnet (primitivas determinísticas de seleção, orçamento e consenso).

## 1. Objetivo
Criar as Tools determinísticas e reutilizáveis de orquestração coletiva registradas no `packages/plugin-workflows`: reserva/consumo de orçamento (`check_candidate_budget`), verificação determinística por schema/tipo de saída (`verify_candidate_output`), comparação de candidatos (`compare_candidates`), registro de acordo/dissenso (`evaluate_agreement_dissent`) e proveniência. Estratégias como *best-of-n*, crítica/reparo e painel de especialistas são compostas como workflows declarativos, não como Tools monolíticas.

## 2. Contexto RAG
- [ADR 0019](../docs/adr/0019-tools-workflows-context-and-encrypted-storage.md) §§2, 3 e 8.
- [DMM-16](./DMM-16.md) — Descriptor `UniversalToolDescriptor` e adaptadores em `packages/core/src/toolContract.ts`.
- [EST-10](./EST-10.md) — Providers, scoring e fallback em `packages/plugin-providers`.
- [DMM-11](./DMM-11.md) — Judge de execução e traces em `packages/plugin-workflows`.
- [Referências locais](../docs/referencias-codigo-aberto.md) — Collective Intelligence em `docs/_vendor/collective-intelligence` (referência clean-room de verificação sem acoplamento de licença AGPL).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/core/src/toolContract.ts` *(derivado de DMM-16)*.
- **[READ]** `packages/plugin-providers/src/registry.ts` *(derivado de EST-10)*.
- **[CREATE]** `packages/plugin-workflows/src/tools/collectiveOrchestrationTools.ts` — implementação das Tools `check_candidate_budget`, `verify_candidate_output` e `evaluate_agreement_dissent`.
- **[UPDATE]** `packages/plugin-workflows/src/index.ts` — re-exportar as Tools coletivas.
- **[CREATE]** `packages/plugin-workflows/test/collectiveOrchestrationTools.test.ts` — suíte de testes de orçamento, verificação determinística de Zod schema e preservação de dissenso.

### Assinaturas TS Derivadas (packages/plugin-workflows/src/tools/collectiveOrchestrationTools.ts)
```typescript
import { z } from 'zod';

export const CandidateEvaluationSchema = z.object({
  candidateId: z.string(),
  providerId: z.string(),
  outputData: z.unknown(),
  latencyMs: z.number().nonnegative(),
  estimatedCost: z.number().nonnegative(),
});

export const AgreementDissentSchema = z.object({
  consensusAchieved: z.boolean(),
  winningCandidateId: z.string().optional(),
  dissentingCandidateIds: z.array(z.string()),
  reason: z.string(),
});

export type CandidateEvaluation = z.infer<typeof CandidateEvaluationSchema>;
export type AgreementDissent = z.infer<typeof AgreementDissentSchema>;
```

## 4. Estratégia de Testes Estrita
Enumeração dos 5 casos de teste obrigatórios em `packages/plugin-workflows/test/collectiveOrchestrationTools.test.ts`:

1. **Reserva e Teto de Orçamento:** `check_candidate_budget` recusa a inicialização de um candidato cujo custo estimado exceda o orçamento máximo do `ToolExecutionContext`.
2. **Verificação Determinística sem LLM:** `verify_candidate_output` valida a estrutura da resposta contra um `inputSchema` Zod sem invocar modelo auxiliar de IA.
3. **Preservação de Dissenso:** Em caso de respostas divergentes entre candidatos, `evaluate_agreement_dissent` grava os `dissentingCandidateIds` e a proveniência sem forçar falsa unanimidade.
4. **Exclusão de Provider Indisponível:** Candidato de provedor marcado como insalubre/circuit-break no `plugin-providers` é descartado antes do cálculo de acordo.
5. **Anti-Fake (Registry Universal):** As Tools são resolvidas via `UniversalToolDescriptor` com validação de capabilidade requerida.

## 5. Não fazer
- NÃO implementar estratégias de debate/consensus como código C++/nulo hardcoded.
- NÃO usar modelo LLM grande como verificador determinístico default.
- NÃO copiar ou importar código do repositório AGPL Collective Intelligence.

## 6. Feedback de Especificação
- Decisão arquitetural 100% resolvida pelas ADRs 0019 §§2, 3 e 8, DMM-16 e DMM-11.
- Interfaces e tipos alinhados com o `toolContract` de DMM-16.

## 7. Gate por Comando
```bash
pnpm gate @plataforma/plugin-workflows --profile backend
```
*(Executa `pnpm --filter @plataforma/plugin-workflows build`, `test` e `lint`, colando evidências na Seção 8).*

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] Aprovado
- [ ] Requer Refatoração

## 9. Log de Execução
- **[2026-07-21T16:09]** - *gpt-5* - `[Triado]`: Triadas primitives determinísticas de orquestração coletiva.
- **[2026-07-23T23:46]** - *gemini-3.6-flash* - `[Hardened]`: Spec endurecida com contratos TS de orçamento/dissenso e gate de backend.

- **[2026-07-24T09:47]** - *Antigravity* - `[Endurecido]`: endureceu spec T-COLL-01 com contratos TS de orçamento e dissenso
- **[2026-07-24T09:48]** - *system* - `[Auto-promovida]`: deps todas done
