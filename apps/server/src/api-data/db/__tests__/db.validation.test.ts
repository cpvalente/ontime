import type { Request } from 'express';
import type { ValidationChain } from 'express-validator';
import { validationResult } from 'express-validator';

import { validatePatchProject } from '../db.validation.js';

async function validate(body: object) {
  const req = { body } as Request;
  const chains = validatePatchProject.slice(0, -1) as ValidationChain[];
  for (const chain of chains) {
    await chain.run(req);
  }
  return validationResult(req)
    .array()
    .map((error) => (error.type === 'field' ? error.path : error.type));
}

describe('validatePatchProject', () => {
  it('rejects partial phase thresholds, which the runtime cannot resolve', async () => {
    const errors = await validate({ settings: { phaseThresholds: { warning: { unit: 'time', value: 1000 } } } });
    expect(errors).toContain('settings.phaseThresholds');
  });
});
