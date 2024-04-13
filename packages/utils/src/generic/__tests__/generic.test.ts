import { obfuscate, unobfuscate } from '../generic.js';

describe('obfuscate and unobfuscate', () => {
  it('should return the obfuscated string', () => {
    const str = 'abc123';
    const obfuscated = obfuscate(str);
    expect(obfuscated).not.toBe(str);
    expect(obfuscated.startsWith('_')).toBe(true);
  });

  it('should return the original string after obfuscating and unobfuscating', () => {
    const str = 'abc123';
    const obfuscated = obfuscate(str);
    const unobfuscated = unobfuscate(obfuscated);
    expect(unobfuscated).toBe(str);
    expect(unobfuscated.startsWith('_')).toBe(false);
  });
});
