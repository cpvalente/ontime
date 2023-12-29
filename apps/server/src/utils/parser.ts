import {
  generateId,
  isExcelImportMap,
  type ExcelImportMap,
  defaultExcelImportMap,
  validateEndAction,
  validateTimerType,
  type ExcelImportOptions,
  validateTimes,
} from 'ontime-utils';
import {
  DatabaseModel,
  OntimeEvent,
  OntimeRundown,
  SupportedEvent,
  ProjectData,
  UserFields,
  EndAction,
  TimerType,
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
} from './parserFunctions.js';
import { parseExcelDate } from './time.js';
import { configService } from '../services/ConfigService.js';

export const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const JSON_MIME = 'application/json';

/**
 * @description Excel array parser
 * @param {array} excelData - array with excel sheet
 * @param {ExcelImportOptions} options - an object that contains the import map
 * @returns {object} - parsed object
 */
export const parseExcel = (excelData: unknown[][], options?: Partial<ExcelImportMap>) => {
  const importMap: ExcelImportMap = { ...defaultExcelImportMap, ...options };
  const projectData: Partial<ProjectData> = {
    title: '',
    description: '',
    publicUrl: '',
    publicInfo: '',
    backstageUrl: '',
    backstageInfo: '',
  };
  const customUserFields: Partial<UserFields> = {
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

  excelData
    .filter((e) => e.length > 0)
    .forEach((row) => {
      // these fields contain the data to its right
      let projectTitleNext = false;
      let projectDescriptionNext = false;
      let publicUrlNext = false;
      let publicInfoNext = false;
      let backstageUrlNext = false;
      let backstageInfoNext = false;

      const event: Partial<OntimeEvent> = {};
      const handlers = {
        [importMap.projectName]: () => (projectTitleNext = true),
        [importMap.projectDescription]: () => (projectDescriptionNext = true),
        [importMap.publicUrl]: () => (publicUrlNext = true),
        [importMap.publicInfo]: () => (publicInfoNext = true),
        [importMap.backstageUrl]: () => (backstageUrlNext = true),
        [importMap.backstageInfo]: () => (backstageInfoNext = true),

        [importMap.timeStart]: (index: number) => (timeStartIndex = index),
        [importMap.timeEnd]: (index: number) => (timeEndIndex = index),
        [importMap.duration]: (index: number) => (durationIndex = index),

        [importMap.cue]: (index: number) => (cueIndex = index),
        [importMap.title]: (index: number) => (titleIndex = index),
        [importMap.presenter]: (index: number) => (presenterIndex = index),
        [importMap.subtitle]: (index: number) => (subtitleIndex = index),
        [importMap.isPublic]: (index: number) => (isPublicIndex = index),
        [importMap.skip]: (index: number) => (skipIndex = index),
        [importMap.note]: (index: number) => (notesIndex = index),
        [importMap.colour]: (index: number) => (colourIndex = index),

        [importMap.endAction]: (index: number) => (endActionIndex = index),
        [importMap.timerType]: (index: number) => (timerTypeIndex = index),

        [importMap.user0]: (index: number) => (user0Index = index),
        [importMap.user1]: (index: number) => (user1Index = index),
        [importMap.user2]: (index: number) => (user2Index = index),
        [importMap.user3]: (index: number) => (user3Index = index),
        [importMap.user4]: (index: number) => (user4Index = index),
        [importMap.user5]: (index: number) => (user5Index = index),
        [importMap.user6]: (index: number) => (user6Index = index),
        [importMap.user7]: (index: number) => (user7Index = index),
        [importMap.user8]: (index: number) => (user8Index = index),
        [importMap.user9]: (index: number) => (user9Index = index),
      } as const;

      row.forEach((column, j) => {
        // 1. we check if we have set a flag for a known field
        if (projectTitleNext) {
          projectData.title = makeString(column, '');
          projectTitleNext = false;
        } else if (projectDescriptionNext) {
          projectData.description = makeString(column, '');
          projectDescriptionNext = false;
        } else if (publicUrlNext) {
          projectData.publicUrl = makeString(column, '');
          publicUrlNext = false;
        } else if (publicInfoNext) {
          projectData.publicInfo = makeString(column, '');
          publicInfoNext = false;
        } else if (backstageUrlNext) {
          projectData.backstageUrl = makeString(column, '');
          backstageUrlNext = false;
        } else if (backstageInfoNext) {
          projectData.backstageInfo = makeString(column, '');
          backstageInfoNext = false;
        } else if (j === timeStartIndex) {
          event.timeStart = parseExcelDate(column);
        } else if (j === timeEndIndex) {
          event.timeEnd = parseExcelDate(column);
        } else if (j === durationIndex) {
          event.duration = parseExcelDate(column);
        } else if (j === titleIndex) {
          event.title = makeString(column, '');
        } else if (j === cueIndex) {
          event.cue = makeString(column, '');
        } else if (j === presenterIndex) {
          event.presenter = makeString(column, '');
        } else if (j === subtitleIndex) {
          event.subtitle = makeString(column, '');
        } else if (j === isPublicIndex) {
          event.isPublic = Boolean(column);
        } else if (j === skipIndex) {
          event.skip = Boolean(column);
        } else if (j === notesIndex) {
          event.note = makeString(column, '');
        } else if (j === endActionIndex) {
          event.endAction = validateEndAction(column);
        } else if (j === timerTypeIndex) {
          event.timerType = validateTimerType(column);
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
              handlers[col](j);
            }
            // else. we don't know how to handle this column
            // just ignore it
          }
        }
      });

      if (Object.keys(event).length > 0) {
        // if any data was found, push to array
        rundown.push({ ...event, type: SupportedEvent.Event } as OntimeEvent);
      }
    });

  return {
    rundown,
    project: projectData,
    settings: {
      app: 'ontime',
      version: '2.0.0',
    },
    userFields: customUserFields,
  };
};

/**
 * @description JSON parser function for ontime project file
 * @param {object} jsonData - project file to be parsed
 * @returns {object} - parsed object
 */
export const parseJson = async (jsonData): Promise<DatabaseModel | null> => {
  if (!jsonData || typeof jsonData !== 'object') {
    return null;
  }

  // object containing the parsed data
  const returnData: Partial<DatabaseModel> = {};

  // parse Events
  returnData.rundown = parseRundown(jsonData);
  // parse Event
  returnData.project = parseProject(jsonData) ?? dbModel.project;
  // Settings handled partially
  returnData.settings = parseSettings(jsonData) ?? dbModel.settings;
  // View settings handled partially
  returnData.viewSettings = parseViewSettings(jsonData) ?? dbModel.viewSettings;
  // Import Aliases if any
  returnData.aliases = parseAliases(jsonData);
  // Import user fields if any
  returnData.userFields = parseUserFields(jsonData);
  // Import OSC settings if any
  returnData.osc = parseOsc(jsonData) ?? dbModel.osc;
  // Import HTTP settings if any
  returnData.http = parseHttp(jsonData) ?? dbModel.http;

  return returnData as DatabaseModel;
};

/**
 * @description Enforces formatting for events
 * @param {object} eventArgs - attributes of event
 * @param cueFallback
 * @returns {object|null} - formatted object or null in case is invalid
 */

export const validateEvent = (eventArgs: Partial<OntimeEvent>, cueFallback: string) => {
  // ensure id is defined and unique
  const id = eventArgs.id || generateId();

  let event = null;

  // return if object is empty
  if (Object.keys(eventArgs).length > 0) {
    // make sure all properties exits
    // dont load any extra properties than the ones known

    const e = eventArgs;
    const d = eventDef;

    const { timeStart, timeEnd, duration } = validateTimes(e.timeStart, e.timeEnd, e.duration);

    event = {
      ...d,
      title: makeString(e.title, d.title),
      subtitle: makeString(e.subtitle, d.subtitle),
      presenter: makeString(e.presenter, d.presenter),
      timeStart,
      timeEnd,
      duration,
      endAction: validateEndAction(e.endAction, EndAction.None),
      timerType: validateTimerType(e.timerType, TimerType.CountDown),
      isPublic: typeof e.isPublic === 'boolean' ? e.isPublic : d.isPublic,
      skip: typeof e.skip === 'boolean' ? e.skip : d.skip,
      note: makeString(e.note, d.note),
      user0: makeString(e.user0, d.user0),
      user1: makeString(e.user1, d.user1),
      user2: makeString(e.user2, d.user2),
      user3: makeString(e.user3, d.user3),
      user4: makeString(e.user4, d.user4),
      user5: makeString(e.user5, d.user5),
      user6: makeString(e.user6, d.user6),
      user7: makeString(e.user7, d.user7),
      user8: makeString(e.user8, d.user8),
      user9: makeString(e.user9, d.user9),
      colour: makeString(e.colour, d.colour),
      cue: makeString(e.cue, cueFallback),
      id,
      type: 'event',
    };
  }

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
      throw new Error('Got incorrect options to excel import', JSON.parse(options));
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
    res.data.project = parseProject(dataFromExcel);
    res.data.userFields = parseUserFields(dataFromExcel);

    await configService.updateDatabaseConfig(fileName);

    await deleteFile(file);

    return res;
  }

  if (file.endsWith('.json')) {
    // if json check version
    const rawdata = fs.readFileSync(file).toString();
    let uploadedJson = null;

    uploadedJson = JSON.parse(rawdata);
    res.data = await parseJson(uploadedJson);

    await configService.updateDatabaseConfig(fileName);

    return res;
  }
};
