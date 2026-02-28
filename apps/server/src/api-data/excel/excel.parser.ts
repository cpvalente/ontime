import {
  CustomFields,
  EntryCustomFields,
  OntimeEntry,
  OntimeEvent,
  OntimeGroup,
  OntimeMilestone,
  Rundown,
  SupportedEntry,
  TimerType,
  isOntimeGroup,
  isOntimeMilestone,
} from 'ontime-types';
import {
  ImportMap,
  defaultImportMap,
  generateId,
  isKnownTimerType,
  makeString,
  validateEndAction,
  validateTimerType,
} from 'ontime-utils';

import { Prettify } from 'ts-essentials';

import { is } from '../../utils/is.js';
import { parseExcelDate } from '../../utils/time.js';
import { SheetMetadata, generateImportHandlers, getCustomFieldData, parseBooleanString } from './excel.utils.js';

type MergedOntimeEntry = Prettify<
  Omit<Omit<Omit<OntimeEvent, keyof OntimeGroup> & OntimeGroup, keyof OntimeMilestone> & OntimeMilestone, 'type'> & {
    type: SupportedEntry | 'group-end';
  }
>;

/**
 * @description Excel array parser
 * @param {array} excelData - array with excel sheet
 * @param {ImportOptions} options - an object that contains the import map
 * @returns {object} - parsed object
 */
export const parseExcel = (
  excelData: unknown[][],
  existingCustomFields: CustomFields,
  sheetName: string = 'Rundown from excel',
  options?: Partial<ImportMap>,
): {
  rundown: Rundown;
  customFields: CustomFields;
  sheetMetadata: SheetMetadata;
} => {
  const importMap: ImportMap = { ...defaultImportMap, ...options };

  for (const [key, value] of Object.entries(importMap)) {
    if (is.string(value)) {
      // @ts-expect-error -- we are sure that the key exists
      importMap[key] = value.toLowerCase().trim();
    }
  }

  const { mergedCustomFields, customFieldImportKeys } = getCustomFieldData(importMap, existingCustomFields);
  const rundown: Rundown = {
    id: generateId(),
    title: sheetName,
    order: [],
    flatOrder: [],
    entries: {},
    revision: 0,
  };

  // for placing entries into groups
  let currentGroupId: string | null = null;
  const groupEntries: string[] = [];
  const { handlers, indexMap, sheetMetadata } = generateImportHandlers(importMap);

  excelData.forEach((row, rowIndex) => {
    if (row.length === 0) {
      return;
    }

    const entry: Partial<MergedOntimeEntry> = {};

    const entryCustomFields: EntryCustomFields = {};

    for (let j = 0; j < row.length; j++) {
      const column = row[j];
      // 1. we check if we have set a flag for a known field
      if (j === indexMap.timerType) {
        const maybeTimeType = makeString(column, '').toLowerCase();
        if (maybeTimeType === 'group' || maybeTimeType === 'group-start') {
          entry.type = SupportedEntry.Group;
          entry.entries = [];
        } else if (maybeTimeType === 'group-end') {
          entry.type = 'group-end';
        } else if (maybeTimeType === 'milestone') {
          entry.type = SupportedEntry.Milestone;
        } else if (maybeTimeType === 'skip-import') {
          // intentional skip
          return;
        } else if (maybeTimeType === '' || maybeTimeType === 'event' || isKnownTimerType(maybeTimeType)) {
          entry.type = SupportedEntry.Event;
          entry.timerType = validateTimerType(maybeTimeType);
        } else {
          // if it is not a group or a known type, we dont import it
          return;
        }
      } else if (j === indexMap.title) {
        entry.title = makeString(column, '');
      } else if (j === indexMap.timeStart) {
        entry.timeStart = parseExcelDate(column);
      } else if (j === indexMap.linkStart) {
        entry.linkStart = parseBooleanString(column);
      } else if (j === indexMap.timeEnd) {
        entry.timeEnd = parseExcelDate(column);
      } else if (j === indexMap.duration) {
        entry.duration = parseExcelDate(column);
      } else if (j === indexMap.cue) {
        entry.cue = makeString(column, '');
      } else if (j === indexMap.flag) {
        entry.flag = parseBooleanString(column);
      } else if (j === indexMap.countToEnd) {
        entry.countToEnd = parseBooleanString(column);
      } else if (j === indexMap.skip) {
        entry.skip = parseBooleanString(column);
      } else if (j === indexMap.note) {
        entry.note = makeString(column, '');
      } else if (j === indexMap.endAction) {
        entry.endAction = validateEndAction(column);
      } else if (j === indexMap.timeWarning) {
        entry.timeWarning = parseExcelDate(column);
      } else if (j === indexMap.timeDanger) {
        entry.timeDanger = parseExcelDate(column);
      } else if (j === indexMap.colour) {
        entry.colour = makeString(column, '');
      } else if (j === indexMap.id) {
        entry.id = encodeURIComponent(makeString(column, undefined));
      } else if (j in indexMap.custom) {
        const importKey = indexMap.custom[j];
        const ontimeKey = customFieldImportKeys[importKey];
        entryCustomFields[ontimeKey] = makeString(column, '');
      } else {
        // 2. if there is no flag, lets see if we know the field type
        if (typeof column === 'string') {
          // we cant deal with empty content
          if (column.length === 0) {
            continue;
          }
          const columnText = column.toLowerCase().trim();

          // check if it is an ontime column
          if (handlers[columnText]) {
            // @ts-expect-error -- its ok
            handlers[columnText](rowIndex, j, undefined, undefined);
          }

          // check if it is a custom field
          if (columnText in customFieldImportKeys) {
            const ontimeKey = customFieldImportKeys[columnText];
            handlers.custom(rowIndex, j, columnText, ontimeKey);
          }

          // else. we don't know how to handle this column
          // just ignore it
        }
      }
    }

    // if we didnt find any keys (empty row, or some other data), skip making an event
    const keysFound = Object.keys(entry).length + Object.keys(entryCustomFields).length;
    if (keysFound === 0) {
      return;
    }

    const id = entry.id || generateId();

    if (entry.type === 'group-end') {
      if (currentGroupId) {
        (rundown.entries[currentGroupId] as OntimeGroup).entries = groupEntries.splice(0);
        currentGroupId = null;
      }
      return;
    }

    // from excel, we can only get groups, milestones and events
    if (isOntimeGroup(entry as OntimeEntry)) {
      const group = {
        ...entry,
        id,
        targetDuration: entry.duration ? entry.duration : null,
        custom: { ...entryCustomFields },
      } as OntimeGroup;

      rundown.entries[id] = group;
      if (currentGroupId) {
        (rundown.entries[currentGroupId] as OntimeGroup).entries = groupEntries.splice(0);
      }
      rundown.order.push(id);
      rundown.flatOrder.push(id);
      currentGroupId = id;
      return;
    }

    if (isOntimeMilestone(entry as OntimeEntry)) {
      const milestone = {
        ...entry,
        id,
        custom: { ...entryCustomFields },
      } as OntimeMilestone;
      if (currentGroupId) {
        groupEntries.push(id);
        milestone.parent = currentGroupId;
      } else {
        rundown.order.push(id);
      }
      rundown.flatOrder.push(id);
      rundown.entries[id] = milestone;
      return;
    }

    // after group and milestones we only have events remaining
    const event = {
      ...entry,
      id,
      custom: { ...entryCustomFields },
      type: SupportedEntry.Event,
    } as OntimeEvent;

    if (indexMap.timerType === null) {
      event.timerType = TimerType.CountDown;
    }

    // we link all events unless user specifies otherwise
    if (entry.linkStart === undefined) {
      event.linkStart = true;
    }

    if (currentGroupId) {
      groupEntries.push(id);
      event.parent = currentGroupId;
    } else {
      rundown.order.push(id);
    }
    rundown.flatOrder.push(id);
    rundown.entries[id] = event;
  });

  if (currentGroupId) {
    (rundown.entries[currentGroupId] as OntimeGroup).entries = groupEntries.splice(0);
  }

  return {
    rundown,
    customFields: mergedCustomFields,
    sheetMetadata,
  };
};
