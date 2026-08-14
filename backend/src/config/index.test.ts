import { describe, expect, it } from 'vitest';

import { createRedisConfig } from './index';

describe('Redis configuration', () => {
  it('disables Redis when no Redis settings are present', () => {
    expect(createRedisConfig({})).toEqual({ enabled: false });
  });

  it('allows a key namespace to be prepared without enabling Redis', () => {
    expect(createRedisConfig({ REDIS_KEY_PREFIX: 'web-app-starter' })).toEqual({ enabled: false });
  });

  it('normalizes the Redis host, preserves the password, and applies the default port', () => {
    expect(createRedisConfig({ REDIS_HOST: ' redis.internal ', REDIS_KEY_PREFIX: ' web-app-starter ', REDIS_PASSWORD: ' secret ' })).toEqual({
      enabled: true,
      host: 'redis.internal',
      keyPrefix: 'web-app-starter',
      password: ' secret ',
      port: 6379,
    });
  });

  it.each(['0', '65536', '12.5', '1e3', '0x10', 'not-a-port'])('rejects an invalid Redis port: %s', redisPort => {
    expect(() => createRedisConfig({ REDIS_HOST: 'redis.internal', REDIS_KEY_PREFIX: 'web-app-starter', REDIS_PORT: redisPort })).toThrow(
      'REDIS_PORT must be an integer between 1 and 65535',
    );
  });

  it.each(['', '   ', undefined])('falls back to the default key namespace when REDIS_KEY_PREFIX is %j', redisKeyPrefix => {
    expect(createRedisConfig({ REDIS_HOST: 'redis.internal', REDIS_KEY_PREFIX: redisKeyPrefix })).toEqual({
      enabled: true,
      host: 'redis.internal',
      keyPrefix: 'web-app-starter',
      port: 6379,
    });
  });

  it('rejects partial Redis settings without a host', () => {
    expect(() => createRedisConfig({ REDIS_PASSWORD: 'secret' })).toThrow('REDIS_HOST is required when REDIS_PORT or REDIS_PASSWORD is configured');
  });
});
