import { randomUUID } from 'node:crypto';

import { REDIS_CONFIG } from '@config';
import session from 'express-session';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import ApiTokenService from '../services/api-token.service';
import { closeRedisClient, getRedisClient, type RedisClient } from './redis';
import { createSessionStore } from './session-store';

const describeRedisIntegration = process.env.REDIS_INTEGRATION === 'true' ? describe : describe.skip;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function setSession(store: session.Store, sessionId: string, sessionData: session.SessionData): Promise<void> {
  return new Promise((resolve, reject) => {
    store.set(sessionId, sessionData, error => {
      if (error) {
        reject(toError(error));
      } else {
        resolve();
      }
    });
  });
}

function getSession(store: session.Store, sessionId: string): Promise<session.SessionData | null | undefined> {
  return new Promise((resolve, reject) => {
    store.get(sessionId, (error, sessionData) => {
      if (error) {
        reject(toError(error));
      } else {
        resolve(sessionData);
      }
    });
  });
}

describeRedisIntegration('Redis integration', () => {
  const uniqueId = randomUUID();
  const sessionId = `integration-${uniqueId}`;
  let client: RedisClient;
  let directKey: string;
  let sessionKey: string;
  let tokenKey: string;

  beforeAll(async () => {
    if (!REDIS_CONFIG.enabled) {
      throw new Error('REDIS_INTEGRATION=true requires REDIS_HOST and REDIS_KEY_PREFIX');
    }

    const connectedClient = await getRedisClient();
    if (!connectedClient) {
      throw new Error('Redis was configured but no client was created');
    }

    client = connectedClient;
    directKey = `${REDIS_CONFIG.keyPrefix}:integration:${uniqueId}`;
    sessionKey = `${REDIS_CONFIG.keyPrefix}:session:${sessionId}`;
    tokenKey = `${REDIS_CONFIG.keyPrefix}:wso2:access_token`;
  });

  afterAll(async () => {
    if (client?.isReady) {
      await client.del([directKey, sessionKey, tokenKey]);
    }

    await closeRedisClient();
  });

  it('shares one connected client for direct data and the Redis-backed session store', async () => {
    await client.set(directKey, 'connected');
    await expect(client.get(directKey)).resolves.toBe('connected');

    const sessionStore = await createSessionStore();
    const configuredMaxAge = 60_000;
    const maxAgeSetAt = Date.now();
    const sessionCookie = new session.Cookie();
    sessionCookie.maxAge = configuredMaxAge;
    const sessionData: session.SessionData = {
      cookie: sessionCookie,
    };
    await setSession(sessionStore, sessionId, sessionData);

    const storedSession = await getSession(sessionStore, sessionId);
    if (!storedSession) {
      throw new Error('Expected the Redis-backed session to be available');
    }

    const storedMaxAge = storedSession.cookie.originalMaxAge;
    if (storedMaxAge === null) {
      throw new Error('Expected the stored session cookie to have a finite max age');
    }

    expect(storedMaxAge).toBeGreaterThan(0);
    expect(storedMaxAge).toBeGreaterThanOrEqual(configuredMaxAge - (Date.now() - maxAgeSetAt));
    expect(storedMaxAge).toBeLessThanOrEqual(configuredMaxAge);
    await expect(client.exists(sessionKey)).resolves.toBe(1);
    await expect(getRedisClient()).resolves.toBe(client);
  });

  it('reads the shared OAuth token from the configured Redis namespace', async () => {
    const cachedToken = {
      accessToken: `integration-token-${uniqueId}`,
      expiresAt: Date.now() + 60_000,
    };
    await client.set(tokenKey, JSON.stringify(cachedToken), { PX: 60_000 });

    await expect(new ApiTokenService().getToken()).resolves.toBe(cachedToken.accessToken);
  });
});
