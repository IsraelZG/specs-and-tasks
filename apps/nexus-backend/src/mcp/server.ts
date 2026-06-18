import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TaskService } from '../services/task.service.js';
import { TaskController } from '../services/task.controller.js';
import { TASK_TOOL_DEFS, TASK_TOOL_NAMES, handleTaskTool } from './task-tools.js';
import { buildExport } from '../services/export.service.js';
import { getCompressor } from '../services/compressor.js';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const EXPORT_TOOL_DEFS = [
  {
    name: 'nexus_build_export',
    description: 'Selects relevant docs by slugs/tags, expands via wikilinks up to depth, and returns a compressed artifact + original sections for local recovery.',
    inputSchema: {
      type: 'object',
      properties: {
        slugs: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        depth: { type: 'number', description: 'Expansion depth via wikilinks (default 1)' },
      },
    },
  },
] as const;

const EXPORT_TOOL_NAMES = new Set<string>(EXPORT_TOOL_DEFS.map((t) => t.name));

const execPromise = util.promisify(exec);

// Raiz do repositório (dist/mcp/server.js → ../../../../ = raiz). Sobreponível por env (testes/deploy).
const TASK_ROOT_DIR = process.env.NEXUS_ROOT_DIR ?? path.resolve(__dirname, '../../../../');
const taskController = new TaskController(new TaskService({ rootDir: TASK_ROOT_DIR }));

const mcpServer = new Server({
  name: "nexus-hub-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  }
});

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "nexus_compress_text",
        description: "Comprime um texto via Headroom (proxy) ou fallback passthrough. Útil para encurtar descrições de skills/agents ou qualquer contexto antes de enviar a uma LLM.",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string" }
          },
          required: ["text"]
        }
      },
      {
        name: "nexus_run_safe_script",
        description: "Executes a pre-approved script from the task repository.",
        inputSchema: {
          type: "object",
          properties: {
            scriptId: { type: "string" }
          },
          required: ["scriptId"]
        }
      },
      ...TASK_TOOL_DEFS,
      ...EXPORT_TOOL_DEFS,
    ]
  };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "nexus_compress_text") {
    const text = String(request.params.arguments?.text ?? '');
    const result = await getCompressor().compress(text);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }

  if (request.params.name === "nexus_run_safe_script") {
    const scriptId = String(request.params.arguments?.scriptId);

    try {
      // Security: Only allow specific known commands or scripts in the root package.json
      // To keep it safe, we'll prefix it with pnpm run and execute in root dir
      if (/[^a-zA-Z0-9_-]/.test(scriptId)) {
        throw new Error("Invalid script ID format. Only alphanumeric characters allowed.");
      }
      
      const rootDir = path.resolve(__dirname, '../../../../');
      const { stdout, stderr } = await execPromise(`pnpm run ${scriptId}`, { cwd: rootDir });

      return {
        content: [{ type: "text", text: `Success:\n${stdout}\n\nErrors (if any):\n${stderr}` }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Execution Failed:\n${error.message}` }]
      };
    }
  }

  // task tools — delegam ao mesmo TaskController do REST (paridade garantida)
  if (TASK_TOOL_NAMES.has(request.params.name)) {
    const r = await handleTaskTool(
      taskController,
      request.params.name,
      (request.params.arguments ?? {}) as Record<string, unknown>,
    );
    // Retorna literal para casar com a união de ServerResult do SDK.
    return r.isError ? { content: r.content, isError: true } : { content: r.content };
  }

  // export tool
  if (EXPORT_TOOL_NAMES.has(request.params.name)) {
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    try {
      const result = await buildExport(
        { slugs: args.slugs as string[] | undefined, tags: args.tags as string[] | undefined },
        { rootDir: TASK_ROOT_DIR, depth: args.depth as number | undefined },
      );
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }

  throw new Error("Tool not found");
});

export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('[MCP] Nexus Hub MCP Server running on stdio');
}
