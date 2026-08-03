import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const mocks = vi.hoisted(() => ({
  axiosGet: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    get: mocks.axiosGet,
  },
}));

vi.mock('next/headers', () => ({
  headers: mocks.headers,
}));

describe('GET /api/health/up', () => {
  beforeEach(() => {
    vi.stubEnv('HEALTH_AUTH', 'false');
    vi.stubEnv('INTERNAL_API_URL', 'http://backend:3000/api');
    vi.stubEnv('HEALTH_REQUEST_TIMEOUT_MS', '2500');
    mocks.headers.mockResolvedValue(new Headers());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('uses the internal backend URL and a bounded request timeout', async () => {
    mocks.axiosGet.mockResolvedValue({ data: { status: 'UP' } });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.axiosGet).toHaveBeenCalledWith('http://backend:3000/api/health/up', { timeout: 2_500 });
  });

  it('does not accept empty credentials when authentication is enabled', async () => {
    vi.stubEnv('HEALTH_AUTH', 'true');
    vi.stubEnv('HEALTH_USERNAME', '');
    vi.stubEnv('HEALTH_PASSWORD', '');
    mocks.headers.mockResolvedValue(new Headers({ authorization: 'Basic Og==' }));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(mocks.axiosGet).not.toHaveBeenCalled();
  });

  it('rejects incorrect credentials before contacting the backend', async () => {
    vi.stubEnv('HEALTH_AUTH', 'true');
    vi.stubEnv('HEALTH_USERNAME', 'health-user');
    vi.stubEnv('HEALTH_PASSWORD', 'secret');
    mocks.headers.mockResolvedValue(new Headers({ authorization: 'Basic Og==' }));

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.axiosGet).not.toHaveBeenCalled();
  });

  it('returns service unavailable when the backend times out', async () => {
    mocks.axiosGet.mockRejectedValue(new Error('timeout'));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: 'UNAVAILABLE' });
  });
});
