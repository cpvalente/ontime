import type { Request } from 'express';
import type { ValidationChain } from 'express-validator';
import { validationResult } from 'express-validator';

import { validatePostCss } from '../assets.validation.js';

async function validate(body: object) {
  const req = { body } as Request;
  const chains = validatePostCss.slice(0, -1) as ValidationChain[];
  for (const chain of chains) {
    await chain.run(req);
  }
  return validationResult(req)
    .array()
    .map((error) => (error.type === 'field' ? error.path : error.type));
}

describe('validatePostCss', () => {
  it.each([true, false])('accepts a boolean enabled flag %j and empty css', async (enabled) => {
    expect(await validate({ css: '', enabled })).toEqual([]);
  });

  it.each([undefined, null, 'true', 'false', 0, 1, [], {}])('rejects enabled flag %j', async (enabled) => {
    expect(await validate({ css: 'a {}', enabled })).toEqual(['enabled']);
  });

  it.each([undefined, null, 1, true, ['a {}'], {}])('rejects non-string css %j', async (css) => {
    expect(await validate({ css, enabled: true })).toEqual(['css']);
  });
});
