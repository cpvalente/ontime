import {
  SupportedEntry,
  OntimeEvent,
  OntimeDelay,
  OntimeGroup,
  Rundown,
  CustomField,
  OntimeMilestone,
} from 'ontime-types';

import { defaultRundown } from '../../../models/dataModel.js';

const baseEvent = {
  type: SupportedEntry.Event,
  skip: false,
  revision: 1,
};

const baseGroup = {
  type: SupportedEntry.Group,
  entries: [],
};

const baseMilestone = {
  type: SupportedEntry.Milestone,
  cue: '',
  title: '',
};

/**
 * Utility to create an Ontime event
 */
export function makeOntimeEvent(patch: Partial<OntimeEvent>): OntimeEvent {
  return {
    ...baseEvent,
    ...patch,
  } as OntimeEvent;
}

/**
 * Utility to create a delay entry
 */
export function makeOntimeDelay(patch: Partial<OntimeDelay>): OntimeDelay {
  return { id: 'delay', type: SupportedEntry.Delay, duration: 0, ...patch } as OntimeDelay;
}

/**
 * Utility to create a group entry
 */
export function makeOntimeGroup(patch: Partial<OntimeGroup>): OntimeGroup {
  return { id: 'group', ...baseGroup, ...patch } as OntimeGroup;
}

/**
 * Utility to create a milestone entry
 */
export function makeOntimeMilestone(patch: Partial<OntimeMilestone>): OntimeMilestone {
  return { id: 'milestone', ...baseMilestone, ...patch } as OntimeMilestone;
}

/**
 * Utility to create a rundown object
 */
export function makeRundown(patch: Partial<Rundown>): Rundown {
  return {
    ...defaultRundown,
    ...patch,
  };
}

export function makeCustomField(patch: Partial<CustomField>): CustomField {
  return {
    type: 'text',
    colour: '#000000',
    label: 'Custom Field',
    ...patch,
  };
}

/**
 * Utility to generate a rundown of OntimeEvents form partial objects
 */
export function prepareTimedEvents(events: Partial<OntimeEvent>[]): OntimeEvent[] {
  return events.map(makeOntimeEvent);
}
