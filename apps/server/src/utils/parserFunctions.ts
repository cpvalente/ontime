import { generateId } from 'ontime-utils';
import {
  CustomFields,
  DatabaseModel,
  HttpSettings,
  HttpSubscription,
  isOntimeBlock,
  isOntimeCycle,
  isOntimeDelay,
  isOntimeEvent,
  OntimeRundown,
  OSCSettings,
  OscSubscription,
  ProjectData,
  Settings,
  URLPreset,
  ViewSettings,
} from 'ontime-types';

import { block as blockDef, delay as delayDef } from '../models/eventsDefinition.js';
import { dbModel } from '../models/dataModel.js';
import { createEvent } from './parser.js';

/**
 * Parse events array of an entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseRundown = (data: Partial<DatabaseModel>): OntimeRundown => {
  let newRundown: OntimeRundown = [];
  if ('rundown' in data) {
    console.log('Found rundown definition, importing...');
    const rundown = [];
    try {
      let eventIndex = 0;
      const ids = [];
      for (const event of data.rundown) {
        // double check unique ids
        if (ids.includes(event?.id)) {
          console.log('ERROR: ID collision on import, skipping');
          continue;
        }

        if (isOntimeEvent(event)) {
          eventIndex += 1;
          const parsedEvent = createEvent(event, eventIndex.toString());
          if (event != null) {
            rundown.push(parsedEvent);
            ids.push(parsedEvent.id);
          }
        } else if (isOntimeDelay(event)) {
          rundown.push({
            ...delayDef,
            duration: event.duration,
            id: event.id || generateId(),
          });
        } else if (isOntimeBlock(event)) {
          rundown.push({ ...blockDef, title: event.title, id: event.id || generateId() });
        } else {
          console.log('ERROR: unkown event type, skipping');
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
export const parseProject = (data: Partial<DatabaseModel>): ProjectData => {
  let newProjectData: Partial<ProjectData> = {};
  // we are adding this here to aid transition, should be removed once enough time has past that users have fully migrated
  if ('project' in data) {
    console.log('Found project data, importing...');
    const project = data.project;

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
    if (s?.app !== 'ontime' || s?.version == null) {
      console.log('ERROR: unknown app version, skipping');
    } else {
      const settings = {
        version: dbModel.settings.version,
        serverPort: s.serverPort ?? dbModel.settings.serverPort,
        editorKey: s.editorKey ?? null,
        operatorKey: s.operatorKey ?? null,
        timeFormat: s.timeFormat ?? '24',
        language: s.language ?? 'en',
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
export const parseViewSettings = (data: Partial<DatabaseModel>): ViewSettings => {
  let newViews: Partial<ViewSettings> = {};
  if ('viewSettings' in data) {
    console.log('Found view definition, importing...');
    const v = data.viewSettings;

    const viewSettings = {
      overrideStyles: v.overrideStyles ?? dbModel.viewSettings.overrideStyles,
      normalColor: v.normalColor ?? dbModel.viewSettings.normalColor,
      warningColor: v.warningColor ?? dbModel.viewSettings.warningColor,
      dangerColor: v.dangerColor ?? dbModel.viewSettings.dangerColor,
      endMessage: v.endMessage ?? dbModel.viewSettings.endMessage,
    };

    newViews = { ...viewSettings };
  }
  return newViews as ViewSettings;
};

/**
 * Sanitises an OSC Subscriptions array
 */
export function sanitiseOscSubscriptions(subscriptions?: OscSubscription[]): OscSubscription[] {
  if (!Array.isArray(subscriptions)) {
    return [];
  }

  return subscriptions.filter(
    ({ id, cycle, path, message, enabled }) =>
      typeof id === 'string' &&
      isOntimeCycle(cycle) &&
      typeof path === 'string' &&
      typeof message === 'string' &&
      typeof enabled === 'boolean',
  );
}

/**
 * Parse osc portion of an entry
 */
export const parseOsc = (data: { osc?: Partial<OSCSettings> }): OSCSettings => {
  if ('osc' in data) {
    console.log('Found OSC definition, importing...');

    const loadedConfig = data.osc || {};
    return {
      portIn: loadedConfig.portIn ?? dbModel.osc.portIn,
      portOut: loadedConfig.portOut ?? dbModel.osc.portOut,
      targetIP: loadedConfig.targetIP ?? dbModel.osc.targetIP,
      enabledIn: loadedConfig.enabledIn ?? dbModel.osc.enabledIn,
      enabledOut: loadedConfig.enabledOut ?? dbModel.osc.enabledOut,
      subscriptions: sanitiseOscSubscriptions(loadedConfig.subscriptions),
    };
  }
};

/**
 * Sanitises an HTTP Subscriptions array
 */
export function sanitiseHttpSubscriptions(subscriptions?: HttpSubscription[]): HttpSubscription[] {
  if (!Array.isArray(subscriptions)) {
    return [];
  }

  return subscriptions.filter(
    ({ id, cycle, message, enabled }) =>
      typeof id === 'string' &&
      isOntimeCycle(cycle) &&
      typeof message === 'string' &&
      message.startsWith('http://') &&
      typeof enabled === 'boolean',
  );
}

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

    return {
      enabledOut: loadedConfig.enabledOut ?? dbModel.http.enabledOut,
      subscriptions: sanitiseHttpSubscriptions(loadedConfig.subscriptions),
    };
  }
};

/**
 * Parse URL preset portion of an entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseUrlPresets = (data: Partial<DatabaseModel>): URLPreset[] => {
  const newPresets: URLPreset[] = [];
  if ('urlPresets' in data) {
    console.log('Found URL presets definition, importing...');
    try {
      for (const preset of data.urlPresets) {
        const newPreset = {
          enabled: preset.enabled ?? false,
          alias: preset.alias ?? '',
          pathAndParams: preset.pathAndParams ?? '',
        };
        newPresets.push(newPreset);
      }
      console.log(`Uploaded ${newPresets.length} preset(s)`);
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }
  return newPresets;
};

/**
 * Parse customFields entry
 * @param {object} data - data object
 * @returns {object} - event object data
 */
export const parseCustomFields = (data: Partial<DatabaseModel>): CustomFields => {
  let newCustomFields: CustomFields = { ...dbModel.customFields };

  if ('customFields' in data) {
    console.log('Found Custom Fields definition, importing...');
    try {
      //TODO: validate
      newCustomFields = { ...dbModel.customFields, ...data.customFields };
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }
  return { ...newCustomFields };
};
