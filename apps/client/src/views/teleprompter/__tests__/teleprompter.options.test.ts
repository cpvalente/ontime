import { getOptionsFromParams, getTeleprompterOptions } from '../teleprompter.options';
import { DEFAULT_SPEED, MAX_SPEED, MIN_SPEED } from '../teleprompter.scroll';

describe('getOptionsFromParams()', () => {
  test('provides sensible defaults with no params', () => {
    const options = getOptionsFromParams(new URLSearchParams());

    expect(options).toMatchObject({
      scriptSource: 'none',
      heading: 'title',
      hideEmpty: true,
      showGroups: true,
      speed: DEFAULT_SPEED,
      followLoaded: true,
      fontSize: 52,
      lineHeight: 1.3,
      textWidth: 80,
      readingLine: true,
      readingLinePos: 25,
      flipH: false,
      flipV: false,
    });
  });

  test('reads the script source verbatim so it can be handed to getPropertyValue', () => {
    const options = getOptionsFromParams(new URLSearchParams('script=custom-prompter'));
    expect(options.scriptSource).toBe('custom-prompter');
  });

  test('booleans which default to true can be turned off', () => {
    const options = getOptionsFromParams(
      new URLSearchParams('hideEmpty=false&showGroups=false&followLoaded=false&readingLine=false'),
    );

    expect(options).toMatchObject({
      hideEmpty: false,
      showGroups: false,
      followLoaded: false,
      readingLine: false,
    });
  });

  test('booleans which default to false can be turned on', () => {
    const options = getOptionsFromParams(new URLSearchParams('flipH=true&flipV=true'));

    expect(options).toMatchObject({
      flipH: true,
      flipV: true,
    });
  });

  test('clamps the speed to the usable range', () => {
    expect(getOptionsFromParams(new URLSearchParams('speed=1000')).speed).toBe(MAX_SPEED);
    expect(getOptionsFromParams(new URLSearchParams('speed=0')).speed).toBe(MIN_SPEED);
  });

  test('falls back to the default for a non numeric value', () => {
    expect(getOptionsFromParams(new URLSearchParams('speed=fast')).speed).toBe(DEFAULT_SPEED);
    expect(getOptionsFromParams(new URLSearchParams('speed=')).speed).toBe(DEFAULT_SPEED);
    expect(getOptionsFromParams(new URLSearchParams('fontSize=huge')).fontSize).toBe(52);
  });

  test('rejects an unknown value for an enumerated option', () => {
    expect(getOptionsFromParams(new URLSearchParams('heading=banana')).heading).toBe('title');
  });

  test('preset values take precedence over the search params', () => {
    const options = getOptionsFromParams(
      new URLSearchParams('speed=10&script=custom-a'),
      new URLSearchParams('speed=20&script=custom-b'),
    );

    expect(options.speed).toBe(20);
    expect(options.scriptSource).toBe('custom-b');
  });
});

describe('getTeleprompterOptions()', () => {
  test('every declared default is what parsing an empty query produces', () => {
    const parsed = getOptionsFromParams(new URLSearchParams()) as Record<string, unknown>;
    const parsedByParamId: Record<string, unknown> = { ...parsed, script: parsed.scriptSource };

    const declared = getTeleprompterOptions({}).flatMap((section) => section.options);
    expect(declared.length).toBeGreaterThan(0);

    for (const field of declared) {
      if (!('defaultValue' in field) || field.defaultValue === undefined) continue;
      const expected = field.defaultValue;
      expect({ id: field.id, value: parsedByParamId[field.id] }).toEqual({ id: field.id, value: expected });
    }
  });
});

describe('option value round trip', () => {
  test('every value the editor offers survives parsing', () => {
    const selects = getTeleprompterOptions({})
      .flatMap((section) => section.options)
      .filter((field) => field.type === 'option' && field.id !== 'script');

    expect(selects.length).toBeGreaterThan(0);

    for (const field of selects) {
      for (const { value } of field.values) {
        const parsed = getOptionsFromParams(new URLSearchParams(`${field.id}=${value}`)) as Record<string, unknown>;
        expect({ id: field.id, value, parsed: parsed[field.id] }).toEqual({ id: field.id, value, parsed: value });
      }
    }
  });
});
