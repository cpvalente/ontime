import { AutomationSettings, CustomField, DatabaseModel, Settings, TimerLifeCycle, URLPreset } from 'ontime-types';

import { makeNewProject } from '../../../models/dataModel.js';
import { makeOntimeEvent, makeRundown } from '../../../api-data/rundown/__mocks__/rundown.mocks.js';

import { safeMerge } from '../DataProvider.utils.js';

const baseDb = makeNewProject('demo');

describe('safeMerge', () => {
  it('returns existing data if new data is not provided', () => {
    const mergedData = safeMerge(baseDb, {});
    expect(mergedData).toEqual(baseDb);
  });

  it('overrides a rundown with the same key', () => {
    const newData = makeRundown({
      id: 'demo',
      entries: {
        '1': makeOntimeEvent({ id: '1', title: 'new title' }),
        '2': makeOntimeEvent({ id: '1', title: 'new title' }),
      },
      order: ['1', '2'],
    });
    const mergedData = safeMerge(baseDb, { rundowns: { demo: newData } });
    expect(mergedData.rundowns.demo).toStrictEqual(newData);
  });

  it('merges a rundown with a new key', () => {
    const newData = makeRundown({
      id: 'rundown',
      entries: {
        '1': makeOntimeEvent({ id: '1', title: 'new title' }),
        '2': makeOntimeEvent({ id: '1', title: 'new title' }),
      },
      order: ['1', '2'],
    });
    const mergedData = safeMerge(baseDb, { rundowns: { rundown: newData } });
    expect(mergedData.rundowns.demo).toStrictEqual(baseDb.rundowns.demo);
    expect(mergedData.rundowns.rundown).toStrictEqual(newData);
  });

  it('merges the project key', () => {
    const mergedData = safeMerge(baseDb, {
      project: {
        title: 'new title',
        info: 'new backstage info',
        custom: [
          {
            title: 'new custom title',
            value: 'new custom value',
          },
        ],
      },
    } as Partial<DatabaseModel>);

    expect(mergedData.project).toStrictEqual({
      title: 'new title',
      description: baseDb.project.description,
      url: baseDb.project.url,
      info: 'new backstage info',
      logo: baseDb.project.logo,
      custom: [
        {
          title: 'new custom title',
          value: 'new custom value',
        },
      ],
    });
  });

  it('merges the settings key', () => {
    const mergedData = safeMerge(baseDb, {
      settings: {
        language: 'pt',
        version: 'new',
      } as Settings,
    });
    expect(mergedData.settings).toStrictEqual({
      version: 'new',
      operatorKey: null,
      editorKey: null,
      timeFormat: baseDb.settings.timeFormat,
      language: 'pt',
    });
  });

  it('should merge the urlPresets key when present', () => {
    const newData = {
      urlPresets: [
        { enabled: true, alias: 'alias1', search: '' },
        { enabled: true, alias: 'alias2', search: '' },
      ] as URLPreset[],
    };

    const mergedData = safeMerge(baseDb, newData);

    expect(mergedData.urlPresets).toStrictEqual([...baseDb.urlPresets, ...newData.urlPresets]);
  });

  it('merges customFields into existing object', () => {
    const existing = {
      ...baseDb,
      customFields: {
        lighting: { type: 'text', colour: 'red', label: 'lighting' },
        sound: { type: 'text', colour: 'red', label: 'sound' },
      },
    };

    const newData = {
      customFields: {
        switcher: { type: 'text', label: 'switcher' },
        vfx: { type: 'text', label: 'vfx' },
      },
    };

    const expected = {
      lighting: { type: 'text', colour: 'red', label: 'lighting' },
      sound: { type: 'text', colour: 'red', label: 'sound' },
      switcher: { type: 'text', label: 'switcher' },
      vfx: { type: 'text', label: 'vfx' },
    };

    //@ts-expect-error -- testing partial merge
    const result = safeMerge(existing, newData);
    expect(result.customFields).toEqual(expected);
  });

  it('overwrites matching customFields keys when merging', () => {
    const existing = {
      ...baseDb,
      customFields: {
        lighting: { type: 'text', colour: 'red', label: 'lighting' } satisfies CustomField,
      },
    };

    const newData = {
      customFields: {
        lighting: { type: 'text', colour: 'red', label: 'updated lighting' } satisfies CustomField,
      },
    };

    const result = safeMerge(existing, newData);
    expect(result.customFields).toEqual({
      lighting: { type: 'text', colour: 'red', label: 'updated lighting' },
    });
  });

  it('replaces automation settings when provided', () => {
    const existing = {
      ...baseDb,
      automation: {
        enabledAutomations: true,
        enabledOscIn: true,
        oscPortIn: 9000,
        triggers: [
          {
            id: 'trigger-1',
            title: 'Trigger 1',
            trigger: TimerLifeCycle.onStart,
            automationId: 'automation-1',
          },
        ],
        automations: {
          'automation-1': {
            id: 'automation-1',
            title: 'Automation 1',
            filterRule: 'all',
            filters: [],
            outputs: [],
          },
        } satisfies AutomationSettings['automations'],
      },
    };

    const newAutomation: AutomationSettings = {
      enabledAutomations: false,
      enabledOscIn: false,
      oscPortIn: 7777,
      triggers: [
        {
          id: 'trigger-2',
          title: 'Trigger 2',
          trigger: TimerLifeCycle.onStop,
          automationId: 'automation-2',
        },
      ],
      automations: {
        'automation-2': {
          id: 'automation-2',
          title: 'Automation 2',
          filterRule: 'any',
          filters: [],
          outputs: [],
        },
      },
    };

    const result = safeMerge(existing, { automation: newAutomation });

    expect(result.automation).toStrictEqual(newAutomation);
  });
});
