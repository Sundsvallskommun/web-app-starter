import { getRedisClient } from '@utils/redis';
import axios from 'axios';
import { createClient } from 'redis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ApiTokenService from './api-token.service';

vi.mock('axios', () => ({
  default: vi.fn(),
}));

vi.mock('@config', () => ({
  API_BASE_URL: '',
  BASE_URL_PREFIX: '',
  CLIENT_KEY: 'client-key',
  CLIENT_SECRET: 'client-secret',
  REDIS_CONFIG: {
    enabled: true,
    host: 'redis.internal',
    keyPrefix: 'web-app-starter',
    port: 6379,
  },
}));

vi.mock('@utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@utils/redis', () => ({
  getRedisClient: vi.fn(),
}));

const mockedAxios = vi.mocked(axios);
const mockedGetRedisClient = vi.mocked(getRedisClient);
const REDIS_TOKEN_KEY = 'web-app-starter:wso2:access_token';
const REDIS_LOCK_KEY = 'web-app-starter:wso2:token_lock';
const LOCK_TTL_MS = 40_000;
const LOCK_WAIT_TIMEOUT_MS = 45_000;

let testTime = Date.UTC(2030, 0, 1);

function createRedisMock() {
  const client = createClient();

  return {
    client,
    eval: vi.spyOn(client, 'eval'),
    get: vi.spyOn(client, 'get'),
    set: vi.spyOn(client, 'set'),
  };
}

function serializeCachedToken(accessToken: string, expiresAt: number): string {
  return JSON.stringify({ accessToken, expiresAt });
}

describe('ApiTokenService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    testTime += 24 * 60 * 60 * 1_000;
    vi.setSystemTime(testTime);
    mockedAxios.mockReset();
    mockedGetRedisClient.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns a valid token from the shared Redis cache without calling the upstream API', async () => {
    const redis = createRedisMock();
    redis.get.mockResolvedValue(serializeCachedToken('cached-token', Date.now() + 60_000));
    mockedGetRedisClient.mockResolvedValue(redis.client);

    const service = new ApiTokenService();

    await expect(service.getToken()).resolves.toBe('cached-token');
    expect(redis.get).toHaveBeenCalledOnce();
    expect(redis.get).toHaveBeenCalledWith(REDIS_TOKEN_KEY);
    expect(redis.set).not.toHaveBeenCalled();
    expect(mockedAxios).not.toHaveBeenCalled();
  });

  it.each<unknown>([
    null,
    {},
    { access_token: '', expires_in: 3_600 },
    { access_token: 'access-token', expires_in: 0 },
    { access_token: 'access-token', expires_in: '3600' },
  ])('throws Bad Gateway when the upstream token response is invalid: %s', async invalidResponse => {
    mockedGetRedisClient.mockResolvedValue(null);
    mockedAxios.mockResolvedValue({ data: invalidResponse });

    const service = new ApiTokenService();
    const tokenPromise = service.getToken();

    await expect(tokenPromise).rejects.toMatchObject({
      message: 'Bad Gateway',
      status: 502,
    });
  });

  it('caches the upstream token in memory when Redis is not configured', async () => {
    mockedGetRedisClient.mockResolvedValue(null);
    mockedAxios.mockResolvedValue({
      data: {
        access_token: 'local-token',
        expires_in: 3_600,
      },
    });

    const firstService = new ApiTokenService();
    const secondService = new ApiTokenService();

    await expect(firstService.getToken()).resolves.toBe('local-token');
    await expect(secondService.getToken()).resolves.toBe('local-token');
    expect(mockedAxios).toHaveBeenCalledOnce();
    expect(mockedAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        data: 'grant_type=client_credentials',
        method: 'POST',
        timeout: 30_000,
        url: '/token',
      }),
    );
  });

  it('releases only its own refresh lock after caching a new token', async () => {
    const redis = createRedisMock();
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
    redis.eval.mockResolvedValue(1);
    mockedGetRedisClient.mockResolvedValue(redis.client);
    mockedAxios.mockResolvedValue({
      data: {
        access_token: 'refreshed-token',
        expires_in: 3_600,
      },
    });

    const service = new ApiTokenService();

    await expect(service.getToken()).resolves.toBe('refreshed-token');

    expect(redis.set).toHaveBeenNthCalledWith(1, REDIS_LOCK_KEY, expect.any(String), {
      NX: true,
      PX: LOCK_TTL_MS,
    });

    const lockOwner = redis.set.mock.calls[0]?.[1];
    expect(lockOwner).toEqual(expect.any(String));
    expect(redis.eval).toHaveBeenCalledWith(expect.stringContaining('redis.call("GET", KEYS[1]) == ARGV[1]'), {
      arguments: [lockOwner],
      keys: [REDIS_LOCK_KEY],
    });
    expect(redis.eval).toHaveBeenCalledWith(expect.stringContaining('redis.call("DEL", KEYS[1])'), {
      arguments: [lockOwner],
      keys: [REDIS_LOCK_KEY],
    });
    expect(redis.set).toHaveBeenNthCalledWith(2, REDIS_TOKEN_KEY, serializeCachedToken('refreshed-token', Date.now() + 3_590_000), { PX: 3_590_000 });
  });

  it('waits for the lock owner to populate Redis instead of fetching in parallel', async () => {
    const redis = createRedisMock();
    redis.get.mockResolvedValueOnce(null).mockResolvedValueOnce(serializeCachedToken('token-from-lock-owner', Date.now() + 60_000));
    redis.set.mockResolvedValue(null);
    mockedGetRedisClient.mockResolvedValue(redis.client);

    const service = new ApiTokenService();
    const tokenPromise = service.getToken();

    await vi.advanceTimersByTimeAsync(125);
    await expect(tokenPromise).resolves.toBe('token-from-lock-owner');
    expect(redis.set).toHaveBeenCalledOnce();
    expect(mockedAxios).not.toHaveBeenCalled();
  });

  it('fails explicitly after bounded lock contention without stampeding the upstream API', async () => {
    const redis = createRedisMock();
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue(null);
    mockedGetRedisClient.mockResolvedValue(redis.client);

    const service = new ApiTokenService();
    const tokenPromise = service.getToken();
    const rejectionAssertion = expect(tokenPromise).rejects.toMatchObject({
      message: 'Service Unavailable',
      status: 503,
    });

    await vi.advanceTimersByTimeAsync(LOCK_WAIT_TIMEOUT_MS);
    await rejectionAssertion;
    expect(redis.set.mock.calls.length).toBeGreaterThan(1);
    expect(redis.eval).not.toHaveBeenCalled();
    expect(mockedAxios).not.toHaveBeenCalled();
  });
});
