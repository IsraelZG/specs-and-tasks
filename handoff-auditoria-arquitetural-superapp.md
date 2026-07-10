# Handoff: Auditoria arquitetural do SuperApp — continuação do pipeline MGTIA

**Gerado em:** 2026-07-02
**Sessão de origem:** Auditoria de qualidade de código do SuperApp (repo `Docs` = controle/specs; repo `superapp` = código, um nível acima) focada em modularidade, desacoplamento de storage/network, privacidade de dados e desenho do sistema de plugins.
**Foco desta sessão:** Continuar o pipeline MGTIA (endurecer → promover → executar) sobre as tasks geradas por esta auditoria, e eventualmente executar os dois spikes/ADR pendentes.

---

## Contexto essencial

Esta foi uma sessão de auditoria + correção de processo, não de implementação de código. Fluxo:
1. Auditei a doc (`docs/`) e o código (`../superapp/packages/`) contra os princípios do usuário: ninguém escreve SQL direto (tudo via TinyBase), núcleo agnóstico de qualquer transporte, privacidade estrita por autorização, interface robusta de plugins.
2. Gerei tasks corretivas para os achados (`T-1032`–`T-1039`).
3. Revisei o **critério de done** de T-305/T-305a/T-305b (primitiva de UCAN testada mas nunca ligada a um caller de produção — "primitiva testada ≠ feature entregue") e apliquei o fix **no processo**, não só na task: `.claude/agents/agile-reviewer.md` e `tools/scripts/generate-task.mjs` agora têm um **gate de wiring** (primitivas de segurança/privacidade precisam de caller de produção ou task de integração linkada) e um **gate de acoplamento/aciclicidade** (import cruzando pacote não pode fechar ciclo) em TODA task nova gerada daqui pra frente.
4. Rodei `/arquiteto-decisoes` para duas decisões bloqueadas: engine de storage (T-1037) e CRDT do estado de sessão de agentes de IA (T-1038) — ambas decididas nesta sessão (ver abaixo).
5. Rodei `/absorver-rfc` na RFC `plugin_architecture_blueprint` (draft não-numerado, fora do fluxo normal de RFCs) — **absorção parcial**, 8/10 subtasks concluídas.

**Nada precisa ser re-verificado quanto a git**: um `/drenar-fila` externo (rodando periodicamente, fora desta conversa) já commitou **tudo** que esta sessão produziu. Confirmei isso com `git status --short` em cada arquivo tocado — todos limpos. Não é preciso rodar `/drenar-fila` às pressas por causa desta sessão.

---

## Estado atual

### Tasks novas geradas (todas `status: draft`, `spec_status` variável — nenhuma passou por `/endurecer-task` ainda)

| Task | O quê | spec_status | capacity_target | Observação |
|---|---|---|---|---|
| [T-1032](tasks/T-1032.md) | Enforcement de sync dirigido por UCAN no responder RBSR | draft | sonnet | Depende de T-305a/T-305b/T-302a |
| [T-1033](tasks/T-1033.md) | Quebrar ciclo `core↔protocol` movendo `applyNodes` p/ core | draft | sonnet | Toca `exchange.ts`, coordenar com T-1032/T-1034 |
| [T-1034](tasks/T-1034.md) | Hardening do wire RBSR (filtro por peerId, ClockPort, encoding) | draft | sonnet | Mesmo arquivo que T-1032/T-1033 |
| [T-1035](tasks/T-1035.md) | Admin token do system-peer: timing-safe + sem log | draft | haiku | Independente, pode rodar já |
| [T-1036](tasks/T-1036.md) | KeyVault `requestEpochKey`: validar UCAN real + cópia defensiva | draft | haiku | Depende de T-501 |
| [T-1037](tasks/T-1037.md) | **SPIKE** storage engine-agnosticism | **triaged** | **opus-spike** | **Decisão já tomada** (Opção C híbrido) — falta só escrever o ADR |
| [T-1038](tasks/T-1038.md) | Absorver RFC plugin-blueprint | **triaged** | sonnet | Trabalho de absorção já **executado diretamente** via `/absorver-rfc` (ver seção própria abaixo) — esta task ficou como registro da decisão, não precisa de execução adicional de código |
| [T-1039](tasks/T-1039.md) | Enforcement UCAN no `canServeArchive` (Archive Cargo) | draft | sonnet | Depende de T-305a/T-313b |
| [T-1040](tasks/T-1040.md) | **SPIKE** distribuição unificada de plugins nativos (LiveKit SFU, llama.cpp) | **triaged** | **opus-spike** | **Decisão NÃO tomada** — é exploração genuína, ver seção própria |

### T-305 / T-305a / T-305b

Permanecem `status: done` (as primitivas `scopeRBSRTree`/`canAccess` estão corretas). Seção 7 (DoD) de cada uma ganhou uma nota "Critério de Done revisado (2026-07-02)" documentando o gate de wiring como precedente para tasks futuras — não é uma reabertura, é registro para o revisor não repetir o erro.

### Absorção da RFC de plugins — parcial, 8/10

Manifesto: [`docs/rfcs/_absorcao-plugin_architecture_blueprint.md`](docs/rfcs/_absorcao-plugin_architecture_blueprint.md).

- **[x]** AB-01, AB-02, AB-03, AB-04, AB-05, AB-07, AB-08 — concluídas (conteúdo já vive em `docs/caderno-3-sdk/12-plugins-e-computacao.md` — 4 novos archetypes: `context-plugin`, `fs-plugin`, `provider-plugin`, `research-plugin` — e em `docs/caderno-3-sdk/14-ia-rag-e-agentes.md §1.4/§5.5`, `docs/conceitos/documento-casca.md`, `docs/conceitos/agente-de-ia.md`).
- **[DESCARTADA]** AB-06 (já superseded por ADR-0006) e AB-10 (gateway HTTP — fora de escopo do produto, decisão humana).
- **[ ] PENDENTE:** AB-09 — escalada para o spike **T-1040**. **A RFC fonte (`docs/rfcs/rfc- plugin_architecture_blueprint - draft.md`) continua no disco de propósito** — só deletar quando T-1040 fechar e AB-09 for marcada `[x]` no manifesto. Não apague antes disso.

---

## Tarefa

Continuar o pipeline MGTIA normal sobre o que foi gerado:

1. **`/endurecer-fila T-103`** — endurecer em lote T-1032, T-1033, T-1034, T-1035, T-1036, T-1039 (as 6 que ainda são `draft`/precisam de assinaturas TS exatas). T-1037/T-1038/T-1040 já estão `triaged` com `capacity_target` fixado — não precisam de endurecimento igual (T-1037/T-1040 são spikes cujo entregável é ADR, não código; ver Seção 6 de cada uma para o que já foi decidido/explorado).
2. **`/arquiteto-promover T-103`** — depois de endurecidas, promove `draft→ready`.
3. **Executar os dois spikes** (T-1037 e T-1040) — cada um precisa de um ADR real em `docs/adr/`. A Seção 6 de cada task já tem a decisão (T-1037) ou as perguntas a explorar (T-1040) com bastante detalhe — não é preciso rehabilitar contexto do zero, só escrever o documento seguindo o que já está lá.
4. **Verificar o registro de status de T-1038** quando a absorção da RFC fechar (T-1040 resolvido, AB-09 `[x]`): aí sim atualizar `docs/rfcs/_status.md` (hoje só lista RFCs 100% absorvidas — não editei esse arquivo de propósito, ver "Restrições" abaixo) e deletar a RFC draft.

---

## Restrições e decisões já tomadas — NÃO relitigar

- **Storage (T-1037): Opção C híbrida, DECIDIDA.** Query-model tipado e agnóstico de engine para o **grafo append-only** (nodes/edges) — `StoragePort` deixa de expor `exec(sql)`. **Projeções locais** (views, índices) NÃO fazem parte do contrato replicado — são materialização da camada de índice (TinyBase-side), definida sobre o query-model, nunca SQL embutido no core. Isso responde à pergunta "o core sempre usa SQLite interno pras projeções?" — **não**: num deployment NoSQL, projeções são re-materializadas via índice nativo daquele engine, nenhum deployment arrasta um SQLite extra. Texto completo na Seção 6 de T-1037.
- **CRDT de agentes/plugins (T-1038): Automerge, DECIDIDA.** Nunca Y.js — já reescrito em todos os pontos do wiki tocados pela absorção. ADR-001 (Automerge único) já bastava, não precisou de edição.
- **Identidade de agente/plugin: persona delegada, DECIDIDA.** `agente-de-ia` (via `CONTENT:INTENT`/`ASSET:ROLE` delegado) + `profile-de-modulo` — **NUNCA** `PROFILE:SYSTEM` (esse é o agente-de-sistema, que serve a rede, não o usuário — ator errado para plugins/agentes de dev). Capacidade injetada por plugin é a **interseção** com o `ASSET:ROLE` do agente chamador, nunca escala além. Já registrado em `caderno-3-sdk/14-ia-rag-e-agentes.md §5.5` e `caderno-3-sdk/12-plugins-e-computacao.md §6.4`.
- **Trabalho durável de agente reusa a fila existente, DECIDIDO.** Task=nó, `ASSET:LOCK`+lease/heartbeat, `PERFORMED_BY` (`caderno-3-sdk/12-plugins-e-computacao.md §5`) + `sendSignal`/`sendIntent` (`caderno-4-governance/02b-modulos-profiles-mensageria.md`). **Nenhum "orchestrator"/"scheduler" novo** — isso foi uma tentação explícita da RFC original que foi rejeitada.
- **Distribuição de plugins nativos (T-1040): ABERTA DE PROPÓSITO.** O usuário quer garantir que o modelo marketplace-only (sem sideload) cobre software não-JS já existente (LiveKit SFU em Go, llama.cpp em C++) **antes** de fechar onde plugins vivem no monorepo. Não pré-julgue essa resposta — é exploração genuína, a Seção 6 de T-1040 lista as perguntas certas (assinatura multi-plataforma, mudança de modelo de confiança para binários de terceiro, tamanho/peso de modelos LLM no media plane).
- **Regra do repo Docs: NUNCA rode git direto.** Toda mudança em `tasks/*.md`/`docs/*.md`/etc é feita com `Edit`/`Write` e depois **enfileirada** via `node tools/scripts/fila.mjs add <ID> "<msg>" [paths extra]`. Um processo externo (`/drenar-fila`, rodando periodicamente) é o único committer. Não tente commitar você mesmo.
- **Gap de processo descoberto, ainda não corrigido:** os subagent types `incorporador` (usado por `/absorver-rfc`) e `auditor-wiki` (usado por `/absorver-rfc` e `/verificar`) **não carregam** nesta config de sessão — só existem os arquivos `.claude/agents/incorporador.md` e `.claude/agents/auditor-wiki.md`, mas o tool `Agent` rejeita esses nomes como `subagent_type`. Contornei com `general-purpose` + `model: haiku` replicando as regras inline, e rodando `node scripts/audit-links.mjs --json` diretamente em vez de despachar `auditor-wiki`. **Se isso persistir, vale investigar a configuração de plugins/agents** — outras skills que citam esses nomes (`/verificar`, `/rodar-onda` via `criador-verbete` — esse carregou OK — então o problema é específico de incorporador/auditor-wiki, não geral) vão bater na mesma parede.

---

## Arquivos relevantes

- `tasks/T-1032.md` … `tasks/T-1040.md` — as 9 tasks novas
- `tasks/T-305.md`, `tasks/T-305a.md`, `tasks/T-305b.md` — critério de done revisado
- `docs/rfcs/_absorcao-plugin_architecture_blueprint.md` — manifesto da absorção parcial (AB-09 ainda aberta)
- `docs/rfcs/rfc- plugin_architecture_blueprint - draft.md` — RFC fonte, **manter no disco** até T-1040 fechar
- `docs/caderno-3-sdk/12-plugins-e-computacao.md` — contrato de plugins + 4 archetypes novos
- `docs/caderno-3-sdk/14-ia-rag-e-agentes.md` — identidade do agente + reuso de infra
- `.claude/agents/agile-reviewer.md` §5.1 — gates de wiring e acoplamento (novo, permanente)
- `tools/scripts/generate-task.mjs` — DoD template com os 2 gates novos (novo, permanente)
- `tasks/_pendencias.md` — ledger de achados não-bloqueantes (não tocado nesta sessão, mas é onde achados pré-existentes descobertos — 3 links quebrados em `docs/conceitos/mgtia-workflow.md:259`, 15 órfãos — poderiam ser registrados se alguém quiser limpar depois; fora do escopo desta sessão)

## Sugestão de skills

- `/endurecer-fila T-103` — primeiro passo natural
- `/arquiteto-promover T-103` — depois do endurecimento
- `/executar-task T-1037` / `/executar-task T-1040` — para escrever os ADRs dos spikes (ou fazer diretamente numa sessão forte, já que o conteúdo de decisão já está compilado na Seção 6 de cada task)
- `/agrupar-cleanup` — se decidir varrer os achados pré-existentes (mgtia-workflow.md, órfãos) mencionados acima
