import { describe, it, expect } from 'vitest';
import { runVerificationGate, parseVerifyCommands } from '../runner/verify-gate.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('verify-gate', () => {
  describe('runVerificationGate', () => {
    it('comando com exit 0 → ok:true, 1 step ok', async () => {
      const result = await runVerificationGate({
        cwd: process.cwd(),
        commands: ['node -e "process.exit(0)"'],
      });
      expect(result.ok).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].ok).toBe(true);
      expect(result.steps[0].command).toBe('node -e "process.exit(0)"');
    });

    it('comando com exit 1 → curto-circuito, ok:false, 1 step só', async () => {
      const result = await runVerificationGate({
        cwd: process.cwd(),
        commands: [
          'node -e "process.exit(1)"',
          'node -e "process.exit(0)"',
        ],
      });
      expect(result.ok).toBe(false);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].ok).toBe(false);
    });

    it('curto-circuito: 2o comando NÃO executa após falha do 1o', async () => {
      const result = await runVerificationGate({
        cwd: process.cwd(),
        commands: [
          'node -e "process.exit(1)"',
          'node -e "console.log(42); process.exit(0)"',
        ],
      });
      expect(result.steps).toHaveLength(1);
      expect(result.output).not.toContain('42');
    });

    it('cwd é respeitado: stdout contém o cwd', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-gate-test-'));
      try {
        const result = await runVerificationGate({
          cwd: tmpDir,
          commands: ['node -e "process.stdout.write(process.cwd())"'],
        });
        expect(result.ok).toBe(true);
        expect(result.output).toContain(tmpDir);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('timeout: comando que dorme além do timeout → step falha', async () => {
      const result = await runVerificationGate({
        cwd: process.cwd(),
        commands: ['node -e "setTimeout(() => {}, 5000)"'],
        timeoutMsPerCommand: 500,
      });
      expect(result.ok).toBe(false);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].ok).toBe(false);
    });

    it('múltiplos comandos com sucesso → todos executados, ok:true', async () => {
      const result = await runVerificationGate({
        cwd: process.cwd(),
        commands: [
          'node -e "process.exit(0)"',
          'node -e "console.log(\'step2\'); process.exit(0)"',
        ],
        tailLines: 20,
      });
      expect(result.ok).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].ok).toBe(true);
      expect(result.steps[1].ok).toBe(true);
      expect(result.output).toContain('step2');
    });

    it('sem comandos → ok:true, steps vazio', async () => {
      const result = await runVerificationGate({
        cwd: process.cwd(),
        commands: [],
      });
      expect(result.ok).toBe(true);
      expect(result.steps).toEqual([]);
    });

    it('captura stdout e stderr mesmo no erro', async () => {
      const result = await runVerificationGate({
        cwd: process.cwd(),
        commands: ['node -e "console.error(\'err-out\'); process.exit(2)"'],
        tailLines: 50,
      });
      expect(result.ok).toBe(false);
      expect(result.output).toContain('err-out');
    });

    it('tailLines padrão 40: comando com mais linhas → trunca', async () => {
      const lines = Array.from({ length: 100 }, (_, i) => `console.log('line${i}');`).join(' ');
      const result = await runVerificationGate({
        cwd: process.cwd(),
        commands: [`node -e "${lines}"`],
        tailLines: 3,
      });
      expect(result.ok).toBe(true);
      const outLines = result.output.trim().split('\n');
      expect(outLines.length).toBeLessThanOrEqual(3);
    });

    it('comandos idênticos com output → output concatena todos', async () => {
      const result = await runVerificationGate({
        cwd: process.cwd(),
        commands: [
          'node -e "console.log(\'A\'); process.exit(0)"',
          'node -e "console.log(\'B\'); process.exit(0)"',
        ],
        tailLines: 50,
      });
      expect(result.output).toContain('A');
      expect(result.output).toContain('B');
    });
  });

  describe('parseVerifyCommands', () => {
    it('extrai comandos do bloco Verificação automática', () => {
      const body = `Algum texto antes

### Verificação automática *(comandos exatos — worker E reviewer rodam e COLAM a saída)*
\`\`\`bash
pnpm --filter meu-pacote build
pnpm --filter meu-pacote test
\`\`\`
texto depois`;
      const result = parseVerifyCommands(body);
      expect(result).toEqual([
        'pnpm --filter meu-pacote build',
        'pnpm --filter meu-pacote test',
      ]);
    });

    it('ignora linhas de comentário (#)', () => {
      const body = `### Verificação automática *(worker E reviewer rodam)*
\`\`\`bash
pnpm --filter pkg build      # tsc
# instalacao feita antes
pnpm --filter pkg test
\`\`\``;
      const result = parseVerifyCommands(body);
      expect(result).toEqual([
        'pnpm --filter pkg build      # tsc',
        'pnpm --filter pkg test',
      ]);
    });

    it('sem bloco e sem fallback → []', () => {
      const body = 'Corpo sem bloco de verificação automática';
      expect(parseVerifyCommands(body)).toEqual([]);
    });

    it('sem bloco mas com fallbackPackage → fallback pnpm', () => {
      const body = 'Corpo sem bloco de verificação';
      const result = parseVerifyCommands(body, 'meu-pacote');
      expect(result).toEqual([
        'pnpm --filter meu-pacote build',
        'pnpm --filter meu-pacote test',
      ]);
    });

    it('encontra apenas o bloco DEPOIS de Verificação automática', () => {
      const body = `\`\`\`bash
echo "bloco anterior"
\`\`\`

### Verificação automática *(commands)*
\`\`\`bash
pnpm --filter pkg build
pnpm --filter pkg test
\`\`\``;
      const result = parseVerifyCommands(body);
      expect(result).toEqual([
        'pnpm --filter pkg build',
        'pnpm --filter pkg test',
      ]);
    });

    it('bloco sem fechamento → extrai até o fim das linhas', () => {
      const body = `### Verificação automática
\`\`\`bash
cmd1
cmd2`;
      const result = parseVerifyCommands(body);
      expect(result).toEqual(['cmd1', 'cmd2']);
    });

    it('linhas vazias dentro do bloco são ignoradas', () => {
      const body = `### Verificação automática
\`\`\`bash
cmd1

cmd2

\`\`\``;
      const result = parseVerifyCommands(body);
      expect(result).toEqual(['cmd1', 'cmd2']);
    });

    it('bloco bash sem título anterior → não captura (precisa do título)', () => {
      const body = `\`\`\`bash
cmd1
cmd2
\`\`\``;
      const result = parseVerifyCommands(body);
      expect(result).toEqual([]);
    });

    it('título presente mas sem bloco bash após → [] ou fallback', () => {
      const body = `### Verificação automática
sem bloco aqui`;
      const result = parseVerifyCommands(body, 'pkg');
      expect(result).toEqual([
        'pnpm --filter pkg build',
        'pnpm --filter pkg test',
      ]);
    });

    it('fallbackPackage vazio string → []', () => {
      const body = 'Sem bloco';
      expect(parseVerifyCommands(body, '')).toEqual([]);
    });
  });
});
