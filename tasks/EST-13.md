---
id: EST-13
title: "plugin-knowledge: docs/RAG markdown-first (OKF), FTS local, writer serial de commits"
status: draft:placeholder
complexity: 5
target_agent: logic_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-02"]
blocks: []
capacity_target: # a fixar no endurecimento — candidata a decompor (complexidade 5)
---

# EST-13 · plugin-knowledge

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js 22+. `packages/plugin-knowledge/`. **Candidata a decompor** (complexidade 5):
  fatiar em (a) leitura/navegação OKF (wikilinks), (b) FTS local, (c) writer serial de commits.

## 1. Objetivo
Implementar o plugin que serve o conhecimento markdown-first (OKF: .md + frontmatter YAML +
wikilinks `[[slug]]`) para RAG dos agentes — navegação por link + **índice FTS local** (E2, não
espera o cofre de código do caderno 31) — e um **writer serial** (B4) que serializa commits dos
artefatos markdown gerados/editados por múltiplos agentes concorrentes (mesmo padrão de proteção
que a `fila.mjs` do Docs, adaptado a este repo).

## 2. Contexto RAG
- [ ] `docs/rfcs/rfc-018-estaleiro.md` §2 (B4, E2) — as duas decisões centrais.
- [ ] **RFC-018 §6.4 (fronteira com plugin-skills):** o writer serial daqui é o MESMO utilitário
      compartilhado com EST-12 (uma implementação só); escrita de arquivo SEMPRE via
      `plugin-fs-tools` mediado, nunca fs direto.
- [ ] **`docs/_vendor/sift/`** (clone raso local) — referência do índice trigram, SE o endurecimento
      decidir que o FTS local se inspira nele (E2 pede FTS simples; sift é upgrade opcional futuro).
- [ ] `tools/scripts/fila.mjs` (Docs) — o padrão de writer serial a replicar (não copiar 1:1, adaptar ao contexto do repo de código).
- [ ] `docs/conceitos/` e `docs/caderno-*` (Docs) — o corpus OKF real, referência de estrutura (frontmatter, `modo: canonical`, wikilinks).
- [ ] `docs/caderno-3-sdk/30-otimizacao-de-contexto-e-tooling-de-agentes.md` §5/§7 — OKF como padrão nativo de navegação por agente; provider de contexto de código (fora de escopo aqui, é o caderno 31 futuro).

## 3. Escopo de Arquivos
- **[CREATE]** `packages/plugin-knowledge/src/{graph,fts,writer}.*`.
- **[CREATE]** testes de navegação por wikilink, busca FTS, e serialização de commits concorrentes.

## 4. Estratégia de Testes
- [ ] Navegação: dado um nó, resolve `[[links]]` de saída. FTS: busca por termo retorna arquivos corretos. Writer: 2 agentes editando simultaneamente não corrompem/perdem commit (mesma classe de teste que motivou a fila.mjs original).

## 5. Instruções de Execução
1. Navegação por link primeiro (mais simples, valor imediato pro RAG de agentes).
2. FTS local depois.
3. Writer serial por último (mais crítico de acertar, testar concorrência de verdade).
4. Gate → §8.

## 6. Feedback de Especificação
- Fonte de decisão = RFC-018 B4/E2. O cofre de código (caderno 31) e o provider trigram (sift-like)
  são explicitamente FORA de escopo aqui (E2 decidiu não esperar por eles).

## 7. Definition of Done (DoD)
- [ ] Navegação por wikilink funcional?
- [ ] FTS local retorna resultados corretos?
- [ ] Writer serial testado sob concorrência real (não só sequencial)?

### Verificação automática *(a fixar no endurecimento)*
```bash
pnpm --filter @plataforma/plugin-knowledge test
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
