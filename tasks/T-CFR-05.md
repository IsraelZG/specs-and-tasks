---
id: T-CFR-05
title: "vetores: recalculo retroativo da epoca, fechamento imutavel, jurisdicao ausente degrada, conector fiscal ausente"
status: draft:triaged
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-CFR-01", "T-CFR-02", "T-CFR-03", "T-CFR-04"]
blocks: []
---

# T-CFR-05 · vetores de edge cases contábeis/fiscais/RH

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Criar testes de vetor (edge cases e caminhos de degradação) que validam os 4 cenários críticos de robustez do módulo contábil/fiscal/RH:
1. **Recálculo retroativo da época**: recalcular competência anterior aplica regra da época (não a atual).
2. **Fechamento imutável**: período fechado rejeita novos fatos; reabertura é auditável.
3. **Jurisdição ausente degrada**: ausência de variante jurisdicional → modo degradado com fato negativo.
4. **Conector fiscal ausente**: sem conector classe C → apuração segue mas emissão/transmissão fica pendente.
*(Fonte: `docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md` §7)*.

### Contratos exatos (assinaturas TS fixadas)

```ts
// --- packages/contabil/tests/edge-cases.test.ts 
---
// Nenhuma exportação nova. O arquivo importa e exercita os módulos existentes:
// - chart-of-accounts.ts (T-CFR-01)
// - tax.ts (T-CFR-02)
// - accountant.ts (T-CFR-03)
// - payroll.ts (T-CFR-04)

import { describe, it, expect, beforeEach } from 'vitest';
import { classifyFact, buildLedger, createClassificationRule } from '../src/chart-of-accounts.js';
import { calculateTaxes, recalculateTaxes, provisionTax } from '../src/tax.js';
import { closePeriod, reopenPeriod, generateExport } from '../src/accountant.js';
import { calculatePayroll, recalculatePayroll, createLaborCharge } from '../src/payroll.js';
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md](../docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md) §7 — limites honestos: recálculo retroativo, modo degradado, defasagem regulatória
- [[jurisdicao]] — jurisdição ausente → degrada para base com fato negativo
- [[conector-externo]] — sem conector → modo degradado declarado
- [[vigencia-de-regra]] — competência temporal

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/17-contabil-fiscal-rh-reference-spec.md` §7
- **[READ]** `packages/contabil/src/chart-of-accounts.ts` (T-CFR-01)
- **[READ]** `packages/contabil/src/tax.ts` (T-CFR-02)
- **[READ]** `packages/contabil/src/accountant.ts` (T-CFR-03)
- **[READ]** `packages/contabil/src/payroll.ts` (T-CFR-04)
- **[CREATE]** `packages/contabil/tests/edge-cases.test.ts`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Ambiente do Teste:** `pnpm --filter @plataforma/contabil test`.
- [x] **Fora de Escopo:** Testes de carga, integração com conectores reais, frontend.

Casos de teste (agrupados por vetor):

### Vetor 1: Recálculo retroativo da época
1. **classifyFact com regra antiga**: fato de 2024 classificado com regra `effectiveFrom: 2024-01-01`; após nova regra em 2025, reclassificar 2024 mantém regra antiga.
2. **calculateTaxes retroativo**: tributos de 2024 recalculados com alíquota de 2024 (ex: PIS 0.65% vs 1.65% atual).
3. **calculatePayroll retroativo**: folha de 2024 recalculada com encargos de 2024 (ex: INSS teto antigo).
4. **buildLedger com regra mista**: razão de período que cruza mudança de regra usa a regra correta para cada fato.

### Vetor 2: Fechamento imutável
5. **closePeriod rejeita novos fatos**: após `closePeriod(2026-06)`, `recordWorkEvent` com `competence: 2026-06` → erro.
6. **closePeriod permite fatos de outro período**: período 2026-06 fechado, mas 2026-07 aberto → fatos em 2026-07 OK.
7. **reopenPeriod é auditável**: histórico contém data, responsável, motivo da reabertura.
8. **reopenPeriod permite correção**: após reabrir, `recordWorkEvent` em 2026-06 → sucesso.

### Vetor 3: Jurisdição ausente degrada
9. **calculateTaxes com jurisdição sem variante**: `calculateTaxes(competence, 'XX')` (país inexistente) → `incomplete: true`, `totalTaxDue: 0`, fato negativo registrado.
10. **calculatePayroll sem jurisdição**: `calculatePayroll(competence, 'XX')` → calcula base (salários) mas sem encargos; `incomplete` sinalizado.
11. **NÃO aplica regra de outra jurisdição**: jurisdição `XX` não herda regras de `BR` — degrada, não cascateia para default incorreto.

### Vetor 4: Conector fiscal ausente
12. **generateExport sem permissão de transmissão**: export gerada com `transmitted: false`; transmitida fica pendente.
13. **calculateTaxes sem conector**: apuração conclui com `incomplete: false` (os fatos bastam), mas transmissão de NF-e pendente — `SpedLayout.blocks` contém flag `transmission_pending: true`.
14. **Modo degradado declarado, nunca finge**: sem conector, o status é `degraded` com registro explícito; nunca `transmitted: true` falso.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** modifique implementações existentes para fazer os testes passarem — se um teste falha por bug, registre na Seção 8, não corrija (escopo é teste, não fix).
> - **NÃO** crie novos módulos — esta task só adiciona testes.
> - **NÃO** teste cenários que dependem de conectores reais ou rede externa.

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
- Esta task é só testes de vetor. Se um módulo upstream (T-CFR-01 a 04) não implementou o comportamento esperado, o teste DEVE falhar — isso é um sinal para o revisor, não um bug do teste.
- Os vetores validam comportamento cross-module: um teste pode precisar de setup que envolve 2 ou 3 módulos (ex: fechar período → tentar evento de trabalho → verificar rejeição).

1. **[TDD]** Crie `packages/contabil/tests/edge-cases.test.ts` com os 14 casos agrupados em 4 describes.
2. Cada teste configura o estado necessário (stub de StoragePort, dados de exemplo).
3. Rode `pnpm --filter @plataforma/contabil test` e registre quais passam e quais falham.
4. Se houver falhas, documente na Seção 8 quais vetores não estão cobertos pela implementação atual.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DECISÕES EM ABERTO — requer definição do arquiteto:**
> - **T-CFR-01 a 04 estão `draft`**: os testes de vetor dependem das interfaces exatas e comportamentos definidos nessas tasks. Se as assinaturas mudarem durante o endurecimento, os testes precisarão ser atualizados.
> **Status:** `draft` até as dependências ficarem `ready`. Os testes podem ser escritos contra as interfaces provisórias como contrato.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] Os 14 casos de teste estão implementados e organizados em 4 describes?
- [ ] Testes de vetor 1 (recálculo retroativo) validam que regra da época é usada?
- [ ] Testes de vetor 2 (fechamento) validam imutabilidade e auditabilidade?
- [ ] Testes de vetor 3 (jurisdição ausente) validam degradação com fato negativo?
- [ ] Testes de vetor 4 (conector ausente) validam modo degradado declarado?
- [ ] Nenhum teste introduz dependência de rede ou conector real?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/contabil build
pnpm --filter @plataforma/contabil test
```
> **GATE DE EVIDÊNCIA:** Worker cola saída literal na Seção 8.

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
