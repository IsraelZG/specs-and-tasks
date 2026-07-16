---
id: EST-49a
title: "P0.4a Catálogo de modelos e capacidades de esforço"
status: draft:triaged
complexity: 4
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-48b"]
blocks: ["EST-49b"]
capacity_target: sonnet
---

# EST-49a · P0.4a Catálogo de modelos e capacidades de esforço

## 0. Ambiente de Execução Obrigatório
- **Repo de código:** `C:\Dev2026\superapp` em worktree `task/EST-49a`.
- **Regra externa:** assinaturas e parâmetros devem vir da documentação primária do endpoint e da
  versão instalada do AI SDK; nunca inferir compatibilidade pelo nome “OpenAI-compatible”.

## 1. Objetivo
Expor ao Chat um catálogo redigido de modelos disponíveis no perfil ativo e, para cada modelo,
informar somente opções de esforço realmente suportadas. O backend normaliza diferenças entre
providers; ausência de suporte resulta em lista vazia, não em parâmetro inventado.

## 2. Contexto RAG
- Perfis persistidos e `SecretStore` de EST-48b.
- `packages/plugin-providers/src/registry.ts`, `factory.ts`.
- Serviço de chat de EST-46/47.
- Documentação oficial de `GET /v1/models` e do parâmetro de esforço para cada provider alvo.
- Context7/source da versão instalada de `ai` e `@ai-sdk/openai`.

## 3. Escopo de Arquivos
- **[CREATE]** serviço de catálogo/capabilities no pacote escolhido no endurecimento.
- **[UPDATE]** API do host — listar modelos do perfil ativo sem expor chave.
- **[UPDATE]** contrato do Chat — aceitar `modelId` validado e esforço opcional normalizado.
- **[UPDATE]** testes unitários/integração com upstreams fake: catálogo suportado, endpoint ausente,
  modelo desconhecido e provider sem esforço.

## 4. Estratégia de Testes
- Lista de modelos é obtida com credencial server-side e retorna ids redigidos/estáveis.
- Modelo não listado é rejeitado antes da geração, salvo fallback explicitamente decidido.
- `effortOptions=[]` não envia nenhum parâmetro de esforço upstream.
- Para provider/modelo comprovadamente compatível, cada valor normalizado é mapeado ao wire field
  exato e capturado pelo fake upstream.
- 401/404/timeout não vazam chave nem corpo cru.

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO assumir que todo endpoint OpenAI-compatible implementa `/v1/models`.
> - NÃO mostrar `low/medium/high` se o provider não documentar suporte.
> - NÃO hardcodar modelos DeepSeek no frontend.
> - NÃO adicionar cache antes de existir necessidade medida.

1. Endurecer com documentação primária atual e versão instalada.
2. Fixar o contrato `ModelDescriptor` e o mapeamento de esforço.
3. Implementar catálogo com degradação explícita para endpoint não suportado.
4. Estender a geração com model/effort validados.

## 6. Feedback de Especificação
- Decisão a fechar no endurecimento: comportamento quando `/v1/models` não existe — cadastro manual
  de model id ou erro bloqueante. Não inventar antes de consultar os providers prioritários.

## 7. Definition of Done
- [ ] API lista modelos do perfil ativo sem segredo.
- [ ] Cada modelo informa opções de esforço comprovadas; lista vazia significa “não suportado”.
- [ ] Chat backend valida model/effort e envia o wire field correto.
- [ ] Fakes cobrem provider completo e provider parcialmente compatível.

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
- **[2026-07-16T13:25]** - *gpt-5* - `[Triado]`: triagem P0.4a: catálogo/capacidades exige endurecimento JIT com docs oficiais
