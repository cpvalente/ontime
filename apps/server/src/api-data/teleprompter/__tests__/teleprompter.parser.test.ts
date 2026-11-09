import { defaultTeleprompterSettings } from 'ontime-utils';

import { parseTeleprompter } from '../teleprompter.parser.js';

describe('parseTeleprompter()', () => {
  test('projects without teleprompter settings get the defaults', () => {
    expect(parseTeleprompter({})).toEqual(defaultTeleprompterSettings);
  });
});
