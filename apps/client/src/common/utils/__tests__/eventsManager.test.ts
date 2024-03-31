import { EndAction, EventCustomFields, OntimeEvent, SupportedEvent, TimerType } from 'ontime-types';

import { cloneEvent } from '../eventsManager';

describe('cloneEvent()', () => {
  it('creates a stem from a given event', () => {
    const original = {
      id: 'unique',
      type: SupportedEvent.Event,
      title: 'title',
      cue: 'cue',
      note: 'note',
      timeStart: 0,
      duration: 10,
      timeEnd: 10,
      timerType: TimerType.CountDown,
      endAction: EndAction.None,
      isPublic: false,
      skip: false,
      colour: 'F00',
      revision: 10,
      timeWarning: 120000,
      timeDanger: 60000,
      custom: {
        lighting: { value: '3' },
      } as EventCustomFields,
    } as OntimeEvent;

    const cloned = cloneEvent(original);
    expect(cloned).not.toBe(original);
    // @ts-expect-error -- safeguarding this
    expect(cloned?.id).toBe(undefined);
    expect(cloned.title).toBe(original.title);
    expect(cloned.note).toBe(original.note);
    expect(cloned.endAction).toBe(original.endAction);
    expect(cloned.timerType).toBe(original.timerType);
    expect(cloned.timeStart).toBe(original.timeStart);
    expect(cloned.timeEnd).toBe(original.timeEnd);
    expect(cloned.duration).toBe(original.duration);
    expect(cloned.isPublic).toBe(original.isPublic);
    expect(cloned.skip).toBe(original.skip);
    expect(cloned.colour).toBe(original.colour);
    expect(cloned.type).toBe(SupportedEvent.Event);
    expect(cloned.revision).toBe(0);
    expect(cloned.timeWarning).toBe(original.timeWarning);
    expect(cloned.timeDanger).toBe(original.timeDanger);
    expect(cloned.custom).toStrictEqual({});
  });
});
