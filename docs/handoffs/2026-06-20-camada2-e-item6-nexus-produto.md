# Handoff: Camada 2 (aplicação) + decisões em aberto do item 6 (Nexus como produto)

**Gerado em:** 2026-06-20
**Sessão de origem:** endurecimento/subdivisão das tasks MGTIA → promoção do roadmap da Camada 2, i18n/UX, mockups, identidade visual e naming.
**Foco da próxima sessão:** fechar o **item 6** (orquestrador/Nexus como produto da Camada 2) e os pendentes de housekeeping listados no fim.

---

## Contexto essencial (modelo mental em 3 camadas)
- **Camada 1 — Plataforma:** `docs/plano-de-implementacao.md` (M0–M9). Protocolo/SDK P2P + Bancada (harness) + PWA-prova. Inclui UI de teste.
- **Camada 2 — Aplicação:** `docs/plano-aplicacao.md` (canônico, criado nesta sessão). Fundações de app (P0: T-DS/CN/PL/PG/JU/IA/WF/UI/MOD/SHL) + produtos (P1: T-MK/ERP/CFR/MAP/LOG/MSG/SOC/STR/AD/EML/CAL/OFF). Mapeia 1:1 às ~95 tasks já endurecidas.
- **Orquestrador (item 6):** a ferramenta MGTIA (família `T-10xx`, hoje "Nexus congelado") que o usuário decidiu **promover a módulo-produto da Camada 2** — um orquestrador genérico de tarefas/agentes, útil para não-devs. Não é "Camada 0"; é o **primeiro produto** da Camada 2 (serve para construir o resto). Blueprint genérico em `docs/rfcs/rfc- plugin_architecture_blueprint - draft.md` (na branch master, untracked).

## Estado atual (o que já foi decidido/feito)
Decisões 1–5 do usuário **aplicadas e commitadas**:
1. **Mantido o nó `PROFILE`** (não renomear para Agent — `agente-de-sistema`/`agente-de-ia` já são subtipos).
2. **Design-system roda em paralelo à Camada 1** (só depende de T-001).
3. **i18n + RTL** virou invariante de UI: locales `pt-BR/en/es/fr/de/it` + preparação RTL por propriedades lógicas CSS + formatação por jurisdição. (RTL era lacuna — não estava no caderno-04.)
4. **Design-system = pacote no monorepo** (`packages/design-system`, via T-011).
5. **Dev-docs no monorepo de código; specs/wiki neste repo de controle** (cross-link, não copiar).
Artefatos criados: `docs/plano-aplicacao.md`, `docs/inventario-de-telas.md`, `docs/diretrizes-ux.md`, task **T-DS-05** (spike identidade visual), mockups em `docs/mockups/`.

## Tarefa (item 6 — o que falta DECIDIR)
Fechar com o usuário, item a item:
- **6a — Descongelar o Nexus:** confirmar transição v1→v2. v1 (`apps/nexus-backend/frontend`, congelado, usado via `manage-task.mjs`/dist) segue como **ferramenta de bootstrap** que constrói L1 + P0; o **produto v2** é reconstruído sobre a plataforma. Quando virar plano, atualizar a nota "NEXUS CONGELADO" do `CLAUDE.md`.
- **6b — Reconciliações (sem duplicar):** o `provider-plugin` (provedores de IA, inspiração OpenCode) deve **reusar T-IA-02** ("LLM como plugin de compute"); o `context-plugin` (compactação, inspiração Headroom) deve reusar a **integração Headroom atual**, não criar uma terceira. `fs/terminal-plugin` → **T-PL-03** (sandbox node, capacidades por `ASSET:ROLE`, escopado à worktree). Gestão de tarefas = o próprio Nexus.
- **6c — Posição na sequência:** o módulo-Nexus é o **primeiro produto (A0/P1.0)**, após o subset de P0 que ele consome (T-PL, T-IA-02, T-MOD, T-SHL/T-PG). Confirmar.
- **Decisão de fundo:** construir o orquestrador **sobre a plataforma** (dogfooding: estado no grafo + Automerge + identidade — NÃO Y.js, que aparece só por a RFC ser genérica) vs. standalone. Recomendação da sessão anterior: sobre L1, com UI/plugins bespoke no início, migrando para T-PG/T-PL depois.

## Restrições e decisões já tomadas (NÃO refazer)
- Não renomear PROFILE. Não folddar o roadmap de aplicação dentro do `plano-de-implementacao.md` (ficou **separado** em `plano-aplicacao.md`). Y.js é não-problema (RFC genérica). Não duplicar T-IA-02 nem a Headroom.
- "Plano não é espelho 1:1": divergências legítimas vão em `tasks/_correlacao-plano.md`.

## Arquivos relevantes (ponteiros)
- `docs/plano-aplicacao.md` — roadmap Camada 2 (P0/P1 + invariantes UI + validação por marco).
- `docs/rfcs/rfc- plugin_architecture_blueprint - draft.md` (branch **master**, untracked) — blueprint do orquestrador. Renomear p/ `rfc-NNN-orquestrador-plugins.md` + registrar em `docs/rfcs/_status.md` quando madurar.
- `tasks/_correlacao-plano.md` — correlação task↔plano↔status.
- `docs/inventario-de-telas.md`, `docs/diretrizes-ux.md`, `docs/mockups/` (índice em `docs/mockups/README.md`).
- Tasks-chave do item 6: `tasks/T-PL-0{1..6}.md`, `tasks/T-IA-02.md`, `tasks/T-MOD-0{1..4}.md`, família `T-10xx`.
- Memórias relevantes: integração Headroom por superfície; workflow de worktrees.

## Pendentes de housekeeping (rápidos, fora do item 6)
- **Nome da rede:** usar `docs/mockups/gerador-nome-recursivo.html`; candidatos fortes: RAP/RPM/RPC (1ª letra recursiva + 2 letras-coringa C/P/R/T/M). Desenvolver wordmark quando escolher.
- Mockups da 1ª leva a desenhar: shell, gênese, backup-de-seed, convite, desbloqueio (ver `inventario-de-telas.md §E`).

## Sugestão de skills
- `/executar-task` (quando o item 6 virar tasks executáveis) · `/endurecer-task` (specs do orquestrador) · `/absorver-rfc` (quando a RFC do blueprint amadurecer) · `/verificar` (integridade da wiki após mexer em docs).
