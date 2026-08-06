import { describe, expect, it } from 'vitest';

import { createHealthConfig, isHealthRequestAuthorized } from './health-config';

const baseEnvironment = () => ({
  HEALTH_AUTH: 'false',
  INTERNAL_API_URL: 'http://backend:3000/api',
});

describe('createHealthConfig', () => {
  it('builds the backend health URL from the server-only internal API URL', () => {
    expect(createHealthConfig(baseEnvironment())).toMatchObject({
      backendHealthUrl: 'http://backend:3000/api/health/up',
      requestTimeoutMs: 3_000,
    });
  });

  it('requires both credentials when health authentication is enabled', () => {
    expect(() =>
      createHealthConfig({
        ...baseEnvironment(),
        HEALTH_AUTH: 'true',
        HEALTH_PASSWORD: '',
        HEALTH_USERNAME: '',
      })
    ).toThrow('HEALTH_USERNAME and HEALTH_PASSWORD are required');
  });

  it('rejects invalid authentication flags', () => {
    expect(() => createHealthConfig({ ...baseEnvironment(), HEALTH_AUTH: 'yes' })).toThrow(
      'HEALTH_AUTH must be either "true" or "false"'
    );
  });

  it('requires an HTTP or HTTPS internal API URL', () => {
    expect(() => createHealthConfig({ ...baseEnvironment(), INTERNAL_API_URL: '' })).toThrow(
      'INTERNAL_API_URL is required'
    );
    expect(() => createHealthConfig({ ...baseEnvironment(), INTERNAL_API_URL: 'ftp://backend/api' })).toThrow(
      'INTERNAL_API_URL must use http or https'
    );
  });

  it('rejects invalid or excessive request timeouts', () => {
    expect(() => createHealthConfig({ ...baseEnvironment(), HEALTH_REQUEST_TIMEOUT_MS: '30001' })).toThrow(
      'HEALTH_REQUEST_TIMEOUT_MS'
    );
  });

  it('uses the default request timeout when the optional variable is empty', () => {
    expect(createHealthConfig({ ...baseEnvironment(), HEALTH_REQUEST_TIMEOUT_MS: '' }).requestTimeoutMs).toBe(3_000);
  });
});

describe('isHealthRequestAuthorized', () => {
  it('accepts only the configured credentials when authentication is enabled', () => {
    const config = createHealthConfig({
      ...baseEnvironment(),
      HEALTH_AUTH: 'true',
      HEALTH_PASSWORD: 'secret',
      HEALTH_USERNAME: 'health-user',
    });
    const expectedAuthorization = `Basic ${Buffer.from('health-user:secret').toString('base64')}`;

    expect(isHealthRequestAuthorized(expectedAuthorization, config)).toBe(true);
    expect(isHealthRequestAuthorized('Basic Og==', config)).toBe(false);
  });
});
