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

## Taxonomia de Disposição

Cada achado do ledger pertence a exatamente uma categoria:

| Destino | Significado | Vai pra C-task? |
|---------|-------------|-----------------|
| `fixed` | Código-acionável — corrigir no código (ref arquivo/commit) | **SIM** |
| `no-op` | Já consistente na impl; nada a fazer (justificar em 1 linha) | **SIM** (worker fecha) |
| `spec→T-XXX` | Exige reendurecer a spec da task-origem (assinatura/escopo/contrato) | **NÃO** → SPEC-PENDENCIAS |
| `decision→T-XXX` | Exige decisão de arquiteto (item da §6 / blocked-decision) | **NÃO** → SPEC-PENDENCIAS |
| `defer→T-YYY` | Trabalho legítimo adiado a task futura NOMEADA | **SIM** (worker registra) |

## Passos

1. **Leia o ledger.** `tasks/_pendencias.md`, só as linhas entre `<!-- BEGIN PENDENCIAS -->` e
   `<!-- END PENDENCIAS -->`. Formato de cada linha:
   `- [ ] [M|m|i][T-XXX][pacote/área] achado — referência (arquivo:linha)`.
   Se vazio → **pare** ("nada a agrupar").

2. **Classifique cada achado** com a taxonomia acima. Pergunte: "isto se resolve mexendo em código
   (fix/no-op/defer), ou exige mudar a spec / decisão de arquiteto?" Atribua o destino.

3. **Separe os não-código.** Achados classificados como `spec→T-XXX` ou `decision→T-XXX`:
   - **NÃO entram na C-task de código.**
   - Mova-os para o bloco `<!-- BEGIN SPEC-PENDENCIAS -->` / `<!-- END SPEC-PENDENCIAS -->` do
     `_pendencias.md`, uma linha por achado no formato:
     `- [ ] [destino] [severidade][T-XXX][área] achado — referência`
     (ex.: `- [ ] [spec→T-407] [m1][T-407][protocol] assinatura generateOobLink — outOfBand.ts:38`)
   - Se o bloco SPEC-PENDENCIAS não existir, crie-o **após** o bloco PENDENCIAS.
   - **Remova essas linhas** do bloco PENDENCIAS (já foram roteadas).

4. **Agrupe por área** os achados restantes (código-acionáveis: `fixed`/`no-op`/`defer`).
   Se `$ARGUMENTS` nomeia uma área, filtre só ela. Clusters minúsculos (1 achado trivial) podem
   esperar — agrupe quando o cluster justifica uma task (≥2 achados, ou 1 achado que vale corrigir
   já). Diga no retorno o que deixou no ledger.

5. **Para cada cluster, gere a task:**
   - `node tools/scripts/generate-task.mjs C-NN "Cleanup: <área> (N não-bloqueantes)" 2 <agente>`
     (`C-NN` = próximo número de cleanup livre; agente pelo tipo da área). Vai para `tasks/`.
   - **Injete no corpo** da task gerada (`tasks/C-NN.md`):
     - **Seção 1:** "Resolver N achados não-bloqueantes acumulados em `<área>`."
     - **Seção 3 (Escopo):** os arquivos citados nas referências dos achados, `[UPDATE]` cada um.
     - **Seção 5 / lista de achados:** cole os achados do cluster, um a um, com sua referência —
       são o checklist do que corrigir. **Adicione a seguinte regra no topo da §5:**
       > **Regra: Disposição obrigatória por achado.** Cada achado abaixo DEVE ser fechado com um
       > destino da taxonomia: `fixed` (ref arquivo/commit), `no-op` (justificativa em 1 linha),
       > ou `defer→T-YYY` (task futura nomeada). "Os demais são spec-only" genérico é PROIBIDO.
       > Achados de spec/decisão já foram roteados ao SPEC-PENDENCIAS e NÃO constam aqui.
     - **Seção 8 (Handover):** injete o template:
       > **Disposição por achado (obrigatória):** liste CADA achado da §5 com seu destino:
       > `- [id] → fixed (ref) | no-op (justificativa) | defer→T-YYY`
       > Handover sem disposição per-item é inválido e será rejeitado pelo reviewer.
     - **`capacity_target`:** quase sempre `haiku` (cleanups são mecânicos); `sonnet` só se algum
       achado for de lógica não-trivial. Marque `spec_status: triaged` (endurece JIT antes de rodar).

6. **Remova do ledger** as linhas consumidas (as que entraram numa C-task) — reescreva o bloco
   PENDENCIAS mantendo só as linhas que você NÃO agrupou. Não apague os marcadores nem o cabeçalho.

7. **Persiste o controle — ENFILEIRE** (agentes não rodam git no Docs; ver Paralelismo no CLAUDE.md).
   O `generate-task.mjs` já regenerou o INDEX local (gitignored — fora da fila). Enfileire com os paths
   que VOCÊ criou/editou: `node tools/scripts/fila.mjs add C-NN "chore(cleanup): agrupa N pendências
   em C-NN" tasks/_pendencias.md` (o default `tasks/C-NN.md` já entra; `tasks/_pendencias.md` é o path
   extra). Um `/drenar-fila` commita+pusha depois.

## NÃO faça
- **NÃO** crie task `-followup` por achado (é o anti-padrão que o ledger existe pra matar).
- **NÃO** corrija o código aqui — você só **agrupa** os achados numa task; quem corrige é o worker.
- **NÃO** transicione status (a task nasce `draft`; segue o fluxo normal endurecer→promover→executar).
- **NÃO** invente achados nem escopo — só o que está no ledger, com as referências que ele traz.
- **NÃO** descarte achados de spec/decisão — roteie-os ao SPEC-PENDENCIAS com destino explícito.
