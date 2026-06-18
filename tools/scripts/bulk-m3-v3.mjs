import fs from 'fs';
import path from 'path';

const tasksDir = path.join(process.cwd(), 'tasks');
if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });

const tasksM3 = [
  {
    id: "T-301",
    title: "B-Tree de fingerprints (RBSR)",
    complexity: 4,
    agent: "logic_agent",
    deps: '["T-107", "T-106"]',
    obj: "Estrutura em memória ordenada por ID com fingerprint individual e XOR agregado por sub-range para reconciliação O(1).",
    rag: "- [caderno-5-transport/01-p2p-transport-and-reconciliation.md](../docs/caderno-5-transport/01-p2p-transport-and-reconciliation.md)",
    io: "- **[CREATE]** `packages/protocol/src/rbsr/BTree.ts`\n- **[CREATE]** `packages/protocol/tests/rbsr.test.ts`",
    tdd: "- [ ] **Framework:** Vitest (Node puro)\n- [ ] **Métricas:** XOR(range) deve ser exatamente igual a XOR(filhos).\n- [ ] **Fora de Escopo:** Integração de rede. Testar puramente a árvore e o math.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** importe SQLite. A B-Tree do RBSR opera estritamente em RAM (cacheada), alimentada inicialmente por queries.
> - **NÃO** instale bibliotecas externas de B-Tree. A lógica de XOR agregado é muito específica e deve ser nativa.

1. Implemente o nó da árvore com \`id\`, \`fingerprint\` (SHA-256 local) e o agregado XOR.
2. Crie métodos de inserção, remoção e split de ranges.`
  },
  {
    id: "T-302",
    title: "Protocolo de troca RBSR",
    complexity: 4,
    agent: "protocol_agent",
    deps: '["T-301", "T-204"]',
    obj: "Mensagens de split, REQUEST_NODES e aplicação transacional de nós para reconciliar os grafos entre dois peers.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-302)",
    io: "- **[CREATE]** `packages/protocol/src/rbsr/exchange.ts`\n- **[READ]** `packages/testkit/src/SimNetwork.ts`",
    tdd: "- [ ] **Framework:** Vitest (Node puro) usando SimNetwork.\n- [ ] **Métricas:** Dois peers simulados convergem perfeitamente.\n- [ ] **Fora de Escopo:** WebSockets reais.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** confie no payload do peer cegamente. Toda entrada deve passar pela checagem Layer 1 (T-107).

1. Escreva a máquina de estados do RBSR (Root -> Sub-ranges -> Request -> Apply).
2. Valide a convergência sob latência e partições simuladas usando SimNetwork.`
  },
  {
    id: "T-305",
    title: "Sync dirigido por UCAN",
    complexity: 3,
    agent: "logic_agent",
    deps: '["T-302", "T-501"]',
    obj: "Delimitar a B-Tree de RBSR usando queries de traversal do UCAN para impedir vazamento de escopo.",
    rag: "- [rfc-005](../docs/rfcs/rfc-005.md) (Validação de UCAN)",
    io: "- **[UPDATE]** `packages/protocol/src/rbsr/BTree.ts`\n- **[CREATE]** `packages/protocol/src/auth/ucanScope.ts`",
    tdd: "- [ ] **Framework:** Vitest\n- [ ] **Métricas:** Vetor Adversarial 6 (Peer sem UCAN não recebe nem o root).",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** permita sync global. A B-Tree só é computada sob o \`edge_filter\` provido.

1. Extraia a query do UCAN recebido na requisição inicial de RBSR.
2. Injete essa query como delimitador na CTE recursiva ou B-Tree.`
  },
  {
    id: "T-308",
    title: "Snapshot de bootstrap",
    complexity: 3,
    agent: "core_agent",
    deps: '["T-106"]',
    obj: "Compactar nós/edges iniciais para acelerar o onboarding de novos peers sem precisar de RBSR detalhado.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-308)",
    io: "- **[CREATE]** `packages/core/src/snapshot/bootstrap.ts`\n- **[READ]** `packages/protocol/src/rbsr/exchange.ts`",
    tdd: "- [ ] **Framework:** Vitest\n- [ ] **Métricas:** Reidratação de 10k nós em menos de 100ms.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use JSON para o snapshot. Use binário/MessagePack + zstd se possível, para tamanho mínimo.

1. Faça uma query SQLite exportando todo o subgrafo de um escopo.
2. Empacote no \`Wire Format\` compactado.
3. Crie o pipeline de reidratação rápida.`
  },
  {
    id: "T-311",
    title: "Bancada: aba Sync",
    complexity: 2,
    agent: "frontend_agent",
    deps: '["T-008", "T-302"]',
    obj: "Exibir o progresso do RBSR, ranges pendentes e botões para forçar divergência e testar a UI.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-311)",
    io: "- **[CREATE]** `apps/bancada/src/tabs/SyncTab.tsx`\n- **[UPDATE]** `apps/bancada/src/App.tsx`",
    tdd: "- [ ] **Framework:** React Testing Library\n- [ ] **Métricas:** Botão de forçar partição exibe feedback correto na UI.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** misture lógica de protocolo dentro da View React. Consuma as store globais criadas pelas instâncias.

1. Instancie o \`SyncTab.tsx\` usando Tailwind.
2. Mostre os \`Root Fingerprints\` locais vs remoto lado a lado.`
  }
];

tasksM3.forEach(t => {
  const md = `---
id: ${t.id}
title: "${t.title}"
status: ready
complexity: ${t.complexity}
target_agent: ${t.agent}
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ${t.deps}
blocks: []
---

# ${t.id} · ${t.title}

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** \`pnpm\` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo
- **Test Runner:** \`vitest\` (pacotes core/protocol) e \`playwright\` (E2E/Frontend)

## 1. Objetivo
${t.obj}

## 2. Contexto RAG (Spec-Driven Development)
${t.rag}

## 3. Escopo de Arquivos (Inputs e Outputs)
${t.io}

## 4. Estratégia de Testes Estrita (Test-Driven Development)
${t.tdd}

## 5. Instruções de Execução (Step-by-Step)
${t.steps}

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado]*

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente \`agile_reviewer\` usará esta checklist para aprovar ou rejeitar:
- [ ] Os arquivos foram criados/editados estritamente conforme a Seção 3?
- [ ] O \`pnpm test\` passa sem erros?
- [ ] O linter não aponta avisos?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Comentários de Revisão:**
`;
  fs.writeFileSync(path.join(tasksDir, `${t.id}.md`), md);
});

console.log("Tarefas M3 geradas com V3!");
