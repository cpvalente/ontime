import { afterEach, describe, expect, it } from 'vitest';

import {
  builtInFieldDefs,
  convertToImportMap,
  createDefaultFormValues,
  getImportWarnings,
  getPersistedImportState,
  getResolvedCustomFields,
  persistImportState,
} from '../importMapUtils';

const cueIndex = builtInFieldDefs.findIndex((field) => field.label === 'Cue');
const titleIndex = builtInFieldDefs.findIndex((field) => field.label === 'Title');

describe('getImportWarnings()', () => {
  it('warns when two mappings target the same spreadsheet column', () => {
    const values = createDefaultFormValues();
    values.builtIn[titleIndex] = { header: 'title', enabled: true };
    values.custom = [{ ontimeName: '', importName: 'title' }];

    const warnings = getImportWarnings(values, ['title']);

    expect(warnings[`builtIn.${titleIndex}.header`]).toBeUndefined();
    expect(warnings['custom.0.importName']).toStrictEqual({ kind: 'duplicate' });
  });

  it('warns when a mapped column is not present in the worksheet', () => {
    const values = createDefaultFormValues();
    values.builtIn[titleIndex] = { header: 'headline', enabled: true };

    const warnings = getImportWarnings(values, ['title', 'cue']);

    expect(warnings[`builtIn.${titleIndex}.header`]).toStrictEqual({ kind: 'missing' });
  });

  it('matches worksheet headers case-insensitively and ignores disabled or blank mappings', () => {
    const values = createDefaultFormValues();
    values.builtIn[cueIndex] = { header: 'title', enabled: false };
    values.builtIn[titleIndex] = { header: 'TITLE', enabled: true };
    values.custom = [
      { ontimeName: '', importName: '' },
      { ontimeName: '', importName: '   ' },
    ];

    const warnings = getImportWarnings(values, ['title']);

    expect(warnings[`builtIn.${cueIndex}.header`]).toBeUndefined();
    expect(warnings[`builtIn.${titleIndex}.header`]).toBeUndefined();
    expect(warnings['custom.0.importName']).toBeUndefined();
    expect(warnings['custom.1.importName']).toBeUndefined();
  });

  it('warns when a custom header cannot be converted into an Ontime field name', () => {
    const values = createDefaultFormValues();
    values.custom = [{ ontimeName: '', importName: '***' }];

    const warnings = getImportWarnings(values, ['***']);

    expect(warnings['custom.0.importName']).toStrictEqual({ kind: 'invalid-name' });
  });

  it('warns when a custom header resolves to an existing Ontime field name', () => {
    const values = createDefaultFormValues();
    values.custom = [
      { ontimeName: '', importName: 'Artist-1' },
      { ontimeName: '', importName: 'Artist/1' },
      { ontimeName: '', importName: 'Title!' },
      { ontimeName: '', importName: 'Presenter-1' },
    ];

    const warnings = getImportWarnings(values, ['Artist-1', 'Artist/1', 'Title!', 'Presenter-1'], ['Presenter 1']);

    expect(warnings['custom.0.importName']).toBeUndefined();
    expect(warnings['custom.1.importName']).toStrictEqual({ kind: 'name-collision' });
    expect(warnings['custom.2.importName']).toStrictEqual({ kind: 'name-collision' });
    expect(warnings['custom.3.importName']).toStrictEqual({ kind: 'name-collision' });
  });
});

describe('getResolvedCustomFields()', () => {
  it('trims spreadsheet headers and derives the Ontime field name from them', () => {
    const resolved = getResolvedCustomFields([
      { ontimeName: '', importName: '  FOH/Monitor  ' },
      { ontimeName: '', importName: 'Artist-1' },
    ]);

    expect(resolved).toStrictEqual([
      { ontimeName: 'FOH Monitor', importName: 'FOH/Monitor' },
      { ontimeName: 'Artist 1', importName: 'Artist-1' },
    ]);
  });

  it('keeps invalid or empty custom headers unresolved', () => {
    const resolved = getResolvedCustomFields([
      { ontimeName: '', importName: '' },
      { ontimeName: '', importName: '***' },
    ]);

    expect(resolved).toStrictEqual([
      { ontimeName: '', importName: '' },
      { ontimeName: '', importName: '***' },
    ]);
  });
});

describe('convertToImportMap()', () => {
  it('uses resolved custom field names, skips invalid custom rows, and clears disabled built-in fields', () => {
    const values = createDefaultFormValues();
    values.builtIn[titleIndex] = { header: 'title', enabled: false };
    values.custom = [
      { ontimeName: 'ignored', importName: 'FOH/Monitor' },
      { ontimeName: 'ignored', importName: '***' },
    ];

    const importMap = convertToImportMap(values);

    expect(importMap.title).toBe('');
    expect(importMap.cue).toBe('cue');
    expect(importMap.custom).toStrictEqual({
      'FOH Monitor': 'FOH/Monitor',
    });
  });
});

describe('getPersistedImportState()', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns default form values when nothing is stored', () => {
    const result = getPersistedImportState('test-source');
    expect(result).toStrictEqual(createDefaultFormValues());
  });

  it('returns stored values when they match the expected schema', () => {
    const customValues = createDefaultFormValues();
    customValues.worksheet = 'My Sheet';
    customValues.custom = [{ ontimeName: 'Performer', importName: 'performer' }];

    persistImportState('test-source', customValues);

    const result = getPersistedImportState('test-source');
    expect(result).toStrictEqual(customValues);
  });

  it('returns default values and removes storage when the schema is invalid', () => {
    // Store an object that looks vaguely valid but has wrong shape
    const invalidData = { worksheet: 123, builtIn: 'not-an-array', custom: [] };
    // makeStageKey returns the bare key when baseURI is empty (as it is in tests)
    const storageKey = 'import-map:invalid-source';
    localStorage.setItem(storageKey, JSON.stringify(invalidData));

    const result = getPersistedImportState('invalid-source');

    expect(result).toStrictEqual(createDefaultFormValues());
    // Corrupted entry should be cleaned up
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('returns default values and removes storage when JSON is malformed', () => {
    const storageKey = 'import-map:broken-source';
    localStorage.setItem(storageKey, '{invalid json{{');

    const result = getPersistedImportState('broken-source');

    expect(result).toStrictEqual(createDefaultFormValues());
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('returns default values when builtIn array has wrong length', () => {
    const values = createDefaultFormValues();
    // Truncate builtIn so it has fewer entries than builtInFieldDefs
    values.builtIn = values.builtIn.slice(0, 2);
    // makeStageKey returns bare key when baseURI is empty (test environment)
    localStorage.setItem('import-map:short-source', JSON.stringify(values));

    const result = getPersistedImportState('short-source');

    expect(result).toStrictEqual(createDefaultFormValues());
  });

  it('isolates storage by sourceKey', () => {
    const valuesA = createDefaultFormValues();
    valuesA.worksheet = 'Sheet A';
    const valuesB = createDefaultFormValues();
    valuesB.worksheet = 'Sheet B';

    persistImportState('source-a', valuesA);
    persistImportState('source-b', valuesB);

    expect(getPersistedImportState('source-a').worksheet).toBe('Sheet A');
    expect(getPersistedImportState('source-b').worksheet).toBe('Sheet B');
  });
});

describe('getImportWarnings() with existingCustomFieldLabels', () => {
  it('does not warn when existingCustomFieldLabels is empty (default)', () => {
    const values = createDefaultFormValues();
    values.custom = [{ ontimeName: '', importName: 'VideoInfo' }];

    const warnings = getImportWarnings(values, ['VideoInfo']);

    expect(warnings['custom.0.importName']).toBeUndefined();
  });

  it('warns with name-collision when custom field resolves to an existing label', () => {
    const values = createDefaultFormValues();
    values.custom = [{ ontimeName: '', importName: 'Video Info' }];

    const warnings = getImportWarnings(values, ['Video Info'], ['Video Info']);

    expect(warnings['custom.0.importName']).toStrictEqual({ kind: 'name-collision' });
  });

  it('performs case-insensitive matching against existingCustomFieldLabels', () => {
    const values = createDefaultFormValues();
    values.custom = [{ ontimeName: '', importName: 'VIDEO INFO' }];

    const warnings = getImportWarnings(values, ['VIDEO INFO'], ['video info']);

    expect(warnings['custom.0.importName']).toStrictEqual({ kind: 'name-collision' });
  });

  it('trims whitespace when comparing existingCustomFieldLabels', () => {
    const values = createDefaultFormValues();
    values.custom = [{ ontimeName: '', importName: 'Artist' }];

    const warnings = getImportWarnings(values, ['Artist'], ['  Artist  ']);

    expect(warnings['custom.0.importName']).toStrictEqual({ kind: 'name-collision' });
  });

  it('ignores empty strings in existingCustomFieldLabels', () => {
    const values = createDefaultFormValues();
    values.custom = [{ ontimeName: '', importName: 'Performer' }];

    // Empty and whitespace-only labels should not cause false positives
    const warnings = getImportWarnings(values, ['Performer'], ['', '   ']);

    expect(warnings['custom.0.importName']).toBeUndefined();
  });
});
