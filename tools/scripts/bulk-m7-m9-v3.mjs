import fs from 'fs';
import path from 'path';

const tasksDir = path.join(process.cwd(), 'tasks');
if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });

const tasks = [
  // --- MARCO M7 ---
  {
    id: "T-701",
    title: "AES de Link (Peer-to-Peer Encriptado)",
    complexity: 3,
    agent: "crypto_agent",
    deps: '["T-202", "T-101"]',
    obj: "Estabelecer encriptação em trânsito ponta-a-ponta para o protocolo P2P local (não usando TLS nativo, mas AES derivado do Noise).",
    rag: "- [caderno-2-protocol/03-network-and-peers.md](../docs/caderno-2-protocol/03-network-and-peers.md)",
    io: "- **[CREATE]** `packages/transport/src/crypto/LinkCipher.ts`\n- **[UPDATE]** `packages/protocol/src/ports/NetworkAdapterPort.ts`",
    tdd: "- [ ] **Framework:** Vitest\n- [ ] **Métricas:** Frame interceptado por um man-in-the-middle deve ser lixo ininteligível. \n- [ ] **Ambiente:** Node puro.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** cifre dados que já foram cifrados em Layer 2. A cifra de link protege apenas metadados e headers.
> - **NÃO** crie as chaves de sessão manualmente. Elas saem como state pós-handshake Noise.`
  },
  // --- MARCO M8 ---
  {
    id: "T-801",
    title: "Storage Engine de BLOBs (Chunking)",
    complexity: 4,
    agent: "core_agent",
    deps: '["T-106"]',
    obj: "Gravar arquivos (fotos/vídeos) fragmentados no OPFS/IndexedDB, hasheados em uma Merkle Tree para sync descentralizado.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-801)",
    io: "- **[CREATE]** `packages/media/src/blob/Chunker.ts`\n- **[CREATE]** `packages/media/src/blob/MerkleTree.ts`",
    tdd: "- [ ] **Framework:** Vitest (Node)\n- [ ] **Métricas:** Arquivo de 5MB dividido perfeitamente em chunks de 256kb e reconstituído com o mesmo SHA-256.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** armazene BLOBs na tabela SQLite de grafos. O BlobStorage corre em paralelo usando OPFS no browser.
> - **NÃO** carregue o arquivo inteiro na memória RAM (Buffer). Use Streams nativos.`
  },
  // --- MARCO M9 ---
  {
    id: "T-905",
    title: "Bateria de Testes Adversariais (Chaos/Fuzzer)",
    complexity: 5,
    agent: "devops_agent",
    deps: '["T-404", "T-601", "T-801"]',
    obj: "Criar o framework de fuzzing final (Chaos Monkey local) que injeta mensagens malformadas aleatórias e partições arbitrárias para quebrar a convergência.",
    rag: "- [visao-arquitetural.md](../docs/visao-arquitetural.md) (Qualidade)",
    io: "- **[CREATE]** `packages/testkit/src/chaos/Fuzzer.ts`\n- **[CREATE]** `packages/testkit/tests/e2e.chaos.test.ts`",
    tdd: "- [ ] **Framework:** Playwright (Workers múltiplos)\n- [ ] **Métricas:** 1 milhão de iterações sem o SQLite entrar em estado corrompido (sempre reverte ou dropa).",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** teste regras de UI aqui. O fuzzer injeta pacotes MessagePack inválidos diretamente no NetworkAdapterPort.
> - **NÃO** use Math.random solto, continue forçando a seed fixa para que um crash seja reproduzível 100% das vezes.`
  }
];

tasks.forEach(t => {
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

1. **[TDD]** Crie os testes garantindo que falhem.
2. Implemente a funcionalidade no pacote indicado.
3. Garanta que o linter aprove o código.

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado]*

## 7. Definition of Done (DoD) & Reviewer Checklist
O agente \`agile_reviewer\` usará esta checklist para aprovar ou rejeitar:
- [ ] O \`pnpm test\` passa sem erros no ambiente exigido?
- [ ] Nenhum arquivo fora do escopo (Seção 3) foi editado indevidamente?
- [ ] As regras negativas (O que não fazer) foram obedecidas?

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

console.log("Tarefas M7, M8, M9 geradas na estrutura V3!");
