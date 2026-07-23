import { Settings } from 'ontime-types';

import { parseSettings } from '../settings.parser.js';

describe('parseSettings()', () => {
  it('throws if settings object does not exist', () => {
    expect(() => parseSettings({})).toThrow('ERROR: unable to parse settings, missing or incorrect version');
  });

  it('returns an a base model as long as we have the app version', () => {
    const result = parseSettings({ settings: { version: '1' } as Settings });
    expect(result).toBeTypeOf('object');
    expect(result).toMatchObject({
      version: expect.any(String),
      editorKey: null,
      operatorKey: null,
      timeFormat: '24',
      language: 'en',
      auxTimerNames: ['', '', ''],
    });
  });

  it('carries custom aux timer names through and normalises to a length-3 array', () => {
    const result = parseSettings({
      settings: { version: '1', auxTimerNames: ['Speaker'] } as unknown as Settings,
    });
    expect(result.auxTimerNames).toStrictEqual(['Speaker', '', '']);
  });

  it('falls back to defaults when aux timer names are missing or malformed', () => {
    const result = parseSettings({
      settings: { version: '1', auxTimerNames: 'not-an-array' } as unknown as Settings,
    });
    expect(result.auxTimerNames).toStrictEqual(['', '', '']);
  });
});
