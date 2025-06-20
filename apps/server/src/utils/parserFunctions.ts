import {
  CustomField,
  CustomFields,
  DatabaseModel,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  ProjectData,
  ProjectRundowns,
  Rundown,
  Settings,
  URLPreset,
  ViewSettings,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
} from 'ontime-types';
import { customFieldLabelToKey, generateId, isAlphanumericWithSpace, isObjectEmpty } from 'ontime-utils';

import { dbModel, defaultRundown } from '../models/dataModel.js';
import { block as blockDef, delay as delayDef } from '../models/eventsDefinition.js';

import { createEvent, type ErrorEmitter } from './parser.js';

/**
 * Parse a rundowns object along with the project custom fields
 * Returns a default rundown if none exists
 */
export function parseRundowns(
  data: Partial<DatabaseModel>,
  emitError?: ErrorEmitter,
): { customFields: CustomFields; rundowns: ProjectRundowns } {
  // check custom fields first
  const parsedCustomFields = parseCustomFields(data, emitError);

  // ensure there is always a rundown to import
  // this is important since the rest of the app assumes this exist
  if (!data.rundowns || isObjectEmpty(data.rundowns)) {
    emitError?.('No data found to import');
    return {
      customFields: parsedCustomFields,
      rundowns: {
        default: {
          ...defaultRundown,
        },
      },
    };
  }

  const parsedRundowns: ProjectRundowns = {};
  const iterableRundownsIds = Object.keys(data.rundowns);

  // parse all the rundowns individually
  for (const id of iterableRundownsIds) {
    console.log('Found rundown, importing...');
    const rundown = data.rundowns[id];
    const parsedRundown = parseRundown(rundown, parsedCustomFields, emitError);
    parsedRundowns[parsedRundown.id] = parsedRundown;
  }

  return { customFields: parsedCustomFields, rundowns: parsedRundowns };
}

/**
 * Parses and validates a single project rundown along with given project custom fields
 */
export function parseRundown(
  rundown: Rundown,
  parsedCustomFields: Readonly<CustomFields>,
  emitError?: ErrorEmitter,
): Rundown {
  const parsedRundown: Rundown = {
    id: rundown.id || generateId(),
    title: rundown.title ?? '',
    entries: {},
    order: [],
    revision: rundown.revision ?? 1,
  };

  let eventIndex = 0;

  for (let i = 0; i < rundown.order.length; i++) {
    const entryId = rundown.order[i];
    const event = rundown.entries[entryId];

    if (event === undefined) {
      emitError?.('Could not find referenced event, skipping');
      continue;
    }

    if (parsedRundown.order.includes(event.id)) {
      emitError?.('ID collision on event import, skipping');
      continue;
    }

    const id = entryId;
    let newEvent: OntimeEvent | OntimeDelay | OntimeBlock | null;

    if (isOntimeEvent(event)) {
      newEvent = createEvent(event, eventIndex);
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
      for (let i = 0; i < event.events.length; i++) {
        const nestedEventId = event.events[i];
        const nestedEvent = rundown.entries[nestedEventId];

        if (isOntimeEvent(nestedEvent)) {
          const newNestedEvent = createEvent(nestedEvent, eventIndex);
          // skip if event is invalid
          if (newNestedEvent == null) {
            emitError?.('Skipping event without payload');
            continue;
          }

          // for every field in custom, check that a key exists in customfields
          for (const field in newNestedEvent.custom) {
            if (!Object.hasOwn(parsedCustomFields, field)) {
              emitError?.(`Custom field ${field} not found`);
              delete newNestedEvent.custom[field];
            }
          }

          eventIndex += 1;

          if (newNestedEvent) {
            parsedRundown.entries[nestedEventId] = newNestedEvent;
          }
        }
      }

      newEvent = {
        ...blockDef,
        title: event.title,
        note: event.note,
        events: event.events?.filter((eventId) => Object.hasOwn(rundown.entries, eventId)) ?? [],
        skip: event.skip,
        colour: event.colour,
        custom: { ...event.custom },
        id,
      };
    } else {
      emitError?.('Unknown event type, skipping');
      continue;
    }

    if (newEvent) {
      parsedRundown.entries[id] = newEvent;
      parsedRundown.order.push(id);
    }
  }

  console.log(`Imported rundown ${parsedRundown.title} with ${parsedRundown.order.length} entries`);
  return parsedRundown;
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
    projectLogo: data.project.projectLogo ?? dbModel.project.projectLogo,
    custom: data.project.custom ?? dbModel.project.custom,
  };
}

/**
 * Parse settings portion of an entry
 */
export function parseSettings(data: Partial<DatabaseModel>): Settings {
  // skip if file definition is missing
  // TODO: skip parsing if the version is not correct
  if (!data.settings || data.settings?.version == null) {
    throw new Error('ERROR: unable to parse settings, missing or incorrect version');
  }

  console.log('Found settings, importing...');

  return {
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

  for (const [originalKey, field] of Object.entries(data)) {
    if (!isValidField(field)) {
      continue;
    }

    if (!isAlphanumericWithSpace(field.label)) {
      continue;
    }

    // Test label and key cohesion
    const key = (() => {
      const keyFromLabel = customFieldLabelToKey(field.label);
      if (keyFromLabel === null) {
        return originalKey;
      }
      return originalKey.toLowerCase() === keyFromLabel.toLowerCase() ? originalKey : keyFromLabel;
    })();

    if (key in newCustomFields) {
      continue;
    }

    newCustomFields[key] = {
      type: field.type,
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
      typeof data.colour === 'string' &&
      'type' in data &&
      (data.type === 'string' || data.type === 'image')
    );
  }

  return newCustomFields;
}
