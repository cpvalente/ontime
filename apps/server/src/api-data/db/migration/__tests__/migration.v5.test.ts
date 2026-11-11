import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ONTIME_VERSION } from '../../../../ONTIME_VERSION.js';
import { UnsupportedProjectError } from '../../db.errors.js';
import { parseDatabaseModel } from '../../db.parser.js';
import * as v5 from '../db.migration.v5.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function readFixture(fileName: string) {
  return JSON.parse(readFileSync(join(fixturesDir, fileName), 'utf-8'));
}

describe('v5 major checks', () => {
  test.each([
    ['4.15.1', true, false],
    ['5.0.0-alpha.0', false, false],
    ['5.2.0', false, false],
    ['6.0.0', false, true],
    ['not a version', false, false],
  ])('a file saved by %s is older: %s, newer: %s', (version, older, newer) => {
    const data = { settings: { version } };
    expect(v5.isFromOlderMajor(data)).toBe(older);
    expect(v5.isFromNewerMajor(data)).toBe(newer);
  });

  test('a file without a version is neither older nor newer', () => {
    expect(v5.isFromOlderMajor({})).toBe(false);
    expect(v5.isFromNewerMajor({})).toBe(false);
  });
});

/**
 * v4 project files must load in v5
 * each v5 migration should extend these expectations
 */
describe('v4 project files load in v5', () => {
  test.each(['v4.0.json', 'v4.15.json'])('%s loads, is flagged for backup and stamped with v5', (fileName) => {
    const { data, errors, migrated } = parseDatabaseModel(readFixture(fileName));

    expect(errors).toStrictEqual([]);
    expect(migrated).toBe(true);
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
    expect(data.customFields).toStrictEqual(fixture.customFields);
    expect(Object.keys(data.rundowns.demo.entries).sort()).toStrictEqual(
      Object.keys(fixture.rundowns.demo.entries).sort(),
    );
    for (const [id, entry] of Object.entries(fixture.rundowns.demo.entries)) {
      if ((entry as { custom?: object }).custom) {
        expect(data.rundowns.demo.entries[id]).toMatchObject({ custom: (entry as { custom: object }).custom });
      }
    }
  });

  test('a file saved by v5 is not flagged for backup again', () => {
    const { data } = parseDatabaseModel(readFixture('v4.15.json'));
    const reloaded = parseDatabaseModel(structuredClone(data));
    expect(reloaded.migrated).toBe(false);
    expect(reloaded.errors).toStrictEqual([]);
  });

  test('a file from a newer major is refused', () => {
    const fixture = readFixture('v4.15.json');
    fixture.settings.version = '6.0.0';
    expect(() => parseDatabaseModel(fixture)).toThrow(UnsupportedProjectError);
  });
});
