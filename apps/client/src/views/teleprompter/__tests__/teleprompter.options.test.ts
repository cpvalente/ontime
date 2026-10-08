import { getOptionsFromParams, teleprompterOptions } from '../teleprompter.options';

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

  test('every declared default is what parsing an empty query produces', () => {
    const parsed = parse('') as Record<string, unknown>;
    for (const field of teleprompterOptions.flatMap((section) => section.options)) {
      if (!('defaultValue' in field)) continue;
      expect({ id: field.id, value: parsed[field.id] }).toEqual({ id: field.id, value: field.defaultValue });
    }
  });
});
