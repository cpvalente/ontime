/* eslint-disable no-console --  we are mocking the console */

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

  it('has 17 events with 12 top level events', () => {
    expect(data.rundowns.default.order.length).toBe(12);
    expect(Object.keys(data.rundowns.default.entries).length).toBe(17);
  });

  it('is the same as the demo project since all data is valid', () => {
    // @ts-expect-error -- its ok
    delete filteredDemoProject.settings.version;
    // @ts-expect-error -- its ok
    delete data.settings.version;
    expect(data).toMatchObject(filteredDemoProject);
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
