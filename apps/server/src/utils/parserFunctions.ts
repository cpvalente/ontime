import { generateId } from 'ontime-utils';
import {
  Alias,
  OntimeRundown,
  HttpSettings,
  OSCSettings,
  ProjectData,
  Settings,
  TimerLifeCycle,
  UserFields,
  ViewSettings,
  OscSubscription,
  HttpSubscription,
  OscSubscriptionOptions,
  HttpSubscriptionOptions,
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
      let eventIndex = 0;
      const ids = [];
      for (const e of data.rundown) {
        // cap number of events
        if (rundown.length >= MAX_EVENTS) {
          console.log(`ERROR: Reached limit number of ${MAX_EVENTS} events`);
          break;
        }

        // double check unique ids
        if (ids.includes(e?.id)) {
          console.log('ERROR: ID collision on import, skipping');
          continue;
        }

        if (e.type === 'event') {
          eventIndex += 1;
          const event = validateEvent(e, eventIndex.toString());
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
 * @returns {object} - event object data
 */
export const parseProject = (data): ProjectData => {
  let newProjectData: Partial<ProjectData> = {};
  // we are adding this here to aid transition, should be removed once enough time has past that users have fully migrated
  // TODO: Remove eventually
  if ('project' in data || 'eventData' in data) {
    console.log('Found project data, importing...');
    const project = data.project ?? data.eventData;

    // filter known properties and write to db
    newProjectData = {
      ...dbModel.project,
      title: project.title || dbModel.project.title,
      description: project.description || dbModel.project.description,
      publicUrl: project.publicUrl || dbModel.project.publicUrl,
      publicInfo: project.publicInfo || dbModel.project.publicInfo,
      backstageUrl: project.backstageUrl || dbModel.project.backstageUrl,
      backstageInfo: project.backstageInfo || dbModel.project.backstageInfo,
    };
  }
  return newProjectData as ProjectData;
};

/**
 * Parse settings portion of an entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseSettings = (data): Settings => {
  let newSettings: Partial<Settings> = {};
  if ('settings' in data) {
    console.log('Found settings definition, importing...');
    const s = data.settings;

    // skip if file definition is missing
    if (s.app == null || s.version == null) {
      console.log('ERROR: unknown app version, skipping');
    } else {
      const settings = {
        version: dbModel.settings.version,
        serverPort: s.serverPort || dbModel.settings.serverPort,
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
  }
  return newSettings as Settings;
};

/**
 * Parse settings portion of an entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseViewSettings = (data): ViewSettings => {
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

    newViews = { ...viewSettings };
  }
  return newViews as ViewSettings;
};

/**
 * Parses and validates OSC subscription cycle options
 * @param data
 */
export const validateOscSubscriptionCycle = (data: OscSubscriptionOptions[]): boolean => {
  for (const subscriptionOption of data) {
    if (typeof subscriptionOption.message !== 'string' || typeof subscriptionOption.enabled !== 'boolean') {
      return false;
    }
  }
  return true;
};

/**
 * Parses and validates OSC subscription object
 * @param data
 */
export const validateOscSubscriptionObject = (data: OscSubscription): boolean => {
  if (!data) {
    return false;
  }

  const timerKeys = Object.keys(TimerLifeCycle);
  for (const key of timerKeys) {
    // must contains all keys and be an array
    if (!(key in data) || !Array.isArray(data[key])) {
      return false;
    }
    const isValid = validateOscSubscriptionCycle(data[key]);
    if (!isValid) {
      return false;
    }
  }
  return true;
};

/**
 * Parse osc portion of an entry
 */
export const parseOsc = (data: { osc?: Partial<OSCSettings> }): OSCSettings => {
  if ('osc' in data) {
    console.log('Found OSC definition, importing...');

    // TODO: this can be improved by only merging known keys
    const loadedConfig = data.osc || {};
    const validatedSubscriptions = validateOscSubscriptionObject(loadedConfig.subscriptions)
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
  }
};

/**
 * Parses and validates HTTP subscription cycle options
 * @param data
 */
export const validateHttpSubscriptionCycle = (data: HttpSubscriptionOptions[]): boolean => {
  for (const subscriptionOption of data) {
    const isHttp = subscriptionOption.message?.startsWith('http://');
    if (typeof subscriptionOption.message !== 'string' || !isHttp || typeof subscriptionOption.enabled !== 'boolean') {
      return false;
    }
  }
  return true;
};

/**
 * Parses and validates HTTP subscription object
 * @param data
 */
export const validateHttpSubscriptionObject = (data: HttpSubscription): boolean => {
  if (!data) {
    return false;
  }
  const timerKeys = Object.keys(TimerLifeCycle);
  // must contains all keys and be an array
  for (const key of timerKeys) {
    if (!(key in data) || !Array.isArray(data[key])) {
      return false;
    }
    const isValid = validateHttpSubscriptionCycle(data[key]);
    if (!isValid) {
      return false;
    }
  }
  return true;
};

/**
 * Parse Http portion of an entry
 * @param {object} data - data object
 * @param {boolean} enforce - whether to create a definition if one is missing
 * @returns {object} - event object data
 */
export const parseHttp = (data: { http?: Partial<HttpSettings> }): HttpSettings => {
  if ('http' in data) {
    console.log('Found HTTP definition, importing...');

    // TODO: this can be improved by only merging known keys
    const loadedConfig = data?.http || {};
    const validatedSubscriptions = validateHttpSubscriptionObject(loadedConfig.subscriptions)
      ? loadedConfig.subscriptions
      : dbModel.http.subscriptions;

    return {
      enabledOut: loadedConfig.enabledOut ?? dbModel.http.enabledOut,
      subscriptions: validatedSubscriptions,
    };
  }
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