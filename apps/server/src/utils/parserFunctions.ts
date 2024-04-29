import {
  CustomFields,
  DatabaseModel,
  HttpSettings,
  HttpSubscription,
  OSCSettings,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  OntimeRundown,
  OscSubscription,
  ProjectData,
  Settings,
  URLPreset,
  ViewSettings,
  isOntimeBlock,
  isOntimeCycle,
  isOntimeDelay,
  isOntimeEvent,
} from 'ontime-types';
import { generateId, getLastEvent } from 'ontime-utils';

import { dbModel } from '../models/dataModel.js';
import { block as blockDef, delay as delayDef } from '../models/eventsDefinition.js';
import { createEvent } from './parser.js';

/**
 * Parse rundown array of an entry
 */
export const parseRundown = (data: Partial<DatabaseModel>): OntimeRundown => {
  if (!data.rundown) {
    return [];
  }

  console.log('Found rundown, importing...');

  const rundown: OntimeRundown = [];
  let eventIndex = 0;
  const ids: string[] = [];

  for (const event of data.rundown) {
    if (ids.includes(event.id)) {
      console.log('ERROR: ID collision on import, skipping');
      continue;
    }

    const id = event.id || generateId();
    let newEvent: OntimeEvent | OntimeDelay | OntimeBlock | null;

    if (isOntimeEvent(event)) {
      if (event.linkStart) {
        const prevEvent = getLastEvent(rundown).lastEvent;
        event.linkStart = prevEvent.id;
      }
      newEvent = createEvent(event, eventIndex.toString());
      // skip if event is invalid
      if (newEvent == null) {
        continue;
      }

      eventIndex += 1;
    } else if (isOntimeDelay(event)) {
      newEvent = { ...delayDef, duration: event.duration, id };
    } else if (isOntimeBlock(event)) {
      newEvent = { ...blockDef, title: event.title, id };
    } else {
      console.log('ERROR: unknown event type, skipping');
      continue;
    }

    if (newEvent) {
      rundown.push(newEvent);
      ids.push(id);
    }
  }

  console.log(`Uploaded rundown with ${rundown.length} entries`);
  return rundown;
};

/**
 * Parse event portion of an entry
 */
export const parseProject = (data: Partial<DatabaseModel>): ProjectData => {
  if (!data.project) {
    return { ...dbModel.project };
  }

  console.log('Found project data, importing...');

  return {
    title: data.project.title ?? dbModel.project.title,
    description: data.project.description ?? dbModel.project.description,
    publicUrl: data.project.publicUrl ?? dbModel.project.publicUrl,
    publicInfo: data.project.publicInfo ?? dbModel.project.publicInfo,
    backstageUrl: data.project.backstageUrl ?? dbModel.project.backstageUrl,
    backstageInfo: data.project.backstageInfo ?? dbModel.project.backstageInfo,
  };
};

/**
 * Parse settings portion of an entry
 */
export const parseSettings = (data: Partial<DatabaseModel>): Settings => {
  if (!data.settings) {
    return { ...dbModel.settings };
  }

  // skip if file definition is missing
  if (data.settings?.app !== 'ontime' || data.settings?.version == null) {
    throw new Error('ERROR: unable to parse settings, missing app or version');
  }

  console.log('Found settings, importing...');

  return {
    app: dbModel.settings.app,
    version: dbModel.settings.version,
    serverPort: data.settings.serverPort ?? dbModel.settings.serverPort,
    editorKey: data.settings.editorKey ?? null,
    operatorKey: data.settings.operatorKey ?? null,
    timeFormat: data.settings.timeFormat ?? '24',
    language: data.settings.language ?? 'en',
  };
};

/**
 * Parse view settings portion of an entry
 */
export const parseViewSettings = (data: Partial<DatabaseModel>): ViewSettings => {
  if (!data.viewSettings) {
    return { ...dbModel.viewSettings };
  }

  console.log('Found view settings, importing...');

  return {
    dangerColor: data.viewSettings.dangerColor ?? dbModel.viewSettings.dangerColor,
    endMessage: data.viewSettings.endMessage ?? dbModel.viewSettings.endMessage,
    freezeEnd: data.viewSettings.freezeEnd ?? dbModel.viewSettings.freezeEnd,
    normalColor: data.viewSettings.normalColor ?? dbModel.viewSettings.normalColor,
    overrideStyles: data.viewSettings.overrideStyles ?? dbModel.viewSettings.overrideStyles,
    warningColor: data.viewSettings.warningColor ?? dbModel.viewSettings.warningColor,
  };
};

/**
 * Sanitises an OSC Subscriptions array
 */
export function sanitiseOscSubscriptions(subscriptions?: OscSubscription[]): OscSubscription[] {
  if (!Array.isArray(subscriptions)) {
    return [];
  }

  return subscriptions.filter(
    ({ id, cycle, address, payload, enabled }) =>
      typeof id === 'string' &&
      isOntimeCycle(cycle) &&
      typeof address === 'string' &&
      typeof payload === 'string' &&
      typeof enabled === 'boolean',
  );
}

/**
 * Parse osc portion of an entry
 */
export const parseOsc = (data: Partial<DatabaseModel>): OSCSettings => {
  if (!data.osc) {
    return { ...dbModel.osc };
  }
  console.log('Found OSC settings, importing...');

  return {
    portIn: data.osc.portIn ?? dbModel.osc.portIn,
    portOut: data.osc.portOut ?? dbModel.osc.portOut,
    targetIP: data.osc.targetIP ?? dbModel.osc.targetIP,
    enabledIn: data.osc.enabledIn ?? dbModel.osc.enabledIn,
    enabledOut: data.osc.enabledOut ?? dbModel.osc.enabledOut,
    subscriptions: sanitiseOscSubscriptions(data.osc.subscriptions),
  };
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
 */
export const parseHttp = (data: Partial<DatabaseModel>): HttpSettings => {
  if (!data.http) {
    return { ...dbModel.http };
  }

  console.log('Found HTTP settings, importing...');

  return {
    enabledOut: data.http.enabledOut ?? dbModel.http.enabledOut,
    subscriptions: sanitiseHttpSubscriptions(data.http.subscriptions),
  };
};

/**
 * Parse URL preset portion of an entry
 */
export const parseUrlPresets = (data: Partial<DatabaseModel>): URLPreset[] => {
  if (!data.urlPresets) {
    return [];
  }

  console.log('Found URL presets, importing...');

  const newPresets: URLPreset[] = [];

  for (const preset of data.urlPresets) {
    const newPreset = {
      enabled: preset.enabled ?? false,
      alias: preset.alias ?? '',
      pathAndParams: preset.pathAndParams ?? '',
    };
    newPresets.push(newPreset);
  }

  console.log(`Uploaded ${newPresets.length} preset(s)`);

  return newPresets;
};

/**
 * Parse customFields entry
 */
export const parseCustomFields = (data: Partial<DatabaseModel>): CustomFields => {
  if (typeof data.customFields !== 'object') {
    return { ...dbModel.customFields };
  }
  console.log('Found Custom Fields, importing...');

  return sanitiseCustomFields(data.customFields);
};

export const sanitiseCustomFields = (data: object): CustomFields => {
  const newCustomFields: CustomFields = {};

  for (const fieldLabel in data) {
    const field = data[fieldLabel];
    if (!('label' in field) || !('type' in field) || !('colour' in field)) {
      console.log('ERROR: missing required field, skipping');
      continue;
    }
    if (typeof field.label != 'string' || typeof field.type != 'string' || typeof field.colour != 'string') {
      console.log('ERROR: incorrect field type, skipping');
      continue;
    }

    if (fieldLabel != field.label.toLowerCase()) {
      console.log('ERROR: label and id musth match, skipping');
      continue;
    }

    if (fieldLabel == '') {
      console.log('ERROR: label must not be empty, skipping');
      continue;
    }

    if (field.type != 'string') {
      console.log('ERROR: incorrect field type, skipping');
      continue;
    }

    const key = field.label.toLowerCase();
    newCustomFields[key] = {
      type: field.type,
      colour: field.colour,
      label: field.label,
    };
  }

  return newCustomFields;
};
