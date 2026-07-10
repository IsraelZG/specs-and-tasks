---
name: drenar-fila
description: >
  Consumidor ÚNICO e serial da fila de commits do repo de controle (Docs). Os agentes não rodam
  git no Docs — eles editam o markdown da task e enfileiram a intenção via `fila.mjs add`. Esta skill
  roda `fila.mjs flush`: faz todos os commits pendentes (atômicos por path) + um único push. Roda
  periodicamente (humano ou loop). Idempotente. Ex.: /drenar-fila
model: haiku
---

# Drenar Fila de Commits (controle/Docs)

Você é o **committer serial** do Docs. Todo o resto do time só edita markdown e enfileira; você é o
único que toca git aqui. Por ser um só, não há corrida de `index.lock` nem disputa de push — o
problema que esta fila existe pra matar.

## Por que existe
O Docs é um working tree único na master com N agentes simultâneos. Quando cada um rodava
`git commit`/`push`, colidiam no index, disputavam o push e gastavam tempo (sobretudo o QA)
filtrando "o que é meu". Agora: agente edita o `.md` + `node tools/scripts/fila.mjs add <id> "<msg>"`;
você drena. **Só o superapp (código/worktrees) mantém o git no caminho do agente** — lá cada task
tem branch isolada, não há working tree compartilhado.

## Passos
1. **Espia** (opcional): `node tools/scripts/fila.mjs ls` — quantos commits pendentes e suas mensagens.
2. **Drena:** `node tools/scripts/fila.mjs flush <SeuNome>`. O script:
   - commita cada intenção **atômica por path** (`git commit -m "<msg>" -- <paths>`), em ordem cronológica;
   - consome a intenção só se o commit deu certo (intenção sem mudança real → descartada; erro de
     git real → **mantida** pra próxima rodada);
   - ao final, `git pull --rebase` + `git push` (um só push pra todos os commits).
3. **Se o push falhar** (colisão com push externo): o script para com exit 1. Rode
   `git pull --rebase` à mão, resolva o que aparecer, e **re-rode** `fila.mjs flush` — o que já foi
   commitado não re-entra (a intenção já foi consumida); só o push restante acontece.
4. **Refresca o ledger de ciclo de vida** (barato, é o heartbeat periódico): `node tools/scripts/ledger.mjs`.
   Regenera `tasks/LEDGER.md` (gitignored) projetando os Logs §9 — quem foi worker/reviewer/rework de
   cada task, agrupado por status. Não commita nada (artefato local).
5. **Limpa evidências órfãs:** remove diretórios `.dmm*-evidence/` da raiz do Docs (snapshots de
   Gate já integrados; são descartáveis e estão no `.gitignore`):
   ```
   node -e "const fs=require('fs'),p=require('path');const dirs=fs.readdirSync('.').filter(d=>d.startsWith('.dmm'));for(const d of dirs)fs.rmSync(p.join('.',d),{recursive:true,force:true});console.log(dirs.length+' evidence dirs removidos')"
   ```
6. **Reporte** quantos commitou, quantos evidence dirs limpou, e o que pulou. **PARE.**

## NÃO faça
- **NÃO** rode `git add -A`/`git add tasks/` no Docs — nem aqui. O flush commita só os paths das
  intenções; varrer o working tree pegaria edição não-enfileirada de outro agente.
- **NÃO** commite `tasks/INDEX.md`/`meta-tasks/INDEX.md` (gitignored) nem `tasks/.commit-queue/`
  (a própria fila, gitignored).
- **NÃO** "conserte" o conteúdo das tasks aqui — você só commita o que já está no working tree. Erro
  de conteúdo é do dono da task.

## Idempotência
Re-rodar é seguro: a fila vazia não faz nada; intenções já consumidas sumiram; intenção cujo arquivo
não tem mais mudança é descartada sem commit.
