import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

import { loadRoll } from '../rollUtils.js';
import { prepareTimedEvents, makeOntimeEvent } from '../../api-data/rundown/__mocks__/rundown.mocks.js';

describe('loadRoll()', () => {
  const eventlist = [
    {
      id: '1',
      timeStart: 5,
      timeEnd: 10,
      isPublic: false,
    },
    {
      id: '2',
      timeStart: 10,
      timeEnd: 20,
      isPublic: false,
    },
    {
      id: '3',
      timeStart: 20,
      timeEnd: 30,
      isPublic: false,
    },
    {
      id: '4',
      timeStart: 30,
      timeEnd: 40,
      isPublic: false,
    },
    {
      id: '5',
      timeStart: 40,
      timeEnd: 50,
      isPublic: true,
    },
    {
      id: '6',
      timeStart: 50,
      timeEnd: 60,
      isPublic: false,
    },
    {
      id: '7',
      timeStart: 60,
      timeEnd: 70,
      isPublic: true,
    },
    {
      id: '8',
      timeStart: 70,
      timeEnd: 80,
      isPublic: false,
    },
  ];
  const timedEvents = prepareTimedEvents(eventlist);

  it('should roll to the day after if timer is at 100', () => {
    const now = 100;
    const expected = {
      event: timedEvents[0],
      index: 0,
      isPending: true,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('should be waiting to start if timer is at 0', () => {
    const now = 0;
    const expected = {
      event: timedEvents[0],
      index: 0,
      isPending: true,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the first event if timer is at 5', () => {
    const now = 5;
    const expected = {
      event: timedEvents[0],
      index: 0,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the second event if timer is at 15', () => {
    const now = 15;
    const expected = {
      event: timedEvents[1],
      index: 1,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the third event if timer is at 10', () => {
    const now = 20;
    const expected = {
      event: timedEvents[2],
      index: 2,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the fifth event if timer is at 49', () => {
    const now = 49;
    const expected = {
      event: timedEvents[4],
      index: 4,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the seventh event if timer is at 63', () => {
    const now = 63;
    const expected = {
      event: timedEvents[6],
      index: 6,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the eight event if timer is at 75', () => {
    const now = 75;
    const expected = {
      event: timedEvents[7],
      index: 7,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });
});

describe('loadRoll() handle edge cases with midnight', () => {
  it('should find an event that crosses midnight', () => {
    const now = 23 * MILLIS_PER_HOUR;
    const eventlist = [
      {
        id: '0',
        timeStart: 9 * MILLIS_PER_HOUR,
        timeEnd: 10 * MILLIS_PER_HOUR,
        isPublic: true,
      },
      {
        id: '1',
        timeStart: 20 * MILLIS_PER_HOUR,
        timeEnd: 22 * MILLIS_PER_HOUR,
        isPublic: true,
      },
      {
        id: '2',
        timeStart: 22 * MILLIS_PER_HOUR,
        timeEnd: 1 * MILLIS_PER_HOUR,
        isPublic: true,
      },
      {
        id: '3',
        timeStart: 1 * MILLIS_PER_HOUR,
        timeEnd: 1 * MILLIS_PER_HOUR + 10 * MILLIS_PER_MINUTE,
        isPublic: true,
      },
      {
        id: '4',
        timeStart: 1 * MILLIS_PER_HOUR,
        timeEnd: 2 * MILLIS_PER_HOUR,
        isPublic: true,
      },
    ];
    const timedEvents = prepareTimedEvents(eventlist);

    const expected = {
      event: timedEvents[2],
      index: 2,
    };
    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('should not skip to the second day', () => {
    /**
     * NOTE: this is a potentially contentious decision
     *
     * The idea here is that it makes no sense for us to jump to the second / third day on activating roll
     * if the user wants to skip a portion of the rundown, they can manually jump to the event and activate roll
     *
     * On our side, this simplifies logic and makes behaviour more predictable
     */
    const now = 8 * MILLIS_PER_HOUR;
    const eventlist = [
      {
        id: '0',
        timeStart: 21 * MILLIS_PER_HOUR,
        timeEnd: 22 * MILLIS_PER_HOUR,
      },
      {
        id: '1',
        timeStart: 22 * MILLIS_PER_HOUR,
        timeEnd: 3 * MILLIS_PER_HOUR,
      },
      {
        id: '2',
        timeStart: 3 * MILLIS_PER_HOUR,
        timeEnd: 10 * MILLIS_PER_HOUR,
      },
    ];
    const timedEvents = prepareTimedEvents(eventlist);
    const expected = {
      event: timedEvents[0],
      index: 0,
      isPending: true,
    };
    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });
});

describe('loadRoll() handle rundowns with several days', () => {
  it('should find the correct event, when we have many days', () => {
    const now = 11 * MILLIS_PER_HOUR + 30 * MILLIS_PER_MINUTE;
    const timedEvents = [
      {
        id: '0',
        timeStart: 10 * MILLIS_PER_HOUR,
        timeEnd: 11 * MILLIS_PER_HOUR,
      },
      {
        id: '2',
        timeStart: 11 * MILLIS_PER_HOUR,
        timeEnd: 12 * MILLIS_PER_HOUR,
      },
      {
        id: '3',
        timeStart: 12 * MILLIS_PER_HOUR,
        timeEnd: 13 * MILLIS_PER_HOUR,
      },
      {
        id: '4',
        timeStart: 11 * MILLIS_PER_HOUR,
        timeEnd: 12 * MILLIS_PER_HOUR,
      },
    ];

    const state = loadRoll(prepareTimedEvents(timedEvents), now);
    const expected = {
      event: timedEvents[1],
      index: 1,
    };
    expect(state).toMatchObject(expected);
  });

  it('should find the correct event, when we have events of zero duration', () => {
    const now = 20 * MILLIS_PER_HOUR + 37 * MILLIS_PER_MINUTE;
    const timedEvents = [
      {
        id: '0',
        timeStart: 18 * MILLIS_PER_HOUR,
        timeEnd: 19 * MILLIS_PER_HOUR,
      },
      {
        id: '1 no duration',
        timeStart: 0,
        timeEnd: 0,
      },
      {
        id: '2',
        timeStart: 19 * MILLIS_PER_HOUR,
        timeEnd: 20 * MILLIS_PER_HOUR,
      },
      {
        id: '3 no duration',
        timeStart: 0,
        timeEnd: 0,
      },
      {
        id: '4',
        timeStart: 20 * MILLIS_PER_HOUR,
        timeEnd: 21 * MILLIS_PER_HOUR,
      },
    ];

    const state = loadRoll(prepareTimedEvents(timedEvents), now);
    const expected = {
      event: timedEvents[4],
      index: 4,
    };
    expect(state).toMatchObject(expected);
  });
});

describe('loadRoll() handle edge cases with before and after start', () => {
  it('should prepare first event, if we are not yet in the rundown start', () => {
    const now = 7 * MILLIS_PER_HOUR;
    const singleEventList = [
      makeOntimeEvent({
        id: '1',
        timeStart: 10 * MILLIS_PER_HOUR,
        timeEnd: 11 * MILLIS_PER_HOUR,
        isPublic: true,
      }),
    ];

    const expected = {
      event: singleEventList[0],
      index: 0,
      isPending: true,
    };
    const state = loadRoll(singleEventList, now);
    expect(state).toStrictEqual(expected);
  });

  it('should prepare first event, if we are over the rundown end', () => {
    const now = 18 * MILLIS_PER_HOUR;
    const singleEventList = [
      makeOntimeEvent({
        id: '1',
        timeStart: 10 * MILLIS_PER_HOUR,
        timeEnd: 11 * MILLIS_PER_HOUR,
        isPublic: true,
      }),
    ];

    const expected = {
      event: singleEventList[0],
      index: 0,
      isPending: true,
    };
    const state = loadRoll(singleEventList, now);
    expect(state).toStrictEqual(expected);
  });

  it('should account for a rundown that goes through midnight', () => {
    const now = 1 * MILLIS_PER_HOUR;
    const singleEventList = [
      makeOntimeEvent({
        id: '1',
        timeStart: 10 * MILLIS_PER_HOUR,
        timeEnd: 2 * MILLIS_PER_HOUR,
        isPublic: true,
      }),
    ];
    const expected = {
      event: singleEventList[0],
      index: 0,
    };
    const state = loadRoll(singleEventList, now);
    expect(state.isPending).toBeUndefined(); // we are playing the event
    expect(state).toStrictEqual(expected);
  });

  it('loads upcoming event while waiting to roll', () => {
    const now = 6000; // 00:01
    const singleEventList = [
      makeOntimeEvent({
        id: '1',
        timeStart: 72000000, // 20:00
        timeEnd: 72010000, // 20:10
        isPublic: true,
      }),
    ];
    const expected = {
      event: singleEventList[0],
      index: 0,
      isPending: true,
    };
    const state = loadRoll(singleEventList, now);
    expect(state).toStrictEqual(expected);
  });
});

describe('loadRoll() test that roll behaviour with overlapping times', () => {
  const eventlist = [
    {
      id: '1',
      timeStart: 10,
      timeEnd: 10,
      isPublic: false,
    },
    {
      id: '2',
      timeStart: 10,
      timeEnd: 20,
      isPublic: true,
    },
    {
      id: '3',
      timeStart: 10,
      timeEnd: 30,
      isPublic: false,
    },
  ];
  const timedEvents = prepareTimedEvents(eventlist);

  it('if timer is at 0', () => {
    const now = 0;
    const expected = {
      event: timedEvents[0],
      index: 0,
      isPending: true,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 10, it ignores events with 0 duration', () => {
    const now = 10;
    const expected = {
      event: timedEvents[1],
      index: 1,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 15', () => {
    const now = 15;
    const expected = {
      event: timedEvents[1],
      index: 1,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 20', () => {
    const now = 20;
    const expected = {
      event: timedEvents[2],
      index: 2,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 25', () => {
    const now = 25;
    const expected = {
      event: timedEvents[2],
      index: 2,
    };

    const state = loadRoll(timedEvents, now);
    expect(state).toStrictEqual(expected);
  });
});

// issue #58
describe('loadRoll() test that roll behaviour multi day event edge cases', () => {
  it('should recognise a playing event where its schedule spans over midnight', () => {
    const now = 66600000; // 19:30
    const eventlist = [
      makeOntimeEvent({
        id: '1',
        timeStart: 66000000, // 19:20
        timeEnd: 54600000, // 16:10
        isPublic: false,
      }),
    ];
    const expected = {
      event: eventlist[0],
      index: 0,
    };

    const state = loadRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if the start time is the day after end time, and both are later than now', () => {
    const now = 66840000; // 19:34
    const eventlist = [
      makeOntimeEvent({
        id: '1',
        timeStart: 67200000, // 19:40
        timeEnd: 66900000, // 19:35
        isPublic: false,
      }),
    ];
    const expected = {
      event: eventlist[0],
      index: 0,
    };

    const state = loadRoll(eventlist, now);
    expect(state.isPending).toBeUndefined(); // we are playing the event
    expect(state).toStrictEqual(expected);
  });
});
