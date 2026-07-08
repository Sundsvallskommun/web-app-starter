import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ApiTokenService from './api-token.service';

vi.mock('axios', () => ({
  default: vi.fn(),
}));

const mockedAxios = vi.mocked(axios);

describe('ApiTokenService', () => {
  beforeEach(() => {
    mockedAxios.mockReset();
  });

  it('returns the fetched access token when the token response is valid', async () => {
    mockedAxios.mockResolvedValue({
      data: {
        access_token: 'access-token',
        expires_in: 3600,
      },
    });

    const service = new ApiTokenService();

    await expect(service.fetchToken()).resolves.toBe('access-token');
    expect(mockedAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        data: 'grant_type=client_credentials',
        method: 'POST',
        url: '/token',
      }),
    );
  });

  it.each<unknown>([
    null,
    {},
    { access_token: '', expires_in: 3600 },
    { access_token: 'access-token', expires_in: 0 },
    { access_token: 'access-token', expires_in: '3600' },
  ])('throws Bad Gateway when the token response is invalid: %s', async invalidResponse => {
    mockedAxios.mockResolvedValue({ data: invalidResponse });

    const service = new ApiTokenService();
    const tokenPromise = service.fetchToken();

    await expect(tokenPromise).rejects.toMatchObject({
      message: 'Bad Gateway',
      status: 502,
    });
  });
});
