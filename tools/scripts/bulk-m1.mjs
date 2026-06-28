import fs from 'fs';
import path from 'path';

const tasksDir = path.join(process.cwd(), 'tasks');
if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });

const tasksM1 = [
  {
    id: "T-101",
    title: "Wrappers cripto",
    complexity: 3,
    agent: "crypto",
    deps: '["T-001"]',
    obj: "Criar wrappers isomórficos (Node/Browser) para Ed25519 (sign/verify), AES-256-GCM, SHA-256, blake2s256, HKDF no pacote `crypto`.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (Seção 4, T-101)",
    tdd: "Testes unitários usando vetores de teste oficiais (RFC) para garantir que a criptografia produz os bytes exatos esperados.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** escreva primitivas criptográficas do zero. Use \`@noble/curves\`, \`@noble/hashes\` e \`WebCrypto\`.
> - **NÃO** dependa de libs exclusivas do Node.js (\`crypto\` nativo) sem fallback para browser. A camada deve ser 100% isomórfica.

1. Instale \`@noble/curves\` e \`@noble/hashes\` no pacote \`crypto\`.
2. Implemente funções wrap para assinar, verificar, hashear e derivar.
3. Crie os testes com vetores conhecidos.`
  },
  {
    id: "T-102",
    title: "ULID + EntityId",
    complexity: 2,
    agent: "logic",
    deps: '["T-003"]',
    obj: "Gerar ULIDs (Universally Unique Lexicographically Sortable Identifier) amarrados ao `ClockPort` e `RandomPort`.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (Seção 4, T-102)",
    tdd: "Provar que a ordenação de IDs segue a ordem temporal do Clock virtual.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** importe libs externas como \`uuid\` ou \`ulid\`. O projeto exige uma implementação de ULID que consuma as portas de injeção (\`ClockPort\`, \`RandomPort\`) para ser determinística nos testes.

1. Implemente o encoder/decoder Base32 de Crockford.
2. Construa o ULID (48 bits de timestamp, 80 bits de random).
3. Teste a ordenação lexicográfica.`
  },
  {
    id: "T-103",
    title: "HLC (Hybrid Logical Clock) completo",
    complexity: 3,
    agent: "logic",
    deps: '["T-003"]',
    obj: "Implementar o Relógio Lógico Híbrido, que combina tempo físico com um contador lógico para ordenar eventos em sistemas distribuídos.",
    rag: "- [caderno-2-protocol/02-data-structures-and-state.md](../docs/caderno-2-protocol/02-data-structures-and-state.md) (Algoritmo HLC)",
    tdd: "Asserções atestando que o HLC sempre avança e que o drift máximo não é excedido.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use o tempo do sistema diretamente. Use sempre a \`ClockPort\`.
> - **NÃO** armazene o HLC como string no pacote Core. HLC será mantido empacotado internamente e só serializado na borda.

1. Crie a estrutura HLC armazenando \`pt\` (tempo físico) e \`c\` (contador).
2. Implemente as lógicas de evento local, envio e recebimento de mensagem conforme o paper do HLC.
3. Imponha a regra de quarentena \`MAX_DRIFT\`.`
  },
  {
    id: "T-104",
    title: "BIP39 + Derivação de Chaves + Desbloqueio",
    complexity: 3,
    agent: "crypto",
    deps: '["T-101"]',
    obj: "Mnemônico de 12/24 palavras que deriva a chave mestra Ed25519; chave do dispositivo via PBKDF2 da senha.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (Seção 4, T-104)",
    tdd: "Mesmo mnemônico = mesmas chaves. Senha errada = falha imediata na descriptografia do vault local.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use a senha do usuário como chave de identidade do grafo. A senha apenas cifra a chave localmente via PBKDF2.

1. Adicione suporte a BIP39 usando \`@noble/hashes/pbkdf2\`.
2. Implemente a derivação do seed para a master key Ed25519.`
  },
  {
    id: "T-105",
    title: "PeerId e Multiaddr",
    complexity: 2,
    agent: "protocol",
    deps: '["T-101"]',
    obj: "DevicePeerId (chave estável de transporte) e PersonaPeerId (chave de aplicação).",
    rag: "- [rfc-005](../docs/rfcs/rfc-005.md) (A.5)",
    tdd: "Verificar parse/encode de multiaddr e derivações hash consistentes.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** instale bibliotecas do IPFS/libp2p (\`@multiformats/multiaddr\`). Faremos um parser local minimalista restrito aos formatos necessários do projeto (\`/dns4/ip4/wss\`).

1. Crie a derivação: \`DevicePeerId = blake2s256(DEVICE_PUB_KEY)\`.
2. Escreva o encoder e parser rudimentar para as strings Multiaddr.`
  },
  {
    id: "T-106",
    title: "Schema SQLite local (nodes/edges)",
    complexity: 3,
    agent: "core",
    deps: '["T-004"]',
    obj: "Criar o schema oficial SQLite (`core`) para wa-sqlite/better-sqlite3, com migrations compartilhadas.",
    rag: "- [visao-arquitetural.md](../docs/visao-arquitetural.md) e [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-106)",
    tdd: "Verificar inserção via porta `StoragePort` com tipagem forte e garantir idempotência da migration.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** use ORMs pesados (TypeORM, Prisma). As queries devem ser escritas em SQL cru ou Query Builders levíssimos. A performance e o schema são artesanais para suportar as CTEs recursivas no futuro.

1. Crie o arquivo DDL com a tabela \`event_log\` / \`nodes\` / \`edges\`.
2. Exija campos obrigatórios: \`id\`, \`pub_key\`, \`signature\`, \`hlc\`.
3. Teste o init e migration vazia via interface StoragePort mockada.`
  },
  {
    id: "T-107",
    title: "Assinatura Universal Layer 1",
    complexity: 4,
    agent: "core",
    deps: '["T-101", "T-106"]',
    obj: "Serialização canônica de campos + payload cifrado -> verificação isolada na borda antes do SQLite.",
    rag: "- [plano-de-implementacao.md](../docs/plano-de-implementacao.md) (T-107)",
    tdd: "Qualquer mutação maliciosa de campo deve invalidar a assinatura local.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** decifre o \`payload\` para checar a assinatura (Layer 1 não entende de domínio de aplicação, só byte array opaco).

1. Construa o gerador de buffer determinístico (todos os campos em ordem léxica).
2. O resultado deve passar pela validação Ed25519 usando a função de T-101.`
  },
  {
    id: "T-110",
    title: "Key Vault v0",
    complexity: 3,
    agent: "core",
    deps: '["T-101"]',
    obj: "Custódia temporária em RAM de chaves de época (AES) entregues pelo core/crypto worker.",
    rag: "- [rfc-005](../docs/rfcs/rfc-005.md) (A.12 Key Vault de Rede)",
    tdd: "Testes do TTL apagando a chave estritamente após 4 horas via Clock virtual.",
    steps: `> **⚠️ REGRAS DO QUE NÃO FAZER:**
> - **NÃO** persista as chaves de época na DB local neste momento. O Key Vault é estritamente *in-memory* (transitório).

1. Crie uma classe KeyVault que armazena objetos do tipo \`{ key: Uint8Array, expiresAt: number }\`.
2. Integre com o \`ClockPort\` para limpar sob expiração.`
  }
];

tasksM1.forEach(t => {
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

console.log("Tarefas M1 geradas!");
