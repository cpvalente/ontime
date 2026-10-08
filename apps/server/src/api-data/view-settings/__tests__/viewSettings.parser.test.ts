import type { ViewSettings } from 'ontime-types';
import { defaultTeleprompterSettings } from 'ontime-utils';

import { parseTeleprompterSettings, parseViewSettings } from '../viewSettings.parser.js';

describe('parseViewSettings()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseViewSettings({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });
});

describe('parseTeleprompterSettings()', () => {
  const fallback = defaultTeleprompterSettings;

  test('SET-1 projects without teleprompter settings get the defaults', () => {
    const result = parseViewSettings({ viewSettings: { overrideStyles: false } as ViewSettings });
    expect(result.teleprompter).toEqual(defaultTeleprompterSettings);
  });

  test('reads values from a project file and from the strings of a query', () => {
    const expected = { ...fallback, script: 'custom-script', charsPerLine: 40, heading: 'cue', hideEmpty: false };
    expect(
      parseTeleprompterSettings(
        { script: 'custom-script', charsPerLine: 40, heading: 'cue', hideEmpty: false },
        fallback,
      ),
    ).toEqual(expected);
    expect(
      parseTeleprompterSettings(
        { script: 'custom-script', charsPerLine: '40', heading: 'cue', hideEmpty: 'false' },
        fallback,
      ),
    ).toEqual(expected);
  });

  test('keeps characters per line within bounds, and ignores values it cannot read', () => {
    expect(parseTeleprompterSettings({ charsPerLine: 1000 }, fallback).charsPerLine).toBe(80);
    expect(parseTeleprompterSettings({ charsPerLine: 2 }, fallback).charsPerLine).toBe(10);
    expect(parseTeleprompterSettings({ charsPerLine: 'many', heading: 'banner', showGroups: 'yes' }, fallback)).toEqual(
      fallback,
    );
  });
});
