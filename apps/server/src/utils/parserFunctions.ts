import {
  CustomField,
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
import { generateId, getErrorMessage, getLastEvent } from 'ontime-utils';

import { dbModel } from '../models/dataModel.js';
import { block as blockDef, delay as delayDef } from '../models/eventsDefinition.js';
import { createEvent } from './parser.js';

type ErrorEmitter = (message: string) => void;

/**
 * Parse rundown array of an entry
 */
export function parseRundown(
  data: Partial<DatabaseModel>,
  emitError?: ErrorEmitter,
): { customFields: CustomFields; rundown: OntimeRundown } {
  // check custom fields first
  const parsedCustomFields = parseCustomFields(data, emitError);

  if (!data.rundown) {
    emitError?.('No data found to import');
    return { customFields: parsedCustomFields, rundown: [] };
  }

  console.log('Found rundown, importing...');

  const rundown: OntimeRundown = [];
  let eventIndex = 0;
  const ids: string[] = [];

  for (const event of data.rundown) {
    if (ids.includes(event.id)) {
      emitError?.('ID collision on event import, skipping');
      continue;
    }

    const id = event.id || generateId();
    let newEvent: OntimeEvent | OntimeDelay | OntimeBlock | null;

    if (isOntimeEvent(event)) {
      if (event.linkStart) {
        const prevId = getLastEvent(rundown).lastEvent?.id ?? null;
        event.linkStart = prevId;
      }

      newEvent = createEvent(event, eventIndex.toString());
      // skip if event is invalid
      if (newEvent == null) {
        emitError?.('Skipping event without payload');
        continue;
      }

      // for every field in custom, check that a key exists in customfields
      for (const field in newEvent.custom) {
        if (!Object.hasOwn(parsedCustomFields, field)) {
          emitError?.(`Custom field ${field} not found`);
          delete newEvent.custom[field];
        }
      }

      eventIndex += 1;
    } else if (isOntimeDelay(event)) {
      newEvent = { ...delayDef, duration: event.duration, id };
    } else if (isOntimeBlock(event)) {
      newEvent = { ...blockDef, title: event.title, id };
    } else {
      emitError?.('Unknown event type, skipping');
      continue;
    }

    if (newEvent) {
      rundown.push(newEvent);
      ids.push(id);
    }
  }

  console.log(`Uploaded rundown with ${rundown.length} entries`);
  return { customFields: parsedCustomFields, rundown };
}

/**
 * Parse event portion of an entry
 */
export function parseProject(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): ProjectData {
  if (!data.project) {
    emitError?.('No data found to import');
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
}

/**
 * Parse settings portion of an entry
 */
export function parseSettings(data: Partial<DatabaseModel>): Settings {
  // skip if file definition is missing
  if (!data.settings || data.settings?.app !== 'ontime' || data.settings?.version == null) {
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
}

/**
 * Parse view settings portion of an entry
 */
export function parseViewSettings(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): ViewSettings {
  if (!data.viewSettings) {
    emitError?.('No data found to import');
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
}

/**
 * Sanitises an OSC Subscriptions array
 */
export function sanitiseOscSubscriptions(subscriptions?: OscSubscription[]): OscSubscription[] {
  if (!Array.isArray(subscriptions)) {
    throw new Error('ERROR: invalid OSC subscriptions');
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
export function parseOsc(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): OSCSettings {
  if (!data.osc) {
    emitError?.('No data found to import');
    return { ...dbModel.osc };
  }

  console.log('Found OSC settings, importing...');

  let newSubscriptions: OscSubscription[] = [];
  try {
    newSubscriptions = sanitiseOscSubscriptions(data.osc.subscriptions);
  } catch (error) {
    emitError?.(getErrorMessage(error));
  }

  if (newSubscriptions.length !== data.osc.subscriptions.length) {
    emitError?.('Skipped invalid subscriptions');
  }

  return {
    portIn: data.osc.portIn ?? dbModel.osc.portIn,
    portOut: data.osc.portOut ?? dbModel.osc.portOut,
    targetIP: data.osc.targetIP ?? dbModel.osc.targetIP,
    enabledIn: data.osc.enabledIn ?? dbModel.osc.enabledIn,
    enabledOut: data.osc.enabledOut ?? dbModel.osc.enabledOut,
    subscriptions: newSubscriptions,
  };
}

/**
 * Sanitises an HTTP Subscriptions array
 */
export function sanitiseHttpSubscriptions(subscriptions?: HttpSubscription[]): HttpSubscription[] {
  if (!Array.isArray(subscriptions)) {
    throw new Error('ERROR: invalid HTTP subscriptions');
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
export function parseHttp(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): HttpSettings {
  if (!data.http) {
    emitError?.('No data found to import');
    return { ...dbModel.http };
  }

  console.log('Found HTTP settings, importing...');

  let newSubscriptions: HttpSubscription[] = [];
  try {
    newSubscriptions = sanitiseHttpSubscriptions(data.http.subscriptions);
  } catch (error) {
    emitError?.(getErrorMessage(error));
  }

  if (newSubscriptions.length !== data.osc?.subscriptions.length) {
    emitError?.('Skipped invalid subscriptions');
  }

  return {
    enabledOut: data.http.enabledOut ?? dbModel.http.enabledOut,
    subscriptions: newSubscriptions,
  };
}

/**
 * Parse URL preset portion of an entry
 */
export function parseUrlPresets(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): URLPreset[] {
  if (!data.urlPresets) {
    emitError?.('No data found to import');
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
}

/**
 * Parse customFields entry
 */
export function parseCustomFields(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): CustomFields {
  if (typeof data.customFields !== 'object') {
    emitError?.('No data found to import');
    return {};
  }
  console.log('Found Custom Fields, importing...');

  const customFields = sanitiseCustomFields(data.customFields);
  if (Object.keys(customFields).length !== Object.keys(data.customFields).length) {
    emitError?.('Skipped invalid custom fields');
  }
  return customFields;
}

export function sanitiseCustomFields(data: object): CustomFields {
  const newCustomFields: CustomFields = {};

  for (const [_key, field] of Object.entries(data)) {
    if (!isValidField(field)) {
      continue;
    }

    // make a new key to avoid mismatches
    const key = field.label.toLowerCase();
    if (key in newCustomFields) {
      continue;
    }

    newCustomFields[key] = {
      type: 'string',
      colour: field.colour,
      label: field.label,
    };
  }

  function isValidField(data: unknown): data is CustomField {
    return (
      typeof data === 'object' &&
      data !== null &&
      'label' in data &&
      data.label !== '' &&
      'colour' in data &&
      typeof data.colour === 'string'
    );
  }

  return newCustomFields;
}
