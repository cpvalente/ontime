import fs from 'fs';
import xlsx from 'node-xlsx';
import { event as eventDef } from '../models/eventsDefinition.js';
import { dbModelv1 } from '../models/dataModel.js';
import { deleteFile, makeString, validateDuration } from './parserUtils.js';
import {
  parseAliases_v1,
  parseEvent_v1,
  parseEvents_v1,
  parseHttp_v1,
  parseOsc_v1,
  parseSettings_v1,
  parseUserFields_v1,
} from './parserUtils_v1.js';
import { excelDateStringToMillis } from './time.js';
import { generateId } from './generate_id.js';

export const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const JSON_MIME = 'application/json';

/**
 * @description Whether a string is considered empty
 * @param value
 * @return {boolean}
 */
export const isStringEmpty = (value) => {
  let v = value;
  if (typeof value === 'string') {
    v = value.replace(/\s+/g, '');
  }
  return v === '' || !v;
};

/**
 * @description Excel array parser
 * @param {array} excelData - array with excel sheet
 * @returns {object} - parsed object
 */
export const parseExcel_v1 = async (excelData) => {
  const eventData = {
    title: '',
    url: '',
  };
  const customUserFields = {};
  const events = [];
  let timeStartIndex = null;
  let timeEndIndex = null;
  let titleIndex = null;
  let presenterIndex = null;
  let subtitleIndex = null;
  let isPublicIndex = null;
  let skipIndex = null;
  let notesIndex = null;
  let colourIndex = null;
  let user0Index = null;
  let user1Index = null;
  let user2Index = null;
  let user3Index = null;
  let user4Index = null;
  let user5Index = null;
  let user6Index = null;
  let user7Index = null;
  let user8Index = null;
  let user9Index = null;

  excelData
    .filter((e) => e.length > 0)
    .forEach((row) => {
      let eventTitleNext = false;
      let eventUrlNext = false;
      const event = {};

      row.forEach((column, j) => {
        // check flags
        if (eventTitleNext) {
          eventData.title = column;
          eventTitleNext = false;
        } else if (eventUrlNext) {
          eventData.url = column;
          eventUrlNext = false;
        } else if (j === timeStartIndex) {
          event.timeStart = excelDateStringToMillis(column);
        } else if (j === timeEndIndex) {
          event.timeEnd = excelDateStringToMillis(column);
        } else if (j === titleIndex) {
          event.title = column;
        } else if (j === presenterIndex) {
          event.presenter = column;
        } else if (j === subtitleIndex) {
          event.subtitle = column;
        } else if (j === isPublicIndex) {
          event.isPublic = isStringEmpty(column);
        } else if (j === skipIndex) {
          event.skip = isStringEmpty(column);
        } else if (j === notesIndex) {
          event.note = column;
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
              case 'event url':
                eventUrlNext = true;
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
        events.push({ ...event, type: 'event' });
      }
    });
  return {
    events,
    event: eventData,
    settings: {
      app: 'ontime',
      version: 1,
    },
    userFields: { ...dbModelv1.userFields, ...customUserFields },
  };
};

/**
 * @description JSON parser function for v1 of data system
 * @param {object} jsonData - json data JSON object to be parsed
 * @param {boolean} [enforce=false] - flag, tells to create an object anyway
 * @returns {object} - parsed object
 */
export const parseJson_v1 = async (jsonData, enforce = false) => {
  if (!jsonData || typeof jsonData !== 'object') {
    console.log('ERROR: Invalid JSON format');
    return -1;
  }

  // object containing the parsed data
  const returnData = {};

  // parse Events
  returnData.events = parseEvents_v1(jsonData);
  // parse Event
  returnData.event = parseEvent_v1(jsonData, enforce);
  // Settings handled partially
  returnData.settings = parseSettings_v1(jsonData, enforce);
  // Import OSC settings if any
  returnData.osc = parseOsc_v1(jsonData, enforce);
  // Import HTTP settings if any
  returnData.http = parseHttp_v1(jsonData, enforce);
  // Import Aliases if any
  returnData.aliases = parseAliases_v1(jsonData);
  // Import user fields if any
  returnData.userFields = parseUserFields_v1(jsonData);

  return returnData;
};

/**
 * @description Enforces formatting for events
 * @param {object} eventArgs - attributes of event
 * @returns {object|null} - formatted object or null in case is invalid
 */

export const validateEvent_v1 = (eventArgs) => {
  // ensure id is defined and unique
  const id = eventArgs.id || generateId();
  let event = null;

  // return if object is empty
  if (Object.keys(eventArgs).length > 0) {
    // make sure all properties exits
    // dont load any extra properties than the ones known

    const e = eventArgs;
    const d = eventDef;
    const start =
      e.timeStart != null && typeof e.timeStart === 'number' ? e.timeStart : d.timeStart;
    const end = e.timeEnd != null && typeof e.timeEnd === 'number' ? e.timeEnd : d.timeEnd;

    event = {
      ...d,
      title: makeString(e.title, d.title),
      subtitle: makeString(e.subtitle, d.subtitle),
      presenter: makeString(e.presenter, d.presenter),
      timeStart: start,
      timeEnd: end,
      timeType: 'start-end',
      duration: validateDuration(start, end),
      isPublic: e.isPublic != null && typeof e.isPublic === 'boolean' ? e.isPublic : d.isPublic,
      skip: e.skip != null && typeof e.skip === 'boolean' ? e.skip : d.skip,
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

/**
 * @description Middleware function that checks file type and calls relevant parser
 * @param {string} file - reference to file
 * @return {object} - parse result message
 */
export const fileHandler = async (file) => {
  let res = {};

  // check which file type are we dealing with

  if (file.endsWith('.xlsx')) {
    try {
      const excelData = xlsx
        .parse(file, { cellDates: true })
        .find(
          ({ name }) => name.toLowerCase() === 'ontime' || name.toLowerCase() === 'event schedule'
        );

      // we only look at worksheets called ontime or event schedule
      if (excelData?.data) {
        const dataFromExcel = await parseExcel_v1(excelData.data);
        res.data = await parseJson_v1(dataFromExcel);
        res.message = 'success';
      } else {
        console.log('Error: No sheets found named ontime or event schedule');
        res = {
          error: true,
          message: `No sheets found named ontime or event schedule`,
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

    if (uploadedJson.settings.version === 1) {
      try {
        res.data = await parseJson_v1(uploadedJson);
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
