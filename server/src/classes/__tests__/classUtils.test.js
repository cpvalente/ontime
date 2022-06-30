import {
  DAY_TO_MS,
  getSelectionByRoll,
  normaliseEndTime,
  replacePlaceholder,
  sortArrayByProperty,
  updateRoll,
} from '../classUtils.js';

// test sortArrayByProperty()
describe('sort simple arrays of objects', () => {
  it('sort array 1-5', () => {
    const arr1 = [
      { timeStart: 1 },
      { timeStart: 5 },
      { timeStart: 3 },
      { timeStart: 2 },
      { timeStart: 4 },
    ];

    const arr1Expected = [
      { timeStart: 1 },
      { timeStart: 2 },
      { timeStart: 3 },
      { timeStart: 4 },
      { timeStart: 5 },
    ];

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

// test getSelectionByRoll()
describe('test that roll loads selection in right order', () => {
  const eventlist = [
    {
      id: 1,
      timeStart: 5,
      timeEnd: 10,
      isPublic: false,
    },
    {
      id: 2,
      timeStart: 10,
      timeEnd: 20,
      isPublic: false,
    },
    {
      id: 3,
      timeStart: 20,
      timeEnd: 30,
      isPublic: false,
    },
    {
      id: 4,
      timeStart: 30,
      timeEnd: 40,
      isPublic: false,
    },
    {
      id: 5,
      timeStart: 40,
      timeEnd: 50,
      isPublic: true,
    },
    {
      id: 6,
      timeStart: 50,
      timeEnd: 60,
      isPublic: false,
    },
    {
      id: 7,
      timeStart: 60,
      timeEnd: 70,
      isPublic: true,
    },
    {
      id: 8,
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
      timers: null,
      timeToNext: 5,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 5', () => {
    const now = 5;
    const expected = {
      nowIndex: 0,
      nowId: 1,
      publicIndex: null,
      nextIndex: 1,
      publicNextIndex: 4,
      timers: {
        _finishAt: 10,
        _startedAt: 5,
        current: 5,
        duration: 5,
      },
      timeToNext: 5,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 15', () => {
    const now = 15;
    const expected = {
      nowIndex: 1,
      nowId: 2,
      publicIndex: null,
      nextIndex: 2,
      publicNextIndex: 4,
      timers: {
        _finishAt: 20,
        _startedAt: 10,
        current: 5,
        duration: 10,
      },
      timeToNext: 5,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 20', () => {
    const now = 20;
    const expected = {
      nowIndex: 2,
      nowId: 3,
      publicIndex: null,
      nextIndex: 3,
      publicNextIndex: 4,
      timers: {
        _startedAt: 20,
        _finishAt: 30,
        current: 10,
        duration: 10,
      },
      timeToNext: 10,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 49', () => {
    const now = 49;
    const expected = {
      nowIndex: 4,
      nowId: 5,
      publicIndex: 4,
      nextIndex: 5,
      publicNextIndex: 6,
      timers: {
        _startedAt: 40,
        _finishAt: 50,
        current: 1,
        duration: 10,
      },
      timeToNext: 1,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 63', () => {
    const now = 63;
    const expected = {
      nowIndex: 6,
      nowId: 7,
      publicIndex: 6,
      nextIndex: 7,
      publicNextIndex: null,
      timers: {
        _startedAt: 60,
        _finishAt: 70,
        current: 7,
        duration: 10,
      },
      timeToNext: 7,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 75', () => {
    const now = 75;
    const expected = {
      nowIndex: 7,
      nowId: 8,
      publicIndex: 6,
      nextIndex: null,
      publicNextIndex: null,
      timers: {
        _startedAt: 70,
        _finishAt: 80,
        current: 5,
        duration: 10,
      },
      timeToNext: null,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 100', () => {
    const now = 100;
    const expected = {
      nowIndex: null,
      nowId: null,
      publicIndex: null,
      nextIndex: 0,
      publicNextIndex: 4,
      timers: null,
      timeToNext: DAY_TO_MS - now + eventlist[0].timeStart,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('handles rolls to next day with real values', () => {
    const singleEventList = [
      {
        id: 1,
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
      timers: null,
      timeToNext: DAY_TO_MS - now + singleEventList[0].timeStart,
    };
    const state = getSelectionByRoll(singleEventList, now);
    expect(state).toStrictEqual(expected);
  });
});

// test getSelectionByRoll()
describe('test that roll behaviour with overlapping times', () => {
  const eventlist = [
    {
      id: 1,
      timeStart: 10,
      timeEnd: 10,
      isPublic: false,
    },
    {
      id: 2,
      timeStart: 10,
      timeEnd: 20,
      isPublic: true,
    },
    {
      id: 3,
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
      timers: null,
      timeToNext: 10,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 10', () => {
    const now = 10;
    const expected = {
      nowIndex: 1,
      nowId: 2,
      publicIndex: 1,
      nextIndex: 2,
      publicNextIndex: null,
      timers: {
        _finishAt: 20,
        _startedAt: 10,
        current: 10,
        duration: 10,
      },
      timeToNext: 0,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 15', () => {
    const now = 15;
    const expected = {
      nowIndex: 1,
      nowId: 2,
      publicIndex: 1,
      nextIndex: 2,
      publicNextIndex: null,
      timers: {
        _startedAt: 10,
        _finishAt: 20,
        current: 5,
        duration: 10,
      },
      timeToNext: -5,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 20', () => {
    const now = 20;
    const expected = {
      nowIndex: 2,
      nowId: 3,
      publicIndex: 1,
      nextIndex: null,
      publicNextIndex: null,
      timers: {
        _startedAt: 10,
        _finishAt: 30,
        current: 10,
        duration: 20,
      },
      timeToNext: null,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if timer is at 25', () => {
    const now = 25;
    const expected = {
      nowIndex: 2,
      nowId: 3,
      publicIndex: 1,
      nextIndex: null,
      publicNextIndex: null,
      timers: {
        _startedAt: 10,
        _finishAt: 30,
        current: 5,
        duration: 20,
      },
      timeToNext: null,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });
});

// test replacePlaceholder()
describe('test that it replaces data correctly', () => {
  const values = {
    $timer: 'timer',
    $title: 'title',
    $presenter: 'presenter',
    $subtitle: 'subtitle',
    '$next-title': 'next title',
    '$next-presenter': 'next presenter',
    '$next-subtitle': 'next subtitle',
  };

  it('replaces timer', () => {
    const test = '___1232132 $timer';
    const expected = '___1232132 timer';
    const s = replacePlaceholder(test, values);
    expect(s).toBe(expected);
  });

  it('replaces title', () => {
    const test = '___1232132 $title';
    const expected = '___1232132 title';
    const s = replacePlaceholder(test, values);
    expect(s).toBe(expected);
  });

  it('replaces presenter', () => {
    const test = '___1232132 $presenter';
    const expected = '___1232132 presenter';
    const s = replacePlaceholder(test, values);
    expect(s).toBe(expected);
  });

  it('replaces subtitle', () => {
    const test = '___1232132 $subtitle';
    const expected = '___1232132 subtitle';
    const s = replacePlaceholder(test, values);
    expect(s).toBe(expected);
  });

  it('replaces next next title', () => {
    const test = '___1232132 $next-title';
    const expected = '___1232132 next title';
    const s = replacePlaceholder(test, values);
    expect(s).toBe(expected);
  });

  it('replaces next presenter', () => {
    const test = '___1232132 $next-presenter';
    const expected = '___1232132 next presenter';
    const s = replacePlaceholder(test, values);
    expect(s).toBe(expected);
  });

  it('replaces next subtitle', () => {
    const test = '___1232132 $next-subtitle';
    const expected = '___1232132 next subtitle';
    const s = replacePlaceholder(test, values);
    expect(s).toBe(expected);
  });
});

// test getSelectionByRoll() on issue #58
describe('test that roll behaviour multi day event edge cases', () => {
  it('if the start time is the day after end time, and start time is earlier than now', () => {
    const now = 66600000; // 19:30
    const eventlist = [
      {
        id: 1,
        timeStart: 66000000, // 19:20
        timeEnd: 54600000, // 16:10
        isPublic: false,
      },
    ];
    const expected = {
      nowIndex: 0,
      nowId: 1,
      publicIndex: null,
      nextIndex: null,
      publicNextIndex: null,
      timers: {
        _startedAt: eventlist[0].timeStart,
        _finishAt: eventlist[0].timeEnd,
        current: eventlist[0].timeEnd + DAY_TO_MS - now,
        duration: DAY_TO_MS - eventlist[0].timeStart + eventlist[0].timeEnd,
      },
      timeToNext: null,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
  });

  it('if the start time is the day after end time, and both are later than now', () => {
    const now = 66840000; // 19:34
    const eventlist = [
      {
        id: 1,
        timeStart: 67200000, // 19:40
        timeEnd: 66900000, // 19:35
        isPublic: false,
      },
    ];
    const expected = {
      nowIndex: null,
      nowId: null,
      publicIndex: null,
      nextIndex: 0,
      publicNextIndex: null,
      timers: null,
      timeToNext: eventlist[0].timeStart - now,
    };

    const state = getSelectionByRoll(eventlist, now);
    expect(state).toStrictEqual(expected);
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
    start: 10 + DAY_TO_MS,
    end: 20,
  };
  const t2_expected = 20 + DAY_TO_MS;

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
      selectedEventId: 1,
      current: 10,
      _finishAt: 15,
      clock: 11,
      secondaryTimer: null,
      _secondaryTarget: null,
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
      _secondaryTarget: 15,
    };

    const expected = {
      updatedTimer: null,
      updatedSecondaryTimer: timers._secondaryTarget - timers.clock,
      doRollLoad: false,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });

  it('flags an event end', () => {
    const timers = {
      selectedEventId: 1,
      current: 10,
      _finishAt: 11,
      clock: 12,
      secondaryTimer: null,
      _secondaryTarget: null,
    };

    const expected = {
      updatedTimer: timers._finishAt - timers.clock,
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
      _secondaryTarget: 15,
    };

    const expected = {
      updatedTimer: null,
      updatedSecondaryTimer: timers._secondaryTarget - timers.clock,
      doRollLoad: true,
      isFinished: false,
    };

    expect(updateRoll(timers)).toStrictEqual(expected);
  });
});
