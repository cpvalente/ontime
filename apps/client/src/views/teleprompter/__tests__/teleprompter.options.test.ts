import { getOptionsFromParams, getTeleprompterOptions } from '../teleprompter.options';

const parse = (query: string, preset?: string) =>
  getOptionsFromParams(new URLSearchParams(query), preset === undefined ? undefined : new URLSearchParams(preset));

describe('getOptionsFromParams()', () => {
  test('booleans which default to true can be turned off', () => {
    expect(parse('hideEmpty=false&showGroups=false&followLoaded=false&readingLine=false')).toMatchObject({
      hideEmpty: false,
      showGroups: false,
      followLoaded: false,
      readingLine: false,
    });
  });

  test('keeps numbers within the range the view supports, and ignores junk', () => {
    expect(parse('speed=1000').speed).toBe(40);
    expect(parse('speed=0').speed).toBe(1);
    expect(parse('charsPerLine=many').charsPerLine).toBe(parse('').charsPerLine);
  });

  test('ignores an unknown value for an enumerated option', () => {
    expect(parse('heading=banana').heading).toBe('title');
  });

  test('preset values take precedence over the search params', () => {
    expect(parse('speed=10&script=custom-a', 'speed=20&script=custom-b')).toMatchObject({
      speed: 20,
      scriptSource: 'custom-b',
    });
  });
});

describe('getTeleprompterOptions()', () => {
  const fields = getTeleprompterOptions({}).flatMap((section) => section.options);

  test('every declared default is what parsing an empty query produces', () => {
    const parsed = getOptionsFromParams(new URLSearchParams()) as Record<string, unknown>;
    const parsedByParamId: Record<string, unknown> = { ...parsed, script: parsed.scriptSource };

    for (const field of fields) {
      if (!('defaultValue' in field) || field.defaultValue === undefined) continue;
      expect({ id: field.id, value: parsedByParamId[field.id] }).toEqual({ id: field.id, value: field.defaultValue });
    }
  });

  test('every value the editor offers survives parsing', () => {
    for (const field of fields) {
      if (field.type !== 'option' || field.id === 'script') continue;
      for (const { value } of field.values) {
        const parsed = parse(`${field.id}=${value}`) as Record<string, unknown>;
        expect({ id: field.id, value, parsed: parsed[field.id] }).toEqual({ id: field.id, value, parsed: value });
      }
    }
  });
});
