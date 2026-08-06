---
id: T-BW-05
title: "Bancada: aba Reset Local (renomeada de Cenários) — referência ao reset já existente + cenários normativos"
status: draft:hardened
complexity: 2
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: []
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: sonnet # haiku | sonnet | opus-spike — preenchido no endurecimento (pass 2)
# decisions: [] — D1 RESOLVIDA pelo arquiteto humano em 2026-07-27 (opção (b) da D1, com renome). Ver Seção 6.
ui: true
---

# T-BW-05 · Bancada: aba Reset Local (renomeada de Cenários)

> **⚠️ NOTA DE RECONCILIAÇÃO (2026-07-27, endurecimento pass-2 — claude-sonnet):**
> Esta task tinha dois escopos colados: (1) a aba **Cenários** da Bancada (hoje
> `<div>Em Construção</div>` em `apps/bancada/src/components/tabs/CenariosTab.tsx` — nenhuma outra
> task é dona dela) e (2) o **canal de controle** `ControlPort` (T-009a) + `WebSocketControlClient`
> (T-009b) sobre o qual a aba seria construída. Investigação desta rodada (fontes citadas abaixo):
>
> - **Canal de controle: morto, confirmado.** T-009a e T-009b estão `status: obsolete` (ver
>   `tasks/T-009a.md` §9, entrada `[2026-07-27T18:14]`, e `tasks/T-009b.md` §9, mesma entrada) —
>   escopo descartado pelo arquiteto em `tasks/T-009.md` §6 [OPEN-1] (2026-06-21): *"O escopo
>   anterior ('ControlPort/WebSocketControlClient') não corresponde a nenhuma task numerada no
>   plano normativo atual e foi descartado — não foi movido para outra task."* Não reaberto.
> - **A citação de dependência "T-011 (runner de cenários)" no §2 original não resolve.** O arquivo
>   `tasks/T-011.md` real é *"Incorporar @plataforma/design-system ao monorepo"* (`done`), sem
>   nenhuma relação com cenários. `tasks/_correlacao-plano.md` (linhas 33, 118, 120) registra que o
>   escopo "Runner de cenários" (`pnpm scenario <nome>`, `docs/plano-de-implementacao.md:166`) foi
>   realocado de T-011 para **T-018** — mas `tasks/T-018.md` real é *"Expandir cobertura de testes
>   do design-system para os componentes restantes"* (`done`), também sem nenhuma relação com
>   cenários. O "Runner de cenários" do plano normativo estava, portanto, **órfão**.
>
> **✅ DECISÃO DO ARQUITETO (humano, 2026-07-27) — REGISTRADA, NÃO REDISCUTIDA:**
> **D1 → opção (b)**, com renomeação. O escopo de orquestração remota (seed/reset/partição via
> canal de controle) foi **removido** desta task — não é substituível de forma segura sem um
> mecanismo novo (T-010 §5 proíbe enviar `ADMIN_TOKEN` ao browser; ver histórico completo mais
> abaixo). A aba passa a ser **escopo 100% local**: expõe `resetLocalState()` (já implementado e
> `done` via T-009) e uma referência de leitura aos cenários normativos. **D2 (runner de cenários)**
> foi decidida separadamente e absorvida por **T-BW-06** (ver `tasks/T-BW-06.md` §1/§2/§6) — esta
> task NÃO implementa o runner.
>
> **⚠️ ACHADO DESTA RODADA — a premissa da opção (b) estava parcialmente desatualizada, e isso
> muda o que esta task entrega (renomear ≠ duplicar botão):**
> A opção (b), como registrada em 2026-07-14/antes, presumia que *"nenhum botão visível expõe
> `resetLocalState()`, nem em Cenários nem em nenhuma outra aba"*. Isso **não é mais verdade**:
> `tasks/T-111.md` (Bancada: aba Identidade, `done`, QA aprovado em 2026-07-03 — **antes** desta
> reconciliação, mas depois de quando D1 foi originalmente redigida) já entregou um botão real
> **"Reset Identidade"** em `apps/bancada/src/components/tabs/IdentidadeTab.tsx:292-300`, que chama
> `resetLocalState()` diretamente (linha 194, comentário `B3` no próprio arquivo). O achado `M5` do
> rework de T-111 (`tasks/T-111.md` §9, `2026-07-03T18:49`/QA `2026-07-03T19:34`) **removeu
> deliberadamente** um botão duplicado `"Reset deste peer"` do shell `App.tsx`, centralizando o
> único controle de reset na aba Identidade — confirmado pelo teste real
> `apps/bancada/tests/App.test.tsx:48-53` (*"M5: botao Reset da aba Identidade presente (sem
> duplicata no header)"*, que afirma explicitamente `queryByRole('button', {name: /Reset deste
> peer/})` **não existe**).
> **Consequência para esta task:** a aba renomeada **NÃO cria um segundo botão de reset** — isso
> recriaria exatamente o problema ("dois botões Reset conflitantes") que o M5 de T-111 já corrigiu
> e que o QA já aprovou. Em vez disso, a aba renomeada vira **conteúdo de referência** (lista dos
> cenários normativos + apontamento textual para o botão já existente na aba Identidade). Ver
> Seção 6 para a discussão completa e a decisão de arquitetura (rename vs. fusão no `DadosTab`).
>
> **⚠️ ACHADO ADICIONAL (dívida técnica descoberta e corrigida nesta task) — E2E de T-009 nunca
> rodou e ficou com asserção factualmente errada.** `apps/bancada/tests/e2e/reset.e2e.ts` (escrito
> por T-009, casos 8–9) **nunca foi coletado pelo Playwright**: `apps/bancada/playwright.config.ts:8-11`
> define `testMatch: ["tests/e2e/**/*.spec.ts", "e2e/**/*.test.ts"]` — o arquivo tem extensão
> `.e2e.ts`, que não bate com nenhum dos dois padrões. Além disso, seu caso 9 testa um botão
> `"Reset deste peer"` que, como descrito acima, foi deliberadamente removido por T-111. Esta task
> corrige as duas coisas (ver Seção 3/4/6).

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (React Testing Library, JSDOM) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Renomear a aba **Cenários** da Bancada (hoje `<div className="tab-placeholder">Em Construção</div>`
em `apps/bancada/src/components/tabs/CenariosTab.tsx`) para **Reset Local**, com conteúdo real
100% local, sem depender de nenhum canal de controle:

1. **Referência de leitura** aos 6 nomes de cenário normativos de
   `docs/plano-de-implementacao.md:122` + texto instrucional citando o comando-alvo
   `pnpm scenario <nome>` (forma normativa fixada pelo plano; a implementação do runner em si é
   escopo de T-BW-06, não desta task).
2. **Apontamento cruzado, não duplicação**, para o controle de reset local já existente e
   aprovado — o botão **"Reset Identidade"** na aba Identidade (`IdentidadeTab.tsx`, T-111,
   `done`), que já chama `resetLocalState()` (T-009, `done`) e limpa OPFS+IndexedDB+CacheStorage+
   localStorage+Service Worker. Esta task **não cria um segundo botão de reset**.
3. **Correção de dívida técnica descoberta**: o E2E de T-009 (`tests/e2e/reset.e2e.ts`, casos 8–9)
   nunca foi coletado pelo Playwright (extensão errada) e ficou com uma asserção desatualizada
   (botão inexistente). Corrigido aqui: arquivo recriado com a extensão correta e testando o botão
   real (`"Reset Identidade"`, na aba Identidade).

*(Derivado de: `docs/plano-de-implementacao.md` §2.4 linhas 116-123 — tabela "Reset de bancos e
cenários limpos"; decisão do arquiteto de 2026-07-27 registrada acima; `tasks/T-111.md` e
`tasks/T-009.md` como fonte do estado real do reset local.)*

## 2. Contexto RAG (Spec-Driven Development)
- ~~[ ] T-009a (ControlPort)~~ — `obsolete` (T-009 §6 [OPEN-1]); não usar.
- ~~[ ] T-009b (WebSocketControlClient)~~ — `obsolete`; não usar.
- [x] [T-009](./T-009.md) (`done`) — `resetLocalState()` em `@plataforma/client-sdk` (OPFS+IDB+
  Cache+SW+LS), hook `useBancadaReset()` (`apps/bancada/src/hooks/useBancadaReset.ts`), registrado
  em `App.tsx` para expor `window.__bancada.reset()`.
- [x] [T-111](./T-111.md) (`done`) — entregou o botão real **"Reset Identidade"**
  (`apps/bancada/src/components/tabs/IdentidadeTab.tsx:292-300`) que chama `resetLocalState()`
  diretamente; removeu deliberadamente (achado M5) um botão duplicado `"Reset deste peer"` do
  shell. **Fonte de verdade de que o controle de reset já é visível hoje** — esta task referencia,
  não duplica.
- [x] [plano-de-implementacao.md](../docs/plano-de-implementacao.md) §2.4 "Reset de bancos e
  cenários limpos" (linhas 116-123) — 3 superfícies: browser (`resetLocalState()`, `done` via
  T-009), peer do sistema (`POST /admin/reset`/`POST /admin/seed/:cenario`, `done` via T-010, mas
  trancado atrás de `ADMIN_TOKEN` server-side — T-010 §5), suíte (`pnpm scenario <nome>`, absorvido
  por T-BW-06).
- [x] [plano-de-implementacao.md](../docs/plano-de-implementacao.md) linha 122 — os 6 nomes
  normativos de cenário: `vazio`, `genesis-corporativa`, `dois-peers-divergentes`,
  `fork-pendente`, `epoca-rotacionada`, `saldo-com-validador`.
- [x] `apps/bancada/playwright.config.ts` (linhas 8-11) — `testMatch: ["tests/e2e/**/*.spec.ts",
  "e2e/**/*.test.ts"]`. Fonte do achado de dívida técnica (arquivo `.e2e.ts` nunca coletado).
- [x] `apps/bancada/tests/App.test.tsx` (linhas 48-53) — confirma que o único botão de reset real
  chama-se `"Reset Identidade"` e vive na aba Identidade (`"Reset deste peer"` não existe).
- [x] `apps/bancada/src/components/tabs/{DadosTab,SyncTab,RedeTab,AuthTab}.tsx` — padrão real das
  abas irmãs: hook/props ligados diretamente ao estado do próprio peer. `DadosTab.tsx` **ainda é
  placeholder puro** (`<div>Em Construção</div>`, confirmado no código atual) — sua implementação
  real é escopo de [T-608a](./T-608a.md) (`status: ready`, ainda não executada). Ver Seção 6 para
  por que isso decide "renomear" em vez de "fundir no DadosTab".

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `apps/bancada/src/components/tabs/CenariosTab.tsx` — estado atual (placeholder puro),
  alvo da renomeação.
- **[READ]** `apps/bancada/src/components/tabs/IdentidadeTab.tsx` (linhas 184-196, 292-300) — prova
  que `"Reset Identidade"` já existe e chama `resetLocalState()`; fonte do texto de apontamento
  cruzado. **NÃO modificar este arquivo** (fora de escopo — pertence a T-111, `done`; ver Seção 6
  para o achado de mislabeling não-bloqueante, encaminhado como pendência separada).
- **[READ]** `apps/bancada/src/App.tsx` — wiring atual de abas (`TABS`, `TabId`, `TAB_COMPONENTS`).
- **[READ]** `apps/bancada/playwright.config.ts` — confirma `testMatch` (linhas 8-11).
- **[READ]** `apps/bancada/tests/e2e/reset.e2e.ts` — versão morta/desatualizada a ser substituída.
- **[READ]** `apps/bancada/tests/e2e/identidade.spec.ts` (linhas 54-62) — já cobre parcialmente
  "reset volta ao estado inicial" via UI (sem verificar OPFS); esta task adiciona a verificação de
  OPFS que faltava, sem duplicar a cobertura de UI já existente.
- **[CREATE]** `apps/bancada/src/components/tabs/ResetTab.tsx` — componente novo (substitui
  `CenariosTab.tsx`), **sem props**, conteúdo estático de referência (ver contrato abaixo).
- **[DELETE]** `apps/bancada/src/components/tabs/CenariosTab.tsx`.
- **[CREATE]** `apps/bancada/tests/ResetTab.test.tsx`.
- **[UPDATE]** `apps/bancada/src/App.tsx` — trocar import `CenariosTab` → `ResetTab`; `TabId`
  `"cenarios"` → `"reset"`; `TABS` label `"Cenários"` → `"Reset Local"`; `TAB_COMPONENTS["reset"]
  = ResetTab` (sem props).
- **[UPDATE]** `apps/bancada/tests/App.test.tsx` — linha 14 (`"Cenários"` → `"Reset Local"` no
  teste dos 7 botões); linhas 32-37 (o teste hoje intitulado *"abas placeholder (Dados, Cenários)
  renderizam Em Construção"* só exercita a aba Dados no código — renomear o título para não citar
  mais "Cenários", que deixa de ser placeholder); **adicionar** um novo teste afirmando que a aba
  "Reset Local" **não** mostra "Em Construção".
- **[UPDATE]** `apps/bancada/tests/e2e/bancada.smoke.spec.ts` (linha 25) — array de labels de abas
  do teste "navegacao sequencial": `"Cenários"` → `"Reset Local"`.
- **[DELETE]** `apps/bancada/tests/e2e/reset.e2e.ts` — nunca coletado pelo `testMatch`; caso 9
  testa um botão que não existe mais (ver nota de reconciliação).
- **[CREATE]** `apps/bancada/tests/e2e/reset.smoke.spec.ts` — substitui o arquivo acima, com
  extensão correta (`.spec.ts`, coletada pelo `testMatch`) e o botão real `"Reset Identidade"`.

### Contrato exato
```tsx
// --- apps/bancada/src/components/tabs/ResetTab.tsx ---

/**
 * Aba "Reset Local": conteúdo 100% local e estático, sem estado próprio.
 * NÃO expõe nenhum <button> — o controle de reset já existe na aba Identidade
 * (IdentidadeTab.tsx, "Reset Identidade", T-111, done). Esta aba é referência,
 * não um segundo controle.
 */
export function ResetTab(): JSX.Element;
```
Conteúdo obrigatório (verificado pelos casos de teste da Seção 4):
- Texto explicando que esta aba **não** pilota seed/reset/partição do `system-peer` remoto — isso
  é escopo do orquestrador Playwright (ver [T-BW-06](./T-BW-06.md)), não de um botão de UI (o
  `ADMIN_TOKEN` nunca é enviado ao browser — `tasks/T-010.md` §5).
- Texto de apontamento cruzado citando a aba **Identidade** e o botão **"Reset Identidade"** como o
  controle real de reset local deste peer.
- Lista somente-leitura dos 6 nomes de cenário normativos, na ordem de
  `plano-de-implementacao.md:122`: `vazio`, `genesis-corporativa`, `dois-peers-divergentes`,
  `fork-pendente`, `epoca-rotacionada`, `saldo-com-validador`.
- Texto instrucional contendo a substring literal `pnpm scenario` (comando-alvo citado do plano;
  documentação de uso pretendido — a implementação do runner é escopo de T-BW-06, não uma promessa
  de que já funciona para todos os 6 cenários hoje).

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest + React Testing Library (JSDOM) para `ResetTab`/`App`; Playwright
  (browser real) para os smokes.
- [x] **Ambiente do Teste:** JSDOM para unit; Chromium headless (via `playwright.config.ts`
  existente) para os E2E.
- [x] **Fora de Escopo:** qualquer chamada real a `POST /admin/reset`/`POST /admin/seed/:id` do
  `system-peer` (fora do alcance do browser por design — T-010 §5); runner de cenários (T-BW-06).
> **Task afeta UI** (`frontend_agent`, `apps/bancada/**`) — `ui: true` no frontmatter. Smokes
> Playwright abaixo satisfazem a exigência.

Casos de teste (Vitest/RTL — `ResetTab.test.tsx`):
1. Renderiza os 6 nomes de cenário normativos (`vazio`, `genesis-corporativa`,
   `dois-peers-divergentes`, `fork-pendente`, `epoca-rotacionada`, `saldo-com-validador`), na
   ordem de `plano-de-implementacao.md:122`.
2. Renderiza texto contendo a substring `pnpm scenario`.
3. Renderiza texto de apontamento cruzado citando `"Identidade"` e `"Reset Identidade"`.
4. **NÃO** renderiza nenhum elemento `<button>` (`screen.queryAllByRole('button')` tem tamanho 0) —
   prova de que não duplica o controle de reset já existente.

Casos de teste (Vitest/RTL — `App.test.tsx`, atualizados/adicionados):
5. Teste `"renderiza os 7 botoes de aba com labels exatos"` passa a esperar `"Reset Local"` no
   lugar de `"Cenários"`.
6. Teste de placeholder (renomeado, só sobre a aba Dados) continua verde inalterado no
   comportamento — só o título/comentário deixa de citar "Cenários".
7. **Novo:** clicar na aba `"Reset Local"` **não** mostra o texto `"Em Construção"`.

Casos de teste (Playwright — `bancada.smoke.spec.ts`, já existente, só dado atualizado):
8. O teste `"navegacao sequencial por todas as 7 abas nao dispara erro"` usa `"Reset Local"` no
   array de labels no lugar de `"Cenários"` — continua passando por todas as 7 abas sem erro de
   console.

Casos de teste (Playwright — `reset.smoke.spec.ts`, NOVO, substitui `reset.e2e.ts`):
9. Cria arquivo em OPFS (`navigator.storage.getDirectory()`) → chama `window.__bancada.reset()` →
   verifica que o arquivo não existe mais em OPFS. *(Preserva o caso 8 original de T-009 — este
   caminho não depende de qual aba está ativa, pois `useBancadaReset()` roda em `App()`
   incondicionalmente.)*
10. Cria arquivo em OPFS → (aba Identidade, default) gera identidade (`"Gerar Identidade"`) →
    clica em `"Reset Identidade"` (aceitando o `confirm()` nativo) → verifica que (a) o arquivo não
    existe mais em OPFS e (b) a tela volta ao estado `"Nenhuma identidade carregada"`. *(Substitui
    o caso 9 original de T-009, que testava um botão `"Reset deste peer"` inexistente — corrigido
    para o botão real, e agora efetivamente coletado pelo `testMatch`.)*

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie um segundo botão de reset em `ResetTab.tsx` — o controle real já existe em
>   `IdentidadeTab.tsx` (T-111, `done`). Duplicar recriaria o problema que o achado M5 de T-111 já
>   corrigiu (QA aprovado com a exigência explícita de reset único).
> - **NÃO** modifique `apps/bancada/src/components/tabs/IdentidadeTab.tsx` nem seus testes — fora
>   do escopo desta task (pertencem a T-111, `done`). O mislabeling encontrado (o botão chama-se
>   "Reset Identidade" mas na prática executa um reset completo do peer, não só da identidade) é
>   real, mas é dívida de OUTRA task — não a resolva aqui silenciosamente.
> - **NÃO** implemente nenhuma chamada real a `POST /admin/reset`/`POST /admin/seed/:id` — isso é
>   proibido para o browser por T-010 §5 e é escopo do orquestrador de testes (T-BW-06), não desta
>   aba de produto.
> - **NÃO** invente um runner de cenários (`pnpm scenario`) nesta task — é escopo de T-BW-06.

### Pegadinhas conhecidas
- O `testMatch` de `apps/bancada/playwright.config.ts` (linhas 8-11) exige `tests/e2e/**/*.spec.ts`
  OU `e2e/**/*.test.ts` — o arquivo novo precisa ser `tests/e2e/reset.smoke.spec.ts`
  (`.spec.ts`, não `.e2e.ts`), senão repete o erro que deixou os casos 8-9 de T-009 mortos por
  meses.
- `useBancadaReset()` já é chamado incondicionalmente em `App()` (fora de qualquer aba) só para o
  efeito colateral de registrar `window.__bancada.reset` — isso **não muda** nesta task; `ResetTab`
  não precisa (e não deve) chamar o hook de novo.
- O botão de reset real usa `confirm()` nativo do browser antes de executar — os testes Playwright
  precisam de `page.on('dialog', dialog => dialog.accept())` (mesmo padrão já usado em
  `identidade.spec.ts:55`).

1. **[TDD]** Escreva `apps/bancada/tests/ResetTab.test.tsx` com os casos 1-4.
2. Implemente `apps/bancada/src/components/tabs/ResetTab.tsx` conforme o contrato da Seção 3.
   Delete `CenariosTab.tsx`.
3. Atualize `apps/bancada/src/App.tsx` (import, `TabId`, `TABS`, `TAB_COMPONENTS`).
4. Atualize `apps/bancada/tests/App.test.tsx` (casos 5-7) e
   `apps/bancada/tests/e2e/bancada.smoke.spec.ts` (caso 8).
5. Delete `apps/bancada/tests/e2e/reset.e2e.ts`; crie
   `apps/bancada/tests/e2e/reset.smoke.spec.ts` com os casos 9-10.
6. Rode o Gate (Seção 7).

## 6. Feedback de Especificação (Spec Feedback Loop)

> **DECISÃO D1 — RESOLVIDA pelo arquiteto humano (2026-07-27).** Opção (b) da D1, com renomeação.
> Registrada via `manage-task.mjs decide`, não reaberta aqui.

**Por que renomear em vez de fundir no `DadosTab`** (a segunda metade da decisão do arquiteto,
delegada a este endurecimento com a instrução *"escolha com base no que o código da Bancada torna
mais simples, e justifique com fonte"*):

`apps/bancada/src/components/tabs/DadosTab.tsx` **ainda é placeholder puro**
(`<div className="tab-placeholder">Em Construção</div>`, confirmado no código atual do superapp).
Sua implementação real (navegador de linhagens: cadeia MUTATES, heads, forks, botões "forçar
fork"/"derrubar validador") é escopo fixado e **ainda não executado** de
[T-608a](./T-608a.md) (`status: ready`) — contrato TS já fixado
(`DadosTabProps { linhagens, onForceFork, onKillValidator, onResolveFork }`, zero relação com
reset). Fundir a funcionalidade de reset no `DadosTab.tsx` **agora**, nesta task, criaria uma
colisão de escopo real: duas tasks (`T-BW-05` e `T-608a`) escreveriam o mesmo arquivo-ainda-inexistente
de forma independente, sem que uma soubesse da outra — exatamente o tipo de conflito que a regra
"Contratos cross-task" do `endurecer-task` pede para evitar. `CenariosTab.tsx`, em contraste, não
tem nenhum outro dono (confirmado na nota de reconciliação original desta task) — renomear em
- -place é o caminho de **menor colisão e menor esteira** (não força reconciliar dois PRs no mesmo
arquivo quando T-608a for finalmente executada). **Decisão: renomear.**

**Achado não-bloqueante, fora de escopo, encaminhado separadamente:** o botão `"Reset Identidade"`
(`IdentidadeTab.tsx:292-300`, T-111) está rotulado como se resetasse só a identidade, mas na
prática chama `resetLocalState()` — o mesmo reset completo (OPFS+IDB+Cache+SW+LS) que T-009
especifica para "este peer" inteiro. O rótulo mente por omissão (o usuário pode não esperar que
"Reset Identidade" apague também dados de Sync/Auth/Dados). Não é escopo desta task corrigir um
rótulo de um arquivo de outra task já `done`/aprovada — sinalizado como candidato a limpeza
separada (ver task spawnada ao final desta sessão).

**Nota de proveniência (preservada da versão anterior):** a orquestração remota original
(`ControlPort`/`WebSocketControlClient`) segue `obsolete` (T-009 §6 [OPEN-1], T-009a/b). Não
reaberta por este endurecimento.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist para aprovar ou rejeitar o PR:
- [ ] `ResetTab.tsx` não renderiza nenhum `<button>` (não duplica o reset de `IdentidadeTab`)?
- [ ] Lista dos 6 cenários normativos presente, na ordem do plano?
- [ ] Texto de apontamento cruzado à aba Identidade / botão "Reset Identidade" presente?
- [ ] `App.tsx` usa `"Reset Local"` (label) / `"reset"` (id) no lugar de `"Cenários"`/`"cenarios"`?
- [ ] `CenariosTab.tsx` deletado; `reset.e2e.ts` deletado?
- [ ] `apps/bancada/tests/e2e/reset.smoke.spec.ts` existe (extensão `.spec.ts`) e é efetivamente
  coletado por `pnpm --filter bancada test:e2e` (confirmar na saída, não só na existência do
  arquivo — é exatamente o tipo de gate que passou "verde" sem rodar nada antes)?
- [ ] Nenhum arquivo fora do Escopo de Arquivos tocado (em especial, `IdentidadeTab.tsx` intacto)?
- [ ] O `pnpm test` roda sem erros no ambiente especificado (JSDOM)?
- [ ] Linter (`pnpm lint`) não acusa problemas novos?

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
```bash
pnpm --filter bancada build      # tsc + vite build — precisa terminar sem erro
pnpm --filter bancada test       # vitest (JSDOM) — precisa ficar verde, sem regressão
pnpm --filter bancada lint       # ZERO erros novos
pnpm --filter bancada test:e2e   # playwright — CONFIRME que reset.smoke.spec.ts aparece na lista de specs rodados
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
- **[2026-07-14T12:46]** - *claude-fable* - `[Triado]`: Wiring da Bancada — auditoria 2026-07-14: placeholders declarados no App.tsx; endurecimento profundo just-in-time quando as deps fecharem
- **[2026-07-27T18:43]** - *claude-sonnet* - `[Decisão pendente]`: Reescopo pass-2: separado o vivo (aba Cenarios) do morto (ControlPort/T-009a/T-009b, obsolete). Sem substituto citavel para seed/reset/particao remota via UI (ADMIN_TOKEN nunca vai ao browser - T-010 SS5; WebSocketControlClient era Node-only mesmo antes do obsolete - T-009b SS6 D1; citacao T-011/T-018 'runner de cenarios' nao resolve - _correlacao-plano.md stale). D1 escalada na Secao 6 com 3 opcoes (obsoletar / redefinir local / bridge dev-only).
- **[2026-07-27T19:42]** - *israel* - `[Decidido]`: C2: aba renomeada para Reset Local, escopo 100% local sobre resetLocalState() ja entregue por T-009; orquestracao de cenario fica no Playwright via T-BW-06
