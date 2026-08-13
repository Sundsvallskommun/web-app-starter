import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RedisClient } from './redis';
import { createSessionStore } from './session-store';

const storeMocks = vi.hoisted(() => {
  const fileStoreOptions: unknown[] = [];
  const redisStoreOptions: unknown[] = [];

  function FileStoreStub(options: unknown): void {
    fileStoreOptions.push(options);
  }

  function RedisStoreStub(options: unknown): void {
    redisStoreOptions.push(options);
  }

  return {
    createFileStore: vi.fn(() => FileStoreStub),
    fileStoreOptions,
    getRedisClient: vi.fn<() => Promise<RedisClient | null>>(),
    redisConfig: {
      enabled: false,
      host: 'redis.internal',
      keyPrefix: 'web-app-starter',
      port: 6379,
    },
    redisStoreOptions,
    RedisStoreStub,
  };
});

vi.mock('@config', () => ({ REDIS_CONFIG: storeMocks.redisConfig, SESSION_MAX_AGE_MS: 12 * 60 * 60 * 1000 }));
vi.mock('connect-redis', () => ({ RedisStore: storeMocks.RedisStoreStub }));
vi.mock('session-file-store', () => ({ default: storeMocks.createFileStore }));
vi.mock('./logger', () => ({ logger: { info: vi.fn() } }));
vi.mock('./redis', () => ({ getRedisClient: storeMocks.getRedisClient }));

describe('createSessionStore', () => {
  beforeEach(() => {
    storeMocks.redisConfig.enabled = false;
    storeMocks.createFileStore.mockClear();
    storeMocks.fileStoreOptions.length = 0;
    storeMocks.getRedisClient.mockReset();
    storeMocks.redisStoreOptions.length = 0;
  });

  it('uses the local file store only when Redis is deliberately not configured', async () => {
    await createSessionStore();

    expect(storeMocks.getRedisClient).not.toHaveBeenCalled();
    expect(storeMocks.createFileStore).toHaveBeenCalledOnce();
    expect(storeMocks.fileStoreOptions).toEqual([{ path: './data/sessions', ttl: 43200 }]);
  });

  it('uses Redis for shared sessions when Redis is configured', async () => {
    const redisClient = {} as RedisClient;
    storeMocks.redisConfig.enabled = true;
    storeMocks.getRedisClient.mockResolvedValue(redisClient);

    const sessionStore = await createSessionStore();

    expect(sessionStore).toBeInstanceOf(storeMocks.RedisStoreStub);
    expect(storeMocks.redisStoreOptions).toEqual([{ client: redisClient, prefix: 'web-app-starter:session:', ttl: 43200 }]);
    expect(storeMocks.createFileStore).not.toHaveBeenCalled();
  });

  it('fails closed instead of falling back to files when Redis cannot connect', async () => {
    storeMocks.redisConfig.enabled = true;
    storeMocks.getRedisClient.mockRejectedValue(new Error('Redis unavailable'));

    await expect(createSessionStore()).rejects.toThrow('Redis unavailable');
    expect(storeMocks.createFileStore).not.toHaveBeenCalled();
  });
});
