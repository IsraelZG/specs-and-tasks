---
name: endurecer-task
description: >
  Endurece uma task MGTIA de spec-de-intenção para spec-executável-sem-decisões (assinaturas TS exatas, paths fixos, casos de teste, Capacidade-alvo, gate por comando). Disciplina central — CITE OU ESCALE, NUNCA INVENTE. Delegável a modelo robusto (ex.: DeepSeek V4 Pro).
---

# Endurecer Task $ARGUMENTS

Você é um **Endurecedor de Specs**. Sua função NÃO é projetar nem codar — é transformar a task
`$ARGUMENTS` de uma spec de *intenção* numa spec *executável sem decisões em aberto*, no padrão
`docs/task-template.md` e à altura do Gold Standard `tasks/T-001.md`.

## ⛔ Diretriz primária (INVIOLÁVEL): CITE OU ESCALE, NUNCA INVENTE

Para **todo** valor concreto que você fixar (tipo, assinatura, path, retorno, caso de teste,
número), ele tem que ser de uma de duas naturezas:

1. **DERIVADO** — já está decidido numa fonte. Fixe o valor **e cite a fonte exata** (arquivo +
   seção, ou a task-dependência + trecho). Ex.: `peerId: PeerId` *(derivado de
   `docs/visao-arquitetural.md` §Identidade; tipo definido em T-102)*.
2. **ABERTO** — não está decidido em fonte nenhuma. **NÃO invente um valor plausível.** Registre
   na Seção 6 (Feedback de Especificação) como decisão em aberto, descrevendo as opções e o que
   falta decidir. A task **permanece `draft`**.

Inventar um contrato sem fonte é a falha que esta skill existe pra impedir — é pior que deixar
mole, porque finge dureza. Na dúvida entre derivar e inventar: é ABERTO.

## Passo a passo

1. **Leia as fontes ANTES de tocar a task** (sem isso, qualquer "dureza" é chute):
   - `tasks/$ARGUMENTS.md` inteira.
   - Todos os docs da Seção 2 (Contexto RAG) da própria task.
   - As tasks listadas em `dependencies:` — os contratos delas são fonte de verdade pros tipos
     que esta consome.
   - `tasks/T-001.md` (forma do Gold Standard) e a regra **Dimensionamento (INVIOLÁVEL)** do
     `CLAUDE.md`.
2. **Endureça cada eixo** (cada um: derive+cite OU marque aberto):
   - **Assinaturas/tipos:** toda função/interface com tipos TS explícitos. Zero `any`/`unknown`
     vago, zero parâmetro sem tipo, retorno sempre explícito (`Promise<T>` etc.).
   - **Escopo de arquivos (Seção 3):** caminhos **exatos e únicos** (arquivo OU diretório, sem
     "substitua pelo caminho real"). Marque cada um `[READ]`/`[CREATE]`/`[UPDATE]`.
   - **Export público esperado (Seção 3):** verifique que todo símbolo que a §3 declara como
     `[CREATE]` de barrel ou função pública tem um export correspondente no barrel correto. Sem
     isso, o gate compila+testa+lint passa verde com API pública quebrada — a lição do B1 da L-03
     (EST-03b R1): `assertFiscalTransition` fora de todo barrel, gate verde, feature inalcançável.
     Adicione ao checklist do worker: *"export público esperado declarado na §3?"*.
   - **Testes (Seção 4):** **enumere os casos** (lista numerada de cenários verificáveis), não
     descrições genéricas. Diga o framework e o ambiente.
   - **Gate por comando (Seção 7):** inclua o bloco "Verificação automática" com os comandos
     `pnpm --filter <pkg> build`/`test`/`lint` exatos + a nota do **Gate de Evidência** (saída
     literal colada na Seção 8). **Lint é parte do gate** (Regra 3 do CLAUDE.md, desde 2026-07-06
     — 3 reworks consecutivos por regressão de lint cobrada só no review); task endurecida sem
     `lint` no bloco gera rework garantido. **Escope o gate ao(s) pacote(s) da task** (`--filter`);
     só escreva `pnpm -r build/test/lint` (workspace inteiro) quando o próprio objetivo da task for
     provar limpeza global (ex.: quebra de ciclo entre pacotes) — caso contrário o gate fica lento
     e roda pacotes fora do escopo (ver EST-34, onde o `-r` era necessário; é a exceção, não o
     padrão do nexus congelado).
   - **Frontmatter:** `complexity` coerente (5 exige quebra), `target_agent` válido (sem typos),
     `dependencies` conferidas contra o que a task realmente consome.
   - **Contratos cross-task / fontes "canônicas" (confrontação obrigatória):** se o spec referencia
     tipo/verbo/comportamento definido por OUTRA task (dependência) ou por um componente que se
     apresenta como "canônico" (ex.: máquina de estados, schema compartilhado), NÃO assuma — confronte:
     1. **A fonte existe de fato?** Verifique que o arquivo citado resolve no estado ATUAL do
        repo/worktree — não um path lembrado ou de um sistema congelado/movido (ex.: um serviço
        legado desativado). Fonte que não resolve é **ABERTO**, não DERIVADO, mesmo que pareça
        óbvio o que ela diria.
     2. **Marque cada cláusula:** *alinhada* (bate com a fonte — cite ambos) / *divergente* (não
        bate — descreva os dois lados na Seção 6; vira decisão de arquiteto, **não** corrija um
        lado silenciosamente) / *sem-fonte* (nenhuma fonte achada — ABERTO).
     3. **Nunca escreva no spec "amplie o tipo X se não bater"** como instrução ao worker — isso
        empurra decisão de arquitetura pro executor, que vai resolver sozinho (e mal) em runtime.
        Se o tipo pode não bater com uma dependência já `done`, é decisão do arquiteto AGORA
        (Seção 6), não workaround do worker DEPOIS. (Origem: EST-04a R1 — worker alargou
        `schema.ts` de OUTRA task pra caber, spec não previa o gap.)
   - **Teste do contrato fake-integrável (quando a integração É o objetivo):** se o *objetivo* da
     task é "integrar a biblioteca X", pergunte: *os casos de teste passam numa implementação que
     nunca importa X?* Se sim, o contrato é um rename — endureça até a resposta ser não:
     1. fixe pacote+versão verificados na fonte (npm/registro, não memória) e o `[UPDATE]
        package.json` no escopo;
     2. cite no contrato os símbolos REAIS da lib (classe a estender, método a chamar, evento a
        assinar), verificados no repositório da lib;
     3. inclua ≥1 caso de teste **anti-fake** que reprova a implementação sem a lib (ex.: spy no
        adapter da lib, asserção sobre evento/formato que só a lib produz).
     *Escopo:* só quando a integração é o entregável declarado — lib usada como detalhe interno
     não precisa de anti-fake. (Origem: T-403 — "Integração do Automerge Repo" satisfazível por
     `Map`+pub/sub; os 8 casos passavam sem nenhum símbolo do pacote; 3 tasks downstream
     empilhadas no vazio e T-702 contornou com envelope próprio.)
3. **Gate de saída — classifique em UM dos destinos do `draft:<sub>`** (executabilidade) **e atribua capacidade**.
   Use os **verbos do serviço** (`manage-task.mjs`) — NUNCA edite `status` no frontmatter à mão:

   | Destino (`draft:<sub>`) | Quando | Verbo |
   |---|---|---|
   | **`draft:hardened`** | zero decisões em aberto, tudo derivado+citado, executável | `manage-task.mjs harden <ID> <SeuModelo> "endureceu spec"` (atribua `capacity_target` no frontmatter) |
   | **`draft:pending_decision`** | resta decisão de arquiteto (escolha, não arquitetura grande) | `manage-task.mjs block_decision <ID> <SeuModelo> "<motivo>"`; preencha `decisions: ["..."]` no frontmatter |
   | **`draft:decomposed`** | grande/multi-concern, fatia limpo em peças menores | `manage-task.mjs decompose <ID> <SeuModelo> "decomposto"`; crie filhos `T-XXXa/b/c` |
   | **`draft:triaged`** (pass-1 só) | você só triou (capacidade/spike) sem as deps p/ assinaturas reais | `manage-task.mjs triage <ID> <SeuModelo> "triado"`; pass-2 JIT depois |

   **Capacidade (`capacity_target`), ortogonal ao destino** — só vale p/ `hardened`/`triaged`:
   - **`haiku`** — mecânico: 1–poucos arquivos, segue padrão, tipos ditados, casos enumerados, zero
     novidade algorítmica (wrappers, ports, encode/decode triviais). **Preferência.**
   - **`sonnet`** — fully-specified mas com complexidade intrínseca: algoritmo/invariante não-trivial,
     coordenação multi-arquivo, edge cases sutis, integração com conflito. **Workhorse — não force a Haiku.**
   - **`opus-spike`** — precisa de exploração/ADR pra sequer especificar → na prática é `blocked-decision`
     com entregável = ADR/PoC.

   > "Preferir Haiku" é **viés, não proibição**: decomponha *em direção ao Haiku enquanto a divisão for
   > limpa*; pare quando fatiar mais for artificial (fragmentar algoritmo coeso custa mais que rodar em
   > Sonnet). A maioria das tasks de núcleo é Sonnet; Haiku é a cauda mecânica.

   **NOTA:** `harden` com deps todas `done` promove automaticamente para `ready` (auto-promote, T-1029).
   Não precisa chamar `promote` depois. Se as deps ainda não estão todas `done`, fica em `draft:hardened`
   e o auto-promote acontece quando a última dep fechar.

## Saída obrigatória: Relatório de Endurecimento

Ao final, escreva (no chat, não no arquivo) um relatório que torne a auditoria barata:
```
ENDURECIMENTO — $ARGUMENTS
Derivado (com fonte):
  - <item> ← <arquivo §seção / task>
  ...
Aberto (escalado p/ arquiteto, NÃO inventado):
  - <decisão que falta> — opções: <...>
  ...
Status final: ready | draft (N decisões em aberto)
Capacidade-alvo: haiku | sonnet | opus-spike
```

**Sempre rode o painel ao final** e cole a saída: `node tools/scripts/hardening.mjs`. Ele mostra o
estado do backlog, a fila de decisões, os promovíveis e as candidatas a reendurecer — é a forma de
o arquiteto ver o efeito do seu endurecimento sem reler specs.

**Persiste a spec — ENFILEIRE, não comite** (agentes não rodam git no Docs; ver Paralelismo no
CLAUDE.md): `node tools/scripts/fila.mjs add $ARGUMENTS "chore($ARGUMENTS): endurece spec → hardened"`.
Um `/drenar-fila` commita+pusha depois.

**Dispara o orquestrador (fire-and-forget).** Após enfileirar, rode **sem aguardar** —
`node tools/scripts/orquestrar.mjs --on-finish $ARGUMENTS` — para liberar seu slot e deixar o
orquestrador despachar o próximo passo. NÃO espere a saída nem cole no Gate; é disparar e seguir.

## ⛔ NÃO faça
- NÃO escreva código de implementação nem testes reais — só a **spec** da task.
- NÃO toque em nenhum arquivo além de `tasks/$ARGUMENTS.md`.
- NÃO invente assinatura/tipo/path/retorno sem fonte (releia a Diretriz primária).
- NÃO cite arquivo de outra task/sistema como fonte sem confirmar que ele **existe no estado
  atual** (sistemas congelados, paths movidos) — "a fonte que citei ainda existe?" também é
  CITE-OU-ESCALE.
- NÃO recomende `ready` enquanto houver qualquer decisão em aberto.
- NÃO altere o **lifecycle `status`**/Log/INDEX — nem na mão, nem pelo serviço. Você usa os **verbos de endurecimento** (`triage`/`harden`/`block_decision`/`decompose` via `manage-task.mjs`) que só mudam o `draft:<sub>` — nunca `promote`/`start`/`finish`/`approve`. O flip para `ready` é automático (auto-promote, T-1029).

## Iteração e reendurecimento (JIT)
A skill é **re-entrante e idempotente** — rodar de novo numa task já `draft:hardened` é esperado, não erro.
Dois gatilhos:
- **Resolver abertas:** depois que o arquiteto fecha itens da Seção 6 via `decide`, re-rode; a lista "Aberto"
  encolhe. Sucesso = vazia → `harden`.
- **Reendurecer (stale por antecipação):** quando uma **dependência vira `done`**, a fundação que
  esta task só podia citar vagamente passa a existir. Re-rode pra trocar placeholder ("integra com o
  core") pela **assinatura real** (`import { X } from 'packages/core/src/...'`) e **re-rode `harden`**
  (a data do reendurecimento aparece no Log, não no frontmatter). `node tools/scripts/hardening.mjs`
  lista as candidatas (seção "REENDURECER").

> **Política: endureça em dois passes, não tudo-fundo-no-início.** Pass 1 (triagem, cedo, raso):
> classifica capacidade/spike/decompor e pega decisões abertas — vira `triaged`/`blocked-decision`.
> Pass 2 (profundo, JIT, logo antes de executar, com as deps já `done`): preenche assinaturas reais
> → `hardened`. Endurecer fundo a task 10-de-10 no dia 1 é trabalho que você sabe que vai refazer.
