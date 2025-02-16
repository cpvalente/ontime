import { matchRemaining } from '../templateInput.utils';

describe('matchRemaining()', () => {
  it('should return a partial string needed for autocomplete', () => {
    expect(matchRemaining('te', 'test')).toBe('st');
    expect(matchRemaining('{{{hum', '{{human}}')).toBe('an}}');
    expect(matchRemaining('send {', '{{human}}')).toBe('{human}}');

    // we should be able to match the following
    // however, the current implementation only needs to deal with strings that start with {{
    // expect(matchRemaining('{', '{{human}}')).toBe('{human}}');
    // expect(matchRemaining('{{', '{{human}}')).toBe('human}}');
  });

  it('should return an empty string if there are no matches or if it is complete', () => {
    expect(matchRemaining('test', 'another')).toBe('');
    expect(matchRemaining('test', 'test')).toBe('');
  });
});
