import { OntimeEvent, SupportedEvent } from 'ontime-types';

import { formatEventList, trimRundown } from '../studioClock.utils';

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

    const l = trimRundown(testData as OntimeEvent[], selectedId, limit);
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

    const l = trimRundown(testData as OntimeEvent[], selectedId, limit);
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

    const l = trimRundown(testData as OntimeEvent[], selectedId, limit);
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

    const l = trimRundown(testData as OntimeEvent[], selectedId, limit);
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
      type: SupportedEvent.Event,
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
      type: SupportedEvent.Event,
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

    const parsed = formatEventList(testEvent as OntimeEvent[], selectedId, nextId, { showEnd: true });
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

    const parsed = formatEventList(testEvent as OntimeEvent[], selectedId, nextId, { showEnd: true });
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

    const parsed = formatEventList(testEvent as OntimeEvent[], selectedId, nextId, { showEnd: true });
    expect(parsed).toStrictEqual(expected);
  });
});
