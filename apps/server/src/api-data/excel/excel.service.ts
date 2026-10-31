import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { extname } from 'path';

import { CustomFields, Rundown, RundownSummary } from 'ontime-types';
import type { SpreadsheetWorksheetMetadata } from 'ontime-types';
import { type ImportMap } from 'ontime-utils';
import xlsx from 'xlsx';

import { deleteFile } from '../../utils/fileManagement.js';
import { parseCustomFields } from '../custom-fields/customFields.parser.js';
import { getProjectCustomFields, processRundown } from '../rundown/rundown.dao.js';
import { parseRundown } from '../rundown/rundown.parser.js';
import { parseExcel } from './excel.parser.js';
import { rundownToTabular } from './excel.utils.js';
import { getWorkbook, retainWorkbook } from './excel.workbook.js';
import { getWorksheetMetadataFromRows } from './spreadsheetMetadata.utils.js';

const maxWorksheetNameLength = 31;
const invalidWorksheetCharsRegex = /[:\\/?*[\]]/g;

function getValidWorksheetName(title: string): string {
  const sanitisedTitle = title
    .replaceAll(invalidWorksheetCharsRegex, ' ')
    .trim()
    .replace(/^'+|'+$/g, '')
    .replace(/\s+/g, ' ');

  const withFallback = sanitisedTitle.length > 0 ? sanitisedTitle : 'Rundown';
  const truncatedTitle = withFallback.slice(0, maxWorksheetNameLength).trim().replace(/'+$/g, '');

  return truncatedTitle.length > 0 ? truncatedTitle : 'Rundown';
}

function getInitialWorksheetMetadata(worksheets: string[]): SpreadsheetWorksheetMetadata | null {
  for (const worksheet of worksheets) {
    try {
      return getWorksheetMetadata(worksheet);
    } catch {
      // Continue looking for the first worksheet with usable headers.
    }
  }

  return null;
}

/**
 * Receives and parses an excel file
 * The file is deleted after being read
 */
export async function readExcelFile(
  filePath: string,
): Promise<{ worksheets: string[]; metadata: SpreadsheetWorksheetMetadata | null }> {
  if (!existsSync(filePath)) {
    throw new Error('Upload of excel file failed');
  }
  if (extname(filePath) != '.xlsx') {
    throw new Error('Wrong file format');
  }

  const buffer = await readFile(filePath);
  const excelData = xlsx.read(buffer, { type: 'buffer', cellDates: true, cellFormula: false });
  retainWorkbook(excelData);

  await deleteFile(filePath);

  const worksheets = excelData.SheetNames;
  const metadata = getInitialWorksheetMetadata(worksheets);

  return {
    worksheets,
    metadata,
  };
}

export function generateRundownPreview(options: ImportMap): {
  rundown: Rundown;
  summary: RundownSummary;
  customFields: CustomFields;
} {
  const data = getWorkbook()?.Sheets[options.worksheet];

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

export function getWorksheetMetadata(worksheet: string) {
  const data = getWorkbook()?.Sheets[worksheet];

  if (!data) {
    throw new Error(`Could not find worksheet: ${worksheet}`);
  }

  const arrayOfData: unknown[][] = xlsx.utils.sheet_to_json(data, { header: 1, blankrows: false, raw: false });
  return getWorksheetMetadataFromRows(worksheet, arrayOfData);
}

/**
 * Creates an xlsx file from a given rundown and custom fields
 * @throws if the rundown is empty
 */
export function generateExcelFile(rundown: Rundown, customFields: CustomFields): Buffer {
  if (rundown.order.length === 0) {
    throw new Error('Cannot generate an Excel file from an empty rundown');
  }

  return generateExcelWorkbook([rundown], customFields);
}

/** Exports every rundown, including empty ones, with unique Excel-safe worksheet names. */
export function generateExcelWorkbook(rundowns: Rundown[], customFields: CustomFields): Buffer {
  if (rundowns.length === 0) {
    throw new Error('Cannot export a project without rundowns');
  }
  const workbook = xlsx.utils.book_new();
  const names = new Set<string>();
  for (const rundown of rundowns) {
    const baseName = getValidWorksheetName(rundown.title);
    let name = baseName;
    let suffix = 2;
    while (names.has(name.toLowerCase())) {
      const ending = ` (${suffix++})`;
      name = `${baseName.slice(0, maxWorksheetNameLength - ending.length)}${ending}`;
    }
    names.add(name.toLowerCase());
    const worksheet = xlsx.utils.aoa_to_sheet(rundownToTabular(rundown, customFields));
    xlsx.utils.book_append_sheet(workbook, worksheet, name);
  }

  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
