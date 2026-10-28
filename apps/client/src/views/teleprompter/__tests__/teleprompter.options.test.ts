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

  test('only a view playing on its own shows just the loaded event', () => {
    expect(parse('onlyLoaded=true').onlyLoaded).toBe(true);
    expect(parse('onlyLoaded=true&role=remote').onlyLoaded).toBe(false);
    expect(parse('onlyLoaded=true&role=controller').onlyLoaded).toBe(false);
  });

  test('reads the project field unless the view names another', () => {
    expect(parse('').source).toBe('project');
    expect(parse('source=').source).toBe('project');
    expect(parse('source=custom-Host').source).toBe('custom-Host');
  });
});

describe('getTeleprompterOptions()', () => {
  test('every declared default is what parsing an empty query produces', () => {
    const parsed = parse('') as Record<string, unknown>;
    const fields = getTeleprompterOptions({}, defaultTeleprompterSettings).flatMap((section) => section.options);
    for (const field of fields) {
      if (!('defaultValue' in field)) continue;
      expect({ id: field.id, value: parsed[field.id] }).toEqual({ id: field.id, value: field.defaultValue });
    }
  });
});
