import { describe, it, expect, afterEach } from 'vitest';
import {
  CommandAdapter,
  commandAdapterFromEnv,
  type AgentRole,
} from '../runner/agent-adapter.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

const ROLE_ENVS = {
  worker: 'NEXUS_AGENT_CMD_WORKER',
  reviewer: 'NEXUS_AGENT_CMD_REVIEWER',
  architect: 'NEXUS_AGENT_CMD_ARCHITECT',
};

afterEach(() => {
  for (const key of Object.values(ROLE_ENVS)) {
    delete process.env[key];
  }
});

describe('agent-adapter', () => {
  describe('CommandAdapter.run', () => {
    it('substitui placeholders {role} e {taskId}', async () => {
      const adapter = new CommandAdapter({
        templates: {
          worker: 'node -e "console.log(\'{role}:{taskId}\')"',
          reviewer: '',
          architect: '',
        },
      });
      const result = await adapter.run({
        role: 'worker',
        taskId: 'T-1',
        cwd: process.cwd(),
      });
      expect(result.exit).toBe(0);
      expect(result.timedOut).toBe(false);
      expect(result.tail).toContain('worker:T-1');
    });

    it('substitui placeholder {cwd}', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-adapter-test-'));
      try {
        const adapter = new CommandAdapter({
          templates: {
            worker: 'node -e "console.log(process.cwd())"',
            reviewer: '',
            architect: '',
          },
        });
        const result = await adapter.run({
          role: 'worker',
          taskId: 'T-2',
          cwd: tmpDir,
        });
        expect(result.exit).toBe(0);
        expect(result.tail).toContain(tmpDir);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('exit != 0 → devolvido no resultado, sem lancar', async () => {
      const adapter = new CommandAdapter({
        templates: {
          worker: 'node -e "process.exit(3)"',
          reviewer: '',
          architect: '',
        },
      });
      const result = await adapter.run({
        role: 'worker',
        taskId: 'T-3',
        cwd: process.cwd(),
      });
      expect(result.exit).toBe(3);
      expect(result.timedOut).toBe(false);
    });

    it('timeout mata o processo e devolve timedOut:true, exit:null', async () => {
      const adapter = new CommandAdapter({
        templates: {
          worker: 'node -e "setTimeout(()=>{},10000)"',
          reviewer: '',
          architect: '',
        },
      });
      const result = await adapter.run({
        role: 'worker',
        taskId: 'T-4',
        cwd: process.cwd(),
        timeoutMs: 200,
      });
      expect(result.timedOut).toBe(true);
      expect(result.exit).toBeNull();
    });

    it('env injetado → disponível no subprocesso', async () => {
      const adapter = new CommandAdapter({
        templates: {
          worker: 'node -e "console.log(process.env.FOO)"',
          reviewer: '',
          architect: '',
        },
      });
      const result = await adapter.run({
        role: 'worker',
        taskId: 'T-5',
        cwd: process.cwd(),
        env: { FOO: 'bar' },
      });
      expect(result.exit).toBe(0);
      expect(result.tail).toContain('bar');
    });

    it('env não substitui process.env inteiro (PATH ainda existe)', async () => {
      const adapter = new CommandAdapter({
        templates: {
          worker: 'node -e "console.log(process.env.PATH ? \'has-path\' : \'no-path\')"',
          reviewer: '',
          architect: '',
        },
      });
      const result = await adapter.run({
        role: 'worker',
        taskId: 'T-6',
        cwd: process.cwd(),
        env: { FOO: 'bar' },
      });
      expect(result.exit).toBe(0);
      expect(result.tail).toContain('has-path');
    });

    it('tail guarda só as últimas 40 linhas', async () => {
      const lines = Array.from({ length: 100 }, (_, i) => `console.log('line${i}');`).join(' ');
      const adapter = new CommandAdapter({
        templates: {
          worker: `node -e "${lines}"`,
          reviewer: '',
          architect: '',
        },
      });
      const result = await adapter.run({
        role: 'worker',
        taskId: 'T-7',
        cwd: process.cwd(),
      });
      expect(result.exit).toBe(0);
      const outLines = result.tail.trim().split('\n').filter(Boolean);
      expect(outLines.length).toBeLessThanOrEqual(40);
    });

    it('captura stdout e stderr no tail', async () => {
      const adapter = new CommandAdapter({
        templates: {
          worker: 'node -e "console.log(\'stdout-msg\'); console.error(\'stderr-msg\')"',
          reviewer: '',
          architect: '',
        },
      });
      const result = await adapter.run({
        role: 'worker',
        taskId: 'T-8',
        cwd: process.cwd(),
      });
      expect(result.exit).toBe(0);
      expect(result.tail).toContain('stdout-msg');
      expect(result.tail).toContain('stderr-msg');
    });

    it('stderr capturado mesmo em erro de execução', async () => {
      const adapter = new CommandAdapter({
        templates: {
          worker: 'node -e "console.error(\'erro-custom\'); process.exit(1)"',
          reviewer: '',
          architect: '',
        },
      });
      const result = await adapter.run({
        role: 'worker',
        taskId: 'T-9',
        cwd: process.cwd(),
        timeoutMs: 10000,
      });
      expect(result.exit).toBe(1);
      expect(result.tail).toContain('erro-custom');
    });

    it('papel sem template → lança Error claro', async () => {
      const adapter = new CommandAdapter({
        templates: {
          worker: '',
          reviewer: 'node -e "process.exit(0)"',
          architect: '',
        },
      });
      await expect(
        adapter.run({
          role: 'worker',
          taskId: 'T-10',
          cwd: process.cwd(),
        }),
      ).rejects.toThrow(/nenhum template definido para o papel 'worker'/i);
    });
  });

  describe('commandAdapterFromEnv', () => {
    it('papel sem env definido → run lança Error claro', async () => {
      // nenhuma env setada
      const adapter = commandAdapterFromEnv();
      await expect(
        adapter.run({
          role: 'worker',
          taskId: 'T-11',
          cwd: process.cwd(),
        }),
      ).rejects.toThrow(/nenhum template definido para o papel 'worker'/i);
    });

    it('papel com env definido → executa com sucesso', async () => {
      process.env.NEXUS_AGENT_CMD_WORKER = 'node -e "console.log(\'from-env:{role}\')"';
      const adapter = commandAdapterFromEnv();
      const result = await adapter.run({
        role: 'worker',
        taskId: 'T-12',
        cwd: process.cwd(),
      });
      expect(result.exit).toBe(0);
      expect(result.tail).toContain('from-env:worker');
    });

    it('lê templates para múltiplos papéis do env', async () => {
      process.env.NEXUS_AGENT_CMD_WORKER = 'node -e "console.log(\'wk\')"';
      process.env.NEXUS_AGENT_CMD_REVIEWER = 'node -e "console.log(\'rv\')"';
      const adapter = commandAdapterFromEnv();

      const wk = await adapter.run({
        role: 'worker',
        taskId: 'T-13',
        cwd: process.cwd(),
      });
      expect(wk.tail).toContain('wk');

      const rv = await adapter.run({
        role: 'reviewer',
        taskId: 'T-13',
        cwd: process.cwd(),
      });
      expect(rv.tail).toContain('rv');
    });
  });
});
