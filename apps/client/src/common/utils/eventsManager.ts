import {
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  OntimeRundownEntry,
  SupportedEvent,
} from 'ontime-types';

type ClonedEvent = Omit<OntimeEvent, 'id' | 'cue'>;
type ClonedBlock = Omit<OntimeBlock, 'id'>;
type ClonedDelay = Omit<OntimeDelay, 'id'>;

/**
 * @description Creates a safe duplicate of an event
 * @param {OntimeEvent} event
 * @param {string} [after]
 * @return {OntimeEvent} clean event
 */
export const cloneEvent = (event: OntimeEvent, after?: string): ClonedEvent => {
  return {
    type: SupportedEvent.Event,
    title: event.title,
    note: event.note,
    timeStart: event.timeStart,
    duration: event.duration,
    timeEnd: event.timeEnd,
    timerType: event.timerType,
    timeStrategy: event.timeStrategy,
    linkStart: event.linkStart,
    endAction: event.endAction,
    isPublic: event.isPublic,
    skip: event.skip,
    colour: event.colour,
    after,
    revision: 0,
    timeWarning: event.timeWarning,
    timeDanger: event.timeDanger,
    custom: {},
  };
};

export const cloneEntry = (entry: OntimeRundownEntry, after?: string): ClonedEvent | ClonedBlock | ClonedDelay => {
  if (isOntimeEvent(entry)) {
    return {
      type: SupportedEvent.Event,
      title: entry.title,
      note: entry.note,
      timeStart: entry.timeStart,
      duration: entry.duration,
      timeEnd: entry.timeEnd,
      timerType: entry.timerType,
      timeStrategy: entry.timeStrategy,
      linkStart: entry.linkStart,
      endAction: entry.endAction,
      isPublic: entry.isPublic,
      skip: entry.skip,
      colour: entry.colour,
      after,
      revision: 0,
      timeWarning: entry.timeWarning,
      timeDanger: entry.timeDanger,
      custom: {},
    };
  } else if (isOntimeBlock(entry)) {
    return { type: SupportedEvent.Block, title: entry.title, after };
  } else if (isOntimeDelay(entry)) {
    return { type: SupportedEvent.Delay, duration: entry.duration, after };
  }
  throw new Error('Invalid entry type');
};
