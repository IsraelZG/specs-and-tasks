/**
 * EpochDB Client
 * Lossless agentic memory engine interface for multi-hop retrieval.
 */
const EPOCHDB_API_URL = process.env.EPOCHDB_API_URL || 'http://127.0.0.1:8090';

export interface AgentInteraction {
  agentId: string;
  action: string;
  query?: string;
  resultSize?: number;
  timestamp: string;
}

export class EpochDBClient {
  static async logInteraction(interaction: AgentInteraction) {
    try {
      console.error(`[EpochDB] Archiving interaction [${interaction.action}] for agent ${interaction.agentId}...`);
      const response = await fetch(`${EPOCHDB_API_URL}/memory/append`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interaction),
      });
      if (!response.ok) {
        throw new Error(`EpochDB logging error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      // Non-blocking fail-safe
      console.warn(`[EpochDB] Memory engine unreachable at ${EPOCHDB_API_URL}. Memory not persisted.`);
    }
  }

  static async retrieveMemory(agentId: string, limit: number = 10) {
    try {
      const response = await fetch(`${EPOCHDB_API_URL}/memory/retrieve?agentId=${agentId}&limit=${limit}`);
      if (!response.ok) throw new Error('Retrieve error');
      return await response.json();
    } catch (error) {
      return { status: 'mock', memory: [] };
    }
  }
}
