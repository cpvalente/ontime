import type { Request } from 'express';
import { validationResult, type ValidationChain } from 'express-validator';

import { validateNewPreset, validateUpdatePreset, validatePresetParam } from '../urlPresets.validation.js';

it.each([
  ['create', validateNewPreset, { body: { alias: 'mainstage' } }],
  ['update', validateUpdatePreset, { body: { alias: 'mainstage' }, params: { alias: 'mainstage' } }],
  ['delete', validatePresetParam, { params: { alias: 'mainstage' } }],
])('normalises %s aliases at the request boundary', async (_action, validators, expected) => {
  const req = {
    body: {
      alias: ' MainStage ',
      target: 'timer',
      enabled: true,
      displayInNav: false,
      search: 'title=MainStage',
    },
    params: { alias: ' MAINSTAGE ' },
  } as Request;
  for (const chain of validators.slice(0, -1) as ValidationChain[]) {
    await chain.run(req);
  }

  expect(validationResult(req).array()).toEqual([]);
  expect(req).toMatchObject(expected);
  expect(req.body.search).toBe('title=MainStage');
});
