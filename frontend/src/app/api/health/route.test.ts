import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

describe('GET /api/health', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('responds 200 without consulting any dependency', async () => {
    const response = GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'OK' });
  });

  it('stays healthy even when the health configuration is absent', () => {
    vi.stubEnv('INTERNAL_API_URL', '');
    vi.stubEnv('HEALTH_AUTH', '');

    expect(GET().status).toBe(200);
  });
});
