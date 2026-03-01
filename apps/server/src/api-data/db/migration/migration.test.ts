import {
  AutomationSettings,
  CustomFields,
  EndAction,
  OntimeView,
  ProjectData,
  Rundown,
  Settings,
  SupportedEntry,
  TimeStrategy,
  TimerLifeCycle,
  TimerType,
  URLPreset,
  ViewSettings,
} from 'ontime-types';

import { ONTIME_VERSION } from '../../../ONTIME_VERSION.js';
import * as v3 from './db.migration.v3.js';

describe('v3 to v4', () => {
  const oldDb = {
    rundown: [
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
      { id: 'group0', type: 'block', title: 'GROUP 0' },
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
      {
        id: 'event3',
        type: SupportedEntry.Event,
        cue: '125',
        // title: 'ABC', this has a missing field
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
      { id: 'group1', type: 'block', title: 'GROUP 1' },
      { id: 'delay', type: 'delay', duration: 1000 },
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
      version: ONTIME_VERSION,
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
        target: OntimeView.Timer,
        search:
          'showLeadingZeros=true&timerType=clock&hideClock=true&hideCards=true&hideProgress=true&hideMessage=true&hideSecondary=true&hideLogo=true',
        options: {},
      },
      {
        enabled: true,
        alias: 'minimal',
        target: OntimeView.Timer,
        search:
          'showLeadingZeros=true&hideClock=true&hideCards=true&hideProgress=true&hideMessage=true&hideSecondary=true&hideLogo=true',
        options: {},
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
    const parsedData = v3.migrateCustomFields(oldDb);
    expect(parsedData).not.toBeUndefined();
    expect(parsedData?.customFields).toEqual(expectCustomFields);
    expect(parsedData?.translationTable).toEqual(
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
      order: ['event1', 'group0', 'group1'],
      flatOrder: ['event1', 'group0', 'event2', 'event3', 'group1', 'delay'],
      entries: {
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
        group0: {
          id: 'group0',
          type: SupportedEntry.Group,
          title: 'GROUP 0',
          colour: '',
          custom: {},
          duration: 0,
          entries: ['event2', 'event3'],
          isFirstLinked: false,
          note: '',
          revision: -1,
          targetDuration: null,
          timeEnd: null,
          timeStart: null,
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
          parent: 'group0',
          revision: -1,
          delay: 0,
          dayOffset: 0,
          gap: 0,
        },
        event3: {
          id: 'event3',
          type: SupportedEntry.Event,
          cue: '125',
          //@ts-expect-error - if a field is missing we should pass it through a let our normal import fix it
          title: undefined,
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
          parent: 'group0',
          revision: -1,
          delay: 0,
          dayOffset: 0,
          gap: 0,
        },
        group1: {
          id: 'group1',
          type: SupportedEntry.Group,
          title: 'GROUP 1',
          colour: '',
          custom: {},
          duration: 0,
          entries: ['delay'],
          isFirstLinked: false,
          note: '',
          revision: -1,
          targetDuration: null,
          timeEnd: null,
          timeStart: null,
        },
        delay: {
          type: SupportedEntry.Delay,
          id: 'delay',
          duration: 1000,
          parent: 'group1',
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

  describe('migrate old automation', () => {
    test('osc', () => {
      const oldData = {
        portIn: 8881,
        portOut: 55890,
        targetIP: '127.0.0.1',
        enabledIn: true,
        enabledOut: true,
        subscriptions: [
          {
            id: '23f4d8',
            cycle: 'onClock',
            address: '/test',
            payload: 'bip',
            enabled: true,
          },
        ],
      };

      const expectedAutomation: AutomationSettings = {
        enabledAutomations: true,
        enabledOscIn: true,
        oscPortIn: 8881,
        triggers: [
          {
            id: '23f4d8-T',
            title: 'Migrated Trigger 23f4d8',
            trigger: TimerLifeCycle.onClock,
            automationId: '23f4d8-A',
          },
        ],
        automations: {
          '23f4d8-A': {
            id: '23f4d8-A',
            title: 'Migrated Automation 23f4d8',
            filterRule: 'any',
            filters: [],
            outputs: [{ type: 'osc', targetIP: '127.0.0.1', targetPort: 55890, address: '/test', args: 'bip' }],
          },
        },
      };

      expect(v3.migrateAutomations({ osc: oldData })).toStrictEqual(expectedAutomation);
    });
    test('http', () => {
      const oldData = {
        enabledOut: true,
        subscriptions: [
          {
            id: '1ge4r8',
            cycle: 'onClock',
            message: 'http://www.test.com',
            enabled: true,
          },
        ],
      };

      const expectedAutomation: AutomationSettings = {
        enabledAutomations: true,
        enabledOscIn: false,
        oscPortIn: 8888,
        triggers: [
          {
            id: '1ge4r8-T',
            title: 'Migrated Trigger 1ge4r8',
            trigger: TimerLifeCycle.onClock,
            automationId: '1ge4r8-A',
          },
        ],
        automations: {
          '1ge4r8-A': {
            id: '1ge4r8-A',
            title: 'Migrated Automation 1ge4r8',
            filterRule: 'any',
            filters: [],
            outputs: [{ type: 'http', url: 'http://www.test.com' }],
          },
        },
      };

      expect(v3.migrateAutomations({ http: oldData })).toStrictEqual(expectedAutomation);
    });
  });
});
