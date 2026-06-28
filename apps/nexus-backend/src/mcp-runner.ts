import { startMcpServer } from './mcp/server.js';

startMcpServer().catch((error) => {
  console.error('[MCP Runner] Error starting MCP server:', error);
  process.exit(1);
});
