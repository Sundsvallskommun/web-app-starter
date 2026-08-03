import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { closeRedisClient, destroyRedisClient, getRedisClient, isRedisReady } from './redis';

const redisMocks = vi.hoisted(() => ({
  createClient: vi.fn<(options: unknown) => unknown>(),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  redisConfig: {
    enabled: false,
    host: 'redis.internal',
    keyPrefix: 'web-app-starter',
    port: 6379,
  },
}));

vi.mock('@config', () => ({ REDIS_CONFIG: redisMocks.redisConfig }));
vi.mock('redis', () => ({ createClient: redisMocks.createClient }));
vi.mock('./logger', () => ({ logger: redisMocks.logger }));

function createClientStub() {
  const close = vi.fn<() => Promise<void>>();
  const connect = vi.fn<() => Promise<void>>();
  const destroy = vi.fn<() => void>();
  const on = vi.fn<(event: string, listener: (...arguments_: unknown[]) => void) => unknown>();
  const client = {
    close,
    connect,
    destroy,
    emit(event: string): void {
      for (const [registeredEvent, listener] of on.mock.calls) {
        if (registeredEvent === event) {
          listener();
        }
      }
    },
    isOpen: true,
    isReady: true,
    on,
  };

  close.mockResolvedValue(undefined);
  connect.mockImplementation(() => {
    client.emit('ready');
    return Promise.resolve();
  });
  on.mockReturnValue(client);

  return client;
}

describe('Redis client lifecycle', () => {
  beforeEach(() => {
    redisMocks.redisConfig.enabled = false;
    redisMocks.redisConfig.host = 'redis.internal';
    redisMocks.redisConfig.port = 6379;
    redisMocks.createClient.mockReset();
    redisMocks.logger.warn.mockReset();
  });

  afterEach(async () => {
    await closeRedisClient();
  });

  it('does not create a client when Redis is not configured', async () => {
    await expect(getRedisClient()).resolves.toBeNull();
    expect(isRedisReady()).toBe(true);
    expect(redisMocks.createClient).not.toHaveBeenCalled();
  });

  it('shares one bounded startup connection and keeps runtime reconnects enabled after readiness', async () => {
    redisMocks.redisConfig.enabled = true;
    redisMocks.redisConfig.port = 6380;
    const client = createClientStub();
    let resolveConnection: (() => void) | undefined;
    client.connect.mockReturnValue(
      new Promise<void>(resolve => {
        resolveConnection = resolve;
      }),
    );
    redisMocks.createClient.mockReturnValue(client);

    const firstConnection = getRedisClient();
    const secondConnection = getRedisClient();
    let secondConnectionSettled = false;
    void secondConnection.finally(() => {
      secondConnectionSettled = true;
    });

    await Promise.resolve();

    expect(redisMocks.createClient).toHaveBeenCalledOnce();
    expect(secondConnectionSettled).toBe(false);
    const createClientOptions = redisMocks.createClient.mock.calls[0]?.[0];
    expect(createClientOptions).toMatchObject({
      disableOfflineQueue: true,
      socket: {
        connectTimeout: 10_000,
        host: 'redis.internal',
        port: 6380,
      },
    });
    const reconnectStrategy = (createClientOptions as { socket: { reconnectStrategy: (retries: number) => number | Error } }).socket
      .reconnectStrategy;
    expect(reconnectStrategy(5)).toBeInstanceOf(Error);

    client.emit('ready');
    resolveConnection?.();

    await expect(Promise.all([firstConnection, secondConnection])).resolves.toEqual([client, client]);
    expect(isRedisReady()).toBe(true);
    expect(reconnectStrategy(100)).toBe(3_000);
  });

  it('destroys a failed client and allows a later connection attempt', async () => {
    redisMocks.redisConfig.enabled = true;
    const failedClient = createClientStub();
    failedClient.connect.mockRejectedValue(new Error('connection refused'));
    const recoveredClient = createClientStub();
    redisMocks.createClient.mockReturnValueOnce(failedClient).mockReturnValueOnce(recoveredClient);

    await expect(getRedisClient()).rejects.toThrow('Unable to connect to configured Redis: connection refused');
    expect(failedClient.destroy).toHaveBeenCalledOnce();
    await expect(getRedisClient()).resolves.toBe(recoveredClient);
    expect(redisMocks.createClient).toHaveBeenCalledTimes(2);
  });

  it('preserves the shared client identity when reconnecting after a runtime outage', async () => {
    redisMocks.redisConfig.enabled = true;
    const client = createClientStub();
    redisMocks.createClient.mockReturnValue(client);

    await expect(getRedisClient()).resolves.toBe(client);
    client.isOpen = false;
    client.isReady = false;
    expect(isRedisReady()).toBe(false);

    await expect(getRedisClient()).resolves.toBe(client);
    expect(redisMocks.createClient).toHaveBeenCalledOnce();
    expect(client.connect).toHaveBeenCalledTimes(2);
  });

  it('does not let cleanup failure mask the original connection error', async () => {
    redisMocks.redisConfig.enabled = true;
    const client = createClientStub();
    const connectionError = new Error('connection refused');
    client.connect.mockRejectedValue(connectionError);
    client.destroy.mockImplementation(() => {
      throw new Error('destroy failed');
    });
    redisMocks.createClient.mockReturnValue(client);

    await expect(getRedisClient()).rejects.toMatchObject({
      cause: connectionError,
      message: 'Unable to connect to configured Redis: connection refused',
      name: 'RedisConnectionError',
    });
    expect(redisMocks.logger.warn).toHaveBeenCalledWith('Failed to destroy the Redis client after a connection error: destroy failed');
  });

  it('closes the connected client during graceful shutdown', async () => {
    redisMocks.redisConfig.enabled = true;
    const client = createClientStub();
    redisMocks.createClient.mockReturnValue(client);

    await getRedisClient();
    await closeRedisClient();

    expect(client.close).toHaveBeenCalledOnce();
  });

  it('destroys the shared client when graceful shutdown exceeds its deadline', async () => {
    redisMocks.redisConfig.enabled = true;
    const client = createClientStub();
    redisMocks.createClient.mockReturnValue(client);

    await getRedisClient();
    destroyRedisClient();

    expect(client.destroy).toHaveBeenCalledOnce();
    expect(isRedisReady()).toBe(false);
  });
});
