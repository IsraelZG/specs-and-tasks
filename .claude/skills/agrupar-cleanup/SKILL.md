---
name: agrupar-cleanup
description: >
  Drena o ledger `tasks/_pendencias.md` (achados não-bloqueantes que o integrar-task acumulou) em
  tasks de cleanup AGRUPADAS por área/pacote — uma task por cluster, em vez de uma `-followup` por
  achado. Gera via generate-task.mjs, injeta os achados no escopo, e REMOVE as linhas consumidas do
  ledger. Ex.: /agrupar-cleanup  (ou /agrupar-cleanup transport  p/ uma só área)
model: sonnet
---

# Agrupar Cleanup $ARGUMENTS

Você transforma o **ruído acumulado** (MINOR/INFO/MAJOR-não-bloqueante) em trabalho acionável, sem
poluir a fila com dezenas de `-followup`. Uma task de cleanup por **área**, com os achados daquela
área como escopo.

## Passos

1. **Leia o ledger.** `tasks/_pendencias.md`, só as linhas entre `<!-- BEGIN PENDENCIAS -->` e
   `<!-- END PENDENCIAS -->`. Formato de cada linha:
   `- [ ] [M|m|i][T-XXX][pacote/área] achado — referência (arquivo:linha)`.
   Se vazio → **pare** ("nada a agrupar").
2. **Agrupe por área** (o 3º colchete: `pacote/área`). Se `$ARGUMENTS` nomeia uma área, filtre só
   ela. Clusters minúsculos (1 achado trivial) podem esperar — agrupe quando o cluster justifica uma
   task (≥2 achados, ou 1 achado que vale corrigir já). Diga no retorno o que deixou no ledger.
3. **Para cada cluster, gere a task:**
   - `node tools/scripts/generate-task.mjs C-NN "Cleanup: <área> (N não-bloqueantes)" 2 <agente>`
     (`C-NN` = próximo número de cleanup livre; agente pelo tipo da área). Vai para `tasks/`.
   - **Injete no corpo** da task gerada (`tasks/C-NN.md`):
     - **Seção 1:** "Resolver N achados não-bloqueantes acumulados em `<área>`." 
     - **Seção 3 (Escopo):** os arquivos citados nas referências dos achados, `[UPDATE]` cada um.
     - **Seção 5 / lista de achados:** cole os achados do cluster, um a um, com sua referência —
       são o checklist do que corrigir.
     - **`capacity_target`:** quase sempre `haiku` (cleanups são mecânicos); `sonnet` só se algum
       achado for de lógica não-trivial. Marque `spec_status: triaged` (endurece JIT antes de rodar).
4. **Remova do ledger** as linhas consumidas — reescreva o bloco entre os marcadores mantendo só as
   linhas que você NÃO agrupou. Não apague os marcadores nem o cabeçalho.
5. **Commit do controle — COMMIT ESTREITO.** O `generate-task.mjs` já regenerou o INDEX local
   (artefato gitignored — não commite). Adicione **só os arquivos que você criou/editou, por path
   explícito** (a nova `tasks/C-NN.md` + `tasks/_pendencias.md`) — nunca `tasks/`/`-A`. Ex.:
   `git add tasks/C-01.md tasks/_pendencias.md && git commit -m "chore(cleanup): agrupa N pendências em C-01" && git push`.

## NÃO faça
- **NÃO** crie task `-followup` por achado (é o anti-padrão que o ledger existe pra matar).
- **NÃO** corrija o código aqui — você só **agrupa** os achados numa task; quem corrige é o worker.
- **NÃO** transicione status (a task nasce `draft`; segue o fluxo normal endurecer→promover→executar).
- **NÃO** invente achados nem escopo — só o que está no ledger, com as referências que ele traz.
