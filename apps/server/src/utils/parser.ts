import {
  customFieldLabelToKey,
  defaultImportMap,
  generateId,
  type ImportMap,
  isKnownTimerType,
  validateEndAction,
  validateTimerType,
  validateTimes,
} from 'ontime-utils';
import {
  CustomFields,
  DatabaseModel,
  EntryCustomFields,
  isOntimeBlock,
  LogOrigin,
  OntimeBlock,
  OntimeEvent,
  Rundown,
  SupportedEvent,
  TimerType,
  TimeStrategy,
} from 'ontime-types';

import { Merge } from 'ts-essentials';

import { parseAutomationSettings } from '../api-data/automation/automation.parser.js';
import { logger } from '../classes/Logger.js';
import { event as eventDef } from '../models/eventsDefinition.js';

import { makeString } from './parserUtils.js';
import { parseProject, parseRundowns, parseSettings, parseUrlPresets, parseViewSettings } from './parserFunctions.js';
import { parseExcelDate } from './time.js';
import { is } from './is.js';

export type ErrorEmitter = (message: string) => void;
export const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const JSON_MIME = 'application/json';

function parseBooleanString(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  // falsy values would be nullish or empty string
  if (!value || typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase() !== 'false';
}

export function getCustomFieldData(
  importMap: ImportMap,
  existingCustomFields: CustomFields,
): {
  customFields: CustomFields;
  customFieldImportKeys: Record<keyof CustomFields, string>;
} {
  const customFields = {};
  const customFieldImportKeys: Record<string, string> = {};

  for (const ontimeLabel in importMap.custom) {
    const ontimeKey = customFieldLabelToKey(ontimeLabel);
    if (!ontimeKey) {
      continue;
    }
    const importLabel = importMap.custom[ontimeLabel].toLowerCase();

    // @ts-expect-error -- we are sure that the key exists
    customFields[ontimeKey] = {
      type: 'string',
      colour: ontimeKey in existingCustomFields ? existingCustomFields[ontimeKey].colour : '',
      label: ontimeLabel,
    };
    customFieldImportKeys[importLabel] = ontimeKey;
  }
  return { customFields, customFieldImportKeys };
}

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
  rundownMetadata: Record<string, { row: number; col: number }>;
} => {
  const rundownMetadata: Record<string, { row: number; col: number }> = {};
  const importMap: ImportMap = { ...defaultImportMap, ...options };

  for (const [key, value] of Object.entries(importMap)) {
    if (is.string(value)) {
      // @ts-expect-error -- we are sure that the key exists
      importMap[key] = value.toLowerCase().trim();
    }
  }

  const { customFields, customFieldImportKeys } = getCustomFieldData(importMap, existingCustomFields);
  const rundown: Rundown = {
    id: generateId(),
    title: sheetName,
    order: [],
    flatOrder: [],
    entries: {},
    revision: 0,
  };

  // title stuff: strings
  let titleIndex: number | null = null;
  let cueIndex: number | null = null;
  let notesIndex: number | null = null;
  let colourIndex: number | null = null;

  // options: booleans
  let isPublicIndex: number | null = null;
  let skipIndex: number | null = null;
  let countToEndIndex: number | null = null;

  let linkStartIndex: number | null = null;

  // times: numbers
  let timeStartIndex: number | null = null;
  let timeEndIndex: number | null = null;
  let durationIndex: number | null = null;
  let timeWarningIndex: number | null = null;
  let timeDangerIndex: number | null = null;

  // options: enum properties
  let endActionIndex: number | null = null;
  let timerTypeIndex: number | null = null;

  //ID
  let entryIdIndex: number | null = null;

  // record of column index and the name of the field
  const customFieldIndexes: Record<number, string> = {};

  excelData.forEach((row, rowIndex) => {
    if (row.length === 0) {
      return;
    }

    // TODO: extract generating handlers from importMap
    const handlers = {
      [importMap.timeStart]: (row: number, col: number) => {
        timeStartIndex = col;
        rundownMetadata['timeStart'] = { row, col };
      },
      [importMap.linkStart]: (row: number, col: number) => {
        linkStartIndex = col;
        rundownMetadata['linkStart'] = { row, col };
      },
      [importMap.timeEnd]: (row: number, col: number) => {
        timeEndIndex = col;
        rundownMetadata['timeEnd'] = { row, col };
      },
      [importMap.duration]: (row: number, col: number) => {
        durationIndex = col;
        rundownMetadata['duration'] = { row, col };
      },

      [importMap.cue]: (row: number, col: number) => {
        cueIndex = col;
        rundownMetadata['cue'] = { row, col };
      },
      [importMap.title]: (row: number, col: number) => {
        titleIndex = col;
        rundownMetadata['title'] = { row, col };
      },
      [importMap.countToEnd]: (row: number, col: number) => {
        countToEndIndex = col;
        rundownMetadata['countToEnd'] = { row, col };
      },
      [importMap.isPublic]: (row: number, col: number) => {
        isPublicIndex = col;
        rundownMetadata['isPublic'] = { row, col };
      },
      [importMap.skip]: (row: number, col: number) => {
        skipIndex = col;
        rundownMetadata['skip'] = { row, col };
      },
      [importMap.note]: (row: number, col: number) => {
        notesIndex = col;
        rundownMetadata['note'] = { row, col };
      },
      [importMap.colour]: (row: number, col: number) => {
        colourIndex = col;
        rundownMetadata['colour'] = { row, col };
      },
      [importMap.endAction]: (row: number, col: number) => {
        endActionIndex = col;
        rundownMetadata['endAction'] = { row, col };
      },
      [importMap.timerType]: (row: number, col: number) => {
        timerTypeIndex = col;
        rundownMetadata['timerType'] = { row, col };
      },
      [importMap.timeWarning]: (row: number, col: number) => {
        timeWarningIndex = col;
        rundownMetadata['timeWarning'] = { row, col };
      },
      [importMap.timeDanger]: (row: number, col: number) => {
        timeDangerIndex = col;
        rundownMetadata['timeDanger'] = { row, col };
      },
      [importMap.entryId]: (row: number, col: number) => {
        entryIdIndex = col;
        rundownMetadata['id'] = { row, col };
      },
      custom: (row: number, col: number, columnText: string) => {
        customFieldIndexes[col] = columnText;
        rundownMetadata[`custom:${columnText}`] = { row, col };
      },
    } as const;

    const entry: Partial<Merge<OntimeEvent, OntimeBlock>> = {};
    const entryCustomFields: EntryCustomFields = {};

    for (let j = 0; j < row.length; j++) {
      const column = row[j];
      // 1. we check if we have set a flag for a known field
      if (j === timerTypeIndex) {
        const maybeTimeType = makeString(column, '');
        if (maybeTimeType === 'block') {
          // we leave this as a clue for the object filtering later on
          entry.type = SupportedEvent.Block;
        } else if (maybeTimeType === '' || isKnownTimerType(maybeTimeType)) {
          // @ts-expect-error -- we leave this as a clue for the object filtering later on
          entry.type = SupportedEvent.Event;
          entry.timerType = validateTimerType(maybeTimeType);
        } else {
          // if it is not a block or a known type, we dont import it
          return;
        }
      } else if (j === titleIndex) {
        entry.title = makeString(column, '');
      } else if (j === timeStartIndex) {
        entry.timeStart = parseExcelDate(column);
      } else if (j === linkStartIndex) {
        entry.linkStart = parseBooleanString(column);
      } else if (j === timeEndIndex) {
        entry.timeEnd = parseExcelDate(column);
      } else if (j === durationIndex) {
        entry.duration = parseExcelDate(column);
      } else if (j === cueIndex) {
        entry.cue = makeString(column, '');
      } else if (j === countToEndIndex) {
        entry.countToEnd = parseBooleanString(column);
      } else if (j === isPublicIndex) {
        entry.isPublic = parseBooleanString(column);
      } else if (j === skipIndex) {
        entry.skip = parseBooleanString(column);
      } else if (j === notesIndex) {
        entry.note = makeString(column, '');
      } else if (j === endActionIndex) {
        entry.endAction = validateEndAction(column);
      } else if (j === timeWarningIndex) {
        entry.timeWarning = parseExcelDate(column);
      } else if (j === timeDangerIndex) {
        entry.timeDanger = parseExcelDate(column);
      } else if (j === colourIndex) {
        entry.colour = makeString(column, '');
      } else if (j === entryIdIndex) {
        entry.id = encodeURIComponent(makeString(column, undefined));
      } else if (j in customFieldIndexes) {
        const importKey = customFieldIndexes[j];
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
            handlers[columnText](rowIndex, j, undefined);
          }

          // check if it is a custom field
          if (columnText in customFieldImportKeys) {
            handlers.custom(rowIndex, j, columnText);
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
    // from excel, we can only get blocks and events
    if (isOntimeBlock(entry)) {
      const block: OntimeBlock = { ...entry, custom: { ...entryCustomFields } };
      rundown.order.push(id);
      rundown.entries[id] = block;
      return;
    }

    const event = {
      ...entry,
      custom: { ...entryCustomFields },
      type: SupportedEvent.Event,
    } as OntimeEvent;

    if (timerTypeIndex === null) {
      event.timerType = TimerType.CountDown;
    }
    rundown.order.push(id);
    rundown.flatOrder.push(id);
    rundown.entries[id] = event;
  });

  return {
    rundown,
    customFields,
    rundownMetadata,
  };
};

type ParsingError = {
  context: string;
  message: string;
};

/**
 * @description handles parsing of ontime project file
 * @param {object} jsonData - project file to be parsed
 * @returns {object} - parsed object
 */
export function parseDatabaseModel(jsonData: Partial<DatabaseModel>): { data: DatabaseModel; errors: ParsingError[] } {
  // we need to parse settings first to make sure the data is ours
  // this may throw
  const settings = parseSettings(jsonData);

  const errors: ParsingError[] = [];
  const makeEmitError = (context: string) => (message: string) => {
    logger.error(LogOrigin.Server, `Error parsing ${context}: ${message}`);
    errors.push({ context, message });
  };

  // we need to parse the custom fields first so they can be used in validating events
  const { rundowns, customFields } = parseRundowns(jsonData, makeEmitError('Rundown'));

  const data: DatabaseModel = {
    rundowns,
    project: parseProject(jsonData, makeEmitError('Project')),
    settings,
    viewSettings: parseViewSettings(jsonData, makeEmitError('View Settings')),
    urlPresets: parseUrlPresets(jsonData, makeEmitError('URL Presets')),
    customFields,
    automation: parseAutomationSettings(jsonData),
  };

  return { data, errors };
}

/**
 * Function infers strategy for a patch with only partial timer data
 * @param end
 * @param duration
 * @param fallback
 * @returns
 */
function inferStrategy(end: unknown, duration: unknown, fallback: TimeStrategy): TimeStrategy {
  if (end && !duration) {
    return TimeStrategy.LockEnd;
  }

  if (!end && duration) {
    return TimeStrategy.LockDuration;
  }
  return fallback;
}

export function createPatch(originalEvent: OntimeEvent, patchEvent: Partial<OntimeEvent>): OntimeEvent {
  if (Object.keys(patchEvent).length === 0) {
    return originalEvent;
  }

  const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(
    patchEvent?.timeStart ?? originalEvent.timeStart,
    patchEvent?.timeEnd ?? originalEvent.timeEnd,
    patchEvent?.duration ?? originalEvent.duration,
    patchEvent?.timeStrategy ?? inferStrategy(patchEvent?.timeEnd, patchEvent?.duration, originalEvent.timeStrategy),
  );

  return {
    id: originalEvent.id,
    type: SupportedEvent.Event,
    title: makeString(patchEvent.title, originalEvent.title),
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart: typeof patchEvent.linkStart === 'boolean' ? patchEvent.linkStart : originalEvent.linkStart,
    endAction: validateEndAction(patchEvent.endAction, originalEvent.endAction),
    timerType: validateTimerType(patchEvent.timerType, originalEvent.timerType),
    countToEnd: typeof patchEvent.countToEnd === 'boolean' ? patchEvent.countToEnd : originalEvent.countToEnd,
    isPublic: typeof patchEvent.isPublic === 'boolean' ? patchEvent.isPublic : originalEvent.isPublic,
    skip: typeof patchEvent.skip === 'boolean' ? patchEvent.skip : originalEvent.skip,
    note: makeString(patchEvent.note, originalEvent.note),
    colour: makeString(patchEvent.colour, originalEvent.colour),
    delay: 0, // is always regenerated by the cache
    dayOffset: 0, // is always regenerated by the cache
    gap: 0, // is always regenerated by the cache
    // short circuit empty string
    cue: makeString(patchEvent.cue ?? null, originalEvent.cue),
    parent: originalEvent.parent,
    revision: originalEvent.revision,
    timeWarning: patchEvent.timeWarning ?? originalEvent.timeWarning,
    timeDanger: patchEvent.timeDanger ?? originalEvent.timeDanger,
    custom: { ...originalEvent.custom, ...patchEvent.custom },
  };
}

/**
 * @description Enforces formatting for events
 * @param {object} eventArgs - attributes of event
 * @param {number} eventIndex - can be a string when we pass the a suggested cue name
 * @returns {object|null} - formatted object or null in case is invalid
 */
export const createEvent = (eventArgs: Partial<OntimeEvent>, eventIndex: number | string): OntimeEvent | null => {
  if (Object.keys(eventArgs).length === 0) {
    return null;
  }

  const cue = typeof eventIndex === 'number' ? String(eventIndex + 1) : eventIndex;

  const baseEvent = {
    id: eventArgs?.id ?? generateId(),
    cue,
    ...eventDef,
  };
  const event = createPatch(baseEvent, eventArgs);
  return event;
};
