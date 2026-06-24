export { resolveAdminToken } from './adminToken.js';
export {
  mountHealthRoute,
  mountAdminRoutes,
  mountSeedRoute,
} from './admin.js';
export {
  initControlRelay,
  relayCommand,
  RelayNotFoundError,
  RelayTimeoutError,
} from './controlRelay.js';
export { createApp } from './server.js';
export type { ClientRegistry } from './types.js';

export const VERSION = "0.0.1";
