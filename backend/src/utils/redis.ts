import { REDIS_CONFIG } from '@config';
import { createClient } from 'redis';

import { logger } from './logger';

export type RedisClient = ReturnType<typeof createClient>;

const REDIS_CONNECT_TIMEOUT_MS = 10_000;
const REDIS_MAX_RECONNECT_ATTEMPTS = 5;

let redisClient: RedisClient | null = null;
let redisConnection: Promise<RedisClient> | null = null;

class RedisConnectionError extends Error {
  public readonly cause: unknown;

  public constructor(cause: unknown) {
    super(`Unable to connect to configured Redis: ${errorMessage(cause)}`);
    this.name = 'RedisConnectionError';
    this.cause = cause;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function reconnectStrategy(retries: number): number | Error {
  if (retries >= REDIS_MAX_RECONNECT_ATTEMPTS) {
    return new Error(`Redis reconnect attempts exhausted after ${retries} retries`);
  }

  return Math.min(retries * 100, 3_000);
}

function createConfiguredClient(): RedisClient {
  if (!REDIS_CONFIG.enabled) {
    throw new Error('Cannot create a Redis client without Redis configuration');
  }

  const { host, password, port } = REDIS_CONFIG;
  const client = createClient({
    socket: {
      host,
      port,
      connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
      reconnectStrategy,
    },
    ...(password ? { password } : {}),
  });

  client.on('error', (error: unknown) => logger.error(`Redis error: ${errorMessage(error)}`));
  client.on('connect', () => logger.info(`Connected to Redis (${host}:${port})`));
  client.on('reconnecting', () => logger.info('Redis reconnecting'));

  return client;
}

async function connectRedis(): Promise<RedisClient> {
  const client = createConfiguredClient();

  try {
    await client.connect();
    redisClient = client;
    return client;
  } catch (error: unknown) {
    client.destroy();
    throw new RedisConnectionError(error);
  }
}

/**
 * Returns the single shared Redis client. When Redis is configured, all concurrent
 * callers await the same connection attempt and connection failures are propagated.
 * A null result therefore only means that Redis is deliberately not configured.
 */
export async function getRedisClient(): Promise<RedisClient | null> {
  if (!REDIS_CONFIG.enabled) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  redisClient = null;

  if (redisConnection) {
    return redisConnection;
  }

  const connection = connectRedis();
  redisConnection = connection;

  try {
    return await connection;
  } finally {
    if (redisConnection === connection) {
      redisConnection = null;
    }
  }
}

export async function closeRedisClient(): Promise<void> {
  let client = redisClient;

  if (!client && redisConnection) {
    try {
      client = await redisConnection;
    } catch {
      return;
    }
  }

  redisClient = null;

  if (client?.isOpen) {
    await client.close();
  }
}
