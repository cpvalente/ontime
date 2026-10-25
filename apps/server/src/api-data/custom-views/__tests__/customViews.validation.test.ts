import type { Request } from 'express';
import { type ValidationChain, validationResult } from 'express-validator';

import { validateCustomViewPatch } from '../customViews.validation.js';

async function validate(displayInNav: unknown) {
  const req = { params: { slug: 'demo' }, body: { displayInNav } } as Request;
  const chains = validateCustomViewPatch.slice(0, -1) as ValidationChain[];
  for (const chain of chains) {
    await chain.run(req);
  }
  return validationResult(req).array();
}

describe('validateCustomViewPatch', () => {
  it.each([true, false])('accepts the JSON boolean %j', async (displayInNav) => {
    expect(await validate(displayInNav)).toEqual([]);
  });

  it.each(['false', '0', [false], null, undefined].map((value) => ({ value })))(
    'rejects the non-boolean $value',
    async ({ value }) => {
      expect(await validate(value)).toContainEqual(expect.objectContaining({ path: 'displayInNav' }));
    },
  );
});
