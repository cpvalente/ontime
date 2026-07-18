import { OntimeView } from 'ontime-types';
import { describe, expect, it } from 'vitest';

import { runMiddleware } from '../../validation-utils/__tests__/testMiddleware.js';
import { validateNewPreset, validatePresetParam } from '../urlPresets.validation.js';

const validPreset = {
  enabled: true,
  alias: 'my-preset',
  target: OntimeView.Cuesheet,
  search: '',
  displayInNav: true,
};

describe('validateNewPreset', () => {
  it('accepts a valid preset', () => {
    const { nextCalled } = runMiddleware(validateNewPreset, { body: validPreset });
    expect(nextCalled).toBe(true);
  });

  it('accepts optional cuesheet options', () => {
    const { nextCalled, req } = runMiddleware(validateNewPreset, {
      body: { ...validPreset, options: { read: 'a', write: 'b' } },
    });
    expect(nextCalled).toBe(true);
    expect(req.body.options).toEqual({ read: 'a', write: 'b' });
  });

  it('rejects a missing required field', () => {
    const { alias: _alias, ...withoutAlias } = validPreset;
    const { nextCalled, statusCode } = runMiddleware(validateNewPreset, { body: withoutAlias });
    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(422);
  });

  it('rejects "editor" as a target — URL presets cannot point at the editor view', () => {
    const { nextCalled, statusCode } = runMiddleware(validateNewPreset, {
      body: { ...validPreset, target: OntimeView.Editor },
    });
    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(422);
  });

  it('rejects an unknown target value', () => {
    const { nextCalled, statusCode } = runMiddleware(validateNewPreset, {
      body: { ...validPreset, target: 'not-a-real-view' },
    });
    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(422);
  });
});

describe('validatePresetParam', () => {
  it('accepts a non-empty alias param', () => {
    const { nextCalled } = runMiddleware(validatePresetParam, { params: { alias: 'my-preset' } });
    expect(nextCalled).toBe(true);
  });

  it('rejects an empty alias param', () => {
    const { nextCalled, statusCode } = runMiddleware(validatePresetParam, { params: { alias: '' } });
    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(422);
  });
});
