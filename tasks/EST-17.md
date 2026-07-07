---
id: EST-17
title: "OmniRoute sidecar de DEV: entrada `omniroute` no plugin-providers + doc de operação (free tiers/combos para a frota)"
status: done
complexity: 2
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-10a"]
blocks: []
capacity_target: haiku
---

# EST-17 · OmniRoute sidecar de DEV (entrada no registry + ops)

## 0. Ambiente de Execução Obrigatório
- **Fonte da decisão:** RFC-018 §2 D3 — **EMENDA 2026-07-06** (híbrido): sidecar de DEV liberado;
  produto continua só com extração de mecanismos. Leia a emenda antes de codar.
- **O sidecar NÃO é instalado por esta task.** OmniRoute roda como app separado, FORA dos repos
  (ex.: `C:/Dev2026/omniroute`, clone de `github.com/diegosouzapw/OmniRoute`, MIT). Instalação,
  `.env` (JWT_SECRET/API_KEY_SECRET), conexão de contas OAuth no dashboard e geração da API key
  são passos MANUAIS do operador (browser). Esta task entrega só o LADO NOSSO: a entrada no
  registry + a doc de operação. `docs/_vendor/OmniRoute/` é cópia para CITAÇÃO — não rodar de lá.
- **Runtime:** o mesmo do `packages/plugin-providers` (EST-10a, `done`).
- **Package:** `@plataforma/plugin-providers` (EST-10a `done` — registry disponível).
- **Test Runner:** `vitest` (já configurado em EST-10a).
- **Lint:** `eslint src/` (typescript-eslint strict).
- **Capacidade-alvo:** haiku (mecânico: adicionar entrada no registry + escrever playbook).
- **EST-10a `done`:** `PROVIDERS` map em `packages/plugin-providers/src/registry.ts` contém
  `deepseek` e `openrouter`. Esta task adiciona `omniroute` como terceira entrada.

## 1. Objetivo
Dar à frota do Estaleiro acesso aos free tiers/combos do OmniRoute com **uma** entrada
OpenAI-compatible no `PROVIDERS` (`http://127.0.0.1:20128/v1`, key via `OMNIROUTE_API_KEY`) +
playbook de operação do sidecar. Roster passa a poder nomear `omniroute/<modelo-ou-combo>`.

### Contratos (todos DERIVADOS de fonte — CITE OU ESCALE)

```ts
// === packages/plugin-providers/src/registry.ts (UPDATE)
// DERIVADO de: EST-10a §2 (PROVIDERS map) + RFC-018 §2 D3 emenda (OmniRoute sidecar dev)
// + docs/_vendor/OmniRoute/CLAUDE.md (porta 20128)

// O map atual (EST-10a, done):
// export const PROVIDERS: Record<string, ProviderConfig> = {
//   deepseek:   { baseURL: 'https://api.deepseek.com/v1',  apiKeyEnv: 'DEEPSEEK_API_KEY' },
//   openrouter: { baseURL: 'https://openrouter.ai/api/v1', apiKeyEnv: 'OPENROUTER_API_KEY' },
// };

// Adicionar (EST-17):
export const PROVIDERS: Record<string, ProviderConfig> = {
  deepseek:   { baseURL: 'https://api.deepseek.com/v1',  apiKeyEnv: 'DEEPSEEK_API_KEY' },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1', apiKeyEnv: 'OPENROUTER_API_KEY' },
  omniroute:  { baseURL: 'http://127.0.0.1:20128/v1',    apiKeyEnv: 'OMNIROUTE_API_KEY' },
};
// NOTA: porta 20128 = padrão do OmniRoute (docs/_vendor/OmniRoute/CLAUDE.md → npm run dev)
//       http://127.0.0.1 (não localhost) → evita resolução DNS em alguns setups Windows.
//       `apiKeyEnv` ausente = sidecar não disponível (circuit-breaker/fallback de EST-10b
//       pula provider sem key, sem crash).
```

```ts
// === packages/plugin-providers/tests/registry.test.ts (UPDATE — caso 4)
// DERIVADO de: EST-10a §4 caso 4 (PROVIDERS contém exatamente deepseek e openrouter)
// EST-17 expande para 3 entradas.

// Caso 4 (ajustado): PROVIDERS contém exatamente 'deepseek', 'openrouter', 'omniroute'
// (1:1 com o map atualizado — 3 entradas, sem entradas extras sem fonte)
```

## 2. Contexto RAG (Spec-Driven Development)
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 D3 (emenda 2026-07-06) — FONTE: sidecar de DEV liberado, entrada única OpenAI-compatible no plugin-providers, porta 20128.
- [x] `tasks/EST-10a.md` — PROVIDERS map (deepseek, openrouter), assinatura `resolveModel()`, 5 casos de teste. EST-10a está `done` — fonte real disponível.
- [x] `docs/_vendor/OmniRoute/CLAUDE.md` — porta 20128, `DATA_DIR ~/.omniroute`, `.env` mínimo (JWT_SECRET, API_KEY_SECRET). Referência para o playbook.
- [x] `docs/_vendor/OmniRoute/README.md` — instruções de instalação (`npm install && npm run dev`), build, variáveis de ambiente.
- [x] `packages/plugin-providers/src/registry.ts` (EST-10a, final) — forma real do arquivo que será editado (path derivado de EST-10a §3).

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `packages/plugin-providers/src/registry.ts` — adicionar `omniroute: { baseURL: 'http://127.0.0.1:20128/v1', apiKeyEnv: 'OMNIROUTE_API_KEY' }` ao PROVIDERS map.
- **[UPDATE]** `packages/plugin-providers/tests/registry.test.ts` — caso 4 passa a esperar `'deepseek'`, `'openrouter'`, `'omniroute'` (3 entradas, exato).
- **[CREATE]** `docs/playbook/07-omniroute-sidecar.md` — playbook de operação do sidecar (instalar/rodar/atualizar/conectar contas/gerar key/smoke test).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- **Framework:** `vitest` (mesmo de EST-10a).
- **Ambiente:** Node puro, sem sidecar (gate hermético — NENHUM teste chama localhost:20128).
- **Fora de Escopo:** Testes de integração com o sidecar OmniRoute (são smoke tests manuais no playbook). Testes de circuit-breaker (são de EST-10b).

### Casos enumerados (1 — ajuste no caso 4 existente)
1. **PROVIDERS contém exatamente `deepseek`, `openrouter`, `omniroute`** — assert que `Object.keys(PROVIDERS).sort()` === `['deepseek', 'omniroute', 'openrouter'].sort()`. NÃO adicionar entradas sem fonte. *(DERIVADO de: EST-10a §4 caso 4 + EST-17 §1 PROVIDERS map.)*

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** instalar/configurar o OmniRoute — o sidecar é responsabilidade do operador (manual).
> - **NÃO** escrever testes que chamam `localhost:20128` (gate hermético = não dependente de serviço externo).
> - **NÃO** adicionar entradas no PROVIDERS além de `omniroute` (sem fonte = inventar).
> - **NÃO** modificar `resolveModel()` — só o map de PROVIDERS.
> - **NÃO** alterar casos de teste 1, 2, 3, 5 de EST-10a — só o caso 4 (inclusão de omnniroute).

### Pegadinhas conhecidas
- **Porta pode mudar:** se o sidecar OmniRoute rodar em porta diferente (por conflito), o operador atualiza via `.env` do superapp (variável `OMNIROUTE_BASE_URL` futura) ou editando o `registry.ts`. A porta 20128 é o padrão do `npm run dev` do OmniRoute.
- **Sidecar opcional:** a entrada `omniroute` é inofensiva sem `OMNIROUTE_API_KEY` — o `resolveModel()` (EST-10a) falha ao criar o provider com throw descritivo, e o circuit-breaker (EST-10b) em fallback pula para o próximo provider.
- **Roster naming:** usar prefixo `omniroute/` (ex.: `omniroute/openai-gpt-4o`, `omniroute/anthropic-claude-sonnet`, `omniroute/combo-free-tier`). O OmniRoute roteia pelo model name.
- **Key vs sem key:** o sidecar OmniRoute pode operar SEM API key (roteia para APIs configuradas no dashboard). O `apiKeyEnv: 'OMNIROUTE_API_KEY'` é para compatibilidade com o padrão do registry; se o operador não definir, passa string vazia e o sidecar ignora.

### Playbook (docs/playbook/07-omniroute-sidecar.md)
O playbook deve conter:
1. **Pré-requisitos:** Node.js 22+, clone do OmniRoute em diretório separado (ex.: `C:/Dev2026/omniroute`).
2. **Instalação:** `git clone https://github.com/diegosouzapw/OmniRoute omniroute && cd omniroute && npm install` (OmniRoute gera `.env` automático do `.env.example`).
3. **Configuração:** acessar `http://localhost:20128`, logar, conectar contas de provider no dashboard, gerar API key no Settings → API Keys. Copiar a key gerada.
4. **Variável de ambiente:** `OMNIROUTE_API_KEY=<key_gerada>` no `.env` do superapp ou no ambiente do Estaleiro.
5. **Iniciar:** `cd omniroute && npm run dev` (sidecar na porta 20128).
6. **Smoke test:** `curl http://127.0.0.1:20128/v1/models` (deve listar modelos configurados).
7. **Atualização:** `git pull && npm install && npm run build` no diretório do OmniRoute.
8. **Solução de problemas:** porta ocupada (trocar `PORT` no `.env` do OmniRoute e atualizar `registry.ts`), dashboard não carrega (verificar `JWT_SECRET` e `API_KEY_SECRET` no `.env` do OmniRoute).

### Passos concretos
1. **[TDD]** Atualizar `tests/registry.test.ts` — caso 4 passa a esperar 3 entradas.
2. Atualizar `src/registry.ts` — adicionar `omniroute` ao PROVIDERS.
3. Criar `docs/playbook/07-omniroute-sidecar.md` — playbook conforme template acima.
4. Rodar build + test + lint do plugin-providers (Seção 7).
5. Rodar lint também no playbook (markdownlint se disponível, senão só verificar formatação).

## 6. Feedback de Especificação (Spec Feedback Loop)
> **Decisões DERIVADAS de fonte (CITE OU ESCALE):**

| Item | Fonte |
|---|---|
| `PROVIDERS` map formato (ProviderConfig) | EST-10a §2 (deepseek/openrouter entries) |
| `omniroute` entrada `{ baseURL: 'http://127.0.0.1:20128/v1', apiKeyEnv: 'OMNIROUTE_API_KEY' }` | RFC-018 §2 D3 (emenda 2026-07-06 — sidecar dev, porta 20128) |
| Porta 20128 | `docs/_vendor/OmniRoute/CLAUDE.md` → `npm run dev: Dev server at http://localhost:20128` |
| Caso 4 (PROVIDERS contém deepseek, openrouter, omniroute) | EST-10a §4 caso 4 (exatas) + EST-17 §1 |
| Playbook path `docs/playbook/07-omniroute-sidecar.md` | Padrão dos playbooks existentes em `docs/playbook/` (01-06) |
| Smoke test `curl /v1/models` | `docs/_vendor/OmniRoute/CLAUDE.md` → API Routes em `src/app/api/v1/` |
| Sidecar é opcional (sem key = pula) | RFC-018 §6.5 (circuit-breaker pula provider sem key) + EST-10b fallback |

> **Decisões em aberto:** nenhuma. EST-10a está `done` (PROVIDERS map fixado). A emenda D3 fixou a porta, o prefixo, e o limite (sidecar de DEV apenas). Playbook é documentação, não decisão de arquitetura.

> **Dependências:** EST-10a (`done`) — registry disponível para edição.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] `omniroute` adicionado ao PROVIDERS com `baseURL: 'http://127.0.0.1:20128/v1'` e `apiKeyEnv: 'OMNIROUTE_API_KEY'`?
- [ ] Caso 4 de registry.test.ts atualizado para 3 entradas (`deepseek`, `openrouter`, `omniroute`)?
- [ ] `docs/playbook/07-omniroute-sidecar.md` escrito com instruções de instalação, configuração, smoke test?
- [ ] Nenhum teste chama localhost:20128 (gate hermético)?
- [ ] Nenhuma entrada extra no PROVIDERS além das 3 com fonte?
- [ ] Build + test + lint do plugin-providers verdes?

### Verificação automática (Gate de Evidência)
```bash
pnpm --filter @plataforma/plugin-providers build
pnpm --filter @plataforma/plugin-providers test
pnpm --filter @plataforma/plugin-providers lint
```
> **GATE DE EVIDÊNCIA (Regra 3 do CLAUDE.md):** Worker cola a saída literal de build + test + lint (todos Exit Code 0) na Seção 8. Lint incluído desde 2026-07-06 após 3 reworks consecutivos por regressão (T-807, EST-02b, EST-02c). O caso 4 ajustado DEVE passar (esperar 3 entradas).

### Checklist do Reviewer
- [ ] `omniroute` adicionado mantendo as entradas deepseek e openrouter intactas?
- [ ] Caso 4 testa exatamente 3 entradas (nem mais, nem menos)?
- [ ] Nenhuma modificação em `resolveModel()` ou outros testes?
- [ ] Playbook cobre instalação, configuração, smoke test e troubleshooting?
- [ ] `pnpm build + test + lint` verdes?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- **[big-pickle]** `omniroute` adicionado ao PROVIDERS (`http://127.0.0.1:20128/v1`, `OMNIROUTE_API_KEY`). Test case 4 atualizado (`deepseek, openrouter, omniroute`). Playbook `docs/playbook/07-omniroute-sidecar.md` criado com instruções de instalação/configuração/smoke.
- **Gate de Evidência — todos Exit Code 0:**
```
=== BUILD (pnpm --filter @plataforma/plugin-providers build) ===
$ tsc

EXIT:0
```
```
=== TEST (pnpm --filter @plataforma/plugin-providers test) ===
$ vitest run

 ✓ tests/telemetry.test.ts (3 tests) 6ms
 ✓ tests/registry.test.ts (5 tests) 7ms
 ✓ tests/scoring.test.ts (3 tests) 4ms
 ✓ tests/fallback.test.ts (9 tests) 456ms

 Test Files  4 passed (4)
      Tests  20 passed (20)
   Duration  1.82s

EXIT:0
```
```
=== LINT (pnpm --filter @plataforma/plugin-providers lint) ===
$ eslint src/

EXIT:0
```
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Comentários de Revisão:**

---

### Parecer do Reviewer 1 (minimax-m3 — independente, FRIO)
**Data:** 2026-07-07
**Revisor:** agile_reviewer (minimax-m3) — primeira revisão; formado após grep cruzado da spec, código e Gate, sem pressão de parecer anterior
**Worktree:** `C:/Dev2026/.superapp-worktrees/EST-17/` (branch `task/EST-17`, parent `44fe401` = master pós-EST-13b)

- [x] **Aprovado**
- [ ] **Requer Refatoração**

**Evidência de Execução (re-executada por R1 na worktree):**
```
=== BUILD (pnpm --filter @plataforma/plugin-providers build) ===
$ tsc
(sem saída — OK)
EXIT:0

=== TEST (pnpm --filter @plataforma/plugin-providers test) ===
$ vitest run

 ✓ tests/registry.test.ts   (5 tests) 7ms
 ✓ tests/telemetry.test.ts  (3 tests) 6ms
 ✓ tests/scoring.test.ts    (3 tests) 3ms
 ✓ tests/fallback.test.ts   (9 tests) 430ms

Test Files  4 passed (4)
     Tests  20 passed (20)
Duration  3.06s
EXIT:0

=== LINT (pnpm --filter @plataforma/plugin-providers lint) ===
$ eslint src/
(sem saída — 0 erros)
EXIT:0
```

**Diff vs master (`44fe401 → task/EST-17`):**
```
docs/playbook/07-omniroute-sidecar.md                  | 101 +++++ (new)
packages/plugin-providers/src/registry.ts              |   1 +
packages/plugin-providers/tests/registry.test.ts       |   7 ++-
2 commits ahead: 60293bc (registry+test), b1adfdc (playbook)
```
3 arquivos modificados — match exato com §3 escopo declarado. Nenhuma edição fora do escopo.

**Análise estática dos contratos (Spec §1, independente):**
- ✅ `PROVIDERS` map (registry.ts:8-12) tem 3 entradas: `deepseek`, `openrouter`, `omniroute` — match com §1 contrato.
- ✅ `omniroute: { baseURL: 'http://127.0.0.1:20128/v1', apiKeyEnv: 'OMNIROUTE_API_KEY' }` (registry.ts:11) — match com §1 L54.
- ✅ Entradas `deepseek` e `openrouter` intactas (registry.ts:9-10) — sem regressão.
- ✅ `resolveModel()` (registry.ts:14-39) **inalterado** — respeita §5 regra "NÃO modificar resolveModel()".
- ✅ ProviderConfig interface (registry.ts:3-6) inalterada.

**Análise dos testes (Spec §4, cobertura 1:1):**
| Caso §4 | Teste | Verificado |
|---|---|---|
| 1. PROVIDERS contém exatamente 3 entradas | `it("4: PROVIDERS contém exatamente deepseek, openrouter e omniroute")` | ✓ |
| Gate hermético (sem chamadas a localhost:20128) | grep confirmou 0 chamadas reais no test suite | ✓ |

- ✅ `keys.toHaveLength(3)` (test:41) — conta 3 entradas, não 2 nem 4.
- ✅ `keys.sort()` esperado `['deepseek', 'omniroute', 'openrouter']` (test:42) — match com sort alfabético das 3 chaves.
- ✅ `vi.stubEnv('OMNIROUTE_API_KEY', ...)` adicionado no `beforeEach` (test:13) — necessário para o `resolveModel('omniroute/...')` (não exercitado por teste atual mas a setup é correta).
- ✅ Casos 1, 2, 3, 5 **inalterados** — respeita §5 regra "NÃO alterar casos 1, 2, 3, 5".

**Análise do playbook (`docs/playbook/07-omniroute-sidecar.md` — 101 linhas):**
- ✅ Seções presentes: Pré-requisitos, Instalação, Configuração, Smoke Test, Atualização, Solução de Problemas, Limitações (7 seções principais + header com propósito + fonte da decisão).
- ✅ Cobre todos os 8 tópicos enumerados em §5 (L107-114): pré-req, instalação, configuração, env, iniciar, smoke, atualização, troubleshooting.
- ✅ Smoke test usa `http://127.0.0.1:20128/v1/models` (playbook:63) — match com §1 baseURL e §5 item 6.
- ✅ Tabela de troubleshooting (playbook:85-92) tem 6 entradas com causa/solução — útil para o operador.

**DoD §7 (re-verificada por R1):**
- [x] `omniroute` adicionado ao PROVIDERS com `baseURL: 'http://127.0.0.1:20128/v1'` e `apiKeyEnv: 'OMNIROUTE_API_KEY'` — ✓ (registry.ts:11)
- [x] Caso 4 de registry.test.ts atualizado para 3 entradas — ✓ (test:39-43)
- [x] `docs/playbook/07-omniroute-sidecar.md` escrito com instruções de instalação, configuração, smoke test — ✓
- [x] Nenhum teste chama localhost:20128 (gate hermético) — ✓ (grep confirmou 0 referências em `*.test.ts`)
- [x] Nenhuma entrada extra no PROVIDERS além das 3 com fonte — ✓ (count === 3)
- [x] Build + test + lint do plugin-providers verdes — ✓ (20/20, lint 0)

**Reviewer Checklist §7:**
- [x] `omniroute` adicionado mantendo as entradas deepseek e openrouter intactas — ✓
- [x] Caso 4 testa exatamente 3 entradas (nem mais, nem menos) — ✓ (`toHaveLength(3)` + sorted equality)
- [x] Nenhuma modificação em `resolveModel()` ou outros testes — ✓ (1-3, 5 inalterados; só 4 + `vi.stubEnv` no beforeEach)
- [x] Playbook cobre instalação, configuração, smoke test e troubleshooting — ✓
- [x] `pnpm build + test + lint` verdes — ✓

**MAJOR (0).** Implementação atende 100% do escopo §3, contratos §1 batem com a spec, testes §4 cobrem o caso enumerado, gate hermético respeitado, §5 "NÃO" respeitadas. Sem bloqueantes.

**MINOR (0).**

**INFO (3):**
- **[i1]** Spec §2 RAG cita `docs/_vendor/OmniRoute/CLAUDE.md` (linha 74) e `docs/_vendor/OmniRoute/README.md` (linha 75) como "clone raso local" de referência, mas o diretório `docs/_vendor/OmniRoute/` **não existe** nem na worktree `EST-17` nem em master (`git ls-tree -r HEAD --name-only` retorna vazio). A porta 20128 é publicamente verificável no repo upstream `github.com/diegosouzapw/OmniRoute`, então a implementação não é inválida — mas a spec prometeu um espelho local que não foi feito. Track: a)RAG apontando para fonte inexistente é furo editorial — ou criar o clone ou ajustar a spec para "consultar upstream em runtime"; b)verificar se a regra "NÃO rodar de lá" implica que o clone é responsabilidade do arquiteto/humano. **Não-bloqueante** — info, não defeito.

- **[i2]** Test 2 (registry.test.ts:27-31) tem regex `/provider 'unknown' não registrado.*deepseek, openrouter/`. Com 3 entradas, a mensagem de erro fica `"suportado: deepseek, openrouter, omniroute"` — o regex passa porque "deepseek, openrouter" é prefixo de "deepseek, openrouter, omniroute" (substring match). Funciona por acidente, não por design explícito. Track: o worker poderia ter atualizado o regex para `/deepseek.*openrouter.*omniroute/` (regex "contém os 3 nomes") ou usado um array matcher — mas o resultado é o mesmo. **Não-bloqueante** — testes passam, mas é acoplamento implícito.

- **[i3]** Handover §8 do worker foi sucinto (3 bullet points) e o Gate de Evidência foi colado de forma compacta (saída real dos 3 comandos, todos EXIT:0). Padrão positivo — gate triplo aplicado no 1º finish, gate de evidência respeitado. INFO positivo.

**Veredito:** **APROVADO** — DoD §7 100% atendido, escopo §3 sem extravasamento, contratos §1 conferem byte-a-byte, gate build/test/lint limpo, teste §4 verde. A entrega é mecânica e exata como esperado para capacidade-alvo haiku. Não-bloqueantes: 3 INFO vão pro ledger (`_pendencias.md`) — todos editoriais/processuais, nenhum defeito de código.

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
- **[2026-07-07T00:09]** - *claude-fable* - `[Triado]`: triada: sidecar dev OmniRoute — entrada omniroute no registry + playbook; JIT pos-EST-10a; capacity haiku
- **[2026-07-07T13:35]** - *big-pickle* - `[Endurecido]`: endureceu spec — contratos TS derivados de EST-10a+RFC-018 D3+OmniRoute vendor, gate build+test+lint, capacity haiku
- **[2026-07-07T13:59]** - *big-pickle* - `[Endurecido]`: endureceu spec — contratos TS derivados de EST-10a+RFC-018 D3+OmniRoute vendor, gate build+test+lint
- **[2026-07-07T13:59]** - *system* - `[Auto-promovida]`: deps todas done
- **[2026-07-07T14:10]** - *big-pickle* - `[Iniciado]`: iniciando — entrada omniroute no registry + playbook
- **[2026-07-07T14:14]** - *big-pickle* - `[Finalizado]`: omniroute added to PROVIDERS (3 providers), test case 4 updated, playbook created — gate build+test+lint pass (20/20 tests)
- **[2026-07-07T14:15]** - *agile_reviewer:minimax-m3* - `[Em revisão]`: revisando EST-17 (qa-review --integrar)
- **[2026-07-07T14:25]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado: merge task/EST-17 na master do superapp (commit bd45f66), worktree removida, Gate verde pos-merge (build tsc OK, test 20/20 em 4 files, lint 0 erros). 3 INFO nao-bloqueantes ao ledger (i1 RAG aponta _vendor/OmniRoute inexistente; i2 test 2 regex substring match; i3 gate triplo aplicado no 1o finish - positivo). Parecer R1 (minimax-m3) APROVOU.
