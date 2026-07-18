---
id: EST-51
title: "Fix: server.mjs serve ui/ cru em vez de ui/dist"
status: draft:placeholder
complexity: 1
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: [] # IDs de tarefas que bloqueiam esta
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: # haiku | sonnet | opus-spike — preenchido no endurecimento (pass 2)
ui: true
# decisions: ["..."]          ← só quando status: draft:pending_decision (espelha a Seção 6)
---

# EST-51 · Fix: server.mjs serve ui/ cru em vez de ui/dist

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
`apps/estaleiro/server.mjs` serve arquivos estáticos de `apps/estaleiro/ui/` (a pasta de
**código-fonte** da UI — `index.html` de dev, que referencia `<script type="module"
src="/src/main.tsx">`, um `.tsx` que o browser não sabe executar cru) em vez de
`apps/estaleiro/ui/dist/` (o build de produção do vite). Isso significa que rodar
`node server.mjs` diretamente no monorepo (sem passar pelo pipeline de deploy standalone em
`scripts/estaleiro-standalone.mjs`) NUNCA serviu um app funcional — só o deploy standalone (que
copia `ui/dist` para outro lugar) já funcionou. Corrigir para servir sempre `ui/dist`.

## 2. Contexto RAG (Spec-Driven Development)
- `apps/estaleiro/server.mjs:7` — `const UI_DIR = fileURLToPath(new URL("./ui/", import.meta.url));`
  — aponta para a pasta fonte, não para `./ui/dist/`.
- `apps/estaleiro/core/src/bootstrap.ts` (`serveUiFile`, em torno da linha 524) — recebe `uiDir`
  e serve arquivos estáticos dele com fallback para `index.html`; não sabe nem precisa saber a
  diferença entre fonte e build — só serve o que `uiDir` apontar.
- `apps/estaleiro/ui/dist/` — já é gerado por `pnpm --filter @plataforma/estaleiro-ui build`
  (vite build padrão, `outDir: 'dist'` em `apps/estaleiro/ui/vite.config.ts`).
- `scripts/estaleiro-standalone.mjs` — pipeline de empacotamento standalone (T-1052/EST-19/EST-25)
  que builda tudo e copia `ui/dist` para `estaleiro-run/vNN/`; é o único caminho que hoje produz
  um app servível — este script NÃO deve ser alterado por esta task (ele já copia o dist certo
  para o destino certo; o bug é só no `server.mjs` local do monorepo).
- `apps/estaleiro/package.json:"start"` → `"node server.mjs"` — comando canônico de start local.

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[UPDATE]** `apps/estaleiro/server.mjs` — trocar `new URL("./ui/", import.meta.url)` por
  `new URL("./ui/dist/", import.meta.url)`.
- **[READ]** `apps/estaleiro/ui/vite.config.ts` — confirmar `outDir: 'dist'` (não deveria
  precisar mudar).
- **[UPDATE]** `apps/estaleiro/package.json` — se `"start"` não builda a UI antes de subir o
  server, considerar adicionar um script `"prestart": "pnpm --dir ../../ --filter
  @plataforma/estaleiro-ui build"` (padrão já usado em `"pretest:e2e"` do mesmo package.json) —
  **decisão do worker se incluir ou só documentar no README/task que `pnpm --filter
  @plataforma/estaleiro-ui build` precisa rodar antes de `pnpm start`** (evitar side-effect
  surpresa de rebuildar em todo `pnpm start`, mas também evitar UI stale servida por engano —
  escalar como achado na Seção 6 se ficar em dúvida, não decidir sozinho um comportamento que
  afeta todos os devs).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** verificação manual + Playwright existente (`apps/estaleiro/e2e/*.spec.ts`,
  que já sobe o servidor via `pretest:e2e` → `estaleiro-standalone.mjs`, então não é afetado por
  este bug hoje; mas depois do fix, `pnpm start` direto também deve funcionar).
- [ ] **Ambiente do Teste:** manual — `pnpm --filter @plataforma/estaleiro-ui build` seguido de
  `pnpm --filter @plataforma/estaleiro start`, abrir `http://localhost:8899/` no browser e
  confirmar que a página carrega JS/CSS compilados (não um 404 ou um `.tsx` cru servido como
  `text/javascript`).
- [ ] **Fora de Escopo:** não mexer no pipeline `estaleiro-standalone.mjs` nem no Playwright
  E2E existente (esses já funcionam por outro caminho).
> `ui: true` — afeta como a UI é servida. Reviewer sobe `pnpm start` e confirma no browser.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - NÃO alterar `scripts/estaleiro-standalone.mjs` — ele já funciona corretamente.
> - NÃO remover ou alterar a pasta `apps/estaleiro/ui/src` (fonte) — o fix é só o `uiDir` que o
>   `server.mjs` local aponta.
> - NÃO adicionar bundler/dev-server novo (Vite dev server, HMR) — fora de escopo; o objetivo é
>   só servir o build de produção corretamente.

### Pegadinhas conhecidas
- `apps/estaleiro/ui/dist/` só existe depois de rodar o build — se o worker testar `pnpm start`
  sem buildar antes, vai ver 404 em tudo e pode concluir erroneamente que o fix não funcionou.
  Sempre buildar a UI primeiro.
- `serveUiFile` em `bootstrap.ts` faz fallback de path traversal check (`resolved.startsWith(...)`)
  — não precisa mexer nisso, só o `uiDir` de entrada muda.

1. Buildar a UI (`pnpm --filter @plataforma/estaleiro-ui build`) e confirmar `ui/dist/index.html`
   existe.
2. Alterar `server.mjs:7` para apontar para `./ui/dist/`.
3. Rodar `pnpm --filter @plataforma/estaleiro start` (ou `node server.mjs` de dentro de
   `apps/estaleiro`) e abrir `http://localhost:8899/` no browser — confirmar que a página carrega
   (não é suficiente confirmar HTTP 200; abrir no browser mesmo, dado que EST-50 pode ainda
   estar em aberto e a tela pode aparecer vazia por outro motivo — isso é esperado e não é
   regressão desta task).
4. Decidir e documentar (ou implementar, se trivial) o script `prestart` conforme §3.

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado — causa raiz confirmada em sessão de diagnóstico 2026-07-18: um
  server dev temporário apontando `uiDir` para `ui/dist/` serviu a UI corretamente; o
  `server.mjs` real do repo aponta para `ui/` (fonte) e por isso nunca funcionou localmente.]*
- **Relacionada:** [EST-50](./EST-50.md) — sem o fix de CSS, mesmo servindo o `dist` certo a tela
  ainda vai parecer vazia; as duas tasks são independentes mas o teste manual completo desta
  task só fica visualmente satisfatório depois que EST-50 também estiver corrigida. Não é
  dependência de bloqueio (esta task testa "serve o dist certo", não "a UI está bonita").

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] O código segue estritamente os arquivos de Output especificados (sem criar arquivos não solicitados)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (Node/JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas?
- [ ] A implementação respeita a Regra do Que Não Fazer?
- [ ] **[gate de wiring — se a task entrega primitiva de autorização/privacidade]** existe caller de produção em `src/**` que a consome no caminho real, OU há task de integração linkada? (primitiva só testada = feature NÃO entregue)
- [ ] **[gate de acoplamento — se a task adiciona import cruzando pacote]** o import respeita a direção `protocol ← crypto ← core ← transport` (`visao-arquitetural.md §1`) e NÃO fecha ciclo?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter <pacote> build      # tsc — precisa terminar sem erro
pnpm --filter <pacote> test       # precisa ficar verde, sem regressão
pnpm --filter <pacote> lint       # ZERO erros novos (rode o baseline ANTES de tocar; regressão de lint bloqueia no review)
```
> **GATE DE EVIDÊNCIA:** nem o `finish` (worker) nem o veredito (reviewer) são válidos sem a
> saída literal desses comandos colada na seção 8. Marcar `[x]` sem evidência é violação.

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test + lint):**
```
(cole aqui a saída real de pnpm build, pnpm test e pnpm lint)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
