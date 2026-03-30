import { describe, expect, it } from 'vitest';

import { type ImportFormValues, builtInFieldDefs, createDefaultFormValues } from '../importMapUtils';
import { deriveHeaderOptionsState } from '../spreadsheetImportUtils';

function makeValues(patch: Partial<ImportFormValues>): ImportFormValues {
  return {
    ...createDefaultFormValues(),
    ...patch,
  };
}

function patchBuiltIn(
  base: ImportFormValues,
  patches: Record<string, Partial<{ header: string; enabled: boolean }>>,
): ImportFormValues {
  return {
    ...base,
    builtIn: base.builtIn.map((field, i) => {
      const patch = patches[builtInFieldDefs[i].label];
      return patch ? { ...field, ...patch } : field;
    }),
  };
}

describe('deriveHeaderOptionsState()', () => {
  it('excludes disabled built-in fields from assigned headers', () => {
    const values = patchBuiltIn(createDefaultFormValues(), {
      Title: { header: 'title', enabled: true },
      Cue: { header: 'cue', enabled: false },
    });
    const { assignedHeaders } = deriveHeaderOptionsState(values, ['title', 'cue']);

    expect(assignedHeaders.has('title')).toBe(true);
    expect(assignedHeaders.has('cue')).toBe(false);
  });

  it('includes custom fields in assigned headers', () => {
    const values = makeValues({
      custom: [{ ontimeName: 'MyField', importName: 'custom col' }],
    });
    const { assignedHeaders } = deriveHeaderOptionsState(values, ['custom col', 'other']);

    expect(assignedHeaders.has('custom col')).toBe(true);
    expect(assignedHeaders.has('other')).toBe(false);
  });

  it('deduplicates and filters empty sample headers', () => {
    const values = makeValues({});
    const { sampleHeaders } = deriveHeaderOptionsState(values, ['Title', 'Title', '', '  ', 'Cue']);

    expect(sampleHeaders).toEqual(['Title', 'Cue']);
  });

  it('deduplicates headers case-insensitively', () => {
    const values = makeValues({});
    const { sampleHeaders } = deriveHeaderOptionsState(values, ['Title', 'TITLE', 'title', 'Artist']);

    expect(sampleHeaders).toEqual(['Title', 'Artist']);
  });

  it('matches headers case-insensitively', () => {
    const values = patchBuiltIn(createDefaultFormValues(), {
      Title: { header: 'TITLE', enabled: true },
    });
    const { assignedHeaders } = deriveHeaderOptionsState(values, ['title', 'Cue']);

    expect(assignedHeaders.has('title')).toBe(true);
  });
});
