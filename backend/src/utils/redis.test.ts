import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { closeRedisClient, getRedisClient } from './redis';

const redisMocks = vi.hoisted(() => ({
  createClient: vi.fn<(options: unknown) => unknown>(),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
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
    isOpen: true,
    on,
  };

  close.mockResolvedValue(undefined);
  connect.mockResolvedValue(undefined);
  on.mockReturnValue(client);

  return client;
}

describe('Redis client lifecycle', () => {
  beforeEach(() => {
    redisMocks.redisConfig.enabled = false;
    redisMocks.redisConfig.host = 'redis.internal';
    redisMocks.redisConfig.port = 6379;
    redisMocks.createClient.mockReset();
  });

  afterEach(async () => {
    await closeRedisClient();
  });

  it('does not create a client when Redis is not configured', async () => {
    await expect(getRedisClient()).resolves.toBeNull();
    expect(redisMocks.createClient).not.toHaveBeenCalled();
  });

  it('shares one in-flight connection between concurrent callers', async () => {
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

    expect(redisMocks.createClient).toHaveBeenCalledOnce();
    const createClientOptions = redisMocks.createClient.mock.calls[0]?.[0];
    expect(createClientOptions).toMatchObject({
      socket: {
        connectTimeout: 10_000,
        host: 'redis.internal',
        port: 6380,
      },
    });

    resolveConnection?.();

    await expect(Promise.all([firstConnection, secondConnection])).resolves.toEqual([client, client]);
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

  it('replaces a client that has closed after exhausting reconnect attempts', async () => {
    redisMocks.redisConfig.enabled = true;
    const closedClient = createClientStub();
    const replacementClient = createClientStub();
    redisMocks.createClient.mockReturnValueOnce(closedClient).mockReturnValueOnce(replacementClient);

    await expect(getRedisClient()).resolves.toBe(closedClient);
    closedClient.isOpen = false;

    await expect(getRedisClient()).resolves.toBe(replacementClient);
    expect(redisMocks.createClient).toHaveBeenCalledTimes(2);
  });

  it('closes the connected client during graceful shutdown', async () => {
    redisMocks.redisConfig.enabled = true;
    const client = createClientStub();
    redisMocks.createClient.mockReturnValue(client);

    await getRedisClient();
    await closeRedisClient();

    expect(client.close).toHaveBeenCalledOnce();
  });
});
