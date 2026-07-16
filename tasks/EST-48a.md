---
id: EST-48a
title: "P0.3a SPIKE: persistência segura de credenciais de provider"
status: draft:triaged
complexity: 4
target_agent: devops_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-47"]
blocks: ["EST-48b"]
capacity_target: opus-spike
---

# EST-48a · P0.3a SPIKE: persistência segura de credenciais de provider

## 0. Ambiente de Execução Obrigatório
- **Repos:** `C:\Dev2026\superapp` (PoC) e `C:\Dev2026\Docs` (ADR).
- **Entregável:** decisão + PoC descartável/reutilizável; não entrega UI de configuração.

## 1. Objetivo
Escolher e provar o mecanismo mínimo para persistir API keys do Estaleiro standalone sem gravá-las
em texto puro no SQLite, logs, respostas HTTP, snapshots ou repositório. A solução deve sobreviver
ao restart e ter operações `set/get/delete`, com comportamento explícito quando o cofre não estiver
disponível.

## 2. Contexto RAG
- `docs/adr/0012-*` — forma real de empacotamento/execução standalone do Estaleiro.
- `tasks/EST-15.md`, `EST-19.md`, `EST-25.md` — packaging e operação.
- `tasks/EST-40.md`, `EST-42.md` — provider atual por env e UI que proíbe segredos.
- `apps/estaleiro/core/src/bootstrap.ts` e banco SQLite local.
- Documentação primária das opções avaliadas; não escolher biblioteca por memória.

## 3. Escopo de Arquivos
- **[CREATE]** `docs/adr/00NN-provider-secret-storage.md` — decisão, ameaças, alternativas e migração.
- **[CREATE]** PoC mínimo sob `apps/estaleiro/core/spikes/` ou teste isolado conforme ADR.
- **[NO CHANGE]** UI, rotas públicas e registry de providers.

## 4. Estratégia de Testes/Prova
- Escrever, reiniciar o processo, ler e excluir um segredo marker.
- Demonstrar que marker não aparece no `.db`, WAL, logs, JSON público ou arquivos versionados.
- Demonstrar erro claro se backend seguro estiver indisponível/bloqueado.
- Medir suporte do ambiente alvo atual e registrar limites de Windows/Linux/macOS se aplicável.

## 5. Instruções de Execução
> **NÃO FAZER:**
> - NÃO decidir por “base64”, hash reversível, chave fixa no código ou criptografia com chave no mesmo DB.
> - NÃO adicionar `keytar`/Electron/daemon sem confirmar compatibilidade com ADR-0012 e runtime atual.
> - NÃO colocar segredo real no PoC; usar marker sintético.

1. Ler o ADR de packaging e listar os ambientes realmente suportados hoje.
2. Avaliar no mínimo: cofre do SO, arquivo/SQLite cifrado com chave externa e manutenção via env.
3. Provar a opção recomendada no ambiente atual.
4. Gravar no ADR o contrato TS exato que EST-48b deve implementar.

## 6. Decisões que o spike deve fechar
- Backend de segredo e fallback permitido.
- Escopo do segredo (por usuário/máquina/workspace).
- Forma de referenciar o segredo no perfil persistido sem retornar seu valor.
- Migração do `DEEPSEEK_API_KEY` atual e política de delete/rotação.

## 7. Definition of Done
- [ ] ADR escolhe uma opção e rejeita as demais com evidência.
- [ ] PoC prova persistência após restart e ausência do marker em storage/logs públicos.
- [ ] Contrato `SecretStore` e erros estão fixados para EST-48b.
- [ ] Nenhuma credencial real foi usada ou registrada.

```bash
pnpm --filter @plataforma/estaleiro-core build
pnpm --filter @plataforma/estaleiro-core test
pnpm --filter @plataforma/estaleiro-core lint
```

## 8. Log de Handover e Revisão
### Handover do Executor:

### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**

## 9. Log de Execução
> Atualizado somente por `manage-task.mjs`/serviço MGTIA.
- **[2026-07-16T13:25]** - *gpt-5* - `[Triado]`: triagem P0.3a: spike obrigatório para fechar armazenamento seguro de credenciais
