import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ONTIME_VERSION } from '../../../../ONTIME_VERSION.js';
import { parseDatabaseModel } from '../../db.parser.js';
import * as v5 from '../db.migration.v5.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function readFixture(fileName: string) {
  return JSON.parse(readFileSync(join(fixturesDir, fileName), 'utf-8'));
}

/** the v4 record as a v5 list, each field holding its key */
function asList(record: object) {
  return Object.entries(record).map(([key, field]) => ({ ...field, key }));
}

describe('shouldMigrateToV5()', () => {
  test.each([
    ['a custom fields record', { customFields: {} }, true],
    ['a custom fields list', { customFields: [] }, false],
    ['no custom fields', {}, false],
  ])('a file with %s should migrate: %s', (_, data, expected) => {
    expect(v5.shouldMigrateToV5(data as object)).toBe(expected);
  });
});

describe('migrateToV5()', () => {
  test('turns the custom fields record into a list, keeping its key order', () => {
    const data = readFixture('v4.15.json');
    const migrated = v5.migrateToV5(data);
    expect(migrated.customFields).toStrictEqual(asList(data.customFields));
    expect({ ...migrated, customFields: data.customFields }).toStrictEqual(data);
  });
});

/**
 * v4 project files must load in v5
 * each v5 migration should extend these expectations
 */
describe('v4 project files load in v5', () => {
  test.each(['v4.0.json', 'v4.15.json'])('%s loads and is stamped with v5', (fileName) => {
    const { data, errors } = parseDatabaseModel(readFixture(fileName));

    expect(errors).toStrictEqual([]);
    expect(data.settings.version).toBe(ONTIME_VERSION);
    expect(Object.keys(data.rundowns)).toHaveLength(1);
    const rundown = Object.values(data.rundowns)[0];
    expect(rundown.order.length).toBeGreaterThan(0);
    expect(Object.keys(rundown.entries).length).toBeGreaterThan(0);
  });

  test('a v4 file keeps its project, entries and custom fields, and is flagged as migrated', () => {
    const fixture = readFixture('v4.15.json');
    const { data, migrated } = parseDatabaseModel(fixture);

    expect(migrated).toBe(true);
    expect(data.project).toMatchObject(fixture.project);
    expect(data.customFields).toStrictEqual(asList(fixture.customFields));
    expect(Object.keys(data.rundowns.demo.entries).sort()).toStrictEqual(
      Object.keys(fixture.rundowns.demo.entries).sort(),
    );
    for (const [id, entry] of Object.entries(fixture.rundowns.demo.entries)) {
      if ((entry as { custom?: object }).custom) {
        expect(data.rundowns.demo.entries[id]).toMatchObject({ custom: (entry as { custom: object }).custom });
      }
    }
  });

  test('a file from an early v5 build with a custom fields record is migrated', () => {
    const fixture = readFixture('v4.15.json');
    const { migrated, data } = parseDatabaseModel({
      ...fixture,
      settings: { ...fixture.settings, version: '5.0.0-alpha.0' },
    });
    expect(migrated).toBe(true);
    expect(data.customFields).toStrictEqual(asList(fixture.customFields));
  });

  test('a file saved by v5 is not flagged as migrated', () => {
    const { data } = parseDatabaseModel(readFixture('v4.15.json'));
    const reloaded = parseDatabaseModel(structuredClone(data));
    expect(reloaded.migrated).toBe(false);
    expect(reloaded.errors).toStrictEqual([]);
  });
});
