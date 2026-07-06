---
id: EST-15
title: "SPIKE: empacotamento standalone do Estaleiro (Electron?) — instância rodando separada da working tree, cadência de atualização"
status: draft:placeholder
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-14"]
blocks: []
capacity_target: opus-spike
---

# EST-15 · SPIKE: empacotamento standalone (D4)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** a definir pelo spike (candidato: Electron). **Opus-spike** — decisão de tecnologia
  de empacotamento em aberto, entregável é ADR + PoC, não produção.

## 1. Objetivo
Resolver a decisão D4 do RFC-018: o Estaleiro **rodando** não pode ser a working tree do monorepo
onde ele mesmo vive (senão um agente que ele despacha pode corromper a instância em execução —
o problema de recursão). A solução aprovada é que a instância operacional seja uma **cópia/build
separada e standalone**, atualizada periodicamente a partir da fonte no monorepo. Este spike prova
o mecanismo: candidato de tecnologia (Electron é a hipótese registrada no RFC, mas o spike deve
avaliar alternativas — ex.: processo Node standalone + browser, Tauri), e a cadência de
atualização (rebuild manual? watch+rebuild? CI local?).

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (D4) e §3 ("Modelo de execução — resolve a recursão") — FONTE do problema e da decisão de alto nível.
- [ ] `apps/estaleiro/ui/` (EST-14) — o frontend a empacotar.
- [ ] `packages/plugin-dispatcher/` (EST-07) — quem despacha as tasks que poderiam, sem essa proteção, tocar o próprio Estaleiro.

## 3. Escopo de Arquivos — entregáveis do spike
- **[CREATE]** `docs/adr/00XX-empacotamento-standalone-estaleiro.md` — decisão de tecnologia + cadência, com PoC mínimo.
- **[CREATE]** PoC de build/empacotamento rodando a partir de um diretório separado da working tree do monorepo.

## 4. Estratégia de Testes
- [ ] PoC: build gerado a partir do monorepo roda de um diretório clonado/separado; editar o monorepo NÃO afeta a instância já buildada até o próximo rebuild explícito (prova da separação).

## 5. Instruções de Execução
1. Avaliar Electron vs. alternativas (Tauri, processo standalone) — critério: tamanho do build, complexidade de empacotamento, familiaridade da stack.
2. PoC: rodar 1 build a partir de um clone separado, provar que edições no monorepo fonte não vazam pra instância rodando sem rebuild explícito.
3. Definir cadência de atualização (registrar como decisão no ADR, não implementar automação agora se não for trivial).
4. Gate → §8.

## 6. Feedback de Especificação
- Fonte do problema = RFC-018 D4. A hipótese de tecnologia (Electron) é ponto de partida, não
  decisão fechada — o spike pode recomendar outra via com justificativa.

## 7. Definition of Done (DoD)
- [ ] ADR com decisão de tecnologia + cadência de atualização?
- [ ] PoC provando separação entre working tree fonte e instância rodando?

### Verificação automática *(a fixar no endurecimento)*
```bash
# comando do PoC de build/empacotamento, a definir pelo spike
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-
### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória):**
```
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.
