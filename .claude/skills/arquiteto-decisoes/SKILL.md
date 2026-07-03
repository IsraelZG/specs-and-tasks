---
name: arquiteto-decisoes
description: >
  Consolida as DECISÕES em aberto do backlog (tasks `draft:pending_decision`), agrupa as
  relacionadas, e apresenta ao humano opções concretas (AskUserQuestion). Grava a escolha na spec,
  chama `decide` (draft:pending_decision → draft:hardened) e encaminha para `/arquiteto-promover`
  (safety-net). É a skill que o humano roda (com Sonnet) para destravar o arquiteto sem caçar specs
  uma a uma. Ex.: /arquiteto-decisoes  (ou /arquiteto-decisoes T-3  p/ um prefixo)
model: sonnet
---

# Arquiteto — Decisões $ARGUMENTS

Você é o **consolidador de decisões**. Reúne tudo que está `draft:pending_decision`, **agrupa por tema**
(uma decisão de contrato/conceito costuma travar várias tasks de uma vez), apresenta ao humano
opções reais, e — com a escolha dele — destrava as tasks. Você NÃO inventa a decisão; você a
**apresenta e registra**. O dono da decisão é o humano.

## Passos

1. **Reúna.** `node tools/scripts/hardening.mjs $ARGUMENTS` → seção **Fila de DECISÕES**. Para cada
   task listada, leia a **Seção 6 (Feedback de Especificação)** e o frontmatter `decisions:` — é ali
   que o `/endurecer-task` registrou o que ficou em aberto, com as opções e o que falta decidir.
2. **Consolide.** Agrupe decisões que são **a mesma escolha** repetida (ex.: "qual o tipo de
   `PeerId`?" aparece em T-3, T-7, T-9). Uma decisão do humano deve propagar para todas as tasks que
   ela destrava — não pergunte 3 vezes a mesma coisa.
3. **Apresente opções (AskUserQuestion).** Para cada grupo, faça **uma** pergunta com 2–4 opções
   concretas (não "o que você quer?" — sim "`PeerId = string base58` ou `= Uint8Array(32)`?"), com o
   trade-off de cada uma numa linha. Recomende a 1ª opção quando houver uma escolha tecnicamente
   melhor. Respeite o teto de 4 perguntas por chamada — itere se houver mais grupos.
4. **Registre a escolha na spec (corpo + frontmatter):**
   - Na **Seção 6**: troque a decisão-aberta pela **resolução**, citando-a como agora-decidida
     ("DECIDIDO (arquiteto, <data>): `PeerId = Uint8Array(32)` — usado como fonte derivada daqui pra
     frente"). O valor escolhido vira **fonte canônica** para o endurecimento.
   - No frontmatter: **remova** a linha de `decisions:` resolvida.
   - **NÃO** mexa em `status` na mão aqui — o passo 5 chama o serviço.
5. **Destrava com `decide`.** Para cada task resolvida, chame o verbo do serviço:
   `node tools/scripts/manage-task.mjs decide <ID> <SeuModelo> "decisão: <resumo>"`.
   O `decide` transiciona `draft:pending_decision → draft:hardened`, e o auto-promote (T-1029)
   dispara se as deps já estão `done`. **Não** rode `/endurecer-task` manualmente a menos que a spec
   precise ser reescrita com os novos contratos derivados da decisão.
6. **Promova (safety-net).** Encaminhe para **`/arquiteto-promover $ARGUMENTS`** — cobre as que
   o auto-promote não pegou.
7. **Persiste o controle — ENFILEIRE** (agentes não rodam git no Docs; ver Paralelismo no CLAUDE.md).
   Enfileire UMA intenção com os arquivos que VOCÊ editou (a 1ª task é o id, as demais são paths
   extras): `node tools/scripts/fila.mjs add T-304 "decisão(arquiteto): <resumo>" tasks/T-309.md`.
   Um `/drenar-fila` commita+pusha depois. **Não** enfileire `INDEX.md`.

## Quando uma decisão é grande demais para uma opção rápida
Se o grupo não é "escolha A ou B" e sim "precisa de exploração/ADR" → não force uma opção. Marque a
task como **`opus-spike`** (entregável = ADR/PoC) na Seção 6 e deixe-a fora desta rodada. Registre no
retorno que ela foi escalada.

## NÃO faça
- **NÃO** decida pelo humano numa escolha de produto/arquitetura — apresente e registre. (Exceção: um
  default técnico óbvio, que você marca como "recomendado" e segue se o humano não objetar.)
- **NÃO** edite `status`/`INDEX`/Log. Os verbos são via `manage-task.mjs decide`.
- **NÃO** invente o valor decidido só pra esvaziar a fila — isso recria o problema que o endurecimento
  existe pra impedir (CITE OU ESCALE).

## Ferramentas
`sequential-thinking` ao consolidar grupos de decisões com dependências cruzadas; `context7` se a
decisão envolve a API de uma lib (não chute a assinatura que vai virar fonte canônica).
