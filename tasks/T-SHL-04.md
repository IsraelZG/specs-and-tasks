---
id: T-SHL-04
title: "drag/share como mensagem de comando + contrato de aceite + falha controlada; rota + deep-link"
status: draft:triaged
complexity: 4
target_agent: frontend_agent # perfis: devops_agent, logic_agent, crypto_agent, frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential # parallel | sequential
dependencies: ["T-SHL-01"] # IDs de tarefas que bloqueiam esta
blocks: ["T-SHL-05"] # IDs de tarefas que esta bloqueia
capacity_target: sonnet
---

# T-SHL-04 · drag/share como mensagem de comando + contrato de aceite + falha controlada; rota + deep-link

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** `pnpm` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo (`pnpm build`, `pnpm test`, `pnpm lint` na raiz afetam todos os pacotes)
- **Test Runner:** `vitest` (pacotes core/protocol) e `playwright` (E2E/Frontend)
- **Capacidade-alvo:** sonnet

## 1. Objetivo
Implementar drag/share entre painéis como mensagem de comando unificada (desktop drag + mobile share = mesma semântica),
contrato de aceite declarado por módulo, segurança de intent irreversível, e endereçabilidade (rota + deep-link).
Fonte: `caderno-3-sdk/28-shell-e-composicao.md §6, §7`.

### Contratos exatos (assinaturas TS fixadas)
```ts
// packages/shell/src/inter-panel.ts

export type InterPanelMessageType = "intent" | "ephemeral";

export interface InterPanelPayload {
  /** Tipo do payload (ex.: "social:post", "marketplace:product"). */
  payloadType: string;
  /** Dados serializados. */
  data: unknown;
  /** Se true, a ação é irreversível e exige confirmação + time-delay. */
  irreversible: boolean;
}

export interface AcceptContract {
  /** Tipos de payload que este módulo aceita receber. */
  acceptedPayloadTypes: string[];
  /** Se aceita mensagens irreversíveis. */
  acceptsIrreversible: boolean;
}

export interface InterPanelMessage {
  /** ID único da mensagem. */
  messageId: string;
  /** Painel de origem. */
  sourcePanelId: string;
  /** Módulo/painel de destino. */
  targetPanelId: string;
  /** Tipo (intent durável vs. efêmero). */
  messageType: InterPanelMessageType;
  /** Payload. */
  payload: InterPanelPayload;
  /** Timestamp HLC. */
  timestamp: number;
}

export interface DragShareBridge {
  /** Registra contrato de aceite de um painel. */
  registerAcceptContract(panelId: string, contract: AcceptContract): void;
  /** Verifica se destino aceita o payload (para highlight de destinos válidos). */
  canAccept(panelId: string, payload: InterPanelPayload): boolean;
  /** Lista painéis que aceitam dado payload (para share-sheet). */
  listAcceptors(payload: InterPanelPayload): string[];
  /** Envia mensagem entre painéis. Para irreversíveis, exige confirmação. */
  send(message: InterPanelMessage): Promise<void>;
}

// --- packages/shell/src/deep-link.ts 
---

export interface DeepLinkState {
  /** Workspace nomeado (opcional, default se omitido). */
  workspace?: string;
  /** Painéis a abrir com rota + params. */
  panels: Array<{
    moduleId: string;
    route: string;
    params?: Record<string, string>;
  }>;
}

export interface DeepLinkHandler {
  /** Serializa estado atual para URL (pushState). */
  serializeToUrl(state: DeepLinkState): string;
  /** Desserializa URL para estado de workspace. */
  parseFromUrl(url: string): DeepLinkState;
  /** Aplica estado ao shell (abre painéis, restaura workspace). */
  apply(state: DeepLinkState): void;
}
```

## 2. Contexto RAG (Spec-Driven Development)
- [mecanica-de-telas.md §T2](../docs/mecanica-de-telas.md) — mecânica de interação do drag/share definida lá [proposta, não validada em mockup]: ghost com preview do payload; drop targets válidos **se iluminam** (inválidos esmaecem; soltar fora = animação de retorno, sem modal de erro); uma ação possível = executa com toast+Desfazer; múltiplas = menu contextual no ponto do drop; irreversível = confirmação+time-delay. Inclui a **matriz payload→ação v1** (produto→chat/ads/social, email→calendário, place→evento, etc.) — os `payloadType`/`AcceptContract` desta task devem cobrir essa matriz. Payload carrega referência ao nó, nunca cópia.
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §6 — Drag e share como comando; contrato de aceite; segurança de intent irreversível
- [caderno-3-sdk/28-shell-e-composicao.md](../docs/caderno-3-sdk/28-shell-e-composicao.md) §7 — Endereçabilidade e navegação (rota, URL, deep-link)
- [[spec-workspace]] — Deep-link serializa estado de workspace (T-SHL-01)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** `docs/caderno-3-sdk/28-shell-e-composicao.md` §6, §7, §11
- **[READ]** `packages/shell/src/workspace.ts` — ShellRoot, PanelBind (T-SHL-01)
- **[CREATE]** `packages/shell/src/inter-panel.ts` — DragShareBridge + AcceptContract
- **[CREATE]** `packages/shell/src/drag-share-bridge.ts` — implementação
- **[CREATE]** `packages/shell/src/deep-link.ts` — DeepLinkHandler
- **[CREATE]** `packages/shell/tests/inter-panel.test.ts` — testes unitários
- **[CREATE]** `packages/shell/e2e/drag-share.spec.ts` — Playwright (drag visual + share sheet)

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [x] **Framework:** Vitest (Node) para bridge; Playwright para E2E de drag/share.
- [x] **Ambiente do Teste:** Node puro para lógica; headless Chromium para interações visuais.
- [x] **Fora de Escopo:** Implementação real do protocolo de mensageria entre módulos (depende de T-MOD-01). Intent durável real (depende de T-605).

Casos de teste (numerados):
1. `registerAcceptContract("panelA", { acceptedPayloadTypes: ["social:post"] })` → `canAccept("panelA", { payloadType: "social:post", ... })` retorna true.
2. `canAccept("panelA", { payloadType: "unknown" })` retorna false.
3. `listAcceptors({ payloadType: "marketplace:product" })` retorna apenas painéis que declararam esse tipo.
4. Mensagem irreversível (`irreversible: true`) exige chamada de confirmação antes de `send()`; `send()` sem confirmar lança.
5. `DeepLinkHandler.serializeToUrl()` gera URL válida; `parseFromUrl()` recupera estado idêntico.
6. Playwright: arrastar item da coluna A para coluna B dispara destaque de destino válido; soltar em destino inválido mostra feedback de rejeição.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** emita intent irreversível sem confirmação — gesto acidental deve ser recuperável (§6.3: "drop zones explícitas e destacadas" + time-delay/undo).
> - **NÃO** permita drag para destino que não declarou o payload type no AcceptContract — falha controlada com feedback, nunca erro silencioso (§6.2).
> - **NÃO** use dois caminhos de código para desktop drag vs. mobile share — a semântica é a mesma, só o gesto difere (§6.1).

### Pegadinhas conhecidas
- **Drag no mobile não existe como gesto:** no mobile, o "drag" vira share-sheet (lista de destinatários). A interface `DragShareBridge.send()` é única para ambos; o adaptador de UI (drag handler vs. share-sheet) é que escolhe o gesto.
- **Deep-link e pushState:** usar `history.pushState`, não `replaceState`, para que voltar/avançar do navegador funcione como navegação entre estados de workspace.
- **Irreversível precisa de time-delay:** após confirmação, esperar 3 segundos antes de emitir o intent durável; oferecer botão de undo durante a janela. O intent só é emitido após o delay expirar sem undo.

1. **[TDD]** Crie `packages/shell/tests/inter-panel.test.ts` com casos 1–5.
2. Implemente `packages/shell/src/inter-panel.ts` com as interfaces.
3. Implemente `packages/shell/src/drag-share-bridge.ts`: registro de contratos, canAccept, listAcceptors, send com gate de irreversível.
4. Implemente `packages/shell/src/deep-link.ts`: serialize/parse/apply de DeepLinkState.
5. Adicione Playwright E2E (caso 6) em `packages/shell/e2e/drag-share.spec.ts`.
6. Rode build + test e cole saída.

## 6. Feedback de Especificação (Spec Feedback Loop)
Nenhuma pendência.

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente `agile_reviewer` usará esta checklist:
- [ ] Drag e share usam a mesma interface `DragShareBridge.send()`?
- [ ] Contrato de aceite filtra destinos válidos (canAccept/listAcceptors)?
- [ ] Intent irreversível exige confirmação + time-delay antes de emitir?
- [ ] Destino inválido falha com feedback, não erro silencioso?
- [ ] Deep-link serializa/restaura estado de workspace corretamente?
- [ ] `pnpm test` verde? Playwright E2E passa?

### Verificação automática
```bash
pnpm --filter @plataforma/shell build
pnpm --filter @plataforma/shell test
```

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência de Execução (obrigatória — colar saída de build/tsc + test):**
```
(cole aqui a saída real de pnpm build e pnpm test)
```
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando `node tools/scripts/manage-task.mjs`.

- **[2026-07-03 13:26:06]** - *system* - `[Migrado]`: spec_status:draft → status:draft:placeholder
- **[2026-07-03T20:03]** - *system* - `[Triado]`: Triagem em lote do backlog
