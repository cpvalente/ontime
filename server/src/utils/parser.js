import fs from 'fs';
import xlsx from 'node-xlsx';
import {
  block as blockDef,
  delay as delayDef,
  event as eventDef,
} from '../models/eventsDefinition.js';
import { dbModelv1 } from '../models/dataModel.js';
import { generateId } from 'ontime-utils/generate_id.js';
import { excelDateStringToMillis } from 'ontime-utils/time.js';

export const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const JSON_MIME = 'application/json';
export const MAX_EVENTS = 99;

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

/**
 * @description Excel array parser
 * @param {array} excelData - array with excel sheet
 * @returns {object} - parsed object
 */
export const parseExcel_v1 = async (excelData) => {
  let eventData = {
    title: '',
    url: '',
  };
  let customUserFields = {};
  let events = [];
  let timeStartIndex = null;
  let timeEndIndex = null;
  let titleIndex = null;
  let presenterIndex = null;
  let subtitleIndex = null;
  let isPublicIndex = null;
  let notesIndex = null;
  let lightIndex = null;
  let camIndex = null;
  let videoIndex = null;
  let audioIndex = null;
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

  // const user = {
  //   identifier: 0,
  //   index: null
  // }

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
          let c = column;
          if (typeof column === 'string') {
            c = column.replace(/\s+/g, '');
          }
          event.isPublic = c !== '';
        } else if (j === notesIndex) {
          event.note = column;
        } else if (j === lightIndex) {
          event.light = column;
        } else if (j === camIndex) {
          event.cam = column;
        } else if (j === videoIndex) {
          event.video = column;
        } else if (j === audioIndex) {
          event.audio = column;
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
              case 'notes':
                notesIndex = j;
                break;
              case 'light':
              case 'lx':
                lightIndex = j;
                break;
              case 'cam':
              case 'camera':
                camIndex = j;
                break;
              case 'video':
              case 'av':
                videoIndex = j;
                break;
              case 'audio':
              case 'sound':
              case 'sfx':
                audioIndex = j;
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
                  if (name !== undefined) {
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
  let returnData = {};

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
 * @description Ensures variable is string, it skips object types
 * @param {any} val - variable to convert
 * @param {string} [fallback=''] - fallback value
 * @returns {string} - value as string or fallback if not possible
 */
export const makeString = (val, fallback = '') => {
  if (typeof val === 'string') return val;
  else if (val == null || val.constructor === Object) return fallback;
  else return val.toString();
};

/**
 * @description validates a duration value against options
 * @param {number} timeStart
 * @param {number} timeEnd
 * @returns {number}
 */
export const validateDuration = (timeStart, timeEnd) => {
  // Todo: this would go into a switch statement when expanded
  // Durations must be positive
  return Math.max(timeEnd - timeStart, 0);
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
      note: makeString(e.note, d.note),
      light: makeString(e.light, d.light),
      cam: makeString(e.cam, d.cam),
      video: makeString(e.video, d.video),
      audio: makeString(e.audio, d.audio),
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
 * @description Delete file from system
 * @param {string} file - reference to file
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
 * @param {string} file - reference to file
 * @returns {boolean} - whether file is valid JSON
 */
export const validateFile = (file) => {
  try {
    JSON.parse(fs.readFileSync(file, 'utf-8'));
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Parse events array of an entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseEvents_v1 = (data) => {
  let newEvents = [];
  if ('events' in data) {
    console.log('Found events definition, importing...');
    let events = [];
    let ids = [];
    for (const e of data.events) {
      // cap number of events
      if (events.length >= MAX_EVENTS) {
        console.log(`ERROR: Reached limit number of ${MAX_EVENTS} events`);
        break;
      }

      // double check unique ids
      if (ids.indexOf(e?.id) !== -1) {
        console.log('ERROR: ID collision on import, skipping');
        continue;
      }

      if (e.type === 'event') {
        let event = validateEvent_v1(e);
        if (event != null) {
          events.push(event);
          ids.push(event.id);
        }
      } else if (e.type === 'delay') {
        events.push({
          ...delayDef,
          duration: e.duration,
          id: e.id || generateId(),
        });
      } else if (e.type === 'block') {
        events.push({ ...blockDef, id: e.id || generateId() });
      } else {
        console.log('ERROR: undefined event type, skipping');
      }
    }
    // write to db
    newEvents = events;
    console.log(`Uploaded file with ${events.length} entries`);
  }
  return newEvents;
};
/**
 * Parse event portion of an entry
 * @param {object} data - data object
 * @param {boolean} enforce - whether to create a definition if one is missing
 * @returns {object} - event object data
 */
export const parseEvent_v1 = (data, enforce) => {
  let newEvent = {};
  if ('event' in data) {
    console.log('Found event data, importing...');
    const e = data.event;
    // filter known properties and write to db
    newEvent = {
      ...dbModelv1.event,
      title: e.title || dbModelv1.event.title,
      url: e.url || dbModelv1.event.url,
      publicInfo: e.publicInfo || dbModelv1.event.publicInfo,
      backstageInfo: e.backstageInfo || dbModelv1.event.backstageInfo,
      endMessage: e.endMessage || dbModelv1.event.endMessage,
    };
  } else if (enforce) {
    newEvent = dbModelv1.event;
    console.log(`Created event object in db`);
  }
  return newEvent;
};

/**
 * Parse settings portion of an entry
 * @param {object} data - data object
 * @param {boolean} enforce - whether to create a definition if one is missing
 * @returns {object} - event object data
 */
export const parseSettings_v1 = (data, enforce) => {
  let newSettings = {};
  if ('settings' in data) {
    console.log('Found settings definition, importing...');
    const s = data.settings;

    // skip if file definition is missing
    if (s.app == null || s.version == null) {
      console.log('ERROR: unknown app version, skipping');
    } else {
      let settings = {
        lock: s.lock || null,
        pinCode: s.pinCode || null,
      };

      // write to db
      newSettings = {
        ...dbModelv1.settings,
        ...settings,
      };
    }
  } else if (enforce) {
    newSettings = dbModelv1.settings;
    console.log(`Created settings object in db`);
  }
  return newSettings;
};

/**
 * Parse osc portion of an entry
 * @param {object} data - data object
 * @param {boolean} enforce - whether to create a definition if one is missing
 * @returns {object} - event object data
 */
export const parseOsc_v1 = (data, enforce) => {
  let newOsc = {};
  if ('osc' in data) {
    console.log('Found OSC definition, importing...');
    const s = data.osc;
    let osc = {};

    if (s.port) osc.port = s.port;
    if (s.portOut) osc.portOut = s.portOut;
    if (s.targetIP) osc.targetIP = s.targetIP;
    if (s.enabled !== undefined) osc.enabled = s.enabled;

    // write to db
    newOsc = {
      ...dbModelv1.osc,
      ...osc,
    };
  } else if (enforce) {
    newOsc = dbModelv1.osc;
    console.log(`Created OSC object in db`);
  }
  return newOsc;
};

/**
 * Parse Http portion of an entry
 * @param {object} data - data object
 * @param {boolean} enforce - whether to create a definition if one is missing
 * @returns {object} - event object data
 */
export const parseHttp_v1 = (data, enforce) => {
  let newHttp = {};
  if ('http' in data) {
    console.log('Found HTTP definition, importing...');
    const h = data.osc;
    let http = {};

    if (h.user) http.user = h.user;
    if (h.pwd) http.pwd = h.pwd;

    // write to db
    newHttp.http = {
      ...dbModelv1.http,
      ...http,
    };
  } else if (enforce) {
    newHttp.http = dbModelv1.http;
    console.log(`Created http object in db`);
  }
  return newHttp;
};

/**
 * Parse aliases portion of an entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseAliases_v1 = (data) => {
  let newAliases = [];
  if ('aliases' in data) {
    console.log('Found Aliases definition, importing...');
    const ids = [];
    for (const a of data.aliases) {
      // double check unique ids
      if (ids.indexOf(a?.id) !== -1) {
        console.log('ERROR: ID collision on import, skipping');
        continue;
      }
      const newAlias = {
        id: a.id || generateId(),
        enabled: a.enabled || false,
        alias: a.alias || '',
        pathAndParams: a.pathAndParams || '',
      };

      ids.push(newAlias.id);
      newAliases.push(newAlias);
    }
    console.log(`Uploaded ${newAliases?.length || 0} alias(es)`);
  }
  return newAliases;
};

/**
 * Parse userFields entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseUserFields_v1 = (data) => {
  let newUserFields = dbModelv1.userFields;

  if ('userFields' in data) {
    console.log('Found User Fields definition, importing...');
    // we will only be importing the fields we know, so look for that
    let fieldsFound = 0;
    for (let n in newUserFields) {
      if (n in data.userFields) {
        fieldsFound++;
        newUserFields[n] = data.userFields[n];
      }
    }
    console.log(`Uploaded ${fieldsFound} user fields`);
  }
  return { ...dbModelv1.userFields, ...newUserFields };
};
