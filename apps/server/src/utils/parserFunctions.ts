import { generateId } from 'ontime-utils';
import {
  Alias,
  EndAction,
  EventData,
  OntimeRundown,
  OSCSettings,
  OscSubscription,
  OscSubscriptionOptions,
  Settings,
  TimerLifeCycle,
  TimerType,
  UserFields,
  ViewSettings,
} from 'ontime-types';

import { block as blockDef, delay as delayDef } from '../models/eventsDefinition.js';
import { dbModel } from '../models/dataModel.js';
import { validateEvent } from './parser.js';
import { MAX_EVENTS } from '../settings.js';

/**
 * Parse events array of an entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseRundown = (data): OntimeRundown => {
  let newRundown: OntimeRundown = [];
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
        // validate the right endAction is used
        if (e.endAction && !Object.values(EndAction).includes(e.endAction)) {
          e.endAction = EndAction.None;
          console.log('WARNING: invalid End Action provided, using default');
        }

        // validate the right timerType is used
        if (e.timerType && !Object.values(TimerType).includes(e.timerType)) {
          e.timerType = TimerType.CountDown;
          console.log('WARNING: invalid Timer Type provided, using default');
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
          rundown.push({ ...blockDef, title: e.title, id: e.id || generateId() });
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
export const parseEventData = (data, enforce): EventData => {
  let newEventData: Partial<EventData> = {};
  if ('eventData' in data) {
    console.log('Found event data, importing...');
    const e = data.eventData;
    // filter known properties and write to db
    newEventData = {
      ...dbModel.eventData,
      title: e.title || dbModel.eventData.title,
      publicUrl: e.publicUrl || dbModel.eventData.publicUrl,
      publicInfo: e.publicInfo || dbModel.eventData.publicInfo,
      backstageUrl: e.backstageUrl || dbModel.eventData.backstageUrl,
      backstageInfo: e.backstageInfo || dbModel.eventData.backstageInfo,
    };
  } else if (enforce) {
    newEventData = { ...dbModel.eventData };
    console.log('Created event object in db');
  }
  return newEventData as EventData;
};

/**
 * Parse settings portion of an entry
 * @param {object} data - data object
 * @param {boolean} enforce - whether to create a definition if one is missing
 * @returns {object} - event object data
 */
export const parseSettings = (data, enforce): Settings => {
  let newSettings: Partial<Settings> = {};
  if ('settings' in data) {
    console.log('Found settings definition, importing...');
    const s = data.settings;

    // skip if file definition is missing
    if (s.app == null || s.version == null) {
      console.log('ERROR: unknown app version, skipping');
    } else {
      const settings = {
        editorKey: s.editorKey || null,
        operatorKey: s.operatorKey || null,
        timeFormat: s.timeFormat || '24',
        language: s.language || 'en',
      };

      // write to db
      newSettings = {
        ...dbModel.settings,
        ...settings,
      };
    }
  } else if (enforce) {
    newSettings = dbModel.settings;
    console.log('Created settings object in db');
  }
  return newSettings as Settings;
};

/**
 * Parse settings portion of an entry
 * @param {object} data - data object
 * @param {boolean} enforce - whether to create a definition if one is missing
 * @returns {object} - event object data
 */
export const parseViewSettings = (data, enforce): ViewSettings => {
  let newViews: Partial<ViewSettings> = {};
  if ('viewSettings' in data) {
    console.log('Found view definition, importing...');
    const v = data.viewSettings;

    const viewSettings = {
      overrideStyles: v.overrideStyles ?? dbModel.viewSettings.overrideStyles,
      normalColor: v.normalColor ?? dbModel.viewSettings.normalColor,
      warningColor: v.warningColor ?? dbModel.viewSettings.warningColor,
      warningThreshold: v.warningThreshold ?? dbModel.viewSettings.warningThreshold,
      dangerColor: v.dangerColor ?? dbModel.viewSettings.dangerColor,
      dangerThreshold: v.dangerThreshold ?? dbModel.viewSettings.dangerThreshold,
      endMessage: v.endMessage ?? dbModel.viewSettings.endMessage,
    };

    // write to db
    newViews = {
      ...viewSettings,
    };
  } else if (enforce) {
    newViews = dbModel.viewSettings;
    console.log('Created viewSettings object in db');
  }
  return newViews as ViewSettings;
};

/**
 * Parses and validates subscription entry
 * @param data
 */
export const validateOscSubscriptionEntry = (data: OscSubscriptionOptions): boolean => {
  for (const subscription in data) {
    if (typeof data[subscription].message !== 'string' || typeof data[subscription].enabled !== 'boolean') {
      return false;
    }
  }
  return true;
};

/**
 * Parses and validates subscription object
 * @param data
 */
export const validateOscObject = (data: OscSubscription): boolean => {
  if (!data) {
    return false;
  }
  const timerKeys = Object.keys(TimerLifeCycle);
  for (const key of timerKeys) {
    if (!(key in data) || !Array.isArray(data[key])) {
      return false;
    }
    for (const subscription of data[key]) {
      if (typeof subscription.message !== 'string' || typeof subscription.enabled !== 'boolean') {
        return false;
      }
    }
  }
  return true;
};

/**
 * Parse osc portion of an entry
 */
export const parseOsc = (data: { osc?: Partial<OSCSettings> }, enforce: boolean): Partial<OSCSettings> => {
  if ('osc' in data) {
    console.log('Found OSC definition, importing...');

    const loadedConfig = data?.osc || {};
    const validatedSubscriptions = validateOscObject(loadedConfig.subscriptions)
      ? loadedConfig.subscriptions
      : dbModel.osc.subscriptions;

    return {
      portIn: loadedConfig.portIn ?? dbModel.osc.portIn,
      portOut: loadedConfig.portOut ?? dbModel.osc.portOut,
      targetIP: loadedConfig.targetIP ?? dbModel.osc.targetIP,
      enabledIn: loadedConfig.enabledIn ?? dbModel.osc.enabledIn,
      enabledOut: loadedConfig.enabledOut ?? dbModel.osc.enabledOut,
      subscriptions: validatedSubscriptions,
    };
  } else if (enforce) {
    console.log('Created OSC object in db');
    return { ...dbModel.osc };
  } else return {};
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
  } else if (enforce) {
    /* Not yet */
  }
  return newHttp;
};

/**
 * Parse aliases portion of an entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseAliases = (data): Alias[] => {
  const newAliases: Alias[] = [];
  if ('aliases' in data) {
    console.log('Found Aliases definition, importing...');
    try {
      for (const a of data.aliases) {
        const newAlias = {
          enabled: a.enabled || false,
          alias: a.alias || '',
          pathAndParams: a.pathAndParams || '',
        };
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
export const parseUserFields = (data): UserFields => {
  const newUserFields: UserFields = { ...dbModel.userFields };

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
