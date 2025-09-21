import { CustomFieldKey, CustomFields, MaybeNumber } from 'ontime-types';
import { checkRegex, customFieldLabelToKey, ImportMap } from 'ontime-utils';
import xlsx from 'xlsx';
import fs from 'fs';
import { excelTemplateFiles } from '../../setup/index.js';
import { isTest } from '../../setup/environment.js';

/**
 * Receives an import map which contains custom field labels and a custom fields object
 * the result importkeys is an inverted record of <importKey, ontimeKey>
 * We need this function since, when importing from sheets, the user gives us custom field labels, not keys
 * @returns the new custom fields, and a map of excel column names to ontime keys
 * @private exported for testing
 */
export function getCustomFieldData(
  importMap: ImportMap,
  existingCustomFields: CustomFields,
): {
  mergedCustomFields: CustomFields;
  customFieldImportKeys: Record<keyof CustomFields, string>;
} {
  const mergedCustomFields: CustomFields = {};
  /**
   * A map of import keys to ontime keys
   * Map<excel column name, ontime key>
   */
  const customFieldImportKeys: Record<string, CustomFieldKey> = {};

  for (const ontimeLabel in importMap.custom) {
    // if the label is not valid, we skip the import
    if (!checkRegex.isAlphanumericWithSpace(ontimeLabel)) {
      continue;
    }

    // generate a key for the custom field
    const keyInCustomFields = customFieldLabelToKey(ontimeLabel);
    // we lower case the excel key to make it easier to match
    const columnNameInExcel = importMap.custom[ontimeLabel].toLowerCase();
    const maybeExistingColour = existingCustomFields[keyInCustomFields]?.colour ?? '';

    // 1. add the custom field to the merged custom fields
    mergedCustomFields[keyInCustomFields] = {
      type: 'text', // we currently only support text custom fields
      colour: maybeExistingColour,
      label: ontimeLabel,
    };

    // 2. add the column to the import keys
    customFieldImportKeys[columnNameInExcel] = keyInCustomFields;
  }
  return { mergedCustomFields, customFieldImportKeys };
}

/**
 * Utility function infers a boolean from a string value
 */
export function parseBooleanString(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  // falsy values would be nullish or empty string
  if (!value || typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase() !== 'false';
}

type IndexMap = Record<keyof Omit<ImportMap, 'worksheet' | 'custom'>, MaybeNumber> &
  Record<keyof Pick<ImportMap, 'custom'>, Record<number, string>>;

export type SheetMetadata = Partial<
  Record<keyof Omit<ImportMap, 'worksheet' | 'custom'>, { row: number; col: number }> &
    Record<string, { row: number; col: number }>
>;

export function generateImportHandlers(importMap: ImportMap) {
  const indexMap: IndexMap = {
    title: null,
    cue: null,
    note: null,
    colour: null,
    flag: null,
    skip: null,
    countToEnd: null,
    linkStart: null,
    timeStart: null,
    timeEnd: null,
    duration: null,
    timeWarning: null,
    timeDanger: null,
    endAction: null,
    timerType: null,
    entryId: null,
    custom: {},
  };

  const sheetMetadata: SheetMetadata = {};

  const handlers = {
    [importMap.timeStart]: (row: number, col: number) => {
      indexMap.timeStart = col;
      sheetMetadata.timeStart = { row, col };
    },
    [importMap.linkStart]: (row: number, col: number) => {
      indexMap.linkStart = col;
      sheetMetadata.linkStart = { row, col };
    },
    [importMap.timeEnd]: (row: number, col: number) => {
      indexMap.timeEnd = col;
      sheetMetadata.timeEnd = { row, col };
    },
    [importMap.duration]: (row: number, col: number) => {
      indexMap.duration = col;
      sheetMetadata.duration = { row, col };
    },

    [importMap.cue]: (row: number, col: number) => {
      indexMap.cue = col;
      sheetMetadata.cue = { row, col };
    },
    [importMap.title]: (row: number, col: number) => {
      indexMap.title = col;
      sheetMetadata.title = { row, col };
    },
    [importMap.flag]: (row: number, col: number) => {
      indexMap.flag = col;
      sheetMetadata.flag = { row, col };
    },
    [importMap.countToEnd]: (row: number, col: number) => {
      indexMap.countToEnd = col;
      sheetMetadata.countToEnd = { row, col };
    },
    [importMap.skip]: (row: number, col: number) => {
      indexMap.skip = col;
      sheetMetadata.skip = { row, col };
    },
    [importMap.note]: (row: number, col: number) => {
      indexMap.note = col;
      sheetMetadata.note = { row, col };
    },
    [importMap.colour]: (row: number, col: number) => {
      indexMap.colour = col;
      sheetMetadata.colour = { row, col };
    },
    [importMap.endAction]: (row: number, col: number) => {
      indexMap.endAction = col;
      sheetMetadata.endAction = { row, col };
    },
    [importMap.timerType]: (row: number, col: number) => {
      indexMap.timerType = col;
      sheetMetadata.timerType = { row, col };
    },
    [importMap.timeWarning]: (row: number, col: number) => {
      indexMap.timeWarning = col;
      sheetMetadata.timeWarning = { row, col };
    },
    [importMap.timeDanger]: (row: number, col: number) => {
      indexMap.timeDanger = col;
      sheetMetadata.timeDanger = { row, col };
    },
    [importMap.entryId]: (row: number, col: number) => {
      indexMap.entryId = col;
      sheetMetadata['id'] = { row, col }; // important this will be used in a normal context where the id is not called entryId
    },
    custom: (row: number, col: number, columnText: string, ontimeKey: string) => {
      indexMap.custom[col] = columnText;
      sheetMetadata[`custom:${ontimeKey}`] = { row, col };
    },
  };

  return { handlers, indexMap, sheetMetadata };
}


/**
 * the content type of the rundown.templateInstructor.json
 */
export type configXlsxTemplate<Key = { [key in 'c' | 'r']: number }> = { [key in "cue" | "title" | "colour" | "timeStart" | "timeEnd" | "duration" | "note" | "timerType" | "customFields"]: Key } & { [key in "id" | "linkStart" | "countToEnd" | "endAction" | "warningTime" | "dangerTime" | "skip"]?: Key };

/**
 * change the size of the excel sheet
 */
export const changeMaxSizeOfExcel = (
  worksheet: xlsx.WorkSheet,
  config: { [key  in "c" | "r"]?: number } = {}
): xlsx.WorkSheet =>  {
  const currentMaxSize = xlsx.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  const newMaxSize = {
    s: currentMaxSize.s,
    e: { c: config.c ?? currentMaxSize.e.c, r: config.r ?? currentMaxSize.e.r }
  };
  worksheet['!ref'] = xlsx.utils.encode_range(newMaxSize);
  return worksheet;
}

const contentOfConfigForXlsxWritingFile: configXlsxTemplate<string> = isTest ? {} : JSON.parse(
  fs.readFileSync(excelTemplateFiles.rundownXlsxTemplateConfig, { encoding: 'utf8' }),
);

/**
 * the config for writing xlsx files
 */
export const configForXlsxWriting = Object.fromEntries(
  Object.entries(contentOfConfigForXlsxWritingFile).map(([k, v]) => [k, xlsx.utils.decode_cell(v)]),
) as configXlsxTemplate;