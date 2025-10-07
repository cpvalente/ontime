import { CustomFieldKey, CustomFields, MaybeNumber, OntimeEntry, Rundown } from 'ontime-types';
import { checkRegex, customFieldLabelToKey, ImportMap, millisToString } from 'ontime-utils';

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
    id: null,
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
    [importMap.id]: (row: number, col: number) => {
      indexMap.id = col;
      sheetMetadata['id'] = { row, col }; // important this will be used in a normal context where the id is not called entryId
    },
    custom: (row: number, col: number, columnText: string, ontimeKey: string) => {
      indexMap.custom[col] = columnText;
      sheetMetadata[`custom:${ontimeKey}`] = { row, col };
    },
  };

  return { handlers, indexMap, sheetMetadata };
}

const emptyCellValue = '';

/**
 * Converts a given rundown to 2D array tabular format
 * All fields are converted to their string representation as specified by excel
 */
export function rundownToTabular(rundown: Rundown, customFields: CustomFields): string[][] {
  const flatRundown: string[][] = [];
  // we reuse the keys from the import map so import <> export works by default
  const keys = Object.keys(matchedWithDefaultImportMap) as (keyof typeof matchedWithDefaultImportMap)[];
  const customFieldKeys = Object.keys(customFields) as CustomFieldKey[];

  // create header row
  const headerRow: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    headerRow.push(matchedWithDefaultImportMap[key]);
  }
  for (let i = 0; i < customFieldKeys.length; i++) {
    const key = customFieldKeys[i];
    headerRow.push(customFields[key].label);
  }
  flatRundown.push(headerRow);

  // create table body
  let previousEntry: OntimeEntry | undefined;
  for (let i = 0; i < rundown.flatOrder.length; i++) {
    const entryId = rundown.flatOrder[i];
    const entry = rundown.entries[entryId];
    if (!entry) continue;
    // we opt for not exporting delays as they are only relevant for runtime
    if (entry.type === 'delay') continue;

    // we need a group-end if:
    // - the previous entry was a group and now we have another group (both parents are undefined)
    // - the previous entry had a parent and the new entry is a group (parent undefined)
    // - the previous entry had a parent and the new one doesnt (parent null)
    if (
      previousEntry &&
      ((previousEntry.type === 'group' && entry.type === 'group') ||
        // @ts-expect-error -- we safely check if the property is nullish
        (previousEntry?.parent !== null && entry?.parent == null))
    ) {
      addGroupEnd();
    }

    previousEntry = entry;
    const entryRow: string[] = [];

    // each entry is a row in the table
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      // handle edge cases for group
      if (entry.type === 'group') {
        if (key === 'duration') {
          const groupDuration = entry.targetDuration === null ? '' : parseField('duration', entry.targetDuration);
          entryRow.push(groupDuration);
          continue;
        } else if (key === 'timerType') {
          entryRow.push('group');
          continue;
        }
      }

      // handle edge cases for milestones
      if (entry.type === 'milestone') {
        if (key === 'timerType') {
          entryRow.push('milestone');
          continue;
        }
      }

      // handle edge cases for events
      if (entry.type === 'event') {
        if (key === 'endAction' && entry.endAction === 'none') {
          entryRow.push(emptyCellValue);
          continue;
        }
      }

      if (key in entry) {
        entryRow.push(parseField(key, entry[key as keyof typeof entry]));
      } else {
        // we push an empty cell to keep the column positioning
        entryRow.push(emptyCellValue);
      }
    }

    // add custom fields
    if ('custom' in entry) {
      for (let i = 0; i < customFieldKeys.length; i++) {
        const customFieldKey = customFieldKeys[i] as CustomFieldKey;
        const value = entry.custom?.[customFieldKey] ?? emptyCellValue;
        entryRow.push(String(value));
      }
    }
    flatRundown.push(entryRow);
  }

  // close dangling groups
  // - last element as a group: previous entry.parent is undefined
  // - last element was in a group: previous entry.parent is string
  if (previousEntry && (previousEntry.type === 'group' || previousEntry.parent !== null)) {
    addGroupEnd();
  }

  /**
   * Adds a new row with group-end timerType
   * Ensures that all columns are filled with the correct type
   */
  function addGroupEnd() {
    const emptyRow = Array(keys.length).fill(emptyCellValue);
    const timerTypeIndex = keys.indexOf('timerType');
    emptyRow[timerTypeIndex] = 'group-end';
    flatRundown.push(emptyRow);
  }

  return flatRundown;
}

/**
 * Map between the ontime key and the excel column name
 * This needs to match match the default import map
 * TODO: could we organise these objects to have a single source of truth?
 */
const matchedWithDefaultImportMap = {
  id: 'ID',
  flag: 'Flag',
  cue: 'Cue',
  title: 'Title',
  colour: 'Colour',
  timeStart: 'Time Start',
  timeEnd: 'Time End',
  duration: 'Duration',
  linkStart: 'Link Start',
  countToEnd: 'Count to end',
  note: 'Note',
  timerType: 'Timer Type',
  endAction: 'End Action',
  timeWarning: 'Warning Time',
  timeDanger: 'Danger Time',
  skip: 'Skip',
};

/**
 * Parses a fields value into a string suitable for excel
 */
function parseField(field: string, data: unknown) {
  if (data == null) return emptyCellValue;

  if (
    field === 'timeStart' ||
    field === 'timeEnd' ||
    field === 'duration' ||
    field === 'timeWarning' ||
    field === 'timeDanger'
  ) {
    return millisToString(data as MaybeNumber, { fallback: emptyCellValue });
  }

  if (typeof data === 'boolean') {
    return data ? 'TRUE' : emptyCellValue;
  }

  return typeof data == 'string' ? data : String(data);
}
