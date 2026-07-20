---
id: EST-68
title: "Dev-loop de UI com HMR: vite dev + proxy no estaleiro-ui + cache headers no standalone"
status: blocked
complexity: 2
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [EST-65]
blocks: []
capacity_target: sonnet
ui: true
---

# EST-68 · Dev-loop de UI com HMR

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-68`.
- **Dependência:** EST-65 (toca o mesmo `vite.config.ts`; evitar conflito estrutural).

## 1. Objetivo
Eliminar a classe de problema "alterei a UI mas o que se vê é o build velho" (P-010, P-013,
P-014, retrospectiva 2026-07-20). Hoje o único jeito de ver a UI do Estaleiro é rebuildar o
standalone (build+copy+restart+hard-reload — 4 pontos de staleness). Esta task cria o **loop de
dev com HMR**: `vite dev` com proxy para o backend, onde cada save aplica na tela em ~100ms sem
refresh manual — o loop que o `/executar-task-ui` exige dos workers. E endurece o standalone
contra cache de browser.

## 2. Contexto RAG
- Retrospectiva 2026-07-20 (esta task nasce dela) + `PITFALLS.md` P-010/P-013/P-014/P-015.
- `apps/estaleiro/ui/vite.config.ts` — hoje só build; ganha bloco `server` (dev).
- `apps/estaleiro/server.mjs` + `apps/estaleiro/core/src/bootstrap.ts` — quem serve a UI
  estática e a porta do backend (8899 default); o proxy do vite aponta para ela. Localizar onde
  os arquivos estáticos são servidos para os cache headers (item 3).
- WS: o client conecta em `/ws` — o proxy precisa de `ws: true`.

## 3. Escopo de Arquivos
1. **[UPDATE]** `apps/estaleiro/ui/vite.config.ts` — adicionar:
   `server: { port: 5199, proxy: { "/api": "http://localhost:8899", "/ws": { target: "ws://localhost:8899", ws: true } } }`
   (porta do backend configurável via env `ESTALEIRO_BACKEND_URL` com default 8899).
2. **[UPDATE]** `apps/estaleiro/ui/package.json` — script `"dev": "vite"`.
3. **[UPDATE]** servidor estático (server.mjs/bootstrap) — `Cache-Control: no-cache` para
   `index.html` (e qualquer resposta sem hash no nome); `Cache-Control: public, max-age=31536000,
   immutable` para `/assets/*` (nomes com hash do vite). Mata o "hard-reload obrigatório".
4. **[UPDATE]** `apps/estaleiro/README.md` (ou criar) — seção "Dev loop": subir backend
   (1 comando) + `pnpm --filter @plataforma/estaleiro-ui dev` + URL; standalone é só release/E2E.

## 4. Estratégia de Testes
- Unit: teste dos cache headers (request a `/index.html` → `no-cache`; a `/assets/x.js` →
  `immutable`) no test runner do core.
- **Verificação manual obrigatória no Parecer:** subir backend + `vite dev`, editar um texto de
  uma view, colar evidência de que o HMR aplicou sem reload (log do vite + screenshot).
- Gate `pnpm gate @plataforma/estaleiro` allGreen (nada do modo dev pode afetar o build de prod).

## 5. Instruções de Execução
- **NÃO FAZER:**
  - NÃO mudar o comportamento de produção do server além dos headers.
  - NÃO adicionar dependência nova (vite já tem proxy embutido).
  - NÃO remover/alterar o fluxo standalone (continua sendo o artefato de release e E2E).

## 7. Definition of Done
- [ ] `pnpm --filter @plataforma/estaleiro-ui dev` sobe com proxy funcional (chat conversa com o
  backend real através do proxy, WS incluso).
- [ ] Edição de view aplica via HMR sem refresh (evidência no Parecer).
- [ ] Cache headers cobertos por teste; gate allGreen.

## 8. Handover / Parecer

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-20T12:40]** - *claude-fable* - `[Triado]`: triagem na criação (retrospectiva do dev-loop)
- **[2026-07-20T12:40]** - *claude-fable* - `[Endurecido]`: endurecida: escopo fechado (vite proxy + cache headers), dep EST-65 pelo vite.config compartilhado
- **[2026-07-20T15:17]** - *system* - `[Auto-promovida]`: dep EST-65 concluída
- **[2026-07-20T18:24]** - *gpt-5* - `[Bloqueado]`: BLOCKER de ambiente: pnpm wt new recusou criar a worktree porque C:\Dev2026\superapp tem alterações não commitadas (packages/design-system/src/metadata/components.index.json e banco local do Estaleiro). Nenhum arquivo foi alterado.
