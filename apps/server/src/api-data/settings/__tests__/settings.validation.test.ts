import type { Request, Response } from 'express';

import { validateServerPort, validateSettingsPatch } from '../settings.validation.js';

function validate(middleware: typeof validateSettingsPatch, body: unknown) {
  const req = { body } as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  middleware(req, res as unknown as Response, next);
  return { req, res, next };
}

describe('validateSettingsPatch', () => {
  it('accepts a patch with any subset of fields and strips unknown keys and the version', () => {
    const { req, next } = validate(validateSettingsPatch, { timeFormat: '12', version: '9.9.9', extra: true });
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ timeFormat: '12' });
  });

  it.each(['1234', 'aB9'])('accepts pin %j', (pin) => {
    const { req, next } = validate(validateSettingsPatch, { editorKey: pin, operatorKey: pin });
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ editorKey: pin, operatorKey: pin });
  });

  it.each([null, ''])('stores a cleared pin %j as null', (pin) => {
    const { req, next } = validate(validateSettingsPatch, { editorKey: pin });
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ editorKey: null });
  });

  it.each(['_abc', '1 2', '12345', 1234, true])('rejects pin %j with a 422', (pin) => {
    const { res, next } = validate(validateSettingsPatch, { editorKey: pin });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('editorKey') });
  });

  it('pads aux timer names to three', () => {
    const { req } = validate(validateSettingsPatch, { auxTimerNames: ['Speaker'] });
    expect(req.body).toEqual({ auxTimerNames: ['Speaker', '', ''] });
  });

  it.each([{ warning: { unit: 'percent', value: 20 } }, null, 'none'])('rejects phase thresholds %j', (thresholds) => {
    const { res, next } = validate(validateSettingsPatch, { phaseThresholds: thresholds });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it.each([{ timeFormat: '13' }, { language: '  ' }])('rejects %j', (patch) => {
    const { res, next } = validate(validateSettingsPatch, patch);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('rejects a missing body', () => {
    const { res, next } = validate(validateSettingsPatch, undefined);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
  });
});

describe('validateServerPort', () => {
  it('accepts a port number', () => {
    const { req, next } = validate(validateServerPort, { serverPort: 4001 });
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ serverPort: 4001 });
  });

  it.each([70000, -1, 4001.5, 'abc'])('rejects %j', (serverPort) => {
    const { res, next } = validate(validateServerPort, { serverPort });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
