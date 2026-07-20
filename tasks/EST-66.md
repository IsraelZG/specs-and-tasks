---
id: EST-66
title: "Varredura de conformidade visual das views do Estaleiro (pós-fundação de estilo)"
status: ready
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: [EST-65]
blocks: []
capacity_target: sonnet
ui: true
---

# EST-66 · Varredura de conformidade visual das views

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-66`.
- **Pré-condição dura:** EST-65 `done` (Tailwind + tokens ativos). Sem ela, qualquer ajuste de
  classe é invisível e não-verificável.
- **Referência visual (read-only):** `C:\Dev2026\Docs\docs\_vendor\superapp-shell\src\components\`
  — como a marca aplica cards, listas, mensagens (ex.: `messaging/ConversationView.tsx`).
- **Skill do worker:** `/executar-task-ui` (loop visual HMR + `/frontend-design`) — obrigatória
  para esta task; estilizar às cegas é o anti-padrão que ela existe para matar.

## 1. Objetivo
Com o pipeline de estilo vivo pela primeira vez (EST-65), TODAS as views renderizam suas classes
de verdade — e vão aparecer as inconsistências acumuladas de quando estilo "não importava".
Passar view a view (Chat, Board, Execução, Frota, Docs/RAG, Decisões, Custo, Config,
Planejamento, Terminal) corrigindo para o design system: superfícies, espaçamento, tipografia e
componentes DS onde existirem.

## 2. Contexto RAG
- Tokens/skin da EST-65 (`@plataforma/design-system/theme-dark.css`, `packages/shell/flexlayout-ds.css`).
- `apps/estaleiro/ui/src/views/**` — as 10 views; todas já usam classes Tailwind + vars `--ds-*`
  (escritas às cegas até hoje — esperar quebrados: contrastes, paddings, larguras fixas).
- `packages/design-system` build/react — componentes prontos (`Select`, botões etc.); catálogo em
  `packages/design-system/build/react/src/index.d.ts`.
- Chat: bolhas de mensagem devem usar `--ds-component-message-{bg,text}-{sent,received}` (tokens
  específicos p/ mensageria já existem na marca — hoje o ChatView usa tokens de botão como bolha).

## 3. Escopo de Arquivos
- **[UPDATE]** `apps/estaleiro/ui/src/views/**/*.tsx` — só classes/markup de estilo; ZERO mudança
  de lógica/estado/handlers.
- **[UPDATE]** `apps/estaleiro/ui/src/index.css` — apenas se precisar de utilitário app-wide (ex.:
  scrollbar styling), nunca regra por-view.
- Checklist mínimo por view (aplicar o que couber):
  1. Superfície do painel = `--ds-theme-surface-*` correto (canvas/default/raised) — não hex cru.
  2. Bordas/divisores = `--ds-theme-border-{subtle,default}`.
  3. Texto: hierarquia `content-{strong,default,muted,subtle}`; sem uppercase fora de labels.
  4. Botões/inputs: componentes DS ou tokens `--ds-component-{button,input}-*`; nunca cores fixas.
  5. Estados vazios/erro legíveis (`intent-danger-*` p/ erro, `content-muted` p/ vazio).
  6. Chat: bolhas com tokens de message; chips de tool com `--ds-component-badge-*`; card de
     aprovação com `--ds-component-alert-warning-*` (substituir os yellow-100/green-600 crus).
  7. Terminal/código: mono via `--ds-font-family-mono` — o ÚNICO lugar onde mono é default.

## 4. Estratégia de Testes
- Unit existentes das views continuam verdes (mudança é só de classe — se um teste cravar
  className, atualizar o teste com justificativa no §8).
- **E2E:** suite existente verde; sem E2E novo obrigatório (a EST-65 já cobre o anti-brutalismo).
- **Verificação visual (obrigatória no Parecer):** standalone reconstruído + screenshot de CADA
  view alterada (10 abas = 10 screenshots ou colagem) — Regra 3c.

## 5. Instruções de Execução
- Uma view por commit (`fix(EST-66): conformidade DS — <view>`), rastreável no review.
- **NÃO FAZER:**
  - NÃO mudar comportamento/props/estado — qualquer bug funcional achado vira nota no §8
    (`spec→` ou pendência), não fix aqui.
  - NÃO adicionar dependência nova.
  - NÃO redesenhar layout de view (posição de painéis é o FlexLayout, fora de escopo).

## 7. Definition of Done
- [ ] 10 views auditadas; checklist §3 aplicado; um commit por view alterada.
- [ ] Gate `pnpm gate @plataforma/estaleiro` allGreen.
- [ ] Screenshots por view no Parecer.

## 8. Handover / Parecer

## 9. Log de Execução (Agent Execution Log)
- **[2026-07-20T12:26]** - *claude-fable* - `[Triado]`: triagem: escopo e capacidade definidos na criação (estilo-first, ref superapp-shell vendored)
- **[2026-07-20T12:27]** - *claude-fable* - `[Endurecido]`: endurecida na criação: fatos verificados no código em 2026-07-20 (vite sem tailwind, index.css brutalista, tokens DS divergem do vendored), oráculo = docs/_vendor/superapp-shell, decisões de marca fechadas pelo arquiteto
- **[2026-07-20T15:17]** - *system* - `[Auto-promovida]`: dep EST-65 concluída
