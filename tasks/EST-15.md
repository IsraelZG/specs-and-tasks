---
id: EST-15
title: "SPIKE: empacotamento standalone do Estaleiro (Electron?) — instância rodando separada da working tree, cadência de atualização"
status: draft:hardened
complexity: 4
target_agent: devops_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["EST-14"]
blocks: []
decisions: ["D4: tecnologia de empacotamento standalone (Electron? Tauri? Node standalone?) + cadência de atualização"]
capacity_target: opus-spike # empacotamento standalone Electron? D4, requer ADR
---

# EST-15 · SPIKE: empacotamento standalone (D4)

## 0. Ambiente de Execução Obrigatório
- **Runtime:** a definir pelo spike. **Opus-spike** — entregável é ADR + PoC, não código de produção.
  Candidatos a avaliar: **Electron** (hipótese registrada RFC-018 §2 D4), **Tauri** (Rust backend,
  bundle menor), **processo Node standalone + navegador** (sem framework de desktop).
- **Package Manager:** `pnpm` (monorepo do superapp).
- **Escopo do PoC:** provar SEPARAÇÃO — editar o monorepo fonte NÃO afeta a instância standalone
  rodando até rebuild explícito. Não requer UI completa (EST-14) — um `index.html` servido pelo
  mecanismo standalone já prova o conceito.
- **Depende de:** `apps/estaleiro/ui/` (EST-14, draft:triaged) como alvo do empacotamento — mas o
  spike pode prosseguir analisando a spec de EST-14 (estrutura de views, shell FlexLayout,
  canal WS), sem aguardar código pronto.
- **Capacidade-alvo:** opus-spike — requer exploração de tecnologia + ADR.

## 1. Objetivo
Resolver a decisão D4 do RFC-018: o Estaleiro **rodando** não pode ser a working tree do monorepo
onde ele mesmo vive (senão um agente que ele despacha pode corromper a instância em execução —
o problema de recursão). A solução aprovada é que a instância operacional seja uma **cópia/build
separada e standalone**, atualizada periodicamente a partir da fonte no monorepo.

O spike deve:
1. **Avaliar tecnologias** de empacotamento desktop (Electron, Tauri, Node standalone + browser)
   contra critérios objetivos: tamanho do bundle, complexidade de build, familiaridade da stack,
   facilidade de atualização, segurança (sandboxing).
2. **Recomendar uma** via ADR, com justificativa rastreável.
3. **PoC:** provar que o mecanismo de build separa a instância rodando da working tree fonte.
4. **Definir cadência** de atualização (manual? watch+rebuild? CI local?).

## 2. Contexto RAG
- [x] `docs/rfcs/rfc-018-estaleiro.md` §2 (D4 — "O Estaleiro RODANDO é uma cópia/build standalone
  (Electron?), separada da working tree do monorepo") e §3 ("Modelo de execução — resolve a
  recursão").
- [x] `tasks/EST-14.md` (draft:triaged) — frontend a empacotar: shell FlexLayout (F1), 5 views (F2),
  canal WS único (F3), sob `apps/estaleiro/ui/`.
- [x] `tasks/EST-07.md` (draft:hardened) — plugin-dispatcher: quem despacha as tasks que poderiam,
  sem esta separação, tocar o próprio Estaleiro em execução.

## 3. Escopo de Arquivos — entregáveis do spike
- **[CREATE]** `docs/adr/00XX-empacotamento-standalone-estaleiro.md` — ADR com:
  - Problema (recursão, RFC-018 §3 verbatim ou resumo)
  - Opções avaliadas (Electron, Tauri, Node standalone+browser) com prós/contras por critério
  - Recomendação + justificativa
  - Cadência de atualização proposta
  - Se aplicável: alterações no `package.json` raiz ou scripts de build
- **[CREATE]** PoC de build/empacotamento em diretório separado da working tree (provar separação):
  local a definir pelo ADR, ex.: `../estaleiro-standalone-poc/` (fora do monorepo).

## 4. Critérios de Avaliação (Spike)
> Spike não tem "testes" no sentido unitário. Os critérios abaixo são a régua para o ADR e PoC.

### Critérios de avaliação de tecnologia (para o ADR)
1. **Tamanho do bundle inicial** (build limpo, sem assets da UI): < 50 MB? < 200 MB?
2. **Complexidade de build:** quantos passos além de `pnpm build`? Requer toolchain extra (Rust p/ Tauri)?
3. **Familiaridade da stack:** a equipe conhece? (Electron: JS/Node → sim. Tauri: Rust → requer aprendizado.)
4. **Facilidade de atualização:** substituir bundle + restart? Auto-update framework nativo?
5. **Segurança:** sandboxing do conteúdo renderizado? Acesso ao sistema de arquivos mediado?
6. **Manutenção:** frequência de breaking changes na camada de empacotamento? Tamanho da comunidade?

### Critérios de validação do PoC
7. **Build a partir do monorepo** gera artefato em diretório separado (ex.: `../estaleiro-standalone-poc/`).
8. **Instância standalone** iniciada a partir do artefato (ex.: `npm start` ou `./Estaleiro.exe`) serve
   conteúdo (pode ser `index.html` mínimo, não requer EST-14 montada).
9. **Prova da separação:** editar um arquivo no monorepo fonte (ex.: mudar texto no `index.html`),
   **NÃO** altera a instância standalone rodando. Só rebuild explícito reflete a mudança.
10. **Rebuild sem afetar instância já rodando:** fazer novo build em diretório separado (ex.:
    `../estaleiro-v2-poc/`) não derruba a instância v1.

## 5. Instruções de Execução
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implementar automação de CI/CD para a cadência de atualização — só documentar a
>   cadência recomendada no ADR. Automação é tarefa futura (fora do spike).
> - **NÃO** portar a UI completa (EST-14) para dentro do PoC — o PoC prova a SEPARAÇÃO, não a UI.
> - **NÃO** escrever o ADR depois do PoC sem registrar as descobertas — o ADR deve refletir o que
>   o PoC mostrou (não o contrário).
> - **NÃO** commitar binários/bundles no monorepo — o build standalone é fora da working tree.

1. **Pesquisa:** avaliar Electron vs Tauri vs Node standalone + navegador contra os 6 critérios (§4
   casos 1-6). Consultar documentação oficial de cada framework (docs, tamanhos de bundle típicos,
   exemplo "hello world" buildado).
2. **PoC:** 
   a. Criar diretório fora do monorepo (ex.: `../estaleiro-standalone-poc/`).
   b. Buildar um artefato mínimo (ex.: servidor Node + `index.html`, ou Electron hello-world, ou
      Tauri hello-world) que comprove a separação.
   c. Validar casos 7-10 (build separado, instância standalone, edição não vaza, rebuild paralelo).
3. **ADR:** escrever `docs/adr/00XX-empacotamento-standalone-estaleiro.md` com:
   - Problema, opções avaliadas, resultados do PoC, recomendação, cadência.
4. **Cleanup:** remover diretório PoC se fora do monorepo (opcional, documentar no ADR onde o PoC
   ficou).
5. Gate → §8 (evidência: ADR escrito + PoC funcionando).

## 6. Feedback de Especificação
> **Spike — decisões são o entregável, não gaps de especificação.**

- **Derivado (com fonte):**
  - Problema de recursão + solução standalone ← RFC-018 §2 D4 + §3 "Modelo de execução"
  - Hipótese inicial (Electron) ← RFC-018 §2 D4 (ponto de partida, não decisão)
  - Alvo do empacotamento ← EST-14 §0-3 (apps/estaleiro/ui/, shell FlexLayout + 5 views + WS)
  - Dispatcher que motiva a proteção ← EST-07 §1 (plugin-dispatcher despacha tasks que tocam FS)

- **Decisão a resolver (o próprio spike):** "Qual tecnologia de empacotamento standalone do Estaleiro
  e qual cadência de atualização?" — o ADR produzido por este spike deve responder. A decisão será
  fechada pelo arquiteto quando o ADR for aprovado.

- **Dependências vs paralelismo:** EST-14 (draft:triaged) é dependência formal porque o spike
  empacota o frontend — mas o spike não precisa do código pronto. Pode prosseguir analisando a
  spec de EST-14 e provando separação com conteúdo mínimo. Ajuste recomendado: trocar dependência
  para `EST-14` (spec) em vez de `EST-14` (código), ou marcar como `soft` se o serviço suportar.

## 7. Definition of Done (DoD) & Reviewer Checklist

### Critérios de aceitação do spike
- [ ] ADR (`docs/adr/00XX-empacotamento-standalone-estaleiro.md`) cobre: problema, ≥2 opções
      avaliadas com prós/contras, recomendação, cadência de atualização?
- [ ] PoC prova separação entre working tree fonte e instância rodando (casos 7-10 verdes)?
- [ ] Cadência de atualização documentada (manual / watch+rebuild / CI local)?
- [ ] O ADR registra qual tecnologia foi escolhida e por quê (critérios 1-6)?

### Verificação automática (Gate de Evidência)
O Worker deve colar na Seção 8:
- Conteúdo do ADR (ou link para ele) — texto da recomendação
- Evidência do PoC: saída do terminal mostrando:
  1. Build em diretório separado (`../estaleiro-standalone-poc/`)
  2. Instância rodando (ex.: `curl http://localhost:PORTA` ou captura de tela)
  3. Mutação no monorepo fonte que NÃO afeta a instância rodando
  4. Rebuild paralelo que não derruba a v1

```bash
# Exemplo (a concretizar pelo spike):
# cd ../estaleiro-standalone-poc && npm start &
# curl http://localhost:PORTA  # → conteúdo original
# echo "MUTACAO" >> ../../superapp/apps/estaleiro/ui/public/index.html
# curl http://localhost:PORTA  # → conteúdo original (NÃO mudou! → separação provada)
```

### Checklist do Reviewer
- [ ] ADR registra decisão de tecnologia com justificativa rastreável?
- [ ] PoC prova os 4 pontos da separação (build separado, instância standalone, mutação não vaza, rebuild paralelo)?
- [ ] Cadência de atualização documentada, mesmo que "manual por enquanto"?
- [ ] Nenhum binário/bundle commitado no monorepo?

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
- **[2026-07-06T12:15]** - *deepseek* - `[Triado]`: triado — spike standalone Electron? D4, capacity=opus-spike, requer ADR, depende de EST-14 (draft)
- **[2026-07-07T13:23]** - *big-pickle* - `[Decisão pendente]`: endureceu spec spike com criterios de avaliacao — decisao D4: tecnologia de empacotamento standalone (Electron? Tauri? Node standalone?) + cadencia de atualizacao
- **[2026-07-07T13:52]** - *Antigravity* - `[Decidido]`: Decisão: Opção C (Node Standalone + Browser) com cadência Manual (Opção B)
