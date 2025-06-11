import { EndAction, Settings, SupportedEntry, TimerType, TimeStrategy } from 'ontime-types';
import * as v3 from './db.migration.v3.js';
import { dbModel } from '../../../models/dataModel.js';

describe('v3 to v4', () => {
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
    urlPresets: [],
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

  test('migrate settings', () => {
    const expectSettings = structuredClone(dbModel.settings);
    const newSettings = v3.migrateSettings(oldDb);
    expect(newSettings).toEqual(expectSettings);
  });

});
