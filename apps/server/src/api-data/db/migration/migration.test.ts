import {
  CustomFields,
  EndAction,
  ProjectData,
  Rundown,
  Settings,
  SupportedEntry,
  TimerLifeCycle,
  TimerType,
  TimeStrategy,
  URLPreset,
  ViewSettings,
} from 'ontime-types';
import * as v3 from './db.migration.v3.js';

describe('v3 to v4', () => {
  const oldDb = {
    rundown: [
      { id: 'block0', type: 'block', title: 'BLOCK 0' },
      {
        id: 'event1',
        type: 'event',
        cue: '123',
        title: 'ABC',
        note: 'DEF',
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        countToEnd: false,
        linkStart: false,
        timeStrategy: TimeStrategy.LockDuration,
        timeStart: 0,
        timeEnd: 10,
        duration: 10,
        isPublic: false,
        skip: false,
        colour: 'blue',
        timeWarning: 5,
        timeDanger: 2,
        custom: {
          song: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
          doseNotExist: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
        },
        revision: 0,
        delay: 0,
        dayOffset: 0,
        gap: 0,
      },
      {
        id: 'event2',
        type: SupportedEntry.Event,
        cue: '124',
        title: 'ABC',
        note: 'DEF',
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        countToEnd: false,
        linkStart: false,
        timeStrategy: TimeStrategy.LockDuration,
        timeStart: 0,
        timeEnd: 10,
        duration: 10,
        isPublic: false,
        skip: false,
        colour: 'blue',
        timeWarning: 5,
        timeDanger: 2,
        custom: {
          wow: 'http://www.agoodimage.com',
          artist: 'Ib Andersen',
        },
        triggers: [{ id: 'testTrig', title: 'Test trigger', trigger: TimerLifeCycle.onStart, automationId: '1' }],
        revision: 0,
        delay: 0,
        dayOffset: 0,
        gap: 0,
      },
    ],
    project: {
      title: 'Eurovision Song Contest',
      description: 'Turin 2022',
      publicUrl: '123',
      publicInfo: '456',
      backstageUrl: 'www.github.com/cpvalente/ontime',
      backstageInfo: 'Rehearsal Schedule - Turin 2022\nAll performers to wear full costumes for 1st rehearsal',
    },
    settings: {
      version: '3.3.3',
      serverPort: 4001,
      editorKey: null,
      operatorKey: null,
      timeFormat: '24',
      language: 'en',
    },
    viewSettings: {
      overrideStyles: false,
      normalColor: '#ffffffcc',
      warningColor: '#ffa528',
      dangerColor: '#ff7300',
      freezeEnd: false,
      endMessage: '',
    },
    urlPresets: [
      {
        enabled: true,
        alias: 'clock',
        pathAndParams:
          'timer?showLeadingZeros=true&timerType=clock&hideClock=true&hideCards=true&hideProgress=true&hideMessage=true&hideSecondary=true&hideLogo=true',
      },
      {
        enabled: true,
        alias: 'minimal',
        pathAndParams:
          'timer?showLeadingZeros=true&hideClock=true&hideCards=true&hideProgress=true&hideMessage=true&hideSecondary=true&hideLogo=true',
      },
    ],
    customFields: {
      song: {
        label: 'Song and Dance',
        type: 'string',
        colour: '#339E4E',
      },
      artist: {
        label: 'Artist and Host',
        type: 'string',
        colour: '#3E75E8',
      },
      wow: {
        label: 'WOW 123',
        type: 'image',
        colour: '#E80000',
      },
    },
    automation: {
      enabledAutomations: true,
      enabledOscIn: true,
      oscPortIn: 8888,
      triggers: [],
      automations: {},
    },
  };

  test('migrate settings', () => {
    const expectSettings: Settings = {
      version: '4.0.0', // This only migrates to v4.0.0 if we need any changes to the file after this it should be handled by a new migration function
      serverPort: 4001,
      editorKey: null,
      operatorKey: null,
      timeFormat: '24',
      language: 'en',
    };
    const newSettings = v3.migrateSettings(oldDb);
    expect(newSettings).toEqual(expectSettings);
  });

  test('migrate view settings', () => {
    const expectViewSettings: ViewSettings = {
      dangerColor: '#ff7300',
      normalColor: '#ffffffcc',
      overrideStyles: false,
      warningColor: '#ffa528',
    };
    const newViewSettings = v3.migrateViewSettings(oldDb);
    expect(newViewSettings).toEqual(expectViewSettings);
  });

  test('migrate url preset', () => {
    const expectUrlPresets: URLPreset[] = [
      {
        enabled: true,
        alias: 'clock',
        pathAndParams:
          'timer?showLeadingZeros=true&timerType=clock&hideClock=true&hideCards=true&hideProgress=true&hideMessage=true&hideSecondary=true&hideLogo=true',
      },
      {
        enabled: true,
        alias: 'minimal',
        pathAndParams:
          'timer?showLeadingZeros=true&hideClock=true&hideCards=true&hideProgress=true&hideMessage=true&hideSecondary=true&hideLogo=true',
      },
    ];
    const newUrlPreset = v3.migrateURLPresets(oldDb);
    expect(newUrlPreset).toEqual(expectUrlPresets);
  });

  test('migrate project data', () => {
    const expectProjectData: ProjectData = {
      title: 'Eurovision Song Contest',
      description: 'Turin 2022',
      url: 'www.github.com/cpvalente/ontime',
      info: 'Rehearsal Schedule - Turin 2022\nAll performers to wear full costumes for 1st rehearsal',
      logo: null,
      custom: [],
    };
    const newProjectData = v3.migrateProjectData(oldDb);
    expect(newProjectData).toEqual(expectProjectData);
  });

  test('migrate custom fields', () => {
    const expectCustomFields: CustomFields = {
      Song_and_Dance: {
        label: 'Song and Dance',
        type: 'text',
        colour: '#339E4E',
      },
      Artist_and_Host: {
        label: 'Artist and Host',
        type: 'text',
        colour: '#3E75E8',
      },
      WOW_123: {
        label: 'WOW 123',
        type: 'image',
        colour: '#E80000',
      },
    };
    const { customFields, translationTable } = v3.migrateCustomFields(oldDb)!;
    expect(customFields).toEqual(expectCustomFields);

    expect(translationTable).toEqual(
      new Map([
        ['song', 'Song_and_Dance'],
        ['artist', 'Artist_and_Host'],
        ['wow', 'WOW_123'],
      ]),
    );
  });

  test('migrate rundown', () => {
    const expectedRundown: Rundown = {
      id: 'default',
      title: 'Default',
      order: ['block0', 'event1', 'event2'],
      flatOrder: ['block0', 'event1', 'event2'],
      entries: {
        block0: {
          id: 'block0',
          type: SupportedEntry.Block,
          title: 'BLOCK 0',
          colour: '',
          custom: {},
          duration: 0,
          entries: [],
          isFirstLinked: false,
          note: '',
          revision: -1,
          targetDuration: null,
          timeEnd: null,
          timeStart: null,
        },
        event1: {
          id: 'event1',
          type: SupportedEntry.Event,
          cue: '123',
          title: 'ABC',
          note: 'DEF',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockDuration,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          skip: false,
          colour: 'blue',
          timeWarning: 5,
          timeDanger: 2,
          custom: { Song_and_Dance: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit' },
          triggers: [],
          revision: -1,
          flag: false,
          parent: null,
          delay: 0,
          dayOffset: 0,
          gap: 0,
        },
        event2: {
          id: 'event2',
          type: SupportedEntry.Event,
          cue: '124',
          title: 'ABC',
          note: 'DEF',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockDuration,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          skip: false,
          colour: 'blue',
          timeWarning: 5,
          timeDanger: 2,
          custom: {
            WOW_123: 'http://www.agoodimage.com',
            Artist_and_Host: 'Ib Andersen',
          },
          triggers: [{ id: 'testTrig', title: 'Test trigger', trigger: TimerLifeCycle.onStart, automationId: '1' }],
          flag: false,
          parent: null,
          revision: -1,
          delay: 0,
          dayOffset: 0,
          gap: 0,
        },
      },
      revision: 0,
    };
    const translationTable = new Map([
      ['song', 'Song_and_Dance'],
      ['artist', 'Artist_and_Host'],
      ['wow', 'WOW_123'],
    ]);

    //@ts-expect-error - we know  the default rundown  should appear
    expect(v3.migrateRundown(oldDb, translationTable)['default']).toStrictEqual(expectedRundown);
  });
});
