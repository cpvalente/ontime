/* eslint-disable no-console --  we are mocking the console */

import { SupportedEntry } from 'ontime-types';

import { demoDb } from '../../../models/demoProject.js';
import { makeOntimeEvent } from '../../rundown/__mocks__/rundown.mocks.js';
import { parseDatabaseModel } from '../db.parser.js';

// mock data provider
vi.mock('../../classes/data-provider/DataProvider.js', () => {
  return {
    getDataProvider: vi.fn().mockImplementation(() => {
      return {
        setRundown: vi.fn().mockImplementation((newData) => newData),
        setCustomFields: vi.fn().mockImplementation((newData) => newData),
      };
    }),
  };
});

describe('test parseDatabaseModel() with demo project (valid)', () => {
  const filteredDemoProject = structuredClone(demoDb);
  const { data } = parseDatabaseModel(filteredDemoProject);

  it('has 14 entries, with 6 events and 4 top level groups', () => {
    expect(data.rundowns.default.order.length).toBe(4);
    expect(Object.keys(data.rundowns.default.entries).length).toBe(14);
    let numEntries = 0;
    data.rundowns.default.flatOrder.forEach((entryId) => {
      const entry = data.rundowns.default.entries[entryId];
      if (entry.type === SupportedEntry.Event) {
        numEntries++;
      }
    });
    expect(numEntries).toBe(6);
  });

  it('is the same as the demo project since all data is valid', () => {
    // @ts-expect-error -- its ok
    delete filteredDemoProject.settings.version;
    // @ts-expect-error -- its ok
    delete data.settings.version;

    // remove time-related fields from the comparison
    // these are not calculated in the parser
    Object.values(filteredDemoProject.rundowns).forEach((rundown: any) => {
      Object.values(rundown.entries).forEach((entry: any) => {
        if (entry.type === SupportedEntry.Group) {
          delete entry.timeStart;
          delete entry.timeEnd;
          delete entry.duration;
          delete entry.isFirstLinked;
        }
      });
    });
    Object.values(data.rundowns).forEach((rundown: any) => {
      Object.values(rundown.entries).forEach((entry: any) => {
        if (entry.type === SupportedEntry.Group) {
          delete entry.timeStart;
          delete entry.timeEnd;
          delete entry.duration;
          delete entry.isFirstLinked;
        }
      });
    });

    expect(data.automation).toMatchObject(filteredDemoProject.automation);
    expect(data.customFields).toMatchObject(filteredDemoProject.customFields);
    expect(data.project).toMatchObject(filteredDemoProject.project);
    expect(data.rundowns).toMatchObject(filteredDemoProject.rundowns);
    expect(data.settings).toMatchObject(filteredDemoProject.settings);
    expect(data.urlPresets).toMatchObject(filteredDemoProject.urlPresets);
    expect(data.viewSettings).toMatchObject(filteredDemoProject.viewSettings);
  });
});

describe('test parseDatabaseModel() edge cases', () => {
  it('skips unknown app and version settings', () => {
    console.log = vi.fn();
    const testData = {
      settings: {
        osc_port: 8888,
      },
    };

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    expect(() => parseDatabaseModel(testData)).toThrow();
  });

  it('fails with invalid JSON', () => {
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    expect(() => parseDatabaseModel('some random dataset')).toThrow();
  });

  it('creates the aux timer names when importing a project file which predates the feature', () => {
    const oldProject = structuredClone(demoDb);
    // @ts-expect-error -- simulating a project file saved before aux timer naming existed
    delete oldProject.settings.auxTimerNames;

    const { data } = parseDatabaseModel(oldProject);

    expect(data.settings.auxTimerNames).toStrictEqual(['', '', '']);
  });
});

describe('project custom field order', () => {
  const fields = {
    Notes: { label: 'Notes', type: 'text', colour: '' },
    '2': { label: '2', type: 'text', colour: '' },
  };

  it.each([
    { source: { customFields: fields, customFieldOrder: undefined }, order: ['2', 'Notes'] },
    { source: { customFields: fields, customFieldOrder: ['Notes', '2'] }, order: ['Notes', '2'] },
  ])('migrates v4 fields without changing the source or migrating again on reload', ({ source, order }) => {
    const project = { ...structuredClone(demoDb), ...source, settings: { ...demoDb.settings, version: '4.13.0' } };
    const original = structuredClone(project);
    const { data, migrated } = parseDatabaseModel(project);

    expect(data.customFields).toEqual({ fields, order });
    expect(data).not.toHaveProperty('customFieldOrder');
    expect(data.settings.version.startsWith('5.')).toBe(true);
    expect(migrated).toBe(true);
    expect(project).toEqual(original);
    expect(parseDatabaseModel(data).migrated).toBe(false);
  });

  it('rejects newer major versions rather than rewriting them as v5', () => {
    expect(() => parseDatabaseModel({ ...demoDb, settings: { ...demoDb.settings, version: '6.0.0' } })).toThrow(
      'Unsupported project version',
    );
  });

  it('chains v3 through v4 into v5 while preserving custom field values', () => {
    const entry = makeOntimeEvent({ id: 'intro', custom: { Notes: 'Keep this value' } });
    const source = {
      ...structuredClone(demoDb),
      settings: { ...demoDb.settings, version: '3.16.1', serverPort: 4001 },
      rundown: [entry],
      urlPresets: [],
      customFields: { Notes: { label: 'Notes', type: 'string', colour: '' } },
    };
    const original = structuredClone(source);

    const { data, migrated } = parseDatabaseModel(source);

    expect(migrated).toBe(true);
    expect(data.settings.version.startsWith('5.')).toBe(true);
    expect(data.customFields).toEqual({
      fields: { Notes: { label: 'Notes', type: 'text', colour: '' } },
      order: ['Notes'],
    });
    expect(data.rundowns.default.entries.intro).toMatchObject({ custom: entry.custom });
    expect(source).toEqual(original);
  });
});
