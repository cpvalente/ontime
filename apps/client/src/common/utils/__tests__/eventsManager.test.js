import { formatEventList, getEventsWithDelay, trimRundown } from '../eventsManager';

describe('getEventsWithDelay function', () => {
  test('with positive delays', () => {
    const testData = [
      {
        title: 'Welcome to Ontime',
        timeStart: 28800000,
        timeEnd: 30600000,
        colour: '',
        type: 'event',
        id: '5946',
      },
      {
        duration: 60000,
        type: 'delay',
        id: '24240',
      },
      {
        title: 'Unless recalled by the OSC address',
        timeStart: 34920000,
        timeEnd: 35520000,
        colour: '',
        type: 'event',
        id: '8ee5',
      },
      {
        title: 'Use simpler times to create a timer',
        timeStart: 120000,
        timeEnd: 720000,
        colour: '',
        type: 'event',
        id: '8222',
      },
      {
        duration: 900000,
        type: 'delay',
        revision: 0,
        id: 'a386',
      },
      {
        title: 'Add delay blocks to affect all events',
        timeStart: 37320000,
        timeEnd: 38520000,
        colour: '',
        type: 'event',
        id: '6dce',
      },
      {
        title: 'Add and remove events with [+] and [-]',
        timeStart: 38520000,
        timeEnd: 45120000,
        colour: '',
        type: 'event',
        id: '2651',
      },
      {
        type: 'block',
        id: 'e6a1',
      },
      {
        title: 'And control whether they are public',
        timeStart: 46800000,
        timeEnd: 57600000,
        colour: '',
        type: 'event',
        id: '1358',
      },
    ];

    const expected = [
      {
        title: 'Welcome to Ontime',
        timeStart: 28800000,
        timeEnd: 30600000,
        colour: '',
        type: 'event',
        id: '5946',
      },
      {
        title: 'Unless recalled by the OSC address',
        timeStart: 34920000 + 60000,
        timeEnd: 35520000 + 60000,
        colour: '',
        type: 'event',
        id: '8ee5',
      },
      {
        title: 'Use simpler times to create a timer',
        timeStart: 120000 + 60000,
        timeEnd: 720000 + 60000,
        colour: '',
        type: 'event',
        id: '8222',
      },
      {
        title: 'Add delay blocks to affect all events',
        timeStart: 37320000 + 60000 + 900000,
        timeEnd: 38520000 + 60000 + 900000,
        colour: '',
        type: 'event',
        id: '6dce',
      },
      {
        title: 'Add and remove events with [+] and [-]',
        timeStart: 38520000 + 60000 + 900000,
        timeEnd: 45120000 + 60000 + 900000,
        colour: '',
        type: 'event',
        id: '2651',
      },
      {
        title: 'And control whether they are public',
        timeStart: 46800000,
        timeEnd: 57600000,
        colour: '',
        type: 'event',
        id: '1358',
      },
    ];

    expect(getEventsWithDelay(testData)).toStrictEqual(expected);
  });
  test('with negative delays', () => {
    const testData = [
      {
        duration: -20,
        type: 'delay',
        id: '24240',
      },
      {
        title: 'Welcome to Ontime',
        timeStart: 100,
        timeEnd: 200,
        colour: '',
        type: 'event',
        id: '5946',
      },
    ];

    const expected = [
      {
        title: 'Welcome to Ontime',
        timeStart: 80,
        timeEnd: 180,
        colour: '',
        type: 'event',
        id: '5946',
      },
    ];

    expect(getEventsWithDelay(testData)).toStrictEqual(expected);
  });
});

describe('getEventsWithDelay edge cases', () => {
  it('ensures time start cannot be below 0', () => {
    const testData = [
      {
        duration: -200,
        type: 'delay',
        id: '24240',
      },
      {
        title: 'Welcome to Ontime',
        timeStart: 10,
        timeEnd: 20,
        colour: '',
        type: 'event',
        id: '5946',
      },
    ];

    const expected = [
      {
        title: 'Welcome to Ontime',
        timeStart: 0,
        timeEnd: 0,
        colour: '',
        type: 'event',
        id: '5946',
      },
    ];

    expect(getEventsWithDelay(testData)).toStrictEqual(expected);
  });
  it('does not modify original array', () => {
    const testData = [
      {
        duration: 10,
        type: 'delay',
        id: '24240',
      },
      {
        title: 'Welcome to Ontime',
        timeStart: 10,
        timeEnd: 20,
        colour: '',
        type: 'event',
        id: '5946',
      },
    ];

    const expected = [
      {
        title: 'Welcome to Ontime',
        timeStart: 20,
        timeEnd: 30,
        colour: '',
        type: 'event',
        id: '5946',
      },
    ];

    const expectedSafe = [
      {
        title: 'Welcome to Ontime',
        timeStart: 20,
        timeEnd: 30,
        colour: '',
        type: 'event',
        id: '5946',
      },
    ];

    expect(getEventsWithDelay(testData)).toStrictEqual(expected);
    expect(getEventsWithDelay(expectedSafe)).toStrictEqual(expected);
  });

  it('given an empty array', () => {
    const emptyArray = {
      test: [],
      expect: [],
    };

    expect(getEventsWithDelay(emptyArray.test)).toStrictEqual(emptyArray.expect);
  });

  it('given an undefined object', () => {
    const withUndefined = {
      test: undefined,
      expect: [],
    };

    expect(getEventsWithDelay(withUndefined.test)).toStrictEqual(withUndefined.expect);
  });

  it('given a corrupted event object', () => {
    const testData = [
      {
        title: 'Welcome to Ontime',
        timeEnd: 30600000,
        colour: '',
        type: 'event',
        id: '5946',
      },
      {
        duration: 60000,
        type: 'delay',
        id: '24240',
      },
      {
        title: 'Unless recalled by the OSC address',
        timeStart: 34920000,
        timeEnd: 35520000,
        colour: '',
        type: 'event',
        id: '8ee5',
      },
    ];
    const expected = [
      {
        title: 'Welcome to Ontime',
        timeEnd: 30600000,
        colour: '',
        type: 'event',
        id: '5946',
      },
      {
        title: 'Unless recalled by the OSC address',
        timeStart: 34920000 + 60000,
        timeEnd: 35520000 + 60000,
        colour: '',
        type: 'event',
        id: '8ee5',
      },
    ];

    expect(getEventsWithDelay(testData)).toStrictEqual(expected);
  });

  it('given a corrupted delay object', () => {
    const testData = [
      {
        title: 'Welcome to Ontime',
        timeStart: 28800000,
        timeEnd: 30600000,
        colour: '',
        type: 'event',
        id: '5946',
      },
      {
        type: 'delay',
        id: '24240',
      },
      {
        title: 'Unless recalled by the OSC address',
        timeStart: 34920000,
        timeEnd: 35520000,
        colour: '',
        type: 'event',
        id: '8ee5',
      },
    ];
    const expected = [
      {
        title: 'Welcome to Ontime',
        timeStart: 28800000,
        timeEnd: 30600000,
        colour: '',
        type: 'event',
        id: '5946',
      },
      {
        title: 'Unless recalled by the OSC address',
        timeStart: 34920000,
        timeEnd: 35520000,
        colour: '',
        type: 'event',
        id: '8ee5',
      },
    ];

    expect(getEventsWithDelay(testData)).toStrictEqual(expected);
  });
});

describe('test trimEventlist function', () => {
  const limit = 8;
  const testData = [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
    { id: '7' },
    { id: '8' },
    { id: '9' },
    { id: '10' },
    { id: '11' },
    { id: '12' },
  ];

  it('when we use the first item', () => {
    const selectedId = '1';
    const expected = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
      { id: '6' },
      { id: '7' },
      { id: '8' },
    ];

    const l = trimRundown(testData, selectedId, limit);
    expect(l.length).toBe(limit);
    expect(l).toStrictEqual(expected);
  });

  it('when we use the third item', () => {
    const selectedId = '3';
    const expected = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
      { id: '6' },
      { id: '7' },
      { id: '8' },
    ];

    const l = trimRundown(testData, selectedId, limit);
    expect(l.length).toBe(limit);
    expect(l).toStrictEqual(expected);
  });

  it('when we use the fourth item', () => {
    const selectedId = '4';
    const expected = [
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
      { id: '6' },
      { id: '7' },
      { id: '8' },
      { id: '9' },
    ];

    const l = trimRundown(testData, selectedId, limit);
    expect(l.length).toBe(limit);
    expect(l).toStrictEqual(expected);
  });

  it('if selected is not found', () => {
    const selectedId = '15';
    const expected = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
      { id: '6' },
      { id: '7' },
      { id: '8' },
    ];

    const l = trimRundown(testData, selectedId, limit);
    expect(l.length).toBe(limit);
    expect(l).toStrictEqual(expected);
  });
});

describe('test formatEvents function', () => {
  const testEvent = [
    {
      title: 'Welcome to Ontime',
      subtitle: 'Subtitles are useful',
      presenter: 'cpvalente',
      note: 'Maybe a running note for the operator?',
      timeStart: 28800000,
      timeEnd: 30600000,
      isPublic: false,
      colour: '',
      type: 'event',
      revision: 0,
      id: '5946',
    },
    {
      title: 'Unless recalled by the OSC address',
      subtitle: '',
      presenter: '',
      note: 'In green, below',
      timeStart: 34800000,
      timeEnd: 35400000,
      isPublic: false,
      colour: '',
      type: 'event',
      revision: 0,
      id: '8ee5',
    },
  ];

  it('it parses correctly', () => {
    const selectedId = 'otherEvent';
    const nextId = 'notHere';
    const expected = [
      {
        id: '5946',
        time: '08:00 - 08:30',
        title: 'Welcome to Ontime',
        isNow: false,
        isNext: false,
        colour: '',
      },
      {
        id: '8ee5',
        time: '09:40 - 09:50',
        title: 'Unless recalled by the OSC address',
        isNow: false,
        isNext: false,
        colour: '',
      },
    ];

    const parsed = formatEventList(testEvent, selectedId, nextId, { showEnd: true });
    expect(parsed).toStrictEqual(expected);
  });

  it('it handles selected correctly', () => {
    const selectedId = '5946';
    const nextId = '8ee5';
    const expected = [
      {
        id: '5946',
        time: '08:00 - 08:30',
        title: 'Welcome to Ontime',
        isNow: true,
        isNext: false,
        colour: '',
      },
      {
        id: '8ee5',
        time: '09:40 - 09:50',
        title: 'Unless recalled by the OSC address',
        isNow: false,
        isNext: true,
        colour: '',
      },
    ];

    const parsed = formatEventList(testEvent, selectedId, nextId, { showEnd: true });
    expect(parsed).toStrictEqual(expected);
  });

  it('it handles next correctly', () => {
    const selectedId = '8ee5';
    const nextId = 'notHere';

    const expected = [
      {
        id: '5946',
        time: '08:00 - 08:30',
        title: 'Welcome to Ontime',
        isNow: false,
        isNext: false,
        colour: '',
      },
      {
        id: '8ee5',
        time: '09:40 - 09:50',
        title: 'Unless recalled by the OSC address',
        isNow: true,
        isNext: false,
        colour: '',
      },
    ];

    const parsed = formatEventList(testEvent, selectedId, nextId, { showEnd: true });
    expect(parsed).toStrictEqual(expected);
  });
});
