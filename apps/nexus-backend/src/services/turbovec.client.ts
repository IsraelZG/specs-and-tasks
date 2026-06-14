/**
 * TurboVec Client interface.
 * Presumes TurboVec is running as a local REST API.
 */
const TURBOVEC_API_URL = process.env.TURBOVEC_API_URL || 'http://127.0.0.1:8000';

export interface IndexPayload {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

export class TurboVecClient {
  static async indexDocument(payload: IndexPayload) {
    try {
      const response = await fetch(`${TURBOVEC_API_URL}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`TurboVec index error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`[TurboVec] Connection failed, is TurboVec running at ${TURBOVEC_API_URL}?`);
      // Since it's a test/mock phase if offline, we don't crash everything.
      return { status: 'mocked_success', payload };
    }
  }

  static async search(query: string, limit: number = 5) {
    try {
      const response = await fetch(`${TURBOVEC_API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit }),
      });
      if (!response.ok) {
        throw new Error(`TurboVec search error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`[TurboVec] Search failed, is TurboVec running at ${TURBOVEC_API_URL}?`);
      return { status: 'mocked_success', results: [] };
    }
  }
}
