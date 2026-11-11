import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ONTIME_VERSION } from '../../../../ONTIME_VERSION.js';
import { parseDatabaseModel } from '../../db.parser.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function readFixture(fileName: string) {
  return JSON.parse(readFileSync(join(fixturesDir, fileName), 'utf-8'));
}

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

  test('a file saved by v5 is not flagged as migrated', () => {
    const { data } = parseDatabaseModel(readFixture('v4.15.json'));
    const reloaded = parseDatabaseModel(structuredClone(data));
    expect(reloaded.migrated).toBe(false);
    expect(reloaded.errors).toStrictEqual([]);
  });
});
