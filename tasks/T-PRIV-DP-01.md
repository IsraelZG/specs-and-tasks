---
id: T-PRIV-DP-01
title: "SPIKE: Obfuscacao diferencial (Differential Privacy / OHTTP) como alternativa ao coorte minimo — ADR + PoC"
status: ready
complexity: 5
target_agent: crypto_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-101"] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: opus-spike # haiku | sonnet | opus-spike — preenchido no endurecimento (pass 2)
priority: deferred-low # parked no fim da fila — só sai se DP/OHTTP virar requisito de produto (decisão L-02, arquiteto 2026-07-03)
# decisions: ["..."]          ← só quando status: draft:pending_decision (espelha a Seção 6)
---

# T-PRIV-DP-01 · SPIKE: Obfuscacao diferencial (Differential Privacy / OHTTP) como alternativa ao coorte minimo — ADR + PoC

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
> **SPIKE PARKED (baixa prioridade, fim da fila).** Origem: decisão do arquiteto em `L-02` (2026-07-03),
> Alternativa 2. A escolha de produto foi Alt.1 (coorte mínimo hardcoded, k-anonymity — ver `L-02`); este
> spike registra a alternativa mais forte para o caso em que **coorte mínimo é inviável** mas ainda se quer
> proteger `IP/aparelho → indivíduo`.

Produzir um **ADR + PoC** avaliando **Obfuscação Diferencial** como mecanismo de privacidade genérico:
- **Differential Privacy** (ruído calibrado em relatórios de evento) e/ou **Oblivious HTTP (OHTTP)** (relay que
  desacopla identidade de rede do conteúdo do relatório, com cliques fake descartados financeiramente).
- **Generalizar além de anúncios** (pedido explícito do humano): a mesma primitiva deve servir a qualquer
  cenário de "relatório/telemetria sensível de um device" onde o coorte mínimo `k` não é aplicável — ex.:
  métricas de módulo, medição de eventos assinados, segmentação hiper-local legítima (a "padaria do prédio
  vizinho" que o k-anonymity bloqueia).

**Entregável do spike (critério de saída):** ADR decidindo DP vs OHTTP vs híbrido, com o parâmetro de privacidade
(ε para DP / topologia de relay para OHTTP), o custo de implementação, e um PoC que demonstre um relatório de
evento protegido round-trip. Sem isso, não vira task de implementação.

### Contratos exatos (assinaturas TS fixadas)

```ts
// === packages/crypto/src/poc/differential-privacy.ts ===

/** Adds Laplace noise to a numerical value for differential privacy.
 * Formula: Y = value + noise, where noise is drawn from Laplace(0, scale)
 * scale = sensitivity / epsilon
 * @param value The numerical metric to perturb.
 * @param epsilon Privacy parameter (lower means more privacy/more noise).
 * @param sensitivity Maximum change a single user's data can cause.
 */
export function addLaplaceNoise(value: number, epsilon: number, sensitivity: number): number;

/** Aggregates a list of perturbed values to compute their average. */
export function aggregatePerturbedValues(values: number[]): number;

// === packages/crypto/src/poc/ohttp.ts ===

export interface EncapsulatedRequest {
  kemPublicKey: Uint8Array; // Client's ephemeral public key
  ciphertext: Uint8Array;   // Encrypted payload
  nonce: Uint8Array;        // AEAD nonce used
}

/** Client encapsulator: encrypts a payload for the server using HPKE-like scheme. */
export function encapsulateOhttp(
  payload: Uint8Array,
  serverPublicKey: Uint8Array
): Promise<EncapsulatedRequest>;

/** Server decapsulator: decrypts the client payload using its private key. */
export function decapsulateOhttp(
  encRequest: EncapsulatedRequest,
  serverPrivateKey: Uint8Array
): Promise<Uint8Array>;
```

## 2. Contexto RAG (Spec-Driven Development)
- [x] [docs/implementation_plan.md](file:///c:/Dev2026/Docs/docs/implementation_plan.md#L57) L-02 — Alternativa 2 (obfuscação diferencial) e trade-offs
- [x] [tasks/L-02.md](file:///c:/Dev2026/Docs/tasks/L-02.md) — decisão que escalou este spike (Seção 6)
- [x] [docs/caderno-3-sdk/29-anuncios-reference-spec.md](file:///c:/Dev2026/Docs/docs/caderno-3-sdk/29-anuncios-reference-spec.md#L23) — k-anonimato na segmentação (§3.4)
- [x] [docs/conceitos/anuncio.md](file:///c:/Dev2026/Docs/docs/conceitos/anuncio.md) — coorte mínimo

## 3. Escopo de Arquivos (Inputs e Outputs)
*(Defina EXATAMENTE quais arquivos o agente deve ler, criar ou modificar. Não edite arquivos fora deste escopo)*
- **[READ]** `docs/implementation_plan.md` (L-02 e trade-offs)
- **[READ]** `docs/caderno-3-sdk/29-anuncios-reference-spec.md` (§3.4 sobre garantias de privacidade)
- **[READ]** `packages/crypto/package.json` (dependências e infraestrutura de crypto)
- **[CREATE]** `docs/adr/0019-differential-privacy-ohttp.md` — ADR avaliando DP vs OHTTP vs híbrido, ε, topologia de relay e custos.
- **[CREATE]** `packages/crypto/src/poc/differential-privacy.ts` — PoC de Differential Privacy com ruído Laplace.
- **[CREATE]** `packages/crypto/src/poc/ohttp.ts` — PoC de OHTTP com encapsulação HPKE-like.
- **[CREATE]** `packages/crypto/tests/poc-privacy.test.ts` — Casos de teste automatizados em Vitest.

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node puro).
- [x] **Métricas/Cobertura:** Validar 100% dos caminhos lógicos nas funções do PoC.
- [x] **Ambiente do Teste:** Node puro (ambiente de linha de comando, sem JSDOM nem browser).
- [x] **Fora de Escopo:** Chamadas a servidores HTTP reais, conexões de rede reais ou pacotes de produção externos de OHTTP (hand-rolled PoC encapsulado sobre noble).

Casos de teste (numerados):
1. `addLaplaceNoise` perturba valores e retorna valores estatisticamente diferentes em chamadas consecutivas.
2. `addLaplaceNoise` com epsilon alto (e.g. 10.0) produz ruído significativamente menor do que com epsilon baixo (e.g. 0.1).
3. Agregação de 1000 valores perturbados com ruído Laplace aproxima-se do valor real esperado dentro de uma margem estatística (utility check).
4. `encapsulateOhttp` + `decapsulateOhttp` roundtrip criptografa e descriptografa com sucesso uma mensagem string convertida para Uint8Array.
5. `decapsulateOhttp` rejeita ou lança erro ao tentar decifrar com a chave privada errada.
6. `decapsulateOhttp` lança erro se o `ciphertext` ou `nonce` for adulterado (1 bit alterado).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** instale bibliotecas adicionais de criptografia ou rede (use `@noble/curves`, `@noble/hashes` e `WebCrypto` que já são padrão no pacote).
> - **NÃO** misture os arquivos do PoC com o código de produção de anúncios; mantenha-os isolados em `poc/`.
> - **NÃO** utilize APIs de rede reais (simular o OHTTP relay em memória nos testes).

### Pegadinhas conhecidas
- Certifique-se de que a geração de ruído Laplace em `addLaplaceNoise` lida corretamente com as extremidades do intervalo de números aleatórios `Math.random()`.
- Ao implementar o ECDH para OHTTP, certifique-se de que o segredo compartilhado é derivado corretamente usando HKDF-SHA256 para evitar chaves de tamanho impróprio para o AEAD.

1. **[TDD]** Crie `packages/crypto/tests/poc-privacy.test.ts` implementando os 6 casos de teste especificados na Seção 4.
2. Implemente a função de ruído Laplace em `packages/crypto/src/poc/differential-privacy.ts`.
3. Implemente a encapsulação/decapsulação OHTTP baseada em X25519 e AES-256-GCM / ChaCha20-Poly1305 em `packages/crypto/src/poc/ohttp.ts`.
4. Crie o ADR detalhado em `docs/adr/0019-differential-privacy-ohttp.md` apresentando a análise comparativa DP vs OHTTP vs Híbrido, parâmetros recomendados, topologia e estimativa de esforço.
5. Valide que todos os testes passam rodando `pnpm --filter @plataforma/crypto test`.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **DERIVADO (com fonte):**
> - Assinaturas OHTTP baseadas em HPKE derivam de `docs/adr/ADR-noise-xx.md` (decisão D2: suíte `@noble/*` isomórfica e leve).
> - Mecanismo de ruído de Differential Privacy deriva de `docs/implementation_plan.md` L-02 (Alternativa 2) e `docs/caderno-3-sdk/29-anuncios-reference-spec.md#L28` (§3.4).
> - O status da task L-02 é `ready`, definindo que o coorte mínimo k-anonymity (N=100) é a solução inicial de produção e que DP/OHTTP é um spike futuro alternativo.
> - A dependência com `T-101` garante que os wrappers cripto básicos estejam disponíveis para a suíte noble.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O arquivo de ADR `docs/adr/0019-differential-privacy-ohttp.md` foi criado e contém análise técnica completa de DP (ε), OHTTP e modelo híbrido.
- [ ] O código do PoC de Differential Privacy e OHTTP segue as assinaturas TS especificadas na Seção 1.
- [ ] O arquivo `packages/crypto/tests/poc-privacy.test.ts` implementa os 6 casos de teste enumerados na Seção 4.
- [ ] O `pnpm test` e o build rodam com sucesso para o escopo do pacote `@plataforma/crypto`.
- [ ] Linter (`pnpm lint`) não acusa problemas.

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter @plataforma/crypto build      # tsc — precisa terminar sem erro
pnpm --filter @plataforma/crypto test       # precisa ficar verde, sem regressão
pnpm --filter @plataforma/crypto lint       # precisa passar sem erros
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.

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
- **[2026-07-17T19:17]** - *gemini* - `[Triado]`: triada
- **[2026-07-17T19:18]** - *gemini* - `[Endurecido]`: endureceu spec
- **[2026-07-17T19:18]** - *system* - `[Auto-promovida]`: deps todas done
