import { defaultTeleprompterSettings } from 'ontime-utils';

import { getOptionsFromParams, getTeleprompterOptions } from '../teleprompter.options';

const parse = (query: string, preset?: string) =>
  getOptionsFromParams(new URLSearchParams(query), preset === undefined ? undefined : new URLSearchParams(preset));

describe('getOptionsFromParams()', () => {
  test('booleans which default to true can be turned off', () => {
    expect(parse('readingLine=false').readingLine).toBe(false);
  });

  test('DSP-3 keeps numbers within the range the view supports, and ignores junk', () => {
    expect(parse('lineHeight=10').lineHeight).toBe(4);
    expect(parse('textWidth=5').textWidth).toBe(20);
    expect(parse('readingLinePos=many').readingLinePos).toBe(parse('').readingLinePos);
  });

  test('preset values take precedence over the search params', () => {
    expect(parse('textWidth=50&role=local', 'textWidth=60&role=remote')).toMatchObject({
      textWidth: 60,
      role: 'remote',
    });
  });

  test('LOC-1 a local view passes on only the script settings it sets, and follows the project otherwise', () => {
    expect(parse('')).toMatchObject({ scriptSearch: '', followLoaded: null, speed: 14 });
    expect(parse('script=title&charsPerLine=40&textWidth=50&playback=script&speed=25')).toMatchObject({
      scriptSearch: '?script=title&charsPerLine=40',
      followLoaded: false,
      speed: 25,
    });
  });

  test('RMT-1 CTL-1 a view has one role, and anything else is a local view', () => {
    expect(parse('role=remote').role).toBe('remote');
    expect(parse('role=controller').role).toBe('controller');
    expect(parse('role=both').role).toBe('local');
  });

  test('SET-2 remote screens and controllers are not offered the script or playback settings', () => {
    const ids = (role: 'local' | 'remote' | 'controller') =>
      getTeleprompterOptions({}, defaultTeleprompterSettings, role).flatMap((section) =>
        section.options.map((option) => option.id),
      );
    for (const id of ['script', 'charsPerLine', 'playback', 'speed']) {
      expect(ids('local')).toContain(id);
      expect(ids('remote')).not.toContain(id);
      expect(ids('controller')).not.toContain(id);
    }
  });

  test('every declared default is what parsing an empty query produces', () => {
    const parsed = parse('') as Record<string, unknown>;
    const fields = getTeleprompterOptions({}, defaultTeleprompterSettings, 'local').flatMap(
      (section) => section.options,
    );
    // a local view's script and playback settings default to the project's
    const fromProject = new Set(['script', 'heading', 'charsPerLine', 'showGroups', 'hideEmpty', 'playback']);
    for (const field of fields) {
      if (!('defaultValue' in field) || fromProject.has(field.id)) continue;
      expect({ id: field.id, value: parsed[field.id] }).toEqual({ id: field.id, value: field.defaultValue });
    }
  });
});
