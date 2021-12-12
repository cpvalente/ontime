import {getEventsWithDelay} from "../eventsManager";

test('getEventsWithDelay function', () => {

  const testData = [
    {
      "title": "Welcome to Ontime",
      "timeStart": 28800000,
      "timeEnd": 30600000,
      "type": "event",
      "id": "5946"
    },
    {
      "duration": 60000,
      "type": "delay",
      "id": "24240"
    },
    {
      "title": "Unless recalled by the OSC address",
      "timeStart": 34920000,
      "timeEnd": 35520000,
      "type": "event",
      "id": "8ee5"
    },
    {
      "title": "Use simpler times to create a timer",
      "timeStart": 120000,
      "timeEnd": 720000,
      "type": "event",
      "id": "8222"
    },
    {
      "duration": 900000,
      "type": "delay",
      "revision": 0,
      "id": "a386"
    },
    {
      "title": "Add delay blocks to affect all events",
      "timeStart": 37320000,
      "timeEnd": 38520000,
      "type": "event",
      "id": "6dce"
    },
    {
      "title": "Add and remove events with [+] and [-]",
      "timeStart": 38520000,
      "timeEnd": 45120000,
      "type": "event",
      "id": "2651"
    },
    {
      "type": "block",
      "id": "e6a1"
    },
    {
      "title": "And control whether they are public",
      "timeStart": 46800000,
      "timeEnd": 57600000,
      "type": "event",
      "id": "1358"
    }
  ];

  const expected = [
    {
      "title": "Welcome to Ontime",
      "timeStart": 28800000,
      "timeEnd": 30600000,
      "type": "event",
      "id": "5946"
    },
    {
      "title": "Unless recalled by the OSC address",
      "timeStart": 34920000+60000,
      "timeEnd": 35520000+60000,
      "type": "event",
      "id": "8ee5"
    },
    {
      "title": "Use simpler times to create a timer",
      "timeStart": 120000+60000,
      "timeEnd": 720000+60000,
      "type": "event",
      "id": "8222"
    },
    {
      "title": "Add delay blocks to affect all events",
      "timeStart": 37320000+60000+900000,
      "timeEnd": 38520000+60000+900000,
      "type": "event",
      "id": "6dce"
    },
    {
      "title": "Add and remove events with [+] and [-]",
      "timeStart": 38520000+60000+900000,
      "timeEnd": 45120000+60000+900000,
      "type": "event",
      "id": "2651"
    },
    {
      "title": "And control whether they are public",
      "timeStart": 46800000,
      "timeEnd": 57600000,
      "type": "event",
      "id": "1358"
    }
  ]

  expect(getEventsWithDelay(testData)).toStrictEqual(expected);
});

describe('getEventsWithDelay edge cases', () => {

  test('given an empty array', () => {
    const emptyArray = {
      test: [],
      expect: [],
    }

    expect(getEventsWithDelay(emptyArray.test)).toStrictEqual(emptyArray.expect);
  });

  test('given an undefined object', () => {
    const withUndefined = {
      test: undefined,
      expect: [],
    }

    expect(getEventsWithDelay(withUndefined.test)).toStrictEqual(withUndefined.expect);
  });

  test('given a corrupted event object', () => {
    const testData = [
      {
        "title": "Welcome to Ontime",
        "timeEnd": 30600000,
        "type": "event",
        "id": "5946"
      },
      {
        "duration": 60000,
        "type": "delay",
        "id": "24240"
      },
      {
        "title": "Unless recalled by the OSC address",
        "timeStart": 34920000,
        "timeEnd": 35520000,
        "type": "event",
        "id": "8ee5"
      }
    ];
    const expected = [
      {
        "title": "Welcome to Ontime",
        "timeEnd": 30600000,
        "type": "event",
        "id": "5946"
      },
      {
        "title": "Unless recalled by the OSC address",
        "timeStart": 34920000+60000,
        "timeEnd": 35520000+60000,
        "type": "event",
        "id": "8ee5"
      }
    ];

    expect(getEventsWithDelay(testData)).toStrictEqual(expected);
  });

  test('given a corrupted delay object', () => {
    const testData = [
      {
        "title": "Welcome to Ontime",
        "timeStart": 28800000,
        "timeEnd": 30600000,
        "type": "event",
        "id": "5946"
      },
      {
        "type": "delay",
        "id": "24240"
      },
      {
        "title": "Unless recalled by the OSC address",
        "timeStart": 34920000,
        "timeEnd": 35520000,
        "type": "event",
        "id": "8ee5"
      }
    ];
    const expected = [
      {
        "title": "Welcome to Ontime",
        "timeStart": 28800000,
        "timeEnd": 30600000,
        "type": "event",
        "id": "5946"
      },
      {
        "title": "Unless recalled by the OSC address",
        "timeStart": 34920000,
        "timeEnd": 35520000,
        "type": "event",
        "id": "8ee5"
      }
    ];

    expect(getEventsWithDelay(testData)).toStrictEqual(expected);
  });
});
