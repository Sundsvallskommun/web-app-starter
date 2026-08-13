import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { livenessHandler } from './liveness.route';

function createResponse() {
  const json = vi.fn();
  const status = vi.fn();
  const res = { json, status } as unknown as Response;

  status.mockReturnValue(res);

  return { json, res, status };
}

describe('livenessHandler', () => {
  it('responds 200 without consulting any dependency', () => {
    const { json, res, status } = createResponse();

    livenessHandler({} as Request, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ status: 'OK' });
  });
});
