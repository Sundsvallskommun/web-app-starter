import handler from '@pages/api/health/up';
import type { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  axiosGet: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    get: mocks.axiosGet,
  },
}));

const createRequest = (authorization?: string): NextApiRequest =>
  ({
    headers: authorization ? { authorization } : {},
  }) as NextApiRequest;

const createResponse = () => {
  const send = vi.fn();
  const status = vi.fn(() => ({ send }));

  return {
    response: { status } as unknown as NextApiResponse,
    send,
    status,
  };
};

describe('GET /api/health/up', () => {
  beforeEach(() => {
    vi.stubEnv('HEALTH_AUTH', 'false');
    vi.stubEnv('INTERNAL_API_URL', 'http://backend:3000/api');
    vi.stubEnv('HEALTH_REQUEST_TIMEOUT_MS', '2500');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('uses the internal backend URL and a bounded request timeout', async () => {
    mocks.axiosGet.mockResolvedValue({ data: { status: 'UP' } });
    const { response, send, status } = createResponse();

    await handler(createRequest(), response);

    expect(mocks.axiosGet).toHaveBeenCalledWith('http://backend:3000/api/health/up', { timeout: 2_500 });
    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({ status: 'UP' });
  });

  it('does not accept empty credentials when authentication is enabled', async () => {
    vi.stubEnv('HEALTH_AUTH', 'true');
    vi.stubEnv('HEALTH_USERNAME', '');
    vi.stubEnv('HEALTH_PASSWORD', '');
    const { response, status } = createResponse();

    await handler(createRequest('Basic Og=='), response);

    expect(status).toHaveBeenCalledWith(500);
    expect(mocks.axiosGet).not.toHaveBeenCalled();
  });

  it('rejects incorrect credentials before contacting the backend', async () => {
    vi.stubEnv('HEALTH_AUTH', 'true');
    vi.stubEnv('HEALTH_USERNAME', 'health-user');
    vi.stubEnv('HEALTH_PASSWORD', 'secret');
    const { response, send, status } = createResponse();

    await handler(createRequest('Basic Og=='), response);

    expect(status).toHaveBeenCalledWith(401);
    expect(send).toHaveBeenCalledWith('NOT_AUTHORIZED');
    expect(mocks.axiosGet).not.toHaveBeenCalled();
  });

  it('returns service unavailable when the backend times out', async () => {
    mocks.axiosGet.mockRejectedValue(new Error('timeout'));
    const { response, send, status } = createResponse();

    await handler(createRequest(), response);

    expect(status).toHaveBeenCalledWith(503);
    expect(send).toHaveBeenCalledWith({ status: 'UNAVAILABLE' });
  });
});
