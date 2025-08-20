import { useCallback } from 'react';
import {
  EntryId,
  isOntimeDelay,
  isOntimeEvent,
  isOntimeMilestone,
  MaybeString,
  OntimeEntry,
  OntimeEvent,
  Playback,
  SupportedEntry,
} from 'ontime-types';

import { useEntryActions } from '../../common/hooks/useEntryAction';
import useMemoisedFn from '../../common/hooks/useMemoisedFn';
import { useEmitLog } from '../../common/stores/logger';
import { cloneEvent } from '../../common/utils/clone';

import RundownDelay from './rundown-delay/RundownDelay';
import RundownEvent from './rundown-event/RundownEvent';
import RundownMilestone from './rundown-milestone/RundownMilestone';
import { useEventSelection } from './useEventSelection';

export type EventItemActions =
  | 'event'
  | 'event-before'
  | 'delay'
  | 'delay-before'
  | 'group'
  | 'group-before'
  | 'swap'
  | 'delete'
  | 'clone'
  | 'make-group'
  | 'update';

interface RundownEntryProps {
  type: SupportedEntry;
  isPast: boolean;
  data: OntimeEntry;
  loaded: boolean;
  eventIndex: number;
  hasCursor: boolean;
  isNext: boolean;
  isNextDay: boolean;
  previousEntryId: MaybeString;
  previousEventId?: string;
  playback?: Playback; // we only care about this if this event is playing
  isRolling: boolean; // we need to know even if not related to this event
  totalGap: number;
  isLinkedToLoaded: boolean;
}

export default function RundownEntry({
  isPast,
  data,
  loaded,
  hasCursor,
  isNext,
  previousEntryId,
  previousEventId,
  playback,
  isRolling,
  eventIndex,
  isNextDay,
  totalGap,
  isLinkedToLoaded,
}: RundownEntryProps) {
  const { emitError } = useEmitLog();
  const { addEntry, updateEntry, batchUpdateEvents, deleteEntry, groupEntries, swapEvents } = useEntryActions();
  const { selectedEvents, unselect, clearSelectedEvents } = useEventSelection();

  const removeOpenEvent = useCallback(() => {
    unselect(data.id);
  }, [unselect, data.id]);

  const clearMultiSelection = useCallback(() => {
    clearSelectedEvents();
  }, [clearSelectedEvents]);

  // Create / delete new events
  type FieldValue = {
    field: keyof Omit<OntimeEvent, 'duration'> | 'durationOverride';
    value: unknown;
  };

  const actionHandler = useMemoisedFn((action: EventItemActions, payload?: number | FieldValue) => {
    switch (action) {
      case 'event': {
        const newEvent = { type: SupportedEntry.Event };
        const options = {
          after: data.id,
          lastEventId: previousEventId,
        };
        return addEntry(newEvent, options);
      }
      case 'event-before': {
        const newEvent = { type: SupportedEntry.Event };
        const options = {
          after: previousEntryId,
        };
        return addEntry(newEvent, options);
      }
      case 'delay': {
        return addEntry({ type: SupportedEntry.Delay }, { after: data.id });
      }
      case 'delay-before': {
        return addEntry({ type: SupportedEntry.Delay }, { after: previousEntryId });
      }
      case 'group': {
        return addEntry({ type: SupportedEntry.Group }, { after: data.id });
      }
      case 'group-before': {
        return addEntry({ type: SupportedEntry.Group }, { after: previousEntryId });
      }
      case 'swap': {
        const { value } = payload as FieldValue;
        return swapEvents(value as EntryId, data.id);
      }
      case 'delete': {
        if (selectedEvents.size > 1) {
          clearMultiSelection();
          return deleteEntry(Array.from(selectedEvents));
        }
        removeOpenEvent();
        return deleteEntry([data.id]);
      }
      case 'clone': {
        const newEvent = cloneEvent(data as OntimeEvent);
        addEntry(newEvent, { after: data.id });
        break;
      }
      case 'make-group': {
        if (selectedEvents.size > 1) {
          clearMultiSelection();
          return groupEntries(Array.from(selectedEvents));
        }
        break;
      }
      case 'update': {
        // Handles and filters update requests
        const { field, value } = payload as FieldValue;
        if (field === undefined || value === undefined) {
          return;
        }
        const newData: Partial<OntimeEvent> = { id: data.id };

        // if selected events are more than one
        // we need to bulk edit
        if (selectedEvents.size > 1) {
          const changes: Partial<OntimeEvent> = { [field]: value };
          batchUpdateEvents(changes, Array.from(selectedEvents));
          return;
        }
        if (field in data) {
          // @ts-expect-error -- not sure how to type this
          newData[field] = value;
          return updateEntry(newData);
        }

        return emitError(`Unknown field: ${field}`);
      }
      default: {
        action satisfies never;
        throw new Error(`Unhandled event ${action}`);
      }
    }
  });

  if (isOntimeEvent(data)) {
    return (
      <RundownEvent
        eventId={data.id}
        eventIndex={eventIndex}
        cue={data.cue}
        timeStart={data.timeStart}
        timeEnd={data.timeEnd}
        duration={data.duration}
        timeStrategy={data.timeStrategy}
        linkStart={data.linkStart}
        flag={data.flag}
        countToEnd={data.countToEnd}
        endAction={data.endAction}
        timerType={data.timerType}
        title={data.title}
        note={data.note}
        delay={data.delay}
        colour={data.colour}
        isPast={isPast}
        isNext={isNext}
        skip={data.skip}
        parent={data.parent}
        loaded={loaded}
        hasCursor={hasCursor}
        playback={playback}
        isRolling={isRolling}
        gap={data.gap}
        isNextDay={isNextDay}
        dayOffset={data.dayOffset}
        totalGap={totalGap}
        isLinkedToLoaded={isLinkedToLoaded}
        actionHandler={actionHandler}
        hasTriggers={data.triggers.length > 0}
      />
    );
  } else if (isOntimeDelay(data)) {
    return <RundownDelay data={data} hasCursor={hasCursor} />;
  } else if (isOntimeMilestone(data)) {
    return (
      <RundownMilestone
        colour={data.colour}
        cue={data.cue}
        entryId={data.id}
        hasCursor={hasCursor}
        title={data.title}
      />
    );
  }
  return null;
}
