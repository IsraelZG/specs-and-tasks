const fs = require('fs');
let content = fs.readFileSync('tasks/T-202-followup-3.md', 'utf8');
const startIdx = content.indexOf('### Parecer do Agente Revisor');
const endIdx = content.indexOf('## 9. Log de Execução');

if (startIdx !== -1 && endIdx !== -1) {
  const newParecer = `### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [x] **Requer Refatoração**
- **Evidência de Execução (obrigatória — build/tsc + test):**
\`\`\`
$ pnpm --filter @plataforma/transport build
$ tsc
(EXIT 0)

$ pnpm --filter @plataforma/transport test
$ vitest run
 RUN  v3.2.6 C:/Dev2026/superapp/packages/transport

 ✓ tests/mock.test.ts (1 test) 2ms
 ✓ tests/SwarmRegistry.test.ts (14 tests) 7ms
 ✓ tests/SwarmRegistry.audit.test.ts (7 tests) 14ms
 ✓ tests/noiseServer.test.ts (2 tests) 2ms
 ✓ tests/noiseHandshake.test.ts (13 tests) 711ms

 Test Files  5 passed (5)
      Tests  37 passed (37)
   Start at  16:10:37
   Duration  1.55s

$ pnpm --filter @plataforma/transport lint
$ eslint src/
(EXIT 0)
\`\`\`
- **Comentários de Revisão:**

**BLOCKER (2) · MAJOR (0) · MINOR (0) · INFO (1)**

| Sev | ID | Local | Resumo |
|---|---|---|---|
| BLOCKER | B1 | packages/transport/tests/noiseServer.test.ts | O teste 19 é falso (apenas construtor + close). Não implementa o cross-wiring de 2 iniciadores exigido. A sonda adversarial comprovou que o código makeFilteredAdapter no NoiseServer é defeituoso, ignora o handler do onMessage e gera timeout nas conexões concorrentes. |
| BLOCKER | B2 | packages/transport/tests/noiseHandshake.test.ts | O helper makeTrio() não foi implementado conforme exigido no escopo e DoD. O worker inventou makePairWithIntruder(). |
| INFO | i1 | packages/protocol/src/ports.ts e SimNetwork.ts | Foram modificados para adicionar o onClose, atendendo à ação corretiva 1 do revisor anterior. Aceitável neste contexto de bloqueio. |

**Ação corretiva (worker):**
1. Consertar a implementação de NoiseServer (especificamente makeFilteredAdapter que ignora o handler do onMessage), pois a sonda provou que handshakes concorrentes não completam.
2. Implementar o teste 19 real em noiseServer.test.ts (simulando 2 iniciadores e 1 listener via NoiseServer).
3. Adicionar o verdadeiro helper makeTrio() e substituir o makePairWithIntruder() nos testes 17 e 18.
4. Rodar a suíte inteira de testes novamente com a implementação final corrigida.

**Veredito:** REFATORAÇÃO NECESSÁRIA — voltar para worker.

`;
  content = content.substring(0, startIdx) + newParecer + content.substring(endIdx);
  fs.writeFileSync('tasks/T-202-followup-3.md', content);
  console.log('Updated Parecer successfully');
} else {
  console.log('Could not find markers');
}
