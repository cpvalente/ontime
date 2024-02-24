import {
  generateId,
  isExcelImportMap,
  type ExcelImportMap,
  defaultExcelImportMap,
  validateEndAction,
  validateTimerType,
  type ExcelImportOptions,
  validateTimes,
  isKnownTimerType,
  validateLinkStart,
} from 'ontime-utils';
import {
  DatabaseModel,
  OntimeEvent,
  OntimeRundown,
  SupportedEvent,
  UserFields,
  EndAction,
  TimerType,
  TimeStrategy,
} from 'ontime-types';

import fs from 'fs';
import xlsx from 'node-xlsx';
import path from 'path';

import { event as eventDef } from '../models/eventsDefinition.js';
import { dbModel } from '../models/dataModel.js';
import { deleteFile, makeString } from './parserUtils.js';
import {
  parseAliases,
  parseProject,
  parseOsc,
  parseHttp,
  parseRundown,
  parseSettings,
  parseUserFields,
  parseViewSettings,
  parseCustomFields,
} from './parserFunctions.js';
import { parseExcelDate } from './time.js';
import { configService } from '../services/ConfigService.js';
import { coerceBoolean } from './coerceType.js';

export const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const JSON_MIME = 'application/json';

type ExcelData = Pick<DatabaseModel, 'rundown' | 'userFields'> & {
  rundownMetadata: Record<string, { row: number; col: number }>;
};

/**
 * @description Excel array parser
 * @param {array} excelData - array with excel sheet
 * @param {ExcelImportOptions} options - an object that contains the import map
 * @returns {object} - parsed object
 */
export const parseExcel = (excelData: unknown[][], options?: Partial<ExcelImportMap>): ExcelData => {
  const rundownMetadata = {};
  const importMap: ExcelImportMap = { ...defaultExcelImportMap, ...options };
  for (const [key, value] of Object.entries(importMap)) {
    importMap[key] = value.toLocaleLowerCase();
  }
  const customUserFields: UserFields = {
    user0: importMap.user0,
    user1: importMap.user1,
    user2: importMap.user2,
    user3: importMap.user3,
    user4: importMap.user4,
    user5: importMap.user5,
    user6: importMap.user6,
    user7: importMap.user7,
    user8: importMap.user8,
    user9: importMap.user9,
  };
  const rundown: OntimeRundown = [];

  // title stuff: strings
  let titleIndex: number | null = null;
  let cueIndex: number | null = null;
  let presenterIndex: number | null = null;
  let subtitleIndex: number | null = null;
  let notesIndex: number | null = null;
  let colourIndex: number | null = null;

  // options: booleans
  let isPublicIndex: number | null = null;
  let skipIndex: number | null = null;

  // times: numbers
  let timeStartIndex: number | null = null;
  let timeEndIndex: number | null = null;
  let durationIndex: number | null = null;
  let timeWarningIndex: number | null = null;
  let timeDangerIndex: number | null = null;

  // options: enum properties
  let endActionIndex: number | null = null;
  let timerTypeIndex: number | null = null;

  // user fields: strings
  let user0Index: number | null = null;
  let user1Index: number | null = null;
  let user2Index: number | null = null;
  let user3Index: number | null = null;
  let user4Index: number | null = null;
  let user5Index: number | null = null;
  let user6Index: number | null = null;
  let user7Index: number | null = null;
  let user8Index: number | null = null;
  let user9Index: number | null = null;

  excelData.forEach((row, rowIndex) => {
    if (row.length === 0) {
      return;
    }

    const handlers = {
      [importMap.timeStart]: (row: number, col: number) => {
        timeStartIndex = col;
        rundownMetadata['timeStart'] = { row, col };
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
      [importMap.presenter]: (row: number, col: number) => {
        presenterIndex = col;
        rundownMetadata['presenter'] = { row, col };
      },
      [importMap.subtitle]: (row: number, col: number) => {
        subtitleIndex = col;
        rundownMetadata['subtitle'] = { row, col };
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

      [importMap.user0]: (row: number, col: number) => {
        user0Index = col;
        rundownMetadata['user0'] = { row, col };
      },
      [importMap.user1]: (row: number, col: number) => {
        user1Index = col;
        rundownMetadata['user1'] = { row, col };
      },
      [importMap.user2]: (row: number, col: number) => {
        user2Index = col;
        rundownMetadata['user2'] = { row, col };
      },
      [importMap.user3]: (row: number, col: number) => {
        user3Index = col;
        rundownMetadata['user3'] = { row, col };
      },
      [importMap.user4]: (row: number, col: number) => {
        user4Index = col;
        rundownMetadata['user4'] = { row, col };
      },
      [importMap.user5]: (row: number, col: number) => {
        user5Index = col;
        rundownMetadata['user5'] = { row, col };
      },
      [importMap.user6]: (row: number, col: number) => {
        user6Index = col;
        rundownMetadata['user6'] = { row, col };
      },
      [importMap.user7]: (row: number, col: number) => {
        user7Index = col;
        rundownMetadata['user7'] = { row, col };
      },
      [importMap.user8]: (row: number, col: number) => {
        user8Index = col;
        rundownMetadata['user8'] = { row, col };
      },
      [importMap.user9]: (row: number, col: number) => {
        user9Index = col;
        rundownMetadata['user9'] = { row, col };
      },
    } as const;

    const event: any = {};
    row.forEach((column, j) => {
      // 1. we check if we have set a flag for a known field
      if (j === timerTypeIndex) {
        if (column === 'block') {
          event.type = SupportedEvent.Block;
        }
        if (column === '' || isKnownTimerType(column)) {
          event.type = SupportedEvent.Event;
          event.timerType = validateTimerType(column);
        }
        // if it is not a block or a known type, we dont import it
        return;
      } else if (j === titleIndex) {
        event.title = makeString(column, '');
        // if this is a block, we have nothing else to import
        if (event.type === SupportedEvent.Block) {
          return;
        }
      } else if (j === timeStartIndex) {
        event.timeStart = parseExcelDate(column);
      } else if (j === timeEndIndex) {
        event.timeEnd = parseExcelDate(column);
      } else if (j === durationIndex) {
        event.duration = parseExcelDate(column);
      } else if (j === cueIndex) {
        event.cue = makeString(column, '');
      } else if (j === presenterIndex) {
        event.presenter = makeString(column, '');
      } else if (j === subtitleIndex) {
        event.subtitle = makeString(column, '');
      } else if (j === isPublicIndex) {
        event.isPublic = column == 'x' ? true : coerceBoolean(column);
      } else if (j === skipIndex) {
        event.skip = column == 'x' ? true : coerceBoolean(column);
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
      } else if (j === user0Index) {
        event.user0 = makeString(column, '');
      } else if (j === user1Index) {
        event.user1 = makeString(column, '');
      } else if (j === user2Index) {
        event.user2 = makeString(column, '');
      } else if (j === user3Index) {
        event.user3 = makeString(column, '');
      } else if (j === user4Index) {
        event.user4 = makeString(column, '');
      } else if (j === user5Index) {
        event.user5 = makeString(column, '');
      } else if (j === user6Index) {
        event.user6 = makeString(column, '');
      } else if (j === user7Index) {
        event.user7 = makeString(column, '');
      } else if (j === user8Index) {
        event.user8 = makeString(column, '');
      } else if (j === user9Index) {
        event.user9 = makeString(column, '');
      } else {
        // 2. if there is no flag, lets see if we know the field type
        if (typeof column === 'string') {
          const col = column.toLowerCase();

          if (handlers[col]) {
            handlers[col](rowIndex, j);
          }
          // else. we don't know how to handle this column
          // just ignore it
        }
      }
    });

    if (Object.keys(event).length > 0) {
      // if any data was found, push to array
      rundown.push({ ...event });
    }
  });

  return {
    rundown,
    userFields: customUserFields,
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

  const returnData: DatabaseModel = {
    rundown: parseRundown(jsonData),
    project: parseProject(jsonData) ?? dbModel.project,
    settings: parseSettings(jsonData) ?? dbModel.settings,
    viewSettings: parseViewSettings(jsonData) ?? dbModel.viewSettings,
    aliases: parseAliases(jsonData),
    userFields: parseUserFields(jsonData),
    customFields: parseCustomFields(jsonData),
    osc: parseOsc(jsonData) ?? dbModel.osc,
    http: parseHttp(jsonData) ?? dbModel.http,
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
    subtitle: makeString(patchEvent.subtitle, originalEvent.subtitle),
    presenter: makeString(patchEvent.presenter, originalEvent.presenter),
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart: validateLinkStart(maybeLinkStart),
    endAction: validateEndAction(patchEvent.endAction, EndAction.None),
    timerType: validateTimerType(patchEvent.timerType, TimerType.CountDown),
    isPublic: typeof patchEvent.isPublic === 'boolean' ? patchEvent.isPublic : originalEvent.isPublic,
    skip: typeof patchEvent.skip === 'boolean' ? patchEvent.skip : originalEvent.skip,
    note: makeString(patchEvent.note, originalEvent.note),
    user0: makeString(patchEvent.user0, originalEvent.user0),
    user1: makeString(patchEvent.user1, originalEvent.user1),
    user2: makeString(patchEvent.user2, originalEvent.user2),
    user3: makeString(patchEvent.user3, originalEvent.user3),
    user4: makeString(patchEvent.user4, originalEvent.user4),
    user5: makeString(patchEvent.user5, originalEvent.user5),
    user6: makeString(patchEvent.user6, originalEvent.user6),
    user7: makeString(patchEvent.user7, originalEvent.user7),
    user8: makeString(patchEvent.user8, originalEvent.user8),
    user9: makeString(patchEvent.user9, originalEvent.user9),
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

type ResponseOK = {
  data: Partial<DatabaseModel>;
};

/**
 * @description Middleware function that checks file type and calls relevant parser
 * @param {string} file - reference to file
 * @param options - import options
 * @return {object} - parse result message
 */
export const fileHandler = async (file: string, options: ExcelImportOptions): Promise<Partial<ResponseOK>> => {
  const res: Partial<ResponseOK> = {};

  const fileName = path.basename(file);

  // check which file type are we dealing with
  if (file.endsWith('.xlsx')) {
    // we need to check that the options are applicable
    if (!isExcelImportMap(options)) {
      throw new Error('Got incorrect options to excel import');
    }

    const excelData = xlsx
      .parse(file, { cellDates: true })
      .find(({ name }) => name.toLowerCase() === options.worksheet.toLowerCase());

    if (!excelData?.data) {
      throw new Error(`Could not find data to import, maybe the worksheet name is incorrect: ${options.worksheet}`);
    }

    const dataFromExcel = parseExcel(excelData.data, options);
    // we run the parsed data through an extra step to ensure the objects shape
    res.data = {};
    res.data.rundown = parseRundown(dataFromExcel);
    if (res.data.rundown.length < 1) {
      throw new Error(`Could not find data to import in the worksheet ${options.worksheet}`);
    }
    res.data.userFields = parseUserFields(dataFromExcel);

    deleteFile(file);

    return res;
  }

  if (file.endsWith('.json')) {
    const rawdata = fs.readFileSync(file).toString();
    let uploadedJson = null;

    uploadedJson = JSON.parse(rawdata);
    res.data = await parseJson(uploadedJson);

    await configService.updateDatabaseConfig(fileName);
    return res;
  }
};
