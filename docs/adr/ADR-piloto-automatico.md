# ADR — Piloto Automático (Runner de Ondas / Torre de Controle)

- **Status:** Aceito (arquitetura) · recipe de invocação **resolvida pela pesquisa da spike
  T-1017** (2026-06-16) · falta só a **validação empírica** (1 task ponta-a-ponta rodada de
  verdade — T-1017 continua `draft`/em andamento até essa evidência existir)
- **Data:** 2026-06-15 (atualizado 2026-06-16)
- **Contexto-fonte:** vínculo com T-1010..T-1019 (ledger MGTIA, REST/MCP, worktree, merge cycle)

## Contexto

O ciclo MGTIA `worker → review → rework` hoje exige um humano para: passar prompts de
kickoff/rework e **validar o veredito do QA** (um QA leve pode aprovar com teste vermelho ou
rejeitar sem rodar nada). Queremos um **runner** que percorra o grafo de tasks em ondas,
dispare os agentes (Claude=arquiteto/forte; DeepSeek/Gemini=worker/reviewer via OpenCode),
e só chame o humano em condições de exceção bem definidas.

O **único bloco realmente incerto** é *como invocar cada agente externo em modo headless*
(OpenCode com modelo escolhido, `cwd` num worktree, e como ele reporta de volta). Isso fica
isolado na spike **T-1017** (PoC). Todo o resto é determinístico.

## Decisão

### Princípio central
O runner **não confia no auto-relato dos agentes** para "verde". Ele é dono da verdade:
re-roda a verificação (`build`+`test`) ele mesmo, no worktree da task, antes de aceitar uma
aprovação. Um "approved com teste vermelho" torna-se estruturalmente impossível.

### Defaults decididos
1. **Estado híbrido:** agentes auto-reportam `start/finish/pause` via o ledger central
   (mantém a convenção e o log legível); o runner é dono de **spawn + gate + contador de
   rework + escalada**. (Não migramos para "runner dono de todas as transições".)
2. **Gate determinístico re-roda os testes** — não confia na saída colada pelo agente.
3. **Modo supervisionado por padrão** (confirma antes de cada spawn/merge); autopilot é opt-in.
4. **Concorrência inicial K=1** (serial); paralelismo é fase posterior.

### Separação que habilita paralelismo: ledger central, código isolado
| O quê | Onde mora | Acesso do agente |
|---|---|---|
| Estado/log (status, parecer) | **um** ledger no repo principal | `NEXUS_ROOT_DIR=<repo principal>` |
| Código (src, testes) | worktree por task | `cwd=.nexus-worktrees/T-XXXX` |

`TaskService` já desacopla `rootDir` (ledger) do `cwd` (código), então o agente edita código
isolado no worktree mas escreve status sempre no ledger central.

### Componentes (todos em `apps/nexus-backend/src/runner/`)
- **Scheduler** (`scheduler.ts`) — calcula o ready-set (deps `done`, não bloqueada) e escolhe
  o lote. Puro/determinístico. → task T-1020.
- **Gate de verificação** (`verify-gate.ts`) — roda os comandos de "Verificação automática"
  no worktree e devolve `{ ok, output }`. → task T-1021.
- **Agent adapter** (`agent-adapter.ts`) — interface `AgentAdapter` + `CommandAdapter`
  genérico (template de comando por papel, vindo de config/env). A recipe específica do
  OpenCode/Claude é **config**, validada pela spike T-1017. → task T-1022.
- **Runner core** (`runner.ts`) — o loop serial supervisionado que costura os três acima
  com o `TaskService`. → task T-1023.

### O loop por task (dirigido pelo runner)
```
pick(task)  # ready-set
  └─ spawn WORKER (cwd=worktree, NEXUS_ROOT_DIR=central) → ledger deve virar 'review'
  └─ GATE (runner roda build+test no worktree)
        ├─ vermelho → request_changes automático (anexa saída) → rework++ → volta ao worker
        └─ verde → spawn REVIEWER (julga mérito/cobertura/escopo)
              ├─ request_changes → rework++ → volta ao worker (lê Parecer da task)
              └─ approve → (gate final) → done → destrava dependentes
  rework > N(=2) → ESCALA
```

### Escalada ao humano (únicos pontos de intervenção)
1. `rework` > N (default 2). 2. Agente chamou `pause`/`blocked`. 3. Gate ↔ veredito divergem.
4. Conflito de merge (`done→blocked`, T-1019). 5. Subprocesso travou/timeout ou não moveu o
estado esperado. 6. Task `opus-spike` na fila (política: modelo forte/humano).

### Paralelismo e merges (fases posteriores)
- Pool de K slots, cada um um worktree; ready-set prefere tasks de **escopo de arquivo
  disjunto** (declarado na seção 3 das specs).
- **Merges serializados** na trunk; conflito → `blocked` + escala; pós-merge, worktrees de
  dependentes são recriados a partir da trunk atualizada.

### Observabilidade e segurança
- Torre = Board (T-1013, lê o ledger central ao vivo) + `wave.log` append-only.
- Caps: `--max-concurrency`, `--max-rework`, `--dry-run`, kill-switch.
- Gates de I/O externo: `NEXUS_WORKTREE_ENABLED`, `NEXUS_PUSH_ENABLED`. Segredos só via env.

## Plano faseado
| Fase | Entrega | Depende de |
|---|---|---|
| 0 — Spike | Recipe de invocação OpenCode + 1 task ponta-a-ponta | **T-1017** |
| 1 — Loop serial supervisionado | scheduler + gate + adapter + runner-core | T-1020..T-1023 |
| 2 — Merge + autopilot | merge no approve, autopilot, kill-switch | T-1019 + Fase 1 |
| 3 — Paralelo | pool K>1, ready-set por escopo, rebase pós-merge | Fase 2 |
| 4 — Roteamento multi-modelo | adapters Claude+OpenCode por Capacidade-alvo | Fase 1 |

## Recipe de invocação OpenCode (resolvida pela pesquisa da T-1017 em 2026-06-16)

As 6 perguntas abertas têm resposta. **Falta a validação empírica** (instalar, autenticar,
rodar 1 task ponta-a-ponta) — isso é o que resta para fechar a T-1017; o design abaixo não é
mais incerto.

1. **Modo headless?** Sim — `opencode run "<prompt>"` (scriptável, sem TUI).
2. **Modelo por execução?** `--model provider/model`.
3. **DeepSeek/Gemini disponíveis?** Sim, via `opencode auth login` (75+ provedores, credenciais
   locais). **Ressalva crítica:** o OpenCode removeu login via Claude Pro/Max (disputa com a
   Anthropic) — o papel **architect** em Claude via OpenCode exige **chave de API Anthropic
   direta**, não a sessão Pro/Max. Worker/reviewer em DeepSeek/Gemini não são afetados.
4. **`cwd` num worktree?** Sim — `--dir <worktree>`.
5. **Como reporta de volta?** Não há protocolo de report nativo do OpenCode que case com o
   ledger. **Confirma o "estado híbrido" já decidido:** o agente continua se autoreportando via
   ledger (MCP `nexus_transition_task`/`manage-task.mjs`); o runner não confia nisso — o exit
   code do processo só diz que ele terminou, e o **Gate de verificação re-roda build+test** de
   qualquer forma (princípio central desta ADR, inalterado).
6. **Recomendação:** seguir. O bloco de design não é mais incerto; falta só prova empírica.

### Templates de comando (para `NEXUS_AGENT_CMD_WORKER/REVIEWER/ARCHITECT`, consumidos pelo `CommandAdapter` da T-1022)
```bash
NEXUS_AGENT_CMD_WORKER='opencode run --model deepseek/deepseek-chat --agent worker --dir {cwd} "Execute a task {taskId}. Leia tasks/{taskId}.md, implemente conforme escopo, rode o verify, reporte start/finish no ledger via MCP."'

NEXUS_AGENT_CMD_REVIEWER='opencode run --model google/gemini-2.5-pro --agent reviewer --dir {cwd} "Revise a task {taskId}. Julgue mérito/cobertura/escopo. Dê approve ou request_changes no ledger via MCP."'

NEXUS_AGENT_CMD_ARCHITECT='opencode run --model anthropic/claude-... --agent architect --dir {cwd} "..."'  # requer chave API Anthropic direta (ver ressalva #3)
```
(Placeholders `{taskId}`/`{role}`/`{cwd}` já são exatamente os substituídos por
`replacePlaceholders()` em `agent-adapter.ts` — os templates acima encaixam sem mudança no adapter.)

### Otimização prevista para a Fase 3 (pool K>1)
Em vez de `opencode run` frio por task, considerar **um `opencode serve` por slot do pool**
(porta derivada do índice do slot), com os `run` daquele slot anexando via `--attach
http://localhost:PORT`. Resolve cold-start e dá isolamento de sessão por slot — combinar com o
isolamento de runtime ainda pendente (`TEST_DB_PATH=:memory:` + portas por slot) para o
paralelismo não reintroduzir o bug do vitest. Não é bloqueio da Fase 1 (K=1).

### Headroom dentro do OpenCode (Fase 3/4 — não bloqueia a PoC nem a Fase 1)
O OpenCode não tem `headroom wrap` dedicado (a lista oficial cobre claude/codex/cursor/aider/
copilot). Dois caminhos limpos, que **atacam camadas diferentes** e não são mutuamente
exclusivos:
- **Opção A — proxy OpenAI-compatível (recomendada como base):** apontar a base URL do provedor
  no `opencode.json` para `http://localhost:8787` (o mesmo proxy Headroom da T-1018/ADR-headroom).
  Zero código; comprime todo o tráfego do agente (prompts, saídas de ferramenta, histórico) e
  ganha o `CacheAligner` de graça. Custo: o proxy precisa estar de pé como dependência de runtime.
- **Opção B1 — manter como está:** o RAG do próprio Nexus continua dono da sua compressão via
  `Compressor`/`getCompressor()` (T-1018); o agente só consome a tool MCP. Não precisa de nada
  novo.
- **Evitar Opção B2** (registrar o MCP server do Headroom direto no OpenCode, dando ao agente
  controle explícito de CCR) a menos que surja necessidade real — duplica a responsabilidade que
  o `Compressor` já centraliza.
- **Regra a preservar quando isso for implementado:** nunca comprimir a spec da task
  (assinaturas, comandos exatos do gate) — é texto normativo, não histórico/RAG; Kompress é
  lossy. Só contexto auxiliar passa pelo proxy.
- Decisão formal (se/quando a Fase 3/4 chegar): registrar como ADR-piloto-automatico §Fase 4 ou
  ADR dedicado — não decidir agora, são perguntas de operação (1 proxy por ambiente vs. por slot;
  provisão dos assets ONNX/HF no ambiente do runner; deprecar `headroom.client.ts` legado em
  favor de `Compressor`+proxy — este último já é o plano da T-1016, sem conflito).

### Próximo passo concreto para fechar a T-1017 (validação empírica, não design)
1. `pip install "headroom-ai[all]"` + `headroom proxy --port 8787` (opcional nesta fase — só
   necessário se for testar o tráfego comprimido; não bloqueia o teste do OpenCode em si).
2. Instalar OpenCode, `opencode auth login` (DeepSeek/Gemini).
3. Rodar `opencode run --model ... --agent worker --dir <worktree-de-uma-task-real> "<prompt>"`
   e confirmar: (a) edita no worktree; (b) reporta status no ledger via MCP; (c) o
   `verify-gate` (T-1021) pega o resultado; (d) nenhuma surpresa de exit code/timeout.
4. Congelar os 3 templates de env acima a partir do que de fato funcionou (podem precisar de
   ajuste fino de sintaxe de aspas/escaping ao passar pelo `shell:true` do `CommandAdapter`).

## Consequências
- (+) Remove ~80% do atrito humano já na Fase 1 (sem prompts, sem validar QA à mão).
- (+) Qualidade garantida por gate determinístico, não por confiança no agente.
- (−) Acopla o projeto a um runtime de agente externo (mitigado: `CommandAdapter` genérico).
- (−) Integração paralela traz o problema clássico de merge (mitigado: serialização + escala).
