import { migrateAllData, shouldUseThisMigration } from '../db.migration.v5.js';

describe('v4 to v5', () => {
  it.each([
    ['3.16.1', false],
    ['4.13.0', true],
    ['5.0.0-alpha.0', false],
    ['6.0.0', false],
  ])('only migrates v4 projects: %s', (version, expected) => {
    expect(shouldUseThisMigration({ settings: { version } })).toBe(expected);
  });

  it('stamps v5 without mutating the source or losing project sections', () => {
    const source = {
      settings: { version: '4.13.0', language: 'en' },
      customFields: { Notes: { label: 'Notes', type: 'text', colour: '' } },
      project: { title: 'Show' },
      futureSection: { keep: true },
    };
    const original = structuredClone(source);

    expect(migrateAllData(source)).toEqual({
      ...source,
      settings: { ...source.settings, version: '5.0.0' },
    });
    expect(source).toEqual(original);
  });
});
