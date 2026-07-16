---
campaign_id: FUGU-01
status: PRONTA
created: 2026-07-14
updated: 2026-07-14
executor: sakana/fugu-ultra
reviewer: agile_reviewer
tasks:
  - id: T-1032
    predecessor: null
    base_ref: master
    stack_base_sha: null
    review_base_sha: 05af6938c593337229f6eb0d4676f4bac948422f
    position: 1
    gates:
      - pnpm --filter @plataforma/protocol build && test && lint
      - pnpm --filter @plataforma/transport build && test && lint
  - id: T-1046
    predecessor: T-1032
    base_ref: task/T-1032
    stack_base_sha: 6a8f1161b29e832b418571d00f29b10b7d823dca
    review_base_sha: af63dd38d99f6b186c8a1ffff475536326e3b717
    position: 2
    gates:
      - pnpm --filter @plataforma/protocol build && test && lint
      - pnpm --filter @plataforma/transport build && test && lint
      - pnpm --filter @plataforma/core build && test && lint
  - id: T-1039
    predecessor: null
    base_ref: master
    stack_base_sha: null
    review_base_sha: 05af6938c593337229f6eb0d4676f4bac948422f
    position: 3
    gates:
      - pnpm --filter @plataforma/core build && test && lint
---
# Campanha FUGU-01 — Fechamento do sync real do Core (RBSR + authz)

> Manifesto de campanha encadeada conforme **ADR 0017** (branch stack, sem novo estado no MGTIA).
> Prefixo `_` = este arquivo é invisível aos parsers de task. Criado 2026-07-14 (claude-fable).
> **Status: PRONTA** — tooling validado em repositório descartável; os SHAs trunk foram atualizados
> para o master observado em 2026-07-14. Se master mover antes do despacho, recrie as worktrees e
> registre a base real antes de `start`.
> **Executor previsto:** `sakana/fugu-ultra` (worker único, serial). **Reviewer:** independente do
> executor (ex.: `agile_reviewer:minimax-m3` ou `agile_reviewer:claude-sonnet`) — NUNCA o Fugu.

## Objetivo

Fechar a capability nº 2 e metade da nº 4 da matriz de fechamento Core+Bancada
(`docs/fechamento-core-bancada.md`): hoje o RBSR **só troca fingerprints** — nenhum `SignedNode`
real cruza o fio (`encodeNodesResponse` envia `{id, fp}`; `applyNodes` está desligado do exchange)
e o responder serve **qualquer** peer sem checar UCAN. Ao fim da campanha: peer sem UCAN não recebe
nem fingerprint (T-1032), nós reais são transferidos e aplicados sob escopo (T-1046), e a custódia
de archive deixa de aceitar magic-string (T-1039).

**T-609 removida da campanha** (2026-07-14): está `draft:pending_decision` com D1 aberta (adicionar
dependência WASM ao core vs. implementar avaliador mínimo). Volta quando reendurecida e validada.

## Elos (ordem topológica de execução, review e integração)

| # | Task | Status pré | Base da branch | Pacotes/arquivos | Colisão |
|---|---|---|---|---|---|
| 1 | [T-1032](./T-1032.md) | ready (§4/§5 endurecidos 2026-07-14) | `master @ f841894ec210a0430c36ce7dd609e05285e09af9` | `protocol/src/rbsr/exchange.ts`, `transport/src/syncCoordinator.ts`, testes | — |
| 2 | [T-1046](./T-1046.md) | draft:hardened; admissão staged após elo 1 em review | `task/T-1032 @ pending` até a criação da worktree | os MESMOS arquivos do elo 1 (por isso o stack) | herda elo 1 |
| 3 | [T-1039](./T-1039.md) | ready (§4 endurecido 2026-07-14) | `master @ f841894` (trunk; independente dos elos 1–2) | `core/src/archive/assignCustodian.ts`, testes | nenhuma |

Após o elo 1 chegar a `review`, criar a worktree do elo 2 e rodar
`campanha.mjs register-stack-base ... T-1046 task/T-1032`. Essa base acompanha o predecessor até a
integração. Após o transplante para master, registrar separadamente `review_base_sha`; é contra ela
que o QA diffa.

- Worktrees: `rtk pnpm wt new T-1032` · `rtk pnpm wt new T-1046 --base task/T-1032` · `rtk pnpm wt new T-1039`.
- T-1046 está `draft:hardened` porque T-1032 ainda não está `done`. A exceção é local à campanha:
  após T-1032 chegar a `review`, `can-start` valida bases/deps externas; só então T-1046 é promovida
  explicitamente, iniciada e implementada como staged. Ela permanece `in_progress` até T-1032 done.

## Gates

**Individual (por elo, na worktree do elo, saída literal na §8):**
- T-1032: `pnpm --filter @plataforma/protocol build && test && lint` + `pnpm --filter @plataforma/transport build && test && lint`
- T-1046: protocol + transport + core, todos em build/test/lint, além dos casos §4 verdes
- T-1039: `pnpm --filter @plataforma/core build && test && lint`

**Cumulativo (após CADA elo, na worktree do elo mais recente do stack):**
`pnpm turbo run build` (raiz) — sem warning de ciclo, exit 0. Se o cumulativo quebrar algo que o
individual não pegou → conserte no elo atual ANTES do finish; não empurre para o próximo.

## Condições de aborto (campanha PARA e pausa o elo corrente com o motivo literal)

1. Qualquer necessidade de **inventar contrato** (shape de mensagem, campo de sessão) não coberto
   por T-1032 §3 / T-1046 §6 (D1–D4) → `pause` + escalar; NÃO improvisar.
2. O padrão de injeção (portas em protocol, wiring em transport) não fechar sem import
   `protocol → core` → `pause` (é decisão de arquiteto — a direção de T-1033 é INVIOLÁVEL).
3. Gate cumulativo vermelho por causa alheia ao elo (master moveu, flake de infra) → `pause`,
   registrar sha do master observado.
4. 2 tentativas falhas do MESMO teste do §4 do elo → `pause` com o diff e a saída (não martelar).

## Checkpoints e retomada idempotente

- Commits frequentes (`wip(T-XXXX): ...`) + push da branch a cada unidade fechada.
- Estado durável = status MGTIA por elo + branches/shas no git + este manifesto. Retomar =
  `git worktree list` + `grep '^status:' tasks/T-{1032,1046,1039}.md` + último log §9 de cada.
- Antes de retomar o elo N: `git rev-parse task/<PRED>` == base registrada acima? Se não → regra
  de invalidação abaixo.

## Review e integração (estritamente topológicas)

1. Reviewer independente revisa T-1032 contra seu `review_base_sha`; integrador aprova/mergeia.
2. Com T-1032 `done`, retomar T-1046 ainda `in_progress`: `git rebase --onto master
   <stack_base_sha> task/T-1046`, registrar `review_base_sha=master`, re-gate e rodar `can-finish`.
3. Só depois chamar `finish`; reviewer revisa T-1046 contra o novo `review_base_sha`; integrador
   valida a mesma base e integra. QA nunca ocorre antes do transplante.
4. T-1039: fluxo normal (base master), em qualquer ordem após 1–2.
- Falha/`request_changes` em T-1032 **bloqueia** review final e integração de T-1046 (descendente
  no stack). T-1039 NÃO é afetada (base trunk — nunca consumiu os commits rejeitados).

## Regra de invalidação/rebase (ADR 0017 §5)

`request_changes` em T-1032 ⇒ T-1046 NÃO vai para rework (não há Parecer contra ela): permanece
`in_progress` staged. Se o head de `task/T-1032` mudar, `check-base` falha; o worker faz
`git rebase --onto task/T-1032 <stack_base_sha-antigo> task/T-1046`, registra o novo stack SHA e
re-roda o gate. Transitivo, nunca global.

## Risco e contexto

- **Risco técnico principal:** quebra de wire consciente do `MSG_NODES_RESPONSE` (D3 — JSON→codec).
  Contida: os dois lados mudam na mesma task (T-1046); nenhum peer externo fala esse wire ainda.
- **Risco de processo:** é a primeira campanha ADR-0017 — o stack tem 2 elos apenas (1→2); 3 é
  trunk-based de propósito para minimizar a superfície de invalidação.
- **Contexto estimado:** specs somam ~800 linhas; código tocado ~6 arquivos por elo; cabe numa
  sessão de worker por elo. `execution_mode: sequential` em todas.
- **Custo/segurança:** worker único serial; sem toggle de `max_concurrent`; kill-switch do
  orquestrador intocado; breaker herdado (`max_review_cycles: 3`).

## Prompt final para `sakana/fugu-ultra`

```
Você é o worker único da campanha FUGU-01 (manifesto: tasks/_campanha-fugu-01.md — releia-o
inteiro antes de qualquer ação; ele prevalece sobre este resumo). Repos: controle=C:\Dev2026\Docs
(NUNCA rode git aqui; persista via `node tools/scripts/fila.mjs add <ID> "<msg>"`), código=
C:\Dev2026\superapp (git normal DENTRO da worktree de cada task).

Identidade nas transições: `fugu-ultra` (modelo real; nunca harness, nunca papel).

Modo staged (INVIOLÁVEL):
- Elo 1 (T-1032): crie a worktree trunk, rode `register-review-base ... T-1032 master` e
  `can-start`, então siga o ciclo normal até `finish` → `review`.
- Elo 2 (T-1046): assim que T-1032 estiver `review|in_review|done`, crie com
  `rtk pnpm wt new T-1046 --base task/T-1032`; registre o stack SHA e admita com:
  `rtk node tools/scripts/campanha.mjs register-stack-base tasks/_campanha-fugu-01.md T-1046 task/T-1032`;
  `rtk node tools/scripts/campanha.mjs can-start tasks/_campanha-fugu-01.md T-1046`;
  `rtk node tools/scripts/manage-task.mjs promote T-1046 fugu-ultra "admissao staged FUGU-01"`;
  `rtk node tools/scripts/manage-task.mjs start T-1046 fugu-ultra "inicio staged FUGU-01"`.
  Implemente, commite, pushe e rode gates. Se T-1032 ainda não estiver `done`, chame `pause` com
  "staged — implementação pronta" e NÃO chame `finish`.
- Elo 3 (T-1039): trunk-based; registre/valide a review base como no elo 1 e conclua após a
  implementação staged do elo 2.

Esta primeira passada termina com T-1032 e T-1039 em `review`, e T-1046 `in_progress` staged com
código/gates prontos. Após T-1032 `done`, um worker retoma T-1046:
1. `rtk git rebase --onto master <stack_base_sha> task/T-1046`.
2. `rtk node tools/scripts/campanha.mjs register-review-base tasks/_campanha-fugu-01.md T-1046 master`.
3. Re-rode gate individual + cumulativo e `campanha.mjs can-finish`.
4. Só então chame `finish`; QA acontece depois, contra `review_base_sha`.

Regras INVIOLÁVEIS: as condições de aborto do manifesto param TUDO com `pause` + motivo literal;
você NUNCA chama approve/request_changes; NUNCA edita arquivo de outra task; NUNCA trata um teste
vermelho como "flake" sem 2 execuções idênticas; contrato ausente = pause, não invenção. Se um
predecessor entrar em rework enquanto você está num descendente do stack, aplique a regra de
invalidação do manifesto (rebase --onto + re-gate), não prossiga sobre base stale.

Ao final de cada elo, relate: task, branch, sha final, placar de testes, e o que o próximo agente
precisa saber. PARE após o elo 3 — review e integração são de outros agentes.
```

## Pós-campanha (fora do escopo do Fugu)

- Review/integração topológicas (seção acima) por reviewer independente.
- Com T-1046 done: reendurecer T-BW-02 (wiring da aba Sync) e T-902 (suíte adversarial, vetor 6).
- T-609: quando reendurecida e validada, pode entrar em campanha separada ou ser adicionada como
  elo 4 se a decisão D1 for favorável.

## Validação do tooling (antes de executar)

Antes de despachar o Fugu, valide o tooling de campanha:

```bash
# 1. Valida o manifesto
rtk node tools/scripts/campanha.mjs validate tasks/_campanha-fugu-01.md

# 2. Verifica estado da campanha
rtk node tools/scripts/campanha.mjs state tasks/_campanha-fugu-01.md

# 3. Verifica T-1046 (antes de T-1032 review deve falhar; depois de registrar a base deve passar)
rtk node tools/scripts/campanha.mjs can-start tasks/_campanha-fugu-01.md T-1046

# 4. Verifica se a base empilhada ainda coincide com o predecessor
rtk node tools/scripts/campanha.mjs check-base tasks/_campanha-fugu-01.md T-1046
```

Se algum comando falhar inesperadamente, corrija o tooling antes de executar a campanha.
