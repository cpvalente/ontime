import { colourToHex, CssColours, cssOrHexToColour, hexToColour, isLightColour, mixColours } from './colour.utils.js';

describe('hexToColour()', () => {
  it('parses the hex notations users can type into a colour field', () => {
    expect(hexToColour('#ff8000')).toStrictEqual({ red: 255, green: 128, blue: 0, alpha: 1 });
    expect(hexToColour('#F80')).toStrictEqual({ red: 255, green: 136, blue: 0, alpha: 1 });
  });

  it('reads the alpha channel from 4 and 8 digit hex', () => {
    expect(hexToColour('#ff000000')).toMatchObject({ red: 255, alpha: 0 });
    expect(hexToColour('#f000')).toMatchObject({ red: 255, alpha: 0 });
    expect(hexToColour('#ff0000ff')).toMatchObject({ red: 255, alpha: 1 });
  });

  it.each(['', 'ff8000', '#ff800', '#gggggg', '#ff8000ff00'])('rejects the invalid value "%s"', (value) => {
    expect(hexToColour(value)).toBeNull();
  });
});

describe('cssOrHexToColour()', () => {
  it('resolves hex values and CSS colour names regardless of case', () => {
    expect(cssOrHexToColour('#00ff00')).toStrictEqual({ red: 0, green: 255, blue: 0, alpha: 1 });
    expect(cssOrHexToColour('Red')).toStrictEqual({ red: 255, green: 0, blue: 0, alpha: 1 });
    expect(cssOrHexToColour('REBECCAPURPLE')).toStrictEqual({ red: 102, green: 51, blue: 153, alpha: 1 });
  });

  it('returns null for values that are neither hex nor a known colour name', () => {
    expect(cssOrHexToColour('not-a-colour')).toBeNull();
    expect(cssOrHexToColour('')).toBeNull();
    expect(cssOrHexToColour('#12')).toBeNull();
  });

  it('resolves every named colour users may type in the editor or a spreadsheet', () => {
    const unresolved = Object.keys(CssColours).filter((name) => cssOrHexToColour(name) === null);
    expect(unresolved).toStrictEqual([]);
  });
});

describe('colourToHex()', () => {
  it('writes an 8 digit hex including alpha', () => {
    expect(colourToHex({ red: 255, green: 128, blue: 0, alpha: 1 })).toBe('#ff8000ff');
    expect(colourToHex({ red: 0, green: 0, blue: 5, alpha: 0 })).toBe('#00000500');
  });
});

describe('isLightColour()', () => {
  it('identifies when a dark or light text is needed on top of a colour', () => {
    expect(isLightColour({ red: 255, green: 255, blue: 255, alpha: 1 })).toBe(true);
    expect(isLightColour({ red: 255, green: 255, blue: 0, alpha: 1 })).toBe(true);
    expect(isLightColour({ red: 0, green: 0, blue: 0, alpha: 1 })).toBe(false);
    expect(isLightColour({ red: 0, green: 0, blue: 128, alpha: 1 })).toBe(false);
  });
});

describe('mixColours()', () => {
  const black = { red: 0, green: 0, blue: 0, alpha: 1 };
  const white = { red: 255, green: 255, blue: 255, alpha: 1 };

  it('mixes evenly by default', () => {
    expect(mixColours(black, white)).toStrictEqual({ red: 128, green: 128, blue: 128, alpha: 1 });
  });

  it('weights the first colour by p', () => {
    expect(mixColours(black, white, 1)).toStrictEqual(black);
    expect(mixColours(black, white, 0)).toStrictEqual(white);
    expect(mixColours(black, white, 0.25)).toMatchObject({ red: 191 });
  });

  it('returns an opaque colour', () => {
    expect(mixColours({ ...black, alpha: 0.2 }, { ...white, alpha: 0.4 }).alpha).toBe(1);
  });
});
