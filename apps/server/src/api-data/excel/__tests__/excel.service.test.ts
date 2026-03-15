import xlsx from 'xlsx';

import { demoDb } from '../../../models/demoProject.js';
import { generateExcelFile } from '../excel.service.js';

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
