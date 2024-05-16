import {
  defaultImportMap,
  generateId,
  type ImportMap,
  isKnownTimerType,
  validateEndAction,
  validateLinkStart,
  validateTimerType,
  validateTimes,
} from 'ontime-utils';
import {
  CustomFields,
  DatabaseModel,
  EventCustomFields,
  OntimeBlock,
  OntimeEvent,
  OntimeRundown,
  SupportedEvent,
  TimerType,
  TimeStrategy,
} from 'ontime-types';

import { event as eventDef } from '../models/eventsDefinition.js';
import { dbModel } from '../models/dataModel.js';
import { makeString } from './parserUtils.js';
import {
  parseCustomFields,
  parseHttp,
  parseOsc,
  parseProject,
  parseRundown,
  parseSettings,
  parseUrlPresets,
  parseViewSettings,
} from './parserFunctions.js';
import { parseExcelDate } from './time.js';

export const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const JSON_MIME = 'application/json';

type ExcelData = Pick<DatabaseModel, 'rundown' | 'customFields'> & {
  rundownMetadata: Record<string, { row: number; col: number }>;
};

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

export function getCustomFieldData(importMap: ImportMap): {
  customFields: CustomFields;
  customFieldImportKeys: Record<keyof CustomFields, string>;
} {
  const customFields = {};
  const customFieldImportKeys = {};
  for (const ontimeLabel in importMap.custom) {
    const ontimeKey = ontimeLabel.toLowerCase();
    const importLabel = importMap.custom[ontimeLabel].toLowerCase();
    customFields[ontimeKey] = {
      type: 'string',
      colour: '',
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
export const parseExcel = (excelData: unknown[][], options?: Partial<ImportMap>): ExcelData => {
  const rundownMetadata = {};
  const importMap: ImportMap = { ...defaultImportMap, ...options };

  for (const [key, value] of Object.entries(importMap)) {
    if (typeof value === 'string') {
      importMap[key] = value.toLocaleLowerCase().trim();
    }
  }

  const { customFields, customFieldImportKeys } = getCustomFieldData(importMap);
  const rundown: OntimeRundown = [];

  // title stuff: strings
  let titleIndex: number | null = null;
  let cueIndex: number | null = null;
  let notesIndex: number | null = null;
  let colourIndex: number | null = null;

  // options: booleans
  let isPublicIndex: number | null = null;
  let skipIndex: number | null = null;

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
        rundownMetadata['timeWarningIndex'] = { row, col };
      },
      [importMap.timeDanger]: (row: number, col: number) => {
        timeDangerIndex = col;
        rundownMetadata['timeDangerIndex'] = { row, col };
      },
      custom: (row: number, col: number, columnText: string) => {
        customFieldIndexes[col] = columnText;
        rundownMetadata[`custom:${columnText}`] = { row, col };
      },
    } as const;

    const event: any = {};
    const eventCustomFields: EventCustomFields = {};

    for (let j = 0; j < row.length; j++) {
      const column = row[j];
      // 1. we check if we have set a flag for a known field
      if (j === timerTypeIndex) {
        if (column === 'block') {
          event.type = SupportedEvent.Block;
        } else if (column === '' || isKnownTimerType(column)) {
          event.type = SupportedEvent.Event;
          event.timerType = validateTimerType(column);
        } else {
          // if it is not a block or a known type, we dont import it
          return;
        }
      } else if (j === titleIndex) {
        event.title = makeString(column, '');
      } else if (j === timeStartIndex) {
        event.timeStart = parseExcelDate(column);
      } else if (j === linkStartIndex) {
        event.linkStart = parseBooleanString(column);
      } else if (j === timeEndIndex) {
        event.timeEnd = parseExcelDate(column);
      } else if (j === durationIndex) {
        event.duration = parseExcelDate(column);
      } else if (j === cueIndex) {
        event.cue = makeString(column, '');
      } else if (j === isPublicIndex) {
        event.isPublic = parseBooleanString(column);
      } else if (j === skipIndex) {
        event.skip = parseBooleanString(column);
      } else if (j === notesIndex) {
        event.note = makeString(column, '');
      } else if (j === endActionIndex) {
        event.endAction = validateEndAction(column);
      } else if (j === timeWarningIndex) {
        event.timeWarning = parseExcelDate(column);
      } else if (j === timeDangerIndex) {
        event.timeDanger = parseExcelDate(column);
      } else if (j === colourIndex) {
        event.colour = makeString(column, '');
      } else if (j in customFieldIndexes) {
        const importKey = customFieldIndexes[j];
        const ontimeKey = customFieldImportKeys[importKey];
        eventCustomFields[ontimeKey] = makeString(column, '');
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

    // if any data was found in row, push to array
    const keysFound = Object.keys(event).length + Object.keys(eventCustomFields).length;
    if (keysFound > 0) {
      // if it is a Block type drop all other filed
      if (event.type === SupportedEvent.Block) {
        rundown.push({ type: event.type, id: event.id, title: event.title } as OntimeBlock);
      } else {
        if (timerTypeIndex === null) {
          event.timerType = TimerType.CountDown;
          event.type = SupportedEvent.Event;
        }
        rundown.push({ ...event, custom: { ...eventCustomFields } });
      }
    }
  });

  return {
    rundown,
    customFields,
    rundownMetadata,
  };
};

/**
 * @description JSON parser function for ontime project file
 * @param {object} jsonData - project file to be parsed
 * @returns {object} - parsed object
 */
export const parseJson = async (jsonData: Partial<DatabaseModel>): Promise<DatabaseModel | null> => {
  if (!jsonData || typeof jsonData !== 'object') {
    return null;
  }

  let settings;

  // check settings first to make sure we can parse it
  try {
    settings = parseSettings(jsonData);
  } catch (error) {
    // if we cant parse, return an empty project
    console.log('ERROR: unable to parse settings, missing app or version');
    return dbModel;
  }

  const returnData: DatabaseModel = {
    rundown: parseRundown(jsonData),
    project: parseProject(jsonData),
    settings,
    viewSettings: parseViewSettings(jsonData),
    urlPresets: parseUrlPresets(jsonData),
    customFields: parseCustomFields(jsonData),
    osc: parseOsc(jsonData),
    http: parseHttp(jsonData),
  };

  return returnData;
};

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
  const maybeLinkStart = patchEvent.linkStart !== undefined ? patchEvent.linkStart : originalEvent.linkStart;

  return {
    id: originalEvent.id,
    type: SupportedEvent.Event,
    title: makeString(patchEvent.title, originalEvent.title),
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart: validateLinkStart(maybeLinkStart),
    endAction: validateEndAction(patchEvent.endAction, originalEvent.endAction),
    timerType: validateTimerType(patchEvent.timerType, originalEvent.timerType),
    isPublic: typeof patchEvent.isPublic === 'boolean' ? patchEvent.isPublic : originalEvent.isPublic,
    skip: typeof patchEvent.skip === 'boolean' ? patchEvent.skip : originalEvent.skip,
    note: makeString(patchEvent.note, originalEvent.note),
    colour: makeString(patchEvent.colour, originalEvent.colour),
    // short circuit empty string
    cue: makeString(patchEvent.cue ?? null, originalEvent.cue),
    revision: originalEvent.revision,
    timeWarning: patchEvent.timeWarning ?? originalEvent.timeWarning,
    timeDanger: patchEvent.timeDanger ?? originalEvent.timeDanger,
    custom: { ...originalEvent.custom, ...patchEvent.custom },
  };
}

/**
 * @description Enforces formatting for events
 * @param {object} eventArgs - attributes of event
 * @param cueFallback
 * @returns {object|null} - formatted object or null in case is invalid
 */
export const createEvent = (eventArgs: Partial<OntimeEvent>, cueFallback: string): OntimeEvent | null => {
  if (Object.keys(eventArgs).length === 0) {
    return null;
  }

  const baseEvent = {
    id: eventArgs?.id ?? generateId(),
    cue: cueFallback,
    ...eventDef,
  };
  const event = createPatch(baseEvent, eventArgs);
  return event;
};
