---
id: EST-43
title: "P1: gate real remoto e local"
status: draft:triaged
complexity: 3
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-41", "EST-42"]
blocks: []
capacity_target: sonnet
---

# EST-43 · P1: gate real remoto e local

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-43`.
- **Prioridade:** fechamento de P1. P2 não começa antes deste gate.
- Requer um provider remoto configurado e Ollama ou LM Studio realmente disponível.

## 1. Objetivo
Criar um smoke reproduzível e executar a prova de produto de Conexões Híbridas: o mesmo host do
Estaleiro invoca um modelo remoto real e um modelo local real pelo caminho de EST-40/41; a UI de
EST-42 observa ambos. Somente esta task pode declarar P1 concluída.

## 2. Contexto RAG
- `docs/especificacao-estaleiro.md` §1 item 1.
- `docs/playbook/08-recon-arquitetural-adversarial.md` §7 e §10 (gate real).
- `tasks/EST-40.md`, `EST-41.md` e `EST-42.md`.
- `apps/estaleiro/tests/`, package scripts e runbook standalone.

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/tests/provider-hybrid-smoke.mjs` — chama exclusivamente a API do
  host para dois rosterNames configurados por env; nunca chama provider por fora do Estaleiro.
- **[CREATE]** teste automatizado do smoke com dois servidores OpenAI-compatible controlados.
- **[UPDATE]** `apps/estaleiro/package.json` — script nomeado para o smoke.
- **[UPDATE]** runbook do standalone com nomes de env e procedimento, sem valores secretos.
- **[UPDATE se necessário]** E2E da Config somente para provar os dois resultados na UI.
- **[NO CHANGE]** registry/factory, salvo bug bloqueante comprovado e devolvido às tasks anteriores.

## 4. Gate em duas camadas
### Teste determinístico
Dois upstreams controlados retornam marcadores diferentes. O smoke deve provar roteamento, timeout,
erro e que remoto/local não foram trocados. Esse teste protege o contrato, mas não fecha P1.

### Gate de produto obrigatório
Executar o mesmo prompt curto contra:
1. um roster remoto real configurado por `ESTALEIRO_REMOTE_MODEL`;
2. um roster local real configurado por `ESTALEIRO_LOCAL_MODEL`.

Registrar somente roster/provider/modelo, latência, tamanho e hash da resposta — nunca chave,
header ou conteúdo sensível. Ambos devem retornar texto não vazio pelo endpoint do Estaleiro.

## 5. Instruções
> **NÃO FAZER:**
> - NÃO substituir provider real por mock para finalizar.
> - NÃO ler/imprimir valores de API key.
> - NÃO chamar `generateText` diretamente do smoke; use `/api/providers/probe`.
> - NÃO iniciar P2 se apenas um dos lados passou.

1. Escreva e teste o smoke com upstreams controlados.
2. Rode build/test/lint/e2e.
3. Rode o gate remoto real.
4. Rode o gate local real.
5. Se credencial ou runtime local não estiver disponível, use `pause` e registre o pré-requisito;
   não altere status manualmente e não feche com evidência simulada.

## 6. Feedback de Especificação
- Pergunta humana somente se nenhum provider remoto autorizado ou nenhum runtime local puder ser
  disponibilizado. A escolha do modelo concreto é configuração operacional, não mudança de design.

## 7. Definition of Done
- [ ] Smoke automatizado diferencia dois upstreams e passa.
- [ ] Provider remoto real retorna texto pelo host.
- [ ] Provider local real retorna texto pelo mesmo host.
- [ ] UI mostra os dois resultados sem segredo.
- [ ] Nenhum contexto, tool, compressão ou agente foi antecipado.

```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro test:e2e
pnpm --filter @plataforma/estaleiro test:providers:hybrid
```

## 8. Log de Handover e Revisão
### Handover do Executor:
-

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência real remoto/local (obrigatória, sem segredo):**
```
```

## 9. Log de Execução

- **[2026-07-13T17:21]** - *gpt-5* - `[Triado]`: P1: gate real remoto e local
