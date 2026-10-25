import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import xlsx from 'xlsx';

import { demoDb } from '../../../models/demoProject.js';
import { generateExcelFile, getWorksheetMetadata, readExcelFile } from '../excel.service.js';

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
