/**
 * This module encapsulates logic related to
 * Google Sheets
 */

import { CustomFields, Rundown } from 'ontime-types';
import { type ImportMap } from 'ontime-utils';

import { extname } from 'path';
import { existsSync } from 'fs';
import xlsx from 'xlsx';
import type { WorkBook } from 'xlsx';

import { parseExcel } from '../../utils/parser.js';
import { parseCustomFields } from '../../utils/parserFunctions.js';
import { deleteFile } from '../../utils/parserUtils.js';

import { parseRundown } from '../rundown/rundown.parser.js';
import { getProjectCustomFields } from '../rundown/rundown.dao.js';

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

export function generateRundownPreview(options: ImportMap): { rundown: Rundown; customFields: CustomFields } {
  const data = excelData.Sheets[options.worksheet];

  if (!data) {
    throw new Error(`Could not find data to import, maybe the worksheet name is incorrect: ${options.worksheet}`);
  }

  const arrayOfData: unknown[][] = xlsx.utils.sheet_to_json(data, { header: 1, blankrows: false, raw: false });

  const dataFromExcel = parseExcel(arrayOfData, getProjectCustomFields(), options.worksheet, options);
  const parsedCustomFields = parseCustomFields(dataFromExcel);

  // we run the parsed data through an extra step to ensure the objects shape
  const Rundown = parseRundown(dataFromExcel.rundown, parsedCustomFields);
  if (Rundown.order.length === 0) {
    throw new Error(`Could not find data to import in the worksheet: ${options.worksheet}`);
  }

  // clear the data
  excelData = xlsx.utils.book_new();

  return { rundown: Rundown, customFields: parsedCustomFields };
}
