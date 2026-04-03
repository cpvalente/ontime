import type { SpreadsheetWorksheetMetadata } from 'ontime-types';

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return String(value).trim();
}

function countNonEmpty(row: string[]): number {
  return row.filter((cell) => cell.length > 0).length;
}

/**
 * Finds the index of the header row in a spreadsheet.
 * Prioritizes rows with >5 non-empty columns (early exit), otherwise returns the row with the most columns.
 * This heuristic works because header rows typically have more columns than data rows.
 * @param rows - Array of spreadsheet rows, each containing normalized cell values
 * @returns Index of the header row, or -1 if no data is found
 */
function findHeaderRowIndex(rows: string[][]): number {
  const rowCounts = rows.map(countNonEmpty);

  let bestIndex = -1;
  let bestCount = 0;

  for (let index = 0; index < rowCounts.length; index++) {
    const count = rowCounts[index];

    // Early exit if we find a row with >5 columns (likely a header)
    if (count > 5) {
      return index;
    }

    // Otherwise track the row with the most columns
    if (count > bestCount) {
      bestIndex = index;
      bestCount = count;
    }
  }

  return bestIndex;
}

/**
 * Extracts metadata from a spreadsheet worksheet including detected headers.
 * Normalizes cell values and identifies the header row.
 * @throws Error if no data is found or headers cannot be detected
 */
export function getWorksheetMetadataFromRows(worksheet: string, sheetRows: unknown[][]): SpreadsheetWorksheetMetadata {
  const rows = sheetRows.map((row) => row.map(normalizeCell));
  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === -1) {
    throw new Error(`Could not find any data in worksheet: ${worksheet}`);
  }

  const headerEntries = rows[headerRowIndex]
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => header.length > 0);

  if (headerEntries.length === 0) {
    throw new Error(`Could not detect worksheet headers in: ${worksheet}`);
  }

  return {
    worksheet,
    headers: headerEntries.map(({ header }) => header),
  };
}
