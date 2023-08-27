import { OntimeEvent, SupportedEvent } from 'ontime-types';

/**
 * @description Creates a safe duplicate of an event
 * @param {OntimeEvent} event
 * @param {string} [after]
 * @return {OntimeEvent} clean event
 */
type ClonedEvent = Omit<
  OntimeEvent,
  'id' | 'user0' | 'user1' | 'user2' | 'user3' | 'user4' | 'user5' | 'user6' | 'user7' | 'user8' | 'user9'
>;
export const cloneEvent = (event: OntimeEvent, after?: string): ClonedEvent => {
  return {
    type: SupportedEvent.Event,
    title: event.title,
    cue: event.cue,
    subtitle: event.subtitle,
    presenter: event.presenter,
    note: event.note,
    timeStart: event.timeStart,
    duration: event.duration,
    timeEnd: event.timeEnd,
    timerType: event.timerType,
    endAction: event.endAction,
    isPublic: event.isPublic,
    skip: event.skip,
    colour: event.colour,
    after: after,
    revision: 0,
  };
};
