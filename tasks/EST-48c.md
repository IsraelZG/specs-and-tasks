---
id: EST-48c
title: "P0.3c Config de endpoint e API key com cut-over do chat"
status: draft:triaged
complexity: 4
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-48b", "EST-47", "EST-42"]
blocks: ["EST-49b"]
capacity_target: sonnet
ui: true
---

# EST-48c · P0.3c Config de endpoint e API key com cut-over do chat

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-48c`.
- **Runtime:** React 19 · Vitest/JSDOM · Playwright/Chromium.

## 1. Objetivo
Adicionar à Config uma tela para cadastrar nome, endpoint OpenAI-compatible e API key write-only,
testar a conexão, ativar o perfil e removê-lo. Ao concluir, o Chat deixa de depender do DeepSeek
hardcoded e usa exclusivamente o perfil ativo persistido por EST-48b.

## 2. Contexto RAG
- `tasks/EST-42.md`, `EST-43b.md` — Config/Conexões atual.
- `apps/estaleiro/ui/src/views/config/` — client, hook e view reais.
- `packages/ui-engines/src/connectors/ConnectorConfigForm.tsx` — formulário atual declara que não
  aceita segredos; não contornar essa fronteira silenciosamente.
- API redigida e contrato de perfis de EST-48b.
- Chat/contexto de EST-46/47.

## 3. Escopo de Arquivos
- **[UPDATE]** `apps/estaleiro/ui/src/views/config/ProviderClient.http.ts` — CRUD/activate/probe.
- **[CREATE/UPDATE]** componentes locais de formulário em `views/config/` usando Design System.
- **[UPDATE]** `ConfigView.tsx`, hook e testes para lista, criação, edição de metadata, rotação
  write-only da key, ativação e exclusão.
- **[UPDATE]** ChatClient/UI somente no necessário para consumir o perfil ativo do servidor.
- **[UPDATE]** Playwright de Config e Chat cobrindo cadastro → probe → ativação → conversa.
- **[NO CHANGE]** `ConnectorConfigForm` genérico, salvo decisão explícita no endurecimento; ele hoje
  é corretamente não-secreto.

## 4. Estratégia de Testes
- Campo de API key usa input protegido, nunca preenche valor existente e limpa após sucesso.
- Reload mantém metadata/ativo, mas DOM/localStorage/sessionStorage nunca contêm a key marker.
- Criar perfil com upstream fake, testar, ativar e conversar no Chat.
- Rotação muda a credencial usada; delete remove referência do cofre e deixa Chat sem provider ativo.
- Erros de validação/cofre/upstream aparecem sem segredo.

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO armazenar API key no state além da submissão necessária, nem em cache do cliente.
> - NÃO retornar/preencher a key para edição.
> - NÃO manter fallback silencioso para `deepseek/deepseek-chat` após o cut-over.
> - NÃO criar seletor de modelo/esforço; isso é EST-49b.

1. Estender o cliente HTTP a partir do contrato de EST-48b.
2. Implementar o fluxo de Config usando componentes do Design System.
3. Remover a dependência hardcoded do Chat e exigir perfil ativo.
4. Provar o percurso completo em Chromium e anti-vazamento após reload.

## 6. Feedback de Especificação
- Se o ADR de EST-48a exigir interação nativa do SO incompatível com Playwright, o E2E usa um
  `SecretStore` fake injetado no host; o reviewer ainda executa smoke manual no backend real.

## 7. Definition of Done
- [ ] Operador cadastra endpoint/API key, testa e ativa sem editar `.env`.
- [ ] Configuração e seleção ativa sobrevivem a restart.
- [ ] API key não aparece em DOM, storage web, API de leitura, DB ou logs.
- [ ] Chat usa somente o perfil ativo; hardcode DeepSeek deixa o caminho de produção.
- [ ] Playwright cobre cadastro → probe → ativação → chat.

```bash
pnpm --filter @plataforma/estaleiro-ui build
pnpm --filter @plataforma/estaleiro-ui test
pnpm --filter @plataforma/estaleiro-ui lint
pnpm --filter @plataforma/estaleiro test:integration
pnpm --filter @plataforma/estaleiro test:e2e
```

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-16T13:25]** - *gpt-5* - `[Triado]`: triagem P0.3c: UI de configuração e remoção do hardcode após backend seguro
