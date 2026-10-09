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
    expect(parse('textWidth=50&remoteControl=false', 'textWidth=60&remoteControl=true')).toMatchObject({
      textWidth: 60,
      remoteControl: true,
    });
  });

  test('LOC-1 a local view passes on only the script settings it sets, and follows the project otherwise', () => {
    expect(parse('')).toMatchObject({ scriptSearch: '', followLoaded: null, speed: 14 });
    expect(parse('script=title&charsPerLine=40&textWidth=50&followLoaded=false&speed=25')).toMatchObject({
      scriptSearch: '?script=title&charsPerLine=40',
      followLoaded: false,
      speed: 25,
    });
  });

  test('every declared default is what parsing an empty query produces', () => {
    const parsed = parse('') as Record<string, unknown>;
    const fields = getTeleprompterOptions({}, defaultTeleprompterSettings).flatMap((section) => section.options);
    // a local view's script settings default to the project's, which the server applies
    const fromProject = new Set(['script', 'heading', 'charsPerLine', 'showGroups', 'hideEmpty', 'followLoaded']);
    for (const field of fields) {
      if (!('defaultValue' in field) || fromProject.has(field.id)) continue;
      expect({ id: field.id, value: parsed[field.id] }).toEqual({ id: field.id, value: field.defaultValue });
    }
  });
});
