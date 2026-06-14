import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { routeIntent } from '../services/router.js';
import { TurboVecClient } from '../services/turbovec.client.js';
import { HeadroomClient } from '../services/headroom.client.js';
import { EpochDBClient } from '../services/epochdb.client.js';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

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
        name: "nexus_read_context",
        description: "Searches for project context and returns a compressed summary using LLM intent routing and Headroom.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          required: ["query"]
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
      }
    ]
  };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const agentId = 'mcp-client';

  if (request.params.name === "nexus_read_context") {
    const query = String(request.params.arguments?.query);
    
    // Log to EpochDB
    EpochDBClient.logInteraction({
      agentId,
      action: 'nexus_read_context',
      query,
      timestamp: new Date().toISOString()
    });
    
    // 1. Semantic Routing
    const keywords = await routeIntent(query);
    
    // 2. Fetch from TurboVec
    const searchResults = await TurboVecClient.search(keywords.join(' '));
    const rawContext = searchResults.results ? searchResults.results.map((r: any) => r.content).join('\n\n') : 'Mock Content';
    
    // 3. Compress with Headroom
    const compressedContext = await HeadroomClient.compressContext(rawContext);
    
    EpochDBClient.logInteraction({
      agentId,
      action: 'nexus_read_context_completed',
      resultSize: compressedContext.length,
      timestamp: new Date().toISOString()
    });
    
    return {
      content: [{ type: "text", text: compressedContext }]
    };
  }

  if (request.params.name === "nexus_run_safe_script") {
    const scriptId = String(request.params.arguments?.scriptId);
    
    EpochDBClient.logInteraction({
      agentId,
      action: 'nexus_run_safe_script',
      query: scriptId,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Security: Only allow specific known commands or scripts in the root package.json
      // To keep it safe, we'll prefix it with pnpm run and execute in root dir
      if (/[^a-zA-Z0-9_-]/.test(scriptId)) {
        throw new Error("Invalid script ID format. Only alphanumeric characters allowed.");
      }
      
      const rootDir = path.resolve(__dirname, '../../../../');
      const { stdout, stderr } = await execPromise(`pnpm run ${scriptId}`, { cwd: rootDir });
      
      EpochDBClient.logInteraction({
        agentId,
        action: 'nexus_run_safe_script_completed',
        resultSize: stdout.length,
        timestamp: new Date().toISOString()
      });

      return {
        content: [{ type: "text", text: `Success:\n${stdout}\n\nErrors (if any):\n${stderr}` }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Execution Failed:\n${error.message}` }]
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
