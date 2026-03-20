import { EndAction, OntimeEvent, TimerType } from 'ontime-types';

import { isIndeterminate, MergedEvent } from './multiEditUtils';

export interface ResolvedValues {
  title: string;
  titlePlaceholder: string | undefined;
  note: string;
  notePlaceholder: string | undefined;
  colour: string;
  colourIndeterminate: boolean;
  flag: boolean;
  linkStart: boolean;
  duration: number | undefined;
  endAction: EndAction;
  countToEnd: boolean;
  timerType: TimerType;
  timeWarning: number;
  timeDanger: number;
}

/**
 * Resolve display values for an event, applying indeterminate fallbacks when multi-editing.
 * Without a merged object, returns the event's own values unchanged.
 */
export function resolveMergedValues(event: OntimeEvent, merged?: MergedEvent): ResolvedValues {
  if (!merged) {
    return {
      title: event.title,
      titlePlaceholder: undefined,
      note: event.note,
      notePlaceholder: undefined,
      colour: event.colour,
      colourIndeterminate: false,
      flag: event.flag,
      linkStart: event.linkStart,
      duration: event.duration,
      endAction: event.endAction,
      countToEnd: event.countToEnd,
      timerType: event.timerType,
      timeWarning: event.timeWarning,
      timeDanger: event.timeDanger,
    };
  }

  return {
    title: isIndeterminate(merged.title) ? '' : event.title,
    titlePlaceholder: isIndeterminate(merged.title) ? 'multiple' : undefined,
    note: isIndeterminate(merged.note) ? '' : event.note,
    notePlaceholder: isIndeterminate(merged.note) ? 'multiple' : undefined,
    colour: isIndeterminate(merged.colour) ? '' : event.colour,
    colourIndeterminate: isIndeterminate(merged.colour),
    flag: isIndeterminate(merged.flag) ? merged.flagTally.majority : (merged.flag as boolean),
    linkStart: isIndeterminate(merged.linkStart) ? false : (merged.linkStart as boolean),
    duration: isIndeterminate(merged.duration) ? undefined : (merged.duration as number),
    endAction: isIndeterminate(merged.endAction) ? event.endAction : (merged.endAction as EndAction),
    countToEnd: isIndeterminate(merged.countToEnd) ? merged.countToEndTally.majority : (merged.countToEnd as boolean),
    timerType: isIndeterminate(merged.timerType) ? event.timerType : (merged.timerType as TimerType),
    timeWarning: isIndeterminate(merged.timeWarning) ? 0 : (merged.timeWarning as number),
    timeDanger: isIndeterminate(merged.timeDanger) ? 0 : (merged.timeDanger as number),
  };
}
