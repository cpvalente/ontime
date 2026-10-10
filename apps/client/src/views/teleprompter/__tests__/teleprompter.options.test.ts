import { defaultTeleprompterSettings } from 'ontime-utils';

import { getOptionsFromParams, getTeleprompterOptions } from '../teleprompter.options';

const parse = (query: string) => getOptionsFromParams(new URLSearchParams(query));

describe('getOptionsFromParams()', () => {
  test('keeps numbers within the range the view supports, and ignores junk', () => {
    expect(parse('lineHeight=10').lineHeight).toBe(4);
    expect(parse('readingLinePos=many').readingLinePos).toBe(parse('').readingLinePos);
  });

  test('starts event by event unless the view reads the whole script', () => {
    expect(parse('').mode).toBe('event');
    expect(parse('mode=script').mode).toBe('script');
    expect(parse('mode=free').mode).toBe('event');
  });

  test('a view has one role, and anything else plays on its own', () => {
    expect(parse('role=controller').role).toBe('controller');
    expect(parse('role=both').role).toBe('local');
  });
});

describe('getTeleprompterOptions()', () => {
  test('the starting mode and speed are enabled only while the view plays on its own', () => {
    const fields = getTeleprompterOptions({}, defaultTeleprompterSettings).flatMap((section) => section.options);
    for (const id of ['mode', 'speed']) {
      expect(fields.find((field) => field.id === id)?.enabledWhen).toMatchObject({ id: 'role', values: ['local'] });
    }
  });

  test('every declared default is what parsing an empty query produces', () => {
    const parsed = parse('') as Record<string, unknown>;
    const fields = getTeleprompterOptions({}, defaultTeleprompterSettings).flatMap((section) => section.options);
    for (const field of fields) {
      if (!('defaultValue' in field)) continue;
      expect({ id: field.id, value: parsed[field.id] }).toEqual({ id: field.id, value: field.defaultValue });
    }
  });
});
