import { Instant, LogLevel } from 'ontime-types';

import { formatLogLine } from '../logs.utils.js';

describe('formatLogLine()', () => {
  it('writes an entry as one line with its local time, level, origin and text', () => {
    const line = formatLogLine({
      at: Date.UTC(2026, 9, 11, 18, 14, 3, 120) as Instant,
      level: LogLevel.Warn,
      origin: 'AUTOMATION',
      text: 'OSC send failed error="first\nsecond"',
    });

    expect(line).toBe('2026-10-11T20:14:03.120+02:00 WARN AUTOMATION OSC send failed error="first second"\n');
  });
});
