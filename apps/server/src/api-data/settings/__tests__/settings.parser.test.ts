import { Settings } from 'ontime-types';

import { parseSettings } from '../settings.parser.js';

describe('parseSettings()', () => {
  it('throws if settings object does not exist', () => {
    expect(() => parseSettings({})).toThrow();
  });

  it('returns an a base model as long as we have the app version', () => {
    const result = parseSettings({ settings: { version: '1' } as Settings });
    expect(result).toBeTypeOf('object');
    expect(result).toMatchObject({
      version: expect.any(String),
      serverPort: 4001,
      editorKey: null,
      operatorKey: null,
      timeFormat: '24',
      language: 'en',
    });
  });
});
