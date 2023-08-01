import { OntimeEvent, SupportedEvent } from 'ontime-types';

/**
 * @description Creates a safe duplicate of an event
 * @param {object} event
 * @return {object} clean event
 */
type ClonedEvent = OntimeEvent | { after?: string };
export const cloneEvent = (event: OntimeEvent, after?: string): ClonedEvent => {
  return {
    type: SupportedEvent.Event,
    title: event.title,
    // CUE!!!!
    subtitle: event.subtitle,
    presenter: event.presenter,
    note: event.note,
    timeStart: event.timeStart,
    timeEnd: event.timeEnd,
    isPublic: event.isPublic,
    skip: event.skip,
    colour: event.colour,
    after: after,
  };
};
