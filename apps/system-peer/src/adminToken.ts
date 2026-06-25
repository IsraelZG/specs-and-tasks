import { randomBytes } from 'node:crypto';

/**
 * Retorna o ADMIN_TOKEN do ambiente ou gera um novo (32 bytes hex).
 * Imprime no console para registro. Nunca expor ao browser.
 */
export function resolveAdminToken(): string {
  const token = process.env['ADMIN_TOKEN'] ?? randomBytes(32).toString('hex');
  console.log('[system-peer] ADMIN_TOKEN:', token);
  return token;
}
