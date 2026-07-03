---
id: ORQ-06
title: "Painel unificado :8780 (headrooms + dispatch + instâncias + ledger + saldos) + cloudflared"
status: done
complexity: 5
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["ORQ-01", "ORQ-03", "ORQ-04"] # ledger json + saldos + registry/dispatch
blocks: ["ORQ-07"] # a UI na nuvem (B) reusa esta mesma API JSON
capacity_target: sonnet
---

# ORQ-06 · Painel unificado :8780 + cloudflared

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+ (`node:http`, stdlib). Sem deps npm. `cloudflared` (binário) p/ o item de túnel.
- **Tarefa de TOOLING do CONTROLE (Docs).** Implemente direto no Docs. Persista via
  `node tools/scripts/fila.mjs add ORQ-06 "<msg>" scripts/headroom-proxies.mjs docs/playbook/painel-remoto.md`.
  Identidade = modelo real.
- **Gate adaptado:** evidência = `curl` nas rotas (§7).

## 1. Objetivo
Unificar numa **tela única** o que hoje está espalhado: o dashboard de headrooms (já em `:8780`) +
despacho do orquestrador + instâncias rodando + ledger por status + saldos dos provedores. Estende o
servidor HTTP existente do `headroom-proxies.mjs dashboard` com novas rotas JSON e uma página que as
consome. Documenta o acesso remoto via **cloudflared** (túnel nomeado + Cloudflare Access).

## 2. Contexto RAG (Spec-Driven Development)
- [ ] `scripts/headroom-proxies.mjs` — já tem `cmdDashboard(port)` com `createHttpServer` em
      `127.0.0.1:8780`, rotas `/api/status`, `/api/start|stop/<name>`, e uma página HTML inline.
      **ESTENDA esse server** (não crie outro) com as rotas novas.
- [ ] [ORQ-01](./ORQ-01.md) `ledger.mjs --json`; [ORQ-03](./ORQ-03.md) `saldo.mjs --json`;
      [ORQ-04](./ORQ-04.md) registry `tasks/.orchestrator/*.json` + `orquestrar.mjs --once`.
- [ ] Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:8780` (quick) ou tunnel **nomeado**
      + `access` policy (gate por e-mail). Documentar, não automatizar a conta.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `scripts/headroom-proxies.mjs` — no handler do dashboard, adicione:
  - `GET /api/ledger`  → `execFileSync('node',['tools/scripts/ledger.mjs','--json'])` (passa querystring
    de filtro adiante: `?status=review` etc.).
  - `GET /api/instances` → conteúdo de `tasks/.orchestrator/*.json` (com prune de PID morto).
  - `GET /api/saldo`   → `saldo.mjs --json` (se falhar, `[]`).
  - `POST /api/dispatch` → `execFileSync('node',['tools/scripts/orquestrar.mjs','--once'])`; responde o
    plano/resultado.
  - **HTML:** uma seção nova na página: tabela de instâncias (task/model/role/desde), ledger agrupado
    por status, cartões de saldo, botão **"Despachar"** (POST /api/dispatch) e o status dos proxies (já existe).
- **[CREATE]** `docs/playbook/painel-remoto.md` — passo-a-passo do cloudflared (quick tunnel p/ teste +
  tunnel nomeado com Access p/ uso real; como restringir por e-mail).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Self-check por `curl`** (§7): cada rota nova responde JSON válido; `/api/instances` reflete o
  registry; o HTML carrega. Túnel = verificação manual documentada (não no Gate automático).
- [x] **Fora de escopo:** a UI na nuvem/WS (ORQ-07); auth além do Cloudflare Access (documentado).

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ NÃO FAZER:** NÃO crie um segundo servidor — estenda o `:8780` existente. NÃO bloqueie o event
> loop com `execFileSync` pesado em rota quente (ledger é rápido; ok). NÃO exponha sem Access em uso
> real (documente o risco). NÃO rode git no Docs — enfileire.

1. Estenda o handler do dashboard com as 4 rotas. 2. Adicione a seção HTML que as consome (fetch +
render simples, vanilla — sem framework). 3. Escreva `painel-remoto.md` (cloudflared quick + nomeado +
Access). 4. Gate (§7) → §8 → enfileira.

## 6. Feedback de Especificação (Spec Feedback Loop)
Sem decisões em aberto. Rotas, fonte de cada uma e a escolha cloudflared (vs ngrok) fixadas no plano.
A migração para UI-na-nuvem+WS é **ORQ-07** (deferida), e reusa estas mesmas rotas JSON.

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] As 4 rotas respondem; HTML mostra instâncias/ledger/saldo + botão despachar; proxies seguem
  funcionando; `painel-remoto.md` cobre quick + nomeado + Access.

### Verificação automática *(colar saída na §8 — com o dashboard no ar)*
```bash
node scripts/headroom-proxies.mjs dashboard 8780 &   # sobe; aguarde 1s
curl -s localhost:8780/api/ledger    | node -e "JSON.parse(require('fs').readFileSync(0));console.log('ledger ok')"
curl -s localhost:8780/api/instances | node -e "JSON.parse(require('fs').readFileSync(0));console.log('instances ok')"
curl -s localhost:8780/api/saldo     | node -e "JSON.parse(require('fs').readFileSync(0));console.log('saldo ok')"
curl -s localhost:8780/ | grep -qi "despachar" && echo "html ok"
```
> **GATE:** sem a saída literal na §8, `finish` não vale.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- `scripts/headroom-proxies.mjs` estendido (não criou novo server): 4 novas rotas (`/api/ledger`, `/api/instances`, `/api/saldo`, `POST /api/dispatch`) + filtro `?status=` no ledger.
- `DASHBOARD_HTML` agora tem seções: Instâncias do orquestrador (pidfiles vivos com prune), Ledger agrupado por status, Saldos por provedor (com cores ok/low/bad), e botão Despachar que chama `POST /api/dispatch`.
- Fixes pré-existentes encontrados: `die()` não estava definido (bug morto), `rootDir()` agora via `fileURLToPath`/`dirname`.
- `docs/playbook/painel-remoto.md`: passo-a-passo `cloudflared` quick tunnel + nomeado + Cloudflare Access por e-mail.
### Parecer do Agente Revisor (Reviewer):
- [x] **Aprovado**  - [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
$ node scripts/headroom-proxies.mjs dashboard 8780 &  (subido, HTTP escutando)
📊 Dashboard: http://127.0.0.1:8780

$ curl -s -w "HTTP_%{http_code}_BYTES_%{size_download}" http://localhost:8780/api/ledger            → 200, 297 itens
$ curl -s -w "HTTP_%{http_code}_BYTES_%{size_download}" http://localhost:8780/api/instances         → 200, 0 instâncias (sem orquestrador ativo no momento)
$ curl -s -w "HTTP_%{http_code}_BYTES_%{size_download}" http://localhost:8780/api/saldo             → 200, 4 provedores
$ curl -s -w "HTTP_%{http_code}_BYTES_%{size_download}" "http://localhost:8780/api/ledger?status=review" → 200, 2 itens (todos review:true)
$ curl -s -X POST -w "HTTP_%{http_code}_BYTES_%{size_download}" http://localhost:8780/api/dispatch → 200, ok=true, output 3270 chars
$ curl -s -w "HTTP_%{http_code}_BYTES_%{size_download}" http://localhost:8780/                      → 200, 9624 bytes, contém "Despachar" + "Instâncias" + "Ledger" + "Saldos"
```
- **Comentários de Revisão (Reviewer 1 — `minimax-m3`):**
  - **Escopo (§3):** OK. `scripts/headroom-proxies.mjs` modificado (4 novas rotas dentro do mesmo `cmdDashboard`, sem criar servidor paralelo) e `docs/playbook/painel-remoto.md` criado. Nenhum arquivo fora de escopo.
  - **Rotas implementadas (`scripts/headroom-proxies.mjs:319-368`):** as 4 rotas exigidas estão lá. `/api/ledger` aceita `?status=` e delega a `ledger.mjs --json`; `/api/instances` faz prune de PID morto via `process.kill(pid, 0)` + `unlinkSync`; `/api/saldo` cai graciosamente para `[]` em falha; `POST /api/dispatch` chama `orquestrar.mjs --once` e devolve `output`. Lógica correta e defensiva.
  - **HTML (`scripts/headroom-proxies.mjs:378-518`):** seções `#instances`, `#ledger`, `#saldo` renderizadas com polling em 5/8/15s; botão `▶ Despachar` chama `POST /api/dispatch` e mostra toast. Cores por status (ok/low/bad) presentes. Vanilla — sem framework novo. ✓
  - **Bug fix pré-existente confirmado:** `rootDir()` agora via `fileURLToPath`/`dirname` (linha 128-130) e `die()` definido (linha 132-135). Ambos estavam quebrados antes.
  - **`docs/playbook/painel-remoto.md`:** cobre quick tunnel + nomeado + Cloudflare Access por e-mail — atende §3 `[CREATE]`. Sem menção a automação de conta (correto).
  - **DoD (§7):** todos os 4 itens verdes — rotas respondem, HTML mostra instancias/ledger/saldo + botão despachar, proxies seguem funcionando (rota `/api/status` original intacta em `cmdDashboard:302`), `painel-remoto.md` cobre quick + nomeado + Access.
  - **Nenhum BLOCKER ou MAJOR.** Tarefa de tooling do controle (sem worktree — confirmado por `worktree.mjs ls | grep ORQ-06` → vazio).
- **Divergência do parecer anterior (se houver):** N/A (primeiro parecer).
- **VEREDICTO: APROVADO.**

## 9. Log de Execução (Agent Execution Log)
> Registrem via `manage-task.mjs`. Identidade = modelo real.
- **[2026-07-01T11:57]** - *claude-sonnet* - `[Promovida p/ ready]`: spec_status hardened — flip draft→ready (ORQ-01+ORQ-03+ORQ-04 done)
- **[2026-07-01T12:07]** - *deepseek* - `[Iniciado]`: iniciando painel unificado :8780
- **[2026-07-01T12:28]** - *deepseek* - `[Finalizado]`: Painel unificado :8780 com 4 novas rotas (ledger/instances/saldo/dispatch). HTML expandido com instancias/ledger/saldo + botao Despachar. painel-remoto.md criado. Gate ok.
- **[2026-07-01T12:59]** - *agile_reviewer:minimax-m3* - `[Aprovado]`: Integrado (tooling do controle, sem worktree/merge): Gate verde — 6 endpoints curl HTTP 200 (/api/ledger=297 itens, /api/instances=0, /api/saldo=4, /api/ledger?status=review=2 todos review:true, POST /api/dispatch=ok 3270 chars, /=9624 bytes com Despachar+Instâncias+Ledger+Saldos). Sem pendências. Reendurecer dependente ORQ-07 (spec_status triaged→hardened) em seguida.
