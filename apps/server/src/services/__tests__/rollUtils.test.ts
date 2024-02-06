import { OntimeEvent } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import { getRollTimers, normaliseEndTime, sortArrayByProperty, updateRoll } from '../rollUtils.js';

// test sortArrayByProperty()
describe('sort simple arrays of objects', () => {
  it('sort array 1-5', () => {
    const arr1 = [{ timeStart: 1 }, { timeStart: 5 }, { timeStart: 3 }, { timeStart: 2 }, { timeStart: 4 }];

    const arr1Expected = [{ timeStart: 1 }, { timeStart: 2 }, { timeStart: 3 }, { timeStart: 4 }, { timeStart: 5 }];

    const sorted = sortArrayByProperty(arr1, 'timeStart');
    expect(sorted).toStrictEqual(arr1Expected);
  });

  it('sort array 1-5 with null', () => {
    const arr1 = [
      { timeStart: 1 },
      { timeStart: 5 },
      { timeStart: 3 },
      { timeStart: 2 },
      { timeStart: 4 },
      { timeStart: null },
    ];

    const arr1Expected = [
      { timeStart: null },
      { timeStart: 1 },
      { timeStart: 2 },
      { timeStart: 3 },
      { timeStart: 4 },
      { timeStart: 5 },
    ];

    const sorted = sortArrayByProperty(arr1, 'timeStart');
    expect(sorted).toStrictEqual(arr1Expected);
  });
});

// test getRollTimers()
describe('test that roll loads selection in right order', () => {
  const eventlist: Partial<OntimeEvent>[] = [
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

  it('if timer is at 0', () => {
    const now = 0;
    const expected = {
      nowIndex: null,
      nowId: null,
      publicIndex: null,
      nextIndex: 0,
      publicNextIndex: 4,
      timeToNext: 5,
      nextEvent: eventlist[0],
      nextPublicEvent: eventlist[4],
      currentEvent: null,
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 5', () => {
    const now = 5;
    const expected = {
      nowIndex: 0,
      nowId: eventlist[0].id,
      publicIndex: null,
      nextIndex: 1,
      publicNextIndex: 4,
      timeToNext: 5,
      nextEvent: eventlist[1],
      nextPublicEvent: eventlist[4],
      currentEvent: eventlist[0],
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 15', () => {
    const now = 15;
    const expected = {
      nowIndex: 1,
      nowId: eventlist[1].id,
      publicIndex: null,
      nextIndex: 2,
      publicNextIndex: 4,
      timeToNext: 5,
      nextEvent: eventlist[2],
      nextPublicEvent: eventlist[4],
      currentEvent: eventlist[1],
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 20', () => {
    const now = 20;
    const expected = {
      nowIndex: 2,
      nowId: eventlist[2].id,
      publicIndex: null,
      nextIndex: 3,
      publicNextIndex: 4,
      timeToNext: 10,
      nextEvent: eventlist[3],
      nextPublicEvent: eventlist[4],
      currentEvent: eventlist[2],
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 49', () => {
    const now = 49;
    const expected = {
      nowIndex: 4,
      nowId: eventlist[4].id,
      publicIndex: 4,
      nextIndex: 5,
      publicNextIndex: 6,
      timeToNext: 1,
      nextEvent: eventlist[5],
      nextPublicEvent: eventlist[6],
      currentEvent: eventlist[4],
      currentPublicEvent: eventlist[4],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 63', () => {
    const now = 63;
    const expected = {
      nowIndex: 6,
      nowId: eventlist[6].id,
      publicIndex: 6,
      nextIndex: 7,
      publicNextIndex: null,
      timeToNext: 7,
      nextEvent: eventlist[7],
      nextPublicEvent: null,
      currentEvent: eventlist[6],
      currentPublicEvent: eventlist[6],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 75', () => {
    const now = 75;
    const expected = {
      nowIndex: 7,
      nowId: eventlist[7].id,
      publicIndex: 6,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[7],
      currentPublicEvent: eventlist[6],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 100 we roll to day after', () => {
    const now = 100;
    const expected = {
      nowIndex: null,
      nowId: null,
      publicIndex: null,
      nextIndex: 0,
      publicNextIndex: 4,
      timeToNext: dayInMs - now + eventlist[0].timeStart,
      nextEvent: eventlist[0],
      nextPublicEvent: eventlist[4],
      currentEvent: null,
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('handles rolls to next day with real values', () => {
    const singleEventList: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 36000000, // 10:00
        timeEnd: 39600000, // 11:00
        isPublic: true,
      },
    ];
    const now = 64800000; // 18:00
    const expected = {
      nowIndex: null,
      nowId: null,
      publicIndex: null,
      nextIndex: 0,
      publicNextIndex: 0,
      timeToNext: dayInMs - now + singleEventList[0].timeStart,
      nextEvent: singleEventList[0],
      nextPublicEvent: singleEventList[0],
      currentEvent: null,
      currentPublicEvent: null,
    };
    const state = getRollTimers(singleEventList as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('handles rolls to next day with real values', () => {
    const singleEventList: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 36000000, // 10:00
        timeEnd: 3600000, // 01:00
        isPublic: true,
      },
    ];
    const now = 60000; // 00:01
    const expected = {
      nowIndex: 0,
      nowId: singleEventList[0].id,
      publicIndex: 0,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: singleEventList[0],
      currentPublicEvent: singleEventList[0],
    };
    const state = getRollTimers(singleEventList as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });
  it('handles rolls to next day with real values', () => {
    const singleEventList: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 36000000, // 10:00
        timeEnd: 3600000, // 01:00
        isPublic: true,
      },
    ];
    const now = 60000; // 00:01
    const expected = {
      nowIndex: 0,
      nowId: singleEventList[0].id,
      publicIndex: 0,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: singleEventList[0],
      currentPublicEvent: singleEventList[0],
    };
    const state = getRollTimers(singleEventList as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('handles roll that goes over midnight', () => {
    const singleEventList: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 72000000, // 20:00
        timeEnd: 60000, // 00:10
        isPublic: true,
      },
    ];
    const now = 6000; // 00:01
    const expected = {
      nowIndex: 0,
      nowId: singleEventList[0].id,
      publicIndex: 0,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: singleEventList[0],
      currentPublicEvent: singleEventList[0],
    };
    const state = getRollTimers(singleEventList as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });
});

// test getRollTimers()
describe('test that roll behaviour with overlapping times', () => {
  const eventlist: Partial<OntimeEvent>[] = [
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

  it('if timer is at 0', () => {
    const now = 0;
    const expected = {
      nowIndex: null,
      nowId: null,
      publicIndex: null,
      nextIndex: 0,
      publicNextIndex: 1,
      timeToNext: 10,
      nextEvent: eventlist[0],
      nextPublicEvent: eventlist[1],
      currentEvent: null,
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 10', () => {
    const now = 10;
    const expected = {
      nowIndex: 1,
      nowId: eventlist[1].id,
      publicIndex: 1,
      nextIndex: 2,
      publicNextIndex: null,
      timeToNext: 0,
      nextEvent: eventlist[2],
      nextPublicEvent: null,
      currentEvent: eventlist[1],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 15', () => {
    const now = 15;
    const expected = {
      nowIndex: 1,
      nowId: eventlist[1].id,
      publicIndex: 1,
      nextIndex: 2,
      publicNextIndex: null,
      timeToNext: -5,
      nextEvent: eventlist[2],
      nextPublicEvent: null,
      currentEvent: eventlist[1],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 20', () => {
    const now = 20;
    const expected = {
      nowIndex: 2,
      nowId: eventlist[2].id,
      publicIndex: 1,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[2],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 25', () => {
    const now = 25;
    const expected = {
      nowIndex: 2,
      nowId: eventlist[2].id,
      publicIndex: 1,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[2],
      currentPublicEvent: eventlist[1],
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });
});

// test getRollTimers() on issue #58
describe('test that roll behaviour multi day event edge cases', () => {
  it('if the start time is the day after end time, and start time is earlier than now', () => {
    const now = 66600000; // 19:30
    const eventlist: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 66000000, // 19:20
        timeEnd: 54600000, // 16:10
        isPublic: false,
      },
    ];
    const expected = {
      nowIndex: 0,
      nowId: '1',
      publicIndex: null,
      nextIndex: null,
      publicNextIndex: null,
      timeToNext: null,
      nextEvent: null,
      nextPublicEvent: null,
      currentEvent: eventlist[0],
      currentPublicEvent: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });

  it('if the start time is the day after end time, and both are later than now', () => {
    const now = 66840000; // 19:34
    const eventlist: Partial<OntimeEvent>[] = [
      {
        id: '1',
        timeStart: 67200000, // 19:40
        timeEnd: 66900000, // 19:35
        isPublic: false,
      },
    ];
    const expected = {
      currentEvent: {
        id: '1',
        isPublic: false,
        timeEnd: 66900000,
        timeStart: 67200000,
      },
      currentPublicEvent: null,
      nextEvent: null,
      nextIndex: null,
      nextPublicEvent: null,
      nowId: '1',
      nowIndex: 0,
      publicIndex: null,
      publicNextIndex: null,
      timeToNext: null,
    };

    const state = getRollTimers(eventlist as OntimeEvent[], now);
    expect(state).toStrictEqual(expected);
  });
});

// test getRollTimers() on issue #757
describe('it handles timeEnd over day', () => {
  it('ignores events with timeEnd larger than a day', () => {
    const testRundown = [
      {
        title: 'Setup',
        subtitle: '',
        presenter: '',
        note: 'BMA, Nebelfluid, Shooter, Akkus, UHF11, Getränke, Kaffee, Strom, ELA, Text für Holger',
        endAction: 'play-next',
        timerType: 'count-down',
        timeStart: 66600000,
        timeEnd: 68400000,
        duration: 1800000,
        isPublic: false,
        skip: false,
        colour: '#2fa9e5',
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        type: 'event',
        revision: 0,
        cue: 'PRE',
        id: 'b2f8d',
      },
      {
        title: 'Künstliche Intelligenz',
        subtitle: ' -> Vorstellung Maske',
        presenter: 'Engel und Teufel',
        note: 'Melli Kleben! Sofa',
        endAction: 'play-next',
        timerType: 'count-down',
        timeStart: 86100000,
        // timeEnd: 1020000, <--- this would have been equivalent
        timeEnd: 87420000,
        duration: 1320000,
        isPublic: true,
        skip: false,
        colour: '#a8ec31',
        user0: 'UHF1 Melli (Korsett)',
        user1: 'UHF2 Reinhold (unter Flügel)',
        user2: 'UHF3 Oli (Sport-Unterhose Rechts)',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        type: 'event',
        revision: 0,
        cue: '16',
        id: '8b970',
      },
    ];

    const timeNow = 64488675; // 17:55-something

    const timers = getRollTimers(testRundown as OntimeEvent[], timeNow);
    expect(timers.currentEvent).toBeNull();
  });
});

// test normaliseEndTime() on issue #58
test('test typical scenarios', () => {
  const t1 = {
    start: 10,
    end: 20,
  };
  const t1_expected = 20;

  expect(normaliseEndTime(t1.start, t1.end)).toBe(t1_expected);

  const t2 = {
    start: 10 + dayInMs,
    end: 20,
  };
  const t2_expected = 20 + dayInMs;

  expect(normaliseEndTime(t2.start, t2.end)).toBe(t2_expected);

  const t3 = {
    start: 10,
    end: 10,
  };
  const t3_expected = 10;

  expect(normaliseEndTime(t3.start, t3.end)).toBe(t3_expected);
});

// test updateRoll()
describe('typical scenarios', () => {
  it('it updates running events correctly', () => {
    const timers = {
      selectedEventId: '1',
      current: 10,
      _finishAt: 15,
      clock: 11,
      secondaryTimer: null,
      secondaryTarget: null,
    };

    const expected = {
      updatedTimer: timers._finishAt - timers.clock,
      updatedSecondaryTimer: null,
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);

    // test that it can jump time
    timers._finishAt = 1000;
    timers.clock = 600;
    expected.updatedTimer = timers._finishAt - timers.clock;

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('it updates secondary timer', () => {
    const timers = {
      selectedEventId: null,
      current: null,
      _finishAt: null,
      clock: 11,
      secondaryTimer: 1,
      secondaryTarget: 15,
    };

    const expected = {
      updatedTimer: null,
      updatedSecondaryTimer: timers.secondaryTarget - timers.clock,
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('flags an event end', () => {
    const timers = {
      selectedEventId: '1',
      current: 10,
      _finishAt: 11,
      clock: 12,
      secondaryTimer: null,
      secondaryTarget: null,
    };

    const expected = {
      updatedTimer: -1,
      updatedSecondaryTimer: null,
      doRollLoad: true,
      isFinished: true,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('secondary events do not trigger event ends', () => {
    const timers = {
      selectedEventId: null,
      current: null,
      _finishAt: null,
      clock: 16,
      secondaryTimer: 1,
      secondaryTarget: 15,
    };

    const expected = {
      updatedTimer: null,
      updatedSecondaryTimer: timers.secondaryTarget - timers.clock,
      doRollLoad: true,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('when a secondary timer is finished, it prompts for new event load', () => {
    const timers = {
      selectedEventId: null,
      current: null,
      _finishAt: null,
      clock: 15,
      secondaryTimer: 0,
      secondaryTarget: 15,
    };

    const expected = {
      updatedTimer: null,
      updatedSecondaryTimer: timers.secondaryTarget - timers.clock,
      doRollLoad: true,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('counts over midnight', () => {
    const timers = {
      selectedEventId: '1',
      current: 25,
      _finishAt: 10 + dayInMs,
      clock: dayInMs - 10,
      secondaryTimer: null,
      secondaryTarget: null,
    };

    const expected = {
      updatedTimer: 20,
      updatedSecondaryTimer: null,
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('rolls over midnight', () => {
    const timers = {
      selectedEventId: '1',
      current: dayInMs,
      _finishAt: 10 + dayInMs,
      clock: 10,
      secondaryTimer: null,
      secondaryTarget: null,
    };

    const expected = {
      updatedTimer: dayInMs,
      updatedSecondaryTimer: null,
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });
});
