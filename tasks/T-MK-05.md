---
id: T-MK-05
title: "SPECs instrumento_financeiro (cessao/aporte/garantia) com APPROVED_BY, LASTRO, recourse"
status: draft:triaged
complexity: 4
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-MK-01", "T-501"] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: sonnet
---

# T-MK-05 · SPECs instrumento_financeiro (cessao/aporte/garantia) com APPROVED_BY, LASTRO, recourse

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar SPECs de instrumento financeiro (cessão/aporte/garantia) com arestas APPROVED_BY, LASTRO,
recourse, e propagação de inadimplência unificada declarada na Zen. Fonte: `caderno-3-sdk/15-marketplace-reference-spec.md §8`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/marketplace/src/financial-instruments.ts

export type FinancialInstrumentKind = "cessao" | "aporte" | "garantia";

export interface FinancialInstrumentSpec {
  kind: FinancialInstrumentKind;
  /** Valor de face do instrumento. */
  faceValue: Money;
  /** Taxa de desconto (cessão) ou taxa de garantia (garantidora). */
  rate?: number;
  /** Modalidade (ex.: "confissao_divida", "scp" para aporte). */
  modality?: string;
  /** Se garantia: cobrança ativa habilitada? */
  activeCollection?: boolean;
}

export interface CessaoRecebivel extends FinancialInstrumentSpec {
  kind: "cessao";
  /** ID da NF-e ou documento fiscal externo. */
  externalRef: string;
  /** Validador: persona analista com ASSET:ROLE. */
  approvedBy?: string; // entity_id da persona
  /** Aresta APPROVED_BY: gate por descoberta-de-grafo. */
  approvalGate: "pending" | "approved" | "rejected";
}

export interface AporteInstrument extends FinancialInstrumentSpec {
  kind: "aporte";
  /** Discriminador modal: confissão de dívida vs. SCP. */
  modality: "confissao_divida" | "scp";
  /** Lastro via aresta RELATES:FINANCE:LASTRO. */
  lastroEntityId?: string;
  /** Regra de haircut declarada na Zen. */
  haircutRule?: "pro_rata" | "subordinacao_por_serie";
}

export interface GarantiaInstrument extends FinancialInstrumentSpec {
  kind: "garantia";
  /** Sem direito de regresso contra o cedente. */
  recourse: boolean;
  /** Preço = taxa de garantia sobre face value. */
  guaranteeRate: number;
}

export interface FinancialInstrumentEngine {
  /** Registra instrumento financeiro como SPEC + ASSET:INVENTORY. */
  register(spec: FinancialInstrumentSpec): Promise<string>; // entity_id
  /** Aprova cessão via APPROVED_BY (persona analista). */
  approveCessao(instrumentId: string, approverId: string): Promise<void>;
  /** Propaga inadimplência: traversal de RELATES:FINANCE:LASTRO. */
  propagateDefault(instrumentId: string): Promise<DefaultPropagation>;
}

export interface DefaultPropagation {
  affectedInstruments: string[];   // entity_ids afetados
  haircutApplied: number;           // percentual absorvido
  absorbedBy: string[];             // ordem de absorção (seniority)
}

export interface Money {
  amount: number;
  currency: string;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §8 — Fluxos financeiros sobre a mesma máquina (cessão, aporte, garantia)
- [[instrumento-financeiro]] — Definição canônica: recebíveis, aportes, garantias como classe `instrumento_financeiro`
- [[credits]] — SPENDS/CREDITS usados nas transações financeiras
- [[classe-de-liquidacao]] — Classe `instrumento_financeiro` na tabela de liquidação

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/15-marketplace-reference-spec.md` §8, §10
- **[READ]** `docs/conceitos/instrumento-financeiro.md`
- **[READ]** `packages/marketplace/src/specs.ts` — Money, LiquidationClass (T-MK-01)
- **[CREATE]** `packages/marketplace/src/financial-instruments.ts` — interfaces + engine
- **[CREATE]** `packages/marketplace/src/financial-engine.ts` — implementação
- **[CREATE]** `packages/marketplace/tests/financial-instruments.test.ts` — testes
- **[UPDATE]** `packages/marketplace/src/index.ts` — re-exportar

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro — lógica de negócio).
- [x] **Ambiente do Teste:** Node puro.
- [x] **Fora de Escopo:** Integração real com UCAN (T-501). Conector fiscal externo (T-CN-03). Cobrança ativa real (StateMachine).

Casos de teste (numerados):
1. `register({ kind: "cessao", faceValue: { amount: 100000, currency: "BRL" }, externalRef: "NF-123" })` → retorna entity_id.
2. `register({ kind: "aporte", modality: "scp", haircutRule: "subordinacao_por_serie" })` → retorna entity_id.
3. `register({ kind: "garantia", recourse: false, guaranteeRate: 0.05 })` → retorna entity_id.
4. `approveCessao(instrumentId, approverId)` → transita `approvalGate` para "approved".
5. Aprovação por persona sem ASSET:ROLE → rejeitada.
6. `propagateDefault(instrumentId)` → propaga inadimplência via LASTRO; retorna DefaultPropagation.
7. Haircut pro-rata: rateio entre cotistas na proporção do aporte.
8. Subordinação por série: sênior absorve por último; mezanino/júnior primeiro.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie tipos de nó separados para cessão/aporte/garantia — são variantes de SPEC sobre a mesma classe `instrumento_financeiro` (§8: "três variantes de SPEC sobre a mesma maquinaria").
> - **NÃO** implemente cobrança ativa como polling — use StateMachine de workflow (T-WF-01) para régua de cobrança.
> - **NÃO** calcule haircut fora da Zen — a regra de absorção é declarada no payload da SPEC:APORTE, executada pela Zen engine (T-604).

### Pegadinhas conhecidas
- **Cessão é instrumento discreto, não saldo:** recebível = `ASSET:INVENTORY` (consumido uma vez), NÃO `BALANCE_STATE` (§8.1). Não confunda com saldo de caixa.
- **APPROVED_BY é gate social, não criptográfico:** a validação é por descoberta-de-grafo (a persona analista tem aresta APPROVED_BY apontando para a cessão). Não é assinatura criptográfica — é afirmação no grafo.
- **Recourse = false na garantia:** garantidora não tem direito de regresso contra o cedente (§8.3). Isso afeta a propagação de inadimplência (quem absorve a perda).

1. **[TDD]** Crie `packages/marketplace/tests/financial-instruments.test.ts` com os 8 casos.
2. Implemente `packages/marketplace/src/financial-instruments.ts` com as interfaces.
3. Implemente `packages/marketplace/src/financial-engine.ts` com register, approveCessao, propagateDefault.
4. Re-exporte em `packages/marketplace/src/index.ts`.
5. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] 3 variantes de instrumento (cessão, aporte, garantia) sobre a mesma classe `instrumento_financeiro`?
- [ ] Cessão usa APPROVED_BY com gate de persona analista?
- [ ] Aporte com discriminador modal e LASTRO?
- [ ] Garantia com recourse: false?
- [ ] Propagação de inadimplência com haircut pro-rata e subordinação por série?
- [ ] `pnpm test` verde com 8 casos?

### Verificação automática
```bash
pnpm --filter @plataforma/marketplace build
pnpm --filter @plataforma/marketplace test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:02]** - *system* - `[Triado]`: Triagem em lote do backlog
