import type { PeerId } from './peerId.js';
export type { PeerId };

/** Dado serializado na rede. Formato concreto definido em T-201 (wire format). */
export type WireData = Uint8Array;

/** Callback invocado quando chega mensagem de um peer. */
export type MessageHandler = (peerId: PeerId, data: WireData) => void;

/**
 * Porta de adaptador de rede.
 * Contrato para conectar, ouvir, enviar e receber dados em rede P2P.
 * @remarks Isomórfico (funciona em Node.js e browser via adaptador concreto).
 */
export interface NetworkAdapterPort {
  /** Conecta a um peer remoto. Resolve quando a conexão estiver estabelecida. */
  connect(peerId: PeerId): Promise<void>;
  /** Habilita escuta por conexões entrantes. Resolve quando estiver escutando. */
  listen(): Promise<void>;
  /** Envia dados para um peer conectado. */
  send(peerId: PeerId, data: WireData): Promise<void>;
  /**
   * Registra callback para mensagens recebidas.
   * Suporta múltiplos handlers simultâneos (broadcast — nenhum handler rouba a mensagem do outro).
   * @returns função de unsubscribe para remover **apenas** este handler.
   * @remarks Chamar a função de unsubscribe duas vezes é idempotente.
   */
  onMessage(handler: MessageHandler): () => void;
  /** Encerra conexão e libera recursos. */
  close(): Promise<void>;
}

/** Resultado de execução SQL. Esquema concreto definido em T-106 (schema nodes/edges). */
export type SqlRow = Record<string, unknown>;
export type SqlParams = unknown[];

/**
 * Porta de armazenamento SQL.
 * Contrato para execução de queries, transações e migrações.
 * @remarks Isomórfico — depende de adaptador concreto (SQLite, Postgres, etc.).
 */
export interface StoragePort {
  /** Executa SQL e retorna linhas. */
  exec(sql: string, params?: SqlParams): Promise<SqlRow[]>;
  /** Roda callback dentro de transação. Se lançar, faz rollback. */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  /** Aplica migrações pendentes. Idempotente. */
  migrate(migrations: Array<{ version: number; sql: string }>): Promise<void>;
}

/**
 * Porta de relógio.
 * @remarks O valor de `now()` deve ser monotônico (não pode regredir na mesma sessão).
 * Isomórfico.
 */
export interface ClockPort {
  now(): number;
}

/**
 * Porta de geração aleatória criptograficamente segura.
 * @remarks Isomórfico (delega a `crypto.getRandomValues` no browser, `crypto.randomBytes` no Node).
 */
export interface RandomPort {
  bytes(length: number): Uint8Array;
}

/** Níveis de log progressivos. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Porta de logger estruturado.
 * @remarks Isomórfico. Adaptadores concretos definem o sink (console, arquivo, serviço externo).
 */
export interface LoggerPort {
  log(level: LogLevel, message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
