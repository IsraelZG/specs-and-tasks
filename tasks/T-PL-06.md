---
id: T-PL-06
title: "vetores: bundle nao-listado, plugin com rede fora das portas, classe restrita para external"
status: draft:triaged
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-PL-01", "T-PL-02", "T-PL-03", "T-PL-04", "T-PL-05"]
blocks: []
capacity_target: haiku
---

# T-PL-06 · vetores: bundle nao-listado, plugin com rede fora das portas, classe restrita para external

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (Node puro)
- **Capacidade-alvo:** haiku

## 1. Objetivo
Testes de vetores adversariais para plugins: garantir que o loader, sandboxes, ComputePort e fila rejeitam ou contém plugins maliciosos. Cobre: bundle não listado no marketplace, plugin tentando acessar rede fora das portas declaradas, classe de privacidade restrita sendo executada em site external, sideload bypass.

**Justificativa de fontes:**
- Fonte primária: `docs/caderno-3-sdk/12-plugins-e-computacao.md` §2.1 (marketplace-only, sem sideload), §6.1 (sem rede exceto portas), §6.3 (classe restrita × external proibido)
- Enriquecimento: [[validacao-de-plugin]] — tiers de validação; [[plugin]] — marketplace-only; [[capacidade-de-runtime]] — restrições de runtime; [[fila-de-computacao]] — idempotência

### Contratos TS (casos de vetor)

```ts
// --- packages/plugins/tests/vectors.test.ts 
---

export interface PluginVectorCase {
  name: string;
  description: string;
  /** Ação maliciosa. */
  scenario: string;
  /** Componente que deve rejeitar. */
  expected_component: 'loader' | 'sandbox_browser' | 'sandbox_node' | 'scheduler' | 'queue';
  /** Resultado esperado. */
  expect: 'rejected' | 'blocked' | 'noop';
  /** Regra violada. */
  invariant: string;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-3-sdk/12-plugins-e-computacao.md](../docs/caderno-3-sdk/12-plugins-e-computacao.md) §2 (marketplace-only, sem sideload), §6 (sandbox, sem autoridade ambiente), §6.3 (classe de privacidade × site)
- [docs/conceitos/plugin.md](../docs/conceitos/plugin.md)
- [docs/conceitos/validacao-de-plugin.md](../docs/conceitos/validacao-de-plugin.md)
- [docs/conceitos/capacidade-de-runtime.md](../docs/conceitos/capacidade-de-runtime.md)
- [docs/conceitos/fila-de-computacao.md](../docs/conceitos/fila-de-computacao.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `packages/plugins/src/loader.ts` (T-PL-01)
- **[READ]** `packages/plugins/src/sandbox-browser.ts` (T-PL-02)
- **[READ]** `packages/plugins/src/sandbox-node.ts` (T-PL-03)
- **[READ]** `packages/plugins/src/compute-port.ts` (T-PL-04)
- **[READ]** `packages/plugins/src/compute-queue.ts` (T-PL-05)
- **[CREATE]** `packages/plugins/tests/vectors.test.ts`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro)
- [x] **Ambiente do Teste:** Node puro
- [x] **Fora de Escopo:** Vetores de rede reais, ataques de cripto

Casos de vetor (numerados):
1. **Bundle não listado:** plugin com assinatura válida mas não está no set de listados → `loader` rejeita, `rejected`.
2. **Sideload bypass:** tentativa de carregar bundle por URL direta (não via marketplace) → `loader` rejeita, `rejected`.
3. **Assinatura forjada:** manifesto adulterado após assinatura → `loader` rejeita, `rejected`.
4. **Browser: rede fora das portas:** plugin tenta `fetch("https://evil.com")` mas `allowedPorts` é `[]` → `sandbox_browser` bloqueia, `blocked`.
5. **Browser: DOM access:** plugin tenta `document.querySelector()` → `sandbox_browser` bloqueia (Worker não tem DOM), `blocked`.
6. **Browser: storage access:** plugin tenta `localStorage.setItem()` → `sandbox_browser` bloqueia, `blocked`.
7. **Node: acesso a grafo fora do escopo:** plugin lê `entity_id` fora de `read_entity_ids` → `sandbox_node` bloqueia, `blocked`.
8. **Node: rede não declarada:** plugin tenta `fetch` para porta fora de `network` → `sandbox_node` bloqueia, `blocked`.
9. **Node: FS fora do escopo:** plugin tenta `fs.readFileSync("/etc/passwd")` → `sandbox_node` bloqueia, `blocked`.
10. **Classe restrita para external:** capacidade com `privacy_class: 'restricted'` + `allowed_sites: ['external']` → `scheduler` rejeita, `blocked`.
11. **Runtime mismatch:** plugin `node` sem peer node + sem Electron → `scheduler` retorna `null`, `rejected`.
12. **Double-claim na fila:** dois workers tentam `claim()` a mesma task simultaneamente → `queue` garante que só um vence, `blocked` para o segundo.
13. **Complete por worker errado:** worker não-dono tenta `complete()` → `queue` rejeita, `rejected`.
14. **Heartbeat falsificado:** worker tenta `heartbeat()` em task que não lhe pertence → `queue` rejeita, `rejected`.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO modifique os componentes testados para fazer os vetores passarem.
> - NÃO crie novos arquivos de implementação — esta task é só testes.

### Pegadinhas conhecidas
- Vetor 10 (classe restrita × external) é proibido por construção (§6.3) — o scheduler nunca elege `external` para capacidades `restricted`.
- Vetor 12 (double-claim) testa atomicidade do claim. Em memória, use lock simples; o teste verifica que 2 claims concorrentes na mesma task resultam em exatamente 1 sucesso.
- Vetor 2 (sideload) testa que o loader exige que o bundle venha de um `SPEC:PLUGIN` listado — carregar por URL arbitrária é rejeitado.

1. Crie `packages/plugins/tests/vectors.test.ts` com os 14 vetores.
2. Cada caso testa o componente relevante com entrada maliciosa e assere o resultado esperado.
3. Rode `pnpm --filter @plataforma/plugins test` — vetores devem passar.

## 6. Feedback de Especificação (Spec Feedback Loop)
**Links validados:**
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` §2, §6 — OK
- `docs/conceitos/plugin.md` — OK
- `docs/conceitos/validacao-de-plugin.md` — OK
- `docs/conceitos/capacidade-de-runtime.md` — OK
- `docs/conceitos/fila-de-computacao.md` — OK
- `packages/plugins/src/loader.ts` — T-PL-01 (dep)
- `packages/plugins/src/sandbox-browser.ts` — T-PL-02 (dep)
- `packages/plugins/src/sandbox-node.ts` — T-PL-03 (dep)
- `packages/plugins/src/compute-port.ts` — T-PL-04 (dep)
- `packages/plugins/src/compute-queue.ts` — T-PL-05 (dep)

**Abertos:** Nenhum.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] Todos os 14 vetores passam (sistema contém/rejeita)?
- [ ] Nenhum vetor causa crash?
- [ ] Sideload é bloqueado?
- [ ] Classe restrita nunca vai para external?
- [ ] Sandboxes bloqueiam rede/DOM/storage/FS não declarados?
- [ ] Double-claim e heartbeat falsificado são rejeitados?

### Verificação automática
```bash
pnpm --filter @plataforma/plugins build
pnpm --filter @plataforma/plugins test
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
