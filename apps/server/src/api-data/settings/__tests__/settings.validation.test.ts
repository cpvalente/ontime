import type { Request, Response } from 'express';

import { validateSettingsPatch } from '../settings.validation.js';

function validate(middleware: typeof validateSettingsPatch, body: unknown) {
  const req = { body } as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  middleware(req, res as unknown as Response, next);
  return { req, res, next };
}

describe('validateSettingsPatch', () => {
  function expectRejected(body: unknown) {
    const { res, next } = validate(validateSettingsPatch, body);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
  }

  it.each([{ version: '9.9.9' }, { extra: true }])('refuses %j', expectRejected);

  it.each([null, ''])('stores a cleared pin %j as null', (pin) => {
    const { req } = validate(validateSettingsPatch, { editorKey: pin });
    expect(req.body).toEqual({ editorKey: null });
  });

  it.each(['_abc', '12345'])('rejects pin %j', (pin) => expectRejected({ editorKey: pin }));

  it('pads aux timer names to three', () => {
    const { req } = validate(validateSettingsPatch, { auxTimerNames: ['Speaker'] });
    expect(req.body).toEqual({ auxTimerNames: ['Speaker', '', ''] });
  });

  it('rejects incomplete phase thresholds', () => {
    expectRejected({ phaseThresholds: { warning: { unit: 'percent', value: 20 } } });
  });

  it('rejects partial rundown defaults', () => {
    expectRejected({ rundownDefaults: { linkPrevious: false } });
  });
});
