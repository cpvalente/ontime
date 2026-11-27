import type { Request, Response } from 'express';

import { validateViewSettings } from '../viewSettings.validation.js';

function validate(body: unknown) {
  const req = { body } as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  validateViewSettings(req, res as unknown as Response, next);
  return { req, res, next };
}

describe('validateViewSettings', () => {
  it.each([true, false])('accepts overrideStyles %j and strips unknown keys', (overrideStyles) => {
    const { req, next } = validate({ overrideStyles, extra: 'value' });
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ overrideStyles });
  });

  it.each([undefined, null, 'true', 0, 1, {}])('rejects overrideStyles %j with a 422', (overrideStyles) => {
    const { res, next } = validate({ overrideStyles });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('overrideStyles') });
  });

  it('rejects a missing body', () => {
    const { res, next } = validate(undefined);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
