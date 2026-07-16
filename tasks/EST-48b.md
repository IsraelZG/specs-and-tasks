---
id: EST-48b
title: "P0.3b Backend de perfis OpenAI-compatible persistidos"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-48a", "EST-40", "EST-41"]
blocks: ["EST-48c", "EST-49a"]
capacity_target: sonnet
---

# EST-48b · P0.3b Backend de perfis OpenAI-compatible persistidos

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-48b`.
- **Pré-condição:** ADR e contrato de `SecretStore` de EST-48a concluídos.

## 1. Objetivo
Implementar perfis persistidos de endpoints OpenAI-compatible, separando metadata não secreta do
segredo. Oferecer API redigida de criar/listar/atualizar/excluir/ativar perfil. O chat passa a poder
resolver um perfil ativo, mas a remoção final do hardcode de UI ocorre em EST-48c.

## 2. Contexto RAG
- ADR produzido por EST-48a — fonte absoluta para armazenamento de segredo.
- `packages/plugin-providers/src/registry.ts`, `factory.ts` — defaults e factory atuais.
- `apps/estaleiro/core/src/bootstrap.ts`, `provider-probe.ts`, serviço de chat de EST-46/47.
- `tasks/EST-21.md`, `EST-22.md` — storage/composition root existentes.

## 3. Escopo de Arquivos
- **[CREATE]** módulo de perfis em `packages/plugin-providers/src/` ou
  `apps/estaleiro/core/src/` conforme direção fixada no endurecimento.
- **[CREATE]** migração/tabela SQLite para metadata: id, nome, baseURL, ativo e referência opaca ao
  segredo; nunca valor da chave.
- **[CREATE]** implementação do `SecretStore` definido pelo ADR.
- **[UPDATE]** composition root e API HTTP com CRUD/activate redigidos.
- **[UPDATE]** provider factory/chat para aceitar perfil resolvido por id.
- **[UPDATE]** testes unitários e de integração.

## 4. Estratégia de Testes
- CRUD persiste metadata após restart; somente um perfil fica ativo.
- API key criada/rotacionada/deletada passa pelo `SecretStore` e nunca aparece em DB/API/log/erro.
- `GET` retorna apenas `hasApiKey: boolean` e metadata permitida.
- Endpoint inválido, id desconhecido e cofre indisponível têm códigos estáveis.
- Chat com perfil ativo usa baseURL/key corretos contra upstream fake.

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO persistir `apiKey` no objeto `ProviderConfig`, TinyBase, localStorage ou SQLite em claro.
> - NÃO manter dois registries concorrentes; defaults atuais podem virar seed/migração, não fonte paralela.
> - NÃO devolver segredo após criação, nem para “editar”. Rotação é write-only.

1. Endurecer após EST-48a com paths/tipos exatos do ADR.
2. Implementar storage de metadata e segredo separadamente.
3. Expor CRUD/activate redigido.
4. Integrar resolução do perfil ativo ao serviço de chat.

## 6. Feedback de Especificação
- Esta task não pode ser promovida para `ready` antes de EST-48a: backend, erros e migração dependem
  da decisão de segurança.

## 7. Definition of Done
- [ ] Perfis e seleção ativa sobrevivem a restart.
- [ ] Segredo sobrevive a restart no cofre escolhido e não aparece em superfícies públicas.
- [ ] Chat consegue usar perfil ativo injetado em teste.
- [ ] CRUD, rotação, delete e falhas do cofre estão cobertos.

```bash
pnpm --filter @plataforma/plugin-providers build
pnpm --filter @plataforma/plugin-providers test
pnpm --filter @plataforma/plugin-providers lint
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
pnpm --filter @plataforma/estaleiro test:integration
```

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-16T13:25]** - *gpt-5* - `[Triado]`: triagem P0.3b: backend depende do ADR de EST-48a
