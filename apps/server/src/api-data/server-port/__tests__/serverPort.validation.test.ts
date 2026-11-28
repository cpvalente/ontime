import type { Request, Response } from 'express';

import { validateServerPort } from '../serverPort.validation.js';

function validate(body: unknown) {
  const req = { body } as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  validateServerPort(req, res as unknown as Response, next);
  return { req, res, next };
}

describe('validateServerPort', () => {
  it('accepts a port number', () => {
    const { req, next } = validate({ serverPort: 4001 });
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ serverPort: 4001 });
  });

  it.each([70000, -1, 4001.5, 'abc'])('rejects %j', (serverPort) => {
    const { res, next } = validate({ serverPort });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
