// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck -- not ready to fully type

import fs from 'fs';
import xlsx from 'node-xlsx';
import { generateId } from 'ontime-utils';
import { DatabaseModel, EventData, OntimeEvent, OntimeRundown, UserFields } from 'ontime-types';
import { event as eventDef } from '../models/eventsDefinition.js';
import { dbModel } from '../models/dataModel.js';
import { deleteFile, makeString, validateDuration } from './parserUtils.js';
import {
  parseAliases,
  parseEventData,
  parseOsc,
  parseRundown,
  parseSettings,
  parseUserFields,
  parseViewSettings,
} from './parserFunctions.js';
import { parseExcelDate } from './time.js';

export const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const JSON_MIME = 'application/json';

/**
 * @description Excel array parser
 * @param {array} excelData - array with excel sheet
 * @returns {object} - parsed object
 */
export const parseExcel = async (excelData) => {
  const eventData: Partial<EventData> = {
    title: '',
    publicUrl: '',
    backstageUrl: '',
  };
  const customUserFields: Partial<UserFields> = {};
  const rundown: OntimeRundown = [];
  let timeStartIndex: number | null = null;
  let timeEndIndex: number | null = null;
  let titleIndex: number | null = null;
  let presenterIndex: number | null = null;
  let subtitleIndex: number | null = null;
  let isPublicIndex: number | null = null;
  let skipIndex: number | null = null;
  let notesIndex: number | null = null;
  let colourIndex: number | null = null;
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
  let endActionIndex: number | null = null;
  let timerTypeIndex: number | null = null;

  excelData
    .filter((e) => e.length > 0)
    .forEach((row) => {
      let eventTitleNext = false;
      let publicUrlNext = false;
      let publicInfoNext = false;
      let backstageUrlNext = false;
      let backstageInfoNext = false;
      let endMessageNext = false;

      const event: Partial<OntimeEvent> = {};

      row.forEach((column, j) => {
        // check flags
        if (eventTitleNext) {
          eventData.title = column;
          eventTitleNext = false;
        } else if (publicUrlNext) {
          eventData.publicUrl = column;
          publicUrlNext = false;
        } else if (publicInfoNext) {
          eventData.publicInfo = column;
          publicInfoNext = false;
        } else if (backstageUrlNext) {
          eventData.publicUrl = column;
          backstageUrlNext = false;
        } else if (backstageInfoNext) {
          eventData.backstageInfo = column;
          backstageInfoNext = false;
        } else if (endMessageNext) {
          eventData.endMessage = column;
          endMessageNext = false;
        } else if (j === timeStartIndex) {
          event.timeStart = parseExcelDate(column);
        } else if (j === timeEndIndex) {
          event.timeEnd = parseExcelDate(column);
        } else if (j === titleIndex) {
          event.title = column;
        } else if (j === presenterIndex) {
          event.presenter = column;
        } else if (j === subtitleIndex) {
          event.subtitle = column;
        } else if (j === isPublicIndex) {
          event.isPublic = Boolean(column);
        } else if (j === skipIndex) {
          event.skip = Boolean(column);
        } else if (j === notesIndex) {
          event.note = column;
        } else if (j === endActionIndex) {
          event.endAction = column;
        } else if (j === timerTypeIndex) {
          event.timerType = column;
        } else if (j === colourIndex) {
          event.colour = column;
        } else if (j === user0Index) {
          event.user0 = column;
        } else if (j === user1Index) {
          event.user1 = column;
        } else if (j === user2Index) {
          event.user2 = column;
        } else if (j === user3Index) {
          event.user3 = column;
        } else if (j === user4Index) {
          event.user4 = column;
        } else if (j === user5Index) {
          event.user5 = column;
        } else if (j === user6Index) {
          event.user6 = column;
        } else if (j === user7Index) {
          event.user7 = column;
        } else if (j === user8Index) {
          event.user8 = column;
        } else if (j === user9Index) {
          event.user9 = column;
        } else {
          if (typeof column === 'string') {
            const col = column.toLowerCase();
            // look for keywords
            // need to make sure it is a string first
            switch (col) {
              case 'event name':
                eventTitleNext = true;
                break;
              case 'public url':
                publicUrlNext = true;
                break;
              case 'public info':
                publicInfoNext = true;
                break;
              case 'backstage url':
                backstageUrlNext = true;
                break;
              case 'backstage info':
                backstageInfoNext = true;
                break;
              case 'end message':
                endMessageNext = true;
                break;
              case 'time start':
              case 'start':
                timeStartIndex = j;
                break;
              case 'time end':
              case 'end':
              case 'finish':
                timeEndIndex = j;
                break;
              case 'event title':
              case 'title':
                titleIndex = j;
                break;
              case 'presenter name':
              case 'speaker':
              case 'presenter':
                presenterIndex = j;
                break;
              case 'event subtitle':
              case 'subtitle':
                subtitleIndex = j;
                break;
              case 'is public? (x)':
              case 'is public':
              case 'public':
                isPublicIndex = j;
                break;
              case 'skip? (x)':
              case 'skip?':
              case 'skip':
                skipIndex = j;
                break;
              case 'notes':
                notesIndex = j;
                break;
              case 'colour':
              case 'color':
                colourIndex = j;
                break;
              case 'end action':
                endActionIndex = j;
                break;
              case 'timer type':
                timerTypeIndex = j;
                break;
              default:
                // look for user defined
                if (col.startsWith('user')) {
                  const index = column.charAt(4);
                  // name is the bit after the :
                  const [, name] = column.split(':');
                  if (typeof name !== 'undefined') {
                    if (index === '0') {
                      customUserFields.user0 = name;
                      user0Index = j;
                    } else if (index === '1') {
                      customUserFields.user1 = name;
                      user1Index = j;
                    } else if (index === '2') {
                      customUserFields.user2 = name;
                      user2Index = j;
                    } else if (index === '3') {
                      customUserFields.user3 = name;
                      user3Index = j;
                    } else if (index === '4') {
                      customUserFields.user4 = name;
                      user4Index = j;
                    } else if (index === '5') {
                      customUserFields.user5 = name;
                      user5Index = j;
                    } else if (index === '6') {
                      customUserFields.user6 = name;
                      user6Index = j;
                    } else if (index === '7') {
                      customUserFields.user7 = name;
                      user7Index = j;
                    } else if (index === '8') {
                      customUserFields.user8 = name;
                      user8Index = j;
                    } else if (index === '9') {
                      customUserFields.user9 = name;
                      user9Index = j;
                    }
                  }
                }
                break;
            }
          }
        }
      });

      if (Object.keys(event).length > 0) {
        // if any data was found, push to array
        // take care of it in the next step
        rundown.push({ ...event, type: 'event' });
      }
    });
  return {
    rundown,
    eventData: eventData,
    settings: {
      app: 'ontime',
      version: 2,
    },
    userFields: { ...dbModel.userFields, ...customUserFields },
  };
};

/**
 * @description JSON parser function for v1 of data system
 * @param {object} jsonData - json data JSON object to be parsed
 * @param {boolean} [enforce=false] - flag, tells to create an object anyway
 * @returns {object} - parsed object
 */
export const parseJson = async (jsonData, enforce = false): Promise<DatabaseModel | null> => {
  if (!jsonData || typeof jsonData !== 'object') {
    return null;
  }

  // object containing the parsed data
  const returnData: Partial<DatabaseModel> = {};

  // parse Events
  returnData.rundown = parseRundown(jsonData);
  // parse Event
  returnData.eventData = parseEventData(jsonData, enforce);
  // Settings handled partially
  returnData.settings = parseSettings(jsonData, enforce);
  // View settings handled partially
  returnData.viewSettings = parseViewSettings(jsonData, enforce);
  // Import Aliases if any
  returnData.aliases = parseAliases(jsonData);
  // Import user fields if any
  returnData.userFields = parseUserFields(jsonData);
  // Import OSC settings if any
  // @ts-expect-error -- we are unable to type just yet
  returnData.osc = parseOsc(jsonData, enforce);
  // Import HTTP settings if any
  // returnData.http = parseHttp(jsonData, enforce);

  return returnData as DatabaseModel;
};

/**
 * @description Enforces formatting for events
 * @param {object} eventArgs - attributes of event
 * @returns {object|null} - formatted object or null in case is invalid
 */

export const validateEvent = (eventArgs) => {
  // ensure id is defined and unique
  const id = eventArgs.id || generateId();
  let event = null;

  // return if object is empty
  if (Object.keys(eventArgs).length > 0) {
    // make sure all properties exits
    // dont load any extra properties than the ones known

    const e = eventArgs;
    const d = eventDef;
    const start = e.timeStart != null && typeof e.timeStart === 'number' ? e.timeStart : d.timeStart;
    const end = e.timeEnd != null && typeof e.timeEnd === 'number' ? e.timeEnd : d.timeEnd;

    event = {
      ...d,
      title: makeString(e.title, d.title),
      subtitle: makeString(e.subtitle, d.subtitle),
      presenter: makeString(e.presenter, d.presenter),
      timeStart: start,
      timeEnd: end,
      endAction: makeString(e.endAction, d.endAction),
      timerType: makeString(e.timerType, d.timerType),
      duration: validateDuration(start, end),
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
      // deciding not to validate colour
      // this adds flexibility to the user to write hex codes, rgb,
      // but also colour names like blue and red
      // CSS.supports is only available in frontend
      colour: makeString(e.colour, d.colour),
      id,
      type: 'event',
    };
  }

  return event;
};

type ResponseOK = { data: Partial<DatabaseModel>; message: 'success' };
type ResponseError = { error: true; message: string };

/**
 * @description Middleware function that checks file type and calls relevant parser
 * @param {string} file - reference to file
 * @return {object} - parse result message
 */
export const fileHandler = async (file): ResponseOK | ResponseError => {
  let res: Partial<ResponseOK | ResponseError> = {};

  // check which file type are we dealing with
  if (file.endsWith('.xlsx')) {
    try {
      const excelData = xlsx
        .parse(file, { cellDates: true })
        .find(({ name }) => name.toLowerCase() === 'ontime' || name.toLowerCase() === 'event schedule');

      // we only look at worksheets called ontime or event schedule
      if (excelData?.data) {
        const dataFromExcel = await parseExcel(excelData.data);
        res.data = {};
        res.data.rundown = parseRundown(dataFromExcel);
        res.data.eventData = parseEventData(dataFromExcel, true);
        res.data.userFields = parseUserFields(dataFromExcel);
        res.message = 'success';
      } else {
        const errorMessage = 'No sheet found named ontime or event schedule';
        console.log(errorMessage);
        res = {
          error: true,
          message: errorMessage,
        };
      }
    } catch (error) {
      res = { error: true, message: `Error parsing file: ${error}` };
    }
  }

  if (file.endsWith('.json')) {
    // if json check version
    const rawdata = fs.readFileSync(file);
    let uploadedJson = null;

    try {
      uploadedJson = JSON.parse(rawdata);
    } catch (error) {
      return { error: true, message: 'Error parsing JSON file' };
    }

    if (uploadedJson.settings.version === 2) {
      try {
        res.data = await parseJson(uploadedJson);
        res.message = 'success';
      } catch (error) {
        res = { error: true, message: `Error parsing file: ${error}` };
      }
    } else {
      res = { error: true, message: 'Error parsing file, version unknown' };
    }
  }

  // delete file
  await deleteFile(file);
  return res;
};
