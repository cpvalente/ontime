import { OntimeEvent, SupportedEvent } from 'ontime-types';

/**
 * @description Creates a safe duplicate of an event
 * @param {OntimeEvent} event
 * @param {string} [after]
 * @return {OntimeEvent} clean event
 */
type ClonedEvent = Omit<OntimeEvent, 'id' | 'cue' | 'delay'>; // we dont want to clone derived or unique properties
export const cloneEvent = (event: OntimeEvent): ClonedEvent => {
  return {
    type: SupportedEvent.Event,
    title: event.title,
    note: event.note,
    timeStart: event.timeStart,
    duration: event.duration,
    timeEnd: event.timeEnd,
    timerType: event.timerType,
    timeStrategy: event.timeStrategy,
    countToEnd: event.countToEnd,
    linkStart: event.linkStart,
    endAction: event.endAction,
    isPublic: event.isPublic,
    skip: event.skip,
    colour: event.colour,
    revision: 0,
    timeWarning: event.timeWarning,
    timeDanger: event.timeDanger,
    custom: {},
  };
};
