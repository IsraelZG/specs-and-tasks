import fs from 'fs';
import path from 'path';

const tasksDir = path.join(process.cwd(), 'tasks');

// 1. Create T-108 (Linhagem Layer 2)
const t108Content = `---
id: T-108
title: "Linhagem Layer 2"
status: ready
complexity: 3
target_agent: logic_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ["T-107", "T-106"]
blocks: ["T-601"]
---

# T-108 · Linhagem Layer 2

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** \`pnpm\` (NÃO USE npm ou yarn)
- **Monorepo:** Turborepo
- **Test Runner:** \`vitest\` (pacotes core/protocol) e \`playwright\` (E2E/Frontend)

## 1. Objetivo
Implementar a estrutura em banco (Layer 2) que mapeia a linhagem em um Grafo Acíclico Direcionado (DAG), permitindo a navegação topológica das arestas (edges).

## 2. Contexto RAG (Spec-Driven Development)
- [caderno-2-protocol/02-data-structures-and-state.md](../docs/caderno-2-protocol/02-data-structures-and-state.md)

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[CREATE]** \`packages/core/src/dag/Lineage.ts\`
- **[CREATE]** \`packages/core/tests/lineage.test.ts\`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:** Vitest (Node puro)
- [ ] **Métricas/Cobertura:** Testar navegação de arestas pai para filho e detecção de ciclos.
- [ ] **Fora de Escopo:** Sync de rede.

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** permita ciclos na inserção de edges.

1. **[TDD]** Crie os testes.
2. Implemente a funcionalidade no pacote.

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado]*

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente \`agile_reviewer\` usará esta checklist para aprovar ou rejeitar:
- [ ] O \`pnpm test\` passa sem erros?
- [ ] Nenhum arquivo fora do escopo foi editado?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
- 

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Comentários de Revisão:**
`;
fs.writeFileSync(path.join(tasksDir, 'T-108.md'), t108Content);
console.log("T-108 criada com sucesso.");


// Map for replacing generic placeholders
const pathMapping = {
  "T-002": { module: "testkit", file: "SimNetwork.ts", test: "SimNetwork.test.ts" },
  "T-003": { module: "testkit", file: "clock.ts", test: "clock.test.ts" },
  "T-004": { module: "protocol", file: "ports.ts", test: "ports.test.ts" },
  "T-005": { module: "testkit", file: "SimNetwork.ts", test: "SimNetwork.test.ts" },
  "T-006": { module: "testkit", file: "degradation.ts", test: "degradation.test.ts" },
  "T-007": { module: "testkit", file: "assertions.ts", test: "assertions.test.ts" },
  "T-008": { module: "frontend", file: "BancadaApp.tsx", test: "BancadaApp.test.tsx" },
  "T-010": { module: "system-peer", file: "admin.ts", test: "admin.test.ts" },
  
  "T-101": { module: "crypto", file: "wrappers.ts", test: "wrappers.test.ts" },
  "T-102": { module: "core", file: "ulid.ts", test: "ulid.test.ts" },
  "T-103": { module: "core", file: "hlc.ts", test: "hlc.test.ts" },
  "T-104": { module: "crypto", file: "bip39.ts", test: "bip39.test.ts" },
  "T-105": { module: "protocol", file: "peerId.ts", test: "peerId.test.ts" },
  "T-106": { module: "core", file: "schema.ts", test: "schema.test.ts" },
  "T-107": { module: "core", file: "signature.ts", test: "signature.test.ts" },
  "T-110": { module: "core", file: "keyVault.ts", test: "keyVault.test.ts" },
  
  "T-201": { module: "protocol", file: "wireFormat.ts", test: "wireFormat.test.ts" },
  "T-202": { module: "crypto", file: "noise.ts", test: "noise.test.ts" },
  "T-204": { module: "transport", file: "websocket.ts", test: "websocket.test.ts" },
  "T-205": { module: "core", file: "swarmRegistry.ts", test: "swarmRegistry.test.ts" },
  "T-208": { module: "logic", file: "fpp.ts", test: "fpp.test.ts" },
  "T-211": { module: "frontend", file: "RedeTab.tsx", test: "RedeTab.test.tsx" }
};

const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md'));
for (const file of files) {
  const filePath = path.join(tasksDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 2. Fix target_agent nomenclature
  const agentMatch = content.match(/^target_agent:\s*"?([a-zA-Z0-9_]+)"?$/m);
  if (agentMatch) {
    let agentName = agentMatch[1];
    if (agentName === 'logic' || agentName === 'crypto' || agentName === 'frontend' || agentName === 'core' || agentName === 'protocol' || agentName === 'transport') {
      content = content.replace(/^target_agent:.*$/m, `target_agent: ${agentName}_agent`);
      changed = true;
    }
    if (agentName === '"any"' || agentName === 'any') {
      content = content.replace(/^target_agent:.*$/m, `target_agent: logic_agent`);
      changed = true;
    }
  }

  // 3. Replace generic placeholders
  if (content.includes('packages/target-module/src/index.ts')) {
    const taskId = file.replace('.md', '');
    const map = pathMapping[taskId];
    if (map) {
      content = content.replace('packages/target-module/src/index.ts', `packages/${map.module}/src/${map.file}`);
      content = content.replace('packages/target-module/tests/index.test.ts', `packages/${map.module}/tests/${map.test}`);
    } else {
      // Fallback
      content = content.replace('packages/target-module/src/index.ts', `packages/core/src/${taskId.toLowerCase()}.ts`);
      content = content.replace('packages/target-module/tests/index.test.ts', `packages/core/tests/${taskId.toLowerCase()}.test.ts`);
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log("Correções de review concluídas (T-108 criada, agents padronizados, placeholders corrigidos).");
