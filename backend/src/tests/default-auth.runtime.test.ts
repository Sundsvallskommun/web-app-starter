// Runtime guard for the default-deny auth model.
//
// Boots the real App (same middleware order as production, in-memory session store) and
// sends an unauthenticated request to every registered route. Everything must answer 401
// except routes marked @Public().
//
// This is the assertion that actually matters: it proves the app-level guard denies by
// default, independently of what any decorator claims. The metadata test covers declared
// intent; this one covers behaviour.

import session from 'express-session';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import App from '@/app';
import { BASE_URL_PREFIX } from '@/config';
import { CONTROLLERS } from '@/controllers';

import { collectRegisteredRoutes, toConcretePath } from './helpers/routes';
import { startServer, TestServer } from './helpers/server';

vi.mock('@/services/api.service', () => {
  const stub = vi.fn(() => Promise.resolve({ data: {} }));
  return {
    default: class {
      get = stub;
      post = stub;
      patch = stub;
      put = stub;
      delete = stub;
    },
  };
});

vi.mock('@/utils/redis', () => ({
  isRedisReady: () => true,
  closeRedisClient: () => Promise.resolve(),
  destroyRedisClient: () => undefined,
}));

describe('default-deny auth (runtime)', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startServer(new App(CONTROLLERS, new session.MemoryStore()).getServer());
  });

  afterAll(() => server.close());

  const routes = collectRegisteredRoutes();
  const protectedRoutes = routes.filter(route => !route.isPublic);
  const publicRoutes = routes.filter(route => route.isPublic);

  const send = (httpMethod: string, path: string) => server.request(httpMethod, `${BASE_URL_PREFIX}${toConcretePath(path)}`);

  it('enumerates the routes it is about to probe', () => {
    expect(protectedRoutes.length).toBeGreaterThan(0);
    expect(publicRoutes.length).toBeGreaterThan(0);
  });

  it.each(protectedRoutes.map(route => [`${route.httpMethod.toUpperCase()} ${route.path}`, route]))(
    'denies %s without a session',
    async (_label, route) => {
      const response = await send(route.httpMethod, route.path);
      expect(response.status).toBe(401);
    },
  );

  it.each(publicRoutes.map(route => [`${route.httpMethod.toUpperCase()} ${route.path}`, route]))(
    'allows %s without a session',
    async (_label, route) => {
      const response = await send(route.httpMethod, route.path);
      expect(response.status).not.toBe(401);
    },
  );

  it('does not open other verbs on a public path', async () => {
    const target = publicRoutes[0];
    const response = await send('post', target.path);

    expect(response.status).toBe(401);
  });

  it('lets CORS preflight through so the real request is not blocked', async () => {
    const target = protectedRoutes[0];
    const response = await send('options', target.path);

    expect(response.status).not.toBe(401);
  });

  it('denies an unknown path under the prefix rather than falling through', async () => {
    const response = await server.request('get', `${BASE_URL_PREFIX}/definitely-not-a-route`);

    expect(response.status).toBe(401);
  });
});
