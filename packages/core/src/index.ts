export { MIGRATIONS, migrateSchema } from './schema';
export type { Migration } from './schema';

export { HybridLogicalClock, MAX_DRIFT_MS } from './hlc';
export type { HLCTimestamp, HLCParts } from './hlc';

export const VERSION = "0.0.1";
