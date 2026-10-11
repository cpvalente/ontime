import { defaultTeleprompterSettings } from 'ontime-utils';

import { parseTeleprompter, parseTeleprompterSettings } from '../teleprompter.parser.js';

describe('parseTeleprompterSettings()', () => {
  const fallback = defaultTeleprompterSettings;

  test('projects without teleprompter settings get the defaults', () => {
    expect(parseTeleprompter({})).toEqual(defaultTeleprompterSettings);
  });

  test('takes the values it is given', () => {
    const settings = { script: 'title', charsPerLine: 40, heading: 'none' } as const;
    expect(parseTeleprompterSettings(settings, fallback)).toEqual(settings);
  });

  test('keeps the line length within bounds, and falls back on invalid values', () => {
    expect(parseTeleprompterSettings({ charsPerLine: 1000 }, fallback).charsPerLine).toBe(80);
    expect(parseTeleprompterSettings({ charsPerLine: 'many', heading: 'banner' }, fallback)).toEqual(fallback);
  });
});
