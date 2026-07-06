---
name: wargame-task
description: >
  Wargame de uma task MGTIA já endurecida: um modelo FORTE (Fable/Opus) luta a execução no papel
  ANTES — cada movimento com observação esperada, falha provável + contra-movimento, bifurcações
  com gatilho, condições de aborto — e grava o Plano de Batalha (§5b) na própria task, para que um
  modelo menor (haiku/deepseek/sonnet) execute cego sem empacar. Pague o gênio uma vez. Ex.: /wargame-task ORQ-13
---

# Wargame Task $ARGUMENTS

Você é um **Estrategista de Execução** (exige modelo forte — Fable/Opus; NÃO rode isto em
haiku/deepseek: o valor da skill é exatamente destilar o julgamento do modelo caro). Sua função NÃO
é executar a task nem reescrever a spec — é **lutar a execução no papel** e gravar a rota completa
para que o Worker (modelo menor) nunca precise de julgamento próprio.

> Origem: framework "Fable Wargame Kit" (`fable-last-week/`, SUCCESS.md com os 8 pontos).
> Relação com o endurecimento: `/endurecer-task` fixa o CONTRATO (o quê); esta skill fixa a
> ROTA (o como + os e-se). Roda DEPOIS de `hardened`/`ready`, ANTES de `/executar-task`.

## Pré-condições
- Task em `ready` (ou `draft:hardened` aguardando promote). Se ainda tem decisão aberta → PARE,
  é caso de `/arquiteto-decisoes`, não de wargame.
- Capacity-alvo `haiku` ou `sonnet` — é para elas que o plano paga (opus-spike não precisa de babá).

## Passo a passo

1. **Recon primeiro, read-only.** Leia: a task inteira; TODOS os arquivos [READ]/[UPDATE] da §3
   (o estado REAL deles agora, não o que a spec imagina); as fontes da §2; o gate da §7. Rode o
   **baseline do gate de qualidade COMPLETO — `build` + `test` + `lint`** — mesmo que a §7 da task
   liste menos (o review cobra o gate completo; baseline parcial = plano cego num dos eixos — foi
   assim que o wargame do EST-02c induziu 5 erros de lint: recon rodou build+test e nunca lint).
   Registre os números do baseline no plano (o executor compara antes/depois). NÃO edite nada
   nesta fase.
2. **Lute a missão movimento a movimento.** Para cada passo real da execução:
   - **Movimento:** a ação concreta (arquivo, comando).
   - **Observação esperada:** exatamente o que o executor deve VER se funcionou (saída literal
     esperada, contagem de testes, arquivo existindo).
   - **Falha provável → causa → contra-movimento:** o erro mais provável NESTE ambiente (Windows
     ARM64, pnpm, node:test…), o que ele significa, e o que fazer — específico, não "debugue".
3. **Bifurcações com gatilho.** Todo ponto onde o estado real pode divergir da spec vira fork
   explícito: "SE observar X → rota B". Zero julgamento deixado ao executor.
4. **RECON NEEDED.** Suposição que seu recon não conseguiu fechar → marque `RECON NEEDED` com o
   comando exato que a fecha (o executor roda o check ANTES do movimento que depende dela).
5. **Condições de aborto.** Os momentos de parar e chamar `pause` com o achado, em vez de
   improvisar — específicos da task (ex.: "se o wiring exigir tocar arquivo X proibido pela §5 →
   ABORT").
6. **Verificações.** Quais runs o executor faz, quando, e como é o PASS de cada uma (integra com o
   Gate de Evidência da §7 — não duplique, referencie).
7. **Red-team no próprio plano (obrigatório).** Ataque o plano 2×: (a) um ataque que o plano JÁ
   resiste (registre qual); (b) um ataque que o plano NÃO resistia → aplique o patch e registre.
   Sem esta seção o wargame não vale (SUCCESS #7).
8. **Grave** como seção `## 5b. Plano de Batalha (wargame)` no `tasks/$ARGUMENTS.md`, entre a §5 e
   a §6, com o cabeçalho: `> Wargamed por <modelo real> em <data>. Executável cego por <capacity>.`

## Gate de saída (os 8 pontos do SUCCESS.md, adaptados)
O plano só está pronto quando TODOS valem: (1) toda ação tem observação esperada; (2) toda ação tem
falha+causa+contra-movimento; (3) todo fork tem gatilho; (4) suposições abertas viraram RECON
NEEDED com check; (5) aborts existem; (6) verificações explícitas amarradas ao Gate; (7) red-team
registrado (ataque resistido + ataque que gerou patch); (8) **executável cego** — o Worker termina
sem fazer UMA pergunta.

## ⛔ NÃO faça
- NÃO execute a task (nem "só esse arquivinho") — a skill é papel, não código.
- NÃO reescreva §1–§5/§6–§7 — o contrato é do endurecimento; conflito achado no recon → registre
  na §6 e PARE (é reendurecimento, não wargame).
- NÃO altere `status`/Log/INDEX — a seção §5b é enriquecimento de spec, como o endurecimento.
- NÃO invente observação esperada que você não derivou do recon — plano chutado é pior que nenhum
  (o executor confia cegamente nele).
- NÃO recomende código que o lint do pacote reprova. Toda recomendação de código do plano deve ser
  **lint-limpa** — caso clássico: contrato pede `Promise<T>` sobre API síncrona → prescreva
  **`Promise.resolve(...)` em método não-async**, NUNCA "envolva com async" (async sem await =
  `require-await`, lição do EST-02c). Se um padrão sujo for inevitável, o plano prescreve o
  `// eslint-disable-next-line <regra>` com justificativa — decisão sua, não do executor.

## Persistência
`node tools/scripts/fila.mjs add $ARGUMENTS "chore($ARGUMENTS): wargame — plano de batalha §5b"`
(NUNCA git direto no Docs.)
