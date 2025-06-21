import { useCallback } from 'react';
import {
  isOntimeDelay,
  isOntimeEvent,
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

import DelayBlock from './delay-block/DelayBlock';
import EventBlock from './event-block/EventBlock';
import { useEventSelection } from './useEventSelection';

export type EventItemActions =
  | 'event'
  | 'event-before'
  | 'delay'
  | 'delay-before'
  | 'block'
  | 'block-before'
  | 'swap'
  | 'delete'
  | 'clone'
  | 'group'
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

export default function RundownEntry(props: RundownEntryProps) {
  const {
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
  } = props;
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
      case 'block': {
        return addEntry({ type: SupportedEntry.Block }, { after: data.id });
      }
      case 'block-before': {
        return addEntry({ type: SupportedEntry.Block }, { after: previousEntryId });
      }
      case 'swap': {
        const { value } = payload as FieldValue;
        return swapEvents({ from: value as string, to: data.id });
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
      case 'group': {
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
      <EventBlock
        eventId={data.id}
        eventIndex={eventIndex}
        cue={data.cue}
        timeStart={data.timeStart}
        timeEnd={data.timeEnd}
        duration={data.duration}
        timeStrategy={data.timeStrategy}
        linkStart={data.linkStart}
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
    return <DelayBlock data={data} hasCursor={hasCursor} />;
  }
  return null;
}
