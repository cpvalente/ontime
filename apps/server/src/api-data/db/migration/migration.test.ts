import { EndAction, SupportedEntry, TimerType, TimeStrategy } from 'ontime-types';
import { migrate_v3_to_v4 } from './db.migration.v3.js';
import { dbModel } from '../../../models/dataModel.js';

describe('v3 to v4', () => {
  test('do not touch new projects', () => {
    const expectDb = structuredClone(dbModel);
    expectDb.settings.version = '4.0.0';
    expect(migrate_v3_to_v4(expectDb) == expectDb).toBeTruthy();
  });

  test('migrate v3 project', () => {
    const oldDb = {
      rundown: [
        {
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
          isPublic: false,
          skip: false,
          colour: 'blue',
          timeWarning: 5,
          timeDanger: 2,
          custom: { asd_123: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit' },
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
        },
        {
          type: SupportedEntry.Block,
          id: 'block1',
          title: 'BLOCK',
        },
      ],
      project: {
        title: '',
        description: '',
        publicUrl: '123',
        publicInfo: '456',
        backstageUrl: '',
        backstageInfo: '',
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
        warningColor: '#FFAB33',
        dangerColor: '#ED3333',
        freezeEnd: false,
        endMessage: '',
      },
      urlPresets: [
        {
          alias: 'test',
          enabled: true,
          pathAndParams: 'lower?bg=ff2&text=f00&size=0.6&transition=5',
        },
      ],
      customFields: {
        asd_123: {
          type: 'string',
          colour: 'blue',
          label: 'ASD 123',
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

    const expectDb = structuredClone(dbModel);
    expectDb.customFields = {
      ASD_123: {
        type: 'string',
        colour: 'blue',
        label: 'ASD 123',
      },
    };
    expectDb.rundowns['default'] = {
      id: 'default',
      title: 'Default',
      order: ['event1', 'block1'],
      flatOrder: ['event1', 'block1'],
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
          parent: null,
          triggers: [],
          custom: { ASD_123: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit' },
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
        },
        block1: {
          type: SupportedEntry.Block,
          id: 'block1',
          title: 'BLOCK',
          note: '',
          events: [],
          skip: false,
          colour: '',
          custom: {},
          revision: 0,
          startTime: null,
          endTime: null,
          duration: 0,
          isFirstLinked: false,
        },
      },
      revision: 0,
    };

    expectDb.urlPresets = [
      {
        alias: 'test',
        enabled: true,
        pathAndParams: 'lower?bg=ff2&text=f00&size=0.6&transition=5',
      },
    ];

    const newDb = migrate_v3_to_v4(oldDb);

    expect(newDb).toEqual(expectDb);
  });
});
