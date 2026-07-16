---
id: EST-47
title: "P0.2 Contexto integral no chat: histórico, CLAUDE.md e skills"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-46", "EST-12", "EST-30"]
blocks: ["EST-48a"]
capacity_target: sonnet
ui: true
---

# EST-47 · P0.2 Contexto integral no chat: histórico, CLAUDE.md e skills

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-47`.
- **Runtime:** Node.js 22+ · React 19 · Vitest · Playwright.

## 1. Objetivo
Validar que cada novo turno envia ao modelo, sem compactação: (a) todo o histórico da conversa
atual, (b) o `CLAUDE.md` selecionado e (c) o conteúdo integral das skills explicitamente ativas.
Adicionar ao Chat um controle mínimo de contexto ativo para habilitar/desabilitar `CLAUDE.md` e
selecionar skills por nome.

Não há persistência de conversas entre reloads nem execução de tools nesta fatia. Skill é enviada
como instrução/contexto textual; ela não ganha autoridade de ferramenta automaticamente.

## 2. Contexto RAG
- `tasks/EST-46.md` — chat v0 e contrato HTTP.
- `tasks/EST-12.md`, `tasks/EST-30.md` — `PluginSkills` vivo.
- `packages/plugin-skills/src/index.ts` — `listSkills`, `readSkill`, `readClaudeMd`.
- `apps/estaleiro/core/src/chat-service.ts` e UI de chat produzidos por EST-46.
- `packages/plugin-context/` — explicitamente fora do caminho nesta task; compactação vem depois.

## 3. Escopo de Arquivos
- **[CREATE]** `apps/estaleiro/core/src/chat-context.ts` — montagem determinística do contexto.
- **[UPDATE]** serviço/rota de chat — aceitar `messages[]` completos e seleção
  `{ includeClaudeMd: boolean, skillNames: string[] }`.
- **[UPDATE]** composition root — injetar porta read-only de skills/CLAUDE; sem usar write/commit.
- **[UPDATE]** testes core/integração — upstream fake captura o payload OpenAI-compatible.
- **[UPDATE]** `apps/estaleiro/ui/src/views/chat/` — reenviar o transcript completo a cada turno e
  exibir controle compacto “Contexto ativo”.
- **[UPDATE]** `apps/estaleiro/e2e/chat.spec.ts` — cenário de dois turnos e contexto selecionado.

## 4. Estratégia de Testes
- Dois turnos: o segundo request contém, na ordem, usuário 1, assistente 1 e usuário 2.
- `includeClaudeMd=true`: marker exclusivo do fixture de `CLAUDE.md` aparece uma única vez no
  contexto do request; `false` remove o marker.
- `skillNames=["fixture-a"]`: conteúdo integral de `fixture-a/SKILL.md` aparece; skill não selecionada
  não aparece; nome inexistente retorna erro estável sem path traversal.
- Anti-compactação: payload capturado contém textos longos byte-a-byte, sem chamar `plugin-context`.
- Browser: toggles refletem o request e o transcript continua ordenado após dois turnos.

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO resumir, truncar silenciosamente nem chamar crusher/CCR/LLMLingua.
> - NÃO enviar todas as skills automaticamente; somente nomes selecionados.
> - NÃO permitir path arbitrário vindo do browser.
> - NÃO dar tools, bash ou escrita ao chat nesta task.

1. Fixar o envelope e a ordem do contexto por testes de captura do request.
2. Implementar o builder puro e a leitura via `PluginSkills`.
3. Estender o ChatClient/UI com seleção explícita.
4. Provar dois turnos e markers de CLAUDE/skill no fake upstream.

### Pegadinhas conhecidas
- O histórico já inclui respostas do assistente; não duplicar a última resposta ao montar contexto.
- Instruções de projeto e skills devem ser delimitadas com cabeçalhos estáveis para evitar mistura.
- Limites duros de request devem falhar explicitamente; nesta fase não podem compactar em silêncio.

## 6. Feedback de Especificação
- Decisão fechada: contexto v0 = `CLAUDE.md` + skills selecionadas; AGENTS/docs/RAG adicionais ficam
  para task posterior quando houver uma seleção explícita.
- Decisão fechada: ordem normativa = instruções do projeto, skills selecionadas em ordem lexical,
  depois histórico integral.

## 7. Definition of Done
- [ ] Segundo turno prova que todo o histórico anterior foi enviado.
- [ ] CLAUDE.md e skills selecionadas chegam integralmente e não selecionadas não chegam.
- [ ] Nenhuma compactação ou tool execution ocorre.
- [ ] UI informa claramente quais fontes de contexto estão ativas.
- [ ] Build, test, lint, integração e Playwright verdes nos pacotes afetados.

```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
pnpm --filter @plataforma/plugin-skills build
pnpm --filter @plataforma/plugin-skills test
pnpm --filter @plataforma/plugin-skills lint
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
- **[2026-07-16T13:25]** - *gpt-5* - `[Triado]`: triagem P0.2: histórico integral e contexto explícito CLAUDE.md/skills, sem compactação
