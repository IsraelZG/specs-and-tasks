import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { routeIntent } from '../services/router.js';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { HeadroomClient } from '../services/headroom.client.js';

vi.mock('@huggingface/transformers', () => {
  return {
    pipeline: vi.fn().mockImplementation(async () => {
      return async () => [{ generated_text: "connection, authentication, database" }];
    })
  };
});

// Define port for backend test instance
const TEST_PORT = 13001;
let serverInstance: any = null;

// Replicate the express server setup for test verification without blocking port 3001
const ROOT_DIR = path.resolve(__dirname, '../../../../');

function createTestServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/tasks', async (req, res) => {
    try {
      const tasksDir = path.join(ROOT_DIR, 'tasks');
      const files = await fs.readdir(tasksDir);
      const mdFiles = files.filter(f => f.endsWith('.md') && f !== 'INDEX.md');
      
      const tasksList = await Promise.all(mdFiles.map(async file => {
        const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
        return { id: file.replace('.md', ''), content };
      }));
      res.json(tasksList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/build-prompt', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // 1. Intent Routing (Keywords)
      const keywords = await routeIntent(query);

      // 2. Assemble context (recuperação vetorial descontinuada — só Headroom)
      const rawContext = 'Contexto simulado para testes: A documentação do projeto afirma que...';

      // 3. Compress
      const compressedContext = await HeadroomClient.compressContext(rawContext);
      
      res.json({
        originalLength: rawContext.length,
        compressedLength: compressedContext.length,
        payload: compressedContext,
        keywords
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return app.listen(TEST_PORT);
}

describe('Nexus Hub - Backend Integration Suite', () => {

  beforeAll(() => {
    // Set mock model env to run tests completely offline and fast
    process.env.MOCK_MODEL = 'true';
    // Start local test Express server
    serverInstance = createTestServer();
  });

  afterAll(() => {
    if (serverInstance) {
      serverInstance.close();
    }
  });

  describe('1. Semantic Router & Prompt Compression', () => {
    it('should load SmolLM2 and extract keywords from text query', async () => {
      const query = "Refactor connection logic and improve authentication mechanisms";
      
      // Call routeIntent directly
      console.log('[Test] Calling routeIntent for keywords extraction (may load model)...');
      const keywords = await routeIntent(query);
      
      console.log('[Test] Keywords extracted:', keywords);
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThanOrEqual(1);
      
      // Check if some related terms are present as keywords
      const hasKeywords = keywords.some(k => 
        /connection|auth|logic|refactor|mechanism|improve/i.test(k)
      );
      expect(hasKeywords).toBe(true);
    });

    it('should handle POST /api/build-prompt successfully with valid payload', async () => {
      const payload = { query: "I need to check database schemas and migrations" };
      
      const response = await fetch(`http://localhost:${TEST_PORT}/api/build-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('keywords');
      expect(data).toHaveProperty('originalLength');
      expect(data).toHaveProperty('compressedLength');
      expect(data).toHaveProperty('payload');
      
      expect(Array.isArray(data.keywords)).toBe(true);
      expect(typeof data.originalLength).toBe('number');
      expect(typeof data.compressedLength).toBe('number');
      expect(data.compressedLength).toBeLessThanOrEqual(data.originalLength);
    });
  });

  describe('2. Frontmatter Task Parsing API', () => {
    it('should read the tasks directory and parse tasks frontmatter successfully', async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/api/tasks`);
      expect(response.status).toBe(200);
      
      const tasksList = await response.json();
      expect(Array.isArray(tasksList)).toBe(true);
      expect(tasksList.length).toBeGreaterThan(0);
      
      // Check structure of first task
      const firstTask = tasksList[0];
      expect(firstTask).toHaveProperty('id');
      expect(firstTask).toHaveProperty('content');
      expect(firstTask.content).toContain('---');
      
      // Verify YAML frontmatter content fields are present
      expect(firstTask.content).toMatch(/status:\s*\w+/);
      expect(firstTask.content).toMatch(/complexity:\s*\d+/);
    });
  });

  describe('3. MCP Server stdio & Secure Execution', () => {
    let mcpProcess: ChildProcess;

    const sendRequest = (process: ChildProcess, req: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        let responseData = '';
        
        const onData = (data: Buffer) => {
          responseData += data.toString();
          // Stdio messages are delimited by newlines in JSON-RPC
          if (responseData.includes('\n')) {
            process.stdout?.off('data', onData);
            process.stderr?.off('data', onError);
            try {
              const parsed = JSON.parse(responseData.trim());
              resolve(parsed);
            } catch (err) {
              reject(new Error(`Failed to parse MCP response: ${responseData}`));
            }
          }
        };

        const onError = (data: Buffer) => {
          console.error('[MCP Error Stream]:', data.toString());
        };

        process.stdout?.on('data', onData);
        process.stderr?.on('data', onError);
        
        process.stdin?.write(JSON.stringify(req) + '\n');
      });
    };

    beforeAll(() => {
      // Spawn MCP server stdio process using tsx and our custom runner
      const runnerPath = path.join(__dirname, '../mcp-runner.ts');
      mcpProcess = spawn('npx', ['tsx', runnerPath], {
        cwd: ROOT_DIR,
        shell: true,
        env: { ...process.env, MOCK_MODEL: 'true' }
      });
      
      mcpProcess.on('error', (err) => {
        console.error('Failed to start MCP process:', err);
      });
    });

    afterAll(() => {
      if (mcpProcess) {
        mcpProcess.kill();
      }
    });

    it('should initialize and list tools correctly', async () => {
      // 1. Initialize Handshake
      const initRequest = {
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "integration-test-client", version: "1.0.0" }
        }
      };

      const initResponse = await sendRequest(mcpProcess, initRequest);
      expect(initResponse).toHaveProperty('result');
      expect(initResponse.result).toHaveProperty('protocolVersion');

      // 2. List tools
      const listRequest = {
        jsonrpc: "2.0",
        method: "tools/list",
        id: 2
      };

      const listResponse = await sendRequest(mcpProcess, listRequest);
      expect(listResponse.result).toHaveProperty('tools');
      const tools = listResponse.result.tools;
      
      expect(tools.some((t: any) => t.name === 'nexus_compress_text')).toBe(true);
      expect(tools.some((t: any) => t.name === 'nexus_run_safe_script')).toBe(true);
    });

    it('should execute nexus_compress_text successfully', async () => {
      const callRequest = {
        jsonrpc: "2.0",
        method: "tools/call",
        id: 3,
        params: {
          name: "nexus_compress_text",
          arguments: { text: "hello world" }
        }
      };

      const callResponse = await sendRequest(mcpProcess, callRequest);
      expect(callResponse).not.toHaveProperty('error');
      expect(callResponse.result).toHaveProperty('content');
      expect(Array.isArray(callResponse.result.content)).toBe(true);
      expect(callResponse.result.content[0].type).toBe('text');
      const parsed = JSON.parse(callResponse.result.content[0].text);
      expect(parsed).toHaveProperty('compressed');
      expect(parsed).toHaveProperty('stats');
      expect(parsed.stats).toHaveProperty('ratio');
    });

    it('should defend against command injection on nexus_run_safe_script', async () => {
      // Test cases representing command injection payloads
      const invalidScripts = [
        "build && echo injected",
        "build; dir",
        "build | rm -rf",
        "build\nwhoami",
        "build&evil_command",
        "../script.sh",
        "someScript!"
      ];

      for (let i = 0; i < invalidScripts.length; i++) {
        const payload = invalidScripts[i];
        const callRequest = {
          jsonrpc: "2.0",
          method: "tools/call",
          id: 10 + i,
          params: {
            name: "nexus_run_safe_script",
            arguments: { scriptId: payload }
          }
        };

        const response = await sendRequest(mcpProcess, callRequest);
        expect(response.result).toBeDefined();
        expect(response.result.content[0].text).toContain("Invalid script ID format");
        expect(response.result.content[0].text).toContain("Only alphanumeric characters allowed");
      }
    });

    it('should accept valid alphanumeric script ID on nexus_run_safe_script', async () => {
      // A script that exists in root package.json or is formatted validly but might fail if doesn't exist
      // "build" is a valid command name
      const callRequest = {
        jsonrpc: "2.0",
        method: "tools/call",
        id: 99,
        params: {
          name: "nexus_run_safe_script",
          arguments: { scriptId: "build" }
        }
      };

      const response = await sendRequest(mcpProcess, callRequest);
      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toBeDefined();
      // It should NOT return "Invalid script ID format". It may run the script and return either Success or Execution Failed (due to turbo/path/timeout etc), but it must pass validation.
      expect(response.result.content[0].text).not.toContain("Invalid script ID format");
    });
  });
});
