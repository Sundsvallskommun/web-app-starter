import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiURL } from './api-url';

describe('apiURL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults the optional API path to an empty string', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://example.com');
    vi.stubEnv('NEXT_PUBLIC_API_PATH', undefined);

    expect(apiURL('/users/')).toBe('https://example.com/users');
  });

  it('does not introduce a double slash when the API path is the root path', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://example.com');
    vi.stubEnv('NEXT_PUBLIC_API_PATH', '/');

    expect(apiURL('/users/')).toBe('https://example.com/users');
  });

  it('joins the API base URL, API path and resource path with single slashes', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://example.com/');
    vi.stubEnv('NEXT_PUBLIC_API_PATH', '/api/');

    expect(apiURL('/users/', '/me/')).toBe('https://example.com/api/users/me');
  });

  it('fails explicitly when the API base URL is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', undefined);

    expect(() => apiURL('users')).toThrow('NEXT_PUBLIC_API_URL is required');
  });
});
