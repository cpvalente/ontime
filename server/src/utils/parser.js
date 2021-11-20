import fs from 'fs';
import xlsx from 'node-xlsx';
import {
  event as eventDef,
  delay as delayDef,
  block as blockDef,
} from '../models/eventsDefinition.js';
import { dbModelv1 } from '../models/dataModel.js';
import { generateId } from './generate_id.js';

export const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const JSON_MIME = 'application/json';
export const ALLOWED_TYPES = ['JSON', 'EXCEL'];

/**
 * @description Middleware function that checks file type and calls relevant parser
 * @argument file - reference to file
 * @return {object} - parse result message
 */
export const fileHandler = async (file) => {
  let res = {};

  // check which file type are we dealing with

  if (file.endsWith('.xlsx')) {
    console.log('excel!');
    try {
      const excelData = xlsx
        .parse(file)
        .find(
          ({ name }) =>
            name.toLowerCase() === 'ontime' ||
            name.toLowerCase() === 'event schedule'
        );

      // we only look at worksheets called ontime or event schedule
      if (excelData) {
        parseExcelv1(excelData);
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
    const uploadedJson = JSON.parse(rawdata);

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
 * @argument excelData - array with excel sheet
 * @returns {object} - parsed object
 */
export const parseExcelv1 = async (excelData) => {
  console.log(excelData);
};

/**
 * @description JSON parser function for v1 of data system
 * @argument jsonData - JSON object to be parsed
 * @returns {object} - parsed object
 */

export const parseJsonv1 = async (jsonData) => {
  let numEntries = 0;
  let returnData = {};
  if ('events' in jsonData) {
    console.log('Found events definition, importing...');
    let events = [];
    let ids = [];
    for (const e of jsonData.events) {
      if (e.type === 'event') {
        // ensure id is defined and unique
        const id = e.id || generateId();

        // doublecheck unique ids
        if (ids.indexOf(e.id) !== -1) {
          console.log('ERROR: ID colision on import, skipping');
          continue;
        }
        ids.push(id);

        // make sure all properties exits
        // dont load any extra properties than the ones known
        events.push({
          ...eventDef,
          title: e.title || eventDef.title,
          subtitle: e.subtitle || eventDef.subtitle,
          presenter: e.presenter || eventDef.presenter,
          note: e.note || eventDef.note,
          timeStart: e.timeStart || eventDef.timeStart,
          timeEnd: e.timeEnd || eventDef.timeEnd,
          isPublic: e.isPublic || eventDef.isPublic,
          id,
          type: 'event',
        });
        numEntries++;
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
 * @description Delete file from system
 * @argument file - reference to file
 */
const deleteFile = async (file) => {
  // delete a file
  fs.unlink(file, (err) => {
    if (err) {
      console.log(err);
    }
  });
};
