import {
  DatabaseModel,
  CustomFields,
  ProjectRundowns,
  Rundown,
  OntimeEvent,
  OntimeDelay,
  OntimeBlock,
  isOntimeEvent,
  isOntimeDelay,
  isOntimeBlock,
} from 'ontime-types';
import { isObjectEmpty, generateId } from 'ontime-utils';

import { defaultRundown } from '../../models/dataModel.js';
import { delay as delayDef, block as blockDef } from '../../models/eventsDefinition.js';
import { ErrorEmitter } from '../../utils/parser.js';
import { parseCustomFields } from '../../utils/parserFunctions.js';

import { createEvent } from './rundown.utils.js';

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
    flatOrder: [],
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
    const nestedEntryIds: string[] = [];

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
            nestedEntryIds.push(nestedEventId);
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
      parsedRundown.flatOrder.push(id);
      parsedRundown.flatOrder.push(...nestedEntryIds);
    }
  }

  console.log(`Imported rundown ${parsedRundown.title} with ${parsedRundown.order.length} entries`);
  return parsedRundown;
}
