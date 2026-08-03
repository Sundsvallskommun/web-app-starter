import { describe, expect, it } from 'vitest';

import { fieldpathWithoutIndex } from './fieldpath-without-index';

describe('fieldpathWithoutIndex', () => {
  it('strips numeric array indices from a single field path', () => {
    expect(fieldpathWithoutIndex('items.0.name')).toBe('items.name');
  });

  it('strips numeric array indices from an array of field paths', () => {
    expect(fieldpathWithoutIndex(['items.0.name', 'items.1.value'])).toEqual(['items.name', 'items.value']);
  });
});
