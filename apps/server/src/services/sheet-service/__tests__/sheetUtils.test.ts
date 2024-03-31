import { EndAction, OntimeEvent, SupportedEvent, TimeStrategy, TimerType } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { getA1Notation, cellRequestFromEvent } from '../sheetUtils.js';

describe('getA1Notation()', () => {
  test('A1', () => {
    expect(getA1Notation(0, 0)).toStrictEqual('A1');
  });
  test('E3', () => {
    expect(getA1Notation(2, 4)).toStrictEqual('E3');
  });
  test('AA100', () => {
    expect(getA1Notation(99, 26)).toStrictEqual('AA100');
  });
  test('can not be negative', () => {
    expect(() => getA1Notation(-1, 1)).toThrowError('Index can not be less than 0');
  });
});

describe('cellRequestFromEvent()', () => {
  test('string to string', () => {
    const event: OntimeEvent = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      timeStrategy: TimeStrategy.LockEnd,
      linkStart: null,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      isPublic: false,
      skip: false,
      colour: 'red',
      revision: 0,
      id: '1358',
      timeWarning: 0,
      timeDanger: 0,
      custom: {},
    };
    const metadata = {
      type: { row: 1, col: 14 },
      cue: { row: 1, col: 15 },
      title: { row: 1, col: 16 },
      note: { row: 1, col: 19 },
      timeStart: { row: 1, col: 20 },
      timeEnd: { row: 1, col: 21 },
      endAction: { row: 1, col: 22 },
      timerType: { row: 1, col: 23 },
      duration: { row: 1, col: 24 },
      isPublic: { row: 1, col: 25 },
      skip: { row: 1, col: 26 },
      colour: { row: 1, col: 27 },
      revision: { row: 1, col: 38 },
      id: { row: 1, col: 39 },
      timeWarning: { row: 1, col: 40 },
      timeDanger: { row: 1, col: 41 },
    };
    const result = cellRequestFromEvent(event, 1, 1234, metadata);
    expect(result.updateCells.rows[0].values[5].userEnteredValue.stringValue).toStrictEqual(event.note);
  });

  test('number to timer', () => {
    const event: OntimeEvent = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      timeStrategy: TimeStrategy.LockEnd,
      linkStart: null,
      isPublic: false,
      skip: false,
      colour: 'red',
      revision: 0,
      id: '1358',
      timeWarning: 0,
      timeDanger: 0,
      custom: {},
    };
    const metadata = {
      type: { row: 1, col: 14 },
      cue: { row: 1, col: 15 },
      title: { row: 1, col: 16 },
      note: { row: 1, col: 19 },
      timeStart: { row: 1, col: 20 },
      timeEnd: { row: 1, col: 21 },
      endAction: { row: 1, col: 22 },
      timerType: { row: 1, col: 23 },
      duration: { row: 1, col: 24 },
      isPublic: { row: 1, col: 25 },
      skip: { row: 1, col: 26 },
      colour: { row: 1, col: 27 },
      revision: { row: 1, col: 38 },
      id: { row: 1, col: 39 },
      timeWarning: { row: 1, col: 40 },
      timeDanger: { row: 1, col: 41 },
    };
    const result = cellRequestFromEvent(event, 1, 1234, metadata).updateCells.rows[0].values[10].userEnteredValue
      .stringValue;
    expect(result).toStrictEqual(millisToString(event.duration));
  });

  test('boolean to TRUE', () => {
    const event: OntimeEvent = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      timeStrategy: TimeStrategy.LockEnd,
      linkStart: null,
      isPublic: true,
      skip: false,
      colour: 'red',
      revision: 0,
      id: '1358',
      timeWarning: 0,
      timeDanger: 0,
      custom: {},
    };
    const metadata = {
      type: { row: 1, col: 14 },
      cue: { row: 1, col: 15 },
      title: { row: 1, col: 16 },
      note: { row: 1, col: 19 },
      timeStart: { row: 1, col: 20 },
      timeEnd: { row: 1, col: 21 },
      endAction: { row: 1, col: 22 },
      timerType: { row: 1, col: 23 },
      duration: { row: 1, col: 24 },
      isPublic: { row: 1, col: 25 },
      skip: { row: 1, col: 26 },
      colour: { row: 1, col: 27 },
      revision: { row: 1, col: 38 },
      id: { row: 1, col: 39 },
      timeWarning: { row: 1, col: 40 },
      timeDanger: { row: 1, col: 41 },
    };
    const result = cellRequestFromEvent(event, 1, 1234, metadata);
    expect(result.updateCells.rows[0].values[11].userEnteredValue.boolValue).toStrictEqual(true);
    expect(result.updateCells.rows[0].values[12].userEnteredValue.boolValue).toStrictEqual(false);
  });

  test('spacing in metadata', () => {
    const event: OntimeEvent = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      timeStrategy: TimeStrategy.LockEnd,
      linkStart: null,
      duration: 10800000,
      isPublic: true,
      skip: false,
      colour: 'red',
      revision: 0,
      id: '1358',
      timeWarning: 0,
      timeDanger: 0,
      custom: {},
    };
    const metadata = {
      cue: { row: 1, col: 0 },
      title: { row: 1, col: 6 },
    };
    const result = cellRequestFromEvent(event, 1, 1234, metadata);
    expect(result.updateCells.rows[0].values[0].userEnteredValue.stringValue).toStrictEqual(event.cue);
    expect(result.updateCells.rows[0].values[6].userEnteredValue.stringValue).toStrictEqual(event.title);
  });

  test('metadata offset from zero', () => {
    const event: OntimeEvent = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      timeStrategy: TimeStrategy.LockEnd,
      linkStart: null,
      isPublic: true,
      skip: false,
      colour: 'red',
      revision: 0,
      id: '1358',
      timeWarning: 0,
      timeDanger: 0,
      custom: {},
    };
    const metadata = {
      cue: { row: 1, col: 5 },
      title: { row: 1, col: 6 },
      user0: { row: 1, col: 16 },
    };
    const result = cellRequestFromEvent(event, 1, 1234, metadata);
    expect(result.updateCells.rows[0].values[0].userEnteredValue.stringValue).toStrictEqual(event.cue);
    expect(result.updateCells.rows[0].values[1].userEnteredValue.stringValue).toStrictEqual(event.title);
  });

  test('sheet setup', () => {
    const event: OntimeEvent = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      timeStrategy: TimeStrategy.LockEnd,
      linkStart: null,
      isPublic: true,
      skip: false,
      colour: 'red',
      revision: 0,
      id: '1358',
      timeWarning: 0,
      timeDanger: 0,
      custom: {},
    };
    const metadata = {
      cue: { row: 10, col: 5 },
      title: { row: 10, col: 6 },
    };
    const result1 = cellRequestFromEvent(event, 1, 1234, metadata);
    expect(result1.updateCells.start.sheetId).toStrictEqual(1234);
    const result2 = cellRequestFromEvent(event, 10, 1234, metadata);
    expect(result2.updateCells.start.rowIndex).toStrictEqual(21);
    expect(result2.updateCells.start.columnIndex).toStrictEqual(5);
    expect(result2.updateCells.fields).toStrictEqual('userEnteredValue');
  });
});
