/**
 * This module encapsulates logic related to
 * Google Sheets
 */

import { existsSync } from 'fs';
import { extname } from 'path';

import { CustomFields, Rundown, RundownSummary } from 'ontime-types';
import { type ImportMap } from 'ontime-utils';
import xlsx from 'xlsx';
import type { WorkBook } from 'xlsx';

import { deleteFile } from '../../utils/fileManagement.js';
import { parseCustomFields } from '../custom-fields/customFields.parser.js';
import { getProjectCustomFields, processRundown } from '../rundown/rundown.dao.js';
import { parseRundown } from '../rundown/rundown.parser.js';
import { parseExcel } from './excel.parser.js';
import { rundownToTabular } from './excel.utils.js';

// we keep the excel data in memory to allow the flow upload -> preview
let excelData: WorkBook = xlsx.utils.book_new();

/**
 * Receives and parses an excel file
 * The file is deleted after being read
 */
export async function readExcelFile(filePath: string): Promise<string[]> {
  if (!existsSync(filePath)) {
    throw new Error('Upload of excel file failed');
  }
  if (extname(filePath) != '.xlsx') {
    throw new Error('Wrong file format');
  }

  // clear the data
  excelData = xlsx.readFile(filePath, { cellDates: true, cellFormula: false });

  await deleteFile(filePath);

  return excelData.SheetNames;
}

export function generateRundownPreview(options: ImportMap): {
  rundown: Rundown;
  summary: RundownSummary;
  customFields: CustomFields;
} {
  const data = excelData.Sheets[options.worksheet];

  if (!data) {
    throw new Error(`Could not find data to import, maybe the worksheet name is incorrect: ${options.worksheet}`);
  }

  const arrayOfData: unknown[][] = xlsx.utils.sheet_to_json(data, { header: 1, blankrows: false, raw: false });

  const dataFromExcel = parseExcel(arrayOfData, getProjectCustomFields(), options.worksheet, options);
  if (dataFromExcel.rundown.flatOrder.length === 0) {
    throw new Error(`Could not find data to import in the worksheet: ${options.worksheet}`);
  }

  // we run the parsed data through an extra step to ensure the objects shape
  const customFields = parseCustomFields(dataFromExcel);
  const parsedRundown = parseRundown(dataFromExcel.rundown, customFields);
  const processedRundown = processRundown(parsedRundown, customFields);

  return {
    rundown: {
      id: parsedRundown.id,
      title: parsedRundown.title,
      order: processedRundown.order,
      flatOrder: processedRundown.flatEntryOrder,
      entries: processedRundown.entries,
      revision: 0,
    },
    summary: {
      duration: processedRundown.totalDuration,
      start: processedRundown.firstStart,
      end: processedRundown.lastEnd,
    },
    customFields,
  };
}

/**
 * Creates an xlsx file from a given rundown and custom fields
 * @throws if the rundown is empty
 */
export function generateExcelFile(rundown: Rundown, customFields: CustomFields): Buffer {
  if (rundown.order.length === 0) {
    throw new Error('Cannot generate an Excel file from an empty rundown');
  }

  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(rundownToTabular(rundown, customFields));
  xlsx.utils.book_append_sheet(workbook, worksheet, rundown.title || 'Rundown');

  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
