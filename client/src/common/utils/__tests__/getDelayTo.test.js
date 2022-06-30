import getDelayTo from '../getDelayTo';

describe('getDelayTo function', () => {
  it('handles list with delays', () => {
    const delayDuration = 100;
    const events = [
      { type: 'event' },
      { type: 'delay', duration: delayDuration },
      { type: 'event' },
    ];

    const notDelayed = getDelayTo(events, 0);
    expect(notDelayed).toBe(0);
    const delayedEvent = getDelayTo(events, 2);
    expect(delayedEvent).toBe(delayDuration);
  });
  it('handles list without delays', () => {
    const events = [{ type: 'event' }, { type: 'event' }];
    const notDelayed = getDelayTo(events, 1);
    expect(notDelayed).toBe(0);
  });

  it('handles list with multiple delays', () => {
    const delayDuration = 100;
    const events = [
      { type: 'event' },
      { type: 'delay', duration: delayDuration },
      { type: 'event' },
      { type: 'delay', duration: delayDuration },
      { type: 'event' },
    ];
    const doubleDelay = getDelayTo(events, 4);
    expect(doubleDelay).toBe(delayDuration * 2);
  });
  it('handles list with blocks', () => {
    const events = [
      { type: 'event' },
      { type: 'delay', duration: 100 },
      { type: 'event' },
      { type: 'block' },
      { type: 'event' },
    ];
    const notDelayed = getDelayTo(events, 4);
    expect(notDelayed).toBe(0);
  });
  it('handles index greater than list', () => {
    const events = [{ type: 'event' }, { type: 'delay', duration: 100 }, { type: 'event' }];
    const notDelayed = getDelayTo(events, 3);
    expect(notDelayed).toBe(0);
  });
  it('handles negative index (not found)', () => {
    const events = [{ type: 'event' }, { type: 'delay', duration: 100 }, { type: 'event' }];
    const notDelayed = getDelayTo(events, -1);
    expect(notDelayed).toBe(0);
  });
});
