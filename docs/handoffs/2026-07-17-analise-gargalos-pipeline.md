# Análise de gargalos do pipeline — série L-03 / C-31 / C-32 (5 execuções instrumentadas)

**Data:** 2026-07-17 · **Autor:** `claude-opus` (a pedido do arquiteto)
**Fontes:** telemetrias dos handovers (L-03 ×3 sessões, C-31, C-32, todos `gpt-5`) + 3 relatórios de QA-review (`claude-opus`) + consolidado anterior.
**Pergunta:** o que muda o tempo de execução de verdade — incluindo mudanças profundas de pipeline.

---

## 1. A pirâmide: o tempo vive em três ordens de grandeza

A descoberta central ao cruzar os cinco logs: **estamos medindo segundos, perdendo minutos e sangrando horas.**

| Camada | Escala | Evidência medida | % do lead time real |
|---|---|---|---|
| **T1 — Comandos** (build/test/lint/push) | 20–155 s/task | L-03: 155 s · C-31: ~28 s · C-32: ~50 s de processo | **< 5%** |
| **T2 — Cerimônia** (setup, overhead de chamada, gates repetidos, relatório) | 5–15 min/task | detalhado na §2 | ~15–30% |
| **T3 — Espera** (dívida basal, descoberta serial, humano-como-scheduler) | horas | L-03: **~14,7 h** parada (20:19 → 11:02) esperando a C-31, que custou ~35 min de trabalho | **> 70%** |

Otimizar T1 (o teste SQLite de 15 s, o install de 33 s) enquanto T3 existe é polir a maçaneta com a casa pegando fogo. A ordem de ataque correta é **T3 → T2 → T1**.

## 2. Anatomia da cerimônia (T2) — os números novos de C-31/C-32

### 2a. Overhead de chamada de ferramenta: ~2× em cada comando
O dado mais valioso da telemetria dupla (`processo / chamada`) do worker:

| Comando (C-31/C-32) | Processo | Chamada | Overhead |
|---|---:|---:|---:|
| core build | 2,9 s | ~12,9 s | ~10 s |
| core test | 6,4 s | ~18,6 s | ~12 s |
| core lint | 6,8 s | ~16,8 s | ~10 s |
| git push | 3,2 s | ~13,2 s | ~10 s |
| git add | 0,5 s | 5,8 s | ~5 s |

**Mediana ~5–10 s de overhead por chamada** (runner/scheduler/harness). Uma sessão de worker tem 12–18 chamadas ⇒ **75–150 s de puro overhead** — frequentemente mais que a soma dos comandos. O worker paga o overhead *N* vezes porque roda os comandos um a um.

### 2b. Imposto fixo de setup por task
| Fase | L-03 | C-31 | C-32 |
|---|---:|---:|---:|
| Criar worktree | 58 s | 34,2 s | 28 s |
| — dos quais `pnpm install` | 33,3 s | 24,5 s | 18,7 s |
| Pré-builds P-012 (crypto→protocol→core) | ~31 s | ~9 s (com 1 falha-diagnóstico) | ~8 s |
| Bloqueio "Docs sujo" + drenagem | sim (incidente grave) | 15–22 s + coordenação | ~14 s |

Para a C-32 — um diff de **1 token** — o setup custou ~50 s e a sessão inteira ~6 min. A razão trabalho-útil/cerimônia de uma micro-task é < 5%.

### 2c. Gates repetidos
O mesmo gate rodou: worker (por sessão de pause/resume — L-03 rodou **3×** entre 16 e 17/07) + reviewer (na master mesclada). Custo do re-run do reviewer: 21–60 s quente. Em **três revisões, o meu re-run nunca contradisse a evidência colada pelo worker** — o que ele pegou de real (B1 da L-03, escopo da C-31) veio de **leitura de código e git**, não da reexecução.

### 2d. Recorrência não corrigida
O bloqueio "Docs sujo no `wt new`" ocorreu em **todas as três execuções** — depois de já ter sido flagrado como P0-2 no primeiro relatório. Diagnóstico bom, zero implementação: **o pipeline não tem uma via que transforme os P0 dos próprios relatórios em tasks**. Os achados de código têm `_pendencias.md` + `/agrupar-cleanup`; os achados de *processo* não têm equivalente.

## 3. Anatomia da espera (T3) — onde as horas moram

1. **~14,7 h de L-03 parada por baseline.** A implementação ficou pronta às 20:19 do dia 16; o `finish` só aconteceu às 11:02 do dia 17. O desbloqueio (C-31) custou ~35 min de trabalho de agente (investigação+spec ~20, execução ~4, review+integração ~9). **Razão espera/trabalho ≈ 25:1.** Causa: nada religa a task pausada quando o bloqueador cai — o humano é o scheduler.
2. **Descoberta serial de dívida mascarada.** lint `StoragePort` → build `transport` → WASM `bancada`: três dívidas basais, cada uma só visível após consertar a anterior, cada uma pagando um ciclo completo (spec→ready→worker→review→merge). Com visibilidade antecipada, as três teriam sido **uma varredura**.
3. **Pausa invisível.** `[Pausado/Handoff]` não muda o status projetado (`in_progress`), então o orquestrador não sabe se despacha, o reviewer tenta `claim` à toa (2 das minhas 3 revisões começaram com um falso-start de ~2–3 min), e o relógio de WIP mente.

## 4. Recomendações

### T3 primeiro — matar as horas

**R1. Auto-resume por bloqueador declarado (a maior alavanca única).**
`pause` ganha um campo machine-readable: `--blocked-on task:C-31` ou `--blocked-on gate:lint:@plataforma/core`. O `approve` do T-1029 já dispara side-effects; estender para: ao fechar C-31, **re-despachar automaticamente** toda task pausada com aquele bloqueador. As 14,7 h viram minutos. Implementação pequena: um campo no Log §9 + um hook no `TaskService.transition(approve)` + o orquestrador.

**R2. Manifesto de saúde da master (standing).**
Após cada merge (ou por cron), rodar `pnpm build && lint && test` de **todos** os pacotes na master e persistir um manifesto por pacote×dimensão (`core: build✓ test✓ lint✗(13)`). Efeitos compostos:
- mata a **descoberta serial**: as 3 dívidas teriam aparecido no dia 1, viravam **uma** sweep-task;
- **preflight de task**: o worker sabe *antes de começar* se o gate dele pode passar (L-03 não teria nem iniciado sem saber do lint vermelho);
- habilita o **gate baseline-aware**: critério = "não piorou o manifesto" em vez de binário verde — auditável, sem esconder dívida (o manifesto É o registro da dívida, com histórico git);
- é o detector automático de "quarta dívida escondida atrás do bancada".

**R3. Achados de processo viram tasks automaticamente.**
Espelhar o `_pendencias.md` para processo: os P0 de qualquer relatório de execução entram num ledger que o `/agrupar-cleanup` (ou gêmeo) drena em tasks de tooling. Critério de sucesso: o "Docs sujo no wt new" — flagrado 3×, implementado 0× — não sobreviveria a isso.

### T2 depois — matar os minutos

**R4. Pool de worktrees quentes.**
2–3 worktrees pré-preparadas (node_modules instalado, `dist` do grafo inteiro buildado), renovadas **assincronamente** após cada merge na master. `wt new` vira `wt claim`: reset --hard + branch ≈ 2 s. Elimina da rota crítica: install (19–33 s), P-012 (8–31 s) e o próprio acoplamento com o Docs (a pool não precisa ler task nenhuma para existir). O custo de manter a pool roda fora do caminho de qualquer task.

**R5. Gate canônico = 1 chamada + evidência como artefato.**
`pnpm gate <pkg>`: build topológico do grafo (mata P-012), build+test+lint do alvo, telemetria JSONL nativa, e **grava a evidência em arquivo commitado na branch** (saída + hash do HEAD). Consequências:
- colapsa 5–8 chamadas em 1 ⇒ economiza 50–100 s só de overhead de harness (§2a);
- `finish` valida a *presença e frescor* do artefato (hash == HEAD) — mata a classe "finish sem commit real" (aconteceu 2× na história) e o slip de transcrição (worker colou evidência no bloco do reviewer na L-03);
- o reviewer **verifica o artefato** em vez de re-rodar o gate (§2c mostrou que o re-run nunca agregou); re-run só se artefato ausente/stale. Economia: 20–60 s + uma chamada por review.

**R6. Faixa expressa para micro-tasks (fusão de cerimônia).**
C-31+C-32+C-33 = ~5 linhas somadas, três ciclos completos pagos. Duas mudanças:
- **Sweep-task**: 1 branch, N micro-fixes como commits separados, 1 review dos N commits (o método `git log master..branch` + `git show` por commit já é o que uso). O manifesto R2 é quem identifica o lote.
- **Review proporcional ao risco**: para `capacity: haiku` com diff ≤ N linhas e artefato de gate válido, o reviewer lê o diff e o artefato, **sem** re-executar nada. A independência (revisor ≠ autor) fica; a redundância mecânica sai.

### T1 por último — só depois de medir de novo

**R7.** Perfilar `sqliteStorage.test.ts` (15 s) e o custo residual de install — **somente** quando R4/R5 estiverem no ar, porque ambos mudam a linha de base (a pool pode tornar o install irrelevante).

## 5. Custo que ninguém mediu: a escrita dos relatórios

Meta-observação honesta: cada sessão desta série produziu um relatório manual de ~1 pág (worker e reviewer). É valioso — esta análise só existe por causa deles — mas custa minutos de agente por task e não escala. O R5 (JSONL nativo no gate/manage-task) permite **gerar** o esqueleto do relatório por script (fases, tempos, incidentes), deixando ao agente só o julgamento. Relatório-como-projeção, como o ledger já é.

## 6. Ordem de implementação sugerida

| # | Item | Esforço | Retorno |
|---|---|---|---|
| 1 | R1 auto-resume (`--blocked-on` + hook no approve) | S | mata a maior perda observada (horas) |
| 2 | R2 manifesto de saúde da master | S–M | mata descoberta serial + habilita preflight e baseline-aware |
| 3 | R5 gate canônico + evidência-artefato | M | mata P-012, ~100 s/task de overhead, transcrição, e re-run do review |
| 4 | R4 pool de worktrees quentes | M | mata 30–60 s/task e o acoplamento Docs↔setup |
| 5 | R3 ledger de achados de processo | S | garante que os P0 não recorram (já recorreram 3×) |
| 6 | R6 faixa expressa/sweep | M | corta ~2/3 da cerimônia das micro-tasks |
| 7 | R7 perfil T1 | S | só após 1–5 mudarem a baseline |

> Com R1+R2+R5 apenas, a série desta semana teria sido: as 3 dívidas detectadas de uma vez (R2), uma sweep de ~30 min (R6), L-03 re-disparada automaticamente no merge (R1) — lead time total estimado de **~1,5 h em vez de ~2 dias**.
