import type { WebSocket } from 'ws';

/** Par (clientId efêmero → WebSocket ativo) para roteamento de relay. */
export type ClientRegistry = Map<string, WebSocket>;
