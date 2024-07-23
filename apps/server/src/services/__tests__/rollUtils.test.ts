import { PlayableEvent } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

import { getRollTimers } from '../rollUtils.js';

describe('getRollTimers()', () => {
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
  ] as PlayableEvent[];

  it('should roll to the day after if timer is at 100', () => {
    const now = 100;
    const expected = {
      currentEvent: null,
      currentPublicEvent: null,
      nextEvent: eventlist[0],
      nextIndex: 0,
      nextPublicEvent: eventlist[4],
      nowIndex: null,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('should be waiting to start if timer is at 0', () => {
    const now = 0;
    const expected = {
      currentEvent: null,
      currentPublicEvent: null,
      nextEvent: eventlist[0],
      nextIndex: 0,
      nextPublicEvent: eventlist[4],
      nowIndex: null,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the first event if timer is at 5', () => {
    const now = 5;
    const expected = {
      currentEvent: eventlist[0],
      currentPublicEvent: null,
      nextEvent: eventlist[1],
      nextIndex: 1,
      nextPublicEvent: eventlist[4],
      nowIndex: 0,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the second event if timer is at 15', () => {
    const now = 15;
    const expected = {
      currentEvent: eventlist[1],
      currentPublicEvent: null,
      nextEvent: eventlist[2],
      nextIndex: 2,
      nextPublicEvent: eventlist[4],
      nowIndex: 1,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the third event if timer is at 10', () => {
    const now = 20;
    const expected = {
      currentEvent: eventlist[2],
      currentPublicEvent: null,
      nextEvent: eventlist[3],
      nextIndex: 3,
      nextPublicEvent: eventlist[4],
      nowIndex: 2,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the fifth event if timer is at 49', () => {
    const now = 49;
    const expected = {
      currentEvent: eventlist[4],
      currentPublicEvent: eventlist[4],
      nextEvent: eventlist[5],
      nextIndex: 5,
      nextPublicEvent: eventlist[6],
      nowIndex: 4,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the seventh event if timer is at 63', () => {
    const now = 63;
    const expected = {
      currentEvent: eventlist[6],
      currentPublicEvent: eventlist[6],
      nextEvent: eventlist[7],
      nextIndex: 7,
      nextPublicEvent: null,
      nowIndex: 6,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('should start the seventh event if timer is at 75', () => {
    const now = 75;
    const expected = {
      currentEvent: eventlist[7],
      currentPublicEvent: eventlist[6],
      nextEvent: null,
      nextIndex: null,
      nextPublicEvent: null,
      nowIndex: 7,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });
});

describe('getRollTimers() handle edge cases with midnight', () => {
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
  ] as PlayableEvent[];

  it('should load the event in the time span', () => {
    const now = 23 * MILLIS_PER_HOUR;
    const expected = {
      currentEvent: eventlist[2],
      currentPublicEvent: eventlist[2],
      nextEvent: eventlist[3],
      nextIndex: 3,
      nextPublicEvent: eventlist[3],
      nowIndex: 2,
    };
    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  })
});

describe('getRollTimers() handle edge cases with before and after start', () => {
  it('should prepare first event, if we are not yet in the rundown start', () => {
    const now = 7 * MILLIS_PER_HOUR;
    const singleEventList = [
      {
        id: '1',
        timeStart: 10 * MILLIS_PER_HOUR,
        timeEnd: 11 * MILLIS_PER_HOUR,
        isPublic: true,
      },
    ] as PlayableEvent[];

    const expected = {
      currentEvent: null,
      currentPublicEvent: null,
      nextEvent: singleEventList[0],
      nextIndex: 0,
      nextPublicEvent: singleEventList[0],
      nowIndex: null,
    };
    const state = getRollTimers(singleEventList, now);
    expect(state).toStrictEqual(expected);
  });

  it('should prepare first event, if we are over the rundown end', () => {
    const now = 18 * MILLIS_PER_HOUR;
    const singleEventList = [
      {
        id: '1',
        timeStart: 10 * MILLIS_PER_HOUR,
        timeEnd: 11 * MILLIS_PER_HOUR,
        isPublic: true,
      },
    ] as PlayableEvent[];

    const expected = {
      currentEvent: null,
      currentPublicEvent: null,
      nextEvent: singleEventList[0],
      nextIndex: 0,
      nextPublicEvent: singleEventList[0],
      nowIndex: null,
    };
    const state = getRollTimers(singleEventList, now);
    expect(state).toStrictEqual(expected);
  });

  it('should account for a rundown that goes through midnight', () => {
    const now = 1 * MILLIS_PER_HOUR;
    const singleEventList = [
      {
        id: '1',
        timeStart: 10 * MILLIS_PER_HOUR,
        timeEnd: 2 * MILLIS_PER_HOUR,
        isPublic: true,
      },
    ] as PlayableEvent[];
    const expected = {
      currentEvent: singleEventList[0],
      currentPublicEvent: singleEventList[0],
      nextEvent: null,
      nextIndex: null,
      nextPublicEvent: null,
      nowIndex: 0,
    };
    const state = getRollTimers(singleEventList, now);
    expect(state).toStrictEqual(expected);
  });

  it('loads upcoming event while waiting to roll', () => {
    const now = 6000; // 00:01
    const singleEventList = [
      {
        id: '1',
        timeStart: 72000000, // 20:00
        timeEnd: 72010000, // 20:10
        isPublic: true,
      },
    ] as PlayableEvent[];
    const expected = {
      currentEvent: null,
      currentPublicEvent: null,
      nextEvent: singleEventList[0],
      nextIndex: 0,
      nextPublicEvent: singleEventList[0],
      nowIndex: null,
    };
    const state = getRollTimers(singleEventList, now);
    expect(state).toStrictEqual(expected);
  });
});

describe('getRollTimers() test that roll behaviour with overlapping times', () => {
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
  ] as PlayableEvent[];

  it('if timer is at 0', () => {
    const now = 0;
    const expected = {
      nowIndex: null,
      nextIndex: 0,
      nextEvent: eventlist[0],
      nextPublicEvent: eventlist[1],
      currentEvent: null,
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 10', () => {
    const now = 10;
    const expected = {
      nowIndex: 1,
      nextIndex: 2,
      nextEvent: eventlist[2],
      nextPublicEvent: null,
      currentEvent: eventlist[1],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 15', () => {
    const now = 15;
    const expected = {
      nowIndex: 1,
      nextIndex: 2,
      nextEvent: eventlist[2],
      nextPublicEvent: null,
      currentEvent: eventlist[1],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 20', () => {
    const now = 20;
    const expected = {
      nowIndex: 2,
      nextIndex: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[2],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 25', () => {
    const now = 25;
    const expected = {
      nowIndex: 2,
      nextIndex: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[2],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });
});

// issue #58
describe('getRollTimers() test that roll behaviour multi day event edge cases', () => {
  it('should recognise a playing event where its schedule spans over midnight', () => {
    const now = 66600000; // 19:30
    const eventlist = [
      {
        id: '1',
        timeStart: 66000000, // 19:20
        timeEnd: 54600000, // 16:10
        isPublic: false,
      },
    ] as PlayableEvent[];
    const expected = {
      nowIndex: 0,
      nextIndex: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[0],
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if the start time is the day after end time, and both are later than now', () => {
    const now = 66840000; // 19:34
    const eventlist = [
      {
        id: '1',
        timeStart: 67200000, // 19:40
        timeEnd: 66900000, // 19:35
        isPublic: false,
      },
    ] as PlayableEvent[];
    const expected = {
      nowIndex: 0,
      nextIndex: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: {
        id: '1',
        isPublic: false,
        timeEnd: 66900000,
        timeStart: 67200000,
      },
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist, now);
    expect(state).toStrictEqual(expected);
  });
});
