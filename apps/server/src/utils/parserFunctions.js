import { block as blockDef, delay as delayDef } from '../models/eventsDefinition.js';
import { dbModel } from '../models/dataModel.js';
import { validateEvent } from './parser.js';
import { generateId } from './generate_id.js';
import { MAX_EVENTS } from '../settings.js';

/**
 * Parse events array of an entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseRundown = (data) => {
  let newRundown = [];
  if ('rundown' in data) {
    console.log('Found rundown definition, importing...');
    const rundown = [];
    try {
      const ids = [];
      for (const e of data.rundown) {
        // cap number of events
        if (rundown.length >= MAX_EVENTS) {
          console.log(`ERROR: Reached limit number of ${MAX_EVENTS} events`);
          break;
        }

        // double check unique ids
        if (ids.indexOf(e?.id) !== -1) {
          console.log('ERROR: ID collision on import, skipping');
          continue;
        }

        if (e.type === 'event') {
          const event = validateEvent(e);
          if (event != null) {
            rundown.push(event);
            ids.push(event.id);
          }
        } else if (e.type === 'delay') {
          rundown.push({
            ...delayDef,
            duration: e.duration,
            id: e.id || generateId(),
          });
        } else if (e.type === 'block') {
          rundown.push({ ...blockDef, id: e.id || generateId() });
        } else {
          console.log('ERROR: undefined event type, skipping');
        }
      }
    } catch (error) {
      console.log(`Error ${error}`);
    }
    // write to db
    newRundown = rundown;
    console.log(`Uploaded file with ${newRundown.length} entries`);
  }
  return newRundown;
};
/**
 * Parse event portion of an entry
 * @param {object} data - data object
 * @param {boolean} enforce - whether to create a definition if one is missing
 * @returns {object} - event object data
 */
export const parseEvent = (data, enforce) => {
  let newEvent = {};
  if ('event' in data) {
    console.log('Found event data, importing...');
    const e = data.event;
    // filter known properties and write to db
    newEvent = {
      ...dbModel.event,
      title: e.title || dbModel.event.title,
      url: e.url || dbModel.event.url,
      publicInfo: e.publicInfo || dbModel.event.publicInfo,
      backstageInfo: e.backstageInfo || dbModel.event.backstageInfo,
      endMessage: e.endMessage || dbModel.event.endMessage,
    };
  } else if (enforce) {
    newEvent = { ...dbModel.event };
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
export const parseSettings = (data, enforce) => {
  let newSettings = {};
  if ('settings' in data) {
    console.log('Found settings definition, importing...');
    const s = data.settings;

    // skip if file definition is missing
    if (s.app == null || s.version == null) {
      console.log('ERROR: unknown app version, skipping');
    } else {
      const settings = {
        lock: s.lock || null,
        pinCode: s.pinCode || null,
        timeFormat: s.timeFormat || '24',
      };

      // write to db
      newSettings = {
        ...dbModel.settings,
        ...settings,
      };
    }
  } else if (enforce) {
    newSettings = dbModel.settings;
    console.log(`Created settings object in db`);
  }
  return newSettings;
};

/**
 * Parse settings portion of an entry
 * @param {object} data - data object
 * @param {boolean} enforce - whether to create a definition if one is missing
 * @returns {object} - event object data
 */
export const parseViews = (data, enforce) => {
  let newViews = {};
  if ('views' in data) {
    console.log('Found view definition, importing...');
    const v = data.views;

    const viewSettings = {
      overrideStyles: v.overrideStyles ?? dbModel.views.overrideStyles,
    };

    // write to db
    newViews = {
      ...viewSettings,
    };
  } else if (enforce) {
    newViews = dbModel.views;
    console.log(`Created view object in db`);
  }
  return newViews;
};

/**
 * Parse osc portion of an entry
 * @param {object} data - data object
 * @param {boolean} enforce - whether to create a definition if one is missing
 * @returns {object} - event object data
 */
export const parseOsc = (data, enforce) => {
  let newOsc = {};
  if ('osc' in data) {
    console.log('Found OSC definition, importing...');
    const s = data.osc;
    const osc = {};

    if (s.port) osc.port = s.port;
    if (s.portOut) osc.portOut = s.portOut;
    if (s.targetIP) osc.targetIP = s.targetIP;
    if (typeof s.enabled !== 'undefined') osc.enabled = s.enabled;
    // write to db
    newOsc = {
      ...dbModel.osc,
      ...osc,
    };
  } else if (enforce) {
    newOsc = { ...dbModel.osc };
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
export const parseHttp = (data, enforce) => {
  const newHttp = {};
  if ('http' in data) {
    console.log('Found HTTP definition, importing...');
    const h = data.osc;
    const http = {};

    if (h.user) http.user = h.user;
    if (h.pwd) http.pwd = h.pwd;

    // write to db
    newHttp.http = {
      ...dbModel.http,
      ...http,
    };
  } else if (enforce) {
    newHttp.http = { ...dbModel.http };
    console.log(`Created http object in db`);
  }
  return newHttp;
};

/**
 * Parse aliases portion of an entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseAliases = (data) => {
  const newAliases = [];
  if ('aliases' in data) {
    console.log('Found Aliases definition, importing...');
    const ids = [];
    try {
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
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }
  return newAliases;
};

/**
 * Parse userFields entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseUserFields = (data) => {
  const newUserFields = { ...dbModel.userFields };

  if ('userFields' in data) {
    console.log('Found User Fields definition, importing...');
    // we will only be importing the fields we know, so look for that
    try {
      let fieldsFound = 0;
      for (const n in newUserFields) {
        if (n in data.userFields) {
          fieldsFound++;
          newUserFields[n] = data.userFields[n];
        }
      }
      console.log(`Uploaded ${fieldsFound} user fields`);
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }
  return { ...newUserFields };
};
