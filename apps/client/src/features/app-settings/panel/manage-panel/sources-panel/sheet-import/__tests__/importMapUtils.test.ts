import { describe, expect, it } from 'vitest';

import {
  builtInFieldDefs,
  convertToImportMap,
  createDefaultFormValues,
  getImportWarnings,
  getResolvedCustomFields,
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
