import { describe, expect, it } from 'vitest';

import { apiURL } from './api-url';

describe('apiURL', () => {
  it('joins path parts with a single slash and trims surrounding slashes', () => {
    expect(apiURL('users', 'me')).toContain('users/me');
  });

  it('strips leading and trailing slashes from parts', () => {
    expect(apiURL('/users/', '/me/')).toContain('users/me');
  });
});
