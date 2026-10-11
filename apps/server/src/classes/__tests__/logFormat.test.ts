import { formatLogEvent } from '../logFormat.js';

describe('formatLogEvent()', () => {
  it('writes the event followed by its fields', () => {
    expect(formatLogEvent('end-action', { action: 'play-next', cue: 12, late: true })).toBe(
      'end-action action=play-next cue=12 late=true',
    );
  });

  it('quotes values which would break splitting a line by field', () => {
    expect(formatLogEvent('automation.sent', { title: 'House "main" lights', target: '' })).toBe(
      'automation.sent title="House \\"main\\" lights" target=""',
    );
  });

  it('leaves out absent fields', () => {
    expect(formatLogEvent('restore.skip', { reason: 'stale', event: undefined, cue: null })).toBe(
      'restore.skip reason=stale',
    );
  });
});
