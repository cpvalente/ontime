import { describe, expect, it } from 'vitest';

import { getWorksheetMetadataFromRows } from '../spreadsheetMetadata.utils.js';

describe('getWorksheetMetadataFromRows()', () => {
  it('detects headers from the first meaningful row', () => {
    const result = getWorksheetMetadataFromRows('Sheet 1', [
      [''],
      ['Cue', 'Title', 'Duration'],
      ['1', 'Opening', '00:05:00'],
      ['2', 'Intro', '00:02:00'],
    ]);

    expect(result.headers).toEqual(['Cue', 'Title', 'Duration']);
  });

  it('throws when no worksheet headers can be found', () => {
    expect(() => getWorksheetMetadataFromRows('Empty', [[''], ['']])).toThrow('Could not find any data in worksheet');
  });

  it('falls back to a single non-empty cell as the header row', () => {
    const result = getWorksheetMetadataFromRows('Sheet', [['Title'], ['Opening'], ['Closing']]);

    expect(result.headers).toEqual(['Title']);
  });

  it('normalizes numeric and mixed-type cell values to strings', () => {
    const result = getWorksheetMetadataFromRows('Sheet', [
      [42, true, 'Name', 'Value'],
      ['a', 'b'],
    ]);

    expect(result.headers).toEqual(['42', 'true', 'Name', 'Value']);
  });

  it('filters sparse columns where headers are empty', () => {
    const result = getWorksheetMetadataFromRows('Sheet', [
      ['Cue', '', 'Title', '', 'Duration', 'Note'],
      ['1', '', 'Opening', '', '', ''],
      ['2', '', 'Closing', '', '', ''],
    ]);

    expect(result.headers).toEqual(['Cue', 'Title', 'Duration', 'Note']);
  });

  it('uses progressive threshold to find row with most columns', () => {
    // First row has 2 columns, second row has 6 - should pick the second row as it's more likely to be a header
    const result = getWorksheetMetadataFromRows('Sheet', [
      ['', ''],
      ['ID', 'Cue', 'Title', 'Start', 'Duration', 'Note'],
      ['1', '1.0', 'Opening', '10:00', '5:00', 'Test'],
      ['2', '2.0', 'Closing', '10:05', '3:00', 'Test2'],
    ]);

    expect(result.headers).toEqual(['ID', 'Cue', 'Title', 'Start', 'Duration', 'Note']);
  });
});
