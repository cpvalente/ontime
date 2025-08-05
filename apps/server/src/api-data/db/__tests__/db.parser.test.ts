/* eslint-disable no-console --  we are mocking the console */

import { SupportedEntry } from 'ontime-types';

import { demoDb } from '../../../models/demoProject.js';

import { parseDatabaseModel } from '../db.parser.js';

// mock data provider
beforeAll(() => {
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
    Object.values(filteredDemoProject.rundowns.default.entries).forEach((entry: any) => {
      if (entry.type === SupportedEntry.Block) {
        delete entry.timeStart;
        delete entry.timeEnd;
        delete entry.duration;
        delete entry.isFirstLinked;
      }
    });
    Object.values(data.rundowns.default.entries).forEach((entry: any) => {
      if (entry.type === SupportedEntry.Block) {
        delete entry.timeStart;
        delete entry.timeEnd;
        delete entry.duration;
        delete entry.isFirstLinked;
      }
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
});
