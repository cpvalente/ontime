import { EndAction, EntryCustomFields, OntimeEvent, SupportedEvent, TimerType, TimeStrategy } from 'ontime-types';

import { cloneEvent } from '../eventsManager';

describe('cloneEvent()', () => {
  it('creates a stem from a given event', () => {
    const original: OntimeEvent = {
      id: 'unique',
      type: SupportedEvent.Event,
      title: 'title',
      cue: 'cue',
      note: 'note',
      timeStart: 0,
      duration: 10,
      timeEnd: 10,
      timerType: TimerType.CountDown,
      timeStrategy: TimeStrategy.LockEnd,
      currentBlock: 'test',
      linkStart: false,
      countToEnd: false,
      endAction: EndAction.None,
      isPublic: false,
      skip: false,
      colour: 'F00',
      revision: 10,
      timeWarning: 120000,
      timeDanger: 60000,
      delay: 0,
      dayOffset: 0,
      gap: 0,
      custom: {
        lighting: '3',
      } as EntryCustomFields,
    };

    const cloned = cloneEvent(original);
    expect(cloned).not.toBe(original);
    expect(cloned.custom).not.toBe(original.custom);

    expect(cloned).toMatchObject({
      type: SupportedEvent.Event,
      title: original.title,
      note: original.note,
      timeStart: original.timeStart,
      duration: original.duration,
      timeEnd: original.timeEnd,
      timerType: original.timerType,
      timeStrategy: original.timeStrategy,
      currentBlock: 'test',
      countToEnd: original.countToEnd,
      linkStart: original.linkStart,
      endAction: original.endAction,
      isPublic: original.isPublic,
      skip: original.skip,
      colour: original.colour,
      revision: 0,
      delay: original.delay,
      dayOffset: original.dayOffset,
      gap: 0,
      timeWarning: original.timeWarning,
      timeDanger: original.timeDanger,
    });
  });
});
