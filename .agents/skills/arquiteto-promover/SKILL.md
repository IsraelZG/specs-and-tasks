---
name: arquiteto-promover
description: >
  **Safety-net**: promove em LOTE para `ready` (via serviço) tasks que estão em `draft:hardened` com
  deps todas `done` mas o auto-promote (T-1029) não pegou por algum motivo (corrida, batch, pause).
  Mecânico e idempotente: NÃO endurece, NÃO decide; só chama `manage-task.mjs promote` no que sobrou.
  Ex.: /arquiteto-promover  (ou /arquiteto-promover T-2  p/ um prefixo)
model: haiku
---

# Arquiteto — Promover $ARGUMENTS

Você executa o **flip `draft:hardened→ready`** como **rede de segurança**. Normalmente o auto-promote
(T-1029) já faz isso automaticamente (ao `harden` com deps done, ou ao `approve→done` de uma dep).
Esta skill existe para pegar o que sobrou — tasks `draft:hardened` cujo auto-promote não disparou por
algum motivo (corrida, batch, pause manual). É mecânico porque o julgamento já aconteceu no
endurecimento.

## Pré-condição do flip (já garantida por construção)
`status: draft:hardened` ⟹ a task foi endurecida sem decisões abertas. Verificar `depsAllDone` é
responsabilidade dos auto-side-effects (T-1029) — aqui assumimos que se chegou a `draft:hardened` e
as deps estão `done`, é promovível.

## Passos
1. **Liste os candidatos:** `node tools/scripts/hardening.mjs $ARGUMENTS` → seção **PROMOVÍVEIS**
   (`draft:hardened` com deps done). Se vazia, **pare** — o auto-promote está funcionando.
2. **Promova cada um pelo serviço.** `<SeuModelo>` é o **modelo real** (ex.: `haiku`), nunca o literal
   "arquiteto" (isso é o papel, não a identidade — ver "Identidade do agente" no AGENTS.md):
   `node tools/scripts/manage-task.mjs promote <ID> <SeuModelo> "draft:hardened com deps done — safety-net flip"`.
   - Se o serviço rejeitar (`from` inválido), a task já mudou de status (ligeira corrida com
     auto-promote) — **pule**, não force.
3. **Re-rode o painel:** `node tools/scripts/hardening.mjs $ARGUMENTS` — PROMOVÍVEIS deve esvaziar.
4. **Persiste o controle — ENFILEIRE** (agentes não rodam git no Docs; ver Paralelismo no AGENTS.md).
   Enfileire UMA intenção com todas as tasks que VOCÊ promoveu (a 1ª é o id, as demais são paths
   extras): `node tools/scripts/fila.mjs add T-206 "chore(arquiteto): promove N tasks hardened
   draft→ready" tasks/T-212.md`. Um `/drenar-fila` commita+pusha depois. **Não** enfileire `INDEX.md`.
5. **Dispara o orquestrador (fire-and-forget) para cada task promovida.** Para cada `<ID>` que você
   promoveu, rode **sem aguardar** `node tools/scripts/orquestrar.mjs --on-finish <ID>` — para
   liberar os slots e deixar o orquestrador despachar os próximos passos. NÃO espere a saída nem
   cole no Gate; é disparar e seguir.

## NÃO faça
- **NÃO** promova task que não esteja em `draft:hardened` com deps done (se está `draft:triaged` ou
  `draft:pending_decision`, falta endurecer — não é seu trabalho aqui; rode `/endurecer-task`).
- **NÃO** edite `status`/`INDEX`/Log na mão — só via `manage-task.mjs promote`.
- **NÃO** rode `git commit`/`push` no Docs — enfileire.
- **NÃO** decida nada nem mexa no corpo da spec. Decisão pendente é do `/arquiteto-decisoes`.
- **NÃO** promova `draft:pending_decision`/`draft:triaged`/`draft:decomposed` — não são promovíveis.

## Idempotência
Re-rodar é seguro: o que já virou `ready` (pelo auto-promote) some da lista; o serviço rejeita um
segundo `promote` (sai de `draft:hardened`). Rode quantas vezes quiser.
