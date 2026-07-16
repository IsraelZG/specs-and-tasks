---
id: T-BW-05
title: "Bancada: aba Cenários + canal de controle (ControlPort)"
status: draft:triaged
complexity: 3
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-009a", "T-009b"]
blocks: [] # IDs de tarefas que esta bloqueia
capacity_target: # haiku | sonnet | opus-spike — preenchido no endurecimento (pass 2)
# decisions: ["..."]          ← só quando status: draft:pending_decision (espelha a Seção 6)
---

# T-BW-05 · Bancada: aba Cenários + canal de controle (ControlPort)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** haiku | sonnet | opus-spike *(ver regra "Dimensionamento de Tarefas" no CLAUDE.md: spec sem decisões em aberto, contratos explícitos, sem API externa não-fixada, verificação por comando)*

## 1. Objetivo
Implementar a aba Cenários da Bancada (hoje literalmente `<div>Em Construção</div>` — nenhuma
task era dona dela) sobre o canal de controle: `ControlPort` (T-009a) + `WebSocketControlClient`
(T-009b) contra o Hub QA/system-peer dev API — aplicar seed de cenário (`POST /admin/seed/:id`),
reset geral, e disparo de partição/divergência para as demais abas exercitarem.

## 2. Contexto RAG (Spec-Driven Development)
- [ ] T-009a (ControlPort)
- [ ] T-009b (WebSocketControlClient)
- [ ] T-010 (admin/reset+seed)
- [ ] T-011 (runner de cenários)
- [ ] plano §2.4

## 3. Escopo de Arquivos (Inputs e Outputs)
*(Defina EXATAMENTE quais arquivos o agente deve ler, criar ou modificar. Não edite arquivos fora deste escopo)*
- **[READ]** `caminho/do/arquivo/referencia.ts` (Funções/Classes existentes a serem lidas)
- **[CREATE]** `caminho/novo/arquivo.ts` (O formato esperado do output)
- **[UPDATE]** `caminho/existente.ts` (Linhas X a Y, ou adicionar função Z)

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** (Vitest para Node puro / Playwright para E2E / React Testing Library em JSDOM)
- [ ] **Métricas/Cobertura:** (Ex: Testar todos os ramos de erro, testar a assinatura inválida)
- [ ] **Ambiente do Teste:** (Node puro, sem browser / Headless browser)
- [ ] **Fora de Escopo:** (O que NÃO precisa ser testado)
> **Se a task afeta UI** (frontend_agent ou escopo em `apps/*-frontend/**`): unit/JSDOM NÃO
> basta. Especifique aqui um **smoke Playwright** (browser real) OU exija a verificação manual
> do revisor (subir o app e exercitar o fluxo) — o `agile-reviewer` trata isso como BLOCKER de
> processo. Marque `ui: true` no frontmatter para deixar explícito.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> -
> -

### Pegadinhas conhecidas *(preencher pelo Task Architect — armadilhas que derrubam um modelo leve)*
*(Liste aqui os erros prováveis e como evitá-los. Ex.: "mudar uma assinatura síncrona para `async`*
*exige `await` em TODOS os callers (controller, rota REST, MCP tools)"; "mapear `A.foo → bar`*
*ao passar para o método X"; "não duplicar a lógica de Y — chamar o método existente Z".)*
- *[Nenhuma identificada]*

1. **[TDD]** Escreva o teste em `...`
2. Implemente `...`
3. Refatore.

## 6. Feedback de Especificação (Spec Feedback Loop)
> **ATENÇÃO:** Se a spec (RAG) for ambígua, contraditória ou o design pattern imposto for impossível, **PARE**. Mude o status para `blocked` e escreva o motivo abaixo. Não alucine uma abstração não documentada.
- *[Nenhum problema identificado]*

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
- **[2026-07-14T12:46]** - *claude-fable* - `[Triado]`: Wiring da Bancada — auditoria 2026-07-14: placeholders declarados no App.tsx; endurecimento profundo just-in-time quando as deps fecharem
