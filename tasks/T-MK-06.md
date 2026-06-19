---
id: T-MK-06
title: "vetores: oversell multi-emissor, saga com perna externa falha, lance perdedor, cupom reusado"
status: draft
complexity: 3
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-MK-01", "T-MK-02", "T-MK-03", "T-MK-04", "T-MK-05"] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
---

# T-MK-06 · vetores: oversell multi-emissor, saga com perna externa falha, lance perdedor, cupom reusado

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar bateria de testes adversarial (vetores) para o marketplace: oversell multi-emissor, saga com
perna externa falha, lance perdedor em leilão, cupom reusado, e outros cenários de borda do caderno §10
e seções relacionadas. Fonte: `caderno-3-sdk/15-marketplace-reference-spec.md §10 + §3, §4.3, §7`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/marketplace/tests/marketplace-vectors.test.ts

export interface MarketplaceVectorTest {
  /** Nome descritivo do vetor. */
  name: string;
  /** Descrição do cenário atacado. */
  scenario: string;
  /** Função de teste que deve lançar ou retornar resultado esperado. */
  run: () => Promise<void> | void;
  /** Resultado esperado (ex.: "collision", "compensated", "expired"). */
  expectedOutcome: string;
}

export interface MarketplaceVectorSuite {
  /** Lista todos os vetores de teste. */
  listVectors(): MarketplaceVectorTest[];
  /** Executa um vetor específico. */
  runVector(name: string): Promise<{ passed: boolean; detail: string }>;
  /** Executa todos os vetores. */
  runAll(): Promise<Array<{ name: string; passed: boolean; detail: string }>>;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §10 — Limites honestos
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §3.4 — Oversell multi-emissor é saga, não garantia estrutural
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §4.2-4.3 — Saga com perna externa falha, TTL
- [caderno-3-sdk/15-marketplace-reference-spec.md](../docs/caderno-3-sdk/15-marketplace-reference-spec.md) §7 — Leilão: lances serializados; cupom: anti-reuso por serialização
- [[saga]] — Limite honesto do Tier 1; janela observável
- [[credits]] — SPENDS como âncora de serialização
- [[classe-de-liquidacao]] — Classes determinam o que cada vetor entrega

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/15-marketplace-reference-spec.md` §3, §4, §7, §10
- **[READ]** `packages/marketplace/src/anti-oversell.ts` — T-MK-02
- **[READ]** `packages/marketplace/src/saga.ts` — T-MK-03
- **[READ]** `packages/marketplace/src/cash-engine.ts` — T-MK-04
- **[READ]** `packages/marketplace/src/financial-instruments.ts` — T-MK-05
- **[CREATE]** `packages/marketplace/tests/marketplace-vectors.test.ts` — suite de vetores
- **[UPDATE]** `packages/marketplace/src/index.ts` — re-exportar suite se necessário

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro — testes de integração entre módulos).
- [x] **Ambiente do Teste:** Node puro.
- [x] **Fora de Escopo:** Testes E2E com UI. Testes de carga/performance. Conectores externos reais (BaaS).

Casos de teste — Vetores adversarial (numerados):
1. **Oversell multi-emissor:** dois vendedores listam última unidade do mesmo produto canônico; duas compras simultâneas em linhagens diferentes → ambas podem finalizar (não há garantia estrutural cross-emissor; §3.4 declara que isso é saga, não anti-oversell).
2. **Saga com perna externa falha:** checkout com perna de pagamento (BaaS stub) que falha → saga compensa perna de estoque; lock expira e reverte.
3. **Lance perdedor:** dois lances no mesmo leilão; maior vence, menor é rejeitado com colisão (lances serializados por head).
4. **Cupom reusado:** mesma intent de cupom aplicada duas vezes → segunda detecta colisão (cupom é `ASSET:INVENTORY` consumível, anti-reuso por serialização).
5. **Lock expira antes da confirmação:** saga Tier 1 com TTL `fixed` curto; lock expira durante fase de commit → saga retorna `expired`.
6. **Split inválido:** `CashOperation` com soma de splits ≠ totalDebit → rejeitado com `split_mismatch`.
7. **Saldo insuficiente:** compra de 100 com saldo 50 → `insufficient_funds`.
8. **Conversão cross-moeda sem oráculo:** tentativa de converter BRL→USD sem taxa de oráculo disponível → erro declarado (não finge liquidação).
9. **Garantia sem recourse:** inadimplência no instrumento subjacente → garantidora absorve perda; cedente não é acionado (recourse: false).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie lógica de negócio nova — esta task é SOMENTE testes que exercitam os módulos T-MK-01 a T-MK-05.
> - **NÃO** teste cenários felizes (já cobertos nas tasks anteriores) — foque nos vetores de borda e falha.
> - **NÃO** modifique implementações das tasks anteriores se um teste falhar — registre o achado como comentário no teste com `// TODO: fix in T-MK-0X`.

### Pegadinhas conhecidas
- **Vetor 1 (oversell multi-emissor) NÃO deve passar no anti-oversell:** isso é esperado e declarado no §3.4. O teste deve documentar que cross-emissor requer saga, não garantia estrutural.
- **Stubs de conectores externos:** para vetores que dependem de BaaS/oráculo, use stubs que simulam falha (vetor 2) ou ausência (vetor 8).
- **Cada vetor testa um limite honesto do §10:** o propósito é verificar que os limites declarados no caderno são respeitados — não que o sistema faz mágica além deles.

1. **[TDD]** Crie `packages/marketplace/tests/marketplace-vectors.test.ts` com os 9 vetores.
2. Cada vetor importa e exercita os módulos correspondentes (T-MK-02 para oversell, T-MK-03 para saga, etc.).
3. Documente vetores que intencionalmente NÃO passam (ex.: oversell multi-emissor) com comentário explicando o limite honesto.
4. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência. Vetores derivados diretamente do caderno §3.4, §4.2, §7 e §10.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] 9 vetores adversarial implementados e executáveis?
- [ ] Vetor de oversell multi-emissor documenta o limite honesto (não é bug)?
- [ ] Vetor de saga com perna externa falha testa compensação?
- [ ] Vetor de lance perdedor testa colisão de lances serializados?
- [ ] Vetor de cupom reusado testa anti-reuso por serialização?
- [ ] Vetores usam stubs para dependências externas (BaaS, oráculo)?
- [ ] `pnpm test` verde (vetores que devem falhar têm descrição clara)?

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
