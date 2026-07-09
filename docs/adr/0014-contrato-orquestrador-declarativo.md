# ADR 0014 — Contrato do Orquestrador Declarativo (Orchestrator Pattern)

- **Status:** Aceita (2026-07-08)
- **Contexto:** DMM-01 (spike). Implementa a camada declarativa da ADR 0013.
- **Decisões do humano:** 2026-07-08 (D1/D2/D3 + fila/storage + rename).

---

## Contexto

O `@plataforma/plugin-workflows` de hoje (EST-16) é **apenas o Zen engine** (`@gorules/zen-engine`):
`WorkflowEngine.evaluate(context) → { result }`. Zen é um **motor de decisão puro e síncrono** — ele
avalia regras JDM contra um contexto e retorna um veredito. **Não** executa chamadas de rede nem
`await` de LLM/harness. Logo a premissa original ("o nó do Zen invoca o plugin async") é falsa: **o
Zen decide *quem* invocar; quem invoca é um orquestrador externo**.

## Decisão

### Renomeação
- `@plataforma/plugin-workflows` → **`@plataforma/plugin-zen-engine`** (é só o motor de decisão; zero
  consumidores hoje → rename barato). API interna inalterada.
- **Novo** `@plataforma/plugin-workflows` = o **orquestrador** (o loop). Depende do decisor por DI (o
  zen-engine é o decisor de referência), não o embute.

### D1 — Schema de nó: Orchestrator Pattern
O Zen avalia o JDM e retorna um **comando declarativo** (ex.: `{ next: "plugin-agent-harness", args }`).
Um **loop orquestrador assíncrono** lê o comando, executa o plugin, aguarda, e realimenta o resultado
no Zen para o próximo passo. (Padrão Templo/AWS Step Functions. Mantém o Zen puro, rápido, serializável.)
Rejeitada a Opção B (injetar Promises/funções async no Zen) — quebra previsibilidade/serialização.

### D2 — Transição: Redux-style Context Envelope
O estado da task é um **JSON imutável, o `Envelope`**. Cada passo executado retorna um **`Delta`**; o
orquestrador faz `applyDelta(env, delta)` (merge) e passa o Envelope atualizado ao decisor. Observabilidade
total da evolução do contexto (essencial para o pipeline de RL — DMM-11). Rejeitada a Opção B
(chaining ponto-a-ponto) — dificulta debug/branching.

### D3 — Resolução de plugin: Handler-map por DI (agora)
O JDM usa **apenas strings** (ex.: `next: "plugin-context"`). O orquestrador resolve a string num
**`HandlerMap` (`Record<string, Handler>`) injetado no construtor** (padrão DI já usado em
`createFileStore({ fs })`). O grafo JDM segue **100% JSON puro** (portátil, editável em qualquer UI).
**Não existe `PluginRegistry` no EST-02** (só `PluginManifest` + ports fs/bash/commit/network/store) —
o registry real (lookup por nome/capability no `packages/core` do superapp) fica para **DMM-14**, do
qual o handler-map passa a ser uma projeção.

### Fila de passos: `StepQueue` port + impl in-memory (spike)
Os passos do workflow trafegam por uma **fila (mensageria)**; o loop **itera a fila e despacha o
próximo passo**. `StepQueue` é uma **interface (port)**: `enqueue(step)` / `dequeue()`. O spike entrega
uma impl **in-memory** (`createInMemoryQueue`).

## ⚠️ Reuso no superapp (registrado por escrito — decisão do humano)

**A impl in-memory/fs da fila e do estado no Estaleiro é GAMBIARRA TEMPORÁRIA** (serve só o Estaleiro
standalone descartável). No **superapp**, a impl nativa e durável **reutiliza as primitivas existentes**,
sem reinventar fila/persistência (→ **DMM-15**):
- **nodes/edges** do grafo CRDT (`packages/core`) — definição do workflow + **histórico durável** dos
  passos/envelope (resumível, auditável, base de observabilidade do RL);
- **canais efêmeros** (`packages/transport`) — o **trânsito** dos passos (a mensageria do loop).

Regra geral: **o `plugin-workflows` define os ports (`StepQueue`, `Decider`, `HandlerMap`); o Estaleiro
fornece impls descartáveis; o superapp fornece impls nativas sobre nodes/edges + canais efêmeros.**

## Contrato (tipos de referência)

```ts
type Delta = Record<string, unknown>;
interface Envelope { readonly [k: string]: unknown; }          // JSON imutável
interface Step { node: string; args?: Record<string, unknown> }
type Handler = (args: Record<string, unknown>, env: Envelope) => Promise<Delta>;
type HandlerMap = Record<string, Handler>;
interface Decision { next: string | null; args?: Record<string, unknown> } // next=null → terminal
type Decider = (env: Envelope) => Promise<Decision>;           // zen-engine é o decisor de referência
interface StepQueue { enqueue(s: Step): Promise<void>; dequeue(): Promise<Step | null> }
interface OrchestratorOptions { decide: Decider; queue: StepQueue; handlers: HandlerMap }
```

Loop: pede o 1º passo ao `decide`, enfileira; enquanto a fila drena: dequeue → `handlers[step.node]`
executa → `applyDelta` → `decide(env)` → enfileira o próximo (ou termina em `next: null`).

## Verificação (PoC do DMM-01)

Um grafo Zen real decide `harness → crushToCsv → (terminal)` a partir do estado do Envelope; o
handler-map tem um **harness stub** (emite JSON) + **`crushToCsv` real** (`plugin-context`). O PoC
roda o loop e asserta que o Envelope final contém o CSV denso — provando: Zen decide, orquestrador
executa, envelope acumula, 2 plugins distintos encadeados por strings + handler-map.

## Consequências

- (+) Zen puro/serializável; workflow pausável/resumível; grafo JDM portátil (JSON).
- (+) Orquestrador testável sem Zen (decisor injetado) e sem plugins reais (handler-map stubável).
- (+) Caminho claro p/ o superapp: trocar as impls de port (fila/estado) por nodes/edges + canais.
- (−) Um `pnpm install` é necessário ao introduzir o novo pacote + rename (relink de workspace).
- **Deferido:** `PluginRegistry` no core (DMM-14); fila durável nativa do superapp (DMM-15).
