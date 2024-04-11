/**
 * This module encapsulates logic related to
 * Google Sheets
 */

import { CustomFields, OntimeRundown } from 'ontime-types';
import { ImportMap } from 'ontime-utils';

import { extname } from 'path';
import { existsSync } from 'fs';
import xlsx from 'node-xlsx';

import { parseExcel } from '../../utils/parser.js';
import { parseCustomFields, parseRundown } from '../../utils/parserFunctions.js';
import { deleteFile } from '../../utils/parserUtils.js';

let excelData: { name: string; data: unknown[][] }[] = [];

export async function saveExcelFile(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error('Upload of excel file failed');
  }
  if (extname(filePath) != '.xlsx') {
    throw new Error('Wrong file format');
  }
  excelData = xlsx.parse(filePath, { cellDates: true });

  await deleteFile(filePath);
}

export function listWorksheets() {
  return excelData.map((value) => value.name);
}

export function generateRundownPreview(
  options: ImportMap,
  link = false,
): { rundown: OntimeRundown; customFields: CustomFields } {
  const data = excelData.find(({ name }) => name.toLowerCase() === options.worksheet.toLowerCase())?.data;

  if (!data) {
    throw new Error(`Could not find data to import, maybe the worksheet name is incorrect: ${options.worksheet}`);
  }

  const dataFromExcel = parseExcel(data, options);

  // we run the parsed data through an extra step to ensure the objects shape
  const rundown = parseRundown(dataFromExcel, link);
  if (rundown.length === 0) {
    throw new Error(`Could not find data to import in the worksheet: ${options.worksheet}`);
  }
  const customFields = parseCustomFields(dataFromExcel);

  // clear the data
  excelData = [];

  return { rundown, customFields };
}
