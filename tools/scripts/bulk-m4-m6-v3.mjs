import fs from 'fs';
import path from 'path';

const tasksDir = path.join(process.cwd(), 'tasks');
if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });

const tasks = [
  // --- MARCO M4 ---
  {
    id: "T-402",
    title: "Adapter WebRTC DataChannel",
    complexity: 4,
    agent: "transport_agent", // Focado em rede
    deps: '["T-204", "T-302"]',
    obj: "Implementar NetworkAdapterPort sobre WebRTC DataChannel, permitindo a sincronização RBSR sem passar pelo Peer do Sistema (Cloud).",
    rag: "- [caderno-5-transport/02-webrtc-mesh.md](../docs/caderno-5-transport/02-webrtc-mesh.md)",
    io: "- **[CREATE]** `packages/transport/src/webrtc/WebRtcAdapter.ts`\n- **[READ]** `packages/protocol/src/ports/NetworkAdapterPort.ts`",
    tdd: "- [ ] **Framework:** Playwright (2 Browser Contexts)\n- [ ] **Métricas:** Conexão estabelecida e pacote de 1MB transferido.\n- [ ] **Ambiente:** Teste E2E (não roda no Node puro).",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** tente rodar isso no Node. WebRTC não existe nativamente no Node sem pacotes complexos (wrtc). A implementação é focada no Browser.
> - **NÃO** crie servidores STUN/TURN locais. Assuma o relay público no teste, ou injete mock.`
  },
  {
    id: "T-404",
    title: "ConnectionPromotionEngine (Hole Punching)",
    complexity: 4,
    agent: "logic_agent",
    deps: '["T-402"]',
    obj: "Mecanismo que tenta promover conexões de Relay para Conexões Diretas (WebRTC) em background, e fallback gracefully.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-404)",
    io: "- **[CREATE]** `packages/transport/src/promotion/Engine.ts`\n- **[UPDATE]** `packages/testkit/src/SimNetwork.ts`",
    tdd: "- [ ] **Framework:** Vitest (Node) usando SimNetwork.\n- [ ] **Métricas:** Perfil 'symmetric' nunca promove, perfil 'cone' promove em 100% dos casos simulados.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** teste com NAT real. Use estritamente o Simulador de Rede e o VirtualClock.
> - **NÃO** derrube a conexão de relay antes da direta estar confirmada (make-before-break).`
  },
  // --- MARCO M5 ---
  {
    id: "T-501",
    title: "Motor de UCAN Core",
    complexity: 4,
    agent: "crypto_agent",
    deps: '["T-101", "T-107"]',
    obj: "Emissão, validação e delegação de UCANs (User Controlled Authorization Networks) baseados em assinaturas Ed25519.",
    rag: "- [caderno-4-governance/01-ucan.md](../docs/caderno-4-governance/01-ucan.md)",
    io: "- **[CREATE]** `packages/core/src/auth/ucan.ts`\n- **[CREATE]** `packages/core/tests/ucan.test.ts`",
    tdd: "- [ ] **Framework:** Vitest\n- [ ] **Métricas:** Validar cadeias corretas, rejeitar cadeias quebradas ou expiradas, e validar limitação de escopo (atenuação).",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** carregue chaves privadas no payload do UCAN.
> - **NÃO** acesse banco de dados SQLite para checar UCANs. A validação é pure-math (criptográfica).`
  },
  {
    id: "T-505",
    title: "Rotação de Épocas (Forward Secrecy)",
    complexity: 5,
    agent: "crypto_agent",
    deps: '["T-501", "T-110"]',
    obj: "Rotação de chave AES do escopo com consolidação offline. Novos nós cifram com a chave nova, garantindo corte de acesso a ex-membros.",
    rag: "- [rfc-005](../docs/rfcs/rfc-005.md) (A.12 Key Vault)",
    io: "- **[UPDATE]** `packages/core/src/vault/KeyVault.ts`\n- **[CREATE]** `packages/core/src/vault/EpochRotation.ts`",
    tdd: "- [ ] **Framework:** Vitest\n- [ ] **Métricas:** Membro revogado consegue ler nós antigos em cache, mas falha em decifrar nós novos gerados na época atual.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** crie uma chave AES por dispositivo. A chave de época é compartilhada no escopo.
> - **NÃO** reescreva (re-cifre) o histórico. A criptografia é imutável.`
  },
  // --- MARCO M6 ---
  {
    id: "T-601",
    title: "Detecção Estrutural de Fork e Merge",
    complexity: 4,
    agent: "logic_agent",
    deps: '["T-108", "T-302"]',
    obj: "Identificar quando o DAG físico bifurca (duas edições concorrentes na mesma linhagem) e aplicar resolução determinística.",
    rag: "- [caderno-2-protocol/02-data-structures-and-state.md](../docs/caderno-2-protocol/02-data-structures-and-state.md)",
    io: "- **[UPDATE]** `packages/core/src/db/sqlite-driver.ts`\n- **[CREATE]** `packages/core/src/dag/merge.ts`",
    tdd: "- [ ] **Framework:** Vitest\n- [ ] **Métricas:** SimNetwork com partição cria fork; ao curar a rede, o merge é executado automaticamente em ambos resultando no mesmo HLC root.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use merge semântico de CRDT (Y.js/Automerge) aqui. O Fork Estrutural opera na camada bruta (Layer 2). O merge consiste em um nó apontando para as duas pontas do fork.`
  },
  {
    id: "T-604",
    title: "Zen Engine Embarcado + Invariante T1",
    complexity: 3,
    agent: "logic_agent",
    deps: '["T-601"]',
    obj: "Motor de regras (GoRules Zen) para validar mutação de saldo de intents transacionais.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-604)",
    io: "- **[CREATE]** `packages/core/src/rules/ZenEngine.ts`\n- **[UPDATE]** `packages/core/tests/zen.test.ts`",
    tdd: "- [ ] **Framework:** Vitest\n- [ ] **Métricas:** Vetor Adversarial 11: rejeitar saldo fraudado (anterior + delta != novo).",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** execute GoRules na thread principal (UI). Se necessário, deve rodar no SyncWorker.
> - **NÃO** acesse o disco dentro do executor de regras. O estado anterior é injetado.`
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

console.log("Tarefas representativas M4, M5, M6 geradas na estrutura V3!");
