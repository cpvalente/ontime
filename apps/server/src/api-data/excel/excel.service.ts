/**
 * This module encapsulates logic related to
 * Google Sheets
 */

import { CustomFields, OntimeRundown } from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import { extname } from 'path';
import { existsSync } from 'fs';
import xlsx from 'xlsx';
import type { WorkBook } from 'xlsx';

import { parseExcel } from '../../utils/parser.js';
import { parseRundown } from '../../utils/parserFunctions.js';
import { deleteFile } from '../../utils/parserUtils.js';
import { getCustomFields } from '../../services/rundown-service/rundownCache.js';

let excelData: WorkBook = xlsx.utils.book_new();

export async function saveExcelFile(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error('Upload of excel file failed');
  }
  if (extname(filePath) != '.xlsx') {
    throw new Error('Wrong file format');
  }
  excelData = xlsx.readFile(filePath, { cellDates: true, cellFormula: false });

  await deleteFile(filePath);
}

export function listWorksheets(): string[] {
  return excelData.SheetNames;
}

export function generateRundownPreview(options: ImportMap): { rundown: OntimeRundown; customFields: CustomFields } {
  const data = excelData.Sheets[options.worksheet];

  if (!data) {
    throw new Error(`Could not find data to import, maybe the worksheet name is incorrect: ${options.worksheet}`);
  }

  const arrayOfData: unknown[][] = xlsx.utils.sheet_to_json(data, { header: 1, blankrows: false, raw: false });

  const dataFromExcel = parseExcel(arrayOfData, getCustomFields(), options);
  // we run the parsed data through an extra step to ensure the objects shape
  const { rundown, customFields } = parseRundown(dataFromExcel);
  if (rundown.length === 0) {
    throw new Error(`Could not find data to import in the worksheet: ${options.worksheet}`);
  }

  // clear the data
  excelData = undefined;

  return { rundown, customFields };
}
