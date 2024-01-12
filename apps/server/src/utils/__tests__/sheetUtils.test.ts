import { millisToString } from 'ontime-utils';
import { getA1Notation, cellRequestFromEvent, cellRequenstFromProjectData } from '../sheetUtils.js';
import { EndAction, OntimeRundownEntry, ProjectData, SupportedEvent, TimerType } from 'ontime-types';

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

describe('cellRequenstFromEvent()', () => {
  test('string to string', () => {
    const event: OntimeRundownEntry = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      subtitle: 'Wow',
      presenter: 'Mr. Presenter',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      isPublic: false,
      skip: false,
      colour: 'red',
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
      revision: 0,
      id: '1358',
    };
    const metadata = {
      type: { row: 1, col: 14 },
      cue: { row: 1, col: 15 },
      title: { row: 1, col: 16 },
      subtitle: { row: 1, col: 17 },
      presenter: { row: 1, col: 18 },
      note: { row: 1, col: 19 },
      timeStart: { row: 1, col: 20 },
      timeEnd: { row: 1, col: 21 },
      endAction: { row: 1, col: 22 },
      timerType: { row: 1, col: 23 },
      duration: { row: 1, col: 24 },
      isPublic: { row: 1, col: 25 },
      skip: { row: 1, col: 26 },
      colour: { row: 1, col: 27 },
      user0: { row: 1, col: 28 },
      user1: { row: 1, col: 29 },
      user2: { row: 1, col: 30 },
      user3: { row: 1, col: 31 },
      user4: { row: 1, col: 32 },
      user5: { row: 1, col: 33 },
      user6: { row: 1, col: 34 },
      user7: { row: 1, col: 35 },
      user8: { row: 1, col: 36 },
      user9: { row: 1, col: 37 },
      revision: { row: 1, col: 38 },
      id: { row: 1, col: 39 },
    };
    const result = cellRequestFromEvent(event, 1, 1234, metadata);
    expect(result.updateCells.rows[0].values[5].userEnteredValue.stringValue).toStrictEqual(event.note);
  });

  test('numer to timer', () => {
    const event: OntimeRundownEntry = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      subtitle: 'Wow',
      presenter: 'Mr. Presenter',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      isPublic: false,
      skip: false,
      colour: 'red',
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
      revision: 0,
      id: '1358',
    };
    const metadata = {
      type: { row: 1, col: 14 },
      cue: { row: 1, col: 15 },
      title: { row: 1, col: 16 },
      subtitle: { row: 1, col: 17 },
      presenter: { row: 1, col: 18 },
      note: { row: 1, col: 19 },
      timeStart: { row: 1, col: 20 },
      timeEnd: { row: 1, col: 21 },
      endAction: { row: 1, col: 22 },
      timerType: { row: 1, col: 23 },
      duration: { row: 1, col: 24 },
      isPublic: { row: 1, col: 25 },
      skip: { row: 1, col: 26 },
      colour: { row: 1, col: 27 },
      user0: { row: 1, col: 28 },
      user1: { row: 1, col: 29 },
      user2: { row: 1, col: 30 },
      user3: { row: 1, col: 31 },
      user4: { row: 1, col: 32 },
      user5: { row: 1, col: 33 },
      user6: { row: 1, col: 34 },
      user7: { row: 1, col: 35 },
      user8: { row: 1, col: 36 },
      user9: { row: 1, col: 37 },
      revision: { row: 1, col: 38 },
      id: { row: 1, col: 39 },
    };
    const result = cellRequestFromEvent(event, 1, 1234, metadata).updateCells.rows[0].values[10].userEnteredValue
      .stringValue;
    expect(result).toStrictEqual(millisToString(event.duration));
  });

  test('boolean to x', () => {
    const event: OntimeRundownEntry = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      subtitle: 'Wow',
      presenter: 'Mr. Presenter',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      isPublic: true,
      skip: false,
      colour: 'red',
      user0: 'u',
      user1: 'u',
      user2: 'u',
      user3: 'u',
      user4: 'u',
      user5: 'u',
      user6: 'u',
      user7: 'u',
      user8: 'u',
      user9: 'u',
      revision: 0,
      id: '1358',
    };
    const metadata = {
      type: { row: 1, col: 14 },
      cue: { row: 1, col: 15 },
      title: { row: 1, col: 16 },
      subtitle: { row: 1, col: 17 },
      presenter: { row: 1, col: 18 },
      note: { row: 1, col: 19 },
      timeStart: { row: 1, col: 20 },
      timeEnd: { row: 1, col: 21 },
      endAction: { row: 1, col: 22 },
      timerType: { row: 1, col: 23 },
      duration: { row: 1, col: 24 },
      isPublic: { row: 1, col: 25 },
      skip: { row: 1, col: 26 },
      colour: { row: 1, col: 27 },
      user0: { row: 1, col: 28 },
      user1: { row: 1, col: 29 },
      user2: { row: 1, col: 30 },
      user3: { row: 1, col: 31 },
      user4: { row: 1, col: 32 },
      user5: { row: 1, col: 33 },
      user6: { row: 1, col: 34 },
      user7: { row: 1, col: 35 },
      user8: { row: 1, col: 36 },
      user9: { row: 1, col: 37 },
      revision: { row: 1, col: 38 },
      id: { row: 1, col: 39 },
    };
    const result = cellRequestFromEvent(event, 1, 1234, metadata);
    expect(result.updateCells.rows[0].values[11].userEnteredValue.stringValue).toStrictEqual('x');
    expect(result.updateCells.rows[0].values[12].userEnteredValue.stringValue).toStrictEqual('');
  });

  test('spacing in metadata', () => {
    const event: OntimeRundownEntry = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      subtitle: 'Wow',
      presenter: 'Mr. Presenter',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      isPublic: true,
      skip: false,
      colour: 'red',
      user0: 'u',
      user1: 'u',
      user2: 'u',
      user3: 'u',
      user4: 'u',
      user5: 'u',
      user6: 'u',
      user7: 'u',
      user8: 'u',
      user9: 'u',
      revision: 0,
      id: '1358',
    };
    const metadata = {
      cue: { row: 1, col: 0 },
      title: { row: 1, col: 6 },
      subtitle: { row: 1, col: 10 },
      user0: { row: 1, col: 16 },
    };
    const result = cellRequestFromEvent(event, 1, 1234, metadata);
    expect(result.updateCells.rows[0].values[0].userEnteredValue.stringValue).toStrictEqual(event.cue);
    expect(result.updateCells.rows[0].values[6].userEnteredValue.stringValue).toStrictEqual(event.title);
    expect(result.updateCells.rows[0].values[10].userEnteredValue.stringValue).toStrictEqual(event.subtitle);
  });

  test('metadata offset from zero', () => {
    const event: OntimeRundownEntry = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      subtitle: 'Wow',
      presenter: 'Mr. Presenter',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      isPublic: true,
      skip: false,
      colour: 'red',
      user0: 'u',
      user1: 'u',
      user2: 'u',
      user3: 'u',
      user4: 'u',
      user5: 'u',
      user6: 'u',
      user7: 'u',
      user8: 'u',
      user9: 'u',
      revision: 0,
      id: '1358',
    };
    const metadata = {
      cue: { row: 1, col: 5 },
      title: { row: 1, col: 6 },
      subtitle: { row: 1, col: 10 },
      user0: { row: 1, col: 16 },
    };
    const result = cellRequestFromEvent(event, 1, 1234, metadata);
    expect(result.updateCells.rows[0].values[0].userEnteredValue.stringValue).toStrictEqual(event.cue);
    expect(result.updateCells.rows[0].values[1].userEnteredValue.stringValue).toStrictEqual(event.title);
    expect(result.updateCells.rows[0].values[5].userEnteredValue.stringValue).toStrictEqual(event.subtitle);
  });

  test('sheet setup', () => {
    const event: OntimeRundownEntry = {
      type: SupportedEvent.Event,
      cue: '1',
      title: 'Fancy',
      subtitle: 'Wow',
      presenter: 'Mr. Presenter',
      note: 'Blue button on the right',
      timeStart: 46800000,
      timeEnd: 57600000,
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      duration: 10800000,
      isPublic: true,
      skip: false,
      colour: 'red',
      user0: 'u',
      user1: 'u',
      user2: 'u',
      user3: 'u',
      user4: 'u',
      user5: 'u',
      user6: 'u',
      user7: 'u',
      user8: 'u',
      user9: 'u',
      revision: 0,
      id: '1358',
    };
    const metadata = {
      cue: { row: 10, col: 5 },
      title: { row: 10, col: 6 },
      subtitle: { row: 1, col: 10 },
      user0: { row: 10, col: 16 },
    };
    const result1 = cellRequestFromEvent(event, 1, 1234, metadata);
    expect(result1.updateCells.start.sheetId).toStrictEqual(1234);
    const result2 = cellRequestFromEvent(event, 10, 1234, metadata);
    expect(result2.updateCells.start.rowIndex).toStrictEqual(21);
    expect(result2.updateCells.start.columnIndex).toStrictEqual(5);
    expect(result2.updateCells.fields).toStrictEqual('userEnteredValue');
  });
});

describe('cellRequenstFromProjectData()', () => {
  test('string to string', () => {
    const projectData: ProjectData = {
      title: 'Title',
      description: 'Description',
      publicUrl: 'Public Url',
      backstageUrl: 'Backstage Url',
      publicInfo: 'Public Info',
      backstageInfo: 'Backstage Info',
    };
    const metadata = {
      title: { row: 0, col: 1 },
      description: { row: 1, col: 1 },
      publicUrl: { row: 2, col: 1 },
      backstageUrl: { row: 3, col: 1 },
      publicInfo: { row: 4, col: 1 },
      backstageInfo: { row: 5, col: 1 },
    };
    const result = cellRequenstFromProjectData(projectData, 1234, metadata);
    expect(result.updateCells.rows[0].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.title);
    expect(result.updateCells.rows[1].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.description);
    expect(result.updateCells.rows[2].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.publicUrl);
    expect(result.updateCells.rows[3].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.backstageUrl);
    expect(result.updateCells.rows[4].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.publicInfo);
    expect(result.updateCells.rows[5].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.backstageInfo);
  });

  test('metadata offset from zero', () => {
    const projectData: ProjectData = {
      title: 'Title',
      description: 'Description',
      publicUrl: 'Public Url',
      backstageUrl: 'Backstage Url',
      publicInfo: 'Public Info',
      backstageInfo: 'Backstage Info',
    };
    const metadata = {
      title: { row: 5, col: 10 },
      description: { row: 6, col: 10 },
      publicUrl: { row: 7, col: 10 },
      backstageUrl: { row: 9, col: 10 },
      publicInfo: { row: 10, col: 10 },
      backstageInfo: { row: 11, col: 10 },
    };
    const result = cellRequenstFromProjectData(projectData, 1234, metadata);
    expect(result.updateCells.rows[0].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.title);
    expect(result.updateCells.rows[1].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.description);
    expect(result.updateCells.rows[2].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.publicUrl);
    expect(result.updateCells.rows[4].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.backstageUrl);
    expect(result.updateCells.rows[5].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.publicInfo);
    expect(result.updateCells.rows[6].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.backstageInfo);
  });

  test('spacing in metadata', () => {
    const projectData: ProjectData = {
      title: 'Title',
      description: 'Description',
      publicUrl: 'Public Url',
      backstageUrl: 'Backstage Url',
      publicInfo: 'Public Info',
      backstageInfo: 'Backstage Info',
    };
    const metadata = {
      title: { row: 0, col: 1 },
      description: { row: 1, col: 1 },
      publicUrl: { row: 2, col: 1 },
      backstageUrl: { row: 9, col: 1 },
      publicInfo: { row: 15, col: 1 },
      backstageInfo: { row: 50, col: 1 },
    };
    const result = cellRequenstFromProjectData(projectData, 1234, metadata);
    expect(result.updateCells.rows[0].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.title);
    expect(result.updateCells.rows[1].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.description);
    expect(result.updateCells.rows[2].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.publicUrl);
    expect(result.updateCells.rows[9].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.backstageUrl);
    expect(result.updateCells.rows[15].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.publicInfo);
    expect(result.updateCells.rows[50].values[0].userEnteredValue.stringValue).toStrictEqual(projectData.backstageInfo);
  });

  test('sheet setup', () => {
    const projectData: ProjectData = {
      title: 'Title',
      description: 'Description',
      publicUrl: 'Public Url',
      backstageUrl: 'Backstage Url',
      publicInfo: 'Public Info',
      backstageInfo: 'Backstage Info',
    };
    const metadata = {
      title: { row: 0, col: 10 },
      description: { row: 1, col: 10 },
      publicUrl: { row: 2, col: 10 },
      backstageUrl: { row: 3, col: 10 },
      publicInfo: { row: 4, col: 10 },
      backstageInfo: { row: 5, col: 10 },
    };
    const result = cellRequenstFromProjectData(projectData, 1234, metadata);
    expect(result.updateCells.start.rowIndex).toStrictEqual(0);
    expect(result.updateCells.start.columnIndex).toStrictEqual(11);
    expect(result.updateCells.fields).toStrictEqual('userEnteredValue');
  });
});
