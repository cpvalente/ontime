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

  it.each([undefined, ['order', 'fields']])(
    'wraps the legacy record, preserving other sections and the source',
    (customFieldOrder) => {
      const source = {
        settings: { version: '4.13.0', language: 'en' },
        customFields: {
          fields: { label: 'fields', type: 'text', colour: '' },
          order: { label: 'order', type: 'text', colour: '' },
        },
        customFieldOrder,
        project: { title: 'Show' },
        futureSection: { keep: true },
      };
      const original = structuredClone(source);

      const result = migrateAllData(source);

      expect(result).toEqual({
        settings: { version: '5.0.0', language: 'en' },
        customFields: { fields: source.customFields, order: customFieldOrder },
        project: source.project,
        futureSection: source.futureSection,
      });
      expect(source).toEqual(original);
    },
  );
});
