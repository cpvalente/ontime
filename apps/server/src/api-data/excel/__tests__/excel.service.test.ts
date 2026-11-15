import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { CustomFields } from 'ontime-types';
import xlsx from 'xlsx';

import { demoDb } from '../../../models/demoProject.js';
import { InvalidSpreadsheetDataError } from '../excel.errors.js';
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
      { ...rundown, title: `${'E'.repeat(30)}😀` },
      { ...rundown, title: `${'F'.repeat(26)}😀` },
      { ...rundown, title: `${'F'.repeat(26)}😀` },
    ],
    demoDb.customFields,
  );
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  expect(workbook.SheetNames).toEqual([
    'A'.repeat(31),
    'a'.repeat(27) + ' (2)',
    'Rundown',
    'Empty',
    'E'.repeat(30),
    `${'F'.repeat(26)}😀`,
    'F'.repeat(26) + ' (2)',
  ]);
  expect(xlsx.utils.sheet_to_json(workbook.Sheets.Empty, { header: 1 })).toHaveLength(1);
  expect(xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }).length).toBeGreaterThan(1);
});

it.each([
  ["' 'Name", 'Name'],
  ["Name' ' ", 'Name'],
  [" '  ' ", 'Rundown'],
  ['A'.repeat(29) + "' tail", 'A'.repeat(29)],
])('strips mixed boundary apostrophes and whitespace from %j', (title, expected) => {
  const rundown = { ...demoDb.rundowns.default, title };
  const noFields: CustomFields = [];
  for (const buffer of [generateExcelFile(rundown, noFields), generateExcelWorkbook([rundown], noFields)]) {
    expect(xlsx.read(buffer, { type: 'buffer' }).SheetNames).toEqual([expected]);
  }
});

it.each([
  ['a ZIP without workbook contents', 'invalid.xlsx'],
  ['a file without the .xlsx extension', 'schedule.txt'],
])('rejects %s with a safe error and removes the upload', async (_case, fileName) => {
  const directory = await mkdtemp(join(tmpdir(), 'ontime-excel-'));
  const filePath = join(directory, fileName);
  try {
    const zip = xlsx.CFB.utils.cfb_new();
    xlsx.CFB.utils.cfb_add(zip, 'notes.txt', 'not a workbook');
    await writeFile(filePath, xlsx.CFB.write(zip, { type: 'buffer', fileType: 'zip' }));
    await expect(readExcelFile(filePath)).rejects.toThrow(InvalidSpreadsheetDataError);
    await expect(access(filePath)).rejects.toMatchObject({ code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
