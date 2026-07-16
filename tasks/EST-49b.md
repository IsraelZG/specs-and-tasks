---
id: EST-49b
title: "P0.4b Seletores de modelo e esforço no chat"
status: draft:triaged
complexity: 3
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-48c", "EST-49a"]
blocks: []
capacity_target: sonnet
ui: true
---

# EST-49b · P0.4b Seletores de modelo e esforço no chat

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-49b`.
- **Runtime:** React 19 · Vitest/JSDOM · Playwright/Chromium.

## 1. Objetivo
Adicionar ao cabeçalho/composer do Chat seletor de modelo e, quando suportado pelo modelo escolhido,
seletor de esforço. As opções vêm exclusivamente da API de EST-49a e são enviadas em cada turno.

## 2. Contexto RAG
- Chat e contexto de EST-46/47.
- Config/perfil ativo de EST-48c.
- `ModelDescriptor` e contrato de geração de EST-49a.
- `packages/design-system/src/components/Select/Select.tsx` e FormField/Label canônicos.

## 3. Escopo de Arquivos
- **[UPDATE]** `apps/estaleiro/ui/src/views/chat/ChatClient.http.ts` — catálogo e request.
- **[UPDATE]** `ChatView.tsx` e testes — seletores, loading, vazio e troca de modelo.
- **[UPDATE]** `apps/estaleiro/e2e/chat.spec.ts` — seleção refletida no upstream fake.
- **[UPDATE]** CSS somente para composição, usando tokens semânticos.

## 4. Estratégia de Testes
- Perfil ativo carrega modelos; o primeiro/default explícito é selecionado deterministicamente.
- Trocar modelo atualiza opções de esforço e limpa esforço inválido anterior.
- Modelo com `effortOptions=[]` não renderiza seletor nem envia `effort`.
- Catálogo vazio/erro desabilita envio com mensagem acionável.
- Playwright captura model id e esforço escolhidos no request real ao host.

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO hardcodar nomes de modelos ou opções de esforço no frontend.
> - NÃO exibir esforço para modelos sem capacidade declarada.
> - NÃO misturar seleção de provider nesta task; provider ativo vem da Config.
> - NÃO adicionar anexos, streaming ou persistência de conversa.

1. Estender o client e testar estados do catálogo.
2. Implementar os dois selects com Design System.
3. Propagar seleção a cada request de chat.
4. Provar troca de modelo/esforço em Chromium.

## 6. Feedback de Especificação
- Nenhuma decisão de provider deve ser tomada na UI; a API de EST-49a é a fonte única.

## 7. Definition of Done
- [ ] Modelo pode ser escolhido entre opções reais do perfil ativo.
- [ ] Esforço só aparece e é enviado quando suportado.
- [ ] Trocas preservam histórico/contexto da conversa atual.
- [ ] Unit e Playwright provam o payload selecionado.

```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro test:e2e
```

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-16T13:25]** - *gpt-5* - `[Triado]`: triagem P0.4b: seletores UI dependem do catálogo e cut-over
