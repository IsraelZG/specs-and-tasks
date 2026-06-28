/**
 * Headroom Compressor Client
 * Interacts with the local Headroom service.
 */
const HEADROOM_API_URL = process.env.HEADROOM_API_URL || 'http://127.0.0.1:8080';

export class HeadroomClient {
  static async compressContext(text: string, contextWindow: number = 2000): Promise<string> {
    try {
      console.error(`[Headroom] Compressing payload of size ${text.length}...`);
      const response = await fetch(`${HEADROOM_API_URL}/compress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, contextWindow }),
      });
      if (!response.ok) {
        throw new Error(`Headroom compression error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.compressedText;
    } catch (error) {
      console.warn(`[Headroom] Failed to reach service at ${HEADROOM_API_URL}. Returning uncompressed.`);
      return text;
    }
  }
}
