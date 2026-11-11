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

describe('shouldMigrateToV5()', () => {
  test.each([
    ['4.0.0', true],
    ['4.15.1', true],
    ['5.0.0-alpha.0', false],
    ['5.2.0', false],
    ['not a version', false],
  ])('a file saved by %s should migrate: %s', (version, expected) => {
    expect(v5.shouldMigrateToV5({ settings: { version } })).toBe(expected);
  });

  test('a file without a version is not migrated', () => {
    expect(v5.shouldMigrateToV5({})).toBe(false);
  });
});

describe('migrateToV5()', () => {
  test('wraps the custom fields record, keeping its key order', () => {
    const data = readFixture('v4.15.json');
    const migrated = v5.migrateToV5(data);
    expect(migrated.customFields).toStrictEqual({
      fields: data.customFields,
      order: Object.keys(data.customFields),
    });
    expect({ ...migrated, customFields: data.customFields }).toStrictEqual(data);
  });

  test('a file without custom fields gets an empty collection', () => {
    expect(v5.migrateToV5({}).customFields).toStrictEqual({ fields: {}, order: [] });
  });

  test('a v4 file is flagged as migrated so it is backed up', () => {
    const fixture = readFixture('v4.15.json');
    const { data, migrated } = parseDatabaseModel(fixture);
    expect(migrated).toBe(true);
    expect(data.customFields.order).toStrictEqual(Object.keys(fixture.customFields));
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

  test('a v4 file keeps its project, entries and custom fields', () => {
    const fixture = readFixture('v4.15.json');
    const { data } = parseDatabaseModel(fixture);

    expect(data.project).toMatchObject(fixture.project);
    expect(data.customFields).toStrictEqual({
      fields: fixture.customFields,
      order: Object.keys(fixture.customFields),
    });
    expect(Object.keys(data.rundowns.demo.entries).sort()).toStrictEqual(
      Object.keys(fixture.rundowns.demo.entries).sort(),
    );
    for (const [id, entry] of Object.entries(fixture.rundowns.demo.entries)) {
      if ((entry as { custom?: object }).custom) {
        expect(data.rundowns.demo.entries[id]).toMatchObject({ custom: (entry as { custom: object }).custom });
      }
    }
  });

  test('a file saved by v5 is not flagged as migrated', () => {
    const { data } = parseDatabaseModel(readFixture('v4.15.json'));
    const reloaded = parseDatabaseModel(structuredClone(data));
    expect(reloaded.migrated).toBe(false);
    expect(reloaded.errors).toStrictEqual([]);
  });
});
