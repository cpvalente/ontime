/* eslint-disable no-console --  we are mocking the console */

import { SupportedEntry } from 'ontime-types';

import { demoDb } from '../../../models/demoProject.js';
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

describe('project custom field collection', () => {
  const fields = {
    Notes: { label: 'Notes', type: 'text', colour: '' },
    '2': { label: '2', type: 'text', colour: '' },
  };

  it.each([
    { source: { customFields: fields }, order: ['2', 'Notes'] },
    { source: { customFields: fields, customFieldOrder: ['Notes', '2'] }, order: ['Notes', '2'] },
    { source: { customFields: { fields, order: ['Notes', '2'] } }, order: ['Notes', '2'] },
  ])('loads legacy and nested custom fields without mutating the source', ({ source, order }) => {
    const project = { ...structuredClone(demoDb), ...source };
    const original = structuredClone(project);
    // @ts-expect-error -- also exercises legacy project file shapes
    const { data } = parseDatabaseModel(project);

    expect(data.customFields).toEqual({
      fields,
      order,
    });
    expect(data).not.toHaveProperty('customFieldOrder');
    expect(project).toEqual(original);
  });
});
