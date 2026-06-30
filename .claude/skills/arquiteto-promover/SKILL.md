---
name: arquiteto-promover
description: >
  Promove em LOTE para `ready` (via serviço) toda task cujo spec já está `hardened` mas o lifecycle
  ainda é `draft` — o flip que antes era manual e fazia drafts prontos apodrecerem na fila. Mecânico
  e idempotente: NÃO endurece, NÃO decide; só aplica `manage-task.mjs promote` no que o painel marca
  como promovível. Ex.: /arquiteto-promover  (ou /arquiteto-promover T-2  p/ um prefixo)
model: haiku
---

# Arquiteto — Promover $ARGUMENTS

Você executa o **flip `draft→ready`** que o arquiteto faria à mão. É mecânico porque o julgamento
já aconteceu no endurecimento: `spec_status: hardened` **significa** zero decisões em aberto e deps
não-draft. Aqui você só transcreve esse sinal para o lifecycle, **pelo serviço** (nunca editando
`status` no markdown).

## Pré-condição do flip (já garantida por construção)
`spec_status: hardened` ⟹ a task foi endurecida sem decisões abertas e suas dependências não estão
`draft` (regra do `/endurecer-task`). Logo, promover é seguro e não exige re-julgar a spec.

## Passos
1. **Liste os promovíveis:** `node tools/scripts/hardening.mjs $ARGUMENTS` → seção **PROMOVÍVEIS**
   (`spec_status: hardened` + lifecycle `draft`). Se vazia, **pare** — nada a fazer.
2. **Promova cada um pelo serviço:**
   `node tools/scripts/manage-task.mjs promote <ID> <SeuNome> "spec_status hardened — flip draft→ready"`.
   - Se o serviço rejeitar (`requer status draft`), a task já saiu de `draft` (corrida com outro
     agente) — **pule**, não force.
3. **Re-rode o painel:** `node tools/scripts/hardening.mjs $ARGUMENTS` — PROMOVÍVEIS deve esvaziar.
4. **Persiste o controle — ENFILEIRE** (agentes não rodam git no Docs; ver Paralelismo no CLAUDE.md).
   Enfileire UMA intenção com todas as tasks que VOCÊ promoveu (a 1ª é o id, as demais são paths
   extras): `node tools/scripts/fila.mjs add T-206 "chore(arquiteto): promove N tasks hardened
   draft→ready" tasks/T-212.md`. Um `/drenar-fila` commita+pusha depois. **Não** enfileire `INDEX.md`.

## NÃO faça
- **NÃO** promova task que não esteja em **PROMOVÍVEIS** (se está `draft` mas não `hardened`, falta
  endurecer — não é seu trabalho aqui; rode `/endurecer-task`).
- **NÃO** edite `status`/`INDEX`/Log na mão — só via `manage-task.mjs promote`.
- **NÃO** rode `git commit`/`push` no Docs — enfileire.
- **NÃO** decida nada nem mexa no corpo da spec. Decisão pendente é do `/arquiteto-decisoes`.
- **NÃO** promova `blocked-decision`/`triaged`/`decomposed` — não são `hardened`.

## Idempotência
Re-rodar é seguro: o que já virou `ready` some da lista de promovíveis e o serviço rejeita um
segundo `promote` (sai de `draft`). Rode quantas vezes quiser.
