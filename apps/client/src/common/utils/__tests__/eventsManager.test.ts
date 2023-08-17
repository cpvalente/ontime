import { EndAction, OntimeEvent, SupportedEvent, TimerType } from 'ontime-types';

import { cloneEvent } from '../eventsManager';

describe('cloneEvent()', () => {
  it('creates a stem from a given event', () => {
    const original = {
      id: 'unique',
      type: SupportedEvent.Event,
      title: 'title',
      cue: 'cue',
      subtitle: 'subtitle',
      presenter: 'presenter',
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
      user0: 'user0',
      user1: 'user1',
      user2: 'user2',
      user3: 'user3',
      user4: 'user4',
      user5: 'user5',
      user6: 'user6',
      user7: 'user7',
      user8: 'user8',
      user9: 'user9',
    } as OntimeEvent;

    const cloned = cloneEvent(original);
    expect(cloned).not.toBe(original);
    // @ts-expect-error -- safeguarding this
    expect(cloned?.id).toBe(undefined);
    expect(cloned.title).toBe(original.title);
    expect(cloned.subtitle).toBe(original.subtitle);
    expect(cloned.presenter).toBe(original.presenter);
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
  });
});
