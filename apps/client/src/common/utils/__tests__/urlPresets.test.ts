import { OntimeView, URLPreset } from 'ontime-types';
import { Path, resolvePath } from 'react-router';

import {
  arePathsEquivalent,
  generatePathFromPreset,
  generateUrlPresetOptions,
  getCurrentPath,
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
  const presets: URLPreset[] = [
    {
      enabled: true,
      alias: 'demopage',
      target: OntimeView.Timer,
      search: 'user=guest',
      options: {},
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
      const location = resolvePath('/demopage?n=1&token=123');
      expect(getRouteFromPreset(location, presets)?.startsWith('timer?user=guest&alias=demopage')).toBeTruthy();
    });

    it('appends the feature params to the alias', () => {
      const location = resolvePath('/demopage?n=1&token=123');
      expect(getRouteFromPreset(location, presets)).toBe('timer?user=guest&alias=demopage&n=1&token=123');
    });
  });

  describe('cuesheet presets', () => {
    const cuesheetPreset: URLPreset[] = [
      {
        enabled: true,
        alias: 'cuesheet-4685d6',
        target: OntimeView.Cuesheet,
        search: '',
        options: {
          read: 'full',
          write: '-',
        },
      },
    ];
    const cuesheetPresetWithoutOptions: URLPreset[] = [
      {
        enabled: true,
        alias: 'cuesheet-basic',
        target: OntimeView.Cuesheet,
        search: '',
      },
    ];
    const cuesheetPresetWithNavLock: URLPreset[] = [
      {
        enabled: true,
        alias: 'cuesheet-locked',
        target: OntimeView.Cuesheet,
        search: 'n=1',
      },
    ];

    it('keeps cuesheet aliases masked when permissions are stored in preset options', () => {
      const location = resolvePath('/cuesheet-4685d6');
      expect(getRouteFromPreset(location, cuesheetPreset)).toBe('preset/cuesheet-4685d6');
    });

    it('preserves feature params when redirecting masked cuesheet aliases', () => {
      const location = resolvePath('/cuesheet-4685d6?n=1&token=123');
      expect(getRouteFromPreset(location, cuesheetPreset)).toBe('preset/cuesheet-4685d6?n=1&token=123');
    });

    it('keeps cuesheet aliases masked even when preset options are absent', () => {
      const location = resolvePath('/cuesheet-basic');
      expect(getRouteFromPreset(location, cuesheetPresetWithoutOptions)).toBe('preset/cuesheet-basic');
    });

    it('applies navigation lock from preset search params when alias is opened', () => {
      const location = resolvePath('/cuesheet-locked');
      expect(getRouteFromPreset(location, cuesheetPresetWithNavLock)).toBe('preset/cuesheet-locked?n=1');
    });
  });
});

describe('generatePathFromPreset()', () => {
  test.each([
    ['timer', 'user=guest', 'demopage', false, 'timer?user=guest&alias=demopage'],
    ['timer', 'user=admin', 'demopage', false, 'timer?user=admin&alias=demopage'],
  ])('generates a path from a preset: %s', (target, search, alias, locked, expected) => {
    expect(generatePathFromPreset(target, search, alias, locked, null)).toEqual(expected);
  });

  test('appends the feature params to the alias', () => {
    expect(generatePathFromPreset('timer', 'user=guest', 'demopage', true, '123')).toBe(
      'timer?user=guest&alias=demopage&n=1&token=123',
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

  it('checks whether we are in a locked preset', () => {
    expect(arePathsEquivalent('preset/minimal', 'preset/minimal?test=b')).toBeTruthy();
  });

  it('distinguishes preset paths with different lock or token params', () => {
    expect(arePathsEquivalent('preset/minimal', 'preset/minimal?n=1')).toBeFalsy();
    expect(arePathsEquivalent('preset/minimal?n=1', 'preset/minimal?n=1')).toBeTruthy();
    expect(arePathsEquivalent('preset/minimal', 'preset/minimal?token=abc')).toBeFalsy();
    expect(arePathsEquivalent('preset/minimal?n=1&token=abc', 'preset/minimal?n=1')).toBeFalsy();
    expect(arePathsEquivalent('preset/minimal?n=1&token=abc', 'preset/minimal?n=1&token=abc')).toBeTruthy();
  });

  it('considers edge cases for the url sharing feature', () => {
    expect(arePathsEquivalent('timer?test=a&n=1=token=123', 'timer?test=b')).toBeFalsy();
    expect(arePathsEquivalent('timer?test=a&n=1=token=123', 'timer?test=a')).toBeTruthy();
  });
});

describe('generateUrlPresetOptions', () => {
  it.each([
    [
      'cloud URL without protocol',
      'test',
      'www.getontime.no/timer?param1=value1&param2=value2',
      {
        alias: 'test',
        target: 'timer',
        search: 'param1=value1&param2=value2',
        enabled: true,
      },
    ],
    [
      'cloud URL',
      'test',
      'https://cloud.getontime.no/timer?param1=value1&param2=value2',
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

  it('throws on invalid route', () => {
    expect(() => generateUrlPresetOptions('test', 'www.getontime.no/somethingelse/')).toThrow();
  });
});

describe('getCurrentPath()', () => {
  test.each([
    [resolvePath('http://localhost:4001/timer'), 'timer'],
    [resolvePath('http://192.168.0.1:654321/minimal'), 'minimal'],
    [resolvePath('https://user-hosted.io/cuesheet'), 'cuesheet'],
    [resolvePath('https://cloud.getontime.no/team-hash/op'), 'op'],
    [resolvePath('https://cloud.getontime.no/team-hash/backstage/?params-with-slash=true'), 'backstage'],
    [resolvePath('https://cloud.getontime.no/team-hash/timeline?params-are-ignored=true'), 'timeline'],
  ])('resolves the current: %s', (location, expected) => {
    expect(getCurrentPath(location as Path)).toEqual(expected);
  });
});
