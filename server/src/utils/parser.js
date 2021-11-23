import fs from 'fs';
import xlsx from 'node-xlsx';
import {
  event as eventDef,
  delay as delayDef,
  block as blockDef,
} from '../models/eventsDefinition.js';
import { dbModelv1 } from '../models/dataModel.js';
import { generateId } from './generate_id.js';
import { excelDateStringToMillis } from './time.js';

export const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const JSON_MIME = 'application/json';
export const ALLOWED_TYPES = ['JSON', 'EXCEL'];

/**
 * @description Middleware function that checks file type and calls relevant parser
 * @argument {string} file - reference to file
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
          ({ name }) =>
            name.toLowerCase() === 'ontime' ||
            name.toLowerCase() === 'event schedule'
        );

      // we only look at worksheets called ontime or event schedule
      if (excelData?.data) {
        const dataFromExcel = await parseExcelv1(excelData.data);
        res.data = await parseJsonv1(dataFromExcel);
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
        res.data = await parseJsonv1(uploadedJson);
        res.message = 'success';
      } catch (error) {
        res = { error: true, message: `Error parsing file: ${error}` };
      }
    } else {
      res = { error: true, message: 'Error parsing file, version unknown' };
    }
  }

  // delete file
  deleteFile(file);

  return res;
};

/**
 * @description Excel array parser
 * @argument {array} excelData - array with excel sheet
 * @returns {object} - parsed object
 */
export const parseExcelv1 = async (excelData) => {
  let eventData = {
    title: '',
    url: '',
  };

  let events = [];
  let timeStartIndex = null;
  let timeEndIndex = null;
  let titleIndex = null;
  let presenterIndex = null;
  let subtitleIndex = null;
  let isPublicIndex = null;
  let notesIndex = null;

  excelData
    .filter((e) => e.length > 0)
    .forEach((row) => {
      let eventTitleNext = false;
      let eventUrlNext = false;
      let event = {};

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
          // whether column is not empty
          event.isPublic = column !== '';
        } else if (j === notesIndex) {
          event.note = column;
        } else {
          if (typeof column === 'string') {
            // look for keywords
            // need to make sure it is a string first
            switch (column.toLowerCase()) {
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
              case 'notes':
                notesIndex = j;
                break;
              default:
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
  };
};

/**
 * @description JSON parser function for v1 of data system
 * @argument {object} jsonData - json data JSON object to be parsed
 * @returns {object} - parsed object
 */

export const parseJsonv1 = async (jsonData) => {
  if (!jsonData || typeof jsonData !== 'object') {
    console.log('ERROR: Invalid JSON format');
    return -1;
  }

  let numEntries = 0;
  let returnData = {};
  if ('events' in jsonData) {
    console.log('Found events definition, importing...');
    let events = [];
    let ids = [];
    for (const e of jsonData.events) {
      // doublecheck unique ids
      if (ids.indexOf(e?.id) !== -1) {
        console.log('ERROR: ID colision on import, skipping');
        continue;
      }

      if (e.type === 'event') {
        let event = validateEventv1(e);
        if (event != null) {
          events.push(event);
          ids.push(event.id);
          numEntries++;
        }
      } else if (e.type === 'delay') {
        events.push({ ...delayDef, duration: e.duration });
        numEntries++;
      } else if (e.type === 'block') {
        events.push({ ...blockDef });
        numEntries++;
      } else {
        console.log('ERROR: undefined event type, skipping');
      }
    }
    // write to db
    returnData.events = events;
    console.log(`Uploaded file with ${numEntries} entries`);
  }

  if ('event' in jsonData) {
    console.log('Found event data, importing...');
    const e = jsonData.event;
    // filter known properties
    const event = {
      ...dbModelv1.event,
      title: e.title || dbModelv1.event.title,
      url: e.url || dbModelv1.event.url,
      publicInfo: e.publicInfo || dbModelv1.event.publicInfo,
      backstageInfo: e.backstageInfo || dbModelv1.event.backstageInfo,
      endMessage: e.endMessage || dbModelv1.event.endMessage,
    };

    // write to db
    returnData.event = event;
  }

  // Settings handled partially
  if ('settings' in jsonData) {
    console.log('Found settings definition, importing...');
    const s = jsonData.settings;

    // skip if file definition is missing
    if (s.app == null || s.version == null) {
      console.log('ERROR: unknown app version, skipping');
    } else {
      let settings = {};

      if (s.oscInPort) settings.oscInPort = s.oscInPort;
      if (s.oscOutPort) settings.oscOutPort = s.oscOutPort;
      if (s.oscOutIP) settings.oscOutIP = s.oscOutIP;

      // write to db
      returnData.settings = {
        ...dbModelv1.settings,
        ...settings,
      };
    }
  }

  return returnData;
};

/**
 * @description Ensures variable is string, it skips object types
 * @param {any} val - variable to convert
 * @param {string} fallback = '' - fallback value
 * @returns {string} - value as string or fallback if not possibe
 */
export const makeString = (val, fallback = '') => {
  if (typeof val === 'string') return val;
  else if (val == null || val.constructor === Object) return fallback;
  else return val.toString();
};

/**
 * @description Enforces formatting for events
 * @param {object} eventArgs - attributes of event
 * @returns {object|null} - formatted object or null in case is invalid
 */

export const validateEventv1 = (eventArgs) => {
  // ensure id is defined and unique
  const id = eventArgs.id || generateId();
  let event = null;

  // return if object is empty
  if (Object.keys(eventArgs).length > 0) {
    // make sure all properties exits
    // dont load any extra properties than the ones known

    const e = eventArgs;
    const d = eventDef;

    event = {
      ...d,

      title: e.title != null ? toString(e.title) || d.title : d.title,
      subtitle:
        e.subtitle != null ? toString(e.subtitle) || d.subtitle : d.subtitle,
      presenter:
        e.subtitle != null ? toString(e.presenter) || d.presenter : d.presenter,
      note: e.subtitle != null ? toString(e.note) || d.note : d.note,
      timeStart:
        e.timeStart != null && typeof e.timeStart === 'number'
          ? e.timeStart
          : d.timeStart,
      timeEnd:
        e.timeEnd != null && typeof e.timeEnd === 'number'
          ? e.timeEnd
          : d.timeEnd,
      isPublic:
        e.isPublic != null && typeof e.isPublic === 'boolean'
          ? e.isPublic
          : d.isPublic,
      id,
      type: 'event',
    };
  }

  return event;
};

/**
 * @description Delete file from system
 * @argument {string} file - reference to file
 */
const deleteFile = async (file) => {
  // delete a file
  fs.unlink(file, (err) => {
    if (err) {
      console.log(err);
    }
  });
};

/**
 * @description Delete file from system
 * @argument {string} file - reference to file
 */
export const validateFile = (file) => {
  try {
    JSON.parse(fs.readFileSync(file));
    return true;
  } catch (err) {
    return false;
  }
};
