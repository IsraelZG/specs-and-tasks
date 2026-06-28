import fs from 'fs';
import path from 'path';

const tasksDir = path.join(process.cwd(), 'tasks');
if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });

const tasksM2 = [
  {
    id: "T-201",
    title: "Wire format v1",
    complexity: 3,
    agent: "protocol",
    deps: '["T-101"]',
    obj: "Implementar parser e encoder do protocolo de serialização MessagePack + Length-Prefixed Framing.",
    rag: "- [rfc-005](../docs/rfcs/rfc-005.md) (A.2 Wire format)",
    tdd: "Round-trip tests: O que entra no encoder deve sair idêntico no decoder, mesmo para frames malformados.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use JSON.stringify. A serialização é puramente em MessagePack para performance binária.
> - **NÃO** derrube a conexão (throw exception fatal) se o frame for malformado. Trate-o como quarentena.

1. Instale \`msgpackr\` ou similar.
2. Implemente a função de parser do Length-Prefixed Framing.
3. Teste fuzzer leve com lixo binário.`
  },
  {
    id: "T-202",
    title: "Noise_XX sobre porta de transporte",
    complexity: 4,
    agent: "crypto",
    deps: '["T-201", "T-101"]',
    obj: "Handshake 3-RT trocando DevicePeerId usando a biblioteca Noise Protocol (Noise_XX).",
    rag: "- [caderno-2-protocol/03-network-and-peers.md](../docs/caderno-2-protocol/03-network-and-peers.md) (Seção Noise)",
    tdd: "Dois peers simulados via SimNetwork completando o handshake e atingindo chave de sessão idêntica.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** implemente o Noise do zero. Use uma biblioteca consolidada (\`noise-c.wasm\` ou equivalente TS).
> - **NÃO** trafegue a chave de identidade (Persona) aqui, apenas a chave do Dispositivo (DevicePeerId).

1. Integre o \`NetworkAdapterPort\` para trocar mensagens Noise.
2. Extraia o DevicePeerId do certificado trocado.`
  },
  {
    id: "T-204",
    title: "Adapter WebSocket",
    complexity: 3,
    agent: "transport",
    deps: '["T-201"]',
    obj: "Implementar `NetworkAdapterPort` usando a interface WebSocket nativa no browser e `ws` no Node.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-204)",
    tdd: "Peer A conectando no Peer B (Node) via porta WSS real.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** adicione lógica de reconexão absurda ainda, apenas backpressure básico. A reconexão pesada vem no M4.

1. Isole a biblioteca \`ws\` apenas para o build do Node. No Browser use a global \`WebSocket\`.
2. Encapsule o evento onmessage no onMessage da \`NetworkAdapterPort\`.`
  },
  {
    id: "T-205",
    title: "SwarmRegistry em RAM",
    complexity: 3,
    agent: "core",
    deps: '["T-202"]',
    obj: "Criar o registro de peers conhecidos, estado de conexão, latência e tier, indexados por DevicePeerId.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-205)",
    tdd: "Eventos de entrada e saída mantendo o estado correto; troca de persona do mesmo device não duplica registros.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** persista isso no SQLite. SwarmRegistry vive apenas na memória enquanto o nó está vivo.

1. Crie a classe \`SwarmRegistry\`.
2. Adicione as tabelas em RAM: latência (EWMA) e \`device_personas\`.`
  },
  {
    id: "T-208",
    title: "First Peer Protocol (FPP)",
    complexity: 4,
    agent: "logic",
    deps: '["T-205"]',
    obj: "Máquina de estados de conexão (JOINING -> WAITING -> CONNECTED | GENESIS).",
    rag: "- [caderno-2-protocol/05-wire-protocol.md](../docs/caderno-2-protocol/05-wire-protocol.md) (Seção FPP)",
    tdd: "Passar pelos estados usando \`VirtualClock\` simulando a espera de 8s para o timeout de rede vazia.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** inicie um perfil de usuário sem pedir explícito a não ser que ele chame GENESIS. Ficar em OFFLINE_RETRY é o default se a rede falhar.

1. Implemente a transição de estados.
2. Em GENESIS, crie o bloco \`SPECIFICATION:NETWORK_BIRTH\` imutável.`
  },
  {
    id: "T-211",
    title: "Bancada: aba Rede",
    complexity: 2,
    agent: "frontend",
    deps: '["T-008", "T-205"]',
    obj: "Tela na UI de diagnóstico para exibir peers vivos do SwarmRegistry.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-211)",
    tdd: "Playwright: Abertura da aba e listagem de mock peers injetados.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** faça polling com \`setInterval\` longo. Use reatividade nativa ligada ao evento do SwarmRegistry.

1. Na PWA da Bancada, faça o bind do store reactivo ao objeto do SwarmRegistry.
2. Mostre botões simulados de "derrubar conexão".`
  }
];

tasksM2.forEach(t => {
  const md = `---
id: ${t.id}
title: "${t.title}"
status: ready
complexity: ${t.complexity}
parent_task: null
subtasks: []
dependencies: ${t.deps}
target_agent: "${t.agent}"
reviewer_agent: "agile_reviewer"
---

# ${t.id} · ${t.title}

## 1. Objetivo
${t.obj}

## 2. Contexto RAG (Spec-Driven Development)
${t.rag}

## 3. Estratégia de Testes (Test-Driven Development)
- [ ] **Abordagem**: ${t.tdd}

## 4. Referências de Código
- Arquivos Alvo: \`packages/\`

## 5. Instruções de Execução (Step-by-Step)
${t.steps}

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado]*

## 7. Definition of Done (DoD)
- [ ] Implementação restrita às regras.
- [ ] Testes passando deterministicamente.

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

console.log("Tarefas M2 geradas!");
