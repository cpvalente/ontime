import type { Request } from 'express';
import type { ValidationChain } from 'express-validator';
import { matchedData, validationResult } from 'express-validator';

import { validateSettings } from '../settings.validation.js';

async function validate(body: object) {
  const req = { body } as Request;
  const chains = validateSettings.slice(0, -1) as ValidationChain[];
  for (const chain of chains) {
    await chain.run(req);
  }
  const errors = validationResult(req)
    .array()
    .map((error) => (error.type === 'field' ? error.path : error.type));
  return { errors, data: matchedData(req) };
}

const baseSettings = {
  timeFormat: '24',
  language: 'en',
  auxTimerNames: ['', '', ''],
};

describe('validateSettings', () => {
  it.each(['1234', 'aB9', '', null])('accepts pin %j', async (pin) => {
    const { errors } = await validate({ ...baseSettings, editorKey: pin, operatorKey: pin });
    expect(errors).toEqual([]);
  });

  it('rejects pins with non alphanumeric characters', async () => {
    const { errors } = await validate({ ...baseSettings, editorKey: '_abc', operatorKey: '1 2' });
    expect(errors).toEqual(['editorKey', 'operatorKey']);
  });

  it.each([1234, true])('rejects non-string pin %j', async (pin) => {
    const { errors } = await validate({ ...baseSettings, editorKey: pin });
    expect(errors).toContain('editorKey');
  });

  it.each([null, ''])('preserves cleared pin %j for saving', async (pin) => {
    const { errors, data } = await validate({ ...baseSettings, editorKey: pin });
    expect(errors).toEqual([]);
    expect(data.editorKey).toBeNull();
  });
});
