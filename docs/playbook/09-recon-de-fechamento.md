# Playbook 07 — Recon de fechamento de marco (backlog × código × ledger)

> Extraído da missão de saneamento Core+Bancada (2026-07-14, claude-fable), ANTES de consultar a
> skill `recon-arquitetural` (experimento de extração independente). Formato operacional:
> **sintoma → check exato → evidência esperada → decisão → falha evitada → limite.**
> Executável por um modelo médio: cada check é um comando, não um julgamento.

## 0. Sequência de leitura de maior ganho (ordem testada)

1. `node tools/scripts/ledger.mjs` + ler `tasks/LEDGER.md` inteiro (30 min que pagam o dia: toda
   anomalia de papel/status/rework salta da tabela).
2. `docs/plano-de-implementacao.md` (as METAS; nunca confundir com o estado).
3. Scan de integridade do backlog (regras §2) — mecânico, antes de abrir qualquer task.
4. Só então abrir as tasks-sintoma UMA a uma, sempre em par com o código real na master.
5. `node tools/scripts/drift-check.mjs` por último (interpretar com a regra R7).

## 1. Detectores de backlog falso

**R1. Task some do dashboard mas o arquivo existe.**
- Check: `xxd tasks/T-X.md | head -1` (BOM `efbbbf`?) + `grep -c "Ã\|â€" tasks/T-X.md` (mojibake).
- Evidência esperada: parser de frontmatter ancora `^---` no byte 0; BOM → task invisível.
- Decisão: reparar o ARQUIVO (BOM/encoding/§9 duplicada) preservando cada linha de log verbatim; e
  endurecer TODOS os parsers (`replace(/^﻿/,'')`) — o arquivo é o caso, o parser é a classe.
- Falha evitada: task em `review` invisível por 11 dias (T-1033).
- Limite: mojibake reverte por tabela CP1252→byte; NÃO regenerar o texto de cabeça.

**R2. "Done" que o código desmente (a capability-fantasma).**
- Check: para cada capacidade do marco, procurar a NEGATIVA no código — ex.: RBSR "done":
  `grep -n "encodeNodesResponse" packages/protocol/src/rbsr/exchange.ts` → envia `{id, fp}`?
  Então NENHUM dado real é transferido, digam as tasks o que disserem.
- Evidência esperada: primitiva existe e é testada, mas nenhum caller de produção a consome
  ("primitiva só testada = feature não entregue" — já é gate do template §7).
- Decisão: capability = NÃO EXISTE na matriz; achar/criar a task de wiring com o achado literal.
- Falha evitada: declarar M3 fechado com convergência que converge fingerprints, não dados.
- Limite: a UI pronta (aba da Bancada) não conta como evidência — cheque o composition root
  (App.tsx é onde os mocks se escondem, com comentário e tudo).

**R3. Rework narrado ≠ rework acontecido.**
- Check: claims do §8/§9 contra o repo: `git log --all --grep="T-X"`, o arquivo prometido existe?
  (`ls packages/core/src/rbsr/`), o import removido sumiu? (`grep -rn "from '@plataforma/core'"
  packages/protocol/src/`).
- Evidência esperada: cada claim do handover tem um fato git/fs correspondente.
- Decisão: divergiu → é B0 (rework fictício); re-executar o Gate do zero é a única prova aceitável.
- Falha evitada: aprovar T-1033 na palavra do worker (o rework 1 mentiu item a item).
- Limite: contagem de testes que muda (174→175) não é prova de trabalho — pode ser drift alheio.

**R4. Obsolescência em lote com justificativa de UM plano varrendo DOIS.**
- Check: para cada task obsoletada em batch, perguntar: o substituto alegado pode ser importado
  pelo pacote-alvo? (`cat packages/<substituto>/package.json` — dependências dele).
- Evidência esperada: `plugin-zen-engine` depende de `estaleiro-contracts` → core NÃO pode
  consumi-lo → não substitui o Zen de PRODUTO.
- Decisão: sucessor novo com o contrato preservado (T-609) + remap dos dependentes; NÃO reverter o
  obsolete do humano — formalizar via verbo e registrar a distinção de planos.
- Falha evitada: M6/M9 (intents, freeze, suíte adversarial) mortos por engano de homonímia "Zen".
- Limite: reverter decisão humana é escalada; criar sucessor com justificativa citável não é.

**R5. Decisão "resolvida" que a realidade dissolveu.**
- Check: toda decisão §6 com prazo/condição ("quando T-X fechar") → conferir se T-X JÁ fechou e se
  a opção escolhida ainda é possível (grep no código do símbolo/export prometido).
- Evidência esperada: D2 de T-1046 mandava importar de protocol "para não bloquear em T-1033" —
  protocol já nem exporta o símbolo.
- Decisão: corrigir a decisão NA SPEC com data+evidência (riscar, não apagar) e obsoletar o
  follow-up cuja premissa morreu (T-1047).
- Falha evitada: worker executando decisão impossível ou recriando o import que quebra a direção.
- Limite: só o arquiteto corrige decisão; worker que topa com isso → pause.

**R6. `ready` com §4/§5 em template.**
- Check: `grep -l "Framework:** (Vitest para Node puro / Playwright" tasks/*.md` cruzado com
  status ready.
- Decisão: endurecer §4/§5 a partir dos contratos já decididos ANTES de qualquer campanha; gate
  que não prova o objetivo é pior que gate ausente (dá verde falso).
- Falha evitada: T-1032 no Fugu com "1. Escreva o teste em `...`" como instrução.

**R7. Ferramenta de drift gritando 88 vezes = 1 causa, não 88.**
- Check: agrupar os achados por ARQUIVO apontado; se um mesmo path domina, `git log --oneline
  --diff-filter=D master -- <path>` ou `find packages -name "<basename>*"` → foi RELOCADO?
- Decisão: relocação de arquivo por task posterior (ucanScope protocol→core) gera falso-positivo
  em toda task antiga que o tocou; corrigir a ferramenta ou anotar a limitação — não abrir 88
  investigações.
- Falha evitada: semana de "integration drift" imaginário.

**R8. Pai executável (`ready`) com filhas.**
- Check: scan `subtasks:` × status; e a existência de `T-Xa..T-Xe` sem campo `subtasks`.
- Decisão: `decompose` via serviço + `close-decomposed-parents.mjs` quando filhas todas done.
- Falha evitada: worker pegando o pai e refazendo o trabalho das filhas (o guard de start só
  protege se o campo `subtasks` existir).

**R9. Auto-side-effect que "nunca funciona" tem parser quebrado, não azar.**
- Check: quando um automatismo (auto-promote) falha sistematicamente e existe um "safety-net"
  humano compensando, reproduza o parse do serviço num REPL com uma linha REAL do frontmatter.
- Evidência esperada: `dependencies: ["A"] # comentário` → parser naive sem strip de `#` produzia
  id `A#comentário` → `depsAllDone` sempre false.
- Decisão: consertar o parser + teste de fixture; o safety-net vira exceção de novo.
- Falha evitada: promover na mão para sempre e chamar isso de processo.

## 2. Scan mecânico (rodar antes de abrir qualquer task)

Uma passada por `tasks/*.md` checando: BOM/frontmatter que não parseia; `## 9` duplicada; dep
inexistente; dep em obsoleta; `done` antes da dep; `ready`/`in_progress` com dep aberta; pai com
filhas × status; id ≠ nome do arquivo. (Implementação de referência usada na missão: ~70 linhas
de node; candidata a `tools/scripts/scan-integridade.mjs` se virar rotina.)

## 3. Campanhas encadeadas — tamanho e fronteira

- Elo só entra se: spec sem decisão aberta E §4 real E deps fora-da-campanha `done` E branch-base
  reproduzível E zero colisão de arquivo com worktree ativa.
- **Stack SÓ onde há dependência de CÓDIGO** (B edita os arquivos que A tocou). Dependência
  nominal/temática = base no trunk, mesmo dentro da campanha (menos superfície de invalidação).
- 3–4 elos; o último opcional/abortável de preferência.
- Invalidação: base-sha registrada no manifesto; `rework` upstream ⇒ descendente faz
  rebase+re-gate (NUNCA transição de estado do descendente); dependente de trunk é ileso por
  construção. Ver ADR 0017.

## 4. O que permanece decisão humana (não delegar)

1. Reverter/contrariar obsolescência ou demoção feita pelo humano (criar sucessor ≠ reverter).
2. Direção de arquitetura entre pacotes (quem pode importar quem) quando duas rotas fecham o gate.
3. Decisões §6 sem fonte canônica (T-603 pendente é o exemplo vivo).
4. Ligar/relaxar kill-switch, `max_concurrent`, ou qualquer garantia do MGTIA.
5. Aceitar quebra de wire/formato consciente (D3 do T-1046 foi humana; a campanha só a executa).

## 4b. Comparação com o manual pré-existente (lida DEPOIS da extração — experimento 2026-07-14)

| Regra emergente | Já existia? | Diferença | Patch aplicado |
|---|---|---|---|
| R1 BOM/encoding/§9 | não (08 opera em spec×código) | integridade FÍSICA do backlog é altitude que o 08 assume pronta | nota de pré-requisito no 08 §0 → playbook 07 |
| R2 capability-fantasma | parcial (08 §3 fake-integrável; §7 "mock não fecha gate") | 08 pega spec falsa ANTES; R2 pega done falso DEPOIS | nenhum (07 é o dono; 08 §3 continua o dual pré) |
| R3 rework fictício | não (08 §1.4 lia §8/§9 como fonte confiável) | claim de log exige fato git correspondente | linha B0 no 08 §1.4 |
| R4 obsolescência homônima entre planos | não | classe de portfólio (Zen produto × Zen tooling) | fica no 07 |
| R5 decisão dissolvida pela realidade | parcial (08 §10 "§6 datado") | check ativo "a opção escolhida ainda é possível?" | fica no 07 (08 §10 já cobre a forma) |
| R6 ready com §4 template | não | scan mecânico, não julgamento | fica no 07 §2 |
| R7 falso-positivo de drift por rename | não | ferramenta, não spec | fica no 07 |
| R8 pai executável | não | lifecycle | fica no 07 |
| R9 parser do automatismo | não | tooling do MGTIA | fica no 07 |
| Campanhas (stack/invalidação) | não | novo domínio | ADR 0017 é a dona |

Convergências independentes (confiança mútua): fato-com-path (08 §2 ≡ prática desta missão);
"mock nunca fecha gate de produto" (08 §7 ≡ R2); "serviço rejeitou = informação, nunca contorne"
(08 §9 ≡ tratamento de T-604/obsolete); "re-busque o cânone antes de escalar" (08 §9.1 ≡ R4).

## 5. Ataques que mudaram decisões nesta missão

- "O merge na master prova a task?" → Não: provou-se re-executando o gate NA master (o merge podia
  estar podre). Mudou: R3 exige re-execução, não arqueologia.
- "Stack de 3 elos sempre?" → teste A→B→C mostrou que C stackado sobre B sem dependência de código
  só amplia a invalidação; mudou o desenho do FUGU-01 (elo 3/4 no trunk).
- "`stale_upstream` como estado?" → confrontado com a máquina real: rework-task exige Parecer com
  `[Bn]` — um descendente em `rework` sem Parecer quebraria a Regra 4. Mudou: metadado de
  campanha, máquina intacta (confirmando a preferência inicial do humano, mas por evidência).
