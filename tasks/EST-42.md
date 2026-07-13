---
id: EST-42
title: "P1: painel Config de conexões LLM"
status: draft:triaged
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-38", "EST-41"]
blocks: ["EST-43"]
capacity_target: sonnet
ui: true
---

# EST-42 · P1: painel Config de conexões LLM

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-42`.
- **Prioridade:** P1 — superfície mínima para observar conexão híbrida.
- **Runtime:** React 19 · FlexLayout · Vitest/JSDOM · Playwright/Chromium.

## 1. Objetivo
Adicionar ao shell uma aba **Config / Conexões** que lista providers redigidos, diferencia local e
remoto, informa configuração/disponibilidade e permite executar o probe de EST-41 com rosterName e
prompt curto. A UI nunca lê, recebe, grava ou exibe valores de chaves.

## 2. Contexto RAG
- `docs/especificacao-estaleiro.md` §2 e §5.5.
- `tasks/EST-29.md`, `tasks/EST-35c.md`, `tasks/EST-38.md` e `tasks/EST-41.md`.
- `apps/estaleiro/ui/src/App.tsx`, `src/shell/default-layout.ts`, views e clientes HTTP existentes.

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/ui/src/views/config/` — view, cliente HTTP, hook e testes.
- **[UPDATE]** `apps/estaleiro/ui/src/App.tsx` — registrar a nova view.
- **[UPDATE]** `apps/estaleiro/ui/src/shell/default-layout.ts` — nova aba sem quebrar layouts salvos.
- **[UPDATE]** estilos somente em `ui/src/index.css`, reutilizando tokens existentes.
- **[UPDATE]** E2E para listar e executar probe.
- **[NO CHANGE]** armazenamento de segredos, provider registry, workflow, tools e agentes.

## 4. Estratégia de Testes
1. Lista renderiza `local/remoto` e `configured` sem qualquer valor secreto.
2. Probe mostra loading, sucesso, timeout, provider desconhecido e local offline.
3. Resposta exibe provider, modelo, latência e texto.
4. Browser real navega até Config e executa probe contra endpoint controlado.
5. Busca no DOM/snapshot confirma ausência de nomes/valores de env sensíveis.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO criar formulário de API key nesta prioridade.
> - NÃO guardar credenciais em localStorage/TinyBase.
> - NÃO chamar diretamente provider externo do browser.
> - NÃO montar contexto, habilitar tools ou disparar agente.
> - NÃO usar apenas mock de componente como gate; Playwright deve atravessar HTTP real do host.

1. Espelhe o padrão do `TaskClient.http.ts` para o cliente de providers.
2. Adicione a aba ao FlexLayout preservando compatibilidade do layout salvo.
3. Cubra estados e prove round-trip no browser.

## 6. Feedback de Especificação
- Gestão segura de credenciais completa continua fora de P1; nesta onda o servidor lê env/config
  e a UI recebe somente metadata redigida.

## 7. Definition of Done
- [ ] Config lista e testa providers sem receber segredos.
- [ ] Fluxo passa em Chromium contra host real.
- [ ] Layout anterior continua carregando ou migra deterministicamente.

```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro test:e2e
```

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência:**
```
```

## 9. Log de Execução

- **[2026-07-13T17:21]** - *gpt-5* - `[Triado]`: P1: painel Config sem segredos
