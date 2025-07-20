import { resolvePath } from 'react-router-dom';

import {
  arePathsEquivalent,
  generatePathFromPreset,
  generateUrlPresetOptions,
  getRouteFromPreset,
  validateUrlPresetPath,
} from '../urlPresets';

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
      target: 'timer',
      search: 'user=guest',
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

  describe('handle url sharing edge cases', () => {
    it('finds the correct preset when the url contains extra arguments', () => {
      const location = resolvePath('/demopage?locked=true&token=123');
      expect(getRouteFromPreset(location, presets)?.startsWith('timer?user=guest&alias=demopage')).toBeTruthy();
    });

    it('appends the feature params to the alias', () => {
      const location = resolvePath('/demopage?locked=true&token=123');
      expect(getRouteFromPreset(location, presets)).toBe('timer?user=guest&alias=demopage&locked=true&token=123');
    });
  });
});

describe('generatePathFromPreset()', () => {
  test.each([
    ['timer', 'user=guest', 'demopage', 'timer?user=guest&alias=demopage'],
    ['timer', 'user=admin', 'demopage', 'timer?user=admin&alias=demopage'],
  ])('generates a path from a preset: %s', (target, path, alias, expected) => {
    expect(generatePathFromPreset(target, path, alias, null, null)).toEqual(expected);
  });

  test('appends the feature params to the alias', () => {
    expect(generatePathFromPreset('timer', 'user=guest', 'demopage', 'true', '123')).toBe(
      'timer?user=guest&alias=demopage&locked=true&token=123',
    );
  });
});

describe('arePathsEquivalent()', () => {
  it('checks whether the paths match', () => {
    expect(arePathsEquivalent('demopage', 'timer')).toBeFalsy();
    expect(arePathsEquivalent('timer', 'timer')).toBeTruthy();
    expect(arePathsEquivalent('timer?user=guest', 'timer?user=guest')).toBeTruthy();
  });

  it('checks whether the params match', () => {
    expect(arePathsEquivalent('timer?test=a', 'timer?test=b')).toBeFalsy();
    expect(arePathsEquivalent('timer?test=a', 'timer?test=a')).toBeTruthy();
  });

  it('considers edge cases for the url sharing feature', () => {
    expect(arePathsEquivalent('timer?test=a&locked=true=token=123', 'timer?test=b')).toBeFalsy();
    expect(arePathsEquivalent('timer?test=a&locked=true=token=123', 'timer?test=a')).toBeTruthy();
  });
});

describe('generateUrlPresetOptions', () => {
  it.each([
    [
      'cloud URL',
      'test',
      'https://cloud.getontime/timer?param1=value1&param2=value2',
      {
        alias: 'test',
        target: 'timer',
        search: 'param1=value1&param2=value2',
        enabled: true,
      },
    ],
    [
      'local URL',
      'test',
      'http://localhost:4001/timer?param1=value1&param2=value2',
      {
        alias: 'test',
        target: 'timer',
        search: 'param1=value1&param2=value2',
        enabled: true,
      },
    ],
    [
      'IP-based URL',
      'test',
      'http://192.168.0.1:4001/timer?param1=value1&param2=value2',
      {
        alias: 'test',
        target: 'timer',
        search: 'param1=value1&param2=value2',
        enabled: true,
      },
    ],
  ])('should generate URL preset options for %s', (_description, alias, url, expected) => {
    expect(generateUrlPresetOptions(alias, url)).toStrictEqual(expected);
  });

  it('throws on invalid URL', () => {
    expect(() => generateUrlPresetOptions('test', 'invalid-url')).toThrow();
  });

  it('throws on on invalid route', () => {
    expect(() => generateUrlPresetOptions('test', 'www.getontime.no/somethingelse/')).toThrow();
  });
});
