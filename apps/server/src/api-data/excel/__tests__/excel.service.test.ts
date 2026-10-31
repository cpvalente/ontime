import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import xlsx from 'xlsx';

import { demoDb } from '../../../models/demoProject.js';
import { generateExcelWorkbook, generateExcelFile, getWorksheetMetadata, readExcelFile } from '../excel.service.js';

it('reads an uploaded workbook and returns its worksheet metadata', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ontime-excel-'));
  const filePath = join(directory, 'upload.xlsx');
  try {
    await writeFile(filePath, generateExcelFile(demoDb.rundowns.default, demoDb.customFields));

    const result = await readExcelFile(filePath);

    expect(result.worksheets).toHaveLength(1);
    expect(result.metadata).not.toBeNull();
    expect(result.metadata?.worksheet).toBe(result.worksheets[0]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('replaces the cached workbook when a newer file is uploaded', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ontime-excel-'));
  const firstFile = join(directory, 'first.xlsx');
  const secondFile = join(directory, 'second.xlsx');
  try {
    await writeFile(firstFile, generateExcelFile(demoDb.rundowns.default, demoDb.customFields));
    await writeFile(
      secondFile,
      generateExcelFile({ ...demoDb.rundowns.default, title: 'Second' }, demoDb.customFields),
    );

    const first = await readExcelFile(firstFile);
    const second = await readExcelFile(secondFile);

    expect(getWorksheetMetadata(second.worksheets[0]).worksheet).toBe(second.worksheets[0]);
    expect(() => getWorksheetMetadata(first.worksheets[0])).toThrow(`Could not find worksheet: ${first.worksheets[0]}`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('generateExcelFile()', () => {
  it('sanitises long worksheet names to an Excel-compatible value', () => {
    const buffer = generateExcelFile(
      {
        ...demoDb.rundowns.default,
        title: 'This is a very long name with many characters and weird things: like [Main]/?*',
      },
      demoDb.customFields,
    );

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const worksheetName = workbook.SheetNames[0];

    expect(worksheetName).toBeDefined();
    expect(worksheetName.length).toBeLessThanOrEqual(31);
    expect(worksheetName).not.toMatch(/[:\\/?*3[\]]/);
  });

  it('falls back to default worksheet name when title is fully invalid', () => {
    const buffer = generateExcelFile(
      {
        ...demoDb.rundowns.default,
        title: '[]:*?/\\',
      },
      demoDb.customFields,
    );

    const workbook = xlsx.read(buffer, { type: 'buffer' });

    expect(workbook.SheetNames[0]).toBe('Rundown');
  });
});

it('exports all rundowns, including empty ones, with unique valid worksheet names', () => {
  const rundown = demoDb.rundowns.default;
  const longTitle = 'A'.repeat(40);
  const buffer = generateExcelWorkbook(
    [
      { ...rundown, title: longTitle },
      { ...rundown, title: longTitle.toLowerCase() },
      { ...rundown, title: '[]:*?/\\' },
      { ...rundown, title: "'Empty'", entries: {}, order: [], flatOrder: [] },
    ],
    demoDb.customFields,
  );
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  expect(workbook.SheetNames).toEqual(['A'.repeat(31), 'a'.repeat(27) + ' (2)', 'Rundown', 'Empty']);
  expect(xlsx.utils.sheet_to_json(workbook.Sheets.Empty, { header: 1 })).toHaveLength(1);
  expect(xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }).length).toBeGreaterThan(1);
});

it('imports formatted Excel time cells as wall-clock times', async () => {
  const { parseExcel } = await import('../excel.parser.js');
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet([
    ['Title', 'Time Start', 'Duration'],
    ['Opening', 10 / 24, 5 / (24 * 60)],
  ]);
  worksheet.B2.z = 'hh:mm:ss';
  worksheet.C2.z = 'hh:mm:ss';
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Schedule');
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const loaded = xlsx.read(buffer, { type: 'buffer', cellDates: true, cellFormula: false });
  const rows: unknown[][] = xlsx.utils.sheet_to_json(loaded.Sheets.Schedule, {
    header: 1,
    blankrows: false,
    raw: false,
  });
  const { rundown } = parseExcel(rows, {});
  expect(rundown.entries[rundown.flatOrder[0]]).toMatchObject({
    timeStart: 10 * 60 * 60 * 1000,
    duration: 5 * 60 * 1000,
  });
});
