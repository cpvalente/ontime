import { resolvePath } from 'react-router-dom';

import { generatePathFromPreset, getRouteFromPreset, validateUrlPresetPath } from '../urlPresets';

describe('validateUrlPresetPaths()', () => {
  test.each([
    // no empty
    '',
    // no https, http or www
    'https://www.test.com',
    'http://www.test.com',
    'www.test.com',
    // no hostname
    'localhost/test',
    '127.0.0.1/test',
    '0.0.0.0/test',
    // no editor
    'editor',
    'editor?test',
  ])('flags known edge cases: %s', (t) => {
    expect(validateUrlPresetPath(t).isValid).toBeFalsy();
  });
});

describe('getRouteFromPreset()', () => {
  const presets = [
    {
      enabled: true,
      alias: 'demopage',
      pathAndParams: '/timer?user=guest',
    },
  ];

  it('checks if the current location matches an enabled preset', () => {
    // we make the current location be the alias
    const location = resolvePath('demopage');
    expect(getRouteFromPreset(location, presets)).toStrictEqual('timer?user=guest&alias=demopage');
  });

  it('returns null if the current location is the exact match of an unwrapped alias', () => {
    // we make the current location be the alias
    const location = resolvePath('/timer?user=guest&alias=demopage');
    expect(getRouteFromPreset(location, presets)).toEqual(null);
  });

  it('returns a new destination if the current location is an out-of-date unwrapped alias', () => {
    // we make the current location be the alias
    const location = resolvePath('/timer?user=admin&alias=demopage');
    expect(getRouteFromPreset(location, presets)).toEqual('timer?user=guest&alias=demopage');
  });

  it('checks if the current location contains an unwrapped preset', () => {
    // we make the current location be the alias
    const location = resolvePath('/timer?user=guest&alias=demopage');
    expect(getRouteFromPreset(location, presets)).toEqual(null);
  });

  it('ignores a location that has no presets', () => {
    // we make the current location be the alias
    const location = resolvePath('/unknown');
    expect(getRouteFromPreset(location, presets)).toEqual(null);
  });
});

describe('generatePathFromPreset()', () => {
  test.each([
    ['timer?user=guest', 'demopage', 'timer?user=guest&alias=demopage'],
    ['timer?user=admin', 'demopage', 'timer?user=admin&alias=demopage'],
  ])('generates a path from a preset: %s', (path, alias, expected) => {
    expect(generatePathFromPreset(path, alias)).toEqual(expected);
  });
});
