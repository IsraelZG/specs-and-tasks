# Proposta de implementação — R1–R6 + telemetria constante + aceleradores de agente

**Data:** 2026-07-17 · **Autor:** `claude-opus` · **Status:** proposta para aprovação do arquiteto (tasks ainda NÃO criadas)
**Insumos:** análise de gargalos (5 execuções), sugestões do worker `gpt-5`, pedido do arquiteto (log constante de execução + scripts anti-fricção + decisão sobre gate no review).

---

## 0. Duas descobertas que mudam o desenho

### 0a. P-012 já está resolvido — o turbo só não está sendo usado
`turbo.json` do superapp **já declara** `"build": {"dependsOn": ["^build"]}` — build topológico automático. O P-012 ("worktree nova falha sem dist das deps") acontece porque os agentes rodam `pnpm --filter @plataforma/core build`, que invoca o script `build` **do pacote direto** (tsc cru), **bypassando o turbo**. `turbo run build --filter=@plataforma/core` constrói `crypto → protocol → core` sozinho, com cache.
**Consequência:** o "gate canônico" não é um construtor de grafo a escrever — é um **wrapper fino** sobre o turbo. Custo de implementação despenca de M para S.

### 0b. O overhead está nas CHAMADAS, não nos comandos — isso define a arquitetura da telemetria
Medido: ~5–10 s de harness por chamada de ferramenta (lint 6,8 s processo → 16,8 s chamada; leitura de skill 0,9 s → 20,7 s). Logo, **qualquer solução de telemetria ou de processo que adicione chamadas é anti-solução**. Regra de ouro de todo este desenho: **zero chamadas extras** — medir e acelerar *dentro* das chamadas que já acontecem.

---

## 1. Telemetria constante por task — desenho de overhead zero

**Rejeitados:**
- **Hooks do harness** — funcionam só no Claude Code; os workers rodam em harnesses variados (`gpt-5` em outro). Não portátil.
- **Script start/end por etapa chamado pelo agente** — 2 chamadas extras × ~7 s × N etapas = pior que o problema. E depende de disciplina do agente (o `not_measured` de hoje prova que disciplina não escala).
- **Instrução na skill (status quo)** — telemetria manual em prosa: inconsistente, cara, não agregável.

**Adotado: telemetria embutida nos scripts que os agentes JÁ chamam.**
1. Módulo `tools/scripts/lib/telemetry.mjs` (~20 linhas): `emit({task, phase, cmd, startedAt, wallMs, exitCode, cwd, actor})` → appenda em `tasks/.telemetry/<ID>.jsonl` (**gitignored**, como INDEX/LEDGER).
2. Quem emite (sem o agente saber): `manage-task.mjs` (toda transição), `worktree.mjs` (create/claim/remove), o novo `gate` (uma linha por fase: build/test/lint), `fila.mjs` (add/flush), `orquestrar.mjs` (dispatch).
3. **Tempo de raciocínio/leitura: derivado, não medido.** Os eventos têm timestamps; o *gap* entre o fim de um evento e o início do seguinte = tempo de agente+harness. Não se cronometra o pensamento — ele aparece por subtração.
4. **`relatorio.mjs <ID>` — projetor** (mesmo padrão do `ledger.mjs`): lê o JSONL e gera o esqueleto do relatório de execução — tabela de fases com tempos, gaps, incidentes (exitCode≠0), total por camada (setup/gate/transição/espera). O agente anexa só julgamento, se houver. O relatório-por-task vira **subproduto automático**, não tarefa.

**Overhead para o agente: zero chamadas, zero instruções novas.** Cobertura: 100% das fases que passam por script (setup, gate, transições, fila, push via gate) — que é exatamente onde o tempo T1/T2 vive.

## 2. Resposta direta: pular o gate no review?

**Sim — substituindo reexecução por verificação. Nunca por confiança em prosa.**

Evidência: em 4 revisões, meu re-run **jamais contradisse** a evidência do worker; todo achado real (B1, escopo) veio de **leitura de código e git**. Mas houve um slip de transcrição (worker colou evidência no bloco errado) — prosa colada não é confiável; **hash é**.

**Protocolo em 3 níveis (substitui o §2 do qa-review):**

| Nível | Quando | O que o reviewer faz |
|---|---|---|
| **0 — sempre** | toda review | `claim` · escopo por commits (`git log master..branch` + `git show`) · **auditoria de código** (é onde os bugs reais aparecem) · **validar o artefato de gate**: `.gate/<tree-sha>.json` commitado na branch, com `treeSha == git rev-parse HEAD^{tree}` |
| **1 — no merge** | integrar | árvore do merge == árvore da branch (`HEAD^{tree} == branch^{tree}`) → **evidência transfere, zero execução** (provado na L-03 rodada 2). Árvore difere (master avançou) → **1 gate na master mesclada** — essa execução é genuinamente nova (testa a composição que nunca existiu), não redundância |
| **2 — exceção** | re-run completo | artefato ausente/stale · task de crypto/segurança/autorização · suspeita fundamentada do reviewer |

Economia: 20–60 s + 1–2 chamadas por review, e o reviewer gasta o tempo onde ele rende — lendo código. O que **não** muda: veredito continua exigindo evidência (agora criptograficamente amarrada ao commit, mais forte que hoje).

## 3. `briefing.mjs` — o context pack em 1 chamada

Fricção medida: agentes gastam chamadas caras achando skill (20,7 s), worktree, task, RAG, parecer. Cada leitura é ~5–20 s de chamada.

`node tools/scripts/briefing.mjs <ID> [--skill executar-task|rework-task|qa-review]` imprime, em **uma** saída:
1. Task completa (frontmatter + corpo).
2. **RAG resolvido**: conteúdo dos links da §2 (com trecho da seção citada quando houver âncora; arquivo inteiro se pequeno; aviso `fonte-nao-resolve` se quebrado — nunca inventa).
3. **Estado do mundo**: caminho da worktree (existe? limpa?), branch, últimos commits `master..task/<ID>`, merge-base vs master, manifesto de saúde do pacote-alvo (§R2).
4. Se `rework`: o último Parecer destacado com os `[Bn]`.
5. `--skill`: inline do texto da skill (portátil para qualquer harness).

Substitui 4–8 chamadas por 1 ⇒ **~30–90 s por sessão** + elimina a variância de "cada agente procura do seu jeito". Também emite evento no JSONL (`phase: briefing`).

## 4. Mapa de implementação R1–R6

| R | Implementação concreta | Onde | Esforço |
|---|---|---|---|
| **R1 auto-resume** | Convenção machine-readable no `pause`: mensagem termina com `[blocked-on:task:C-31]` ou `[blocked-on:gate:lint:@plataforma/core]`. No **wrapper** `manage-task.mjs` (sem tocar o nexus congelado): após `approve` bem-sucedido, varrer `tasks/*.md` por `blocked-on:task:<ID>` aprovado (e `blocked-on:gate:*` se o manifesto R2 ficou verde) → disparar `orquestrar.mjs --resume <IDs>` fire-and-forget | `manage-task.mjs` + `orquestrar.mjs` | **S** |
| **R2 manifesto de saúde** | `saude.mjs`: roda `turbo run build lint test` (full) na master do superapp, grava `tasks/SAUDE.md` + `.json` (gitignored, regenerado — padrão INDEX/LEDGER): pacote × dimensão × verde/vermelho × erro-resumo × sha. Gatilhos: `integrar-task` pós-merge (async, fire-and-forget) + sob demanda. O `gate` e o `briefing` leem o manifesto → **preflight** ("seu pacote-alvo tem lint vermelho basal — não comece sem decidir") | novo `saude.mjs` + 1 linha no integrar | **S–M** |
| **R4 pool de worktrees** | Slots de **caminho fixo** `_slot-1..3` (renomear diretório quebra o `.pnpm` no Windows — caminho fixo evita o problema e resolve o writable-root de uma vez): `wt claim <ID>` = reset --hard origin/master + branch no slot livre (~2 s); `wt release` no integrar; `wt refresh` assíncrono pós-merge (install se lockfile mudou + `turbo build` full → slot volta quente) | `worktree.mjs` | **M** |
| **R5 gate canônico + artefato** | `pnpm gate <pkg>` (script no superapp): `turbo run build --filter=<pkg>` (§0a mata P-012) → `test` → `lint` do alvo, **1 chamada**, capturando saída → grava `.gate/<treeSha>.json` (fases, tempos, exitCodes, saída, treeSha) **commitado na branch** → JSONL. `finish` no manage-task valida artefato presente e `treeSha == HEAD^{tree}` (mata "finish sem commit" E o slip de transcrição) | script no superapp + validação no manage-task | **S** |
| **R3 ledger de processo** | Bloco `<!-- BEGIN PROC-PENDENCIAS -->` no `_pendencias.md` (ou `_processo.md`); os P0/P1 de relatórios de execução entram ali; `/agrupar-cleanup` (ou gêmeo `/agrupar-processo`) drena em tasks de tooling. Critério: o "Docs sujo no wt new" (3 recorrências, 0 implementações) teria virado task na 1ª | `_pendencias.md` + skill | **S** |
| **R6 faixa expressa + sweep** | Na skill `qa-review`: `capacity: haiku` + diff ≤ 20 linhas + artefato válido ⇒ review = diff + artefato, sem execução própria (nível 0 sem o gate). **Sweep-task**: 1 branch, N micro-fixes como commits atômicos, 1 review commit-a-commit — o manifesto R2 é quem identifica o lote | skills + convenção | **S** |

### Itens do worker já resolvidos ou reclassificados
- **"Corrigir 13 erros basais de lint"** — ✅ feito (C-31, master `08d2311`).
- **"Gate que constrói dependências"** — o turbo já faz (§0a); vira o R5.
- **"wt new não exigir Docs limpo"** — patch pequeno no `worktree.mjs` (fetch-only no Docs; nunca exigir limpo; nunca sugerir `stash/restore/clean`); o pool R4 o torna quase irrelevante (slots não recriam), mas o patch entra mesmo assim por segurança.
- **"`.superapp-worktrees` como writable root"** — é **config de harness, não script**: adicionar os slots fixos à allowlist uma vez. Fazer imediatamente, sem task.
- **"Specs executáveis (assinaturas TS, export público, arquivo de teste)"** — já é a disciplina do `/endurecer-task`; o reforço concreto: o checklist do endurecedor ganha o item **"export público esperado declarado?"** (a lição do B1 da L-03) — 1 linha na skill.
- **"Otimizar install e sqliteStorage.test"** — T1, adiar até R4/R5 mudarem a baseline (podem tornar ambos irrelevantes).

## 5. Pacote de tasks proposto (após aprovação — nomes indicativos)

| # | Task | Conteúdo | Esforço | Depende de |
|---|---|---|---|---|
| P-01 | Gate canônico + artefato de evidência | R5 (superapp: script `gate`; Docs: validação no finish) | S | — |
| P-02 | Telemetria embutida + projetor | §1 (`lib/telemetry.mjs` + emissões + `relatorio.mjs`) | S | P-01 (gate emite) |
| P-03 | `briefing.mjs` | §3 | S | — |
| P-04 | Auto-resume `blocked-on` | R1 | S | — |
| P-05 | Manifesto de saúde `saude.mjs` + preflight | R2 | S–M | P-01 ajuda |
| P-06 | Pool de worktrees (slots fixos) + patch Docs no wt | R4 + P0 do worker | M | — |
| P-07 | Skills: qa-review 3 níveis + fast-track + executar-task usa briefing/gate + item de export no endurecer | §2, R6, R3 | S | P-01–P-03 |
| — | Writable roots (config, sem task) | imediato | — | — |

**Ordem recomendada:** P-01 → P-02/P-03/P-04 (paralelos) → P-05 → P-07 → P-06.
P-01 é a fundação (artefato + turbo); P-06 é o mais invasivo e o único M — por último, com os demais já medindo o ganho via telemetria nova.

**Contrafactual da série desta semana com o pacote completo:** 3 dívidas visíveis de uma vez (P-05) → 1 sweep (P-07) → L-03 re-disparada no merge (P-04) → reviews sem gate redundante (P-07) → relatórios gerados (P-02). Lead estimado ~1,5 h vs ~2 dias reais.
