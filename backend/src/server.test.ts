import { beforeEach, describe, expect, it, vi } from 'vitest';

const bootstrapMocks = vi.hoisted(() => ({
  app: vi.fn(),
  closeRedisClient: vi.fn(),
  createSessionStore: vi.fn(),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
  validateEnv: vi.fn(),
}));

vi.mock('@/app', () => ({ default: bootstrapMocks.app }));
vi.mock('@controllers/index.controller', () => ({ IndexController: {} }));
vi.mock('@utils/logger', () => ({ logger: bootstrapMocks.logger }));
vi.mock('@utils/redis', () => ({ closeRedisClient: bootstrapMocks.closeRedisClient }));
vi.mock('@utils/session-store', () => ({ createSessionStore: bootstrapMocks.createSessionStore }));
vi.mock('@utils/validateEnv', () => ({ default: bootstrapMocks.validateEnv }));
vi.mock('./controllers/health.controller', () => ({ HealthController: {} }));
vi.mock('./controllers/user.controller', () => ({ UserController: {} }));

import { startServer } from './server';

describe('server bootstrap', () => {
  beforeEach(() => {
    bootstrapMocks.app.mockReset();
    bootstrapMocks.createSessionStore.mockReset();
    bootstrapMocks.validateEnv.mockReset();
  });

  it('does not construct or listen on the HTTP app when the session store cannot start', async () => {
    bootstrapMocks.createSessionStore.mockRejectedValue(new Error('Redis unavailable'));

    await expect(startServer()).rejects.toThrow('Redis unavailable');

    expect(bootstrapMocks.validateEnv).toHaveBeenCalledOnce();
    expect(bootstrapMocks.app).not.toHaveBeenCalled();
  });
});
