import { beforeEach, describe, expect, it, vi } from 'vitest';

const healthMocks = vi.hoisted(() => ({
  isRedisReady: vi.fn(),
  logger: {
    error: vi.fn(),
  },
  post: vi.fn(),
}));

vi.mock('@/config/api-config', () => ({ getApiBase: vi.fn(() => 'http://simulator.internal') }));
vi.mock('@/services/api.service', () => ({
  default: class ApiServiceStub {
    public post = healthMocks.post;
  },
}));
vi.mock('@/utils/logger', () => ({ logger: healthMocks.logger }));
vi.mock('@/utils/redis', () => ({ isRedisReady: healthMocks.isRedisReady }));

import { HealthController } from './health.controller';

describe('HealthController', () => {
  beforeEach(() => {
    healthMocks.isRedisReady.mockReset().mockReturnValue(true);
    healthMocks.logger.error.mockReset();
    healthMocks.post.mockReset();
  });

  it('returns the upstream health response when dependencies are ready', async () => {
    healthMocks.post.mockResolvedValue({ data: { status: 'OK' } });

    await expect(new HealthController().up()).resolves.toEqual({ status: 'OK' });

    expect(healthMocks.post).toHaveBeenCalledWith({
      data: { status: 'OK' },
      url: 'http://simulator.internal/simulations/response?status=200%20OK',
    });
  });

  it('reports unavailable without calling upstream while Redis is reconnecting', async () => {
    healthMocks.isRedisReady.mockReturnValue(false);

    await expect(new HealthController().up()).rejects.toMatchObject({
      message: 'Health check failed',
      status: 503,
    });

    expect(healthMocks.post).not.toHaveBeenCalled();
    expect(healthMocks.logger.error).toHaveBeenCalledWith('Health check failed: Redis is not ready');
  });

  it('reports a bad gateway when the upstream health dependency fails', async () => {
    const upstreamError = new Error('upstream unavailable');
    healthMocks.post.mockRejectedValue(upstreamError);

    await expect(new HealthController().up()).rejects.toMatchObject({
      message: 'Health check failed',
      status: 502,
    });

    expect(healthMocks.logger.error).toHaveBeenCalledWith('Error when doing health check:', upstreamError);
  });
});
