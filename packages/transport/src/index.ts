export const VERSION = "0.0.1";

export { initiateNoiseXX, respondNoiseXX, NoiseHandshakeError } from './noiseHandshake.js';
export type { NoiseHandshakeResult, Ed25519Keypair, NoiseFailureReason } from './noiseHandshake.js';

export { acceptNoiseXX, NoiseServer } from './noiseServer.js';
export type { NoiseServerOptions } from './noiseServer.js';
