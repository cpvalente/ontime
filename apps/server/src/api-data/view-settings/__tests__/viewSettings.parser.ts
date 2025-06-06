import { parseViewSettings } from '../viewSettings.parser.js';

describe('parseViewSettings()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseViewSettings({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });
});
