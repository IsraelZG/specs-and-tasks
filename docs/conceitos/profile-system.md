---
name: profile-system
title: "PROFILE:SYSTEM (Entidade Robotizada de Infraestrutura)"
aliases: ["PROFILE:SYSTEM", "agente de sistema (tipo)", "peer do sistema", "entidade de infraestrutura"]
tags: [protocol, ontologia, identidade, infraestrutura]
---

# PROFILE:SYSTEM

> **Modo canonical** — definição canônica extraída de
> `caderno-2-protocol/01-graph-ontology.md §3.1`.
> Aparição secundária consolidada: `glossary.md §PROFILE:SYSTEM`.

---

## Definição

`PROFILE:SYSTEM` é o subtipo de [[profile]] que representa **entidades robotizadas
dotadas de identidade criptográfica própria** (par de chaves Ed25519) que executam
funções de infraestrutura da rede — Sync Workers, validadores de domínio,
auditores ou agentes de comunicação interna.

> Definição canônica literal (`caderno-2-protocol/01-graph-ontology.md §3.1`):
>
> `PROFILE:SYSTEM` — Entidades robotizadas que executam funções de infraestrutura
> (Sync Workers, validadores, etc.).

> Definição complementar (`glossary.md §PROFILE:SYSTEM`):
>
> `PROFILE:SYSTEM` — Subtipo de PROFILE dotado de chaves Ed25519 que executa
> funções de infraestrutura, validação (Validadores de Domínio), auditoria ou
> comunicação interna do sistema via nós `CONTENT:MESSAGE` roteados por arestas
> `DIRECTED_TO`.

---

## Papel na ontologia do grafo

`PROFILE:SYSTEM` é subtipo de [[profile]]. Como todo `PROFILE`, possui par de
chaves Ed25519 e atua como sujeito de ações (emite arestas `AUTHORED`,
`APPROVED_BY`, `SIGNED_BY`; recebe arestas `PARTICIPATES_IN`, `OWNS`).

Duas arestas são **exclusivas ou primárias** deste subtipo na v4:

- **`CONTRIBUTES`** — liga um `PROFILE:SYSTEM` à prova de contribuição à rede;
  unifica banda, storage e processamento por atributo `kind: serve | store |
  compute`. O mesmo tipo diferenciado por payload satisfaz o critério de
  minimalismo ontológico (§4 do caderno de ontologia). O *standing* acumulado é
  um `ASSET:BALANCE_STATE` de contribuição.
- **`APPROVES`** (v4) — emitida pelo validador (`PROFILE:SYSTEM`) em direção a
  um `CONTENT:INTENT`, constituindo aprovação com evidência inline.

> Contexto normativo completo das arestas v4:
> `caderno-2-protocol/01-graph-ontology.md §2.2–2.3` e `rfc-v4.md §3.2`.

---

## Comunicação interna

O `PROFILE:SYSTEM` pode trocar instruções e respostas com outros agentes via
nós `CONTENT:MESSAGE` roteados por arestas `DIRECTED_TO`, operando em modo
offline-first (ver [[content]] e `glossary.md §CONTENT:MESSAGE`).

---

## Integridade sem TEE

O `PROFILE:SYSTEM` roda no device do humano (hardware potencialmente hostil).
A plataforma **não usa TEE/TPM**; a integridade é por **detecção pós-hoc**:

1. Auditoria do que fez (reexecução determinística onde aplicável).
2. **Desafios "canary"**: tarefas de gabarito conhecido, indistinguíveis do
   trabalho real, injetadas proativamente. Fortes para trabalho determinístico
   (assinatura, merge, regra Zen — gabarito re-verificável por qualquer um),
   storage (desafio-resposta) e banda (peer-sonda); fracos para compute
   não-determinístico (IA).

> Texto normativo retirado literalmente de
> `caderno-2-protocol/02-cryptographic-lineage-and-auth.md §1.6`.
>
> Princípio: o agente é confiável para **orquestrar**, nunca para **afirmar**
> o não-verificável.

Em redes com autoridade, a suíte contínua de honeypots é um recurso gerenciado
(**integridade-como-serviço**).

---

## Distinção em relação a outros subtipos de PROFILE

| Subtipo | Propósito |
|:---|:---|
| [[profile-authentication]] | Identidade-âncora do humano numa rede |
| [[profile-persona]] | Máscara pública operacional do humano |
| `PROFILE:ORGANIZATION` | Empresa/consórcio com fins de moderação |
| **`PROFILE:SYSTEM`** | Entidade robotizada de infraestrutura |

---

## Conceitos relacionados

- [[profile]] — tipo-pai; define comportamento de emissão e recebimento de arestas
- [[profile-authentication]] — identidade-âncora humana, contraparte do sistema
- [[profile-persona]] — máscara pública humana, contraparte do sistema
- [[ucan]] — tokens de autorização usados pelo agente para operar com escopo limitado
- [[agente-de-sistema]] <!-- Foam placeholder — verbete Onda 10 -->


